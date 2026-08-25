/**
 * Auto-detects available models for a CLI by probing the actual binary
 * via a Tauri command (Rust side runs `cli --help`).
 *
 * Strategy:
 * 1. On mount / CLI change: invoke Tauri `run_cli_probe` to get available model flags
 * 2. Match detected flags against the static catalog
 * 3. Auto-select the first/best matching model
 * 4. If probing fails (CLI not installed, binary missing, timeout), fall back
 * to the static catalog default — never leaves the user without a model.
 *
 * IMPORTANT: This hook MUST NOT use any `node:` imports. All subprocess work
 * goes through the Tauri command (`run_cli_probe`) which runs on the Rust side
 * where `std::process::Command` is available.
 */

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
	getModelsForCli,
	getDefaultModelForCli,
	getModelById,
	cliSupportsModels,
	createDynamicModel,
} from "../cli-configs/model-catalog.js";
import type { AvailableModel } from "../cli-configs/model-catalog.js";

export interface UseAutoModelDetectionResult {
	/** All models that match the detected flags (from static catalog + dynamic CLI probe). */
	detectedModels: AvailableModel[];
	/** The auto-selected model id, or empty string if none available. */
	selectedModel: string;
	/** Whether probing is currently in progress. */
	isDetecting: boolean;
	/** Error from the last probe attempt, if any. */
	error: string | null;
	/** Callback to manually trigger a re-probe. */
	reprobe: () => void;
	/** Call this when the user manually selects a model — stops auto-overwrite. */
	markUserChosen: () => void;
}

const PROBE_TIMEOUT_MS = 8_000;
const CACHE_DURATION_MS = 2 * 60_000; // 2 minutes

// Per-hook-instance cache to avoid redundant probes on rapid re-renders.
const probeCache = new Map<
	string,
	{ flags: string[]; detectedAt: number }
>();

/**
 * Hook: auto-detect models for a CLI by probing the actual binary via Tauri.
 *
 * @param cli - The CLI identifier (e.g. "claude", "codex", "opencode", "agy")
 * @param paneId - The pane id (used for caching key)
 * @param sendToTerminal - Callback to send data to the terminal (for auto-injecting /model)
 */
export function useAutoModelDetection(
	cli: string,
	paneId: string,
	sendToTerminal?: (data: string) => void,
): UseAutoModelDetectionResult {
	const [detectedFlags, setDetectedFlags] = useState<string[]>([]);
	const [selectedModel, setSelectedModel] = useState<string>("");
	const [isDetecting, setIsDetecting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// All models from the static catalog for this CLI
	const staticModels = useMemo(
		() => getModelsForCli(cli),
		[cli],
	);

	const defaultModel = useMemo(
		() => getDefaultModelForCli(cli),
		[cli],
	);

	// Real-time detected models from live CLI probing merged with full suite
	const detectedModels = useMemo(() => {
		const result: AvailableModel[] = [];
		const seenFlags = new Set<string>();

		// 1. Build live model objects for models detected from the CLI
		for (const flag of detectedFlags) {
			const clean = flag.trim();
			const lower = clean.toLowerCase();
			if (!clean || seenFlags.has(lower)) continue;
			seenFlags.add(lower);

			const staticMatch = staticModels.find(
				(m) => m.cliFlag.toLowerCase() === lower || m.id.toLowerCase() === lower,
			);

			if (staticMatch) {
				result.push(staticMatch);
			} else {
				result.push(createDynamicModel(clean, cli));
			}
		}

		// 2. Always ensure all catalog models for the CLI remain in the list
		for (const sm of staticModels) {
			const lower = sm.cliFlag.toLowerCase();
			if (!seenFlags.has(lower)) {
				seenFlags.add(lower);
				result.push(sm);
			}
		}

		return result.length > 0 ? result : staticModels;
	}, [detectedFlags, staticModels, cli]);

	// Track whether the user has manually chosen a model this session.
	const userChosenRef = useRef(false);

	// Reset user-chosen flag when CLI changes.
	useEffect(() => {
		userChosenRef.current = false;
	}, [cli]);

	// Auto-select the best model, but only if the user hasn't manually chosen.
	useEffect(() => {
		if (!cliSupportsModels(cli) && detectedModels.length === 0) {
			setSelectedModel("");
			return;
		}

		// If the user already picked a model, keep it.
		if (userChosenRef.current) return;

		// Prefer first detected model; fall back to catalog default.
		const candidates = detectedModels.length > 0 ? detectedModels : staticModels;
		const best = candidates[0]?.id ?? defaultModel?.id ?? "";
		setSelectedModel(best);
	}, [cli, detectedModels, staticModels, defaultModel]);

	const markUserChosen = useCallback(() => {
		userChosenRef.current = true;
	}, []);

	// Probe the CLI via Tauri
	const probe = useCallback(async () => {
		// Check cache first
		const cacheKey = cli;
		const cached = probeCache.get(cacheKey);
		if (cached && Date.now() - cached.detectedAt < CACHE_DURATION_MS) {
			setDetectedFlags(cached.flags);
			return;
		}

		setIsDetecting(true);
		setError(null);
		try {
			// Call Tauri command that runs the CLI binary on the Rust side
			const flags: string[] = await invoke<string[]>("run_cli_probe", {
				cli,
				timeoutMs: PROBE_TIMEOUT_MS,
			});

			if (Array.isArray(flags) && flags.length > 0) {
				probeCache.set(cacheKey, { flags, detectedAt: Date.now() });
				setDetectedFlags(flags);
			} else {
				setDetectedFlags([]);
			}
		} catch (err) {
			// Probing failed — fall back to static catalog
			setError(String(err));
			setDetectedFlags([]);
		} finally {
			setIsDetecting(false);
		}
	}, [cli]);

	// Trigger probe on mount / CLI change
	useEffect(() => {
		probeCache.delete(cli);
		setDetectedFlags([]);
		setError(null);
		void probe();
	}, [cli, probe]);

	const reprobe = useCallback(() => {
		probeCache.delete(cli);
		setDetectedFlags([]);
		setError(null);
		void probe();
	}, [cli, probe]);

	return {
		detectedModels,
		selectedModel,
		isDetecting,
		error,
		reprobe,
		markUserChosen,
	};
}

