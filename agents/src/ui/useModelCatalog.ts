/**
 * Dynamic model selection for CLI agents.
 *
 * Provides a reactive hook (`useModelCatalog`) that the UI subscribes to.
 * When the user selects a different CLI, the available models list
 * automatically updates to show that CLI's models.
 *
 * Usage:
 *
 * const { models, selectedModelId, setModel, supportsModel, loading, defaultModel } =
 * useModelCatalog(selectedCli);
 *
 * Architecture:
 * 1. Static catalog (model-catalog.ts) — ground truth, zero-latency
 * 2. Runtime probe (model-detection.ts) — background CLI --help parsing
 * 3. This hook — merges both, triggers re-renders on changes
 */

import { useEffect } from "react";
import { useSyncExternalStore } from "react";
import type { AvailableModel } from "../cli-configs/model-catalog.js";
import { getModelsForCli, getDefaultModelForCli, cliSupportsModels } from "../cli-configs/model-catalog.js";
import { probeCliModels, clearProbeCache } from "../cli-configs/model-detection.js";

// ─── Lightweight reactive store ───────────────────────────────────────────────

type Listener = () => void;

interface CatalogState {
 models: AvailableModel[];
 selectedModelId: string | null;
 detectedFlags: Set<string>;
 loading: boolean;
 lastProbeTime: number | null;
}

const state: CatalogState = {
 models: [],
 selectedModelId: null,
 detectedFlags: new Set<string>(),
 loading: false,
 lastProbeTime: null,
};

const listeners = new Set<Listener>();

function subscribe(listener: Listener): () => void {
 listeners.add(listener);
 return () => listeners.delete(listener);
}

function getSnapshot(): CatalogState {
 return state;
}

function setState(partial: Partial<CatalogState>): void {
 Object.assign(state, partial);
 for (const listener of listeners) listener();
}

// ─── Core logic ──────────────────────────────────────────────────────────────

/**
 * Load models for a CLI. Sets static models immediately (zero-latency),
 * then probes the CLI in background for additional models.
 */
export async function loadModelsForCli(cliId: string, initialModelId?: string): Promise<void> {
 const staticModels = getModelsForCli(cliId);

 setState({
 models: staticModels,
 selectedModelId: initialModelId ?? staticModels[0]?.id ?? null,
 loading: true,
 });

 try {
 const detectedFlags = await probeCliModels(cliId);

 if (detectedFlags.length > 0) {
 const existingIds = new Set(staticModels.map((m: AvailableModel) => m.cliFlag.toLowerCase()));
 const newModels: AvailableModel[] = [];

 for (const flag of detectedFlags) {
 if (!existingIds.has(flag.toLowerCase())) {
 const provider = flag.startsWith("gemini") ? "google"
 : flag.startsWith("gpt") || flag.startsWith("o") ? "openai"
 : flag.startsWith("claude") ? "anthropic"
 : "";
 newModels.push({
 id: `detected-${flag}`,
 label: flag,
 contextWindow: 0,
 cliFlag: flag,
 provider: provider as AvailableModel["provider"],
 });
 }
 }

 if (newModels.length > 0) {
 setState({
 models: [...staticModels, ...newModels],
 detectedFlags: new Set([...state.detectedFlags, ...detectedFlags]),
 loading: false,
 lastProbeTime: Date.now(),
 });
 return;
 }
 }
 } catch {
 // Probe failed — static catalog is still valid
 }

 setState({ loading: false, lastProbeTime: Date.now() });
}

// ─── React hook ──────────────────────────────────────────────────────────────

export interface ModelCatalogResult {
 /** Available models for the current CLI */
 models: AvailableModel[];
 /** The currently selected model id, or null */
 selectedModelId: string | null;
 /** Select a model by its id */
 setModel: (modelId: string) => void;
 /** Whether the current CLI supports model selection */
 supportsModel: boolean;
 /** True while background CLI probing is in progress */
 loading: boolean;
 /** Default/recommended model for this CLI */
 defaultModel: AvailableModel | undefined;
 /** Model flags detected from CLI --help (empty if not probed yet) */
 detectedFlags: string[];
 /** Force re-detection (call after installing/upgrading a CLI) */
 refresh: () => void;
 /** Get the full CLI flag string for the currently selected model */
 getModelCliFlag: (modelId: string) => string | undefined;
}

export function useModelCatalog(cliId: string): ModelCatalogResult {
 // Subscribe to store changes — triggers re-render when models update
 useSyncExternalStore(subscribe, getSnapshot);

 // Load models when CLI changes
 useEffect(() => {
 loadModelsForCli(cliId);
 }, [cliId]);

 const setModel = (modelId: string) => {
 setState({ selectedModelId: modelId });
 };

 const refresh = () => {
 clearProbeCache();
 loadModelsForCli(cliId, state.selectedModelId ?? undefined);
 };

 const getModelCliFlag = (modelId: string) => {
 const model = state.models.find((m: AvailableModel) => m.id === modelId);
 return model?.cliFlag;
 };

 return {
 models: state.models,
 selectedModelId: state.selectedModelId,
 setModel,
 supportsModel: cliSupportsModels(cliId),
 loading: state.loading,
 defaultModel: getDefaultModelForCli(cliId),
 detectedFlags: Array.from(state.detectedFlags),
 refresh,
 getModelCliFlag,
 };
}
