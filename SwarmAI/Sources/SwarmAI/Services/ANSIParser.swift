import Foundation
import SwiftUI

// MARK: - ANSI Styled Span

/// Span of styled text parsed from an ANSI terminal stream.
public struct ANSISpan: Identifiable, Sendable, Hashable {
    public let id: UUID
    public let text: String
    public var foregroundColor: Color?
    public var backgroundColor: Color?
    public var isBold: Bool
    public var isDim: Bool
    public var isItalic: Bool
    public var isUnderline: Bool
    public var isStrikethrough: Bool
    public var isInverse: Bool
    
    public init(
        id: UUID = UUID(),
        text: String,
        foregroundColor: Color? = nil,
        backgroundColor: Color? = nil,
        isBold: Bool = false,
        isDim: Bool = false,
        isItalic: Bool = false,
        isUnderline: Bool = false,
        isStrikethrough: Bool = false,
        isInverse: Bool = false
    ) {
        self.id = id
        self.text = text
        self.foregroundColor = foregroundColor
        self.backgroundColor = backgroundColor
        self.isBold = isBold
        self.isDim = isDim
        self.isItalic = isItalic
        self.isUnderline = isUnderline
        self.isStrikethrough = isStrikethrough
        self.isInverse = isInverse
    }
}

// MARK: - ANSI Line

/// A single rendered line containing one or more styled ANSI spans.
public struct ANSILine: Identifiable, Sendable {
    public let id: UUID
    public let spans: [ANSISpan]
    
    public init(id: UUID = UUID(), spans: [ANSISpan]) {
        self.id = id
        self.spans = spans
    }
    
    public var plainText: String {
        spans.map(\.text).joined()
    }
}

// MARK: - ANSI Escape Code Parser

/// High-performance ANSI Escape Code Parser converting raw terminal output to styled AttributedString and spans.
public enum ANSIParser {
    
    // Standard terminal palette matching dark terminal theme
    public static let standardColors: [Color] = [
        Color(hex: "#1A1A24") ?? .black,    // 0 Black
        Color(hex: "#FF5370") ?? .red,      // 1 Red
        Color(hex: "#C3E88D") ?? .green,    // 2 Green
        Color(hex: "#FFCB6B") ?? .yellow,   // 3 Yellow
        Color(hex: "#82AAFF") ?? .blue,     // 4 Blue
        Color(hex: "#C792EA") ?? .purple,   // 5 Magenta
        Color(hex: "#89DDFF") ?? .cyan,     // 6 Cyan
        Color(hex: "#EEFFFF") ?? .white     // 7 White
    ]
    
    public static let brightColors: [Color] = [
        Color(hex: "#546E7A") ?? .gray,     // 8 Bright Black / Gray
        Color(hex: "#FF5370") ?? .red,      // 9 Bright Red
        Color(hex: "#C3E88D") ?? .green,    // 10 Bright Green
        Color(hex: "#FFE585") ?? .yellow,   // 11 Bright Yellow
        Color(hex: "#82AAFF") ?? .blue,     // 12 Bright Blue
        Color(hex: "#D0A0FF") ?? .purple,   // 13 Bright Magenta
        Color(hex: "#89DDFF") ?? .cyan,     // 14 Bright Cyan
        Color(hex: "#FFFFFF") ?? .white     // 15 Bright White
    ]
    
    /// Parse raw ANSI string into a styled SwiftUI AttributedString.
    public static func parseToAttributedString(_ text: String, defaultColor: Color = .swarmTextSecondary) -> AttributedString {
        let spans = parseToSpans(text)
        var result = AttributedString()
        
        for span in spans {
            guard !span.text.isEmpty else { continue }
            var attr = AttributedString(span.text)
            
            let fg = span.isInverse ? (span.backgroundColor ?? .black) : (span.foregroundColor ?? defaultColor)
            let bg = span.isInverse ? (span.foregroundColor ?? defaultColor) : span.backgroundColor
            
            attr.foregroundColor = fg
            if let bg = bg {
                attr.backgroundColor = bg
            }
            if span.isBold {
                attr.inlinePresentationIntent = [.stronglyEmphasized]
            }
            if span.isItalic {
                attr.inlinePresentationIntent = [.emphasized]
            }
            if span.isUnderline {
                attr.underlineStyle = .single
            }
            if span.isStrikethrough {
                attr.strikethroughStyle = .single
            }
            
            result.append(attr)
        }
        
        return result
    }
    
