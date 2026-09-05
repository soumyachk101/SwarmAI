import Foundation
import SQLite3

// MARK: - SQLite Destructor Helper

private let SQLITE_TRANSIENT = unsafeBitCast(-1, to: sqlite3_destructor_type.self)

// MARK: - Models

/// Represents a tracked memory markdown file record in SQLite.
public struct MemoryFileRecord: Sendable, Identifiable, Equatable {
    public let id: Int64
    public let path: String
    public let title: String
    public let mtime: Double
    public let hash: String
    public let createdAt: Double
    public let updatedAt: Double

    public init(
        id: Int64,
        path: String,
        title: String,
        mtime: Double,
        hash: String,
        createdAt: Double = Date().timeIntervalSince1970,
        updatedAt: Double = Date().timeIntervalSince1970
    ) {
        self.id = id
        self.path = path
        self.title = title
        self.mtime = mtime
        self.hash = hash
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Represents a parsed memory chunk with optional embedding vector.
public struct ChunkRecord: Sendable, Identifiable, Equatable {
    public let id: Int64
    public let fileId: Int64
    public let filePath: String
    public let heading: String?
    public let content: String
    public let tokens: Int
    public let embedding: [Float]?
    public let createdAt: Double
    public let updatedAt: Double

    public init(
        id: Int64,
        fileId: Int64,
        filePath: String,
        heading: String?,
        content: String,
        tokens: Int,
        embedding: [Float]?,
        createdAt: Double = Date().timeIntervalSince1970,
        updatedAt: Double = Date().timeIntervalSince1970
    ) {
        self.id = id
        self.fileId = fileId
        self.filePath = filePath
        self.heading = heading
        self.content = content
        self.tokens = tokens
        self.embedding = embedding
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
}

/// Represents an agent session log record.
public struct SessionRecord: Sendable, Identifiable, Equatable {
    public let id: String
    public let timestamp: Double
    public let agentId: String
    public let role: String
    public let summary: String

    public init(
        id: String = UUID().uuidString,
        timestamp: Double = Date().timeIntervalSince1970,
        agentId: String,
        role: String,
        summary: String
    ) {
        self.id = id
        self.timestamp = timestamp
        self.agentId = agentId
        self.role = role
        self.summary = summary
    }
}

// MARK: - Pheromone Database Error

public enum PheromoneDatabaseError: LocalizedError {
    case connectionFailed(String)
    case queryFailed(String)
    case prepareFailed(String)
    case stepFailed(String)
    case bindFailed(String)
    case notFound(String)

    public var errorDescription: String? {
        switch self {
        case .connectionFailed(let msg): return "SQLite connection error: \(msg)"
        case .queryFailed(let msg): return "SQLite query error: \(msg)"
        case .prepareFailed(let msg): return "SQLite statement prepare error: \(msg)"
        case .stepFailed(let msg): return "SQLite step error: \(msg)"
        case .bindFailed(let msg): return "SQLite bind error: \(msg)"
        case .notFound(let msg): return "SQLite record not found: \(msg)"
        }
    }
}

// MARK: - Pheromone Database

/// Embedded SQLite database manager for Pheromone shared memory engine.
/// Targets `<workspace>/.pheromone/pheromone.db` and manages memory files, semantic chunks,
/// FTS5 full-text index, vector embeddings, and session handoffs.
public final class PheromoneDatabase: @unchecked Sendable {
    public let dbPath: String
    private var db: OpaquePointer?
    nonisolated private let lock = NSRecursiveLock()

    public init(workspacePath: String) throws {
        let cleanWorkspace = URL(fileURLWithPath: workspacePath).standardized.path
        let pheromoneDir = (cleanWorkspace as NSString).appendingPathComponent(".pheromone")
        let dbFile = (pheromoneDir as NSString).appendingPathComponent("pheromone.db")
        self.dbPath = dbFile

        let fm = FileManager.default
        var isDir: ObjCBool = false
        if !fm.fileExists(atPath: pheromoneDir, isDirectory: &isDir) || !isDir.boolValue {
            try fm.createDirectory(atPath: pheromoneDir, withIntermediateDirectories: true, attributes: nil)
        }

        try openDatabase()
        try initializeSchema()
    }

    public init(directDbPath: String) throws {
        let cleanDbPath = URL(fileURLWithPath: directDbPath).standardized.path
        self.dbPath = cleanDbPath
        let dir = (cleanDbPath as NSString).deletingLastPathComponent
        let fm = FileManager.default
        var isDir: ObjCBool = false
        if !fm.fileExists(atPath: dir, isDirectory: &isDir) || !isDir.boolValue {
            try fm.createDirectory(atPath: dir, withIntermediateDirectories: true, attributes: nil)
        }

        try openDatabase()
        try initializeSchema()
    }

    deinit {
        close()
    }

    public func close() {
        lock.lock()
        defer { lock.unlock() }
        if let db = db {
            sqlite3_close_v2(db)
            self.db = nil
        }
    }

    private func openDatabase() throws {
        lock.lock()
        defer { lock.unlock() }

        // Ensure parent directory exists before opening SQLite database
        let parentDir = (dbPath as NSString).deletingLastPathComponent
        let fm = FileManager.default
        var isDir: ObjCBool = false
        if !fm.fileExists(atPath: parentDir, isDirectory: &isDir) || !isDir.boolValue {
            try fm.createDirectory(atPath: parentDir, withIntermediateDirectories: true, attributes: nil)
        }

        var handle: OpaquePointer?
        let flags = SQLITE_OPEN_READWRITE | SQLITE_OPEN_CREATE | SQLITE_OPEN_FULLMUTEX
        let status = sqlite3_open_v2(dbPath, &handle, flags, nil)
        guard status == SQLITE_OK, let openHandle = handle else {
            let errmsg = handle != nil ? String(cString: sqlite3_errmsg(handle)) : "Unknown error"
            if let handle = handle { sqlite3_close_v2(handle) }
            throw PheromoneDatabaseError.connectionFailed("Failed to open database at \(dbPath): \(errmsg)")
        }
        self.db = openHandle

        try execute(sql: "PRAGMA journal_mode = WAL;")
        try execute(sql: "PRAGMA synchronous = NORMAL;")
        try execute(sql: "PRAGMA foreign_keys = ON;")
        try execute(sql: "PRAGMA busy_timeout = 5000;")
    }

    private func initializeSchema() throws {
        lock.lock()
        defer { lock.unlock() }

        try execute(sql: """
            CREATE TABLE IF NOT EXISTS metadata (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            );
        """)

        try execute(sql: """
            CREATE TABLE IF NOT EXISTS memory_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                path TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                mtime REAL NOT NULL,
                hash TEXT NOT NULL,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
        """)

        try execute(sql: """
            CREATE TABLE IF NOT EXISTS chunks (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_id INTEGER NOT NULL REFERENCES memory_files(id) ON DELETE CASCADE,
                heading TEXT,
                content TEXT NOT NULL,
                tokens INTEGER NOT NULL DEFAULT 0,
                embedding BLOB,
                created_at REAL NOT NULL,
                updated_at REAL NOT NULL
            );
        """)

        try execute(sql: """
            CREATE TABLE IF NOT EXISTS sessions (
                id TEXT PRIMARY KEY,
                timestamp REAL NOT NULL,
                agent_id TEXT NOT NULL,
                role TEXT NOT NULL,
                summary TEXT NOT NULL
            );
        """)

        try execute(sql: "CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON chunks(file_id);")
        try execute(sql: "CREATE INDEX IF NOT EXISTS idx_memory_files_path ON memory_files(path);")
        try execute(sql: "CREATE INDEX IF NOT EXISTS idx_sessions_timestamp ON sessions(timestamp);")

        try initializeFTS5()
    }

    private func initializeFTS5() throws {
        let createFtsSql = """
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                content,
                heading,
                content='chunks',
                content_rowid='id',
                tokenize = 'porter unicode61'
            );
        """
        do {
            try execute(sql: createFtsSql)

            try execute(sql: """
                CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
                    INSERT INTO chunks_fts(rowid, content, heading) VALUES (new.id, new.content, new.heading);
                END;
            """)

            try execute(sql: """
                CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
                    INSERT INTO chunks_fts(chunks_fts, rowid, content, heading) VALUES('delete', old.id, old.content, old.heading);
                END;
            """)

            try execute(sql: """
                CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
                    INSERT INTO chunks_fts(chunks_fts, rowid, content, heading) VALUES('delete', old.id, old.content, old.heading);
                    INSERT INTO chunks_fts(rowid, content, heading) VALUES (new.id, new.content, new.heading);
                END;
            """)
        } catch {
            // Handled gracefully if triggers exist
        }
    }

    private func execute(sql: String) throws {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        var errmsg: UnsafeMutablePointer<CChar>?
        if sqlite3_exec(db, sql, nil, nil, &errmsg) != SQLITE_OK {
            let msg = errmsg != nil ? String(cString: errmsg!) : "Unknown error"
            sqlite3_free(errmsg)
            throw PheromoneDatabaseError.queryFailed("SQL error executing [\(sql)]: \(msg)")
        }
    }

    public func transaction<T>(_ block: () throws -> T) throws -> T {
        lock.lock()
        defer { lock.unlock() }

        try execute(sql: "BEGIN IMMEDIATE TRANSACTION;")
        do {
            let result = try block()
            try execute(sql: "COMMIT;")
            return result
        } catch {
            try? execute(sql: "ROLLBACK;")
            throw error
        }
    }

    @discardableResult
    public func upsertMemoryFile(path: String, title: String, mtime: Double, hash: String) throws -> Int64 {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let now = Date().timeIntervalSince1970
        let sql = """
            INSERT INTO memory_files (path, title, mtime, hash, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            ON CONFLICT(path) DO UPDATE SET
                title = excluded.title,
                mtime = excluded.mtime,
                hash = excluded.hash,
                updated_at = excluded.updated_at;
        """

        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare upsertMemoryFile: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, (path as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 2, (title as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_double(stmt, 3, mtime)
        sqlite3_bind_text(stmt, 4, (hash as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_double(stmt, 5, now)
        sqlite3_bind_double(stmt, 6, now)

        guard sqlite3_step(stmt) == SQLITE_DONE else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.stepFailed("Failed to step upsertMemoryFile: \(msg)")
        }

        if let existing = try getMemoryFile(byPath: path) {
            return existing.id
        }
        return sqlite3_last_insert_rowid(db)
    }

    public func getMemoryFile(byPath path: String) throws -> MemoryFileRecord? {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = "SELECT id, path, title, mtime, hash, created_at, updated_at FROM memory_files WHERE path = ? LIMIT 1;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare getMemoryFile: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, (path as NSString).utf8String, -1, SQLITE_TRANSIENT)

        if sqlite3_step(stmt) == SQLITE_ROW {
            return parseMemoryFileRecord(stmt: stmt!)
        }
        return nil
    }

    public func listMemoryFiles() throws -> [MemoryFileRecord] {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = "SELECT id, path, title, mtime, hash, created_at, updated_at FROM memory_files ORDER BY path ASC;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare listMemoryFiles: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        var records: [MemoryFileRecord] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            records.append(parseMemoryFileRecord(stmt: stmt!))
        }
        return records
    }

    public func deleteMemoryFile(path: String) throws {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = "DELETE FROM memory_files WHERE path = ?;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare deleteMemoryFile: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, (path as NSString).utf8String, -1, SQLITE_TRANSIENT)
        guard sqlite3_step(stmt) == SQLITE_DONE else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.stepFailed("Failed to step deleteMemoryFile: \(msg)")
        }
    }

    private func parseMemoryFileRecord(stmt: OpaquePointer) -> MemoryFileRecord {
        let id = sqlite3_column_int64(stmt, 0)
        let path = String(cString: sqlite3_column_text(stmt, 1))
        let title = String(cString: sqlite3_column_text(stmt, 2))
        let mtime = sqlite3_column_double(stmt, 3)
        let hash = String(cString: sqlite3_column_text(stmt, 4))
        let createdAt = sqlite3_column_double(stmt, 5)
        let updatedAt = sqlite3_column_double(stmt, 6)
        return MemoryFileRecord(id: id, path: path, title: title, mtime: mtime, hash: hash, createdAt: createdAt, updatedAt: updatedAt)
    }

    @discardableResult
    public func insertChunk(fileId: Int64, heading: String?, content: String, tokens: Int, embedding: [Float]?) throws -> Int64 {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let now = Date().timeIntervalSince1970
        let sql = """
            INSERT INTO chunks (file_id, heading, content, tokens, embedding, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?);
        """

        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare insertChunk: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_int64(stmt, 1, fileId)
        if let heading = heading {
            sqlite3_bind_text(stmt, 2, (heading as NSString).utf8String, -1, SQLITE_TRANSIENT)
        } else {
            sqlite3_bind_null(stmt, 2)
        }
        sqlite3_bind_text(stmt, 3, (content as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_int64(stmt, 4, Int64(tokens))

        if let embedding = embedding, !embedding.isEmpty {
            let data = floatArrayToData(embedding)
            sqlite3_bind_blob(stmt, 5, (data as NSData).bytes, Int32(data.count), SQLITE_TRANSIENT)
        } else {
            sqlite3_bind_null(stmt, 5)
        }

        sqlite3_bind_double(stmt, 6, now)
        sqlite3_bind_double(stmt, 7, now)

        guard sqlite3_step(stmt) == SQLITE_DONE else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.stepFailed("Failed to step insertChunk: \(msg)")
        }

        let chunkId = sqlite3_last_insert_rowid(db)

        let ftsInsert = "INSERT INTO chunks_fts(rowid, content, heading) VALUES (?, ?, ?);"
        var ftsStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, ftsInsert, -1, &ftsStmt, nil) == SQLITE_OK {
            sqlite3_bind_int64(ftsStmt, 1, chunkId)
            sqlite3_bind_text(ftsStmt, 2, (content as NSString).utf8String, -1, SQLITE_TRANSIENT)
            if let heading = heading {
                sqlite3_bind_text(ftsStmt, 3, (heading as NSString).utf8String, -1, SQLITE_TRANSIENT)
            } else {
                sqlite3_bind_null(ftsStmt, 3)
            }
            _ = sqlite3_step(ftsStmt)
            sqlite3_finalize(ftsStmt)
        }

        return chunkId
    }

    public func deleteChunks(forFileId fileId: Int64) throws {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let cleanFts = "DELETE FROM chunks_fts WHERE rowid IN (SELECT id FROM chunks WHERE file_id = ?);"
        var ftsStmt: OpaquePointer?
        if sqlite3_prepare_v2(db, cleanFts, -1, &ftsStmt, nil) == SQLITE_OK {
            sqlite3_bind_int64(ftsStmt, 1, fileId)
            _ = sqlite3_step(ftsStmt)
            sqlite3_finalize(ftsStmt)
        }

        let sql = "DELETE FROM chunks WHERE file_id = ?;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare deleteChunks: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_int64(stmt, 1, fileId)
        guard sqlite3_step(stmt) == SQLITE_DONE else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.stepFailed("Failed to step deleteChunks: \(msg)")
        }
    }

    public func getChunks(forFileId fileId: Int64) throws -> [ChunkRecord] {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = """
            SELECT c.id, c.file_id, m.path, c.heading, c.content, c.tokens, c.embedding, c.created_at, c.updated_at
            FROM chunks c
            JOIN memory_files m ON c.file_id = m.id
            WHERE c.file_id = ?
            ORDER BY c.id ASC;
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare getChunks: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_int64(stmt, 1, fileId)

        var chunks: [ChunkRecord] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            chunks.append(parseChunkRecord(stmt: stmt!))
        }
        return chunks
    }

    public func getAllChunks() throws -> [ChunkRecord] {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = """
            SELECT c.id, c.file_id, m.path, c.heading, c.content, c.tokens, c.embedding, c.created_at, c.updated_at
            FROM chunks c
            JOIN memory_files m ON c.file_id = m.id
            ORDER BY m.path ASC, c.id ASC;
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare getAllChunks: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        var chunks: [ChunkRecord] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            chunks.append(parseChunkRecord(stmt: stmt!))
        }
        return chunks
    }

    private func parseChunkRecord(stmt: OpaquePointer) -> ChunkRecord {
        let id = sqlite3_column_int64(stmt, 0)
        let fileId = sqlite3_column_int64(stmt, 1)
        let filePath = String(cString: sqlite3_column_text(stmt, 2))

        var heading: String?
        if let h = sqlite3_column_text(stmt, 3) {
            heading = String(cString: h)
        }

        let content = String(cString: sqlite3_column_text(stmt, 4))
        let tokens = Int(sqlite3_column_int64(stmt, 5))

        var embedding: [Float]?
        if let blob = sqlite3_column_blob(stmt, 6) {
            let byteCount = Int(sqlite3_column_bytes(stmt, 6))
            let data = Data(bytes: blob, count: byteCount)
            embedding = dataToFloatArray(data)
        }

        let createdAt = sqlite3_column_double(stmt, 7)
        let updatedAt = sqlite3_column_double(stmt, 8)

        return ChunkRecord(
            id: id,
            fileId: fileId,
            filePath: filePath,
            heading: heading,
            content: content,
            tokens: tokens,
            embedding: embedding,
            createdAt: createdAt,
            updatedAt: updatedAt
        )
    }

    public func searchKeyword(query: String, limit: Int = 10) throws -> [(chunk: ChunkRecord, score: Double)] {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sanitized = sanitizeFtsQuery(query)
        guard !sanitized.isEmpty else { return [] }

        let sql = """
            SELECT c.id, c.file_id, m.path, c.heading, c.content, c.tokens, c.embedding, c.created_at, c.updated_at,
                   bm25(chunks_fts) as rank
            FROM chunks_fts
            JOIN chunks c ON chunks_fts.rowid = c.id
            JOIN memory_files m ON c.file_id = m.id
            WHERE chunks_fts MATCH ?
            ORDER BY rank ASC
            LIMIT ?;
        """

        var stmt: OpaquePointer?
        let prepStatus = sqlite3_prepare_v2(db, sql, -1, &stmt, nil)
        guard prepStatus == SQLITE_OK else {
            return try fallbackKeywordSearch(query: query, limit: limit)
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, (sanitized as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_int64(stmt, 2, Int64(limit * 3))

        var results: [(chunk: ChunkRecord, score: Double)] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            let chunk = parseChunkRecord(stmt: stmt!)
            let rawRank = sqlite3_column_double(stmt, 9)
            let normalizedScore = max(0.001, 1.0 / (1.0 + abs(rawRank)))
            results.append((chunk, normalizedScore))
        }

        if results.isEmpty {
            return try fallbackKeywordSearch(query: query, limit: limit)
        }

        return Array(results.prefix(limit))
    }

    private func fallbackKeywordSearch(query: String, limit: Int) throws -> [(chunk: ChunkRecord, score: Double)] {
        let allChunks = try getAllChunks()
        let queryTokens = query.lowercased()
            .components(separatedBy: CharacterSet.alphanumerics.inverted)
            .filter { $0.count >= 2 }

        guard !queryTokens.isEmpty else { return [] }

        var scored: [(chunk: ChunkRecord, score: Double)] = []
        for chunk in allChunks {
            let text = "\(chunk.heading ?? "")\n\(chunk.content)".lowercased()
            var matches = 0
            for token in queryTokens {
                if text.contains(token) {
                    matches += 1
                }
            }
            if matches > 0 {
                let score = Double(matches) / Double(queryTokens.count)
                scored.append((chunk, score))
            }
        }

        return scored.sorted { $0.score > $1.score }.prefix(limit).map { $0 }
    }

    public func searchVector(queryEmbedding: [Float], limit: Int = 10, minScore: Double = 0.0) throws -> [(chunk: ChunkRecord, score: Double)] {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = """
            SELECT c.id, c.file_id, m.path, c.heading, c.content, c.tokens, c.embedding, c.created_at, c.updated_at
            FROM chunks c
            JOIN memory_files m ON c.file_id = m.id
            WHERE c.embedding IS NOT NULL;
        """
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare searchVector: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        var results: [(chunk: ChunkRecord, score: Double)] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            let chunk = parseChunkRecord(stmt: stmt!)
            guard let emb = chunk.embedding, emb.count == queryEmbedding.count else { continue }

            let sim = cosineSimilarity(queryEmbedding, emb)
            if sim >= minScore {
                results.append((chunk, sim))
            }
        }

        results.sort { $0.score > $1.score }
        return Array(results.prefix(limit))
    }

    public func recordSession(id: String = UUID().uuidString, timestamp: Date = Date(), agentId: String, role: String, summary: String) throws {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = """
            INSERT INTO sessions (id, timestamp, agent_id, role, summary)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(id) DO UPDATE SET
                timestamp = excluded.timestamp,
                agent_id = excluded.agent_id,
                role = excluded.role,
                summary = excluded.summary;
        """

        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare recordSession: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_text(stmt, 1, (id as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_double(stmt, 2, timestamp.timeIntervalSince1970)
        sqlite3_bind_text(stmt, 3, (agentId as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 4, (role as NSString).utf8String, -1, SQLITE_TRANSIENT)
        sqlite3_bind_text(stmt, 5, (summary as NSString).utf8String, -1, SQLITE_TRANSIENT)

        guard sqlite3_step(stmt) == SQLITE_DONE else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.stepFailed("Failed to step recordSession: \(msg)")
        }
    }

    public func listSessions(limit: Int = 50) throws -> [SessionRecord] {
        lock.lock()
        defer { lock.unlock() }

        guard let db = db else { throw PheromoneDatabaseError.connectionFailed("Database is closed") }

        let sql = "SELECT id, timestamp, agent_id, role, summary FROM sessions ORDER BY timestamp DESC LIMIT ?;"
        var stmt: OpaquePointer?
        guard sqlite3_prepare_v2(db, sql, -1, &stmt, nil) == SQLITE_OK else {
            let msg = String(cString: sqlite3_errmsg(db))
            throw PheromoneDatabaseError.prepareFailed("Failed to prepare listSessions: \(msg)")
        }
        defer { sqlite3_finalize(stmt) }

        sqlite3_bind_int64(stmt, 1, Int64(limit))

        var sessions: [SessionRecord] = []
        while sqlite3_step(stmt) == SQLITE_ROW {
            let id = String(cString: sqlite3_column_text(stmt, 0))
            let timestamp = sqlite3_column_double(stmt, 1)
            let agentId = String(cString: sqlite3_column_text(stmt, 2))
            let role = String(cString: sqlite3_column_text(stmt, 3))
            let summary = String(cString: sqlite3_column_text(stmt, 4))
            sessions.append(SessionRecord(id: id, timestamp: timestamp, agentId: agentId, role: role, summary: summary))
        }
        return sessions
    }

    private func sanitizeFtsQuery(_ query: String) -> String {
        let tokens = query
            .components(separatedBy: CharacterSet.alphanumerics.union(CharacterSet(charactersIn: "-_")).inverted)
            .filter { $0.count >= 2 }

        guard !tokens.isEmpty else { return "" }
        return tokens.map { "\"\($0)\"*" }.joined(separator: " OR ")
    }
}

// MARK: - Vector Utilities

private func floatArrayToData(_ array: [Float]) -> Data {
    return array.withUnsafeBufferPointer { buffer in
        Data(buffer: buffer)
    }
}

private func dataToFloatArray(_ data: Data) -> [Float] {
    let count = data.count / MemoryLayout<Float>.stride
    return data.withUnsafeBytes { rawBuffer in
        let buffer = rawBuffer.bindMemory(to: Float.self)
        return Array(buffer.prefix(count))
    }
}

private func cosineSimilarity(_ a: [Float], _ b: [Float]) -> Double {
    guard a.count == b.count, !a.isEmpty else { return 0.0 }
    var dot: Double = 0.0
    for i in 0..<a.count {
        dot += Double(a[i] * b[i])
    }
    return max(0.0, min(1.0, dot))
}