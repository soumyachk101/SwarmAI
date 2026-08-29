/**
 * Static model catalog for CLI agents.
 *
 * This IS the single source of truth for which models each CLI supports.
 * The `cliFlag` is the exact string passed to the CLI's `--model` flag.
 * The `label` is what the UI renders.
 *
 * Add new CLIs/models here. The reactive hook (useModelCatalog) and the
 * runtime prober (model-detection) both build on top of this.
 */

export interface AvailableModel {
  id: string;
  label: string;
  contextWindow: number;
  cliFlag: string;
  provider: "anthropic" | "openai" | "google" | "" | "deepseek" | "local" | "qwen" | "moonshot";
  supportsExtendedThinking?: boolean;
  supportsEffortControl?: boolean;
  is1M?: boolean;
  pricing?: string;
}

export const MODEL_CATALOG: Record<string, AvailableModel[]> = {
  "claude": [
    { id: "claude-opus-5-1m", label: "Opus 5 (1M Context)", contextWindow: 1_000_000, cliFlag: "opus[1m]", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$5/$25 Mtok" },
    { id: "claude-sonnet-5", label: "Sonnet 5 (Routine)", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: false, pricing: "$3/$15 Mtok" },
    { id: "claude-sonnet-5-1m", label: "Sonnet 5 (1M Context)", contextWindow: 1_000_000, cliFlag: "sonnet[1m]", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$3/$15 Mtok" },
    { id: "claude-fable-5", label: "Fable 5 (Reasoning)", contextWindow: 200_000, cliFlag: "fable", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$4/$20 Mtok" },
    { id: "claude-fable-5-1m", label: "Fable 5 (1M Context)", contextWindow: 1_000_000, cliFlag: "fable[1m]", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$4/$20 Mtok" },
    { id: "claude-haiku-4-5", label: "Haiku 4.5 (Fast)", contextWindow: 200_000, cliFlag: "haiku", provider: "anthropic", supportsEffortControl: true, is1M: false, pricing: "$1/$5 Mtok" },
  ],

  "codex": [
    { id: "codex-5-6-terra", label: "5.6 Terra (Default)", contextWindow: 400_000, cliFlag: "5.6-terra", provider: "openai", supportsEffortControl: true, is1M: true },
    { id: "codex-5-6-sol", label: "5.6 Sol (Flagship)", contextWindow: 400_000, cliFlag: "5.6-sol", provider: "openai", supportsEffortControl: true, is1M: true },
    { id: "codex-5-6-luna", label: "5.6 Luna", contextWindow: 400_000, cliFlag: "5.6-luna", provider: "openai", supportsEffortControl: true, is1M: true },
    { id: "codex-5-5", label: "5.5", contextWindow: 400_000, cliFlag: "5.5", provider: "openai", is1M: false },
    { id: "codex-5-4", label: "5.4", contextWindow: 400_000, cliFlag: "5.4", provider: "openai", is1M: false },
    { id: "codex-o3", label: "o3 Reasoning", contextWindow: 200_000, cliFlag: "o3", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-o3-mini", label: "o3-mini", contextWindow: 200_000, cliFlag: "o3-mini", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-o4-mini", label: "o4-mini", contextWindow: 200_000, cliFlag: "o4-mini", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-o1-pro", label: "o1 Pro", contextWindow: 200_000, cliFlag: "o1-pro", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-gpt-5-1", label: "GPT-5.1", contextWindow: 256_000, cliFlag: "gpt-5.1", provider: "openai", is1M: false },
    { id: "codex-gpt-5-1-codex", label: "GPT-5.1 Codex", contextWindow: 256_000, cliFlag: "gpt-5.1-codex", provider: "openai", is1M: false },
    { id: "codex-gpt-5", label: "GPT-5 Preview", contextWindow: 256_000, cliFlag: "gpt-5", provider: "openai", is1M: false },
  ],

  "opencode": [
    { id: "opencode-claude-opus-5", label: "Claude Opus 5", contextWindow: 200_000, cliFlag: "opencode/claude-opus-5", provider: "anthropic", is1M: true },
    { id: "opencode-claude-sonnet-5", label: "Claude Sonnet 5", contextWindow: 200_000, cliFlag: "opencode/claude-sonnet-5", provider: "anthropic", is1M: false },
    { id: "opencode-claude-fable-5", label: "Claude Fable 5", contextWindow: 200_000, cliFlag: "opencode/claude-fable-5", provider: "anthropic", is1M: true },
    { id: "opencode-claude-haiku-4-5", label: "Claude Haiku 4.5", contextWindow: 200_000, cliFlag: "opencode/claude-haiku-4-5", provider: "anthropic", is1M: false },
    { id: "opencode-deepseek-v4-flash", label: "DeepSeek V4 Flash", contextWindow: 128_000, cliFlag: "opencode/deepseek-v4-flash", provider: "deepseek", pricing: "Free" },
    { id: "opencode-deepseek-v4-pro", label: "DeepSeek V4 Pro", contextWindow: 128_000, cliFlag: "opencode/deepseek-v4-pro", provider: "deepseek", pricing: "Fast" },
    { id: "opencode-gemini-3-7-flash", label: "Gemini 3.7 Flash", contextWindow: 1_000_000, cliFlag: "opencode/gemini-3.7-flash", provider: "google", is1M: true },
    { id: "opencode-gemini-3-6-flash", label: "Gemini 3.6 Flash", contextWindow: 1_000_000, cliFlag: "opencode/gemini-3.6-flash", provider: "google", is1M: true },
    { id: "opencode-gemini-3-5-flash", label: "Gemini 3.5 Flash", contextWindow: 1_000_000, cliFlag: "opencode/gemini-3.5-flash", provider: "google", is1M: true },
    { id: "opencode-gemini-3-1-pro", label: "Gemini 3.1 Pro", contextWindow: 2_000_000, cliFlag: "opencode/gemini-3.1-pro", provider: "google", is1M: true },
    { id: "opencode-gpt-5-1-codex", label: "GPT-5.1 Codex", contextWindow: 256_000, cliFlag: "opencode/gpt-5.1-codex", provider: "openai" },
    { id: "opencode-gpt-5-1", label: "GPT-5.1", contextWindow: 256_000, cliFlag: "opencode/gpt-5.1", provider: "openai" },
    { id: "opencode-gpt-5", label: "GPT-5", contextWindow: 256_000, cliFlag: "opencode/gpt-5", provider: "openai" },
    { id: "opencode-glm-5-2", label: "GLM 5.2", contextWindow: 128_000, cliFlag: "opencode/glm-5.2", provider: "", pricing: "Fast" },
  ],

  "agy": [
    { id: "agy-gemini-3-7-flash", label: "Gemini 3.7 Flash (Ultra Realtime)", contextWindow: 1_000_000, cliFlag: "gemini-3.7-flash", provider: "google", is1M: true },
    { id: "agy-gemini-3-7-pro", label: "Gemini 3.7 Pro (CoT Reasoning)", contextWindow: 2_000_000, cliFlag: "gemini-3.7-pro", provider: "google", is1M: true },
    { id: "agy-gemini-3-6-flash", label: "Gemini 3.6 Flash (1M Context)", contextWindow: 1_000_000, cliFlag: "gemini-3.6-flash", provider: "google", is1M: true },
    { id: "agy-gemini-3-5-flash", label: "Gemini 3.5 Flash", contextWindow: 1_000_000, cliFlag: "gemini-3.5-flash", provider: "google", is1M: true },
    { id: "agy-gemini-3-1-pro", label: "Gemini 3.1 Pro (2M Context)", contextWindow: 2_000_000, cliFlag: "gemini-3.1-pro", provider: "google", is1M: true },
    { id: "agy-gemini-3-0-pro", label: "Gemini 3.0 Pro (1M Context)", contextWindow: 1_000_000, cliFlag: "gemini-3.0-pro", provider: "google", is1M: true },
  ],

  "aider": [
    { id: "aider-sonnet", label: "Claude Sonnet", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic" },
    { id: "aider-opus", label: "Claude Opus", contextWindow: 200_000, cliFlag: "opus", provider: "anthropic" },
    { id: "aider-o3-mini", label: "OpenAI o3-mini", contextWindow: 200_000, cliFlag: "o3-mini", provider: "openai" },
    { id: "aider-gpt-4o", label: "GPT-4o", contextWindow: 128_000, cliFlag: "gpt-4o", provider: "openai" },
    { id: "aider-deepseek-reasoner", label: "DeepSeek R1", contextWindow: 64_000, cliFlag: "deepseek/deepseek-reasoner", provider: "deepseek" },
    { id: "aider-deepseek-chat", label: "DeepSeek V3", contextWindow: 64_000, cliFlag: "deepseek/deepseek-chat", provider: "deepseek" },
    { id: "aider-gemini-2-5-pro", label: "Gemini 2.5 Pro", contextWindow: 1_000_000, cliFlag: "gemini/gemini-2.5-pro", provider: "google" },
  ],

  "cline": [
    { id: "cline-claude-sonnet", label: "Claude Sonnet", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic" },
    { id: "cline-claude-opus", label: "Claude Opus", contextWindow: 200_000, cliFlag: "opus", provider: "anthropic" },
    { id: "cline-gpt-4o", label: "GPT-4o", contextWindow: 128_000, cliFlag: "gpt-4o", provider: "openai" },
    { id: "cline-o3-mini", label: "o3-mini", contextWindow: 200_000, cliFlag: "o3-mini", provider: "openai" },
  ],

  "kilo": [
    { id: "kilo-gpt-4o", label: "GPT-4o", contextWindow: 128_000, cliFlag: "gpt-4o", provider: "openai" },
    { id: "kilo-gpt-4o-mini", label: "GPT-4o Mini", contextWindow: 128_000, cliFlag: "gpt-4o-mini", provider: "openai" },
    { id: "kilo-gpt-4-turbo", label: "GPT-4 Turbo", contextWindow: 128_000, cliFlag: "gpt-4-turbo", provider: "openai" },
    { id: "kilo-o3", label: "o3", contextWindow: 200_000, cliFlag: "o3", provider: "openai" },
    { id: "kilo-o3-pro", label: "o3 Pro", contextWindow: 200_000, cliFlag: "o3-pro", provider: "openai" },
    { id: "kilo-o4-mini", label: "o4-mini", contextWindow: 200_000, cliFlag: "o4-mini", provider: "openai" },
    { id: "kilo-o1-pro", label: "o1 Pro", contextWindow: 200_000, cliFlag: "o1-pro", provider: "openai" },
    { id: "kilo-o1", label: "o1", contextWindow: 200_000, cliFlag: "o1", provider: "openai" },
  ],

  "goose": [
    { id: "goose-gemini-2-5-pro", label: "Gemini 2.5 Pro", contextWindow: 1_000_000, cliFlag: "gemini-2.5-pro", provider: "google", is1M: true },
    { id: "goose-gpt-4o", label: "GPT-4o", contextWindow: 128_000, cliFlag: "gpt-4o", provider: "openai" },
    { id: "goose-deepseek-r1", label: "DeepSeek R1", contextWindow: 64_000, cliFlag: "deepseek-r1", provider: "deepseek" },
    { id: "goose-llama-4", label: "Llama 4 Maverick", contextWindow: 1_000_000, cliFlag: "llama-4-maverick", provider: "", is1M: true },
  ],

  // Model selection for these CLIs is done through their editor/IDE settings,
  // not via CLI flags. Keep empty so the UI doesn't show a model picker for them.
  "kimi": [],
  "cursor": [],
  "kiro": [],
};

// Aliases for long CLI names
MODEL_CATALOG["claude-code"] = MODEL_CATALOG["claude"];
MODEL_CATALOG["cursor-agent"] = MODEL_CATALOG["cursor"];
MODEL_CATALOG["kilo-code"] = MODEL_CATALOG["kilo"];
MODEL_CATALOG["kimi-code"] = MODEL_CATALOG["kimi"];
MODEL_CATALOG["kiro-code"] = MODEL_CATALOG["kiro"];

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function normalizeCliId(cliId: string): string {
  const c = (cliId || "").toLowerCase().trim();
  if (c === "claude-code" || c === "claude") return "claude";
  if (c === "cursor-agent" || c === "cursor") return "cursor";
  if (c === "kilo-code" || c === "kilo") return "kilo";
  if (c === "kimi-code" || c === "kimi") return "kimi";
  if (c === "kiro-code" || c === "kiro") return "kiro";
  return c;
}

export function getModelsForCli(cliId: string): AvailableModel[] {
  const norm = normalizeCliId(cliId);
  return MODEL_CATALOG[norm] ?? MODEL_CATALOG[cliId] ?? [];
}

export function getDefaultModelForCli(cliId: string): AvailableModel | undefined {
  const norm = normalizeCliId(cliId);
  return (MODEL_CATALOG[norm] ?? MODEL_CATALOG[cliId])?.[0];
}

export function getModelById(cliId: string, modelId: string): AvailableModel | undefined {
  const norm = normalizeCliId(cliId);
  const list = MODEL_CATALOG[norm] ?? MODEL_CATALOG[cliId] ?? [];
  return list.find((m) => m.id === modelId || m.cliFlag === modelId || m.label === modelId);
}

export function cliSupportsModels(cliId: string): boolean {
  const norm = normalizeCliId(cliId);
  return ((MODEL_CATALOG[norm] ?? MODEL_CATALOG[cliId])?.length ?? 0) > 0;
}

export function getClisWithModels(): string[] {
  return Object.entries(MODEL_CATALOG)
    .filter(([, models]) => models.length > 0)
    .map(([cliId]) => cliId);
}

export function groupModelsByProvider(models: AvailableModel[]): Record<string, AvailableModel[]> {
  return models.reduce<Record<string, AvailableModel[]>>((acc, m) => {
    const key = m.provider || "Other";
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});
}

/**
 * Dynamically creates an AvailableModel from an arbitrary flag string detected from a CLI in real time.
 */
export function createDynamicModel(flag: string, cliId: string): AvailableModel {
  const cleanFlag = flag.trim();
  const lower = cleanFlag.toLowerCase();

  let provider: AvailableModel["provider"] = "";
  if (lower.includes("anthropic") || lower.includes("claude") || lower.includes("opus") || lower.includes("sonnet") || lower.includes("haiku") || lower.includes("fable")) {
    provider = "anthropic";
  } else if (lower.includes("openai") || lower.includes("gpt") || lower.startsWith("o1") || lower.startsWith("o3") || lower.startsWith("o4") || lower.includes("5.6-") || lower.includes("5.5") || lower.includes("5.4")) {
    provider = "openai";
  } else if (lower.includes("google") || lower.includes("gemini")) {
    provider = "google";
  } else if (lower.includes("deepseek")) {
    provider = "deepseek";
  } else if (lower.includes("qwen")) {
    provider = "qwen";
  } else if (lower.includes("moonshot") || lower.includes("kimi")) {
    provider = "moonshot";
  }

  const ONE_M_TOKEN_PREFIXES = [
 'claude-3-5-sonnet', 'claude-3-5-haiku', 'claude-3-opus',
 'claude-sonnet-4', 'claude-opus-4', 'claude-fable-5',
 'gpt-4o', 'gpt-4-turbo', 'gpt-4-1106', 'gpt-4-0125',
 'o1', 'o1-mini', 'o3', 'o3-mini',
 'gemini-2.5', 'gemini-2.0',
 'deepseek-r1',
 ];
 const is1M = ONE_M_TOKEN_PREFIXES.some(p => lower.startsWith(p))
 || lower.includes('128k') || lower.includes('200k') || lower.includes('1m');
  const isFree = lower.includes(":free") || lower.includes("free") || lower.includes("zen") || lower.startsWith("opencode/");

  let label = cleanFlag;
  if (cleanFlag.includes("/")) {
    const parts = cleanFlag.split("/");
    const modelPart = parts[parts.length - 1];
    const prefix = parts.length > 2 ? parts[1] : parts[0];
    label = `${formatNamePart(modelPart)} (${formatNamePart(prefix)})`;
  } else {
    label = formatNamePart(cleanFlag);
  }

  return {
    id: `${cliId}-${cleanFlag.replace(/[/.:]/g, "-")}`,
    label,
    cliFlag: cleanFlag,
    contextWindow: (() => {
 let cw = 128_000;
 if (/gemini-2\.5-(pro|flash)/i.test(lower)) cw = 1_048_576;
 else if (/gemini-2\.0/i.test(lower)) cw = 1_048_576;
 else if (/claude-3\.5/i.test(lower)) cw = 200_000;
 else if (/claude-fable/i.test(lower)) cw = 200_000;
 else if (/gpt-4o/i.test(lower)) cw = 128_000;
 else if (/o1/i.test(lower)) cw = 200_000;
 else if (/deepseek/i.test(lower)) cw = 64_000;
 if (is1M) cw = Math.max(cw, 1_000_000);
 return cw;
 })(),
    provider,
    is1M,
    pricing: isFree ? "Free" : undefined,
  };
}

function formatNamePart(s: string): string {
  return s
    .replace(/^openrouter\//i, "")
    .replace(/^opencode\//i, "")
    .replace(/:free$/i, " Free")
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/\bGpt\b/g, "GPT")
    .replace(/\bVl\b/g, "VL")
    .replace(/\bCot\b/g, "CoT")
    .replace(/\bAi\b/g, "AI");
}
