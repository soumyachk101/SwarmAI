"use client";

import { useEffect } from "react";
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
} from "lucide-react";
import { useUpdateChecker } from "./useUpdateChecker.js";

interface UpdateCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateCheckerModal({ isOpen, onClose }: UpdateCheckerModalProps) {
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
            <div className="flex size-7 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100">SwarmAI Updates</h3>
              <p className="text-[11px] text-zinc-400">Real-time update manager & release downloads</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={checkForUpdates}
              disabled={isChecking}
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
                <div className="text-[11px] text-zinc-400">Connecting to GitHub Releases repository</div>
              </div>
            </div>
          ) : hasUpdate && latestRelease ? (
            <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs shadow-md">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Download size={18} />
                </div>
                <div>
                  <div className="font-bold text-zinc-100 text-sm">New Update Available!</div>
                  <div className="text-[11px] text-emerald-300/80">
                    Version <span className="font-mono font-bold text-white">{latestRelease.version}</span> is ready to install (Current: v{currentVersion})
                  </div>
                </div>
              </div>
              <button
                onClick={() => openDownload()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-zinc-950 font-bold text-xs hover:bg-emerald-400 transition-all shadow-lg hover:scale-105"
              >
                <span>Update Now</span>
                <ExternalLink size={12} />
              </button>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-xs">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <div>
                <div className="font-semibold text-zinc-100">Update check failed</div>
                <div className="text-[11px] text-zinc-400">{error}</div>
              </div>
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

          {/* Release Notes / Assets */}
          {latestRelease && (
            <div className="space-y-3">
              {latestRelease.assets.length > 0 && (
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                    Available Installers ({latestRelease.assets.length}):
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {latestRelease.assets.map((asset) => (
                      <div
                        key={asset.id}
                        className="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 text-xs transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          {getAssetIcon(asset.name)}
                          <span className="font-mono text-zinc-200 truncate">{asset.name}</span>
                          {asset.size > 0 && (
                            <span className="text-[10px] text-zinc-500">{formatSize(asset.size)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => openDownload(asset.browserDownloadUrl)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-amber-300 text-[11px] font-medium transition-colors"
                        >
                          <Download size={11} />
                          <span>Download</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {latestRelease.body && (
                <div>
                  <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                    Changelog & Release Notes:
                  </div>
                  <div className="p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed max-h-40 overflow-y-auto scrollbar-sleek">
                    {latestRelease.body}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between text-[11px] text-zinc-400">
          <div>
            {lastChecked && (
              <span>Last checked: {lastChecked.toLocaleTimeString()}</span>
            )}
          </div>
          <button
            onClick={() => openDownload(`https://github.com/soumyachk101/SwarmAI/releases`)}
            className="flex items-center gap-1 text-amber-400 hover:underline"
          >
            <span>All Releases on GitHub</span>
            <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
