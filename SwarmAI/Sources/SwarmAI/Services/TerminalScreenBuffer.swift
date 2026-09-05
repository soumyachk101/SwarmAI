import Foundation
import SwiftUI

// MARK: - Terminal Screen Buffer

/// High-fidelity terminal screen buffer that accurately emulates terminal cursor movement,
/// carriage returns (\r), line erasures (\x1b[2K), cursor-up redraws (\x1b[1A), DEC line-drawing
/// characters, and prevents screen duplicate line corruption.
public final class TerminalScreenBuffer: @unchecked Sendable {
    private let lock = NSLock()
    private var lines: [String] = []
    private var currentCursorLine: Int = 0
    private var isAlternateCharset: Bool = false
    public let maxLines: Int

    public init(maxLines: Int = 1000) {
        self.maxLines = maxLines
    }

    /// Reset the screen buffer.
    public func clear() {
        lock.lock()
        defer { lock.unlock() }
        lines.removeAll(keepingCapacity: true)
        currentCursorLine = 0
        isAlternateCharset = false
    }

    /// Snapshot of current rendered screen lines.
    public var renderedLines: [String] {
        lock.lock()
        defer { lock.unlock() }
        return lines
    }

    /// Ingest a raw chunk from PTY output and update screen lines in-place.
    public func ingestChunk(_ chunk: String) {
        guard !chunk.isEmpty else { return }
        lock.lock()
        defer { lock.unlock() }

        // 1. Sanitize known mojibake & DEC graphics line artifacts
        let sanitized = sanitizeStreamArtifacts(chunk)

        // 2. Stream character-by-character / escape-by-escape
        var i = sanitized.startIndex
        while i < sanitized.endIndex {
            let ch = sanitized[i]

            // Carriage return: reset write position to column 0 on current line
            if ch == "\r" {
                let nextIdx = sanitized.index(after: i)
                if nextIdx < sanitized.endIndex && sanitized[nextIdx] == "\n" {
                    // \r\n -> advance line
                    advanceLine()
                    i = sanitized.index(after: nextIdx)
                    continue
                } else {
                    // Solo \r -> carriage return in-place on current line
                    // The next text written will overwrite the current line
                    if currentCursorLine < lines.count {
                        // Mark that next write replaces current line
                        lines[currentCursorLine] = ""
                    }
                    i = sanitized.index(after: i)
                    continue
                }
            }

            // Newline: advance to next line
            if ch == "\n" {
                advanceLine()
                i = sanitized.index(after: i)
                continue
            }

            // ANSI Escape Sequence: ESC \u{1B}
            if ch == "\u{1B}" {
                let (consumedLength, action) = parseEscapeSequence(from: sanitized, startIndex: i)
                if let action = action {
                    handleEscapeAction(action)
                }
                i = sanitized.index(i, offsetBy: consumedLength, limitedBy: sanitized.endIndex) ?? sanitized.endIndex
                continue
            }

            // Regular character
            var charToWrite = ch
            if isAlternateCharset {
                charToWrite = translateDECGraphicsChar(ch)
            }

            ensureCurrentLineExists()
            lines[currentCursorLine].append(charToWrite)
            i = sanitized.index(after: i)
        }

        // Enforce max scrollback lines
        if lines.count > maxLines {
            let excess = lines.count - maxLines
            lines.removeFirst(excess)
            currentCursorLine = max(0, currentCursorLine - excess)
        }
    }

    // MARK: - Escape Actions

    private enum EscapeAction {
        case cursorUp(Int)
        case cursorDown(Int)
        case cursorForward(Int)
        case cursorBack(Int)
        case cursorToCol(Int)
        case eraseLine(Int) // 0: cursor to end, 1: start to cursor, 2: entire line
        case eraseScreen(Int)
        case enableAlternateCharset
        case disableAlternateCharset
        case styledSGR(String)
    }

