import Foundation
import CryptoKit

public struct ParsedChunk: Sendable, Equatable {
    public let heading: String?
    public let content: String
    public let tokens: Int

    public init(heading: String?, content: String, tokens: Int) {
        self.heading = heading
        self.content = content
        self.tokens = tokens
    }
}

public struct ParsedMemoryDocument: Sendable {
    public let relativePath: String
    public let title: String
    public let frontmatter: [String: String]
    public let chunks: [ParsedChunk]
    public let contentHash: String
    public let modificationDate: Double
}

/// Parses markdown memory files from `.pheromone/memory/*.md` into semantic heading sections and chunks.
public enum MemoryChunker {
    public static let standardMemoryFiles: [(filename: String, title: String, description: String)] = [
        ("project.md", "Project Overview", "High-level system overview, core vision, and repository boundaries."),
        ("architecture.md", "Architecture", "Core architectural components, subsystems, data flow, and boundaries."),
        ("decisions.md", "Architecture Decisions", "Key architectural and technical decisions (ADRs)."),
        ("conventions.md", "Coding Conventions", "Coding standards, style guides, design tokens, and conventions."),
        ("patterns.md", "Design Patterns", "Established engineering and UI design patterns."),
        ("gotchas.md", "Gotchas & Nuances", "Known subtleties, environment quirks, and pitfalls."),
        ("bugs.md", "Known Bugs & Issues", "Active bug investigations, reproduction steps, and workarounds."),
        ("knowledge.md", "General Knowledge", "Shared domain facts, external APIs, and references.")
    ]

    public static func ensureStructure(at workspacePath: String) throws {
        let fm = FileManager.default
        let pheromoneDir = (workspacePath as NSString).appendingPathComponent(".pheromone")
        let subdirs = [
            (pheromoneDir as NSString).appendingPathComponent("memory"),
            (pheromoneDir as NSString).appendingPathComponent("agents/sessions"),
            (pheromoneDir as NSString).appendingPathComponent("agents/summaries"),
            (pheromoneDir as NSString).appendingPathComponent("tasks"),
            (pheromoneDir as NSString).appendingPathComponent("index")
        ]

        for dir in subdirs {
            if !fm.fileExists(atPath: dir) {
                try fm.createDirectory(atPath: dir, withIntermediateDirectories: true)
            }
        }

        let memoryDir = (pheromoneDir as NSString).appendingPathComponent("memory")
        for file in standardMemoryFiles {
            let targetPath = (memoryDir as NSString).appendingPathComponent(file.filename)
            if !fm.fileExists(atPath: targetPath) {
                let initialContent = """
                # \(file.title)

                <!-- \(file.description) -->

                """
                try initialContent.write(toFile: targetPath, atomically: true, encoding: .utf8)
            }
        }
    }

    public static func parse(content: String, relativePath: String, mtime: Double = Date().timeIntervalSince1970) -> ParsedMemoryDocument {
        var lines = content.components(separatedBy: "\n")
        var frontmatter: [String: String] = [:]

        // Extract YAML frontmatter if present
        if lines.first?.trimmingCharacters(in: .whitespaces) == "---" {
            lines.removeFirst()
            var frontmatterLines: [String] = []
            while !lines.isEmpty && lines.first?.trimmingCharacters(in: .whitespaces) != "---" {
                frontmatterLines.append(lines.removeFirst())
            }
            if !lines.isEmpty && lines.first?.trimmingCharacters(in: .whitespaces) == "---" {
                lines.removeFirst()
            }
            for fmLine in frontmatterLines {
                let parts = fmLine.split(separator: ":", maxSplits: 1).map { String($0).trimmingCharacters(in: .whitespaces) }
                if parts.count == 2 {
                    frontmatter[parts[0]] = parts[1]
                }
            }
        }

        // Clean out HTML comments
        let cleanedContent = lines.joined(separator: "\n")
            .replacingOccurrences(of: "<!--[\\s\\S]*?-->", with: "", options: .regularExpression)

        // Compute SHA-256 hash
        let hashData = SHA256.hash(data: Data(cleanedContent.utf8))
        let hashString = hashData.map { String(format: "%02x", $0) }.joined()

        let cleanedLines = cleanedContent.components(separatedBy: "\n")
        var detectedTitle: String? = frontmatter["title"]
        var chunks: [ParsedChunk] = []
        var currentHeading: String? = nil
        var currentSectionLines: [String] = []

        let flushChunk = {
            let text = currentSectionLines.joined(separator: "\n").trimmingCharacters(in: .whitespacesAndNewlines)
            if !text.isEmpty {
                let tokens = max(1, Int(ceil(Double(text.count) / 4.0)))
                chunks.append(ParsedChunk(heading: currentHeading, content: text, tokens: tokens))
            }
            currentSectionLines.removeAll()
        }

        for line in cleanedLines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)
            if trimmed.hasPrefix("#") {
                let headerMatch = trimmed.prefix(while: { $0 == "#" })
                let headingText = trimmed.dropFirst(headerMatch.count).trimmingCharacters(in: .whitespaces)

                if detectedTitle == nil && headerMatch.count == 1 {
                    detectedTitle = headingText
                }

                flushChunk()
                currentHeading = headingText
            } else {
                currentSectionLines.append(line)
            }
        }
        flushChunk()

        let finalTitle = detectedTitle ?? (relativePath as NSString).deletingPathExtension.capitalized
        return ParsedMemoryDocument(
            relativePath: relativePath,
            title: finalTitle,
            frontmatter: frontmatter,
            chunks: chunks,
            contentHash: hashString,
            modificationDate: mtime
        )
    }

    public static func loadWorkspaceMemoryFiles(at workspacePath: String) throws -> [ParsedMemoryDocument] {
        let fm = FileManager.default
        let memoryDir = ((workspacePath as NSString).appendingPathComponent(".pheromone") as NSString).appendingPathComponent("memory")
        guard fm.fileExists(atPath: memoryDir) else { return [] }

        let files = try fm.contentsOfDirectory(atPath: memoryDir).filter { $0.hasSuffix(".md") }
        var documents: [ParsedMemoryDocument] = []

        for file in files {
            let fullPath = (memoryDir as NSString).appendingPathComponent(file)
            guard let content = try? String(contentsOfFile: fullPath, encoding: .utf8) else { continue }
            let attrs = try? fm.attributesOfItem(atPath: fullPath)
            let mtime = (attrs?[.modificationDate] as? Date)?.timeIntervalSince1970 ?? Date().timeIntervalSince1970

            let doc = parse(content: content, relativePath: "memory/\(file)", mtime: mtime)
            documents.append(doc)
        }

        return documents
    }
}