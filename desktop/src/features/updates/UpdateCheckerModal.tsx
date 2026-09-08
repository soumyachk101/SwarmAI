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
  FolderOpen,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { useUpdateChecker, type ReleaseAsset } from "./useUpdateChecker.js";

interface UpdateCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UpdateCheckerModal({ isOpen, onClose }: UpdateCheckerModalProps) {
  const {
    isChecking,
    downloadStats,
    hasUpdate,
    latestRelease,
    currentVersion,
    currentPlatform,
    error,
    lastChecked,
    channel,
    setChannel,
    checkForUpdates,
    startDirectDownload,
    installAndRelaunch,
    revealInFolder,
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
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-white/[0.14] bg-[#0f121d]/98 shadow-[0_25px_70px_rgba(0,0,0,0.95)] backdrop-blur-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 shadow-sm">
              <Sparkles size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white tracking-wide">SwarmAI Software Updates</h3>
                {hasUpdate && (
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase tracking-wider animate-pulse">
                    New Update
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Installed: <span className="font-mono text-zinc-200">v{currentVersion}</span> · {currentPlatform}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Channel Pill Toggle */}
            <div className="flex items-center rounded-lg bg-black/40 border border-white/[0.08] p-0.5 text-[10px]">
              <button
                type="button"
                onClick={() => setChannel("stable")}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  channel === "stable" ? "bg-white/[0.12] text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                Stable
              </button>
              <button
                type="button"
                onClick={() => setChannel("all")}
                className={`px-2 py-0.5 rounded-md font-medium transition-all ${
                  channel === "all" ? "bg-white/[0.12] text-white font-semibold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                All Releases
              </button>
            </div>

            <button
              onClick={() => checkForUpdates(false)}
              disabled={isChecking || downloadStats.status === "downloading"}
              className="p-1.5 rounded-lg border border-white/[0.08] text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors disabled:opacity-40 cursor-pointer"
              title="Check for updates"
            >
              <RefreshCw size={13} className={isChecking ? "animate-spin text-amber-400" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto scrollbar-sleek">
          {/* Checking Spinner */}
          {isChecking ? (
            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 text-xs text-amber-200">
              <RefreshCw size={18} className="animate-spin text-amber-400 shrink-0" />
              <div>
                <div className="font-semibold text-zinc-100">Checking for latest releases…</div>
                <div className="text-[11px] text-zinc-400">Connecting to GitHub Releases server</div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3.5 p-4 rounded-xl border border-red-500/30 bg-red-500/10 text-xs text-red-200">
              <AlertCircle size={18} className="text-red-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-100">Update check failed</div>
                <div className="text-[11px] text-zinc-400 truncate">{error}</div>
              </div>
              <button
                onClick={() => checkForUpdates(false)}
                className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 text-xs font-semibold shrink-0"
              >
                Retry
              </button>
            </div>
          ) : hasUpdate && matchedAsset ? (
            /* Update Available Card with Live Progress */
            <div className="p-4 rounded-xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-[#151928] to-[#0f121d] flex flex-col gap-3 shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex size-11 items-center justify-center rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-300 shrink-0 shadow-sm">
                    {getAssetIcon(matchedAsset.name)}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm flex items-center gap-2">
                      <span>Update to {latestRelease?.version}</span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.5 rounded font-mono">
                        {matchedAsset.platformLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                      {matchedAsset.name} {matchedAsset.size > 0 ? `· ${formatSize(matchedAsset.size)}` : ""}
                    </div>
                  </div>
                </div>

                {/* State-dependent Action Buttons */}
                {downloadStats.status === "completed" ? (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={revealInFolder}
                      className="p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-zinc-300 hover:text-white transition-all cursor-pointer"
                      title="Reveal package in Finder"
                    >
                      <FolderOpen size={14} />
                    </button>
                    <button
                      onClick={installAndRelaunch}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-600 text-zinc-950 font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-emerald-500/20 active:scale-95 cursor-pointer"
                    >
                      <Zap size={13} className="fill-current" />
                      <span>Install & Restart</span>
                    </button>
                  </div>
                ) : downloadStats.status === "installing" ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Installing…</span>
                  </div>
                ) : (
                  <button
                    onClick={() => startDirectDownload(matchedAsset)}
                    disabled={downloadStats.status === "downloading"}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 font-bold text-xs hover:brightness-110 transition-all shadow-md shadow-amber-500/20 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0"
                  >
                    <Download size={14} />
                    <span>{downloadStats.status === "downloading" ? "Downloading…" : "Download & Install"}</span>
                  </button>
                )}
              </div>

              {/* Streaming Download Progress Bar */}
              {downloadStats.status === "downloading" && (
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-amber-300 font-bold">{downloadStats.percentage}%</span>
                    <span className="text-zinc-400">
                      {downloadStats.downloadedFormatted} / {downloadStats.totalFormatted} · {downloadStats.speedFormatted}
                    </span>
                    <span className="text-zinc-400">{downloadStats.etaFormatted}</span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-black/60 border border-white/[0.08] p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-400 transition-all duration-150 shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                      style={{ width: `${Math.max(4, downloadStats.percentage)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Completed message */}
              {downloadStats.status === "completed" && (
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-emerald-400" />
                    <span>Download complete! Click "Install & Restart" to upgrade now.</span>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Up to date card */
            <div className="flex items-center gap-3 p-4 rounded-xl border border-white/[0.08] bg-white/[0.02] text-xs">
              <div className="size-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 size={18} />
              </div>
              <div>
                <div className="font-semibold text-white">You are running the latest version</div>
                <div className="text-[11px] text-zinc-400 mt-0.5">
                  SwarmAI <span className="font-mono font-semibold text-amber-300">v{currentVersion}</span> is currently up to date.
                </div>
              </div>
            </div>
          )}

          {/* Release Notes */}
          {latestRelease?.body && (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                <span>Release Notes ({latestRelease.version})</span>
                <span className="text-[10px] lowercase text-zinc-500 font-normal">
                  {latestRelease.publishedAt ? new Date(latestRelease.publishedAt).toLocaleDateString() : ""}
                </span>
              </div>
              <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.08] text-xs text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed max-h-44 overflow-y-auto scrollbar-sleek selection:bg-amber-500/30">
                {latestRelease.body}
              </div>
            </div>
          )}

          {/* Other Operating Systems Dropdown */}
          {otherAssets.length > 0 && (
            <div className="border-t border-white/[0.08] pt-3 space-y-2">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="flex items-center justify-between w-full text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
              >
                <span>Available Installers for Other Platforms ({otherAssets.length})</span>
                {showAll ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showAll && (
                <div className="space-y-1.5 animate-fade-in">
                  {otherAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs hover:border-white/[0.12] transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getAssetIcon(asset.name)}
                        <div>
                          <div className="font-mono text-zinc-200 truncate">{asset.name}</div>
                          <div className="text-[10px] text-zinc-500">
                            {asset.platformLabel} · {asset.sizeFormatted}
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => startDirectDownload(asset)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-white/[0.08] hover:bg-white/[0.14] text-amber-300 text-[11px] font-medium transition-colors cursor-pointer"
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
        <div className="px-5 py-3 border-t border-white/[0.08] bg-white/[0.02] flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5 text-zinc-400">
            <ShieldCheck size={13} className="text-emerald-400" />
            <span>Integrity verified</span>
            {lastChecked && (
              <span className="text-zinc-500">· Checked {lastChecked.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            )}
          </div>
          <button
            type="button"
            onClick={() => openUrlFallback(latestRelease?.htmlUrl || `https://github.com/soumyachk101/SwarmAI/releases`)}
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
          >
            <span>GitHub Releases</span>
            <ExternalLink size={10} />
          </button>
        </div>
      </div>
    </div>
  );
}
