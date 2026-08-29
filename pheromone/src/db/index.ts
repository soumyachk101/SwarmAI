import initSqlJs from 'sql.js';
import { FileSystemPort } from '../ports.js';
import { initializeSchema, getSchemaVersion, setSchemaVersion } from './schema.js';

const CURRENT_SCHEMA_VERSION = 1;

export class PheromoneDatabase {
 private db: initSqlJs.Database;
 private projectPath: string;
 private dbPath: string;
 private fs: FileSystemPort | undefined;

 constructor(projectPath: string, db: initSqlJs.Database, fs?: FileSystemPort) {
 this.projectPath = projectPath;
 this.db = db;
 this.dbPath = `${projectPath}/.pheromone/pheromone.db`;
 this.fs = fs;
 this.migrate();
 }

 static async create(projectPath: string, fsPort?: FileSystemPort): Promise<PheromoneDatabase> {
 const SQL = await initSqlJs();
 const dbPath = `${projectPath}/.pheromone/pheromone.db`;

 let db: initSqlJs.Database;
 try {
 const u8 = await fsPort!.readFile(dbPath, 'utf-8').then((s: string) => {
 const a = new Uint8Array(s.length);
 for (let i = 0; i < s.length; i++) a[i] = s.charCodeAt(i);
 return a;
 });
 db = new SQL.Database(u8);
 } catch {
 db = new SQL.Database();
 }

 return new PheromoneDatabase(projectPath, db, fsPort);
 }

 private migrate(): void {
 if (this.tableExists('chunks')) return;
 const version = getSchemaVersion(this.db);
 if (version === 0) {
 initializeSchema(this.db);
 setSchemaVersion(this.db, CURRENT_SCHEMA_VERSION);
 }
 }

 private tableExists(name: string): boolean {
 try {
 const stmt = this.db.prepare(
 "SELECT name FROM sqlite_master WHERE type='table' AND name = ?"
 );
 stmt.bind([name]);
 const found = stmt.step();
 stmt.free();
 return found;
 } catch {
 return false;
 }
 }

 getDatabase(): initSqlJs.Database {
 return this.db;
 }

 async close(): Promise<void> {
 const data = this.db.export();
 const bytes = new Uint8Array(data.length);
 for (let i = 0; i < data.length; i++) bytes[i] = data[i];
 if (this.fs) {
 const base64 = uint8ToBase64(bytes);
 await this.fs.writeFile(this.dbPath, base64, 'utf-8');
 } else {
 const { writeFile } = await import('node:fs/promises');
 await writeFile(this.dbPath, Buffer.from(bytes));
 }
 this.db.close();
 }

 transaction<T>(fn: (db: initSqlJs.Database) => T): T {
 this.db.run('BEGIN TRANSACTION');
 try {
 const result = fn(this.db);
 this.db.run('COMMIT');
 return result;
 } catch (error) {
 this.db.run('ROLLBACK');
 throw error;
 }
 }
}

function uint8ToBase64(bytes: Uint8Array): string {
 let binary = '';
 const chunkSize = 8192;
 for (let i = 0; i < bytes.length; i += chunkSize) {
 const chunk = bytes.subarray(i, i + chunkSize);
 binary += String.fromCharCode.apply(null, Array.from(chunk));
 }
 return btoa(binary);
}
