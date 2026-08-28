import type { ReactNode, ComponentType } from "react";

export type PluginCategory = "chat" | "productivity" | "devtools" | "ai" | "custom";

export interface PluginUIConfig {
  /** Target surface in Swarm desktop shell: 'dock' (right dock), 'plane' (center pane), 'sidebar' (left sidebar) */
  surface: "dock" | "plane" | "sidebar";
  /** Default layout mode for embedded iframe/widget */
  layout?: "embedded" | "desktop" | "fullscreen";
  /** Icon component key or name */
  iconName?: string;
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  category: PluginCategory;
  ui: PluginUIConfig;
  configSchema?: Record<string, { type: "string" | "boolean" | "number"; label: string; required?: boolean }>;
}

export interface SwarmPluginConfig {
 [key: string]: unknown;
}

export interface SwarmPluginProps {
  projectPath?: string | null;
  activeWorkspaceId?: string;
  config?: SwarmPluginConfig;
  onClose?: () => void;
  [key: string]: unknown;
}

export interface SwarmPlugin {
  manifest: PluginManifest;
  /** Main React UI component for the plugin */
  Component: ComponentType<SwarmPluginProps>;
  /** Optional initialization function when Swarm boots */
  initialize?: (config?: SwarmPluginConfig) => Promise<void>;
}
