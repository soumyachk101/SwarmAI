/**
 * Runtime model detection for CLI agents.
 *
 * If the CLI binary is installed on PATH, we probe it by running `--help`
 * and parsing the output. This is a best-effort enhancement — the static
 * catalog (model-catalog.ts) is always the ground truth.
 *
 * IMPORTANT: All Node.js imports are lazy (inside functions) so this module
 * can be safely imported in the Tauri webview / browser environment where
 * `node:child_process` is not available.
 *
 * Detection strategy per CLI:
 * - Claude Code: parse `--help` for `--model` option description
 * - Codex CLI: parse `--help` for `--model` flag
 * - Others: no reliable `--help` output → return empty (use static)
 *
 * Results are cached per CLI for the session. Call clearProbeCache() after
 * installing/upgrading a CLI to re-probe.
 */

// ─── Node.js lazy imports ────────────────────────────────────────────────────
// Top-level `import { execFile } from "node:child_process"` crashes in Tauri's
// webview (browser env). Importing inside functions keeps the module safe to
// load everywhere — the probe simply becomes a no-op when Node.js is absent.

async function getExecFileAsync(): Promise<((cmd: string, args: string[], opts: Record<string, unknown>) => Promise<{ stdout: string }>) | null> {
 try {
 const { execFile } = await import("node:child_process");
 const { promisify } = await import("node:util");
 return promisify(execFile);
 } catch {
 return null;
 }
}

// ─── Constants ───────────────────────────────────────────────────────────────

const PROBE_TIMEOUT = 2_500;
const MAX_BUFFER = 64 * 1024;

// Maps CLI command name → the binary to run
const CLI_COMMANDS: Record<string, string> = {
 "claude": "claude",
 "codex": "codex",
 "aider": "aider",
 "opencode": "opencode",
 "agy": "agy",
 "cline": "cline",
 "kilo": "kilo",
};

// ─── Probe helpers ───────────────────────────────────────────────────────────

async function probeHelp(command: string, args: string[]): Promise<string | null> {
 const execFileAsync = await getExecFileAsync();
 if (!execFileAsync) return null;

 try {
 const { stdout } = await execFileAsync(command, args, {
 timeout: PROBE_TIMEOUT,
 maxBuffer: MAX_BUFFER,
 encoding: "utf-8",
 });
 return stdout;
 } catch {
 return null;
 }
}

/**
 * Extract model names from Claude Code `--help` output.
 * Looks for the `--model` option description line.
 */
function parseClaudeHelp(output: string): string[] {
 const models: string[] = [];

 // Pattern: --model <model> followed by description containing model names
 const modelSection = output.match(/--model\s+\S+\s+(.*?)(?:\n\n|\n\s*--)/s);
 if (!modelSection) return models;

 const desc = modelSection[1];
 // Extract model identifiers: sonnet, opus, haiku, fable (with optional version/context tags)
 const matches = desc.match(/\b(sonnet|opus|haiku|fable)[\w\[\]\.\-\s]*?\b/gi);
 if (!matches) return models;

 // Normalize and deduplicate
 const seen = new Set<string>();
 for (const raw of matches) {
 const cleaned = raw.toLowerCase().replace(/\s+/g, "").trim();
 if (!seen.has(cleaned)) {
 seen.add(cleaned);
 models.push(cleaned);
 }
 }
 return models;
}

/**
 * Extract model names from Codex CLI `--help` output.
 */
function parseCodexHelp(output: string): string[] {
 const models: string[] = [];

 // Pattern: --model followed by available model names
 const modelSection = output.match(/--model\s+\S+\s+(.*?)(?:\n\n|\n\s*--)/s);
 if (!modelSection) return models;

 const desc = modelSection[1];
 const matches = desc.match(/\b(gpt-[\w]+|o[\d]-[\w]+|claude-[\w]+|gemini-[\w]+)\b/gi);
 if (!matches) return models;

 const seen = new Set<string>();
 for (const raw of matches) {
 const cleaned = raw.toLowerCase();
 if (!seen.has(cleaned)) {
 seen.add(cleaned);
 models.push(cleaned);
 }
 }
 return models;
}

// ─── Per-CLI detection ───────────────────────────────────────────────────────

async function detectModelsViaHelp(cliId: string): Promise<string[]> {
 switch (cliId) {
 case "claude": {
 const output = await probeHelp("claude", ["--help"]);
 if (!output) return [];
 return parseClaudeHelp(output);
 }

 case "codex": {
 const output = await probeHelp("codex", ["--help"]);
 if (!output) return [];
 return parseCodexHelp(output);
 }

 default:
 return [];
 }
}

// ─── Public API ──────────────────────────────────────────────────────────────

const probeCache = new Map<string, { models: string[]; detectedAt: number }>();

/**
 * Probe the installed CLI for available models.
 * Returns model cliFlags that were detected, or empty array if probing failed.
 * Safe to call in browser environment — returns [] when Node.js is unavailable.
 */
export async function probeCliModels(cliId: string): Promise<string[]> {
 const command = CLI_COMMANDS[cliId];
 if (!command) return [];

 const cacheKey = `${cliId}:${command}`;
 const cached = probeCache.get(cacheKey);
 if (cached && Date.now() - cached.detectedAt < 5 * 60_000) {
 return cached.models;
 }

 const detected = await detectModelsViaHelp(cliId);
 probeCache.set(cacheKey, { models: detected, detectedAt: Date.now() });
 return detected;
}

/**
 * Clear the probe cache. Call after installing/upgrading a CLI.
 */
export function clearProbeCache(): void {
 probeCache.clear();
}

/**
 * Get probe status for a CLI — whether it was probed and when.
 */
export function getProbeStatus(cliId: string): { probed: boolean; detectedAt: number | null } {
 const command = CLI_COMMANDS[cliId];
 if (!command) return { probed: false, detectedAt: null };

 const cached = probeCache.get(`${cliId}:${command}`);
 return {
 probed: !!cached,
 detectedAt: cached?.detectedAt ?? null,
 };
}
