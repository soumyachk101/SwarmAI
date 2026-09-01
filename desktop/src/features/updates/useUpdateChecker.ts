"use client";

import { useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
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
    // Check if Apple Silicon (arm64 / aarch64)
    return "macOS (Apple Silicon)";
  }
  if (plat.includes("win") || ua.includes("windows")) return "Windows";
  if (plat.includes("linux") || ua.includes("linux")) return "Linux";
  return "macOS (Apple Silicon)";
}

export function useUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<string | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const platform = detectCurrentPlatform();

 // Rate-limit update checks to at most once per hour
 const CHECK_COOLDOWN_MS = 60 * 60 * 1000;
 const CACHE_KEY = "swarm.lastUpdateCheck";

 const canCheck = (): boolean => {
 if (typeof window === "undefined") return true;
 try {
 const last = localStorage.getItem(CACHE_KEY);
 if (!last) return true;
 return Date.now() - Number(last) > CHECK_COOLDOWN_MS;
 } catch {
 return true;
 }
 };

 const markChecked = () => {
 if (typeof window === "undefined") return;
 try {
 localStorage.setItem(CACHE_KEY, String(Date.now()));
 } catch {
 // storage full or unavailable
 }
 };

 const formatBytes = (bytes: number): string => {
 if (bytes === 0) return "0 B";
 const k = 1024;
 const sizes = ["B", "KB", "MB", "GB"];
 const i = Math.floor(Math.log(bytes) / Math.log(k));
 return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
 };

  const compareVersions = (current: string, latest: string): boolean => {
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
  };

  const checkForUpdates = useCallback(async () => {
    setIsChecking(true);
    setError(null);
    setDownloadProgress(null);

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          setHasUpdate(false);
          setLatestRelease({
            version: CURRENT_APP_VERSION,
            name: `SwarmAI v${CURRENT_APP_VERSION} (Current)`,
            body: "You are running the latest version of SwarmAI.",
            publishedAt: new Date().toISOString(),
            htmlUrl: `https://github.com/${GITHUB_REPO}/releases`,
            assets: [],
          });
          setLastChecked(new Date());
          return;
        }
        throw new Error(`GitHub API returned status ${res.status}`);
      }

      const data = await res.json();

 // Skip prereleases unless explicitly requested
 if (data.prerelease && !data.draft) {
 setHasUpdate(false);
 setLastChecked(new Date());
 markChecked();
 setIsChecking(false);
 return;
 }
      const releaseTag = data.tag_name || data.name || "";
      const isNewer = compareVersions(CURRENT_APP_VERSION, releaseTag);

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

      // Find best matched asset for current OS
      const matchedAsset = assets.find((a) => a.isCurrentPlatform) || assets[0];

      setLatestRelease({
        version: releaseTag,
        name: data.name || releaseTag,
        body: data.body || "No release notes provided.",
        publishedAt: data.published_at,
        htmlUrl: data.html_url,
        assets,
        matchedAsset,
      });

      setHasUpdate(isNewer);
      setLastChecked(new Date());
    } catch (err: any) {
      console.warn("[Updater] Failed to check for updates:", err);
      setError(err?.message || "Failed to reach update server.");
    } finally {
      setIsChecking(false);
    }
  }, [platform]);

  /** 1-Click Direct In-App Download & Auto-Mount/Launch */
  const startDirectDownload = async (customAsset?: ReleaseAsset) => {
    const asset = customAsset || latestRelease?.matchedAsset || latestRelease?.assets[0];
    if (!asset?.browserDownloadUrl) {
      openUrlFallback(latestRelease?.htmlUrl || `https://github.com/${GITHUB_REPO}/releases/latest`);
      return;
    }

    setIsDownloading(true);
    setDownloadProgress("Downloading update package...");

    try {
      const targetPath = await invoke<string>("download_and_install_update", {
        downloadUrl: asset.browserDownloadUrl,
        fileName: asset.name,
      });
      setDownloadProgress(`✅ Download complete! Opened ${asset.name}`);
    } catch (e: any) {
      console.warn("[Updater] Direct download via backend failed, falling back to browser:", e);
      setDownloadProgress("Opening download link in browser...");
      openUrlFallback(asset.browserDownloadUrl);
    } finally {
      setIsDownloading(false);
    }
  };

  const openUrlFallback = async (url: string) => {
    try {
      await invoke("open_external_url", { url });
    } catch {
      window.open(url, "_blank");
    }
  };

  return {
    isChecking,
    isDownloading,
    downloadProgress,
    hasUpdate,
    latestRelease,
    currentVersion: CURRENT_APP_VERSION,
    currentPlatform: platform,
    error,
    lastChecked,
    checkForUpdates,
    startDirectDownload,
    openUrlFallback,
  };
}
