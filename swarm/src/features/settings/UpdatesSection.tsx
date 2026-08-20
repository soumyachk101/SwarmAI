"use client";

import { useEffect, useState } from "react";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Sparkles,
  Apple,
  Monitor,
  Smartphone,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUpdateChecker, CURRENT_APP_VERSION } from "../updates/useUpdateChecker.js";

export default function UpdatesSection() {
  const {
    isChecking,
    isDownloading,
    downloadProgress,
    hasUpdate,
    latestRelease,
    currentVersion,
    currentPlatform,
    error,
    lastChecked,
    checkForUpdates,
    startDirectDownload,
    openUrlFallback,
  } = useUpdateChecker();

  const [showAllPlatforms, setShowAllPlatforms] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  const formatSize = (bytes: number) => {
    if (!bytes) return "";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const getAssetIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.endsWith(".dmg") || lower.includes("macos") || lower.includes("darwin")) {
      return <Apple size={16} className="text-zinc-200" />;
    }
    if (lower.endsWith(".exe") || lower.endsWith(".msi") || lower.includes("windows")) {
      return <Monitor size={16} className="text-blue-400" />;
    }
    if (lower.endsWith(".apk")) {
      return <Smartphone size={16} className="text-emerald-400" />;
    }
    return <Download size={16} className="text-amber-400" />;
  };

  const matchedAsset = latestRelease?.matchedAsset;
  const otherAssets = (latestRelease?.assets || []).filter((a) => a !== matchedAsset);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-sleek">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-swarm-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-swarm-text flex items-center gap-2">
            <Sparkles size={16} className="text-swarm-gold" />
            <span>App Updates & Downloads</span>
          </h2>
          <p className="text-xs text-swarm-textMuted mt-0.5">
            Auto-detects your system and downloads updates directly inside SwarmAI.
          </p>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={isChecking || isDownloading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-swarm-gold/10 border border-swarm-gold/30 text-swarm-goldHi text-xs font-semibold hover:bg-swarm-gold/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isChecking ? "animate-spin text-swarm-gold" : ""} />
          <span>{isChecking ? "Checking…" : "Check for Updates"}</span>
        </button>
      </div>

      {/* System & Version Status Card */}
      <div className="p-4 rounded-xl border border-swarm-border/60 bg-swarm-surface flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-swarm-gold/10 border border-swarm-gold/20 text-swarm-gold">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-swarm-text flex items-center gap-2">
              <span>SwarmAI Desktop</span>
              <span className="font-mono text-swarm-goldHi">v{currentVersion}</span>
              <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] text-zinc-300 font-normal">
                {currentPlatform}
              </span>
            </div>
            <div className="text-mini text-swarm-textMuted mt-0.5">
              {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : "Checking for updates..."}
            </div>
          </div>
        </div>

        {hasUpdate ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-mini font-semibold font-mono animate-pulse">
            New Version Available
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-swarm-gold/10 border border-swarm-gold/20 text-swarm-goldHi text-mini font-semibold">
            Up to date
          </span>
        )}
      </div>

      {/* Error Notice */}
      {error && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/10 flex items-center gap-3 text-xs text-red-300">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div>
            <div className="font-semibold text-zinc-100">Unable to reach update server</div>
            <div className="text-[11px] text-zinc-400">{error}</div>
          </div>
        </div>
      )}

      {/* Primary Auto-Detected Installer Card */}
      {matchedAsset && (
        <div className="p-5 rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300">
                {getAssetIcon(matchedAsset.name)}
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  <span>Installer for your device ({matchedAsset.platformLabel})</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-mono">
                    Auto-Detected
                  </span>
                </div>
                <div className="text-mini text-zinc-400 font-mono mt-0.5">
                  {matchedAsset.name} {matchedAsset.size > 0 ? `· ${formatSize(matchedAsset.size)}` : ""}
                </div>
              </div>
            </div>

            <button
              onClick={() => startDirectDownload(matchedAsset)}
              disabled={isDownloading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-lg hover:scale-105 disabled:opacity-50 cursor-pointer"
            >
              <Download size={15} />
              <span>{isDownloading ? "Downloading…" : hasUpdate ? "Update Now" : "Download Latest DMG"}</span>
            </button>
          </div>

          {/* Download progress bar */}
          {downloadProgress && (
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-700/60 text-xs text-amber-300 flex items-center gap-2.5 animate-pulse">
              <RefreshCw size={14} className="animate-spin text-amber-400 shrink-0" />
              <span>{downloadProgress}</span>
            </div>
          )}
        </div>
      )}

      {/* Release Notes */}
      {latestRelease?.body && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-swarm-textDim uppercase tracking-wide">
            Changelog & Release Notes ({latestRelease.version})
          </h3>
          <div className="p-4 rounded-xl glass-inset border border-swarm-border/70 text-xs text-swarm-text leading-relaxed whitespace-pre-wrap font-sans max-h-48 overflow-y-auto scrollbar-sleek">
            {latestRelease.body}
          </div>
        </div>
      )}

      {/* Other Platforms Dropdown */}
      {otherAssets.length > 0 && (
        <div className="border-t border-swarm-border/40 pt-4 space-y-3">
          <button
            onClick={() => setShowAllPlatforms(!showAllPlatforms)}
            className="flex items-center justify-between w-full text-xs text-swarm-textMuted hover:text-swarm-text transition-colors"
          >
            <span>Other Operating Systems & Architecture Packages ({otherAssets.length})</span>
            {showAllPlatforms ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showAllPlatforms && (
            <div className="grid grid-cols-1 gap-2 animate-fade-in">
              {otherAssets.map((asset) => (
                <div
                  key={asset.id}
                  className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-swarm-surface border border-swarm-border/60 hover:border-swarm-gold/40 text-xs transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {getAssetIcon(asset.name)}
                    <div>
                      <div className="font-mono text-swarm-text truncate">{asset.name}</div>
                      <div className="text-[10px] text-swarm-textMuted">{asset.platformLabel}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => startDirectDownload(asset)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-swarm-gold/10 border border-swarm-gold/25 text-swarm-goldHi hover:bg-swarm-gold/20 text-mini font-semibold transition-colors"
                  >
                    <Download size={12} />
                    <span>Download</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
