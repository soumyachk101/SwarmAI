import initSqlJs from 'sql.js';

export interface Chunk {
 id: string;
 source_file: string;
 chunk_index: number;
 content: string;
 // Optional: Rust-produced keyword-only DBs omit the embedding column.
 embedding?: number[];
 // Optional: present in Rust-produced DBs (heading of the source section).
 heading?: string;
 created_at: number;
 updated_at: number;
}

export interface MemoryFile {
 id: string;
 path: string;
 type: 'memory' | 'agent_session' | 'agent_summary' | 'handoff' | 'task_state';
 created_at: number;
 updated_at: number;
}

export function initializeSchema(db: initSqlJs.Database): void {
 // Metadata table
 db.run(`
 CREATE TABLE IF NOT EXISTS metadata (
 key TEXT PRIMARY KEY,
 value TEXT
 )
 `);

 // Memory files table
 db.run(`
 CREATE TABLE IF NOT EXISTS memory_files (
 id TEXT PRIMARY KEY,
 path TEXT NOT NULL UNIQUE,
 type TEXT NOT NULL,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL
 )
 `);

 // Chunks table with vector storage
 db.run(`
 CREATE TABLE IF NOT EXISTS chunks (
 id TEXT PRIMARY KEY,
 source_file TEXT NOT NULL,
 chunk_index INTEGER NOT NULL,
 content TEXT NOT NULL,
 embedding BLOB,
 created_at INTEGER NOT NULL,
 updated_at INTEGER NOT NULL,
 FOREIGN KEY (source_file) REFERENCES memory_files(path) ON DELETE CASCADE
 )
 `);

  // Check for embedding_norm column safely
  let hasNorm = false;
  try {
    const stmt = db.prepare("PRAGMA table_info(chunks)");
    while (stmt.step()) {
      const row = stmt.getAsObject() as any;
      if (row.name === "embedding_norm") {
        hasNorm = true;
        break;
      }
    }
    stmt.free();
  } catch {}

  if (!hasNorm) {
    try {
      db.run(`
        ALTER TABLE chunks ADD COLUMN embedding_norm REAL GENERATED ALWAYS AS (length(embedding)) VIRTUAL
      `);
    } catch {
      // Ignore if virtual column cannot be added
    }
  }

  // FTS4 virtual table for keyword search (sql.js compatible — the bundled
  // sql.js build has NO fts5 module, only fts4). SearchEngine also creates a
  // chunks_fts4 mirror for databases that were created by the Rust backend
  // (which uses FTS5). Using FTS4 here avoids the CREATE crash and means the
  // triggers keep the FTS index in sync automatically.
  db.run(`
  CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts4 USING fts4(
  content,
  source_file,
  chunk_index
  )
  `);

  // Triggers to keep FTS in sync
  db.run(`
  CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
  INSERT INTO chunks_fts4(docid, content, source_file, chunk_index)
  VALUES (new.rowid, new.content, new.source_file, new.chunk_index);
  END;

  CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
  DELETE FROM chunks_fts4 WHERE docid = old.rowid;
  END;

  CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
  UPDATE chunks_fts4 SET content = new.content, source_file = new.source_file, chunk_index = new.chunk_index
  WHERE docid = new.rowid;
  END;
  `);

  // Indexes for better query performance
  db.run(`
  CREATE INDEX IF NOT EXISTS idx_chunks_source_file ON chunks(source_file);
  CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks(embedding) WHERE embedding IS NOT NULL;
  CREATE INDEX IF NOT EXISTS idx_memory_files_type ON memory_files(type);
  `);
  try {
    db.run(`CREATE INDEX IF NOT EXISTS idx_chunks_embedding_norm ON chunks(embedding_norm);`);
  } catch {}
}

export function getSchemaVersion(db: initSqlJs.Database): number {
  try {
    const stmt = db.prepare('SELECT value FROM metadata WHERE key = ?');
    stmt.bind(['schema_version']);
    if (stmt.step()) {
      const result = stmt.getAsObject() as { value?: string };
      stmt.free();
      if (result?.value) return parseInt(result.value, 10) || 0;
    } else {
      stmt.free();
    }
  } catch {
    // try pheromone_meta
  }
  try {
    const stmt = db.prepare('SELECT value FROM pheromone_meta WHERE key = ?');
    stmt.bind(['schema_version']);
    if (stmt.step()) {
      const result = stmt.getAsObject() as { value?: string };
      stmt.free();
      if (result?.value) return parseInt(result.value, 10) || 0;
    } else {
      stmt.free();
    }
  } catch {
    // neither exists
  }
  return 0;
}

export function setSchemaVersion(db: initSqlJs.Database, version: number): void {
  try {
    const stmt = db.prepare('INSERT OR REPLACE INTO metadata (key, value) VALUES (?, ?)');
    stmt.bind(['schema_version', version.toString()]);
    stmt.run();
    stmt.free();
  } catch {}
  try {
    const stmt2 = db.prepare('INSERT OR REPLACE INTO pheromone_meta (key, value) VALUES (?, ?)');
    stmt2.bind(['schema_version', version.toString()]);
    stmt2.run();
    stmt2.free();
  } catch {}
}
