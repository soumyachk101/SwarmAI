/**
 * React hook for dynamic model selection on agent panes.
 *
 * Wraps the static model catalog + runtime CLI probing into a reactive
 * interface the AgentPane (and any other component) can consume.
 *
 * Detection strategy:
 * 1. Static catalog (always available, no CLI required)
 * 2. Runtime CLI probing (`--help` parse) — best effort, cached per session
 */

import { useEffect, useState, useCallback, useMemo } from "react";
import {
 getModelsForCli,
 getDefaultModelForCli,
 cliSupportsModels,
 getProbeStatus,
 clearProbeCache,
} from "@swarm/agents";

export interface CatalogModel {
 id: string;
 label: string;
 contextWindow: number;
 provider: string;
 cliFlag: string;
 supportsExtendedThinking?: boolean;
 supportsEffortControl?: boolean;
 is1M?: boolean;
 pricing?: string;
 /** "static" = from catalog, "probed" = detected from live CLI */
 source: "static" | "probed";
}

export interface UseModelCatalogResult {
 /** Models available for the given CLI, merged static + probed */
 models: CatalogModel[];
 /** Whether the CLI has any known models */
 hasModels: boolean;
 /** Currently selected model id */
 selectedModel: string;
 /** Call to select a model */
 selectModel: (modelId: string) => void;
 /** Whether CLI probing is currently in progress */
 probing: boolean;
 /** Force re-probe of all CLIs */
 refresh: () => void;
 /** Probe status for this CLI */
 probeStatus: { probed: boolean; detectedAt: number | null };
}

const PROBE_DEBOUNCE_MS = 800;

/**
 * Hook: returns available models for a CLI and manages selection state.
 *
 * @param cliId - The CLI identifier (e.g. "claude", "codex", "agy", "aider")
 * @param initialModel - Optional pre-selected model id
 */
export function useModelCatalog(
 cliId: string,
 initialModel?: string,
): UseModelCatalogResult {
 // Static catalog is instant — always available
 const staticModels = useMemo(
 () => getModelsForCli(cliId),
 [cliId],
 );

 const defaultModel = useMemo(
 () => getDefaultModelForCli(cliId)?.id ?? "",
 [cliId],
 );

 const [selectedModel, setSelectedModel] = useState(initialModel || defaultModel);
 const [probedModels, setProbedModels] = useState<Map<string, CatalogModel>>(new Map());
 const [probing, setProbing] = useState(false);

 // Merge static + probed models (probed overrides static on id collision)
 const models: CatalogModel[] = useMemo(() => {
 const merged = new Map<string, CatalogModel>();
 for (const m of staticModels) {
 merged.set(m.id, { ...m, source: "static" });
 }
 for (const [id, m] of probedModels) {
 merged.set(id, m);
 }
 return Array.from(merged.values()).sort((a, b) => {
 if (a.is1M && !b.is1M) return -1;
 if (!a.is1M && b.is1M) return 1;
 return a.label.localeCompare(b.label);
 });
 }, [staticModels, probedModels]);

 const hasModels = models.length > 0;

 // Probe the CLI at runtime (debounced)
 const probe = useCallback(
 async (targetCli: string) => {
 if (!cliSupportsModels(targetCli)) return;
 setProbing(true);
 try {
 const { probeCliModels } = await import("@swarm/agents");
 const flags = await probeCliModels(targetCli);
 setProbedModels((prev) => {
 const next = new Map(prev);
 for (const flag of flags) {
 next.set(flag, { id: flag, label: flag, source: "probed" as const, contextWindow: 0, provider: "", cliFlag: flag });
 }
 return next;
 });
 } catch {
 // Prober unavailable in this environment — static catalog still works
 } finally {
 setProbing(false);
 }
 },
 [],
 );

 // Probe on mount (debounced) and when CLI changes
 useEffect(() => {
 if (!cliSupportsModels(cliId)) return;
 const timer = setTimeout(() => probe(cliId), PROBE_DEBOUNCE_MS);
 return () => clearTimeout(timer);
 }, [cliId, probe]);

 // Sync selected model back when CLI changes
 useEffect(() => {
 setSelectedModel(initialModel || defaultModel);
 }, [cliId, initialModel, defaultModel]);

 const selectModel = useCallback((modelId: string) => {
 setSelectedModel(modelId);
 }, []);

 const refresh = useCallback(() => {
 clearProbeCache();
 setProbedModels(new Map());
 if (cliSupportsModels(cliId)) {
 probe(cliId);
 }
 }, [cliId, probe]);

 const probeStatus = getProbeStatus(cliId);

 return {
 models,
 hasModels,
 selectedModel,
 selectModel,
 probing,
 refresh,
 probeStatus,
 };
}
