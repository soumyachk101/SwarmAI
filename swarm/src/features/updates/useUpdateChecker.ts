"use client";

import { useState, useCallback } from "react";

export interface ReleaseAsset {
  id: number;
  name: string;
  size: number;
  downloadUrl: string;
  browserDownloadUrl: string;
}

export interface ReleaseInfo {
  version: string;
  name: string;
  body: string;
  publishedAt: string;
  htmlUrl: string;
  assets: ReleaseAsset[];
}

export const CURRENT_APP_VERSION = "0.1.0";
const GITHUB_REPO = "soumyachk101/SwarmAI";

export function useUpdateChecker() {
  const [isChecking, setIsChecking] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [latestRelease, setLatestRelease] = useState<ReleaseInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

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

    try {
      const res = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`, {
        headers: {
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!res.ok) {
        if (res.status === 404) {
          // No published release yet on GitHub
          setHasUpdate(false);
          setLatestRelease({
            version: CURRENT_APP_VERSION,
            name: `SwarmAI v${CURRENT_APP_VERSION} (Current)`,
            body: "You are running the latest compiled local build of SwarmAI.",
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
      const releaseTag = data.tag_name || data.name || "";
      const isNewer = compareVersions(CURRENT_APP_VERSION, releaseTag);

      const assets: ReleaseAsset[] = (data.assets || []).map((a: any) => ({
        id: a.id,
        name: a.name,
        size: a.size,
        downloadUrl: a.url,
        browserDownloadUrl: a.browser_download_url,
      }));

      setLatestRelease({
        version: releaseTag,
        name: data.name || releaseTag,
        body: data.body || "No release notes provided.",
        publishedAt: data.published_at,
        htmlUrl: data.html_url,
        assets,
      });

      setHasUpdate(isNewer);
      setLastChecked(new Date());
    } catch (err: any) {
      console.warn("[Updater] Failed to check for updates:", err);
      setError(err?.message || "Failed to reach update server.");
    } finally {
      setIsChecking(false);
    }
  }, []);

  const openDownload = async (url?: string) => {
    const target = url || latestRelease?.htmlUrl || `https://github.com/${GITHUB_REPO}/releases/latest`;
    window.open(target, "_blank");
  };

  return {
    isChecking,
    hasUpdate,
    latestRelease,
    currentVersion: CURRENT_APP_VERSION,
    error,
    lastChecked,
    checkForUpdates,
    openDownload,
  };
}
