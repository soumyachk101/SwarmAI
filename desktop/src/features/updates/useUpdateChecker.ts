"use client";

import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  sizeFormatted: string;
  downloadUrl: string;
  browserDownloadUrl: string;
  isCurrentPlatform?: boolean;
  platformLabel?: string;
}

export interface ReleaseInfo {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
  matchedAsset?: ReleaseAsset;
  isPrerelease?: boolean;
}

export interface DownloadProgressEvent {
  downloaded_bytes: number;
  total_bytes: number;
  percentage: number;
  speed_bytes_sec: number;
  eta_seconds: number;
  status: "downloading" | "completed" | "error";
  file_path?: string;
  error?: string;
}

export interface DownloadStats {
  percentage: number;
  downloadedBytes: number;
  totalBytes: number;
  downloadedFormatted: string;
  totalFormatted: string;
  speedFormatted: string;
  etaFormatted: string;
  status: "idle" | "downloading" | "completed" | "installing" | "error";
  filePath?: string;
  errorMessage?: string;
}

export const CURRENT_APP_VERSION = "0.1.0";
const GITHUB_REPO = "soumyachk101/SwarmAI";

export type CurrentPlatform = "macOS (Apple Silicon)" | "macOS (Intel)" | "Windows" | "Linux" | "Android" | "Unknown";

export function detectCurrentPlatform(): CurrentPlatform {
  if (typeof navigator === "undefined") return "macOS (Apple Silicon)";
  const ua = navigator.userAgent.toLowerCase();
  const plat = (navigator.platform || "").toLowerCase();

  if (ua.includes("android")) return "Android";
  if (plat.includes("mac") || ua.includes("macintosh") || ua.includes("mac os")) {
    return "macOS (Apple Silicon)";
  }
  if (plat.includes("win") || ua.includes("windows")) return "Windows";
  if (plat.includes("linux") || ua.includes("linux")) return "Linux";
  return "macOS (Apple Silicon)";
}

export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return "0 KB/s";
  return `${formatBytes(bytesPerSec)}/s`;
}

