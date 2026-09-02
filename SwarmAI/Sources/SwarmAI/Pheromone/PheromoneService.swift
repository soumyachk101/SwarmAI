import Foundation
import SwiftUI

// MARK: - Embedder

public enum PheromoneEmbedder {
    public static func embed(_ text: String, dimension: Int = 384) -> [Float] {
        var vector = [Float](repeating: 0.0, count: dimension)
        let clean = text.lowercased()
        guard !clean.isEmpty else { return vector }

        let bytes = Array(clean.utf8)
        for i in 0..<bytes.count {
            let h1 = Int(bytes[i])
            vector[h1 % dimension] += 1.0
            if i + 1 < bytes.count {
                let h2 = (h1 &* 31 &+ Int(bytes[i + 1])) & 0x7FFFFFFF
                vector[h2 % dimension] += 2.0
            }
            if i + 2 < bytes.count {
                let h3 = (h1 &* 961 &+ Int(bytes[i + 1]) &* 31 &+ Int(bytes[i + 2])) & 0x7FFFFFFF
                vector[h3 % dimension] += 3.0
            }
        }

        var norm: Float = 0
        for v in vector {
            norm += v * v
        }
        norm = sqrt(norm)
        if norm > 0 {
            for i in 0..<dimension {
                vector[i] /= norm
            }
        }
        return vector
    }
}

// MARK: - Search Result Model

public struct PheromoneSearchResult: Identifiable, Sendable {
    public enum SearchSource: String, Sendable {
        case vector
        case keyword
        case hybrid
    }

    public var id: Int64 { chunk.id }
    public let chunk: ChunkRecord
    public let score: Double
    public let source: SearchSource

    public init(chunk: ChunkRecord, score: Double, source: SearchSource) {
        self.chunk = chunk
        self.score = score
        self.source = source
    }
}

// MARK: - Pheromone Shared Memory Service

@Observable
public final class PheromoneService: @unchecked Sendable {
    public static let shared = PheromoneService()

    public var memories: [Memory] = []
    public var sessionHistory: [TerminalSession] = []
    public var searchIndex: [String: [UUID]] = [:]

    private var activeDatabases: [String: PheromoneDatabase] = [:]
    private let dbLock = NSRecursiveLock()

    public init() {}

    public func database(for workspacePath: String) throws -> PheromoneDatabase {
        dbLock.lock()
        defer { dbLock.unlock() }

        if let existing = activeDatabases[workspacePath] {
            return existing
        }

        let db = try PheromoneDatabase(workspacePath: workspacePath)
        activeDatabases[workspacePath] = db
        return db
    }

    /// Synchronizes Markdown memory files in `.pheromone/memory/*.md` into the SQLite database with 384-dim embeddings.
    public func syncWorkspace(at workspacePath: String) async throws {
        try MemoryChunker.ensureStructure(at: workspacePath)
        let db = try database(for: workspacePath)
        let documents = try MemoryChunker.loadWorkspaceMemoryFiles(at: workspacePath)

        for doc in documents {
            let existing = try db.getMemoryFile(byPath: doc.relativePath)
            if let existing = existing, existing.hash == doc.contentHash && existing.mtime >= doc.modificationDate {
                continue
            }

            try db.transaction {
                let fileId = try db.upsertMemoryFile(
                    path: doc.relativePath,
                    title: doc.title,
                    mtime: doc.modificationDate,
                    hash: doc.contentHash
                )

                try db.deleteChunks(forFileId: fileId)

                for chunk in doc.chunks {
                    let embedding = PheromoneEmbedder.embed("\(chunk.heading ?? "")\n\(chunk.content)")
                    try db.insertChunk(
                        fileId: fileId,
                        heading: chunk.heading,
                        content: chunk.content,
                        tokens: chunk.tokens,
                        embedding: embedding
                    )
                }
            }
        }
    }

