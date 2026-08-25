/**
 * Turn "open Claude Code with Opus 5 on medium effort" into the flags that CLI
 * actually takes. Every mapping below was read off the installed CLI's --help,
 * not guessed; a CLI with no published flag simply ignores the request rather
 * than being handed something it will reject.
 *
 * AUTO-DETECTION:
 * This module provides CLI flag generation. Runtime auto-detection of available
 * models for any CLI is handled by the React hook (useAutoModelDetection) which
 * calls the Rust Tauri backend (run_cli_probe) for browser environments, and by
 * the static catalog (MODEL_CATALOG) for known CLIs.
 */

import { MODEL_CATALOG } from "./model-catalog.js";

/** Reasoning/effort levels, in the vocabulary Lead speaks. */
export type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max" | "ultracode" | "ultra";

export const EFFORT_LEVELS: EffortLevel[] = ["low", "medium", "high", "xhigh", "max", "ultracode", "ultra"];

/** Loose spoken model names → the alias the CLI expects. */
function normaliseModel(cli: string, model: string): string {
	const m = model.trim().toLowerCase();
	if (cli === "claude") {
		if (m === "sonnet 1m" || m === "sonnet-1m" || m === "sonnet5[1m]" || m === "sonnet-5[1m]" || m === "sonnet 5 (1m context)" || m === "sonnet 5 (1m)") return "sonnet[1m]";
		if (m === "opus 1m" || m === "opus-1m" || m === "opus5[1m]" || m === "opus-5[1m]" || m === "opus 5 (1m context)" || m === "opus 5 (1m)") return "opus[1m]";
		if (m === "fable 1m" || m === "fable-1m" || m === "fable5[1m]" || m === "fable-5[1m]" || m === "fable 5 (1m context)" || m === "fable 5 (1m)") return "fable[1m]";
		if (m.includes("[1m]")) return m;
		const alias = m.replace(/\s+/g, "-");
		if (/^(opus|sonnet|haiku|fable)(-\d+(\.\d+)?)?$/.test(alias)) {
			return alias.split("-")[0];
		}
		return model.trim();
	}
	if (cli === "opencode") {
		if (m.startsWith("opencode/")) return "";
		if (m.includes("/")) return m;
		return "";
	}
	return model.trim();
}

/** Normalise human-friendly or UI effort labels to valid CLI keywords */
export function normaliseEffort(effort?: string): EffortLevel | undefined {
	if (!effort) return undefined;
	const e = effort.trim().toLowerCase();
	if (e === "ultracode") return "ultracode";
	if (e === "ultra") return "ultra";
	if (e === "max" || e === "max effort" || e === "maximum") return "max";
	if (e === "xhigh" || e === "extra high" || e === "extra-high" || e === "extra_high") return "xhigh";
	if (e === "high") return "high";
	if (e === "medium" || e === "med") return "medium";
	if (e === "low" || e === "light") return "low";
	if (e === "auto") return "ultracode";
	return (EFFORT_LEVELS as string[]).includes(e) ? (e as EffortLevel) : undefined;
}

/**
 * Flags that select a model and/or an effort level for one CLI.
 * Unknown CLI, or a CLI without the concept, yields nothing.
 */
export function modelArgs(
	cli: string,
	model?: string,
	effort?: string,
): string[] {
	const args: string[] = [];
	const m = model?.trim() ? normaliseModel(cli, model) : undefined;
	const validEffort = normaliseEffort(effort);

	switch (cli) {
		case "claude":
			if (m) args.push("--model", m);
			if (validEffort) args.push("--effort", validEffort);
			break;
		case "codex":
			if (m) args.push("--model", m);
			if (validEffort) {
				args.push("-c", `model_reasoning_effort="${validEffort}"`);
			}
			break;
		case "opencode":
			if (m && m.includes("/")) args.push("--model", m);
			break;
		case "aider":
			if (m) args.push("--model", m);
			break;
		default:
			// kimi / cursor / kiro / kilo / agy / cline: no stable public flag.
			break;
	}
	return args;
}

/**
 * Return the list of model IDs a CLI supports.
 * Always consults the static catalog first; when running in the Tauri app,
 * the React hook (useAutoModelDetection) handles runtime probing via the Rust
 * backend for any additional models not in the catalog.
 */
export function cliSupportedModels(cli: string): string[] {
	const catalogIds = Object.keys(MODEL_CATALOG[cli] ?? {});
	if (catalogIds.length > 0) return catalogIds;
	return [];
}

/**
 * Synchronous check — does this CLI have model support?
 * Uses the static catalog only (no I/O).
 */
export function supportsModel(cli: string): boolean {
	return Object.keys(MODEL_CATALOG[cli] ?? {}).length > 0;
}

/**
 * Synchronous check — can this CLI receive a reasoning-effort flag?
 */
export function supportsEffort(cli: string): boolean {
	return ["claude", "codex"].includes(cli);
}