    /// Parse raw terminal text into multiple styled AttributedString lines.
    public static func parseLines(_ rawText: String, defaultColor: Color = .swarmTextSecondary) -> [AttributedString] {
        let cleaned = handleCarriageReturns(rawText)
        let rawLines = cleaned.components(separatedBy: "\n")
        return rawLines.map { parseToAttributedString($0, defaultColor: defaultColor) }
    }
    
    /// Parse raw ANSI string into a list of styled ANSISpan tokens.
    public static func parseToSpans(_ rawText: String) -> [ANSISpan] {
        let cleaned = handleCarriageReturns(rawText)
        var spans: [ANSISpan] = []
        
        var currentFg: Color? = nil
        var currentBg: Color? = nil
        var isBold = false
        var isDim = false
        var isItalic = false
        var isUnderline = false
        var isStrikethrough = false
        var isInverse = false
        
        let scalarView = cleaned.unicodeScalars
        var currentIndex = scalarView.startIndex
        var textBuffer = ""
        
        func flushBuffer() {
            guard !textBuffer.isEmpty else { return }
            spans.append(ANSISpan(
                text: textBuffer,
                foregroundColor: currentFg,
                backgroundColor: currentBg,
                isBold: isBold,
                isDim: isDim,
                isItalic: isItalic,
                isUnderline: isUnderline,
                isStrikethrough: isStrikethrough,
                isInverse: isInverse
            ))
            textBuffer = ""
        }
        
        while currentIndex < scalarView.endIndex {
            let scalar = scalarView[currentIndex]
            
            // Check for Escape character \u{1B}
            if scalar.value == 0x1B {
                let nextIndex = scalarView.index(after: currentIndex)
                if nextIndex < scalarView.endIndex {
                    let nextScalar = scalarView[nextIndex]
                    
                    // CSI Sequence: ESC [
                    if nextScalar == "[" {
                        flushBuffer()
                        var seqIndex = scalarView.index(after: nextIndex)
                        var seqStr = ""
                        
                        while seqIndex < scalarView.endIndex {
                            let s = scalarView[seqIndex]
                            if (s.value >= 0x40 && s.value <= 0x7E) {
                                seqStr.append(Character(s))
                                seqIndex = scalarView.index(after: seqIndex)
                                break
                            }
                            seqStr.append(Character(s))
                            seqIndex = scalarView.index(after: seqIndex)
                        }
                        
                        currentIndex = seqIndex
                        
                        // Handle SGR 'm' codes
                        if seqStr.hasSuffix("m") {
                            let paramsStr = String(seqStr.dropLast())
                            let codes = paramsStr.isEmpty ? [0] : paramsStr.components(separatedBy: ";").compactMap { Int($0) }
                            applySGRCodes(codes,
                                          fg: &currentFg,
                                          bg: &currentBg,
                                          bold: &isBold,
                                          dim: &isDim,
                                          italic: &isItalic,
                                          underline: &isUnderline,
                                          strikethrough: &isStrikethrough,
                                          inverse: &isInverse)
                        }
                        continue
                    }
                    
                    // OSC Sequence: ESC ]
                    if nextScalar == "]" {
                        flushBuffer()
                        var seqIndex = scalarView.index(after: nextIndex)
                        while seqIndex < scalarView.endIndex {
                            let s = scalarView[seqIndex]
                            if s.value == 0x07 || s.value == 0x1B {
                                if s.value == 0x1B {
                                    let afterEsc = scalarView.index(after: seqIndex)
                                    if afterEsc < scalarView.endIndex && scalarView[afterEsc] == "\\" {
                                        seqIndex = scalarView.index(after: afterEsc)
                                        break
                                    }
                                }
                                seqIndex = scalarView.index(after: seqIndex)
                                break
                            }
                            seqIndex = scalarView.index(after: seqIndex)
                        }
                        currentIndex = seqIndex
                        continue
                    }
                }
            }
            
            textBuffer.append(Character(scalar))
            currentIndex = scalarView.index(after: currentIndex)
        }
        
        flushBuffer()
        return spans
    }
    