    /// Executes hybrid retrieval combining SQLite FTS5 BM25 keyword search and 384-dim vector cosine similarity using Reciprocal Rank Fusion (k=60).
    public func search(
        query: String,
        workspacePath: String,
        limit: Int = 10,
        minScore: Double = 0.0
    ) async -> [PheromoneSearchResult] {
        do {
            try await syncWorkspace(at: workspacePath)
            let db = try database(for: workspacePath)

            let queryVec = PheromoneEmbedder.embed(query)
            let vectorResults = (try? db.searchVector(queryEmbedding: queryVec, limit: limit * 4, minScore: 0.0)) ?? []
            let keywordResults = (try? db.searchKeyword(query: query, limit: limit * 4)) ?? []

            let k: Double = 60.0
            var rrfScores: [String: Double] = [:]
            var chunkMap: [String: ChunkRecord] = [:]

            for (rank, item) in vectorResults.enumerated() {
                let key = "\(item.chunk.filePath):\(item.chunk.id)"
                chunkMap[key] = item.chunk
                rrfScores[key] = (rrfScores[key] ?? 0.0) + (1.0 / (k + Double(rank + 1)))
            }

            for (rank, item) in keywordResults.enumerated() {
                let key = "\(item.chunk.filePath):\(item.chunk.id)"
                chunkMap[key] = item.chunk
                rrfScores[key] = (rrfScores[key] ?? 0.0) + (1.0 / (k + Double(rank + 1)))
            }

            var fused: [PheromoneSearchResult] = []
            for (key, chunk) in chunkMap {
                let score = rrfScores[key] ?? 0.0
                if score >= minScore {
                    let isVec = vectorResults.contains { $0.chunk.id == chunk.id }
                    let isKw = keywordResults.contains { $0.chunk.id == chunk.id }
                    let source: PheromoneSearchResult.SearchSource = (isVec && isKw) ? .hybrid : (isVec ? .vector : .keyword)
                    fused.append(PheromoneSearchResult(chunk: chunk, score: score, source: source))
                }
            }

            fused.sort { $0.score > $1.score }
            return Array(fused.prefix(limit))
        } catch {
            return []
        }
    }

    /// Formats a clean Markdown context injection block for agent prompts, ranked and budget-capped.
    public func injectContext(
        for workspacePath: String,
        taskDescription: String,
        tokenBudget: Int = 3000
    ) async -> String {
        let results = await search(query: taskDescription, workspacePath: workspacePath, limit: 12, minScore: 0.0)

        var selectedChunks: [PheromoneSearchResult] = []
        var totalTokens = 0

        for res in results {
            let tokens = res.chunk.tokens
            if totalTokens + tokens > tokenBudget {
                break
            }
            selectedChunks.append(res)
            totalTokens += tokens
        }

        if selectedChunks.isEmpty {
            let priorityOrder = [
                "memory/project.md",
                "memory/decisions.md",
                "memory/conventions.md",
                "memory/gotchas.md",
                "memory/bugs.md",
                "memory/patterns.md",
                "memory/architecture.md",
                "memory/knowledge.md"
            ]

            if let db = try? database(for: workspacePath), let all = try? db.getAllChunks() {
                for path in priorityOrder {
                    let fileChunks = all.filter { $0.filePath == path }
                    for c in fileChunks {
                        if totalTokens + c.tokens <= tokenBudget {
                            selectedChunks.append(PheromoneSearchResult(chunk: c, score: 0.01, source: .keyword))
                            totalTokens += c.tokens
                        }
                    }
                }
            }
        }

        guard !selectedChunks.isEmpty else { return "" }

        var output = "[Swarm Pheromone — project memory auto-injected, ranked & truncated]\n\n"
        for item in selectedChunks {
            let headingStr = item.chunk.heading != nil ? " — \(item.chunk.heading!)" : ""
            output += "### \(item.chunk.filePath)\(headingStr) (score: \(String(format: "%.3f", item.score)))\n"
            output += "\(item.chunk.content)\n\n---\n\n"
        }
        output += "[end of injected context]"

        logInjection(workspacePath: workspacePath, task: taskDescription, chunks: selectedChunks, totalTokens: totalTokens)
        return output
    }

    private func logInjection(workspacePath: String, task: String, chunks: [PheromoneSearchResult], totalTokens: Int) {
        let timestamp = ISO8601DateFormatter().string(from: Date()).replacingOccurrences(of: ":", with: "-")
        let logDir = ((workspacePath as NSString).appendingPathComponent(".pheromone") as NSString).appendingPathComponent("agents/sessions")
        let logPath = (logDir as NSString).appendingPathComponent("\(timestamp)-injection.md")

        let chunkLines = chunks.map { "- \($0.chunk.filePath) [score: \(String(format: "%.3f", $0.score))] (~ \($0.chunk.tokens) tokens)" }.joined(separator: "\n")
        let content = """
        # Context Injection Log
        Date: \(Date())
        Task: \(task)
        Tokens Injected: ~\(totalTokens)

        ## Retrieved Chunks
        \(chunkLines)
        """

        try? FileManager.default.createDirectory(atPath: logDir, withIntermediateDirectories: true)
        try? content.write(toFile: logPath, atomically: true, encoding: String.Encoding.utf8)
    }