    private func parseEscapeSequence(from text: String, startIndex: String.Index) -> (Int, EscapeAction?) {
        let remainder = text[startIndex...]
        guard remainder.count >= 2 else { return (remainder.count, nil) }

        let secondCharIndex = text.index(after: startIndex)
        let secondChar = text[secondCharIndex]

        // VT100 Charset selection: ESC ( 0 or ESC ( B
        if secondChar == "(" || secondChar == ")" {
            let thirdIdx = text.index(after: secondCharIndex)
            if thirdIdx < text.endIndex {
                let charsetChar = text[thirdIdx]
                if charsetChar == "0" {
                    return (3, .enableAlternateCharset)
                } else if charsetChar == "B" {
                    return (3, .disableAlternateCharset)
                }
                return (3, nil)
            }
            return (2, nil)
        }

        // CSI Sequence: ESC [
        if secondChar == "[" {
            var curr = text.index(after: secondCharIndex)
            var seqParams = ""

            while curr < text.endIndex {
                let c = text[curr]
                if c.isLetter || c == "@" || c == "~" {
                    // Final terminator character
                    let fullSeqLen = text.distance(from: startIndex, to: curr) + 1
                    let action = decodeCSIAction(terminator: c, params: seqParams)
                    return (fullSeqLen, action)
                }
                seqParams.append(c)
                curr = text.index(after: curr)
            }
            // Incomplete sequence
            return (text.distance(from: startIndex, to: curr), nil)
        }

        // OSC Sequence: ESC ]
        if secondChar == "]" {
            var curr = text.index(after: secondCharIndex)
            while curr < text.endIndex {
                let c = text[curr]
                if c == "\u{07}" || c == "\u{1B}" {
                    let fullSeqLen = text.distance(from: startIndex, to: curr) + 1
                    return (fullSeqLen, nil)
                }
                curr = text.index(after: curr)
            }
            return (text.distance(from: startIndex, to: curr), nil)
        }

        return (2, nil)
    }

    private func decodeCSIAction(terminator: Character, params: String) -> EscapeAction? {
        let cleanParams = params.trimmingCharacters(in: .whitespaces)
        let intVal = Int(cleanParams) ?? 1

        switch terminator {
        case "m":
            // SGR Styling - keep it in line so ANSIParser can style it!
            return .styledSGR("\u{1B}[\(params)m")
        case "A":
            return .cursorUp(max(1, intVal))
        case "B":
            return .cursorDown(max(1, intVal))
        case "C":
            return .cursorForward(max(1, intVal))
        case "D":
            return .cursorBack(max(1, intVal))
        case "G":
            return .cursorToCol(max(1, intVal))
        case "K":
            return .eraseLine(Int(cleanParams) ?? 0)
        case "J":
            return .eraseScreen(Int(cleanParams) ?? 0)
        default:
            return nil
        }
    }

    private func handleEscapeAction(_ action: EscapeAction) {
        switch action {
        case .cursorUp(let count):
            currentCursorLine = max(0, currentCursorLine - count)
        case .cursorDown(let count):
            currentCursorLine = min(lines.count - 1, currentCursorLine + count)
        case .eraseLine(let mode):
            ensureCurrentLineExists()
            if mode == 2 {
                // Clear entire line
                lines[currentCursorLine] = ""
            } else if mode == 0 {
                // Clear from cursor to end - in our buffer, just clear line
                lines[currentCursorLine] = ""
            }
        case .eraseScreen(let mode):
            if mode == 0 {
                // 0: Erase from current cursor line to end of screen (Used by Ink on every rerender)
                ensureCurrentLineExists()
                lines[currentCursorLine] = ""
                if currentCursorLine + 1 < lines.count {
                    lines.removeSubrange((currentCursorLine + 1)..<lines.count)
                }
            } else if mode == 1 {
                // 1: Erase from beginning of screen to cursor
                if currentCursorLine < lines.count {
                    for idx in 0...currentCursorLine {
                        lines[idx] = ""
                    }
                }
            } else if mode == 2 || mode == 3 {
                // 2 or 3: Erase entire screen
                lines.removeAll(keepingCapacity: true)
                currentCursorLine = 0
            }
        case .enableAlternateCharset:
            isAlternateCharset = true
        case .disableAlternateCharset:
            isAlternateCharset = false
        case .styledSGR(let seq):
            ensureCurrentLineExists()
            lines[currentCursorLine].append(seq)
        default:
            break
        }
    }

