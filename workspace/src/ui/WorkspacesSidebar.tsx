"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { activatable, WorkspaceMark, BrandGlyph, cliBrand, LeadCrown, AgentMark } from "@swarm/board";
import {
  Search,
  X,
  GitBranch,
  GitPullRequest,
  Network,
  Plus,
  Trash2,
  LoaderCircle,
  Eye,
  EyeOff,
  MoreHorizontal,
  Pin,
  PinOff,
  Folder,
  FolderOpen,
  File,
  FileCode,
  FileText,
  FileCog,
  Braces,
  Hash,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  Check,
  FolderPlus,
  GitMerge,
  Terminal,
  Wrench,
  Cpu,
  Play,
  Copy,
  RefreshCw,
  Sparkles,
  Filter,
  Code2,
  Clock,
  Binary,
  Activity,
  Zap,
  Sliders,
  FolderGit2,
  UploadCloud,
  DownloadCloud,
  GitCommit,
  AlertCircle,
  Settings,
  Blocks,
  Gauge,
  type LucideIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore, getActiveProjectPath, type Workspace } from "../store.js";
import { useAgentsStore, type AgentStatus } from "@swarm/agents/ui";
import { useProjectStore } from "../openFiles.js";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import WorkspaceCreateDialog from "./WorkspaceCreateDialog.js";

const MIN_WIDTH = 250;
const MAX_WIDTH = 550;
const WIDTH_KEY = "swarm.sidebarWidth";

const clampWidth = (px: number) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, px));

type LeftTab = "workspaces" | "explorer" | "search" | "git" | "devtools" | "fleet";

// Tokens, not raw Tailwind palette entries: bg-green-400 stayed the same green
// in Rose, Forest and Dracula and clashed with every one of them.
const STATUS_DOT_CLASS: Record<AgentStatus, string> = {
  launching: "bg-swarm-warn",
  running: "bg-swarm-ok",
  idle: "bg-swarm-textMuted",
  error: "bg-swarm-err",
  done: "bg-swarm-gold",
};

function swarmsOfWs(wsId: string) {
  return useAgentsStore.getState().agents.filter((b) => b.workspaceId === wsId);
}

function hasActiveAgent(ws: Workspace, statuses: Record<string, AgentStatus>): boolean {
  return swarmsOfWs(ws.id).some((b) => statuses[b.id] === "running" || statuses[b.id] === "launching");
}

const AGENT_COLORS = ["#c9a227", "#8fae7a", "#7f9db8", "#b79ae0", "#c66b5a", "#7fb3ab"];

interface Props {
  projectPath?: string | null;
  pinned?: boolean;
  onTogglePin?: () => void;
  onClose?: () => void;
  /** App-level row rendered at the very top of the sidebar (mark, overflow
   *  menu, panel toggles). A node, not a set of callbacks: the host owns what
   *  those actions are. */
  topBar?: React.ReactNode;
  onOpenProject?: () => void;
  onOpenGit?: () => void;
  onOpenExtensions?: () => void;
  onOpenUsage?: () => void;
  onOpenSettings?: () => void;
  themePickerSlot?: React.ReactNode;
}

interface ViewerTarget {
  path: string;
  line?: number;
  diff?: boolean;
  projectPath?: string | null;
}

interface FileNode {
  name: string;
  path: string;
  is_file: boolean;
  is_dir: boolean;
  children?: FileNode[];
  expanded?: boolean;
}

function getFileIcon(filename: string): { Icon: LucideIcon; className: string } {
  const ext = filename.split(".").pop()?.toLowerCase();
  const map: Record<string, { Icon: LucideIcon; className: string }> = {
    ts: { Icon: FileCode, className: "text-swarm-gold" },
    tsx: { Icon: FileCode, className: "text-swarm-goldHi" },
    js: { Icon: FileCode, className: "text-swarm-honey" },
    jsx: { Icon: FileCode, className: "text-swarm-goldHi" },
    rs: { Icon: FileCode, className: "text-swarm-err" },
    json: { Icon: Braces, className: "text-swarm-amber" },
    md: { Icon: FileText, className: "text-swarm-textDim" },
    css: { Icon: Hash, className: "text-swarm-gold" },
    scss: { Icon: Hash, className: "text-swarm-gold" },
    html: { Icon: FileCode, className: "text-swarm-warn" },
    toml: { Icon: FileCog, className: "text-swarm-textMuted" },
    yaml: { Icon: FileCog, className: "text-swarm-textMuted" },
    yml: { Icon: FileCog, className: "text-swarm-textMuted" },
  };
  return map[ext || ""] || { Icon: File, className: "text-swarm-textMuted" };
}

function FileViewer({ target, onBack }: { target: ViewerTarget; onBack: () => void }) {
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const addOpenFile = useProjectStore((s) => s.addOpenFile);

  // Feed opened project files into Pheromone MCP context for Agents.
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
              args: ["-C", target.projectPath, "diff", "--", target.path],
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
  const allLines = content.split("\n");
  // Every line is its own row (needed for the jump-to-line highlight), so a
  // 40k-line lockfile meant 40k DOM nodes and a multi-second freeze on open.
  // The cap always keeps the jumped-to line inside the window.
  const MAX_ROWS = 3000;
  const capped = allLines.length > MAX_ROWS;
  const from = capped && target.line && target.line > MAX_ROWS ? target.line - Math.floor(MAX_ROWS / 2) : 0;
  const start = Math.max(0, Math.min(from, allLines.length - MAX_ROWS));
  const lines = capped ? allLines.slice(start, start + MAX_ROWS) : allLines;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-1.5 border-b border-swarm-border/30 px-2 py-1.5">
        <button
          onClick={onBack}
          className="flex size-5 shrink-0 items-center justify-center rounded text-swarm-textMuted transition-colors hover:bg-swarm-border/40 hover:text-swarm-text"
          title="Back"
        >
          <ArrowLeft className="size-3" />
        </button>
        <span className="truncate text-mini font-medium text-swarm-text" title={target.path}>
          {name}
        </span>
      </div>

      <div className="flex-1 overflow-auto scrollbar-sleek">
        {loading ? (
          <div className="px-3 py-2 text-mini text-swarm-textMuted">Loading…</div>
        ) : error ? (
          <div className="px-3 py-2 text-mini text-swarm-err">{error}</div>
        ) : content.trim() === "" ? (
          <div className="px-3 py-2 text-mini text-swarm-textMuted">Empty file</div>
        ) : (
          <pre className="py-1 font-mono text-micro leading-[1.5]">
            {capped && (
              <div className="mb-1 border-b border-swarm-border/30 px-2 py-1 text-swarm-textMuted/70">
                Showing lines {start + 1}–{start + lines.length} of {allLines.length}
              </div>
            )}
            {lines.map((l, i) => {
              const n = start + i + 1;
              const hit = target.line === n;
              return (
                <div
                  key={n}
                  ref={hit ? lineRef : undefined}
                  className={`flex gap-2 px-2 ${hit ? "bg-swarm-gold/10" : ""}`}
                >
                  <span className="w-7 shrink-0 select-none text-right text-swarm-textMuted/50">
                    {n}
                  </span>
                  <span className="whitespace-pre-wrap break-all text-swarm-textDim">{l || " "}</span>
                </div>
              );
            })}
          </pre>
        )}
      </div>
    </div>
  );
}

