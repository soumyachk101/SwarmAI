import { create } from "zustand";
import { envForCli, type ApiKeys } from "@swarm/agents/cli-configs";
import { persist } from "zustand/middleware";

/**
 * Settings store.
 *
 * SECURITY NOTE: API keys are persisted to localStorage in plaintext via the
 * `persist` middleware. This is acceptable for local desktop use (Tauri app)
 * where the filesystem is already accessible, but should be upgraded to
 * `@tauri-apps/plugin-secure-store` (OS keychain) when available. Do NOT
 * store production secrets here — use environment variables injected at build time.
 */


interface SettingsState {
  apiKeys: ApiKeys;
  setApiKey: (provider: keyof ApiKeys, value: string) => void;
  autosaveEnabled: boolean;
  setAutosaveEnabled: (enabled: boolean) => void;
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;
  defaultAgent: string;
  setDefaultAgent: (cli: string) => void;
  pheromoneTokenBudget: number;
  setPheromoneTokenBudget: (budget: number) => void;
  leadProvider: string;
  setLeadProvider: (provider: string) => void;
  leadModel: string;
  setLeadModel: (model: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      apiKeys: { anthropic: "", openai: "", google: "", openrouter: "", moonshot: "" },
      setApiKey: (provider, value) =>
        set((state) => ({
          apiKeys: { ...state.apiKeys, [provider]: value },
        })),
      autosaveEnabled: true,
      setAutosaveEnabled: (enabled) => set({ autosaveEnabled: enabled }),
      autosaveInterval: 30000, // 30 seconds default
      setAutosaveInterval: (interval) => set({ autosaveInterval: interval }),
      defaultAgent: "claude",
      setDefaultAgent: (cli) => set({ defaultAgent: cli }),
      pheromoneTokenBudget: 4000,
      setPheromoneTokenBudget: (budget) => set({ pheromoneTokenBudget: budget }),
      leadProvider: "openrouter",
      setLeadProvider: (provider) => set({ leadProvider: provider }),
      leadModel: "openai/gpt-4o-mini",
      setLeadModel: (model) => set({ leadModel: model }),
    }),
    { name: "swarm-settings" },
  ),
);

// Re-exported so app code keeps one import site for settings-shaped things.
export { envForCli };
export type { ApiKeys };
