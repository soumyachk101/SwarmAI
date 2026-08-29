import { registry } from "./registry";
import { GlassChatPlugin, DevChatPlugin } from "./plugins/glasschat";

// Auto-register default plugins into the SwarmPlugins registry
registry.register(GlassChatPlugin);
registry.register(DevChatPlugin);

export * from "./types";
export * from "./registry";
export * from "./plugins/glasschat";
