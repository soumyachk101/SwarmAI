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
 provider: "anthropic" | "openai" | "google" | "" | "deepseek" | "local";
 supportsExtendedThinking?: boolean;
 supportsEffortControl?: boolean;
 is1M?: boolean;
 pricing?: string;
}

export const MODEL_CATALOG: Record<string, AvailableModel[]> = {
 "claude": [
 { id: "claude-opus-5", label: "Opus 5 (Recommended)", contextWindow: 200_000, cliFlag: "opus", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$5/$25 Mtok" },
 { id: "claude-opus-5-1m", label: "Opus 5 (1M Context)", contextWindow: 1_000_000, cliFlag: "opus[1m]", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$5/$25 Mtok" },
 { id: "claude-sonnet-5", label: "Sonnet 5 (Routine)", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: false, pricing: "$3/$15 Mtok" },
 { id: "claude-sonnet-5-1m", label: "Sonnet 5 (1M Context)", contextWindow: 1_000_000, cliFlag: "sonnet[1m]", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$3/$15 Mtok" },
 { id: "claude-fable-5", label: "Fable 5 (Reasoning)", contextWindow: 200_000, cliFlag: "fable", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$4/$20 Mtok" },
 { id: "claude-fable-5-1m", label: "Fable 5 (1M Context)", contextWindow: 1_000_000, cliFlag: "fable[1m]", provider: "anthropic", supportsExtendedThinking: true, supportsEffortControl: true, is1M: true, pricing: "$4/$20 Mtok" },
 { id: "claude-haiku-4-5", label: "Haiku 4.5 (Fast)", contextWindow: 200_000, cliFlag: "haiku", provider: "anthropic", supportsEffortControl: true, is1M: false, pricing: "$1/$5 Mtok" },
 ],

 "codex": [
 { id: "codex-5-6-sol", label: "5.6 Sol", contextWindow: 400_000, cliFlag: "5.6-sol", provider: "openai", supportsEffortControl: true, is1M: true },
 { id: "codex-5-6-terra", label: "5.6 Terra", contextWindow: 400_000, cliFlag: "5.6-terra", provider: "openai", supportsEffortControl: true, is1M: true },
 { id: "codex-5-6-luna", label: "5.6 Luna", contextWindow: 400_000, cliFlag: "5.6-luna", provider: "openai", supportsEffortControl: true, is1M: true },
 { id: "codex-5-5", label: "5.5", contextWindow: 400_000, cliFlag: "5.5", provider: "openai", is1M: false },
 { id: "codex-5-4", label: "5.4", contextWindow: 400_000, cliFlag: "5.4", provider: "openai", is1M: false },
 { id: "codex-5-4-mini", label: "5.4 Mini", contextWindow: 400_000, cliFlag: "5.4-mini", provider: "openai", is1M: false },
 ],

 "opencode": [
 { id: "opencode-nemotron-3-5", label: "Nemotron 3.5 Lightning (Zen)", contextWindow: 128_000, cliFlag: "opencode/nemotron-3.5-lightning", provider: "", pricing: "Free" },
 { id: "opencode-nemotron-3-ultra", label: "Nemotron 3 Ultra Free (Zen)", contextWindow: 128_000, cliFlag: "opencode/nemotron-3-ultra", provider: "", pricing: "Free" },
 { id: "opencode-zen", label: "OpenCode Zen", contextWindow: 128_000, cliFlag: "opencode/zen", provider: "", pricing: "Free" },
 { id: "opencode-deepseek-v4", label: "DeepSeek V4 Flash Free", contextWindow: 128_000, cliFlag: "opencode/deepseek-v4-flash", provider: "", pricing: "Free" },
 { id: "opencode-laguna", label: "Laguna S 2.1 Free", contextWindow: 128_000, cliFlag: "opencode/laguna-s-2.1", provider: "", pricing: "Free" },
 { id: "opencode-hy3", label: "Hy3 Free", contextWindow: 128_000, cliFlag: "opencode/hy3", provider: "", pricing: "Free" },
 { id: "opencode-mimo", label: "MiMo V2.5 Free", contextWindow: 128_000, cliFlag: "opencode/mimo-v2.5", provider: "", pricing: "Free" },
 { id: "opencode-auto", label: "Auto", contextWindow: 128_000, cliFlag: "/auto", provider: "", pricing: "Free" },
 ],

 "agy": [
 { id: "agy-gemini-3-7-flash", label: "Gemini 3.7 Flash (Ultra Realtime)", contextWindow: 1_000_000, cliFlag: "gemini-3.7-flash", provider: "google", is1M: true },
 { id: "agy-gemini-3-6-flash", label: "Gemini 3.6 Flash (1M Context)", contextWindow: 1_000_000, cliFlag: "gemini-3.6-flash", provider: "google", is1M: true },
 { id: "agy-gemini-3-5-flash", label: "Gemini 3.5 Flash", contextWindow: 1_000_000, cliFlag: "gemini-3.5-flash", provider: "google", is1M: true },
 { id: "agy-gemini-3-1-pro", label: "Gemini 3.1 Pro (2M Context)", contextWindow: 2_000_000, cliFlag: "gemini-3.1-pro", provider: "google", is1M: true },
 { id: "agy-claude-5-sonnet", label: "Claude 5 Sonnet", contextWindow: 200_000, cliFlag: "claude-5-sonnet", provider: "anthropic", is1M: true },
 { id: "agy-deepseek-r1", label: "DeepSeek-R1 (671B CoT)", contextWindow: 64_000, cliFlag: "deepseek-r1", provider: "deepseek", is1M: false },
 ],

 "aider": [
 { id: "aider-sonnet", label: "Claude Sonnet", contextWindow: 200_000, cliFlag: "sonnet", provider: "anthropic" },
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
 ],

 "kilo": [
 { id: "kilo-default", label: "Default", contextWindow: 128_000, cliFlag: "default", provider: "openai" },
 ],

 // No model selection available for these CLIs
 "kimi": [],
 "cursor": [],
 "kiro": [],
};

// ─── Lookup helpers ──────────────────────────────────────────────────────────

export function getModelsForCli(cliId: string): AvailableModel[] {
 return MODEL_CATALOG[cliId] ?? [];
}

export function getDefaultModelForCli(cliId: string): AvailableModel | undefined {
 return MODEL_CATALOG[cliId]?.[0];
}

export function getModelById(cliId: string, modelId: string): AvailableModel | undefined {
 return MODEL_CATALOG[cliId]?.find(m => m.id === modelId);
}

export function cliSupportsModels(cliId: string): boolean {
 return (MODEL_CATALOG[cliId]?.length ?? 0) > 0;
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
