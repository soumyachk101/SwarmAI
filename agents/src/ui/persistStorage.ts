import { createJSONStorage } from "zustand/middleware";

// Persisted stores also run under vitest, where there is no localStorage —
// zustand then warns on every set(). Fall back to an in-memory map so tests
// exercise the same code path quietly.
const memory = new Map<string, string>();

// Cross-tab / cross-window sync: when any tab writes to localStorage we
// broadcast the changed key so every other tab can hydrate its Zustand store
// without a full page reload. BroadcastChannel is supported in every Chromium,
// Firefox and Safari version that Tauri targets; we fall back silently on
// older runtimes.
const channel =
 typeof BroadcastChannel !== "undefined"
 ? new BroadcastChannel("swarm-storage-sync")
 : null;

export function setupStorageSync(onChange: (key: string) => void): () => void {
 if (!channel) return () => {};

 const handler = (ev: MessageEvent<string>) => onChange(ev.data);
 channel.addEventListener("message", handler);
 return () => channel.removeEventListener("message", handler);
}

// When another tab modifies a key, fire the same event so every active tab
// reloads that store key from localStorage.
if (typeof window !== "undefined") {
 window.addEventListener("storage", (e: StorageEvent) => {
 if (!e.key) return;
 channel?.postMessage(e.key);
 });
}

export const appStorage = createJSONStorage(() =>
 typeof localStorage !== "undefined"
 ? localStorage
 : {
 getItem: (k: string) => memory.get(k) ?? null,
 setItem: (k: string, v: string) => void memory.set(k, v),
 removeItem: (k: string) => void memory.delete(k),
 },
);
