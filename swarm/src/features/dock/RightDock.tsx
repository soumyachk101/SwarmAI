"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Sparkles, MessageSquare, GitBranch, X, Plus, Minus, Check, ArrowDownToLine, ArrowUpFromLine, Terminal, Copy, GitPullRequest } from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { LeadPanel, LeadModeSelect } from "@swarm/lead/ui";
import { LeadCrown } from "@swarm/board";
import { GlassChatEmbed } from "@swarm/plugins";
import { useProjectStore } from "@swarm/workspace";
import { useAgentsStore } from "@swarm/agents/ui";
import { getActiveProjectPath } from "@swarm/workspace";

type DockTab = "chat" | "glasschat" | "git" | "snippets";

interface Props {
 projectPath: string | null;
 onClose: () => void;
}

interface ViewerTarget {
 path: string;
 line?: number;
 diff?: boolean;
 projectPath?: string | null;
}

// ── File / diff viewer for Git ──────────────────────────────────
function FileViewer({ target, onBack }: { target: ViewerTarget; onBack: () => void }) {
 const [content, setContent] = useState<string>("");
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const lineRef = useRef<HTMLDivElement>(null);
 const addOpenFile = useProjectStore((s) => s.addOpenFile);

 useEffect(() => {
 if (target.path && !target.diff) {
 addOpenFile(target.projectPath ?? getActiveProjectPath(), target.path);
 }
 }, [target.path, target.diff, target.projectPath, addOpenFile]);

 useEffect(() => {
 let cancelled = false;
 setLoading(true);
 setError(null);
 (async () => {
 try {
 const text = target.diff && target.projectPath
 ? await invoke<string>("run_command", {
 command: "git",
 args: ["-C", target.projectPath, "diff", "HEAD", "--", target.path],
 })
 : await invoke<string>("read_file", { path: target.path });
 if (!cancelled) setContent(text);
 } catch (e: any) {
 if (!cancelled) setError(String(e?.message ?? e));
 } finally {
 if (!cancelled) setLoading(false);
 }
 })();
 return () => { cancelled = true; };
 }, [target.path, target.diff, target.projectPath]);

 useEffect(() => {
 if (!loading && target.line) {
 lineRef.current?.scrollIntoView({ block: "center" });
 }
 }, [loading, target.line]);

 const name = target.path.split(/[\\/]/).pop();
 const lines = content.split("\n");

 return (
 <div className="flex h-full flex-col">
 <div className="flex items-center gap-1.5 border-b border-swarm-border/30 px-2 py-1.5">
 <button
 onClick={onBack}
 className="flex size-5 shrink-0 items-center justify-center rounded text-swarm-textMuted transition-colors hover:bg-swarm-border/40 hover:text-swarm-text"
 title="Back"
 >
 &larr;
 </button>
 <span className="truncate text-mini font-medium text-swarm-text" title={target.path}>
 {name}
 </span>
 {target.diff && (
 <span className="ml-auto shrink-0 rounded bg-swarm-gold/10 px-1 py-px text-micro font-bold uppercase text-swarm-gold">
 diff
 </span>
 )}
 </div>

 <div className="flex-1 overflow-auto scrollbar-sleek">
 {loading ? (
 <div className="px-3 py-2 text-mini text-swarm-textMuted">Loading…</div>
 ) : error ? (
 <div className="px-3 py-2 text-mini text-swarm-err">{error}</div>
 ) : content.trim() === "" ? (
 <div className="px-3 py-2 text-mini text-swarm-textMuted">
 {target.diff ? "No diff — file is unchanged or untracked." : "Empty file"}
 </div>
 ) : (
 <pre className="py-1 font-mono text-micro leading-[1.5]">
 {lines.map((l, i) => {
 const n = i + 1;
 const hit = target.line === n;
 const color = target.diff
 ? l.startsWith("+") && !l.startsWith("+++")
 ? "text-swarm-ok"
 : l.startsWith("-") && !l.startsWith("---")
 ? "text-swarm-err"
 : l.startsWith("@@")
 ? "text-swarm-gold"
 : "text-swarm-textDim"
 : "text-swarm-textDim";
 return (
 <div
 key={i}
 ref={hit ? lineRef : undefined}
 className={`flex gap-2 px-2 ${hit ? "bg-swarm-gold/10" : ""}`}
 >
 <span className="w-7 shrink-0 select-none text-right text-swarm-textMuted/50">
 {n}
 </span>
 <span className={`whitespace-pre-wrap break-all ${color}`}>{l || " "}</span>
 </div>
 );
 })}
 </pre>
 )}
 </div>
 </div>
 );
}

