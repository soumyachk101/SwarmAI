import type { LeadTask, BreakdownResult } from './types.js';

export interface BreakdownInput {
 goal: string;
 pheromoneContext?: string;
 modelName?: string;
}

export async function callBreakdownLLM(modelName: string, prompt: string): Promise<string> {
 throw new Error('LLM call not configured — provide modelName + API key in host.');
}

export async function breakdown(input: BreakdownInput): Promise<BreakdownResult> {
 const prompt = buildBreakdownPrompt(input);

 const result = templateBreakdown(input.goal);

 // If the caller supplied a modelName, try LLM-based breakdown and prefer it
 // over the template when the response parses cleanly.
 if (input.modelName) {
 try {
 const raw = await callBreakdownLLM(input.modelName, prompt);
 const parsed = parseBreakdownResponse(raw);
 if (parsed.tasks.length > 0) {
 return {
 goal: input.goal,
 tasks: parsed.tasks,
 warnings: parsed.warnings,
 };
 }
 } catch {
 // Fall through to template result below.
 }
 }

 return {
 goal: input.goal,
 tasks: result.tasks,
 warnings: [
 ...result.warnings,
 'LLM-based breakdown not available — used template breakdown instead.',
 ],
 };
}

export function buildBreakdownPrompt(input: BreakdownInput): string {
 return `You are Lead, a planning agent for the Swarm system.

Your job: take a human's goal and break it into tasks that can be executed in parallel by different AI coding agents.

Constraints:
- Each task must declare which files it owns (will write to)
- Each task must declare which files it reads (needs for context only)
- Tasks with overlapping owned files must be sequenced (depends-on)
- Each task gets a role: builder (writes code), scout (investigates), reviewer (checks work)
- Do NOT make tasks too large (one agent turn worth of work) or too small (busywork)

Project context from Pheromone memory:
${input.pheromoneContext || '(no context loaded yet)'}

Human goal: ${input.goal}

Respond with a JSON array of tasks, each with:
{
 "id": "task-1",
 "description": "Implement OAuth login flow",
 "owns": ["src/auth/oauth.ts", "src/auth/session.ts"],
 "reads": ["src/config.ts", "src/db/schema.ts"],
 "dependsOn": [],
 "suggestedRole": "builder",
 "suggestedCli": "opencode"
}`;
}

export function parseBreakdownResponse(raw: string): { tasks: any[]; warnings: string[] } {
 try {
 const parsed = JSON.parse(raw);
 const tasks = Array.isArray(parsed) ? parsed : parsed.tasks || [];
 return { tasks, warnings: [] };
 } catch {
 return { tasks: [], warnings: ['Could not parse breakdown. LLM returned non-JSON response.'] };
 }
}

export function templateBreakdown(goal: string): { tasks: LeadTask[]; warnings: string[] } {
 const warnings: string[] = [];
 const tasks: LeadTask[] = [];
 const lower = goal.toLowerCase();

 if (lower.includes('auth') || lower.includes('login')) {
 tasks.push({
 id: 'task-auth-1',
 description: 'Implement authentication logic (OAuth/JWT/session)',
 owns: ['src/auth/'],
 reads: ['src/config.ts'],
 dependsOn: [],
 suggestedRole: 'builder',
 suggestedCli: 'opencode',
 });
 }

 if (lower.includes('payment') || lower.includes('stripe') || lower.includes('checkout')) {
 tasks.push({
 id: 'task-payment-1',
 description: 'Implement payment processing integration',
 owns: ['src/payments/', 'src/api/webhooks/'],
 reads: ['src/config.ts'],
 dependsOn: [],
 suggestedRole: 'builder',
 suggestedCli: 'opencode',
 });
 }

 if (lower.includes('dashboard') || lower.includes('ui') || lower.includes('frontend')) {
 tasks.push({
 id: 'task-dashboard-1',
 description: 'Build frontend dashboard components',
 owns: ['src/components/', 'src/pages/'],
 reads: ['src/config.ts'],
 dependsOn: [],
 suggestedRole: 'builder',
 suggestedCli: 'opencode',
 });
 }

 if (lower.includes('api') || lower.includes('backend') || lower.includes('server')) {
 tasks.push({
 id: 'task-api-1',
 description: 'Implement backend API endpoints',
 owns: ['src/api/', 'src/routes/'],
 reads: ['src/db/schema.ts'],
 dependsOn: [],
 suggestedRole: 'builder',
 suggestedCli: 'opencode',
 });
 }

 if (tasks.length === 0) {
 tasks.push({
 id: 'task-1',
 description: goal,
 owns: ['src/'],
 reads: [],
 dependsOn: [],
 suggestedRole: 'builder',
 suggestedCli: 'opencode',
 });
 warnings.push('Generic breakdown — no specific pattern matched. LLM-based breakdown recommended.');
 }

 return { tasks, warnings };
}
