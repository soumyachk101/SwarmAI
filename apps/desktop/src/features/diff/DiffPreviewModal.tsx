"use client";

import { useState, useEffect } from "react";
import {
  X,
  GitBranch,
  GitMerge,
  FileCode,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  FileDiff,
  ShieldAlert,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  open: boolean;
  branchName?: string;
  projectPath: string | null;
  onApproveMerge?: () => void;
  onReject?: () => void;
  onClose: () => void;
}

export default function DiffPreviewModal({
  open,
  branchName = "agent/task-worktree",
  projectPath,
  onApproveMerge,
  onReject,
  onClose,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [diffText, setDiffText] = useState<string>("");
  const [changedFiles, setChangedFiles] = useState<string[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !projectPath) return;
    setLoading(true);

    (async () => {
      try {
        const diff = await invoke<string>("run_command", {
          command: "git",
          args: ["-C", projectPath, "diff", "HEAD"],
        });
        setDiffText(diff || "No uncommitted diff detected in current worktree.");

        const filesOut = await invoke<string>("run_command", {
          command: "git",
          args: ["-C", projectPath, "diff", "--name-only", "HEAD"],
        });
        const list = filesOut.split(/\r?\n/).filter(Boolean);
        setChangedFiles(list);
        if (list.length > 0) setSelectedFile(list[0]);
      } catch (err) {
        setDiffText("No worktree diff or git repository not detected.");
      } finally {
        setLoading(false);
      }
    })();
  }, [open, projectPath]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4">
      <div
        className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl glass-rail border border-swarm-gold/30 shadow-2xl overflow-hidden bg-swarm-canvas/95"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-swarm-border/50 bg-swarm-surface/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileDiff className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-swarm-text flex items-center gap-2">
                Worktree Diff Preview Before Merge
                <span className="text-micro font-mono bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20">
                  {branchName}
                </span>
              </h2>
              <p className="text-micro text-swarm-textMuted">
                Review agent changes before committing and merging into the target branch
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-surface transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Content Body: Sidebar + Diff viewer */}
        <div className="flex-1 flex min-h-[350px] overflow-hidden">
          {/* Changed Files list */}
          <div className="w-64 border-r border-swarm-border/40 p-3 bg-swarm-surface/20 flex flex-col gap-1 overflow-y-auto shrink-0">
            <span className="text-micro uppercase font-semibold text-swarm-textMuted px-2 py-1">
              Changed Files ({changedFiles.length})
            </span>
            {changedFiles.length === 0 ? (
              <div className="text-micro text-swarm-textMuted italic p-2">No files modified</div>
            ) : (
              changedFiles.map((file) => (
                <button
                  key={file}
                  onClick={() => setSelectedFile(file)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-mono text-left transition-all ${
                    selectedFile === file
                      ? "bg-swarm-gold/20 text-swarm-goldHi font-medium border border-swarm-gold/30"
                      : "text-swarm-textDim hover:text-swarm-text hover:bg-swarm-border/20"
                  }`}
                >
                  <FileCode className="size-3.5 shrink-0 text-swarm-gold/60" />
                  <span className="truncate">{file}</span>
                </button>
              ))
            )}
          </div>

          {/* Diff Output */}
          <div className="flex-1 p-4 bg-swarm-canvas/90 font-mono text-micro overflow-y-auto scrollbar-sleek">
            {loading ? (
              <div className="text-center py-12 text-swarm-textMuted">Loading worktree diff...</div>
            ) : diffText.length === 0 ? (
              <div className="text-center py-12 text-swarm-textMuted">No differences detected.</div>
            ) : (
              <div className="space-y-0.5">
                {diffText.split(/\r?\n/).map((line, idx) => {
                  let color = "text-swarm-textDim";
                  let bg = "";
                  if (line.startsWith("+") && !line.startsWith("+++")) {
                    color = "text-emerald-400";
                    bg = "bg-emerald-500/10";
                  } else if (line.startsWith("-") && !line.startsWith("---")) {
                    color = "text-rose-400";
                    bg = "bg-rose-500/10";
                  } else if (line.startsWith("@@")) {
                    color = "text-cyan-400";
                    bg = "bg-cyan-500/10";
                  }
                  return (
                    <div key={idx} className={`px-2 py-0.5 rounded ${bg} ${color} whitespace-pre-wrap break-all`}>
                      {line}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-swarm-border/50 bg-swarm-surface/40 shrink-0">
          <div className="flex items-center gap-1.5 text-micro text-swarm-textMuted">
            <ShieldAlert className="size-3.5 text-swarm-gold" />
            <span>Human-in-the-loop validation active</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onReject?.();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-swarm-surface border border-swarm-border hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 transition-all text-swarm-text"
            >
              <XCircle className="size-3.5" />
              <span>Reject / Abort</span>
            </button>

            <button
              onClick={() => {
                onApproveMerge?.();
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded bg-emerald-500 text-swarm-canvas hover:bg-emerald-400 transition-all shadow-sm"
            >
              <CheckCircle2 className="size-3.5" />
              <span>Approve & Merge Worktree</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
