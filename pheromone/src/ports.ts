/**
 * FileSystemPort — the minimum filesystem surface MemoryManager needs.
 *
 * Node implementation lives in this file; the desktop app can supply a
 * Tauri-backed one (via `invoke('read_file')`, etc.) when MemoryManager runs
 * in the renderer. Neither implementation is imported by the core.
 */

export interface FileSystemPort {
 /** Create a directory (optionally recursive). */
 mkdir(dir: string, options?: { recursive?: boolean }): Promise<void>;
 /** Throws if the path doesn't exist. */
 access(path: string): Promise<void>;
 /** Read a file as utf-8 text. */
 readFile(path: string, encoding: 'utf-8'): Promise<string>;
 /** Write text content to a file. */
 writeFile(path: string, content: string, encoding: 'utf-8'): Promise<void>;
 /** List filenames in a directory. */
 readdir(dir: string): Promise<string[]>;
 /** Returns true if the path exists. */
 exists(path: string): Promise<boolean>;
}

/** Node.js implementation using node:fs/promises. */
export class NodeFileSystem implements FileSystemPort {
 private async getFs() {
 return import('fs/promises');
 }

 async mkdir(dir: string, options?: { recursive?: boolean }): Promise<void> {
 const fs = await this.getFs();
 await fs.mkdir(dir, options);
 }
 async access(path: string): Promise<void> {
 const fs = await this.getFs();
 await fs.access(path);
 }
 async readFile(path: string, encoding: 'utf-8'): Promise<string> {
 const fs = await this.getFs();
 return fs.readFile(path, encoding);
 }
 async writeFile(path: string, content: string, encoding: 'utf-8'): Promise<void> {
 const fs = await this.getFs();
 await fs.writeFile(path, content, encoding);
 }
 async readdir(dir: string): Promise<string[]> {
 const fs = await this.getFs();
 return fs.readdir(dir);
 }
 async exists(path: string): Promise<boolean> {
 const fs = await this.getFs();
 try {
 await fs.access(path);
 return true;
 } catch {
 return false;
 }
 }
}