    public func storeMemory(workspacePath: String, file: String, heading: String?, content: String) async throws {
        try MemoryChunker.ensureStructure(at: workspacePath)
        let normalizedFile = file.hasSuffix(".md") ? file : "\(file).md"
        let memoryDir = ((workspacePath as NSString).appendingPathComponent(".pheromone") as NSString).appendingPathComponent("memory")
        let targetPath = (memoryDir as NSString).appendingPathComponent(normalizedFile)

        let section = "\n\n## \(heading ?? "Note")\n\n\(content)\n"
        if FileManager.default.fileExists(atPath: targetPath) {
            if let fileHandle = FileHandle(forWritingAtPath: targetPath) {
                fileHandle.seekToEndOfFile()
                if let data = section.data(using: .utf8) {
                    fileHandle.write(data)
                }
                fileHandle.closeFile()
            }
        } else {
            let initial = "# \(normalizedFile.replacingOccurrences(of: ".md", with: "").capitalized)\n\(section)"
            try initial.write(toFile: targetPath, atomically: true, encoding: .utf8)
        }

        try await syncWorkspace(at: workspacePath)
    }

    public func listMemories(workspacePath: String) -> [ChunkRecord] {
        guard let db = try? database(for: workspacePath), let all = try? db.getAllChunks() else {
            return []
        }
        return all
    }

    public func listMemoryFiles(workspacePath: String) -> [MemoryFileRecord] {
        guard let db = try? database(for: workspacePath), let files = try? db.listMemoryFiles() else {
            return []
        }
        return files
    }

    // MARK: - In-Memory & Legacy Support

    public func store(_ memory: Memory) {
        memories.append(memory)
        indexMemory(memory)
    }

    public func search(query: String) -> [Memory] {
        memories.filter { memory in
            memory.content.localizedCaseInsensitiveContains(query) ||
            memory.tags.contains { $0.localizedCaseInsensitiveContains(query) }
        }
        .sorted { $0.importance > $1.importance }
    }

    public func memoriesForWorkspace(_ workspaceId: UUID) -> [Memory] {
        memories.filter { $0.workspaceId == workspaceId }
    }

    public func memoriesForAgent(_ agentId: UUID) -> [Memory] {
        memories.filter { $0.agentId == agentId }
    }

    public func injectContext(for agent: Agent, context: [Memory]) -> String {
        var contextStr = "# Pheromone Context\n\n"
        for memory in context {
            contextStr += "## [\(memory.type.rawValue)] \(memory.content)\n\n"
        }
        return contextStr
    }

    public func recordSession(_ session: TerminalSession) {
        sessionHistory.append(session)
    }

    private func indexMemory(_ memory: Memory) {
        let words = memory.content.components(separatedBy: .whitespacesAndNewlines)
        for word in words where word.count > 3 {
            let lower = word.lowercased()
            if searchIndex[lower] == nil {
                searchIndex[lower] = []
            }
            searchIndex[lower]?.append(memory.id)
        }
    }
}

// MARK: - File Ownership Locks

@Observable
public final class FileLockService: @unchecked Sendable {
    public static let shared = FileLockService()

    public var locks: [FileLock] = []

    public func lock(file: String, owner: Agent) -> FileLock {
        let lock = FileLock(file: file, ownerId: owner.id, ownerName: owner.name)
        locks.append(lock)
        return lock
    }

    public func unlock(file: String) {
        locks.removeAll { $0.file == file }
    }

    public func isLocked(_ file: String) -> Bool {
        locks.contains { $0.file == file }
    }

    public func owner(of file: String) -> FileLock? {
        locks.first { $0.file == file }
    }

    public func releaseAll(for agent: Agent) {
        locks.removeAll { $0.ownerId == agent.id }
    }
}

public struct FileLock: Identifiable, Sendable {
    public let id = UUID()
    public let file: String
    public let ownerId: UUID
    public let ownerName: String
    public let lockedAt: Date = Date()

    public init(file: String, ownerId: UUID, ownerName: String) {
        self.file = file
        self.ownerId = ownerId
        self.ownerName = ownerName
    }
}