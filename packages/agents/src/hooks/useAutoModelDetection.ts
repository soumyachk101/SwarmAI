import { useEffect, useState, useCallback, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";

import { MODEL_CATALOG, normalizeCliId } from "../cli-configs/model-catalog.js";
import type { AvailableModel } from "../cli-configs/model-catalog.js";

export interface DetectedModel {
	id: string;
	label: string;
	cliFlag: string;
	provider?: string;
	is1M?: boolean;
	pricing?: string;
	/** true when the model was found by runtime probing (not in static catalog) */
	probed?: boolean;
}

export interface AutoModelDetectionState {
	/** All models available for the current CLI (merged catalog + probed) */
	detectedModels: DetectedModel[];
	/** The best model the detection picked automatically */
	selectedModel: string | null;
	/** Currently detecting / probing */
	isDetecting: boolean;
	/** Last error from probing */
	error: string | null;
	/** Mark that the user manually chose a model (stop auto-switching) */
	markUserChosen: () => void;
}

/**
 * Auto-detect available models for any CLI.
 *
 * Strategy:
 * 1. Start with the static catalog (MODEL_CATALOG) — these are always available.
 * 2. Also probe the installed binary via the Rust backend (Tauri IPC) for any
 * models not in the static catalog.
 * 3. Merge probed models into the list, marking them so the UI can style them differently.
 * 4. When the CLI changes, re-detect and auto-select the best model.
 *
 * This means ANY CLI with a `--model` flag will show up automatically — no manual
 * model-catalog entry required.
 */
export function useAutoModelDetection(
	cli: string | undefined,
	_paneId?: string,
): AutoModelDetectionState {
	const [detectedModels, setDetectedModels] = useState<DetectedModel[]>([]);
	const [selectedModel, setSelectedModel] = useState<string | null>(null);
	const [isDetecting, setIsDetecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const userChosenRef = useRef(false);
	const lastCliRef = useRef<string | undefined>(undefined);

	// Convert catalog models to DetectedModel format
	const catalogModels = useCallback(
		(cliId: string): DetectedModel[] => {
			const norm = normalizeCliId(cliId);
			const catalog = MODEL_CATALOG[norm] ?? MODEL_CATALOG[cliId] ?? [];
			return catalog.map(
				(m: AvailableModel): DetectedModel => ({
					id: m.id,
					label: m.label,
					cliFlag: m.cliFlag,
					provider: m.provider || undefined,
					is1M: m.is1M,
					pricing: m.pricing,
					probed: false,
				}),
			);
		},
		[],
	);

	// Detect models whenever the CLI changes
	useEffect(() => {
		if (!cli) return;
		if (cli === lastCliRef.current) return;
		lastCliRef.current = cli;
		userChosenRef.current = false;

		// Start with static catalog models (synchronous, always available)
		const staticModels = catalogModels(cli);

		if (staticModels.length > 0) {
			// Catalog has entries — use them, optionally probe for more
			setDetectedModels(staticModels);
			const best = staticModels[0];
			setSelectedModel(best.id);
			setError(null);

			// Also probe in background for any extra models not in catalog
			probeForMore(cli, staticModels);
		} else {
			// No catalog entry — must probe the binary via Rust backend
			setIsDetecting(true);
			setError(null);
			probeBinary(cli);
		}
	}, [cli, catalogModels]);

	// Probe the CLI binary via the Rust Tauri backend
	const probeBinary = useCallback(
		async (cliId: string) => {
			try {
				const probedIds = await invoke<string[]>("run_cli_probe", {
					cli: cliId,
					timeoutMs: 5000,
				});

				if (probedIds.length === 0) {
					setDetectedModels([]);
					setSelectedModel(null);
					setError("No models detected");
					setIsDetecting(false);
					return;
				}

				const probedModels: DetectedModel[] = probedIds.map(
					(id) => ({
						id,
						label: id,
						cliFlag: id,
						probed: true,
					}),
				);

				setDetectedModels(probedModels);
				if (!userChosenRef.current) {
					setSelectedModel(probedModels[0].id);
				}
				setError(null);
			} catch (err) {
				setError(err instanceof Error ? err.message : "Detection failed");
			} finally {
				setIsDetecting(false);
			}
		},
		[],
	);

	// Probe for additional models beyond what's in the catalog
	const probeForMore = useCallback(
		async (cliId: string, existing: DetectedModel[]) => {
			try {
				const probedIds = await invoke<string[]>("run_cli_probe", {
					cli: cliId,
					timeoutMs: 5000,
				});

				// The Rust probe returns cliFlag values (e.g. "opus[1m]")
				// while the catalog uses different id values ("claude-opus-5-1m").
				// Build lookups against ALL fields so cross-format dedup works.
				const existingByCliFlag = new Set(
					existing.filter((m) => m.cliFlag).map((m) => m.cliFlag!.toLowerCase()),
				);
				const existingById = new Set(
					existing.map((m) => m.id.toLowerCase()),
				);
				const existingByLabel = new Set(
					existing.map((m) => m.label.toLowerCase()),
				);

				const newModels: DetectedModel[] = probedIds
					.filter((id: string) => {
						const key = id.toLowerCase();
						return (
							!existingById.has(key) &&
							!existingByCliFlag.has(key) &&
							!existingByLabel.has(key)
						);
					})
					.map((id: string) => ({
						id,
						label: id,
						cliFlag: id,
						probed: true,
					}));

				if (newModels.length > 0) {
					setDetectedModels((prev) => {
						// Merge deduping: guard against any duplicates already in state
						const existingKeys = new Set([
							...prev.map((m) => m.id.toLowerCase()),
							...prev.filter((m) => m.cliFlag).map((m) => m.cliFlag!.toLowerCase()),
							...prev.map((m) => m.label.toLowerCase()),
						]);
						const deduped = newModels.filter(
							(m) => !existingKeys.has(m.id.toLowerCase()),
						);
						return deduped.length > 0 ? [...prev, ...deduped] : prev;
					});
				}
			} catch {
				// Best-effort probe failure — don't disrupt existing catalog models
			}
		},
		[],
	);

	// Mark that the user manually chose a model
	const markUserChosen = useCallback(() => {
		userChosenRef.current = true;
	}, []);

	return {
		detectedModels,
		selectedModel,
		isDetecting,
		error,
		markUserChosen,
	};
}
