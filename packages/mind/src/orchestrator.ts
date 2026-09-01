import { AgentRegistry, type AgentStatus } from './registry/index.js';
import { LockRegistry, type LockConflict } from './locks/index.js';
import { RoleManager, type Role } from './roles/index.js';
// Type-only: erased at compile time, so the core stays free of Node built-ins.
import type { WorktreeOps, WorktreeInfo } from './ports.js';
import type { HandoffManager } from './handoffs/index.js';

const DEFAULT_TIMEOUT_MS = 30_000;

async function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
 let timeoutId: ReturnType<typeof setTimeout>;
 const timeoutPromise = new Promise<never>((_, reject) => {
 timeoutId = setTimeout(() => reject(new Error(`Timeout after ${ms}ms: ${label}`)), ms);
 });
 try {
 return await Promise.race([promise, timeoutPromise]);
 } finally {
 clearTimeout(timeoutId);
 }
}

function safeUUID(): string {
	if (typeof crypto !== 'undefined' && crypto.randomUUID) {
		return crypto.randomUUID();
	}
	// Fallback: cryptographically-stronger than Math.random
	const array = new Uint8Array(16);
	if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
		crypto.getRandomValues(array);
	} else {
		// Last resort: timestamp + Math.random (still better than pure Math.random)
		const timestamp = Date.now().toString(36);
		const randPart = Array.from({ length: 8 }, () =>
			Math.floor(Math.random() * 36).toString(36)
		).join('');
		return `${timestamp}-${randPart}`;
	}
	// Convert to standard UUID format
	const hex = Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export interface TaskSpec {
 id: string;
 description: string;
 owns: string[];
 reads: string[];
 dependsOn: string[];
 role: Role;
 cli: string;
 missionId: string;
}

export interface OrchestrationResult {
 canStart: TaskSpec[];
 blocked: Array<{ task: TaskSpec; reason: string }>;
 conflicts: LockConflict[];
}

export class Orchestrator {
 constructor(
 private registry: AgentRegistry,
 private locks: LockRegistry,
 private worktree: WorktreeOps,
 private handoffs: HandoffManager,
 private roles: RoleManager,
 ) {}

 plan(tasks: TaskSpec[]): OrchestrationResult {
 const canStart: TaskSpec[] = [];
 const blocked: Array<{ task: TaskSpec; reason: string }> = [];
 const allConflicts: LockConflict[] = [];

 const completedTaskIds = new Set(
 this.registry.findByStatus('merged').map(a => a.taskId)
 );

 for (const task of tasks) {
 const unresolvedDeps = task.dependsOn.filter(d => !completedTaskIds.has(d));
 if (unresolvedDeps.length > 0) {
 blocked.push({ task, reason: `Waiting on: ${unresolvedDeps.join(', ')}` });
 continue;
 }

 const roleDef = this.roles.getDefinition(task.role);
 if (roleDef.needsWorktree && task.owns.length > 0) {
 const conflicts = this.locks.acquireMany(task.owns, task.id);
 if (conflicts.length > 0) {
 blocked.push({
 task,
 reason: `File conflict on: ${conflicts.map(c => c.filePath).join(', ')} (owned by task: ${conflicts[0].existingOwner})`,
 });
 allConflicts.push(...conflicts);
 continue;
 }
 }

 canStart.push(task);
 }

 return { canStart, blocked, conflicts: allConflicts };
 }

 async dispatch(task: TaskSpec): Promise<{ agentId: string; worktree?: WorktreeInfo }> {
 const roleDef = this.roles.getDefinition(task.role);
 let worktree: WorktreeInfo | undefined;

 if (roleDef.needsWorktree) {
 // await: WorktreeOps may be async (the desktop app goes through Tauri IPC).
 worktree = await withTimeout(
 this.worktree.create(task.id),
 DEFAULT_TIMEOUT_MS,
 'worktree.create'
 );
 }

 const agentId = `agent-${task.id}-${safeUUID().slice(0, 8)}`;
 this.registry.register({
 id: agentId,
 taskId: task.id,
 cli: task.cli,
 role: task.role,
 worktreePath: worktree?.path || '',
 branchName: worktree?.branch || '',
 paneId: '',
 status: 'running',
 missionId: task.missionId,
 createdAt: Date.now(),
 updatedAt: Date.now(),
 });

 await this.handoffs.write(task.id, {
 taskId: task.id,
 role: task.role,
 status: 'running',
 worktreePath: worktree?.path,
 branchName: worktree?.branch,
 filesTouched: task.owns,
 summary: task.description,
 blocking: [],
 dependsOn: task.dependsOn,
 });

 return { agentId, worktree };
 }

 async complete(agentId: string): Promise<void> {
 const agent = this.registry.get(agentId);
 if (!agent) return;

 this.registry.updateStatus(agentId, 'awaiting-review');
 await this.handoffs.write(agent.taskId, { status: 'awaiting-review' });
 }

 async approve(agentId: string): Promise<void> {
 const agent = this.registry.get(agentId);
 if (!agent) return;

 let merged = false;
 if (agent.worktreePath) {
 try {
 await withTimeout(
 this.worktree.mergeAndRemove(agent.worktreePath, agent.branchName),
 DEFAULT_TIMEOUT_MS,
 'worktree.mergeAndRemove'
 );
 merged = true;
 } catch (e) {
 this.registry.updateStatus(agentId, 'awaiting-review');
 await this.handoffs.write(agent.taskId, {
 status: 'awaiting-review',
 reviewerNotes: `Merge failed: ${(e as Error)?.message || String(e)}`,
 });
 return;
 }
 } else {
 merged = true;
 }

 this.registry.updateStatus(agentId, 'merged');
 this.locks.release(agent.taskId);
 await this.handoffs.write(agent.taskId, { status: 'merged' });
 }

 async reject(agentId: string, reviewerNotes: string): Promise<void> {
 const agent = this.registry.get(agentId);
 if (!agent) return;

 this.registry.updateStatus(agentId, 'failed');
 await this.handoffs.write(agent.taskId, {
 status: 'failed',
 reviewerNotes,
 });
 }

 /** Release all held resources so the instance can be garbage-collected. */
 dispose(): void {
 this.registry.clear();
 this.locks.clear();
 }
}
