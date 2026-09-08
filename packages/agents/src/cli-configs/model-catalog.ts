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
  description?: string;
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
    {
      id: "claude-opus-5-1m",
      label: "Opus 5 (1M Context)",
      description: "Opus 5 with 1M context · Best for everyday, complex tasks",
      contextWindow: 1_000_000,
      cliFlag: "opus[1m]",
      provider: "anthropic",
      supportsExtendedThinking: true,
      supportsEffortControl: true,
      is1M: true,
      pricing: "$5/$25 per Mtok",
    },
    {
      id: "claude-sonnet-5",
      label: "Sonnet 5",
      description: "Sonnet 5 · Efficient for routine tasks",
      contextWindow: 200_000,
      cliFlag: "sonnet",
      provider: "anthropic",
      supportsExtendedThinking: true,
      supportsEffortControl: true,
      is1M: false,
      pricing: "$2/$10 per Mtok",
    },
    {
      id: "claude-sonnet-5-1m",
      label: "Sonnet 5 (1M Context)",
      description: "Sonnet 5 for long sessions",
      contextWindow: 1_000_000,
      cliFlag: "sonnet[1m]",
      provider: "anthropic",
      supportsExtendedThinking: true,
      supportsEffortControl: true,
      is1M: true,
      pricing: "$2/$10 per Mtok",
    },
    {
      id: "claude-haiku-4-5",
      label: "Haiku 4.5",
      description: "Haiku 4.5 · Fastest for quick answers",
      contextWindow: 200_000,
      cliFlag: "haiku",
      provider: "anthropic",
      supportsEffortControl: true,
      is1M: false,
      pricing: "$1/$5 per Mtok",
    },
    {
      id: "claude-fable-5-1-1m",
      label: "Claude Fable 5.1 (1M Context)",
      description: "Fable 5.1 with 1M context window",
      contextWindow: 1_000_000,
      cliFlag: "claude-fable-5.1[1m]",
      provider: "anthropic",
      supportsExtendedThinking: true,
      supportsEffortControl: true,
      is1M: true,
      pricing: "$4/$20 per Mtok",
    },
    {
      id: "claude-fable-5-1",
      label: "Claude Fable 5.1",
      description: "Fable 5.1 (Reasoning)",
      contextWindow: 200_000,
      cliFlag: "claude-fable-5.1",
      provider: "anthropic",
      supportsExtendedThinking: true,
      supportsEffortControl: true,
      is1M: false,
      pricing: "$4/$20 per Mtok",
    },
  ],

  "codex": [
    { id: "codex-5-6-terra", label: "5.6 Terra (Default)", description: "Balanced general-purpose coding & agent execution", contextWindow: 400_000, cliFlag: "5.6-terra", provider: "openai", supportsEffortControl: true, is1M: true },
    { id: "codex-5-6-sol", label: "5.6 Sol (Flagship)", description: "Deepest reasoning & multi-step architectural planning", contextWindow: 400_000, cliFlag: "5.6-sol", provider: "openai", supportsEffortControl: true, is1M: true },
    { id: "codex-5-6-luna", label: "5.6 Luna", description: "Low-latency streaming for rapid iterations", contextWindow: 400_000, cliFlag: "5.6-luna", provider: "openai", supportsEffortControl: true, is1M: true },
    { id: "codex-5-5", label: "5.5", description: "Stable generation engine", contextWindow: 400_000, cliFlag: "5.5", provider: "openai", is1M: false },
    { id: "codex-5-4", label: "5.4", description: "Fast legacy model", contextWindow: 400_000, cliFlag: "5.4", provider: "openai", is1M: false },
    { id: "codex-o3", label: "o3 Reasoning", description: "OpenAI o3 high-reasoning math & logic model", contextWindow: 200_000, cliFlag: "o3", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-o3-mini", label: "o3-mini", description: "Compact reasoning engine", contextWindow: 200_000, cliFlag: "o3-mini", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-o4-mini", label: "o4-mini", description: "Lightweight fast coding", contextWindow: 200_000, cliFlag: "o4-mini", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-o1-pro", label: "o1 Pro", description: "Exhaustive reasoning for hard problems", contextWindow: 200_000, cliFlag: "o1-pro", provider: "openai", supportsEffortControl: true, is1M: false },
    { id: "codex-gpt-5-1", label: "GPT-5.1", description: "Next-gen foundation model", contextWindow: 256_000, cliFlag: "gpt-5.1", provider: "openai", is1M: false },
    { id: "codex-gpt-5-1-codex", label: "GPT-5.1 Codex", description: "Tuned for code generation", contextWindow: 256_000, cliFlag: "gpt-5.1-codex", provider: "openai", is1M: false },
    { id: "codex-gpt-5", label: "GPT-5 Preview", description: "Developer preview build", contextWindow: 256_000, cliFlag: "gpt-5", provider: "openai", is1M: false },
  ],

  "opencode": [
    { id: "opencode-claude-opus-5", label: "Claude Opus 5", description: "Claude Opus 5 (1M Context) via OpenCode", contextWindow: 200_000, cliFlag: "opencode/claude-opus-5", provider: "anthropic", is1M: true, pricing: "$5/$25 per Mtok" },
    { id: "opencode-claude-sonnet-5", label: "Claude Sonnet 5", description: "Claude Sonnet 5 via OpenCode", contextWindow: 200_000, cliFlag: "opencode/claude-sonnet-5", provider: "anthropic", is1M: false, pricing: "$2/$10 per Mtok" },
    { id: "opencode-claude-fable-5-1", label: "Claude Fable 5.1", description: "Claude Fable 5.1 Reasoning via OpenCode", contextWindow: 200_000, cliFlag: "opencode/claude-fable-5.1", provider: "anthropic", is1M: true, pricing: "$4/$20 per Mtok" },
    { id: "opencode-claude-haiku-4-5", label: "Claude Haiku 4.5", description: "Claude Haiku 4.5 via OpenCode", contextWindow: 200_000, cliFlag: "opencode/claude-haiku-4-5", provider: "anthropic", is1M: false, pricing: "$1/$5 per Mtok" },
    { id: "opencode-deepseek-v4-flash", label: "DeepSeek V4 Flash", description: "DeepSeek V4 Flash free tier", contextWindow: 128_000, cliFlag: "opencode/deepseek-v4-flash", provider: "deepseek", pricing: "Free" },
    { id: "opencode-deepseek-v4-pro", label: "DeepSeek V4 Pro", description: "DeepSeek V4 Pro high-throughput tier", contextWindow: 128_000, cliFlag: "opencode/deepseek-v4-pro", provider: "deepseek", pricing: "Fast" },
    { id: "opencode-gemini-3-7-flash", label: "Gemini 3.7 Flash", description: "Gemini 3.7 Flash with 1M context", contextWindow: 1_000_000, cliFlag: "opencode/gemini-3.7-flash", provider: "google", is1M: true, pricing: "$0.10/$0.40 per Mtok" },
    { id: "opencode-gemini-3-6-flash", label: "Gemini 3.6 Flash", description: "Gemini 3.6 Flash with 1M context", contextWindow: 1_000_000, cliFlag: "opencode/gemini-3.6-flash", provider: "google", is1M: true, pricing: "$0.10/$0.40 per Mtok" },
    { id: "opencode-gemini-3-5-flash", label: "Gemini 3.5 Flash", description: "Gemini 3.5 Flash with 1M context", contextWindow: 1_000_000, cliFlag: "opencode/gemini-3.5-flash", provider: "google", is1M: true, pricing: "$0.10/$0.40 per Mtok" },
    { id: "opencode-gemini-3-1-pro", label: "Gemini 3.1 Pro", description: "Gemini 3.1 Pro with 2M massive context", contextWindow: 2_000_000, cliFlag: "opencode/gemini-3.1-pro", provider: "google", is1M: true, pricing: "$1.25/$5 per Mtok" },
    { id: "opencode-gpt-5-1-codex", label: "GPT-5.1 Codex", description: "GPT-5.1 Codex code generation engine", contextWindow: 256_000, cliFlag: "opencode/gpt-5.1-codex", provider: "openai", pricing: "$2/$8 per Mtok" },
    { id: "opencode-gpt-5-1", label: "GPT-5.1", description: "GPT-5.1 foundation model", contextWindow: 256_000, cliFlag: "opencode/gpt-5.1", provider: "openai", pricing: "$2/$8 per Mtok" },
    { id: "opencode-gpt-5", label: "GPT-5", description: "GPT-5 preview model", contextWindow: 256_000, cliFlag: "opencode/gpt-5", provider: "openai", pricing: "$2/$8 per Mtok" },
    { id: "opencode-glm-5-2", label: "GLM 5.2", description: "GLM 5.2 bilingual reasoning model", contextWindow: 128_000, cliFlag: "opencode/glm-5.2", provider: "", pricing: "Fast" },
  ],

  "agy": [
    { id: "agy-gemini-3-7-flash", label: "Gemini 3.7 Flash (Ultra Realtime)", description: "Ultra realtime low latency agentic execution", contextWindow: 1_000_000, cliFlag: "gemini-3.7-flash", provider: "google", is1M: true, pricing: "$0.10/$0.40 per Mtok" },
    { id: "agy-gemini-3-7-pro", label: "Gemini 3.7 Pro (CoT Reasoning)", description: "Advanced Chain-of-Thought reasoning & planning", contextWindow: 2_000_000, cliFlag: "gemini-3.7-pro", provider: "google", is1M: true, pricing: "$1.25/$5 per Mtok" },
    { id: "agy-gemini-3-6-flash", label: "Gemini 3.6 Flash (1M Context)", description: "Balanced fast reasoning with 1M context", contextWindow: 1_000_000, cliFlag: "gemini-3.6-flash", provider: "google", is1M: true, pricing: "$0.10/$0.40 per Mtok" },
    { id: "agy-gemini-3-5-flash", label: "Gemini 3.5 Flash", description: "High-efficiency coding assistant", contextWindow: 1_000_000, cliFlag: "gemini-3.5-flash", provider: "google", is1M: true, pricing: "$0.10/$0.40 per Mtok" },
    { id: "agy-gemini-3-1-pro", label: "Gemini 3.1 Pro (2M Context)", description: "Massive 2M context window deep comprehension", contextWindow: 2_000_000, cliFlag: "gemini-3.1-pro", provider: "google", is1M: true, pricing: "$1.25/$5 per Mtok" },
    { id: "agy-gemini-3-0-pro", label: "Gemini 3.0 Pro (1M Context)", description: "Flagship legacy multi-turn reasoning", contextWindow: 1_000_000, cliFlag: "gemini-3.0-pro", provider: "google", is1M: true, pricing: "$1.25/$5 per Mtok" },
  ],

  "aider": [
    { id: "aider-sonnet", label: "Claude Sonnet", description: "Anthropic Claude Sonnet for pair programming", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic", pricing: "$2/$10 per Mtok" },
    { id: "aider-opus", label: "Claude Opus", description: "Anthropic Claude Opus for complex refactors", contextWindow: 200_000, cliFlag: "opus", provider: "anthropic", pricing: "$5/$25 per Mtok" },
    { id: "aider-o3-mini", label: "OpenAI o3-mini", description: "OpenAI o3-mini fast reasoning", contextWindow: 200_000, cliFlag: "o3-mini", provider: "openai", pricing: "$1.10/$4.40 per Mtok" },
    { id: "aider-gpt-4o", label: "GPT-4o", description: "OpenAI GPT-4o multimodal coding", contextWindow: 128_000, cliFlag: "gpt-4o", provider: "openai", pricing: "$2.50/$10 per Mtok" },
    { id: "aider-deepseek-reasoner", label: "DeepSeek R1", description: "DeepSeek R1 open reasoning engine", contextWindow: 64_000, cliFlag: "deepseek/deepseek-reasoner", provider: "deepseek", pricing: "$0.55/$2.19 per Mtok" },
    { id: "aider-deepseek-chat", label: "DeepSeek V3", description: "DeepSeek V3 rapid chat and code", contextWindow: 64_000, cliFlag: "deepseek/deepseek-chat", provider: "deepseek", pricing: "$0.27/$1.10 per Mtok" },
    { id: "aider-gemini-2-5-pro", label: "Gemini 2.5 Pro", description: "Google Gemini 2.5 Pro with 1M context", contextWindow: 1_000_000, cliFlag: "gemini/gemini-2.5-pro", provider: "google", pricing: "$1.25/$5 per Mtok" },
  ],

  "cline": [
    { id: "cline-claude-sonnet", label: "Claude Sonnet", description: "Anthropic Claude Sonnet", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic", pricing: "$2/$10 per Mtok" },
    { id: "cline-claude-opus", label: "Claude Opus", description: "Anthropic Claude Opus", contextWindow: 200_000, cliFlag: "opus", provider: "anthropic", pricing: "$5/$25 per Mtok" },
    { id: "cline-gpt-4o", label: "GPT-4o", description: "OpenAI GPT-4o", contextWindow: 128_000, cliFlag: "gpt-4o", provider: "openai", pricing: "$2.50/$10 per Mtok" },
    { id: "cline-o3-mini", label: "o3-mini", description: "OpenAI o3-mini", contextWindow: 200_000, cliFlag: "o3-mini", provider: "openai", pricing: "$1.10/$4.40 per Mtok" },
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
  const cleanId = (modelId || "").trim();
  const lower = cleanId.toLowerCase();

  const exact = list.find((m) => m.id === cleanId || m.cliFlag === cleanId || m.label === cleanId);
  if (exact) return exact;

  if (lower.includes("fable")) {
    const is1m = lower.includes("1m") || lower.includes("[1m]");
    return list.find((m) => is1m ? m.id === "claude-fable-5-1-1m" : m.id === "claude-fable-5-1");
  }

  return list.find((m) =>
    (cleanId === "opencode-claude-fable-5" && m.id === "opencode-claude-fable-5-1")
  );
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
