"use client";

import { useEffect, useState, useCallback } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  UploadCloud,
  DownloadCloud,
  Plus,
  Check,
  AlertCircle,
  RefreshCw,
  X,
  FileCode,
  FolderGit2,
  Terminal,
} from "lucide-react";

interface GitControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectPath: string | null;
  onRefreshStatus?: () => void;
}

interface GitPushPullResponse {
  success: boolean;
  stdout: string;
  stderr: string;
}

export default function GitControlModal({
  isOpen,
  onClose,
  projectPath,
  onRefreshStatus,
}: GitControlModalProps) {
  const [branch, setBranch] = useState<string>("main");
  const [changedCount, setChangedCount] = useState<number>(0);
  const [isGitRepo, setIsGitRepo] = useState<boolean>(true);
  const [branches, setBranches] = useState<string[]>([]);
  const [diffStats, setDiffStats] = useState<string>("");
  const [commitMessage, setCommitMessage] = useState("");
  const [newBranchName, setNewBranchName] = useState("");
  const [showNewBranchInput, setShowNewBranchInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionOutput, setActionOutput] = useState<{ text: string; isError?: boolean } | null>(null);

  const refreshGitState = useCallback(async () => {
    if (!projectPath) return;
    try {
      const status = await invoke<{ branch: string; changed: number }>("git_status", { projectPath });
      setBranch(status.branch);
      setChangedCount(status.changed);
      setIsGitRepo(true);

      const branchList = await invoke<string[]>("git_branches", { projectPath });
      setBranches(branchList);

      const diff = await invoke<string>("git_diff", { projectPath });
      setDiffStats(diff);
    } catch (e: any) {
      if (String(e).includes("Not a git repository")) {
        setIsGitRepo(false);
      }
    }
  }, [projectPath]);

  useEffect(() => {
    if (isOpen) {
      setActionOutput(null);
      refreshGitState();
    }
  }, [isOpen, refreshGitState]);

  if (!isOpen) return null;

  const handleInitRepo = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const out = await invoke<string>("git_init", { projectPath });
      setActionOutput({ text: `Initialized Git repository: ${out}` });
      await refreshGitState();
      onRefreshStatus?.();
    } catch (e: any) {
      setActionOutput({ text: `Failed to initialize git: ${e}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!projectPath || !commitMessage.trim()) return;
    setLoading(true);
    try {
      const res = await invoke<GitPushPullResponse>("git_commit", {
        projectPath,
        message: commitMessage.trim(),
      });
      if (res.success) {
        setActionOutput({ text: res.stdout || "Changes committed successfully." });
        setCommitMessage("");
        await refreshGitState();
        onRefreshStatus?.();
      } else {
        setActionOutput({ text: res.stderr || "Commit failed", isError: true });
      }
    } catch (e: any) {
      setActionOutput({ text: `Commit error: ${e}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const res = await invoke<GitPushPullResponse>("git_push", {
        projectPath,
        remote: "origin",
        branch: branch || "",
      });
      if (res.success) {
        setActionOutput({ text: res.stdout || res.stderr || "Pushed successfully to remote origin." });
        await refreshGitState();
        onRefreshStatus?.();
      } else {
        setActionOutput({ text: res.stderr || "Push failed to remote origin", isError: true });
      }
    } catch (e: any) {
      setActionOutput({ text: `Push error: ${e}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const res = await invoke<GitPushPullResponse>("git_pull", {
        projectPath,
        remote: "origin",
        branch: branch || "",
      });
      if (res.success) {
        setActionOutput({ text: res.stdout || "Pulled latest changes from remote." });
        await refreshGitState();
        onRefreshStatus?.();
      } else {
        setActionOutput({ text: res.stderr || "Pull failed", isError: true });
      }
    } catch (e: any) {
      setActionOutput({ text: `Pull error: ${e}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchBranch = async (targetBranch: string, isNew = false) => {
    if (!projectPath || !targetBranch.trim()) return;
    setLoading(true);
    try {
      const res = await invoke<GitPushPullResponse>("git_checkout", {
        projectPath,
        branch: targetBranch.trim(),
        createNew: isNew,
      });
      if (res.success) {
        setActionOutput({ text: `Switched to branch: ${targetBranch.trim()}` });
        setNewBranchName("");
        setShowNewBranchInput(false);
        await refreshGitState();
        onRefreshStatus?.();
      } else {
        setActionOutput({ text: res.stderr || "Checkout failed", isError: true });
      }
    } catch (e: any) {
      setActionOutput({ text: `Branch checkout error: ${e}`, isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[600] flex items-center justify-center bg-black/60 p-4 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-zinc-700/60 bg-[#12151D] shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/80 bg-zinc-950/60">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <FolderGit2 size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Git & GitHub Control Hub</span>
                {isGitRepo && (
                  <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/25 flex items-center gap-1">
                    <GitBranch size={11} /> {branch}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-zinc-400 font-mono truncate max-w-sm">
                {projectPath || "No active workspace"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={refreshGitState}
              disabled={loading}
              className="p-1.5 rounded-lg border border-zinc-700/60 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Refresh status"
            >
              <RefreshCw size={13} className={loading ? "animate-spin text-amber-400" : ""} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 flex flex-col gap-4 max-h-[65vh] overflow-y-auto scrollbar-sleek">
          {!isGitRepo ? (
            /* Not a Git Repository */
            <div className="p-5 rounded-xl border border-zinc-700/60 bg-zinc-900/40 text-center flex flex-col items-center gap-3">
              <div className="size-10 rounded-xl bg-zinc-800 flex items-center justify-center text-zinc-400">
                <FolderGit2 size={20} />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100">Workspace is not a Git repository</div>
                <div className="text-mini text-zinc-400 mt-1">
                  Initialize a local Git repository to start version controlling files and dispatching parallel worktrees.
                </div>
              </div>
              <button
                onClick={handleInitRepo}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-lg disabled:opacity-50"
              >
                {loading ? "Initializing…" : "Initialize Git Repository (git init)"}
              </button>
            </div>
          ) : (
            <>
              {/* Sync Actions Bar */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handlePush}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/15 to-amber-600/15 border border-amber-500/30 text-amber-300 text-xs font-semibold hover:bg-amber-500/25 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud size={14} />
                  <span>Push to Remote (git push)</span>
                </button>
                <button
                  onClick={handlePull}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 text-xs font-semibold hover:bg-zinc-700/80 transition-all shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <DownloadCloud size={14} />
                  <span>Pull from Remote (git pull)</span>
                </button>
              </div>

              {/* Commit Staging Card */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
                    <GitCommit size={14} className="text-amber-400" />
                    <span>Quick Commit & Stage</span>
                  </span>
                  <span className="text-mini font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    {changedCount} file(s) modified
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={commitMessage}
                    onChange={(e) => setCommitMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleCommit();
                    }}
                    placeholder="Commit message (e.g. feat: add reactive search component)..."
                    className="flex-1 px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 transition-colors font-sans"
                  />
                  <button
                    onClick={handleCommit}
                    disabled={loading || !commitMessage.trim() || changedCount === 0}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all disabled:opacity-40 cursor-pointer shadow-md shrink-0"
                  >
                    Commit
                  </button>
                </div>
              </div>

              {/* Branch Switcher & Creator */}
              <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-900/50 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-200 flex items-center gap-1.5">
                    <GitBranch size={14} className="text-amber-400" />
                    <span>Branches ({branches.length})</span>
                  </span>
                  <button
                    onClick={() => setShowNewBranchInput(!showNewBranchInput)}
                    className="text-mini text-amber-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={11} />
                    <span>New Branch</span>
                  </button>
                </div>

                {showNewBranchInput && (
                  <div className="flex gap-2 animate-fade-in">
                    <input
                      type="text"
                      value={newBranchName}
                      onChange={(e) => setNewBranchName(e.target.value)}
                      placeholder="Branch name (e.g. feature/auth-flow)..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
                    />
                    <button
                      onClick={() => handleSwitchBranch(newBranchName, true)}
                      disabled={loading || !newBranchName.trim()}
                      className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 disabled:opacity-40"
                    >
                      Create
                    </button>
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto scrollbar-sleek">
                  {branches.map((b) => (
                    <button
                      key={b}
                      onClick={() => handleSwitchBranch(b, false)}
                      disabled={b === branch || loading}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-mono transition-colors flex items-center gap-1.5 ${
                        b === branch
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold cursor-default"
                          : "bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 hover:bg-zinc-700/80 hover:text-zinc-100 cursor-pointer"
                      }`}
                    >
                      <GitBranch size={10} />
                      <span>{b}</span>
                      {b === branch && <Check size={10} className="text-amber-400" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Changed files diff stat preview */}
              {diffStats && (
                <div className="space-y-1.5">
                  <div className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider">
                    Uncommitted Diff Stats:
                  </div>
                  <pre className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-[11px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap max-h-28 overflow-y-auto scrollbar-sleek">
                    {diffStats}
                  </pre>
                </div>
              )}
            </>
          )}

          {/* Action Status Output Console */}
          {actionOutput && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                actionOutput.isError
                  ? "border-red-500/30 bg-red-500/10 text-red-300"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              }`}
            >
              {actionOutput.isError ? (
                <AlertCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
              ) : (
                <Check size={15} className="text-emerald-400 shrink-0 mt-0.5" />
              )}
              <div className="font-mono leading-relaxed whitespace-pre-wrap break-all">
                {actionOutput.text}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
