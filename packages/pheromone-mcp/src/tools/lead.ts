import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { toMcpTools, MODE_SYSTEM_PROMPTS } from '@swarm/lead';

export const IS_LEAD = process.env.SWARM_LEAD === '1';

const LEAD_ROLE_TOOL = {
  name: 'lead_role',
  description:
    "Read your Lead charter AND the map of your territory: which project folder you lead, its git worktrees, its panes and its board. Several projects may be open at once — this tells you which one is yours. Call this first, before planning or acting.",
  inputSchema: { type: 'object' as const, properties: {}, required: [] as string[] },
};

export const LEAD_TOOLS = [LEAD_ROLE_TOOL, ...toMcpTools('Steward')];
export const LEAD_TOOL_NAMES = new Set(LEAD_TOOLS.map((t) => t.name));

const POLL_MS = 150;
const TIMEOUT_MS = 120_000;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function runLeadTool(
  projectPath: string,
  name: string,
  args: Record<string, unknown>,
): Promise<{ text: string }> {
  if (!projectPath) return { text: 'Error: no project path — Swarm did not pass --project.' };

  const dir = join(projectPath, '.pheromone', 'lead');
  await mkdir(dir, { recursive: true });

  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const reqPath = join(dir, `req-${id}.json`);
  const resPath = join(dir, `res-${id}.json`);
  const tmpPath = join(dir, `tmp-${id}.json`);

  const payload = JSON.stringify({ id, tool: name, args, paneId: process.env.SWARM_PANE_ID, ts: Date.now() });
  await writeFile(tmpPath, payload, 'utf8');
  // Atomic rename for the request file so the app never reads a half-written file.
  await rename(tmpPath, reqPath);

  const deadline = Date.now() + TIMEOUT_MS;
  try {
    while (Date.now() < deadline) {
      try {
        const raw = await readFile(resPath, 'utf8');
        const res = JSON.parse(raw);
        return { text: String(res?.text ?? '') };
      } catch {
        // not answered yet
      }
      await sleep(POLL_MS);
    }
    if (name === 'lead_role') {
      try {
        const roleText = await readFile(join(projectPath, '.pheromone', 'lead', 'ROLE.md'), 'utf8');
        return { text: roleText };
      } catch {
        return { text: MODE_SYSTEM_PROMPTS.Steward };
      }
    }
    return { text: `Error: Swarm did not answer ${name} within ${TIMEOUT_MS / 1000}s.` };
  } finally {
    await rm(reqPath, { force: true }).catch(() => {});
    await rm(resPath, { force: true }).catch(() => {});
  }
}
