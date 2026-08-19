"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { useUpdateChecker, CURRENT_APP_VERSION } from "../updates/useUpdateChecker.js";

export default function UpdatesSection() {
  const {
    isChecking,
    hasUpdate,
    latestRelease,
    currentVersion,
    error,
    lastChecked,
    checkForUpdates,
    openDownload,
  } = useUpdateChecker();

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
      return <Apple size={14} className="text-zinc-300" />;
    }
    if (lower.endsWith(".exe") || lower.endsWith(".msi") || lower.includes("windows")) {
      return <Monitor size={14} className="text-blue-400" />;
    }
    if (lower.endsWith(".apk")) {
      return <Smartphone size={14} className="text-emerald-400" />;
    }
    return <Download size={14} className="text-amber-400" />;
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-sleek">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-swarm-border/40 pb-4">
        <div>
          <h2 className="text-base font-bold text-swarm-text flex items-center gap-2">
            <Sparkles size={16} className="text-swarm-gold" />
            <span>App Updates & Version</span>
          </h2>
          <p className="text-xs text-swarm-textMuted mt-0.5">
            Automatic real-time version check across macOS, Windows, Linux, and Android.
          </p>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={isChecking}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-swarm-gold/10 border border-swarm-gold/30 text-swarm-goldHi text-xs font-semibold hover:bg-swarm-gold/20 transition-all disabled:opacity-50"
        >
          <RefreshCw size={13} className={isChecking ? "animate-spin text-swarm-gold" : ""} />
          <span>{isChecking ? "Checking…" : "Check for Updates"}</span>
        </button>
      </div>

      {/* Version Status Card */}
      <div className="p-4 rounded-xl border border-swarm-border/60 bg-swarm-surface flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="flex size-10 items-center justify-center rounded-xl bg-swarm-gold/10 border border-swarm-gold/20 text-swarm-gold">
            <ShieldCheck size={22} />
          </div>
          <div>
            <div className="text-xs font-bold text-swarm-text">
              SwarmAI Desktop <span className="font-mono text-swarm-goldHi">v{currentVersion}</span>
            </div>
            <div className="text-mini text-swarm-textMuted mt-0.5">
              {lastChecked ? `Last checked: ${lastChecked.toLocaleTimeString()}` : "Not checked yet"}
            </div>
          </div>
        </div>

        {hasUpdate ? (
          <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-mini font-semibold font-mono animate-pulse">
            Update Available
          </span>
        ) : (
          <span className="px-2.5 py-1 rounded-full bg-swarm-gold/10 border border-swarm-gold/20 text-swarm-goldHi text-mini font-semibold">
            Up to date
          </span>
        )}
      </div>

      {/* Update Available Banner */}
      {hasUpdate && latestRelease && (
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-300 text-sm font-bold">
              <Download size={16} />
              <span>New Release: {latestRelease.version}</span>
            </div>
            <button
              onClick={() => openDownload()}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-md"
            >
              <span>Download Update</span>
              <ExternalLink size={12} />
            </button>
          </div>
        </div>
      )}

      {/* Available Release Assets */}
      {latestRelease && latestRelease.assets.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-swarm-textDim uppercase tracking-wide">
            Direct Downloads ({latestRelease.assets.length})
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {latestRelease.assets.map((asset) => (
              <div
                key={asset.id}
                className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-swarm-surface border border-swarm-border/60 hover:border-swarm-gold/40 text-xs transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getAssetIcon(asset.name)}
                  <span className="font-mono text-swarm-text truncate">{asset.name}</span>
                  {asset.size > 0 && (
                    <span className="text-mini text-swarm-textMuted">{formatSize(asset.size)}</span>
                  )}
                </div>
                <button
                  onClick={() => openDownload(asset.browserDownloadUrl)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-swarm-gold/10 border border-swarm-gold/25 text-swarm-goldHi hover:bg-swarm-gold/20 text-mini font-semibold transition-colors"
                >
                  <Download size={12} />
                  <span>Download</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Release Notes */}
      {latestRelease?.body && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-swarm-textDim uppercase tracking-wide">
            Release Notes
          </h3>
          <div className="p-4 rounded-xl glass-inset border border-swarm-border/70 text-xs text-swarm-text leading-relaxed whitespace-pre-wrap font-sans max-h-56 overflow-y-auto scrollbar-sleek">
            {latestRelease.body}
          </div>
        </div>
      )}
    </div>
  );
}