// ── Git Panel ──────────────────────────────────────────────────
interface GitEntry { index: string; work: string; file: string; staged: boolean }

function parsePorcelain(raw: string): GitEntry[] {
 return raw.split("\n").filter(Boolean).map((l) => {
 const index = l[0] ?? " ";
 const work = l[1] ?? " ";
 let file = l.slice(3);
 const arrow = file.indexOf(" -> ");
 if (arrow !== -1) file = file.slice(arrow + 4);
 file = file.replace(/^"|"$/g, "");
 return { index, work, file, staged: index !== " " && index !== "?" };
 });
}

function GitPanel({
 projectPath,
 onOpen,
}: {
 projectPath: string | null;
 onOpen: (t: ViewerTarget) => void;
}) {
 const [branch, setBranch] = useState("");
 const [entries, setEntries] = useState<GitEntry[]>([]);
 const [message, setMessage] = useState("");
 const [busy, setBusy] = useState(false);
 const [note, setNote] = useState<string | null>(null);
 const [loaded, setLoaded] = useState(false);
 const agents = useAgentsStore((s) => s.agents);
 const targetAgent = agents.find((a) => a.isLead) || agents[0];

 const handleAIReview = async () => {
   if (!projectPath || !targetAgent) return;
   setBusy(true);
   setNote(null);
   try {
     const diffText = await invoke<string>("run_command", {
       command: "git",
       args: ["-C", projectPath, "diff", "HEAD"],
     });
     if (!diffText.trim()) {
       setNote("No changes to review.");
       return;
     }
     const reviewPrompt = `\x15Please review the following git diff for bugs, security, and edge cases:\n\`\`\`diff\n${diffText.slice(0, 3000)}\n\`\`\`\r`;
     await invoke("write_to_terminal", { paneId: targetAgent.id, data: reviewPrompt });
     setNote(`AI Review sent to ${targetAgent.customName || targetAgent.cliName || targetAgent.cli}!`);
   } catch (e: any) {
     setNote(String(e?.message ?? e));
   } finally {
     setBusy(false);
   }
 };

 const refresh = useCallback(async () => {
 if (!projectPath) return;
 try {
 const status = await invoke<{ branch: string; changed: number }>("git_status", { projectPath });
 setBranch(status.branch);
 const raw = await invoke<string>("run_command", {
 command: "git",
 args: ["-C", projectPath, "status", "--porcelain"],
 });
 setEntries(parsePorcelain(raw));
 } catch {} finally {
 setLoaded(true);
 }
 }, [projectPath]);

 useEffect(() => {
 if (!projectPath) return;
 setLoaded(false);
 refresh();
 const interval = setInterval(refresh, 5000);
 return () => clearInterval(interval);
 }, [projectPath, refresh]);

 const git = async (args: string[], okNote?: string) => {
 if (!projectPath || busy) return;
 setBusy(true);
 setNote(null);
 try {
 await invoke<string>("run_command", { command: "git", args: ["-C", projectPath, ...args] });
 if (okNote) setNote(okNote);
 await refresh();
 } catch (e: any) {
 setNote(String(e?.message ?? e));
 } finally {
 setBusy(false);
 }
 };

 const doPush = useCallback(async () => {
 if (!projectPath || busy) return;
 setBusy(true);
 setNote(null);
 try {
 const r = await invoke<{ success: boolean; stdout: string; stderr: string }>("git_push", { project_path: projectPath, remote: "", branch });
 setNote(r.success ? "Pushed" : `Push failed: ${r.stderr}`);
 } catch (e: any) {
 setNote(String(e?.message ?? e));
 } finally {
 setBusy(false);
 refresh();
 }
 }, [projectPath, busy, branch, refresh]);

 const doPull = useCallback(async () => {
 if (!projectPath || busy) return;
 setBusy(true);
 setNote(null);
 try {
 const r = await invoke<{ success: boolean; stdout: string; stderr: string }>("git_pull", { project_path: projectPath, remote: "", branch });
 setNote(r.success ? "Pulled" : `Pull failed: ${r.stderr}`);
 } catch (e: any) {
 setNote(String(e?.message ?? e));
 } finally {
 setBusy(false);
 refresh();
 }
 }, [projectPath, busy, branch, refresh]);

 const staged = entries.filter((e) => e.staged);
 const unstaged = entries.filter((e) => !e.staged);

 if (!projectPath) {
 return (
 <div className="flex flex-col items-center justify-center h-full px-4 text-center text-swarm-textMuted">
 <GitBranch className="size-6 mb-2 opacity-50 text-swarm-gold" />
 <p className="text-xs font-medium">No project open</p>
 </div>
 );
 }

 const Row = ({ e }: { e: GitEntry }) => {
 const code = (e.staged ? e.index : e.work).trim() || "?";
 const color =
 code === "M" ? "text-swarm-gold" : code === "A" ? "text-swarm-ok"
 : code === "D" ? "text-swarm-err" : "text-swarm-textMuted";
 return (
 <div className="group flex items-center gap-1.5 px-2 py-1 text-mini transition-colors hover:bg-swarm-border/20">
 <span className={`w-3 shrink-0 font-mono text-micro ${color}`}>{code}</span>
 <span
 onClick={() => onOpen({ path: `${projectPath}/${e.file}`, diff: e.index !== "?", projectPath })}
 className="flex-1 cursor-pointer truncate text-swarm-textDim hover:text-swarm-text"
 title={e.file}
 >
 {e.file}
 </span>
 <button
 disabled={busy}
 onClick={() => git(e.staged ? ["reset", "-q", "HEAD", "--", e.file] : ["add", "--", e.file])}
 className="shrink-0 rounded p-0.5 text-swarm-textMuted opacity-0 transition-all hover:bg-swarm-border/50 hover:text-swarm-gold group-hover:opacity-100 disabled:opacity-30"
 title={e.staged ? "Unstage" : "Stage"}
 >
 {e.staged ? <Minus className="size-3" /> : <Plus className="size-3" />}
 </button>
 </div>
 );
 };

 return (
 <div className="flex h-full flex-col">
 <div className="shrink-0 border-b border-swarm-border/30 px-2.5 py-2">
 <div className="flex items-center gap-2 text-xs">
 <GitBranch className="size-3.5 shrink-0 text-swarm-gold" />
 <span className="truncate font-medium text-swarm-text">{branch || "no repo"}</span>
 <span className="ml-auto shrink-0 text-micro text-swarm-textMuted">
 {entries.length} changed
 </span>
 </div>

 <div className="mt-2 flex items-center gap-1.5">
 <button
 disabled={busy}
 onClick={doPull}
 className="flex size-6 shrink-0 items-center justify-center rounded-md border border-swarm-border/50 text-swarm-textMuted transition-colors hover:border-swarm-gold/50 hover:text-swarm-gold disabled:opacity-30"
 title="Pull from remote"
 >
 <ArrowDownToLine className="size-3" />
 </button>
 <button
 disabled={busy}
 onClick={doPush}
 className="flex size-6 shrink-0 items-center justify-center rounded-md border border-swarm-border/50 text-swarm-textMuted transition-colors hover:border-swarm-ok/50 hover:text-swarm-ok disabled:opacity-30"
 title="Push to remote"
 >
 <ArrowUpFromLine className="size-3" />
 </button>
 <button
 disabled={busy || !targetAgent}
 onClick={handleAIReview}
 className="ml-auto flex items-center gap-1 rounded-md bg-swarm-gold/10 border border-swarm-gold/30 px-2 py-1 text-[10px] font-bold text-swarm-goldHi hover:bg-swarm-gold/20 transition-colors disabled:opacity-30"
 title={targetAgent ? `Dispatch diff to ${targetAgent.cliName} for AI review` : "Summon an agent first"}
 >
 <Sparkles className="size-3" />
 <span>AI Review</span>
 </button>
 </div>

 <div className="mt-2 flex items-center gap-1">
 <input
 value={message}
 onChange={(e) => setMessage(e.target.value)}
 onKeyDown={(e) => {
 if (e.key === "Enter" && message.trim() && staged.length > 0) {
 git(["commit", "-m", message.trim()], "Committed").then(() => setMessage(""));
 }
 }}
 placeholder={staged.length ? "Commit message…" : "Stage files to commit"}
 className="min-w-0 flex-1 rounded-md border border-swarm-border/50 glass-inset px-2 py-1 text-mini text-swarm-text outline-none transition-colors placeholder:text-swarm-textMuted/50 focus:border-swarm-gold/40"
 />
 <button
 disabled={busy || !message.trim() || staged.length === 0}
 onClick={() => git(["commit", "-m", message.trim()], "Committed").then(() => setMessage(""))}
 className="flex size-6 shrink-0 items-center justify-center rounded-md bg-swarm-gold/10 text-swarm-goldHi transition-colors hover:bg-swarm-gold/20 disabled:opacity-30"
 title={staged.length ? `Commit ${staged.length} file(s)` : "Nothing staged"}
 >
 <Check className="size-3" />
 </button>
 </div>
 {note && <div className="mt-1 truncate text-micro text-swarm-textMuted">{note}</div>}
 </div>

 <div className="flex-1 overflow-y-auto scrollbar-sleek py-1">
 {!loaded ? (
 <div className="px-3 py-2 text-mini text-swarm-textMuted">Loading…</div>
 ) : entries.length === 0 ? (
 <div className="flex h-full flex-col items-center justify-center px-4 text-center text-swarm-textMuted">
 <GitBranch className="mb-2 size-6 opacity-50 text-swarm-gold" />
 <p className="text-xs font-medium">No changes</p>
 </div>
 ) : (
 <>
 {staged.length > 0 && (
 <>
 <div className="px-2 py-1 text-micro font-semibold uppercase tracking-wider text-swarm-gold">
 Staged ({staged.length})
 </div>
 {staged.map((e) => <Row key={`s-${e.file}`} e={e} />)}
 </>
 )}
 {unstaged.length > 0 && (
 <>
 <div className="px-2 pb-1 pt-2 text-micro font-semibold uppercase tracking-wider text-swarm-textDim">
 Changes ({unstaged.length})
 </div>
 {unstaged.map((e) => <Row key={`u-${e.file}`} e={e} />)}
 </>
 )}
 </>
 )}
 </div>
 </div>
 );
}