    private func advanceLine() {
        if currentCursorLine < lines.count - 1 {
            currentCursorLine += 1
        } else {
            lines.append("")
            currentCursorLine = lines.count - 1
        }
    }

    private func ensureCurrentLineExists() {
        if lines.isEmpty {
            lines.append("")
            currentCursorLine = 0
        } else if currentCursorLine >= lines.count {
            lines.append("")
            currentCursorLine = lines.count - 1
        }
    }

    // MARK: - Dec Graphics & Mojibake Sanitizer

    private func translateDECGraphicsChar(_ ch: Character) -> Character {
        switch ch {
        case "q": return "─"
        case "x": return "│"
        case "l": return "┌"
        case "k": return "┐"
        case "m": return "└"
        case "j": return "┘"
        case "t": return "├"
        case "u": return "┤"
        case "v": return "┴"
        case "w": return "┬"
        case "n": return "┼"
        case "a": return "─"
        case "`": return "◆"
        case "~": return "·"
        default: return ch
        }
    }

    /// Clean common terminal stream artifacts like ISO-8859-1 mojibake from UTF-8 box characters
    private func sanitizeStreamArtifacts(_ text: String) -> String {
        var result = text

        // 1. Box drawing horizontal line artifacts
        // UTF-8 0xE2 0x94 0x80 (─) mis-decoded as 0xE3 (ã) or â”€
        if result.contains("ã") {
            result = result.replacingOccurrences(of: "ããã", with: "───")
            result = result.replacingOccurrences(of: "ãã", with: "──")
            result = result.replacingOccurrences(of: "ã", with: "─")
        }
        if result.contains("â”") {
            result = result.replacingOccurrences(of: "â”€", with: "─")
            result = result.replacingOccurrences(of: "â”‚", with: "│")
            result = result.replacingOccurrences(of: "â”Œ", with: "┌")
            result = result.replacingOccurrences(of: "â”", with: "┐")
            result = result.replacingOccurrences(of: "â””", with: "└")
            result = result.replacingOccurrences(of: "â”˜", with: "┘")
            result = result.replacingOccurrences(of: "â”œ", with: "├")
            result = result.replacingOccurrences(of: "â”¤", with: "┤")
            result = result.replacingOccurrences(of: "â”¬", with: "┬")
            result = result.replacingOccurrences(of: "â”´", with: "┴")
            result = result.replacingOccurrences(of: "â”¼", with: "┼")
        }

        // 2. Chevrons & prompt symbols
        // Claude Code prompt: ❯❯ don't ask on (shift+tab to cycle) · ⏵ for agents
        // Mis-decoded as: ðµåµ, âµâµ, etc.
        if result.contains("ðµ") || result.contains("åµ") {
            result = result.replacingOccurrences(of: "ðµåµ", with: "❯❯")
            result = result.replacingOccurrences(of: "ðµ", with: "❯")
            result = result.replacingOccurrences(of: "åµ", with: "❯")
        }
        if result.contains("âµ") {
            result = result.replacingOccurrences(of: "âµâµ", with: "❯❯")
            result = result.replacingOccurrences(of: "âµ", with: "❯")
        }
        if result.contains("Â·") || result.contains("â·") {
            result = result.replacingOccurrences(of: "Â·", with: "·")
            result = result.replacingOccurrences(of: "â·", with: "·")
        }
        if result.contains("Â") {
            result = result.replacingOccurrences(of: "Â", with: "")
        }

        return result
    }
}