function ExplorerPanel({
  projectPath,
  onOpen,
}: {
  projectPath: string | null;
  onOpen: (t: ViewerTarget) => void;
}) {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterText, setFilterText] = useState("");

  const refreshTree = useCallback(async () => {
    if (!projectPath) return;
    setLoading(true);
    setError(null);
    try {
      const nodes = await loadDir(projectPath);
      setTree(nodes);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setLoading(false);
    }
  }, [projectPath]);

  useEffect(() => {
    if (!projectPath) return;
    let cancelled = false;
    setLoading(true);
    setTree([]);
    setSelected(null);
    setError(null);
    loadDir(projectPath)
      .then((nodes) => { if (!cancelled) { setTree(nodes); setLoading(false); } })
      .catch((e: any) => { if (!cancelled) { setError(String(e?.message ?? e)); setLoading(false); } });
    return () => { cancelled = true; };
  }, [projectPath]);

  async function loadDir(path: string): Promise<FileNode[]> {
    const files = await invoke<any[]>("list_directory", { path });
    return files.map((f: any) => ({
      name: f.name,
      path: f.path,
      is_file: f.is_file,
      is_dir: f.is_dir,
      children: f.is_dir ? [] : undefined,
      expanded: false,
    }));
  }

  async function toggleExpand(node: FileNode) {
    if (!node.is_dir) return;
    if (!node.expanded && (!node.children || node.children.length === 0)) {
      try {
        node.children = await loadDir(node.path);
      } catch (e: any) {
        setError(String(e?.message ?? e));
        return;
      }
    }
    node.expanded = !node.expanded;
    setTree((t) => [...t]);
  }

  function filterNodes(nodes: FileNode[], query: string): FileNode[] {
    if (!query.trim()) return nodes;
    const q = query.toLowerCase();
    return nodes
      .map((node) => {
        if (node.is_dir) {
          const matchingChildren = node.children ? filterNodes(node.children, query) : [];
          if (node.name.toLowerCase().includes(q) || matchingChildren.length > 0) {
            return { ...node, expanded: true, children: matchingChildren };
          }
          return null;
        }
        return node.name.toLowerCase().includes(q) ? node : null;
      })
      .filter(Boolean) as FileNode[];
  }

  function renderNodes(nodes: FileNode[], level = 0) {
    return nodes.map((node) => {
      const { Icon, className } = getFileIcon(node.name);
      const isSelected = selected === node.path;
      const activate = () => {
        setSelected(node.path);
        if (node.is_dir) toggleExpand(node);
        else onOpen({ path: node.path });
      };
      return (
        <div key={node.path}>
          <div
            className={`group flex h-7 items-center gap-1.5 pr-2 text-xs cursor-pointer transition-colors ${
              isSelected
                ? "bg-swarm-gold/[0.14] text-swarm-goldHi"
                : "text-swarm-textDim hover:bg-swarm-gold/10 hover:text-swarm-text"
            }`}
            style={{ paddingLeft: `${Math.min(level, 8) * 12 + 8}px` }}
            onClick={activate}
            {...activatable(activate, node.name)}
            aria-expanded={node.is_dir ? node.expanded : undefined}
            aria-current={isSelected ? "true" : undefined}
            title={node.path}
          >
            {node.is_dir ? (
              <>
                {node.expanded ? (
                  <ChevronDown size={13} className="text-swarm-textMuted flex-shrink-0" />
                ) : (
                  <ChevronRight size={13} className="text-swarm-textMuted flex-shrink-0" />
                )}
                {node.expanded ? (
                  <FolderOpen size={14} className="text-swarm-gold flex-shrink-0" />
                ) : (
                  <Folder size={14} className="text-swarm-gold flex-shrink-0" />
                )}
              </>
            ) : (
              <>
                <span className="w-[13px] flex-shrink-0" />
                <Icon size={14} className={`${className} flex-shrink-0`} />
              </>
            )}
            <span className="ml-0.5 truncate">{node.name}</span>
          </div>
          {node.expanded && node.children && (
            node.children.length === 0
              ? <div className="py-1 text-micro text-swarm-textMuted/70" style={{ paddingLeft: `${Math.min(level + 1, 8) * 12 + 35}px` }}>empty</div>
              : renderNodes(node.children, level + 1)
          )}
        </div>
      );
    });
  }

  if (!projectPath) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 text-center text-swarm-textMuted">
        <FolderOpen className="size-6 mb-2 opacity-50 text-swarm-gold" />
        <p className="text-xs font-medium">No project open</p>
      </div>
    );
  }

  const displayedTree = filterNodes(tree, filterText);

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Explorer Instant File Filter Toolbar */}
      <div className="p-2 border-b border-swarm-border/30 flex items-center gap-1.5 shrink-0">
        <div className="flex-1 flex h-7 items-center gap-1.5 rounded-md border border-swarm-border/50 glass-inset px-2 focus-within:border-swarm-gold/40">
          <Filter className="size-3 shrink-0 text-swarm-textMuted" />
          <input
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter files in tree…"
            spellCheck={false}
            className="min-w-0 flex-1 bg-transparent py-0.5 text-mini text-swarm-text outline-none placeholder:text-swarm-textMuted/50"
          />
          {filterText && (
            <button
              onClick={() => setFilterText("")}
              className="text-swarm-textMuted hover:text-swarm-text"
              title="Clear filter"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        <button
          onClick={refreshTree}
          disabled={loading}
          className="flex size-7 shrink-0 items-center justify-center rounded-md border border-swarm-border/40 text-swarm-textMuted hover:text-swarm-gold hover:bg-swarm-border/30 transition-colors disabled:opacity-50"
          title="Refresh file tree"
        >
          <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek">
        {loading ? (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-swarm-textMuted">
            <LoaderCircle className="size-3 animate-spin" /> Loading…
          </div>
        ) : error && tree.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center text-swarm-textMuted">
            <FolderOpen className="size-6 mb-2 opacity-50 text-swarm-err" />
            <p className="text-xs font-medium text-swarm-err">Can’t read this folder</p>
            <p className="mt-1 break-words text-micro text-swarm-textMuted/70" title={projectPath}>{error}</p>
          </div>
        ) : displayedTree.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 text-center text-swarm-textMuted">
            <FolderOpen className="size-6 mb-2 opacity-50 text-swarm-gold" />
            <p className="text-xs font-medium">{filterText ? "No matching files" : "This folder is empty"}</p>
            {filterText && (
              <button
                onClick={() => setFilterText("")}
                className="mt-2 text-micro text-swarm-gold underline hover:opacity-80"
              >
                Clear filter
              </button>
            )}
          </div>
        ) : (
          <div className="py-1.5">
            {error && (
              <div className="mx-1.5 mb-1 flex items-start gap-1.5 rounded-md border border-swarm-err/30 bg-swarm-err/10 px-2 py-1 text-micro text-swarm-err">
                <span className="min-w-0 flex-1 break-words">{error}</span>
                <button onClick={() => setError(null)} title="Dismiss" aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
                  <X className="size-3" />
                </button>
              </div>
            )}
            {renderNodes(displayedTree)}
          </div>
        )}
      </div>
    </div>
  );
}

