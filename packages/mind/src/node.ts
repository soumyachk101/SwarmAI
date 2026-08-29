/**
 * Node-only implementations of the side-effect ports.
 *
 * Never import this from `core.ts` — it pulls `node:child_process` / `node:fs`
 * and would break the renderer build. The desktop app supplies its own
 * Tauri-backed adapters instead.
 */
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import type { WorktreeInfo, WorktreeOps, HandoffFs } from './ports.js';

export class NodeWorktreeManager implements WorktreeOps {
 constructor(
 private projectPath: string,
 private parentDir?: string,
 ) {
 this.parentDir ||= path.dirname(projectPath);
 }

 private git(args: string[], cwd: string = this.projectPath): string {
 return execFileSync('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf-8' });
 }

 private gitOk(args: string[]): boolean {
 try {
 this.git(args);
 return true;
 } catch {
 return false;
 }
 }

 private branchExists(branch: string): boolean {
 return this.gitOk(['show-ref', '--verify', '--quiet', `refs/heads/${branch}`]);
 }

 private worktreePathForBranch(branch: string): string | null {
 let text: string;
 try {
 text = this.git(['worktree', 'list', '--porcelain']);
 } catch {
 return null;
 }
 const want = `branch refs/heads/${branch}`;
 let current: string | null = null;
 for (const line of text.split(/\r?\n/)) {
 if (line.startsWith('worktree ')) current = line.slice('worktree '.length);
 else if (line === want) return current;
 else if (line === '') current = null;
 }
 return null;
 }

 create(taskId: string): WorktreeInfo {
 try { this.git(['worktree', 'prune']); } catch { /* ignore */ }

 const base = taskId.trim() || 'tree';
 let lastErr = 'git worktree add failed';
 for (let attempt = 0; attempt < 20; attempt++) {
 const tid = attempt === 0 ? base : `${base}-${attempt + 1}`;
 const branch = `agent/${tid}`;
 const worktreePath = path.join(this.parentDir!, `${path.basename(this.projectPath)}-${tid}`);

 // Return early if this branch already has a worktree elsewhere.
 const existing = this.worktreePathForBranch(branch);
 if (existing) {
 return { path: existing, branch, taskId: tid };
 }

 // Removed the fs.existsSync pre-check: it created a TOCTOU race where
 // another process could create the worktree between the check and the
 // git command below. The retry loop handles collisions from git itself.

 try {
 if (this.branchExists(branch)) {
 this.git(['worktree', 'add', worktreePath, branch]);
 } else {
 this.git(['worktree', 'add', worktreePath, '-b', branch]);
 }
 return { path: worktreePath, branch, taskId: tid };
 } catch (e: unknown) {
 lastErr = (e instanceof Error && typeof (e as any).stderr === "string") ? String((e as any).stderr) : e instanceof Error ? e.message : String(e);
 const lower = lastErr.toLowerCase();
 if (
 lower.includes('already exists') ||
 lower.includes('already checked out') ||
 lower.includes('is a subdirectory of an existing worktree')
 ) {
 continue;
 }
 throw new Error(`git worktree add failed: ${lastErr}`);
 }
 }
 throw new Error(`git worktree add failed after 20 attempts: ${lastErr}`);
 }

 remove(worktreePath: string): void {
 this.git(['worktree', 'remove', '--force', worktreePath], this.projectPath);
 }

 mergeAndRemove(worktreePath: string, branchName: string): void {
 this.git(['merge', '--no-ff', branchName], this.projectPath);
 this.remove(worktreePath);
 }

 exists(worktreePath: string): boolean {
 return fs.existsSync(worktreePath) && fs.existsSync(path.join(worktreePath, '.git'));
 }
}

/** Back-compat alias — this was the pre-port class name. */
export { NodeWorktreeManager as WorktreeManager };

export const nodeHandoffFs: HandoffFs = {
 mkdir: (dir) => fsp.mkdir(dir, { recursive: true }).then(() => undefined),
 writeFile: (file, content) => fsp.writeFile(file, content, 'utf-8'),
 readFile: (file) => fsp.readFile(file, 'utf-8'),
 readDir: (dir) => fsp.readdir(dir),
};
