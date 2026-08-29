import type { SwarmPlugin } from "../../types";
import { GlassChatEmbed, DevChatStudio } from "./GlassChatEmbed";

export const GlassChatPlugin: SwarmPlugin = {
  manifest: {
    id: "glasschat",
    name: "DevChat & GlassChat",
    version: "1.2.0",
    description: "Developer AI Copilot Studio & Team GlassChat workspace",
    category: "chat",
    ui: {
      surface: "dock",
      layout: "embedded",
      iconName: "Sparkles",
    },
  },
  Component: GlassChatEmbed,
};

export const DevChatPlugin: SwarmPlugin = {
  manifest: {
    id: "devchat",
    name: "DevChat Studio",
    version: "1.0.0",
    description: "Native AI pair programmer & code intelligence copilot",
    category: "chat",
    ui: {
      surface: "dock",
      layout: "embedded",
      iconName: "Sparkles",
    },
  },
  Component: DevChatStudio,
};

export * from "./GlassChatEmbed";
export * from "./DevChatStudio";
export * from "./platformApi";