export function formatEta(seconds: number): string {
  if (!seconds || seconds <= 0) return "calculating...";
  if (seconds < 60) return `${Math.round(seconds)}s remaining`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s remaining`;
}

export function compareVersions(current: string, latest: string): boolean {
  const cleanCurrent = current.replace(/^v/, "").trim();
  const cleanLatest = latest.replace(/^v/, "").trim();
  const curParts = cleanCurrent.split(".").map((n) => parseInt(n, 10) || 0);
  const latParts = cleanLatest.split(".").map((n) => parseInt(n, 10) || 0);

  for (let i = 0; i < Math.max(curParts.length, latParts.length); i++) {
    const c = curParts[i] ?? 0;
    const l = latParts[i] ?? 0;
    if (l > c) return true;
    if (l < c) return false;
  }
  return false;
}

export function parseGitHubRelease(data: any, platform: CurrentPlatform): ReleaseInfo {
  const releaseTag = data.tag_name || data.name || "";
  const assets: ReleaseAsset[] = (data.assets || []).map((a: any) => {
    const name = (a.name || "").toLowerCase();
    let isCurrent = false;
    let platformLabel = "Installer";

    if (name.endsWith(".dmg")) {
      if (name.includes("aarch64") || name.includes("arm64") || name === "swarmai.dmg") {
        platformLabel = "macOS (Apple Silicon)";
        isCurrent = platform.includes("Apple Silicon");
      } else {
        platformLabel = "macOS (Intel)";
        isCurrent = platform.includes("Intel");
      }
    } else if (name.endsWith(".exe") || name.endsWith(".msi")) {
      platformLabel = "Windows";
      isCurrent = platform === "Windows";
    } else if (name.endsWith(".deb") || name.endsWith(".appimage")) {
      platformLabel = "Linux";
      isCurrent = platform === "Linux";
    } else if (name.endsWith(".apk")) {
      platformLabel = "Android";
      isCurrent = platform === "Android";
    }

    return {
      id: a.id,
      name: a.name,
      size: a.size,
      sizeFormatted: formatBytes(a.size),
      downloadUrl: a.url,
      browserDownloadUrl: a.browser_download_url,
      isCurrentPlatform: isCurrent,
      platformLabel,
    };
  });

  const matchedAsset = assets.find((a) => a.isCurrentPlatform) || assets[0];

  return {
    version: releaseTag,
    name: data.name || releaseTag,
    body: data.body || "No release notes provided.",
    publishedAt: data.published_at,
    htmlUrl: data.html_url,
    assets,
    matchedAsset,
    isPrerelease: Boolean(data.prerelease),
  };
}

export interface UpdateStoreState {
  isChecking: boolean;
  hasUpdate: boolean;
  latestRelease: ReleaseInfo | null;
  allReleases: ReleaseInfo[];
  error: string | null;
  lastChecked: Date | null;
  channel: "stable" | "all";
  downloadStats: DownloadStats;
  currentPlatform: CurrentPlatform;
  currentVersion: string;

  setChannel: (channel: "stable" | "all") => void;
  setDownloadStats: (stats: Partial<DownloadStats>) => void;
  resetDownload: () => void;
  checkForUpdates: (silent?: boolean) => Promise<void>;
  startDirectDownload: (customAsset?: ReleaseAsset) => Promise<void>;
  installAndRelaunch: () => Promise<void>;
  revealInFolder: () => Promise<void>;
  openUrlFallback: (url: string) => Promise<void>;
}

const initialDownloadStats: DownloadStats = {
  percentage: 0,
  downloadedBytes: 0,
  totalBytes: 0,
  downloadedFormatted: "0 MB",
  totalFormatted: "0 MB",
  speedFormatted: "",
  etaFormatted: "",
  status: "idle",
};

let listenerInitialized = false;

function setupTauriListener() {
  if (listenerInitialized) return;
  listenerInitialized = true;

  listen<DownloadProgressEvent>("update-download-progress", (event) => {
    const p = event.payload;
    if (!p) return;

    if (p.status === "downloading") {
      useUpdateStore.getState().setDownloadStats({
        percentage: Math.round(p.percentage),
        downloadedBytes: p.downloaded_bytes,
        totalBytes: p.total_bytes,
        downloadedFormatted: formatBytes(p.downloaded_bytes),
        totalFormatted: formatBytes(p.total_bytes),
        speedFormatted: formatSpeed(p.speed_bytes_sec),
        etaFormatted: formatEta(p.eta_seconds),
        status: "downloading",
      });
    } else if (p.status === "completed") {
      useUpdateStore.getState().setDownloadStats({
        percentage: 100,
        downloadedBytes: p.total_bytes,
        totalBytes: p.total_bytes,
        downloadedFormatted: formatBytes(p.total_bytes),
        totalFormatted: formatBytes(p.total_bytes),
        speedFormatted: "Finished",
        etaFormatted: "Complete",
        status: "completed",
        filePath: p.file_path,
      });
    } else if (p.status === "error") {
      useUpdateStore.getState().setDownloadStats({
        status: "error",
        errorMessage: p.error || "Download failed",
      });
    }
  }).catch(() => {
    // Non-Tauri web preview environment
  });
}

export const useUpdateStore = create<UpdateStoreState>((set, get) => {
  // Initialize listener once
  if (typeof window !== "undefined") {
    setupTauriListener();
  }

  const platform = detectCurrentPlatform();

  return {
    isChecking: false,
    hasUpdate: false,
    latestRelease: null,
    allReleases: [],
    error: null,
    lastChecked: null,
    channel: "stable",
    downloadStats: initialDownloadStats,
    currentPlatform: platform,
    currentVersion: CURRENT_APP_VERSION,

    setChannel: (channel) => {
      set({ channel });
      get().checkForUpdates(false);
    },

    setDownloadStats: (partial) => {
      set((state) => ({
        downloadStats: { ...state.downloadStats, ...partial },
      }));
    },

    resetDownload: () => {
      set({ downloadStats: initialDownloadStats });
    },

    checkForUpdates: async (silent = false) => {
      if (!silent) set({ isChecking: true, error: null });

      try {
        const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases`, {
          headers: {
            Accept: "application/vnd.github.v3+json",
          },
        });

        if (!res.ok) {
          if (res.status === 404) {
            set({
              hasUpdate: false,
              latestRelease: {
                version: CURRENT_APP_VERSION,
                name: `SwarmAI v${CURRENT_APP_VERSION} (Current)`,
                body: "You are running the latest version of SwarmAI.",
                publishedAt: new Date().toISOString(),
                htmlUrl: `https://github.com/${GITHUB_REPO}/releases`,
                assets: [],
              },
              lastChecked: new Date(),
              isChecking: false,
            });
            return;
          }
          throw new Error(`GitHub API returned HTTP ${res.status}`);
        }

        const releasesList: any[] = await res.json();
        if (!Array.isArray(releasesList) || releasesList.length === 0) {
          set({ hasUpdate: false, lastChecked: new Date(), isChecking: false });
          return;
        }

        const parsedList = releasesList.map((r) => parseGitHubRelease(r, get().currentPlatform));
        const currentChannel = get().channel;

        const targetRelease = currentChannel === "stable"
          ? parsedList.find((r) => !r.isPrerelease) || parsedList[0]
          : parsedList[0];

        const isNewer = targetRelease ? compareVersions(CURRENT_APP_VERSION, targetRelease.version) : false;

        set({
          allReleases: parsedList,
          latestRelease: targetRelease || null,
          hasUpdate: isNewer,
          lastChecked: new Date(),
          isChecking: false,
          error: null,
        });
      } catch (err: any) {
        if (!silent) {
          console.warn("[Updater] Failed to check for updates:", err);
          set({
            error: err?.message || "Failed to reach update server.",
            isChecking: false,
          });
        }
      }
    },

    startDirectDownload: async (customAsset) => {
      const { latestRelease, openUrlFallback } = get();
      const asset = customAsset || latestRelease?.matchedAsset || latestRelease?.assets[0];

      if (!asset?.browserDownloadUrl) {
        await openUrlFallback(latestRelease?.htmlUrl || `https://github.com/${GITHUB_REPO}/releases/latest`);
        return;
      }

      set({
        downloadStats: {
          percentage: 0,
          downloadedBytes: 0,
          totalBytes: asset.size || 0,
          downloadedFormatted: "0 MB",
          totalFormatted: formatBytes(asset.size || 0),
          speedFormatted: "Connecting...",
          etaFormatted: "Estimating...",
          status: "downloading",
        },
      });

      try {
        const savedPath = await invoke<string>("download_and_install_update", {
          downloadUrl: asset.browserDownloadUrl,
          fileName: asset.name,
        });

        set((state) => ({
          downloadStats: {
            ...state.downloadStats,
            percentage: 100,
            status: "completed",
            filePath: savedPath,
            speedFormatted: "Done",
            etaFormatted: "Ready to install",
          },
        }));
      } catch (e: any) {
        console.warn("[Updater] Streaming download failed, falling back to browser:", e);
        set((state) => ({
          downloadStats: {
            ...state.downloadStats,
            status: "error",
            errorMessage: String(e?.message || e),
          },
        }));
        await openUrlFallback(asset.browserDownloadUrl);
      }
    },

    installAndRelaunch: async () => {
      const { downloadStats } = get();
      if (!downloadStats.filePath) return;

      set((state) => ({
        downloadStats: { ...state.downloadStats, status: "installing" },
      }));

      try {
        await invoke("install_and_relaunch_update", {
          filePath: downloadStats.filePath,
        });
      } catch (err: any) {
        console.warn("[Updater] Automated relaunch failed:", err);
        set((state) => ({
          downloadStats: {
            ...state.downloadStats,
            status: "error",
            errorMessage: String(err?.message || err),
          },
        }));
      }
    },

    revealInFolder: async () => {
      const { downloadStats } = get();
      if (!downloadStats.filePath) return;
      try {
        await invoke("reveal_in_finder", { filePath: downloadStats.filePath });
      } catch {
        // Fallback ignored
      }
    },

    openUrlFallback: async (url: string) => {
      try {
        await invoke("open_external_url", { url });
      } catch {
        if (typeof window !== "undefined") {
          window.open(url, "_blank");
        }
      }
    },
  };
});

/** Hook that returns the update store along with convenience aliases */
export function useUpdateChecker() {
  const store = useUpdateStore();

  const downloadProgress = store.downloadStats.status === "downloading"
    ? `${store.downloadStats.percentage}% · ${store.downloadStats.downloadedFormatted}/${store.downloadStats.totalFormatted} · ${store.downloadStats.speedFormatted}`
    : null;

  return {
    ...store,
    downloadProgress,
    isDownloading: store.downloadStats.status === "downloading",
  };
}