function SearchPanel({
  projectPath,
  onOpen,
}: {
  projectPath: string | null;
  onOpen: (t: ViewerTarget) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{ path: string; line: number; text: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [ran, setRan] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query.trim() || !projectPath) return;
    setSearching(true);
    setError(null);
    try {
      const grep = await invoke<string>("run_command", {
        command: "rg",
        args: ["--no-heading", "--line-number", query, projectPath],
      });
      const lines = grep.split("\n").filter(Boolean).slice(0, 100);
      setResults(
        lines.flatMap((l) => {
          const m = l.match(/^(.*?):(\d+):([\s\S]*)$/);
          return m ? [{ path: m[1], line: parseInt(m[2], 10), text: m[3] }] : [];
        })
      );
    } catch (e: any) {
      const msg = String(e?.message ?? e);
      setResults([]);
      setError(/no such file|not found|ENOENT|cannot run|No such/i.test(msg) ? "ripgrep (rg) is not installed or not on PATH." : null);
    } finally {
      setSearching(false);
      setRan(true);
    }
  };

  const relative = (p: string) => (projectPath && p.startsWith(projectPath) ? p.slice(projectPath.length).replace(/^[\\/]/, "") : p);

  return (
    <div className="h-full flex flex-col">
      <div className="p-2 border-b border-swarm-border/30">
        <div className="flex h-7 items-center gap-1.5 rounded-md border border-swarm-border/50 glass-inset px-2 focus-within:border-swarm-gold/40 focus-within:ring-[1px] focus-within:ring-swarm-gold/20">
          <Search className="size-3 shrink-0 text-swarm-textMuted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
            placeholder="Search code…"
            spellCheck={false}
            disabled={!projectPath}
            className="min-w-0 flex-1 bg-transparent py-1 text-mini text-swarm-text outline-none placeholder:text-swarm-textMuted/50 disabled:cursor-not-allowed"
          />
          {query && (
            <button
              onClick={() => { setQuery(""); setResults([]); setRan(false); setError(null); }}
              title="Clear search"
              aria-label="Clear search"
              className="flex size-4 shrink-0 items-center justify-center rounded text-swarm-textMuted hover:text-swarm-text"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
        {results.length > 0 && (
          <div className="px-0.5 pt-1.5 text-micro text-swarm-textMuted">
            {results.length}{results.length === 100 ? "+" : ""} match{results.length === 1 ? "" : "es"}
          </div>
        )}
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek">
        {searching ? (
          <div className="flex items-center gap-2 px-3 py-2 text-mini text-swarm-textMuted">
            <LoaderCircle className="size-3 animate-spin" /> Searching…
          </div>
        ) : !projectPath ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center text-swarm-textMuted">
            <Search className="size-6 mb-2 opacity-50 text-swarm-gold" />
            <p className="text-xs font-medium">No project open</p>
            <p className="mt-1 text-micro text-swarm-textMuted/70">Bind a folder to search it.</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center">
            <Search className="size-6 mb-2 opacity-50 text-swarm-err" />
            <p className="text-xs font-medium text-swarm-err">Search unavailable</p>
            <p className="mt-1 text-micro text-swarm-textMuted/70">{error}</p>
          </div>
        ) : results.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full px-4 text-center text-swarm-textMuted">
            <Search className="size-6 mb-2 opacity-50 text-swarm-gold" />
            <p className="text-xs font-medium">{ran && query ? "No results" : "Search project code"}</p>
            {!ran && <p className="mt-1 text-micro text-swarm-textMuted/70">Type a query and press Enter.</p>}
          </div>
        ) : (
          <div className="py-1">
            {results.map((r, i) => (
              <div
                key={`${r.path}:${r.line}:${i}`}
                onClick={() => onOpen({ path: r.path, line: r.line })}
                {...activatable(() => onOpen({ path: r.path, line: r.line }), `${relative(r.path)} line ${r.line}`)}
                title={`${r.path}:${r.line}`}
                className="cursor-pointer px-3 py-1.5 text-mini transition-colors hover:bg-swarm-border/20"
              >
                <div className="flex items-baseline gap-1.5">
                  <span className="min-w-0 flex-1 truncate text-swarm-gold">{relative(r.path)}</span>
                  <span className="shrink-0 font-mono text-micro text-swarm-textMuted/70">{r.line}</span>
                </div>
                <div className="truncate font-mono text-micro text-swarm-textMuted/70">{r.text.trim()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Developer Playground & DevTools Panel ───────────────────────
function DevToolsPanel({ projectPath }: { projectPath: string | null }) {
  const [subTab, setSubTab] = useState<"regex" | "json" | "base64" | "time" | "scripts">("regex");

  // Regex State
  const [regexPattern, setRegexPattern] = useState("([a-zA-Z0-9_-]+)@([a-zA-Z0-9_-]+)\\.([a-zA-Z]{2,5})");
  const [regexFlags, setRegexFlags] = useState("g");
  const [regexText, setRegexText] = useState("Contact us at dev@swarm.ai or team@antigravity.dev for issues.");
  const [regexMatches, setRegexMatches] = useState<string[]>([]);
  const [regexError, setRegexError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setRegexError(null);
      const re = new RegExp(regexPattern, regexFlags);
      const matches: string[] = [];
      let m: RegExpExecArray | null;
      if (regexFlags.includes("g")) {
        while ((m = re.exec(regexText)) !== null) {
          matches.push(m[0]);
          if (!re.global || m.index === re.lastIndex) re.lastIndex++;
        }
      } else {
        const single = re.exec(regexText);
        if (single) matches.push(single[0]);
      }
      setRegexMatches(matches);
    } catch (e: any) {
      setRegexError(String(e?.message ?? e));
      setRegexMatches([]);
    }
  }, [regexPattern, regexFlags, regexText]);

  // JSON State
  const [jsonText, setJsonText] = useState('{\n  "name": "@swarm/core",\n  "status": "online",\n  "agents": 4,\n  "lead": true\n}');
  const [jsonStatus, setJsonStatus] = useState<{ ok: boolean; message: string } | null>(null);

  const formatJson = (spaces = 2) => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed, null, spaces));
      setJsonStatus({ ok: true, message: `Formatted with ${spaces} spaces` });
    } catch (e: any) {
      setJsonStatus({ ok: false, message: e.message });
    }
  };

  const minifyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      setJsonText(JSON.stringify(parsed));
      setJsonStatus({ ok: true, message: "Minified successfully" });
    } catch (e: any) {
      setJsonStatus({ ok: false, message: e.message });
    }
  };

  // Base64 State
  const [b64Input, setB64Input] = useState("Swarm AI Agent Copilot");
  const [b64Mode, setB64Mode] = useState<"b64-enc" | "b64-dec" | "url-enc" | "url-dec">("b64-enc");
  const [b64Output, setB64Output] = useState("");

  useEffect(() => {
    try {
      if (b64Mode === "b64-enc") setB64Output(btoa(unescape(encodeURIComponent(b64Input))));
      else if (b64Mode === "b64-dec") setB64Output(decodeURIComponent(escape(atob(b64Input))));
      else if (b64Mode === "url-enc") setB64Output(encodeURIComponent(b64Input));
      else if (b64Mode === "url-dec") setB64Output(decodeURIComponent(b64Input));
    } catch (e: any) {
      setB64Output(`Error: ${e.message}`);
    }
  }, [b64Input, b64Mode]);

  // Time Converter State
  const [timestamp, setTimestamp] = useState<string>(() => String(Math.floor(Date.now() / 1000)));
  const [isoDate, setIsoDate] = useState<string>(() => new Date().toISOString());

  const handleTsChange = (val: string) => {
    setTimestamp(val);
    const num = Number(val);
    if (!isNaN(num)) {
      const ms = num > 1e11 ? num : num * 1000;
      setIsoDate(new Date(ms).toISOString());
    }
  };

  const handleIsoChange = (val: string) => {
    setIsoDate(val);
    const ms = Date.parse(val);
    if (!isNaN(ms)) {
      setTimestamp(String(Math.floor(ms / 1000)));
    }
  };

  // Script Runner State
  const [scriptOutput, setScriptOutput] = useState<string | null>(null);
  const [scriptRunning, setScriptRunning] = useState(false);

  const runQuickScript = async (name: string, command: string, args: string[]) => {
    if (!projectPath) return;
    setScriptRunning(true);
    setScriptOutput(`Running: ${command} ${args.join(" ")} in ${projectPath}...\n`);
    try {
      const res = await invoke<string>("run_command", {
        command,
        args: ["-C", projectPath, ...args],
      });
      setScriptOutput(res || "(Command completed with empty output)");
    } catch (e: any) {
      setScriptOutput(`Failed:\n${String(e?.message ?? e)}`);
    } finally {
      setScriptRunning(false);
    }
  };

  const SUB_TABS = [
    { id: "regex", label: "Regex", icon: Sparkles },
    { id: "json", label: "JSON", icon: Braces },
    { id: "base64", label: "B64/URL", icon: Binary },
    { id: "time", label: "Epoch", icon: Clock },
    { id: "scripts", label: "Scripts", icon: Terminal },
  ] as const;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-swarm-canvas">
      {/* Sub-tab Navigation Bar */}
      <div className="flex shrink-0 items-center border-b border-swarm-border/40 bg-swarm-surface/60 p-1 gap-0.5 overflow-x-auto scrollbar-none">
        {SUB_TABS.map((t) => {
          const Icon = t.icon;
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`flex items-center gap-1 rounded-md px-2 py-1 text-mini font-medium transition-all ${
                active
                  ? "bg-swarm-gold/20 text-swarm-goldHi border border-swarm-gold/40 shadow-sm"
                  : "text-swarm-textMuted hover:bg-swarm-border/30 hover:text-swarm-text"
              }`}
            >
              <Icon size={12} className={active ? "text-swarm-gold" : "text-swarm-textMuted"} />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Sub-tab Content Body */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3 scrollbar-sleek space-y-3 text-xs">
        {/* Regex Playground */}
        {subTab === "regex" && (
          <div className="space-y-2.5">
            <div>
              <div className="flex items-center justify-between mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                <span>Pattern & Flags</span>
              </div>
              <div className="flex gap-1.5">
                <input
                  value={regexPattern}
                  onChange={(e) => setRegexPattern(e.target.value)}
                  placeholder="Regex pattern…"
                  className="flex-1 rounded-lg border border-swarm-border/60 glass-inset px-2.5 py-1.5 font-mono text-xs text-swarm-text outline-none focus:border-swarm-gold/60"
                />
                <input
                  value={regexFlags}
                  onChange={(e) => setRegexFlags(e.target.value)}
                  placeholder="gims"
                  className="w-14 rounded-lg border border-swarm-border/60 glass-inset px-2 py-1.5 font-mono text-xs text-center text-swarm-gold outline-none"
                />
              </div>
            </div>

            <div>
              <div className="mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                Test String
              </div>
              <textarea
                value={regexText}
                onChange={(e) => setRegexText(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-swarm-border/60 glass-inset p-2 font-mono text-xs text-swarm-textDim outline-none focus:border-swarm-gold/60"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                <span>Matches ({regexMatches.length})</span>
              </div>
              {regexError ? (
                <div className="rounded-lg border border-swarm-err/30 bg-swarm-err/10 p-2 text-micro text-swarm-err font-mono">
                  {regexError}
                </div>
              ) : regexMatches.length === 0 ? (
                <div className="rounded-lg border border-swarm-border/40 bg-swarm-surface/40 p-2 text-micro text-swarm-textMuted italic">
                  No matches found.
                </div>
              ) : (
                <div className="space-y-1 max-h-36 overflow-y-auto scrollbar-sleek">
                  {regexMatches.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 rounded bg-swarm-gold/10 border border-swarm-gold/20 px-2 py-1 font-mono text-micro text-swarm-goldHi">
                      <span className="text-swarm-textMuted font-bold">#{idx + 1}</span>
                      <span className="truncate">{m}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* JSON Playground */}
        {subTab === "json" && (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">JSON Document</span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => formatJson(2)}
                  className="rounded px-2 py-0.5 text-micro font-medium text-swarm-gold border border-swarm-gold/30 hover:bg-swarm-gold/15 transition-colors"
                >
                  Prettify
                </button>
                <button
                  onClick={minifyJson}
                  className="rounded px-2 py-0.5 text-micro font-medium text-swarm-textDim border border-swarm-border/50 hover:bg-swarm-border/30 transition-colors"
                >
                  Minify
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(jsonText);
                    setJsonStatus({ ok: true, message: "Copied to clipboard" });
                  }}
                  className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-micro text-swarm-textMuted hover:text-swarm-text"
                >
                  <Copy size={11} />
                </button>
              </div>
            </div>

            <textarea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              spellCheck={false}
              className="w-full rounded-lg border border-swarm-border/60 glass-inset p-2 font-mono text-xs text-swarm-text outline-none focus:border-swarm-gold/60"
            />

            {jsonStatus && (
              <div className={`rounded-lg border p-2 text-micro font-mono ${
                jsonStatus.ok ? "border-swarm-ok/40 bg-swarm-ok/10 text-swarm-ok" : "border-swarm-err/40 bg-swarm-err/10 text-swarm-err"
              }`}>
                {jsonStatus.message}
              </div>
            )}
          </div>
        )}

        {/* Base64 & URL */}
        {subTab === "base64" && (
          <div className="space-y-2.5">
            <div className="flex items-center gap-1 rounded-lg border border-swarm-border/40 p-0.5 bg-swarm-surface/40">
              {(["b64-enc", "b64-dec", "url-enc", "url-dec"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setB64Mode(mode)}
                  className={`flex-1 rounded py-1 text-micro font-medium transition-colors ${
                    b64Mode === mode ? "bg-swarm-gold text-swarm-canvas font-semibold" : "text-swarm-textMuted hover:text-swarm-text"
                  }`}
                >
                  {mode.toUpperCase()}
                </button>
              ))}
            </div>

            <div>
              <div className="mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">Input Text</div>
              <textarea
                value={b64Input}
                onChange={(e) => setB64Input(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-swarm-border/60 glass-inset p-2 font-mono text-xs text-swarm-text outline-none"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                <span>Output</span>
                <button
                  onClick={() => navigator.clipboard.writeText(b64Output)}
                  className="flex items-center gap-1 text-micro text-swarm-gold hover:underline"
                >
                  <Copy size={11} /> Copy
                </button>
              </div>
              <textarea
                readOnly
                value={b64Output}
                rows={3}
                className="w-full rounded-lg border border-swarm-border/60 bg-swarm-surface/70 p-2 font-mono text-xs text-swarm-goldHi outline-none"
              />
            </div>
          </div>
        )}

        {/* Epoch & Timestamp */}
        {subTab === "time" && (
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                <span>Unix Epoch (Seconds)</span>
                <button
                  onClick={() => {
                    const now = Math.floor(Date.now() / 1000);
                    handleTsChange(String(now));
                  }}
                  className="text-micro text-swarm-gold hover:underline"
                >
                  Current Time
                </button>
              </div>
              <input
                value={timestamp}
                onChange={(e) => handleTsChange(e.target.value)}
                placeholder="1710000000"
                className="w-full rounded-lg border border-swarm-border/60 glass-inset px-2.5 py-1.5 font-mono text-xs text-swarm-text outline-none"
              />
            </div>

            <div>
              <div className="mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">ISO 8601 UTC Time</div>
              <input
                value={isoDate}
                onChange={(e) => handleIsoChange(e.target.value)}
                placeholder="2026-08-17T12:00:00.000Z"
                className="w-full rounded-lg border border-swarm-border/60 glass-inset px-2.5 py-1.5 font-mono text-xs text-swarm-gold outline-none"
              />
            </div>
          </div>
        )}

        {/* Dev Scripts Hub */}
        {subTab === "scripts" && (
          <div className="space-y-3">
            <div className="text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">Workspace Quick Commands</div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                disabled={scriptRunning || !projectPath}
                onClick={() => runQuickScript("Git Status", "git", ["status", "-s"])}
                className="flex items-center gap-1.5 rounded-lg border border-swarm-border/60 bg-swarm-surface/60 px-2.5 py-1.5 text-xs text-swarm-text hover:border-swarm-gold/50 hover:bg-swarm-gold/10 transition-colors disabled:opacity-50"
              >
                <GitBranch size={12} className="text-swarm-gold" />
                <span>git status</span>
              </button>
              <button
                disabled={scriptRunning || !projectPath}
                onClick={() => runQuickScript("Git Diff", "git", ["diff", "--stat"])}
                className="flex items-center gap-1.5 rounded-lg border border-swarm-border/60 bg-swarm-surface/60 px-2.5 py-1.5 text-xs text-swarm-text hover:border-swarm-gold/50 hover:bg-swarm-gold/10 transition-colors disabled:opacity-50"
              >
                <Code2 size={12} className="text-swarm-amber" />
                <span>git diff stat</span>
              </button>
              <button
                disabled={scriptRunning || !projectPath}
                onClick={() => runQuickScript("Git Log", "git", ["log", "-n", "5", "--oneline"])}
                className="flex items-center gap-1.5 rounded-lg border border-swarm-border/60 bg-swarm-surface/60 px-2.5 py-1.5 text-xs text-swarm-text hover:border-swarm-gold/50 hover:bg-swarm-gold/10 transition-colors disabled:opacity-50"
              >
                <Activity size={12} className="text-swarm-ok" />
                <span>git log -5</span>
              </button>
              <button
                disabled={scriptRunning || !projectPath}
                onClick={() => runQuickScript("Git Branches", "git", ["branch", "-a"])}
                className="flex items-center gap-1.5 rounded-lg border border-swarm-border/60 bg-swarm-surface/60 px-2.5 py-1.5 text-xs text-swarm-text hover:border-swarm-gold/50 hover:bg-swarm-gold/10 transition-colors disabled:opacity-50"
              >
                <GitMerge size={12} className="text-swarm-goldHi" />
                <span>git branches</span>
              </button>
            </div>

            {scriptOutput && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                  <span>Output</span>
                  <button onClick={() => setScriptOutput(null)} className="text-swarm-textMuted hover:text-swarm-text">
                    <X size={11} />
                  </button>
                </div>
                <pre className="max-h-48 overflow-auto rounded-lg border border-swarm-border/60 bg-swarm-canvas p-2 font-mono text-micro leading-relaxed text-swarm-textDim scrollbar-sleek">
                  {scriptOutput}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Swarm Fleet Monitor Panel ───────────────────────────────────
function FleetPanel({ onSelectWorkspace }: { onSelectWorkspace: (wsId: string) => void }) {
  const agents = useAgentsStore((s) => s.agents);
  const statuses = useAgentsStore((s) => s.agentStatuses);
  const workspaces = useWorkspaceStore((s) => s.workspaces);

  const runningCount = agents.filter((a) => statuses[a.id] === "running" || statuses[a.id] === "launching").length;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-swarm-canvas">
      {/* Fleet Overview Header */}
      <div className="flex items-center justify-between border-b border-swarm-border/40 bg-swarm-surface/70 px-3 py-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-swarm-text">
          <Cpu size={14} className="text-swarm-gold" />
          <span>Swarm Agent Fleet</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="flex items-center gap-1 rounded-full bg-swarm-ok/10 border border-swarm-ok/30 px-2 py-0.5 text-micro font-medium text-swarm-ok">
            <span className="size-1.5 rounded-full bg-swarm-ok animate-pulse" />
            {runningCount} Active
          </span>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-micro text-swarm-textMuted font-mono">
            {agents.length} Total
          </span>
        </div>
      </div>

      {/* Agents Fleet List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5 scrollbar-sleek">
        {agents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center text-swarm-textMuted">
            <Cpu className="size-8 mb-2 opacity-40 text-swarm-gold" />
            <p className="text-xs font-medium">No agents spawned</p>
            <p className="mt-1 text-micro text-swarm-textMuted/70">Create a workHive to launch swarm agents.</p>
          </div>
        ) : (
          agents.map((a) => {
            const status = statuses[a.id] ?? "idle";
            const isRunning = status === "running" || status === "launching";
            const ws = workspaces.find((w) => w.id === a.workspaceId);
            const brand = cliBrand(a.cli);

            return (
              <div
                key={a.id}
                onClick={() => a.workspaceId && onSelectWorkspace(a.workspaceId)}
                className="group flex flex-col gap-1 rounded-xl border border-swarm-border/50 bg-swarm-surface/60 p-2.5 transition-all hover:border-swarm-gold/50 hover:bg-swarm-gold/[0.04] cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`size-2 rounded-full ${isRunning ? "bg-swarm-ok animate-pulse" : STATUS_DOT_CLASS[status]}`} />
                    <span className="font-semibold text-xs text-swarm-text">{a.customName || a.cliName}</span>
                    {a.isLead && (
                      <span className="inline-flex items-center gap-0.5 rounded bg-swarm-gold/20 px-1 py-0.5 text-[9px] font-bold text-swarm-goldHi uppercase">
                        <LeadCrown size={8} /> Lead
                      </span>
                    )}
                  </div>
                  <span className={`text-[10px] font-mono capitalize ${isRunning ? "text-swarm-ok font-medium" : "text-swarm-textMuted"}`}>
                    {status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-micro text-swarm-textMuted pt-0.5 border-t border-swarm-border/20">
                  <span className="truncate max-w-[130px] font-medium text-swarm-goldDim">{ws?.name || "Global Workspace"}</span>
                  <span className="font-mono text-swarm-textMuted/70">{a.model || a.cli}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default function ADEWorktreeSidebar({
  projectPath,
  pinned = true,
  onTogglePin,
  onClose,
  topBar,
  onOpenProject,
  onOpenGit,
  onOpenExtensions,
  onOpenUsage,
  onOpenSettings,
  themePickerSlot,
}: Props) {
  const [activeTab, setActiveTab] = useState<LeftTab>("workspaces");
  const [viewer, setViewer] = useState<ViewerTarget | null>(null);
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false);
  const gearBtnRef = useRef<HTMLButtonElement>(null);
  const [gearRect, setGearRect] = useState<DOMRect | null>(null);

  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activateAndSync = useWorkspaceStore((s) => s.activateWorkspaceAndSync);
  const updateWorkspace = useWorkspaceStore((s) => s.updateWorkspace);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const commitDeleteWorkspace = useWorkspaceStore((s) => s.commitDeleteWorkspace);
  const cancelDeleteWorkspace = useWorkspaceStore((s) => s.cancelDeleteWorkspace);
  const renamingWorkspaceId = useWorkspaceStore((s) => s.renamingWorkspaceId);
  const setRenamingWorkspaceId = useWorkspaceStore((s) => s.setRenamingWorkspaceId);
  const boardOpen = useWorkspaceStore((s) => s.boardOpen);
  const setBoardOpen = useWorkspaceStore((s) => s.setBoardOpen);
  const agentStatuses = useAgentsStore((s) => s.agentStatuses);

  // Read once on mount: a resize the user made is theirs, and snapping back to
  // 280px on every app start is the kind of small betrayal that reads as a bug.
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return Number.isFinite(saved) && saved > 0 ? clampWidth(saved) : 300;
  });
  const [isResizing, setIsResizing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hideSleeping, setHideSleeping] = useState(false);
  const [workspacesCollapsed, setWorkspacesCollapsed] = useState(false);
  const [editValue, setEditValue] = useState("");
  const [contextMenu, setContextMenu] = useState<{ ws: Workspace; x: number; y: number } | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!sidebarRef.current) return;
      const rect = sidebarRef.current.getBoundingClientRect();
      setSidebarWidth(clampWidth(e.clientX - rect.left));
    };
    const handleMouseUp = () => setIsResizing(false);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    // Pin the cursor and kill selection document-wide for the drag: otherwise
    // the pointer flickers to a text I-beam over every label it crosses and the
    // drag paints a selection across the whole sidebar.
    const prevCursor = document.body.style.cursor;
    const prevSelect = document.body.style.userSelect;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = prevCursor;
      document.body.style.userSelect = prevSelect;
    };
  }, [isResizing]);

  useEffect(() => {
    localStorage.setItem(WIDTH_KEY, String(sidebarWidth));
  }, [sidebarWidth]);


  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    // Not a click listener — the portal's own backdrop already handles
    // click-away. What was missing: Escape, and dismissal on the events that
    // strand a menu pinned to stale page coordinates (window resize, focus loss).
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    window.addEventListener("blur", close);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("blur", close);
      window.removeEventListener("resize", close);
    };
  }, [contextMenu]);

  const visibleWorkspaces = workspaces.filter((ws) => {
    if (hideSleeping && !hasActiveAgent(ws, agentStatuses) && swarmsOfWs(ws.id).length === 0) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    // Path too: two workspaces auto-named after sibling folders ("web", "web")
    // are indistinguishable by name, and the folder is the only thing that tells
    // them apart.
    return ws.name.toLowerCase().includes(q) || ws.boundProjectPath.toLowerCase().includes(q);
  });
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  const handleAdd = () => {
    setCreateDialogOpen(true);
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingWorkspaceId(id);
    setEditValue(currentName);
  };

  const commitRename = () => {
    if (renamingWorkspaceId && editValue.trim()) {
      renameWorkspace(renamingWorkspaceId, editValue.trim());
    }
    setRenamingWorkspaceId(null);
    setEditValue("");
  };

  // Opened at the raw cursor point, the menu ran off the window whenever the
  // click was near the bottom or right edge — with no scroll to reach it, the
  // Delete item was simply unclickable. Keep it fully on screen.
  const MENU_W = 176;
  const MENU_H = 116;
  const openMenu = useCallback((ws: Workspace, x: number, y: number) => {
    setContextMenu({
      ws,
      x: Math.max(4, Math.min(x, window.innerWidth - MENU_W - 4)),
      y: Math.max(4, Math.min(y, window.innerHeight - MENU_H - 4)),
    });
  }, []);

  const handleContextMenu = (e: React.MouseEvent, ws: Workspace) => {
    e.preventDefault();
    openMenu(ws, e.clientX, e.clientY);
  };

function GitSidebarPanel({ projectPath }: { projectPath: string | null }) {
  const [branch, setBranch] = useState("main");
  const [changedCount, setChangedCount] = useState(0);
  const [isGitRepo, setIsGitRepo] = useState(true);
  const [branches, setBranches] = useState<string[]>([]);
  const [commitMsg, setCommitMsg] = useState("");
  const [diffStats, setDiffStats] = useState("");
  const [fullDiff, setFullDiff] = useState("");
  const [diffViewMode, setDiffViewMode] = useState<"visual" | "stats">("visual");
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; isError?: boolean } | null>(null);

  const refresh = useCallback(async () => {
    if (!projectPath) return;
    try {
      const st = await invoke<{ branch: string; changed: number }>("git_status", { projectPath });
      setBranch(st.branch);
      setChangedCount(st.changed);
      setIsGitRepo(true);
      const brs = await invoke<string[]>("git_branches", { projectPath });
      setBranches(brs);
      const diff = await invoke<string>("git_diff", { projectPath }).catch(() => "");
      setDiffStats(diff);
      const raw = await invoke<string>("git_diff_full", { projectPath }).catch(() => "");
      setFullDiff(raw);
    } catch (e: any) {
      if (String(e).includes("Not a git repository")) {
        setIsGitRepo(false);
      }
    }
  }, [projectPath]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleCommit = async () => {
    if (!projectPath || !commitMsg.trim()) return;
    setLoading(true);
    try {
      const res = await invoke<{ success: boolean; stdout: string; stderr: string }>("git_commit", {
        projectPath,
        message: commitMsg.trim(),
      });
      if (res.success) {
        setStatusMsg({ text: res.stdout || "Committed successfully" });
        setCommitMsg("");
        await refresh();
      } else {
        setStatusMsg({ text: res.stderr || "Commit failed", isError: true });
      }
    } catch (e: any) {
      setStatusMsg({ text: String(e), isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handlePush = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const res = await invoke<{ success: boolean; stdout: string; stderr: string }>("git_push", {
        projectPath,
        remote: "origin",
        branch,
      });
      setStatusMsg(res.success ? { text: res.stdout || "Pushed to origin" } : { text: res.stderr || "Push failed", isError: true });
      await refresh();
    } catch (e: any) {
      setStatusMsg({ text: String(e), isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      const res = await invoke<{ success: boolean; stdout: string; stderr: string }>("git_pull", {
        projectPath,
        remote: "origin",
        branch,
      });
      setStatusMsg(res.success ? { text: res.stdout || "Pulled from origin" } : { text: res.stderr || "Pull failed", isError: true });
      await refresh();
    } catch (e: any) {
      setStatusMsg({ text: String(e), isError: true });
    } finally {
      setLoading(false);
    }
  };

  const handleInit = async () => {
    if (!projectPath) return;
    setLoading(true);
    try {
      await invoke("git_init", { projectPath });
      setStatusMsg({ text: "Git repository initialized" });
      await refresh();
    } catch (e: any) {
      setStatusMsg({ text: String(e), isError: true });
    } finally {
      setLoading(false);
    }
  };

  if (!projectPath) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center text-xs text-zinc-500">
        <FolderGit2 size={32} className="text-zinc-600 mb-2" />
        <p>No workspace folder bound</p>
      </div>
    );
  }

  if (!isGitRepo) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center gap-3">
        <FolderGit2 size={36} className="text-amber-400/80" />
        <div>
          <h4 className="text-xs font-bold text-zinc-200">Not a Git Repository</h4>
          <p className="text-mini text-zinc-500 mt-1">Initialize git to track changes and push to GitHub.</p>
        </div>
        <button
          onClick={handleInit}
          disabled={loading}
          className="px-3.5 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-xs hover:bg-amber-400 transition-all cursor-pointer shadow-md"
        >
          Initialize Repository
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden text-xs">
      {/* Header Info */}
      <div className="p-3 border-b border-white/[0.06] bg-black/20 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-zinc-300 font-bold flex items-center gap-1.5 truncate">
            <GitBranch size={13} className="text-amber-400 shrink-0" />
            <span className="truncate">{branch}</span>
          </span>
          <span className="pro-badge pro-badge-amber text-[10px] shrink-0">
            {changedCount} modified
          </span>
        </div>

        {/* Quick Push / Pull buttons */}
        <div className="grid grid-cols-2 gap-1.5 pt-1">
          <button
            onClick={handlePush}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-amber-500/15 border border-amber-500/30 text-amber-300 hover:bg-amber-500/25 transition-all text-mini font-semibold cursor-pointer disabled:opacity-50"
            title="Push commits to origin"
          >
            <UploadCloud size={12} />
            <span>Push</span>
          </button>
          <button
            onClick={handlePull}
            disabled={loading}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-zinc-800/80 border border-zinc-700/60 text-zinc-200 hover:bg-zinc-700/80 transition-all text-mini font-semibold cursor-pointer disabled:opacity-50"
            title="Pull commits from origin"
          >
            <DownloadCloud size={12} />
            <span>Pull</span>
          </button>
        </div>
      </div>

      {/* Quick Commit Input */}
      <div className="p-3 border-b border-white/[0.06] bg-black/10 flex flex-col gap-2">
        <div className="flex gap-1.5">
          <input
            type="text"
            value={commitMsg}
            onChange={(e) => setCommitMsg(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleCommit(); }}
            placeholder="Commit message..."
            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg bg-zinc-950 border border-zinc-700/70 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/60 font-sans"
          />
          <button
            onClick={handleCommit}
            disabled={loading || !commitMsg.trim() || changedCount === 0}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold text-mini hover:bg-amber-400 transition-all disabled:opacity-40 cursor-pointer shrink-0"
          >
            Commit
          </button>
        </div>
      </div>

      {/* Changes Inspector */}
      <div className="flex-1 overflow-y-auto scrollbar-sleek p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-zinc-500">
          <span>Uncommitted Changes</span>
          <div className="flex items-center gap-1 bg-zinc-900 px-1 py-0.5 rounded border border-zinc-800">
            <button
              onClick={() => setDiffViewMode("visual")}
              className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${diffViewMode === "visual" ? "text-amber-300 font-bold bg-amber-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Visual
            </button>
            <button
              onClick={() => setDiffViewMode("stats")}
              className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${diffViewMode === "stats" ? "text-amber-300 font-bold bg-amber-500/20" : "text-zinc-500 hover:text-zinc-300"}`}
            >
              Stats
            </button>
          </div>
        </div>

        {diffViewMode === "visual" && fullDiff ? (
          <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] font-mono space-y-0.5 max-h-72 overflow-y-auto scrollbar-sleek">
            {fullDiff.split("\n").map((line, i) => {
              const isAdd = line.startsWith("+") && !line.startsWith("+++");
              const isDel = line.startsWith("-") && !line.startsWith("---");
              const isHeader = line.startsWith("diff --git") || line.startsWith("@@");
              return (
                <div
                  key={i}
                  className={`px-1 py-0.5 rounded-xs whitespace-pre-wrap break-all ${
                    isAdd
                      ? "bg-emerald-500/15 text-emerald-300 border-l-2 border-emerald-400"
                      : isDel
                      ? "bg-rose-500/15 text-rose-300 border-l-2 border-rose-400"
                      : isHeader
                      ? "text-amber-400 font-bold bg-zinc-900 py-0.5 px-1 my-0.5 rounded"
                      : "text-zinc-400"
                  }`}
                >
                  {line || " "}
                </div>
              );
            })}
          </div>
        ) : diffStats ? (
          <pre className="p-2.5 rounded-lg bg-zinc-950 border border-zinc-800 text-[10px] text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto scrollbar-sleek">
            {diffStats}
          </pre>
        ) : (
          <div className="p-4 text-center text-zinc-500 text-mini border border-dashed border-zinc-800 rounded-lg">
            Working tree clean — no uncommitted changes
          </div>
        )}

        {statusMsg && (
          <div className={`p-2 rounded-lg border text-mini font-mono ${
            statusMsg.isError ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
          }`}>
            {statusMsg.text}
          </div>
        )}
      </div>
    </div>
  );
}

  // Not LucideIcon: the Projects tab carries Swarm's own agent mark, which
  // is a plain function component, not a lucide forwardRef.
  const TABS: { id: LeftTab; label: string; icon: React.ComponentType<{ className?: string }>; count?: number }[] = [
    { id: "workspaces", label: "Projects", icon: WorkspaceMark, count: workspaces.length },
    { id: "explorer", label: "Explorer", icon: Folder },
    { id: "git", label: "Git Control", icon: FolderGit2 },
    { id: "search", label: "Global Search", icon: Search },
    { id: "devtools", label: "DevTools", icon: Wrench },
    { id: "fleet", label: "Swarm Fleet", icon: Cpu },
  ];

  return (
    <div
      ref={sidebarRef}
      className="relative h-full flex bg-[#090b10] border-r border-white/[0.08] shrink-0 font-sans antialiased select-none"
      style={{ width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: "50vw" }}
    >
      {/* ── Vertical Pro Activity Bar Rail (Far Left, 50px) ──────────────── */}
      <div className="w-[50px] shrink-0 flex flex-col items-center justify-between border-r border-white/[0.06] bg-[#07080d] py-2.5 z-20">
        {/* Top Section: App/Brand Logo & Activity Tabs */}
        <div className="flex flex-col items-center gap-1.5 w-full">
          {/* Activity Bar Tabs */}
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <div key={tab.id} className="relative w-full flex justify-center py-0.5 group">
                {/* Active Left Indicator Bar */}
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r bg-white shadow-[0_0_8px_rgba(255,255,255,0.7)]" />
                )}
                <button
                  onClick={() => { setActiveTab(tab.id); setViewer(null); }}
                  title={tab.label}
                  aria-label={tab.label}
                  className={`size-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                    active
                      ? "text-white bg-white/[0.14] border border-white/[0.24] shadow-md"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
                  }`}
                >
                  <Icon className="size-4.5" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Bottom Section: Theme Picker, Gear Settings, Pin & Close Actions */}
        <div className="flex flex-col items-center gap-1.5 w-full pt-2 border-t border-white/[0.06]">
          {/* Theme Picker Slot */}
          {themePickerSlot}

          {/* Settings & Tools Gear Button */}
          <button
            ref={gearBtnRef}
            onClick={() => {
              setGearRect(gearBtnRef.current?.getBoundingClientRect() ?? null);
              setSettingsMenuOpen((v) => !v);
            }}
            aria-haspopup="menu"
            aria-expanded={settingsMenuOpen}
            className={`size-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer ${
              settingsMenuOpen
                ? "text-white bg-white/[0.16] border border-white/[0.3] shadow-md"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.06]"
            }`}
            title="Settings & Tools (Open project, Git, Extensions, Usage)"
            aria-label="Settings and Tools"
          >
            <Settings size={18} className={settingsMenuOpen ? "rotate-45 transition-transform duration-200" : "transition-transform duration-200"} />
          </button>

          <button
            onClick={onTogglePin}
            className={`size-8 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              pinned ? "text-white bg-white/[0.12] border border-white/[0.2]" : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06]"
            }`}
            title={pinned ? "Unpin sidebar" : "Pin sidebar"}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
          >
            {pinned ? <PinOff size={13} /> : <Pin size={13} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="size-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.06] transition-colors cursor-pointer"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* ── Main Sidebar Panel Content Area ──────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 bg-gradient-to-b from-[#0c0e16]/98 to-[#090b11]/98 backdrop-blur-2xl">
        {/* App row — top-left corner */}
        {topBar && (
          <div
            className="flex h-11 shrink-0 items-center gap-0.5 border-b border-white/[0.06] bg-white/[0.01] px-3"
            data-tauri-drag-region
          >
            {topBar}
          </div>
        )}

        {/* Main Tab Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
          {viewer ? (
            <FileViewer target={viewer} onBack={() => setViewer(null)} />
          ) : activeTab === "explorer" ? (
            <ExplorerPanel projectPath={projectPath || null} onOpen={setViewer} />
          ) : activeTab === "git" ? (
            <GitSidebarPanel projectPath={projectPath || null} />
          ) : activeTab === "search" ? (
            <SearchPanel projectPath={projectPath || null} onOpen={setViewer} />
          ) : activeTab === "devtools" ? (
            <DevToolsPanel projectPath={projectPath || null} />
          ) : activeTab === "fleet" ? (
            <FleetPanel onSelectWorkspace={(wsId) => activateAndSync(wsId)} />
          ) : (
            /* Workspaces Tab Content */
            <>
              {/* WorkHive Top Action Header */}
              <div className="flex h-10 shrink-0 items-center justify-between px-3 border-b border-white/[0.06] bg-black/20">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-xs font-semibold text-white tracking-tight truncate">
                    Projects & Hives
                  </span>
                  <span className="px-1.5 py-0.2 rounded-full bg-white/[0.08] border border-white/[0.12] text-[10px] font-mono font-medium text-zinc-300 shrink-0">
                    {visibleWorkspaces.length}
                  </span>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setHideSleeping(!hideSleeping)}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      hideSleeping
                        ? "text-white bg-white/[0.12]"
                        : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
                    }`}
                    title={hideSleeping ? "Show all workHives" : "Hide sleeping workHives"}
                    aria-label="Toggle sleeping hives"
                  >
                    {hideSleeping ? <EyeOff size={13} /> : <Eye size={13} />}
                  </button>

                  <button
                    onClick={handleAdd}
                    className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold px-2.5 py-1 text-xs shadow-xs active:scale-95 transition-all cursor-pointer shrink-0"
                    title="Create New Project Workspace"
                  >
                    <Plus size={13} strokeWidth={2.5} />
                    <span>New Hive</span>
                  </button>
                </div>
              </div>

              {/* Filter workHives input */}
              <div className="px-3 py-2">
                <div className="flex h-8 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-2.5 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all shadow-inner">
                  <Search size={13} className="text-zinc-500 shrink-0" />
                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects & folders..."
                    aria-label="Filter workHives"
                    className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder:text-zinc-500 font-sans"
                    spellCheck={false}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      title="Clear filter"
                      className="text-zinc-500 hover:text-zinc-300"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              </div>

              {/* WorkHive Cards List */}
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek px-2 pb-2 space-y-2">
                  {visibleWorkspaces.length === 0 ? (
                    searchQuery ? (
                      <EmptyNote
                        text="Nothing matches that filter"
                        hint="Filters match a workHive's name and its folder."
                        actionLabel="Clear filter"
                        onAction={() => setSearchQuery("")}
                      />
                    ) : hideSleeping ? (
                      <EmptyNote
                        text="Every workHive is asleep"
                        hint="Sleeping means no agent is running in it."
                        actionLabel="Show sleeping"
                        onAction={() => setHideSleeping(false)}
                      />
                    ) : (
                      <EmptyNote
                        text="No workHives yet"
                        hint="A workHive is one workspace folder."
                        actionLabel="New WorkHive"
                        onAction={handleAdd}
                      />
                    )
                  ) : (
                    visibleWorkspaces.map((ws) => (
                      <div key={ws.id} className="relative" onContextMenu={(e) => handleContextMenu(e, ws)}>
                        <ProjectGroup
                          ws={ws}
                          isActive={ws.id === activeWorkspaceId}
                          hasActive={hasActiveAgent(ws, agentStatuses)}
                          onActivate={() => { if (!ws.isDeleting) activateAndSync(ws.id); }}
                          onMenu={(e) => openMenu(ws, e.clientX, e.clientY)}
                          isRenaming={renamingWorkspaceId === ws.id}
                          editValue={editValue}
                          onEditChange={setEditValue}
                          onCommitRename={commitRename}
                          onCancelRename={() => { setRenamingWorkspaceId(null); setEditValue(""); }}
                          onStartRename={() => startRename(ws.id, ws.name)}
                        />

                        {ws.isDeleting && (
                          <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-black/80 backdrop-blur-sm">
                            <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#161822] border border-white/[0.12] px-2.5 py-1 text-mini font-medium text-zinc-200 shadow-xl">
                              <LoaderCircle className="size-3 shrink-0 animate-spin text-zinc-400" />
                              <span className="truncate">Deleting…</span>
                              <button
                                onClick={(e) => { e.stopPropagation(); cancelDeleteWorkspace(ws.id); }}
                                title="Cancel deletion"
                                className="shrink-0 text-zinc-400 hover:text-zinc-200 transition-colors"
                              >
                                <X className="size-3" />
                              </button>
                              <button
                                onClick={(e) => { e.stopPropagation(); commitDeleteWorkspace(ws.id); }}
                                className="shrink-0 font-semibold text-red-400 transition-colors hover:opacity-80"
                              >
                                Confirm
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Bottom Quick Navigation Links */}
                <div className="px-2 pt-2 pb-2 border-t border-white/[0.06] flex flex-col gap-1 shrink-0 bg-black/20">
                  <button
                    onClick={() => setBoardOpen(!boardOpen)}
                    className={`flex h-8 items-center gap-2.5 rounded-xl px-2.5 text-xs font-semibold tracking-wider transition-all ${
                      boardOpen
                        ? "bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-sm"
                        : "border border-white/[0.04] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.07] hover:border-amber-500/30 hover:text-amber-200"
                    }`}
                    title="Toggle TaskComb Pipeline Board"
                  >
                    <Network size={14} className={boardOpen ? "text-amber-400" : "text-cyan-400"} />
                    <span className="tracking-widest font-mono text-[11px]">TASK PIPELINE</span>
                    {activeWorkspace?.taskCards && activeWorkspace.taskCards.length > 0 && (
                      <span className="ml-auto rounded-full bg-amber-500/20 text-amber-300 px-2 py-0.5 text-[10px] font-mono border border-amber-500/30">
                        {activeWorkspace.taskCards.length}
                      </span>
                    )}
                  </button>
                </div>

                <ActiveWorkspaceDetail ws={activeWorkspace} onOpenFile={setViewer} />
              </div>
            </>
          )}
        </div>
      </div>

      {contextMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[200]" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-[201] min-w-40 py-1 rounded-lg glass-hi animate-fade-in shadow-lg border border-swarm-border/40"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={() => setContextMenu(null)}
          >
            <button
              onClick={() => { startRename(contextMenu.ws.id, contextMenu.ws.name); setContextMenu(null); }}
              className="w-full px-3 py-1.5 text-left text-xs text-swarm-textDim hover:text-swarm-text hover:bg-swarm-gold/10 transition-colors"
            >
              Rename
            </button>
            <button
              onClick={() => {
                const colors = AGENT_COLORS;
                const nextColor = colors[(colors.indexOf(contextMenu.ws.color) + 1) % colors.length];
                updateWorkspace(contextMenu.ws.id, { color: nextColor });
                setContextMenu(null);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-swarm-textDim hover:text-swarm-text hover:bg-swarm-gold/10 transition-colors"
            >
              Cycle color
            </button>
            <div className="h-px bg-swarm-border/40 my-1 mx-2" />
            <button
              onClick={() => { deleteWorkspace(contextMenu.ws.id); setContextMenu(null); }}
              className="w-full px-3 py-1.5 text-left text-xs text-swarm-err hover:bg-swarm-err/15 transition-colors"
            >
              Delete
            </button>
          </div>
        </>,
        document.body,
      )}

      {/* Settings & Tools Popup Menu (Triggered by bottom rail Gear icon) */}
      {settingsMenuOpen && gearRect && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setSettingsMenuOpen(false)} />
          <div
            role="menu"
            aria-label="Settings and Tools Menu"
            className="fixed z-[301] w-64 rounded-2xl border border-white/[0.14] bg-[#0d0f17]/98 backdrop-blur-2xl p-1.5 shadow-2xl shadow-black/90 animate-fade-in flex flex-col gap-0.5"
            style={{
              left: Math.min(gearRect.right + 8, window.innerWidth - 270),
              bottom: Math.max(12, window.innerHeight - gearRect.bottom),
            }}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500 border-b border-white/[0.06] mb-1 flex items-center justify-between">
              <span>Settings & Tools</span>
              <span className="size-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
            </div>

            <button
              onClick={() => { setSettingsMenuOpen(false); onOpenProject?.(); }}
              className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left hover:bg-white/[0.08] hover:border-amber-500/30 border border-transparent transition-all group/item cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover/item:scale-110 transition-transform shrink-0">
                <FolderOpen size={14} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-zinc-200 group-hover/item:text-amber-300 transition-colors truncate">Open project…</span>
                <span className="text-[10px] text-zinc-400 truncate">Start or switch a workspace</span>
              </div>
            </button>

            <button
              onClick={() => { setSettingsMenuOpen(false); onOpenGit?.(); }}
              className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left hover:bg-white/[0.08] hover:border-cyan-500/30 border border-transparent transition-all group/item cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 group-hover/item:scale-110 transition-transform shrink-0">
                <FolderGit2 size={14} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-zinc-200 group-hover/item:text-cyan-300 transition-colors truncate">Git & GitHub Hub…</span>
                <span className="text-[10px] text-zinc-400 truncate">Commit, push, pull, branches</span>
              </div>
            </button>

            <button
              onClick={() => { setSettingsMenuOpen(false); onOpenExtensions?.(); }}
              className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left hover:bg-white/[0.08] hover:border-purple-500/30 border border-transparent transition-all group/item cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover/item:scale-110 transition-transform shrink-0">
                <Blocks size={14} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-zinc-200 group-hover/item:text-purple-300 transition-colors truncate">Extensions</span>
                <span className="text-[10px] text-zinc-400 truncate">Agents and tools from Open-VSX</span>
              </div>
            </button>

            <button
              onClick={() => { setSettingsMenuOpen(false); onOpenUsage?.(); }}
              className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left hover:bg-white/[0.08] hover:border-emerald-500/30 border border-transparent transition-all group/item cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover/item:scale-110 transition-transform shrink-0">
                <Gauge size={14} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-zinc-200 group-hover/item:text-emerald-300 transition-colors truncate">Plan limits</span>
                <span className="text-[10px] text-zinc-400 truncate">Token usage per CLI</span>
              </div>
            </button>

            <div className="h-px bg-white/[0.06] my-0.5 mx-1" />

            <button
              onClick={() => { setSettingsMenuOpen(false); onOpenSettings?.(); }}
              className="flex items-center gap-3 w-full px-2.5 py-2 rounded-xl text-left hover:bg-white/[0.08] hover:border-amber-500/30 border border-transparent transition-all group/item cursor-pointer"
            >
              <div className="size-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover/item:scale-110 transition-transform shrink-0">
                <Settings size={14} />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-semibold text-zinc-200 group-hover/item:text-amber-300 transition-colors truncate">Settings</span>
                <span className="text-[10px] text-zinc-400 truncate">API keys and defaults</span>
              </div>
            </button>
          </div>
        </>,
        document.body,
      )}

      {/* Resize handle */}
      <div
        className="absolute -right-1 top-0 z-40 flex h-full w-3 cursor-col-resize items-stretch justify-center group select-none"
        onMouseDown={handleResizeStart}
        onDoubleClick={() => setSidebarWidth(280)}
        role="separator"
        aria-orientation="vertical"
        title="Drag to resize · double-click to reset"
      >
        <div className={`h-full w-px transition-colors group-hover:bg-swarm-gold/60 ${isResizing ? "bg-swarm-gold" : "bg-swarm-border/40"}`} />
      </div>

      <WorkspaceCreateDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
      />
    </div>
  );
}

/* ── WorkHive Card Item (Matches Screenshot 1) ───────────────────── */
function ProjectGroup({
  ws, isActive, hasActive, onActivate, onMenu,
  isRenaming, editValue, onEditChange, onCommitRename, onCancelRename, onStartRename,
}: {
  ws: Workspace;
  isActive: boolean;
  hasActive: boolean;
  onActivate: () => void;
  onMenu: (e: React.MouseEvent) => void;
  isRenaming: boolean;
  editValue: string;
  onEditChange: (v: string) => void;
  onCommitRename: () => void;
  onCancelRename: () => void;
  onStartRename: () => void;
}) {
  const createWorktree = useWorkspaceStore((s) => s.createWorktree);
  const removeWorktree = useWorkspaceStore((s) => s.removeWorktree);
  const mergeWorktree = useWorkspaceStore((s) => s.mergeWorktree);
  const activateAndSync = useWorkspaceStore((s) => s.activateWorkspaceAndSync);

  const [collapsed, setCollapsed] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [missing, setMissing] = useState(false);

  const trees = ws.worktrees ?? [];
  const noRepo = !ws.boundProjectPath;
  const repoName = ws.boundProjectPath ? ws.boundProjectPath.split(/[\\/]/).filter(Boolean).pop() : null;

  useEffect(() => {
    if (!isActive || !ws.boundProjectPath) { setMissing(false); return; }
    let cancelled = false;
    invoke("list_directory", { path: ws.boundProjectPath })
      .then(() => { if (!cancelled) setMissing(false); })
      .catch(() => { if (!cancelled) setMissing(true); });
    return () => { cancelled = true; };
  }, [isActive, ws.boundProjectPath]);

  const bindRepo = async () => {
    setError(null);
    try {
      const apis = { invoke, open: openDialog };
      const folder = await apis.open?.({ directory: true, multiple: false, title: "Select a git repository" });
      if (typeof folder === "string") {
        const boundTo = useWorkspaceStore.getState().bindFolder(ws.id, folder);
        activateAndSync(boundTo);
      }
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  };

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true); setError(null);
    try { await createWorktree(ws.id, name); setName(""); setAdding(false); }
    catch (e: any) { setError(String(e?.message ?? e)); }
    finally { setBusy(false); }
  };
  const remove = async (id: string) => {
    const tree = trees.find((t) => t.id === id);
    if (!confirm(`Remove tree "${tree?.name ?? id}"? Uncommitted changes in it will be lost.`)) return;
    setPendingId(id); setError(null);
    try { await removeWorktree(ws.id, id); }
    catch (e: any) { setError(String(e?.message ?? e)); }
    finally { setPendingId(null); }
  };
  const merge = async (id: string) => {
    setPendingId(id); setError(null);
    try { await mergeWorktree(ws.id, id); }
    catch (e: any) { setError(String(e?.message ?? e)); }
    finally { setPendingId(null); }
  };

  return (
    <div className="px-1 py-0.5">
      {/* Outer WorkHive Luxury Obsidian Card with Smooth Hover Lift */}
      <div
        className={`rounded-2xl border p-3 shadow-lg transition-all duration-200 ease-out cursor-pointer hover:-translate-y-0.5 hover:shadow-2xl active:translate-y-0 ${
          isActive
            ? "border-white/[0.30] bg-gradient-to-b from-[#181c28] to-[#10121a] ring-1 ring-white/[0.20] shadow-black/80 hover:border-white/[0.45]"
            : "border-white/[0.08] bg-gradient-to-b from-[#131520]/90 to-[#0c0e14]/90 hover:border-white/[0.18] hover:bg-[#181b26]"
        }`}
        onClick={() => { if (!isRenaming) onActivate(); }}
      >
        {/* Card Header: Chevron + Title + Status Pill + Menu */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
              className="text-zinc-400 hover:text-zinc-200 transition-colors p-0.5 -ml-0.5 rounded hover:bg-white/[0.06]"
            >
              <ChevronDown
                size={14}
                className={`transition-transform duration-150 ${collapsed ? "-rotate-90" : ""}`}
              />
            </button>
            {isRenaming ? (
              <input
                autoFocus
                value={editValue}
                onChange={(e) => onEditChange(e.target.value)}
                onBlur={onCommitRename}
                onKeyDown={(e) => { if (e.key === "Enter") onCommitRename(); if (e.key === "Escape") onCancelRename(); }}
                className="bg-transparent border-b border-white text-xs font-bold text-zinc-100 outline-none font-sans w-full"
              />
            ) : (
              <span
                className="text-xs font-bold text-zinc-100 truncate tracking-tight font-sans block"
                title={ws.name}
                onDoubleClick={onStartRename}
              >
                {ws.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Live Status Pill */}
            <span
              className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-mono border ${
                hasActive
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-white/[0.04] border-white/[0.08] text-zinc-400"
              }`}
            >
              <span
                className={`size-1.5 rounded-full ${
                  hasActive
                    ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]"
                    : "bg-zinc-500"
                }`}
              />
              <span>{hasActive ? "Active" : "Idle"}</span>
            </span>

            <button
              onClick={(e) => { e.stopPropagation(); onMenu(e); }}
              className="size-5 flex items-center justify-center rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
              title="Workspace menu"
            >
              <MoreHorizontal size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (noRepo) { bindRepo(); return; } setAdding(!adding); setError(null); }}
              className="size-5 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
              title={noRepo ? "Bind folder" : "New tree"}
            >
              {noRepo ? <FolderPlus size={13} /> : <Plus size={13} />}
            </button>
          </div>
        </div>

        {/* Git Branch & Folder Metadata Pills */}
        <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
          <div
            onClick={(e) => { e.stopPropagation(); if (noRepo) bindRepo(); }}
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-black/40 border border-white/[0.06] text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors truncate max-w-[130px]"
            title={ws.boundProjectPath || "No folder bound"}
          >
            <Folder size={11} className="text-slate-300 shrink-0" />
            <span className="truncate font-mono">{repoName || "Unbound"}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.08] border border-white/[0.16] text-[10px] text-slate-200 truncate font-mono">
            <GitBranch size={11} className="shrink-0" />
            <span className="truncate">{noRepo ? "no repo" : "main"}</span>
          </div>
        </div>

        {/* Missing folder notice */}
        {missing && (
          <div className="mb-2 flex h-6 items-center gap-1.5 rounded-lg bg-red-500/10 border border-red-500/30 px-2 text-[10px] text-red-400 font-mono">
            <span className="min-w-0 flex-1 truncate" title={ws.boundProjectPath}>Folder missing from disk</span>
            <button
              onClick={(e) => { e.stopPropagation(); bindRepo(); }}
              className="shrink-0 font-medium underline hover:opacity-80"
            >
              Relocate
            </button>
          </div>
        )}

        {/* New tree input */}
        {adding && (
          <div className="mb-2 flex items-center gap-1">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setAdding(false); setName(""); } }}
              placeholder="branch-name"
              className="h-6 min-w-0 flex-1 rounded-lg border border-amber-400/40 bg-black/60 px-2 text-mini text-zinc-100 outline-none focus:ring-1 focus:ring-amber-400/30"
            />
            <button onClick={submit} disabled={busy || !name.trim()} className="flex size-6 shrink-0 items-center justify-center rounded text-amber-300 hover:bg-amber-400/15 disabled:opacity-40">
              {busy ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-3" />}
            </button>
            <button onClick={() => { setAdding(false); setName(""); }} className="flex size-6 shrink-0 items-center justify-center rounded text-zinc-400 hover:text-zinc-200">
              <X className="size-3" />
            </button>
          </div>
        )}

        {error && <div className="mb-2 text-[10px] text-red-400 break-words font-mono">{error}</div>}

        {/* TREES Section */}
        {!collapsed && (
          <div>
            <div className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase mb-1 pl-0.5 font-mono">
              WORKTREES ({trees.length + 1})
            </div>

            {/* Tree Inner Box */}
            <div className="rounded-xl bg-black/50 border border-white/[0.06] p-2 flex flex-col gap-1.5 shadow-inner">
              {/* Primary tree */}
              <div
                onClick={noRepo ? bindRepo : onActivate}
                className="flex items-center justify-between p-1 rounded-lg hover:bg-white/[0.04] cursor-pointer group/primary transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`size-1.5 rounded-full shrink-0 ${hasActive ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-zinc-600"}`} />
                  <span className="text-xs font-semibold text-zinc-200 group-hover/primary:text-amber-300 transition-colors truncate">
                    primary
                  </span>
                </div>
                <span className="text-[10px] text-zinc-400 font-mono">
                  main
                </span>
              </div>

              {/* Worktrees list */}
              {trees.map((t) => (
                <div key={t.id} className="pt-1.5 border-t border-white/[0.04] flex items-center justify-between p-1 rounded-lg hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-2 min-w-0">
                    <GitBranch size={11} className="text-amber-400/70 shrink-0" />
                    <span className="text-xs font-medium text-zinc-300 truncate">{t.name}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => merge(t.id)} className="text-zinc-400 hover:text-amber-300 p-1 rounded hover:bg-white/[0.06]" title="Merge into main">
                      <GitMerge size={11} />
                    </button>
                    <button onClick={() => remove(t.id)} className="text-zinc-400 hover:text-red-400 p-1 rounded hover:bg-white/[0.06]" title="Remove tree">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Minimalist Branch Row ───────────────────────────────────────── */
function TreeRow({
  dot, name, badge, fullTitle, active, onClick, onMerge, onRemove, pending,
}: {
  dot: string;
  name: string;
  badge?: string;
  fullTitle: string;
  active?: boolean;
  onClick?: () => void;
  onMerge?: () => void;
  onRemove?: () => void;
  pending?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      {...(onClick ? activatable(onClick, `Branch ${name}`) : {})}
      aria-current={active ? "true" : undefined}
      title={fullTitle}
      className={`group/row flex h-6 cursor-pointer items-center gap-1.5 rounded px-1.5 text-[11px] transition-colors ${
        active
          ? "bg-swarm-gold/[0.10] text-swarm-goldHi font-medium"
          : "text-swarm-textDim hover:bg-white/[0.04] hover:text-swarm-text"
      }`}
    >
      <GitBranch className="size-3 shrink-0 text-swarm-textMuted/60 group-hover/row:text-swarm-gold transition-colors" />
      <span className="min-w-0 flex-1 truncate font-mono text-[11px]">{name}</span>
      {badge && (
        <span className="shrink-0 rounded px-1 text-[9px] font-medium text-swarm-textMuted/60">
          {badge}
        </span>
      )}
      {(onMerge || onRemove) && (
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity focus-within:opacity-100 group-hover/row:opacity-100">
          {pending ? (
            <LoaderCircle className="size-3 animate-spin text-swarm-textMuted" />
          ) : (
            <>
              {onMerge && (
                <button
                  onClick={(e) => { e.stopPropagation(); onMerge(); }}
                  className="flex size-4 items-center justify-center rounded text-swarm-textMuted hover:text-swarm-goldHi transition-colors"
                  title="Merge into main"
                  aria-label={`Merge ${name} into main`}
                >
                  <GitMerge className="size-2.5" />
                </button>
              )}
              {onRemove && (
                <button
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="flex size-4 items-center justify-center rounded text-swarm-textMuted hover:text-swarm-err transition-colors"
                  title="Remove tree"
                  aria-label={`Remove tree ${name}`}
                >
                  <Trash2 className="size-2.5" />
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── An empty region note ────────────────────────────────────────── */
function EmptyNote({
  text, hint, actionLabel, onAction,
}: {
  text: string;
  hint?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1 px-4 py-4 text-center">
      <p className="text-xs text-swarm-textMuted/70">{text}</p>
      {hint && <p className="text-[11px] text-swarm-textMuted/50">{hint}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-1 rounded bg-swarm-gold/10 px-2 py-0.5 text-[11px] font-medium text-swarm-goldHi transition-colors hover:bg-swarm-gold/20"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

/* ── Collapsible Section Header with badge counts ────────────────── */
function CollapsibleSection({
  label,
  count,
  activeCount,
  collapsed,
  onToggle,
  action,
}: {
  label: string;
  count?: number;
  activeCount?: number;
  collapsed?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
}) {
  return (
    <div
      onClick={onToggle}
      className={`group flex h-6.5 shrink-0 items-center justify-between px-2.5 text-[10px] font-semibold tracking-wider text-swarm-textMuted/70 select-none transition-colors ${
        onToggle ? "cursor-pointer hover:text-swarm-textDim" : ""
      }`}
    >
      <div className="flex items-center gap-1.5 min-w-0">
        {onToggle && (
          <ChevronRight
            size={11}
            className={`transition-transform duration-150 text-swarm-textMuted/60 group-hover:text-swarm-gold ${
              collapsed ? "" : "rotate-90"
            }`}
          />
        )}
        <span className="uppercase tracking-[0.06em] font-medium">{label}</span>
        {count !== undefined && (
          <span className="text-[10px] text-swarm-textMuted/50 tabular-nums">
            {count}
          </span>
        )}
        {activeCount !== undefined && activeCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-swarm-ok leading-none">
            <span className="size-1.5 rounded-full bg-swarm-ok animate-pulse" />
            {activeCount}
          </span>
        )}
      </div>
      {action && (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      )}
    </div>
  );
}

const NO_FILES: string[] = [];

/**
 * Clean Zed / Cursor style Active Workspace Detail (Agents & Recent Files)
 */
function ActiveWorkspaceDetail({
  ws, onOpenFile,
}: {
  ws?: Workspace;
  onOpenFile: (t: ViewerTarget) => void;
}) {
  const agents = useAgentsStore((s) => s.agents);
  const statuses = useAgentsStore((s) => s.agentStatuses);
  const openFiles = useProjectStore((s) => s.openFiles);

  const [agentsCollapsed, setAgentsCollapsed] = useState(false);
  const [filesCollapsed, setFilesCollapsed] = useState(false);

  if (!ws) {
    return (
      <div className="flex min-h-0 flex-1 flex-col justify-center border-t border-swarm-border/30">
        <EmptyNote text="No workspace selected" hint="Pick one above to see its agents." />
      </div>
    );
  }

  const mine = agents.filter((a) => a.workspaceId === ws.id);
  const runningCount = mine.filter((a) => statuses[a.id] === "running" || statuses[a.id] === "launching").length;
  const recent = (ws.boundProjectPath ? openFiles[ws.boundProjectPath] : undefined) ?? NO_FILES;

  return (
    <div className="flex min-h-0 flex-1 flex-col border-t border-swarm-border/30 pt-1">
      {/* Agents Header */}
      <CollapsibleSection
        label="Agents"
        count={mine.length}
        activeCount={runningCount}
        collapsed={agentsCollapsed}
        onToggle={() => setAgentsCollapsed(!agentsCollapsed)}
      />

      {!agentsCollapsed && (
        <div className="min-h-0 shrink overflow-y-auto overflow-x-hidden scrollbar-sleek px-1 pb-2 flex flex-col gap-1 max-h-[48%]">
          {mine.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-swarm-textMuted/50 italic font-mono">
              No agents running
            </p>
          ) : (
            mine.map((a) => {
              const status = statuses[a.id] ?? "idle";
              const label = a.customName || a.cliName;
              const brand = cliBrand(a.cli);
              const isRunning = status === "running" || status === "launching";
              return (
                <div
                  key={a.id}
                  className="group flex h-8 items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] px-2.5 text-xs text-swarm-textDim transition-all hover:bg-white/[0.06] hover:border-white/[0.1] hover:text-swarm-text"
                  title={`${label}\n${a.cliName}${a.model ? ` · ${a.model}` : ""}\n${status}`}
                >
                  <span className={`size-2 shrink-0 rounded-full transition-all ${
                    isRunning ? "bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.6)]" : "bg-slate-500/50"
                  }`} />
                  {brand ? (
                    <BrandGlyph brand={brand} size={13} className="shrink-0 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <AgentMark size={13} className="shrink-0 text-swarm-textMuted/70" />
                  )}
                  <span className="min-w-0 shrink truncate font-medium text-swarm-text text-xs">{label}</span>
                  {a.isLead && (
                    <span className="inline-flex items-center gap-0.5 rounded bg-swarm-gold/20 px-1 py-0.5 text-[9px] font-bold text-swarm-goldHi uppercase">
                      <LeadCrown size={8} />
                      lead
                    </span>
                  )}
                  {a.model && (
                    <span className="shrink-0 text-[10px] text-swarm-textMuted/50 font-mono">
                      {a.model}
                    </span>
                  )}
                  <span className={`ml-auto shrink-0 text-[10px] font-mono px-2 py-0.5 rounded-md ${
                    isRunning
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium"
                      : "text-swarm-textMuted/60 bg-white/[0.02]"
                  }`}>
                    {status}
                  </span>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Recent Files */}
      {recent.length > 0 && (
        <>
          <div className="border-t border-swarm-border/20 mt-1 pt-1">
            <CollapsibleSection
              label="Recent files"
              count={recent.length}
              collapsed={filesCollapsed}
              onToggle={() => setFilesCollapsed(!filesCollapsed)}
            />
          </div>
          {!filesCollapsed && (
            <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek px-1 pb-2 flex flex-col gap-0.5">
              {recent.slice(0, 16).map((path) => {
                const fileName = path.split(/[\\/]/).pop() || path;
                const { Icon, className } = getFileIcon(fileName);
                const open = () => onOpenFile({ path, projectPath: ws.boundProjectPath });
                return (
                  <div
                    key={path}
                    onClick={open}
                    {...activatable(open, `Open ${fileName}`)}
                    title={path}
                    className="flex h-6.5 cursor-pointer items-center gap-1.5 rounded-[5px] px-2 text-xs text-swarm-textDim transition-colors hover:bg-white/[0.04] hover:text-swarm-text"
                  >
                    <Icon className={`size-3.5 shrink-0 ${className}`} />
                    <span className="min-w-0 truncate text-[11px]">{fileName}</span>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}