    /// Strip all ANSI escape sequences from text.
    public static func stripANSI(_ text: String) -> String {
        guard text.contains("\u{1B}") else { return text }
        let regexPattern = "\\x1B(?:[@-Z\\\\-_]|\\[[0-?]*[ -/]*[@-~])"
        return text.replacingOccurrences(of: regexPattern, with: "", options: .regularExpression)
    }
    
    /// Handle inline carriage returns for progress bars / spinners.
    public static func handleCarriageReturns(_ text: String) -> String {
        guard text.contains("\r") else { return text }
        let lines = text.components(separatedBy: "\n")
        var processedLines: [String] = []
        
        for line in lines {
            if line.contains("\r") {
                let segments = line.components(separatedBy: "\r")
                var current = ""
                for seg in segments {
                    if seg.isEmpty { continue }
                    if seg.count >= current.count {
                        current = seg
                    } else {
                        current = seg + String(current.dropFirst(seg.count))
                    }
                }
                processedLines.append(current)
            } else {
                processedLines.append(line)
            }
        }
        
        return processedLines.joined(separatedBy: "\n")
    }
    
    // MARK: - Private SGR Handler
    
    private static func applySGRCodes(
        _ codes: [Int],
        fg: inout Color?,
        bg: inout Color?,
        bold: inout Bool,
        dim: inout Bool,
        italic: inout Bool,
        underline: inout Bool,
        strikethrough: inout Bool,
        inverse: inout Bool
    ) {
        var idx = 0
        while idx < codes.count {
            let code = codes[idx]
            switch code {
            case 0:
                fg = nil
                bg = nil
                bold = false
                dim = false
                italic = false
                underline = false
                strikethrough = false
                inverse = false
            case 1:
                bold = true
            case 2:
                dim = true
            case 3:
                italic = true
            case 4:
                underline = true
            case 7:
                inverse = true
            case 9:
                strikethrough = true
            case 22:
                bold = false
                dim = false
            case 23:
                italic = false
            case 24:
                underline = false
            case 27:
                inverse = false
            case 29:
                strikethrough = false
            case 30...37:
                fg = standardColors[code - 30]
            case 38:
                // 38;5;n (256 colors) or 38;2;r;g;b (truecolor)
                if idx + 2 < codes.count && codes[idx + 1] == 5 {
                    fg = color256(codes[idx + 2])
                    idx += 2
                } else if idx + 4 < codes.count && codes[idx + 1] == 2 {
                    fg = Color(
                        red: Double(codes[idx + 2]) / 255.0,
                        green: Double(codes[idx + 3]) / 255.0,
                        blue: Double(codes[idx + 4]) / 255.0
                    )
                    idx += 4
                }
            case 39:
                fg = nil
            case 40...47:
                bg = standardColors[code - 40]
            case 48:
                if idx + 2 < codes.count && codes[idx + 1] == 5 {
                    bg = color256(codes[idx + 2])
                    idx += 2
                } else if idx + 4 < codes.count && codes[idx + 1] == 2 {
                    bg = Color(
                        red: Double(codes[idx + 2]) / 255.0,
                        green: Double(codes[idx + 3]) / 255.0,
                        blue: Double(codes[idx + 4]) / 255.0
                    )
                    idx += 4
                }
            case 49:
                bg = nil
            case 90...97:
                fg = brightColors[code - 90]
            case 100...107:
                bg = brightColors[code - 100]
            default:
                break
            }
            idx += 1
        }
    }
    
    private static func color256(_ index: Int) -> Color {
        if index < 8 {
            return standardColors[index]
        } else if index < 16 {
            return brightColors[index - 8]
        } else if index < 232 {
            let i = index - 16
            let r = (i / 36) % 6
            let g = (i / 6) % 6
            let b = i % 6
            let conv = [0.0, 95.0 / 255.0, 135.0 / 255.0, 175.0 / 255.0, 215.0 / 255.0, 255.0 / 255.0]
            return Color(red: conv[r], green: conv[g], blue: conv[b])
        } else if index < 256 {
            let gray = Double(index - 232) * 10.0 / 255.0 + 0.03
            return Color(red: gray, green: gray, blue: gray)
        }
        return .white
    }
}
