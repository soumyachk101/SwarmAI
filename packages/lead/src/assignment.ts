import type { LeadTask, Assignment } from './types.js';

export interface AssignmentStrategy {
 name: string;
 assign(tasks: LeadTask[]): Assignment[];
}

export class DefaultAssignmentStrategy implements AssignmentStrategy {
 name = 'default';
 private availableClis = ['claude', 'codex', 'opencode', 'kilo', 'cline', 'agy', 'cursor', 'gemini', 'droid', 'aider'];

 assign(tasks: LeadTask[]): Assignment[] {
 const assignments: Assignment[] = [];

 if (tasks.length > 0) {
 assignments.push({
 taskId: 'coordinator',
 cli: 'claude',
 role: 'coordinator',
 });
 }

 for (const task of tasks) {
 const cli = task.suggestedCli && this.availableClis.includes(task.suggestedCli)
 ? task.suggestedCli
 : this.availableClis[Math.floor(Math.random() * this.availableClis.length)];
 const role = task.suggestedRole === 'scout'
 ? 'scout'
 : task.suggestedRole === 'reviewer'
 ? 'reviewer'
 : 'builder';
 assignments.push({
 taskId: task.id,
 cli,
 role,
 });
 }

 if (tasks.length > 0) {
 assignments.push({
 taskId: 'reviewer',
 cli: 'claude',
 role: 'reviewer',
 });
 }

 return assignments;
 }
}
