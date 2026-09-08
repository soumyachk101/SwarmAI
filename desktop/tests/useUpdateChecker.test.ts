import { describe, it, expect, beforeEach } from "vitest";
import {
  compareVersions,
  formatBytes,
  formatSpeed,
  formatEta,
  detectCurrentPlatform,
  parseGitHubRelease,
  useUpdateStore,
  CURRENT_APP_VERSION,
} from "../src/features/updates/useUpdateChecker.js";

describe("Updater Utility Functions", () => {
  describe("compareVersions", () => {
    it("detects newer version correctly", () => {
      expect(compareVersions("0.1.0", "0.1.1")).toBe(true);
      expect(compareVersions("0.1.0", "0.2.0")).toBe(true);
      expect(compareVersions("0.1.0", "1.0.0")).toBe(true);
      expect(compareVersions("v0.1.0", "v0.1.1")).toBe(true);
      expect(compareVersions("0.1.0", "v0.1.1")).toBe(true);
    });

    it("returns false for same or older versions", () => {
      expect(compareVersions("0.1.0", "0.1.0")).toBe(false);
      expect(compareVersions("v0.1.0", "0.1.0")).toBe(false);
      expect(compareVersions("0.2.0", "0.1.9")).toBe(false);
      expect(compareVersions("1.0.0", "0.9.9")).toBe(false);
    });
  });

  describe("formatBytes", () => {
    it("formats byte values appropriately", () => {
      expect(formatBytes(0)).toBe("0 B");
      expect(formatBytes(1024)).toBe("1 KB");
      expect(formatBytes(1024 * 1024 * 25.5)).toBe("25.5 MB");
      expect(formatBytes(1024 * 1024 * 1024 * 1.2)).toBe("1.2 GB");
    });
  });

  describe("formatSpeed", () => {
    it("formats speed values into rate strings", () => {
      expect(formatSpeed(0)).toBe("0 KB/s");
      expect(formatSpeed(1024 * 1024 * 5)).toBe("5 MB/s");
    });
  });

  describe("formatEta", () => {
    it("formats seconds remaining into readable countdowns", () => {
      expect(formatEta(0)).toBe("calculating...");
      expect(formatEta(45)).toBe("45s remaining");
      expect(formatEta(125)).toBe("2m 5s remaining");
    });
  });

  describe("parseGitHubRelease", () => {
    it("identifies matching assets for macOS Apple Silicon", () => {
      const mockApiData = {
        tag_name: "v0.2.0",
        name: "Release v0.2.0",
        body: "Added multi-agent features.",
        published_at: "2026-09-08T00:00:00Z",
        html_url: "https://github.com/soumyachk101/SwarmAI/releases/tag/v0.2.0",
        prerelease: false,
        assets: [
          {
            id: 1,
            name: "SwarmAI_0.2.0_aarch64.dmg",
            size: 85000000,
            url: "https://api.github.com/assets/1",
            browser_download_url: "https://github.com/releases/download/v0.2.0/SwarmAI_0.2.0_aarch64.dmg",
          },
          {
            id: 2,
            name: "SwarmAI_0.2.0_x64.dmg",
            size: 88000000,
            url: "https://api.github.com/assets/2",
            browser_download_url: "https://github.com/releases/download/v0.2.0/SwarmAI_0.2.0_x64.dmg",
          },
          {
            id: 3,
            name: "SwarmAI_0.2.0_x64-setup.exe",
            size: 92000000,
            url: "https://api.github.com/assets/3",
            browser_download_url: "https://github.com/releases/download/v0.2.0/SwarmAI_0.2.0_x64-setup.exe",
          },
        ],
      };

      const parsed = parseGitHubRelease(mockApiData, "macOS (Apple Silicon)");
      expect(parsed.version).toBe("v0.2.0");
      expect(parsed.isPrerelease).toBe(false);
      expect(parsed.matchedAsset).toBeDefined();
      expect(parsed.matchedAsset?.name).toBe("SwarmAI_0.2.0_aarch64.dmg");
      expect(parsed.matchedAsset?.platformLabel).toBe("macOS (Apple Silicon)");
    });
  });

  describe("useUpdateStore", () => {
    beforeEach(() => {
      useUpdateStore.getState().resetDownload();
    });

    it("initializes with default values", () => {
      const state = useUpdateStore.getState();
      expect(state.currentVersion).toBe(CURRENT_APP_VERSION);
      expect(state.downloadStats.status).toBe("idle");
      expect(state.channel).toBe("stable");
    });

    it("updates channel and downloadStats properly", () => {
      useUpdateStore.getState().setDownloadStats({
        status: "downloading",
        percentage: 45,
        downloadedFormatted: "35 MB",
        totalFormatted: "78 MB",
        speedFormatted: "4.2 MB/s",
        etaFormatted: "10s remaining",
      });

      const updated = useUpdateStore.getState().downloadStats;
      expect(updated.status).toBe("downloading");
      expect(updated.percentage).toBe(45);
      expect(updated.downloadedFormatted).toBe("35 MB");

      useUpdateStore.getState().resetDownload();
      expect(useUpdateStore.getState().downloadStats.status).toBe("idle");
      expect(useUpdateStore.getState().downloadStats.percentage).toBe(0);
    });
  });
});