// ── Snippets / Scratchpad Panel ────────────────────────────────
interface Snippet {
  id: string;
  title: string;
  category: "Git" | "Build" | "AI" | "Clean" | "Custom";
  code: string;
}

const DEFAULT_SNIPPETS: Snippet[] = [
  { id: "s1", title: "Git Status & Short Diff", category: "Git", code: "git status -s && git diff --stat" },
  { id: "s2", title: "Git Pull & Rebase", category: "Git", code: "git pull --rebase" },
  { id: "s3", title: "Full Build & Typecheck", category: "Build", code: "pnpm build && pnpm typecheck" },
  { id: "s4", title: "Clean Build Artifacts", category: "Clean", code: "rm -rf dist target/release/bundle/macos" },
  { id: "s5", title: "Deep AI Code Review", category: "AI", code: "Review recent changes, check edge cases, security implications, and memory safety." },
  { id: "s6", title: "Prepare PR & Changelog", category: "AI", code: "Summarize all staged changes and draft a comprehensive PR description with breaking changes." },
];

function SnippetsPanel() {
  const [snippets, setSnippets] = useState<Snippet[]>(() => {
    try {
      const saved = localStorage.getItem("swarm_snippets");
      return saved ? JSON.parse(saved) : DEFAULT_SNIPPETS;
    } catch {
      return DEFAULT_SNIPPETS;
    }
  });
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [injectedId, setInjectedId] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCode, setNewCode] = useState("");

  const agents = useAgentsStore((s) => s.agents);
  const targetAgent = agents.find((a) => a.isLead) || agents[0];

  const handleCopy = (s: Snippet) => {
    navigator.clipboard.writeText(s.code);
    setCopiedId(s.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleInject = (s: Snippet) => {
    if (!targetAgent) return;
    invoke("write_to_terminal", { paneId: targetAgent.id, data: s.code + "\r" }).catch(console.error);
    setInjectedId(s.id);
    setTimeout(() => setInjectedId(null), 2000);
  };

  const handleAdd = () => {
    if (!newTitle.trim() || !newCode.trim()) return;
    const next: Snippet[] = [
      ...snippets,
      { id: "custom-" + Date.now(), title: newTitle.trim(), category: "Custom", code: newCode.trim() },
    ];
    setSnippets(next);
    localStorage.setItem("swarm_snippets", JSON.stringify(next));
    setNewTitle("");
    setNewCode("");
    setShowAdd(false);
  };

  const filtered = activeCategory === "All" ? snippets : snippets.filter((s) => s.category === activeCategory);

  return (
    <div className="flex h-full flex-col font-sans">
      <div className="shrink-0 border-b border-swarm-border/30 p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-swarm-text">Command Scratchpad</span>
          <button
            onClick={() => setShowAdd(!showAdd)}
            className="flex items-center gap-1 rounded-md bg-swarm-gold/10 px-2 py-0.5 text-micro font-medium text-swarm-goldHi hover:bg-swarm-gold/20 transition-colors"
          >
            <Plus className="size-3" />
            <span>Add Snippet</span>
          </button>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-1">
          {["All", "Git", "Build", "AI", "Clean", "Custom"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-md px-2 py-0.5 text-[10px] font-medium transition-colors ${
                activeCategory === cat
                  ? "bg-swarm-gold text-black font-bold shadow-sm"
                  : "bg-white/[0.04] text-swarm-textMuted hover:text-swarm-text hover:bg-white/[0.08]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {showAdd && (
        <div className="p-2.5 border-b border-white/[0.06] bg-black/40 space-y-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Snippet Title…"
            className="w-full rounded-md border border-swarm-border/50 glass-inset px-2 py-1 text-xs text-swarm-text outline-none focus:border-swarm-gold"
          />
          <textarea
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            placeholder="Command or Prompt text…"
            rows={2}
            className="w-full rounded-md border border-swarm-border/50 glass-inset px-2 py-1 text-xs font-mono text-swarm-text outline-none focus:border-swarm-gold resize-none"
          />
          <div className="flex justify-end gap-1.5">
            <button
              onClick={() => setShowAdd(false)}
              className="rounded px-2 py-1 text-micro text-swarm-textMuted hover:text-swarm-text"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={!newTitle.trim() || !newCode.trim()}
              className="rounded bg-swarm-gold px-2.5 py-1 text-micro font-bold text-black disabled:opacity-30"
            >
              Save
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-sleek p-2.5 space-y-2">
        {filtered.map((s) => (
          <div
            key={s.id}
            className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-2.5 transition-all hover:border-swarm-gold/30 hover:bg-white/[0.04] space-y-1.5"
          >
            <div className="flex items-center justify-between gap-1.5">
              <span className="text-xs font-semibold text-swarm-text truncate">{s.title}</span>
              <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-px text-[9px] font-mono uppercase text-swarm-goldHi">
                {s.category}
              </span>
            </div>
            <pre className="overflow-x-auto rounded-lg bg-black/50 p-2 font-mono text-[11px] text-swarm-textDim scrollbar-sleek whitespace-pre-wrap break-all">
              {s.code}
            </pre>
            <div className="flex items-center justify-between pt-0.5">
              <span className="text-[10px] text-swarm-textMuted font-mono">
                {targetAgent ? `Target: ${targetAgent.customName || targetAgent.cliName || targetAgent.cli}` : "No agent"}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleCopy(s)}
                  className="flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1 text-[10px] font-medium text-swarm-textMuted hover:text-swarm-text hover:bg-white/[0.05] transition-colors"
                  title="Copy command"
                >
                  {copiedId === s.id ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  <span>{copiedId === s.id ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => handleInject(s)}
                  disabled={!targetAgent}
                  className="flex items-center gap-1 rounded-md bg-swarm-gold/15 border border-swarm-gold/30 px-2 py-1 text-[10px] font-bold text-swarm-goldHi hover:bg-swarm-gold/25 transition-colors disabled:opacity-30"
                  title={targetAgent ? `Run in ${targetAgent.cliName}` : "Summon an agent first"}
                >
                  {injectedId === s.id ? <Check className="size-3 text-emerald-400" /> : <Terminal className="size-3" />}
                  <span>{injectedId === s.id ? "Injected!" : "Run"}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Dock Tabs ─────────────────────────────────────────────────
const TABS: { id: DockTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "chat", label: "Lead", icon: LeadCrown },
  { id: "glasschat", label: "DevChat", icon: Sparkles },
  { id: "git", label: "Git", icon: GitBranch },
  { id: "snippets", label: "Snippets", icon: Terminal },
];

const RIGHT_DOCK_MIN = 260;
const RIGHT_DOCK_MAX = 520;
/** Folded width: the tab icons and nothing else. */
const RAIL_WIDTH = 44;
const WIDTH_KEY = "swarm_right_dock_width";
const clampWidth = (w: number) => Math.max(RIGHT_DOCK_MIN, Math.min(RIGHT_DOCK_MAX, w));

export default function ADERightDock({ projectPath, onClose }: Props) {
 const [activeTab, setActiveTab] = useState<DockTab>("chat");
 const [collapsed, setCollapsed] = useState(false);
 const leadId = useAgentsStore((s) => s.agents.find((b) => b.isLead)?.id ?? null);
 useEffect(() => {
 if (leadId) {
 setActiveTab("chat");
 setCollapsed(false);
 return;
 }
 setCollapsed((c) => c || activeTab === "chat");
 }, [leadId]);
 const [viewer, setViewer] = useState<ViewerTarget | null>(null);
 useEffect(() => setViewer(null), [projectPath]);
 const [dockWidth, setDockWidth] = useState(() => {
 const saved = Number(localStorage.getItem(WIDTH_KEY));
 return saved > 0 ? clampWidth(saved) : 340;
 });
 const compact = dockWidth < 380;
 const [isResizing, setIsResizing] = useState(false);
 const [isExpanded, setIsExpanded] = useState(false);
 const dockRef = useRef<HTMLDivElement>(null);

 const handleResizeStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
 e.preventDefault();
 e.currentTarget.setPointerCapture(e.pointerId);
 setIsResizing(true);
 }, []);

 useEffect(() => {
 if (!isResizing) return;
 const handleMove = (e: PointerEvent) => {
 if (!dockRef.current) return;
 const rect = dockRef.current.getBoundingClientRect();
 setDockWidth(clampWidth(rect.right - e.clientX));
 };
 const handleUp = () => {
 setIsResizing(false);
 const w = dockRef.current?.getBoundingClientRect().width;
 if (w) localStorage.setItem(WIDTH_KEY, String(Math.round(w)));
 };
 window.addEventListener("pointermove", handleMove);
 window.addEventListener("pointerup", handleUp);
 window.addEventListener("pointercancel", handleUp);
 document.body.style.cursor = "col-resize";
 return () => {
 window.removeEventListener("pointermove", handleMove);
 window.removeEventListener("pointerup", handleUp);
 window.removeEventListener("pointercancel", handleUp);
 document.body.style.cursor = "";
 };
 }, [isResizing]);

 return (
 <div
 ref={dockRef}
 className={
 isExpanded
 ? "fixed bottom-0 left-0 right-0 top-11 z-[140] flex flex-col glass-hi shadow-2xl animate-fade-in p-2"
 : "relative h-full flex flex-col glass-rail border-l border-swarm-border/50"
 }
 style={
 isExpanded
 ? {}
 : collapsed
 ? { width: RAIL_WIDTH, minWidth: RAIL_WIDTH }
 : { width: `min(${dockWidth}px, 45vw)`, minWidth: RIGHT_DOCK_MIN }
 }
 >
 <div
 className={`shrink-0 flex ${
 collapsed
 ? "flex-col items-stretch gap-0.5 py-1"
 : "items-center border-b border-swarm-border/40"
 }`}
 >
 {TABS.map((tab) => {
 const Icon = tab.icon;
 const active = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => {
 if (collapsed) setCollapsed(false);
 else if (active) setCollapsed(true);
 setActiveTab(tab.id);
 setViewer(null);
 if (tab.id !== "glasschat") setIsExpanded(false);
 }}
 title={collapsed ? `${tab.label} — expand panel` : tab.label}
 aria-label={tab.label}
 aria-expanded={!collapsed && active}
 className={`flex items-center justify-center gap-1.5 min-w-0 h-9 text-mini font-medium transition-colors whitespace-nowrap ${
 collapsed ? "border-l-2" : "flex-1 px-2 border-b-2"
 } ${
 active
 ? "text-swarm-goldHi bg-swarm-gold/[0.06] border-swarm-gold"
 : "border-transparent text-swarm-textMuted hover:text-swarm-textDim hover:bg-swarm-border/20"
 }`}
 >
 <Icon className="size-3.5 shrink-0" />
 {!compact && !collapsed && <span className="truncate">{tab.label}</span>}
 </button>
 );
 })}

 {activeTab === "chat" && !collapsed && (
 <div className="mr-1 flex shrink-0 items-center">
 <LeadModeSelect />
 </div>
 )}
 <button
 onClick={onClose}
 className={`h-8 flex items-center justify-center text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-border/30 transition-colors shrink-0 ${
 collapsed ? "w-full" : "w-8"
 }`}
 title="Close panel"
 aria-label="Close panel"
 >
 <X className="size-3.5" />
 </button>
 </div>

 {!isExpanded && !collapsed && (
 <div
 className="absolute -left-2 top-0 z-40 flex h-full w-4 cursor-col-resize items-stretch justify-center group select-none"
 onPointerDown={handleResizeStart}
 title="Drag to resize panel"
 >
 <div className={`h-full w-0.5 transition-colors ${isResizing ? "bg-swarm-gold" : "bg-swarm-border/60 group-hover:bg-swarm-gold/80"}`} />
 </div>
 )}

 <div className={`flex-1 min-h-0 overflow-hidden ${collapsed ? "hidden" : ""}`}>
 <div className={`h-full ${activeTab === "chat" ? "" : "hidden"}`}>
 <LeadPanel />
 </div>
 {activeTab === "glasschat" && (
 <GlassChatEmbed
 projectPath={projectPath}
 isExpanded={isExpanded}
 onToggleExpand={() => setIsExpanded(!isExpanded)}
 />
 )}
 {activeTab === "git" && (
 viewer ? (
 <FileViewer target={viewer} onBack={() => setViewer(null)} />
 ) : (
 <GitPanel projectPath={projectPath} onOpen={setViewer} />
 )
 )}
 {activeTab === "snippets" && <SnippetsPanel />}
 </div>
 </div>
 );
}
