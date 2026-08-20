"use client";

import { useEffect, useState } from "react";
import {
  Download,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  X,
  ExternalLink,
  Sparkles,
  Apple,
  Monitor,
  Smartphone,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useUpdateChecker } from "./useUpdateChecker.js";

interface UpdateCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateCheckerModal({ isOpen, onClose }: UpdateCheckerModalProps) {
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

  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkForUpdates();
    }
  }, [isOpen, checkForUpdates]);

  if (!isOpen) return null;

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
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">SwarmAI Updates</h3>
              <p className="text-[11px] text-zinc-400">
                Current: <span className="font-mono text-amber-300">v{currentVersion}</span> · Detected: {currentPlatform}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkForUpdates}
              disabled={isChecking || isDownloading}
              className="p-1.5 rounded-lg border border-zinc-700/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Check again"
            >
              <RefreshCw size={13} className={isChecking ? "animate-spin text-amber-400" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto scrollbar-sleek">
          {/* Status banner */}
          {isChecking ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-amber-300 text-xs">
              <RefreshCw size={18} className="animate-spin text-amber-400 shrink-0" />
              <div>
                <div className="font-semibold text-zinc-100">Checking for updates…</div>
                <div className="text-[11px] text-zinc-400">Connecting to GitHub Releases server</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <div>
                <div className="font-semibold text-zinc-100">Update check failed</div>
                <div className="text-[11px] text-zinc-400">{error}</div>
              </div>
            </div>
          ) : matchedAsset ? (
            /* Auto-Detected Matching OS Card */
            <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-950 flex flex-col gap-3 shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shrink-0">
                    {getAssetIcon(matchedAsset.name)}
                  </div>
                  <div>
                    <div className="font-bold text-zinc-100 text-xs flex items-center gap-2">
                      <span>{matchedAsset.platformLabel}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-mono">
                        Auto-Detected
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono">
                      {matchedAsset.name} {matchedAsset.size > 0 ? `· ${formatSize(matchedAsset.size)}` : ""}
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => startDirectDownload(matchedAsset)}
                  disabled={isDownloading}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-lg hover:scale-105 disabled:opacity-50 cursor-pointer"
                >
                  <Download size={14} />
                  <span>{isDownloading ? "Downloading…" : hasUpdate ? "Update Now" : "Download DMG"}</span>
                </button>
              </div>

              {/* Download Progress message */}
              {downloadProgress && (
                <div className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-700/60 text-xs text-amber-300 flex items-center gap-2 animate-pulse">
                  <RefreshCw size={13} className="animate-spin text-amber-400 shrink-0" />
                  <span>{downloadProgress}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-zinc-700/50 bg-zinc-900/40 text-xs">
              <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
              <div>
                <div className="font-semibold text-zinc-100">You are up to date!</div>
                <div className="text-[11px] text-zinc-400">
                  SwarmAI <span className="font-mono font-semibold text-amber-300">v{currentVersion}</span> is currently the latest version.
                </div>
              </div>
            </div>
          )}

          {/* Release Notes */}
          {latestRelease?.body && (
            <div className="space-y-1.5">
              <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                Changelog ({latestRelease.version}):
              </div>
              <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed max-h-36 overflow-y-auto scrollbar-sleek">
                {latestRelease.body}
              </div>
            </div>
          )}

          {/* Other Operating Systems Dropdown */}
          {otherAssets.length > 0 && (
            <div className="border-t border-zinc-800/80 pt-3 space-y-2">
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center justify-between w-full text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
              >
                <span>Other Platforms ({otherAssets.length})</span>
                {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showAll && (
                <div className="space-y-1.5">
                  {otherAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getAssetIcon(asset.name)}
                        <div>
                          <div className="font-mono text-zinc-200 truncate">{asset.name}</div>
                          <div className="text-[10px] text-zinc-500">{asset.platformLabel}</div>
                        </div>
                      </div>
                      <button
                        onClick={() => startDirectDownload(asset)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-medium transition-colors"
                      >
                        <Download size={11} />
                        <span>Download</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-400">
          <div>
            {lastChecked && <span>Checked at {lastChecked.toLocaleTimeString()}</span>}
          </div>
          <button
            onClick={() => openUrlFallback(`https://github.com/soumyachk101/SwarmAI/releases`)}
            className="flex items-center gap-1 text-amber-400 hover:underline"
          >
            <span>GitHub Releases</span>
            <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
