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
  type LucideIcon,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useWorkspaceStore, getActiveProjectPath, type Workspace } from "../store.js";
import { useAgentsStore, type AgentStatus } from "@swarm/agents/ui";
import { useProjectStore } from "../openFiles.js";
import { open as openDialog } from "@tauri-apps/plugin-dialog";
import WorkspaceCreateDialog from "./WorkspaceCreateDialog.js";

const MIN_WIDTH = 220;
const MAX_WIDTH = 500;
const WIDTH_KEY = "swarm.sidebarWidth";

const clampWidth = (px: number) => Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, px));

type LeftTab = "workspaces" | "explorer" | "search";

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

  useEffect(() => {
    if (!projectPath) return;
    // Switching projects has to reset `loading` and drop the in-flight read:
    // without the reset the spinner never returns, and without the cancel a
    // slow listing of the *old* folder can land last and overwrite the new tree.
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

  // Deliberately not caught here: a workspace bound to a folder that has since
  // been moved or deleted used to render as an empty tree, which is
  // indistinguishable from an empty folder. Callers surface the reason instead.
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
    // Functional update: `tree` from the render closure is stale after the await
    // above, so a fast second toggle could resurrect the pre-expansion tree.
    setTree((t) => [...t]);
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
            // Indent is capped: a node 20 folders deep would otherwise get zero
            // width left for its name and the row would read as blank.
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

  return (
    <div className="h-full overflow-y-auto overflow-x-hidden scrollbar-sleek">
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
      ) : tree.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center px-4 text-center text-swarm-textMuted">
          <FolderOpen className="size-6 mb-2 opacity-50 text-swarm-gold" />
          <p className="text-xs font-medium">This folder is empty</p>
        </div>
      ) : (
        <div className="py-1.5">
          {/* One unreadable subfolder must not replace the whole tree with an
              error screen — it gets a dismissible strip instead. */}
          {error && (
            <div className="mx-1.5 mb-1 flex items-start gap-1.5 rounded-md border border-swarm-err/30 bg-swarm-err/10 px-2 py-1 text-micro text-swarm-err">
              <span className="min-w-0 flex-1 break-words">{error}</span>
              <button onClick={() => setError(null)} title="Dismiss" aria-label="Dismiss" className="shrink-0 opacity-70 hover:opacity-100">
                <X className="size-3" />
              </button>
            </div>
          )}
          {renderNodes(tree)}
        </div>
      )}
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
      // rg exits non-zero on "no matches" too, so an empty result and a missing
      // ripgrep binary used to look identical — both rendered "No results" and
      // left the user retyping a query that could never work.
      const msg = String(e?.message ?? e);
      setResults([]);
      setError(/no such file|not found|ENOENT|cannot run|No such/i.test(msg) ? "ripgrep (rg) is not installed or not on PATH." : null);
    } finally {
      setSearching(false);
      setRan(true);
    }
  };

  // Results come back as absolute paths; inside a sidebar this is all prefix and
  // no signal, so the workspace root is stripped for display only.
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
                {/* One line, clipped by the box rather than by a magic slice()
                    count — a hard 80-char cut chopped mid-word at every width. */}
                <div className="truncate font-mono text-micro text-swarm-textMuted/70">{r.text.trim()}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ADEWorktreeSidebar({ projectPath, pinned = true, onTogglePin, onClose, topBar }: Props) {
  const [activeTab, setActiveTab] = useState<LeftTab>("workspaces");
  const [viewer, setViewer] = useState<ViewerTarget | null>(null);

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
  const agentStatuses = useAgentsStore((s) => s.agentStatuses);

  // Read once on mount: a resize the user made is theirs, and snapping back to
  // 280px on every app start is the kind of small betrayal that reads as a bug.
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = Number(localStorage.getItem(WIDTH_KEY));
    return Number.isFinite(saved) && saved > 0 ? clampWidth(saved) : 280;
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

  // Not LucideIcon: the Projects tab carries Swarm's own agent mark, which
  // is a plain function component, not a lucide forwardRef.
  const TABS: { id: LeftTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: "workspaces", label: "Projects", icon: WorkspaceMark },
    { id: "explorer", label: "Explorer", icon: Folder },
    { id: "search", label: "Search", icon: Search },
  ];

  // Narrow sidebar → icon-only tabs (matches the right dock's behavior).
  const compact = sidebarWidth < 300;

  return (
    <div
      ref={sidebarRef}
      className="relative h-full flex flex-col glass-rail border-r border-swarm-border/50 shrink-0 font-sans antialiased"
      // maxWidth in vw, not a JS resize listener: the browser re-clamps on every
      // window resize for free and the user's chosen width survives untouched
      // when the window grows back.
      style={{ width: sidebarWidth, minWidth: MIN_WIDTH, maxWidth: "50vw" }}
    >
      {/* App row — the window's top-left corner. The mark, the overflow menu
          and the panel toggles live here rather than over the pane strip,
          because they act on the app, not on the panes. Supplied by the host:
          this package must not know what "settings" or "extensions" are. */}
      {topBar && (
        <div
          className="flex h-11 shrink-0 items-center gap-0.5 border-b border-swarm-border/40 px-2"
          data-tauri-drag-region
        >
          {topBar}
        </div>
      )}

      {/* Sidebar Sub-Tabs Header (Workspaces, Explorer, Search) */}
      <div className="flex items-center border-b border-swarm-border/40 shrink-0">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setViewer(null); }}
              title={tab.label}
              className={`flex items-center justify-center gap-1.5 flex-1 min-w-0 h-8 px-2 text-mini font-medium transition-colors whitespace-nowrap ${
                active
                  ? "text-swarm-goldHi bg-swarm-gold/[0.06] border-b-2 border-swarm-gold"
                  : "text-swarm-textMuted hover:text-swarm-textDim hover:bg-swarm-border/20"
              }`}
            >
              <Icon className="size-3.5 shrink-0" />
              {!compact && <span className="truncate">{tab.label}</span>}
            </button>
          );
        })}

        <div className="flex items-center pr-1 shrink-0">
          <button
            onClick={onTogglePin}
            className={`size-6 flex items-center justify-center rounded transition-colors ${
              pinned ? "text-swarm-goldHi/70" : "text-swarm-textMuted hover:text-swarm-textDim"
            }`}
            title={pinned ? "Unpin sidebar" : "Pin sidebar"}
            aria-label={pinned ? "Unpin sidebar" : "Pin sidebar"}
            aria-pressed={pinned}
          >
            {pinned ? <PinOff size={12} /> : <Pin size={12} />}
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="size-6 flex items-center justify-center rounded text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-border/30 transition-colors"
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {viewer ? (
          <FileViewer target={viewer} onBack={() => setViewer(null)} />
        ) : activeTab === "explorer" ? (
          <ExplorerPanel projectPath={projectPath || null} onOpen={setViewer} />
        ) : activeTab === "search" ? (
          <SearchPanel projectPath={projectPath || null} onOpen={setViewer} />
        ) : (
          /* Workspaces Tab Content */
          <>
            {/* WorkHive Top Action Header (Matches Screenshot 1) */}
            <div className="flex h-10 shrink-0 items-center justify-between px-3 pt-1 border-b border-swarm-border/20">
              <button
                onClick={() => setHideSleeping(!hideSleeping)}
                className="flex items-center gap-1.5 text-swarm-textMuted hover:text-swarm-text transition-colors text-xs"
                title={hideSleeping ? "Show all workHives" : "Hide sleeping workHives"}
              >
                {hideSleeping ? <EyeOff size={14} /> : <Eye size={14} />}
                <span className="text-xs text-swarm-textMuted font-mono">{visibleWorkspaces.length}</span>
              </button>

              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.10] px-3 py-1 text-xs font-medium text-swarm-text transition-all shadow-sm"
                title="New WorkHive"
              >
                <Plus size={13} className="text-swarm-textMuted" />
                <span>New WorkHive</span>
              </button>
            </div>

            {/* Filter workHives input */}
            <div className="px-3 py-2">
              <div className="flex h-8 items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 focus-within:border-swarm-gold/40 focus-within:ring-1 focus-within:ring-swarm-gold/20 transition-all">
                <Search size={14} className="text-swarm-textMuted/70 shrink-0" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter workHives..."
                  aria-label="Filter workHives"
                  className="min-w-0 flex-1 bg-transparent text-xs text-swarm-text outline-none placeholder:text-swarm-textMuted/40"
                  spellCheck={false}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    title="Clear filter"
                    className="text-swarm-textMuted hover:text-swarm-text"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* WorkHive Cards List */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek px-1 pb-2">
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
                        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-swarm-canvasHi/90">
                          <div className="inline-flex max-w-full items-center gap-1.5 rounded-full glass-hi border border-swarm-border/60 px-2.5 py-1 text-mini font-medium text-swarm-text shadow-sm">
                            <LoaderCircle className="size-3 shrink-0 animate-spin text-swarm-textMuted" />
                            <span className="truncate">Deleting…</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); cancelDeleteWorkspace(ws.id); }}
                              title="Cancel deletion"
                              className="shrink-0 text-swarm-textMuted hover:text-swarm-text transition-colors"
                            >
                              <X className="size-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); commitDeleteWorkspace(ws.id); }}
                              className="shrink-0 font-semibold text-swarm-err transition-colors hover:opacity-80"
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

              {/* Bottom Quick Navigation Links (Matches Screenshot 1) */}
              <div className="px-3 pt-2 pb-1.5 border-t border-swarm-border/30 flex flex-col gap-0.5 shrink-0">
                <button
                  onClick={() => setActiveTab("explorer")}
                  className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold tracking-wider transition-colors text-swarm-textMuted hover:bg-white/[0.04] hover:text-swarm-text"
                >
                  <Folder size={14} className="text-swarm-textMuted/80" />
                  <span className="tracking-widest">EXPLORER</span>
                </button>
                <button
                  onClick={() => setActiveTab("search")}
                  className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold tracking-wider transition-colors text-swarm-textMuted hover:bg-white/[0.04] hover:text-swarm-text"
                >
                  <GitPullRequest size={14} className="text-swarm-textMuted/80" />
                  <span className="tracking-widest">ISSUES & PRS</span>
                </button>
                <button
                  onClick={() => {}}
                  className="flex h-8 items-center gap-2.5 rounded-lg px-2 text-xs font-semibold tracking-wider text-swarm-textMuted hover:bg-white/[0.04] hover:text-swarm-text transition-colors"
                >
                  <Network size={14} className="text-swarm-textMuted/80" />
                  <span className="tracking-widest">TASKCOMB</span>
                </button>
              </div>

              <ActiveWorkspaceDetail ws={activeWorkspace} onOpenFile={setViewer} />
            </div>
          </>
        )}
      </div>

      {/* Context menu — portaled above the plane (backdrop-blur traps in-tree fixed). */}
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
    <div className="px-2 py-1">
      {/* Outer WorkHive Rounded Card (Matches Screenshot 1) */}
      <div
        className={`rounded-2xl border transition-all p-3 ${
          isActive
            ? "border-white/[0.14] bg-[#141722]/90 shadow-md ring-1 ring-white/[0.05]"
            : "border-white/[0.07] bg-[#11131c]/60 hover:border-white/[0.12]"
        }`}
        onClick={() => { if (!isRenaming) onActivate(); }}
      >
        {/* Card Header: ⌄ {ws.name} */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              onClick={(e) => { e.stopPropagation(); setCollapsed(!collapsed); }}
              className="text-swarm-textMuted hover:text-swarm-text transition-colors p-0.5 -ml-1"
            >
              <ChevronDown
                size={16}
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
                className="bg-transparent border-b border-swarm-gold text-sm font-bold text-swarm-text outline-none"
              />
            ) : (
              <span className="text-sm font-bold text-swarm-text truncate tracking-tight" onDoubleClick={onStartRename}>
                {ws.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1 opacity-70 hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); onMenu(e); }}
              className="size-5 flex items-center justify-center rounded text-swarm-textMuted hover:text-swarm-text hover:bg-white/[0.08]"
              title="WorkHive menu"
            >
              <MoreHorizontal size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (noRepo) { bindRepo(); return; } setAdding(!adding); setError(null); }}
              className="size-5 flex items-center justify-center rounded text-swarm-textMuted hover:text-swarm-goldHi hover:bg-white/[0.08]"
              title={noRepo ? "Bind folder" : "New tree"}
            >
              {noRepo ? <FolderPlus size={13} /> : <Plus size={13} />}
            </button>
          </div>
        </div>

        {/* Missing folder notice */}
        {missing && (
          <div className="mb-2 flex h-6 items-center gap-1.5 rounded bg-swarm-err/10 px-2 text-[10px] text-swarm-err">
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
              className="h-6 min-w-0 flex-1 rounded border border-swarm-border/50 bg-black/30 px-2 text-mini text-swarm-text outline-none focus:border-swarm-gold/50"
            />
            <button onClick={submit} disabled={busy || !name.trim()} className="flex size-6 shrink-0 items-center justify-center rounded text-swarm-goldHi hover:bg-swarm-gold/15 disabled:opacity-40">
              {busy ? <LoaderCircle className="size-3 animate-spin" /> : <Check className="size-3" />}
            </button>
            <button onClick={() => { setAdding(false); setName(""); }} className="flex size-6 shrink-0 items-center justify-center rounded text-swarm-textMuted hover:text-swarm-text">
              <X className="size-3" />
            </button>
          </div>
        )}

        {error && <div className="mb-2 text-[10px] text-swarm-err break-words">{error}</div>}

        {/* TREES Section (Matches Screenshot 1) */}
        {!collapsed && (
          <div>
            <div className="text-[10px] font-bold tracking-widest text-swarm-textMuted/60 uppercase mb-1.5 pl-0.5">
              TREES
            </div>

            {/* Tree Inner Box */}
            <div className="rounded-xl bg-[#0c0e14]/90 border border-white/[0.06] p-2.5 flex flex-col gap-2 shadow-inner">
              {/* Primary tree */}
              <div
                onClick={noRepo ? bindRepo : onActivate}
                className="flex flex-col gap-1 cursor-pointer group/primary"
              >
                <div className="flex items-center gap-2">
                  <span className={`size-2 rounded-full shrink-0 ${hasActive ? "bg-swarm-ok animate-pulse" : "bg-swarm-textMuted/40"}`} />
                  <span className="text-xs font-bold text-swarm-text group-hover/primary:text-swarm-goldHi transition-colors">
                    primary
                  </span>
                  <span className="rounded bg-white/[0.07] px-1.5 py-0.5 text-[10px] font-medium text-swarm-textMuted border border-white/[0.04] truncate max-w-[110px]">
                    {repoName || ws.name}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 pl-4 text-xs text-swarm-textMuted/70 font-mono">
                  <GitBranch size={12} className="text-swarm-textMuted/60 shrink-0" />
                  <span>on {noRepo ? "unbound" : "master"}</span>
                </div>
              </div>

              {/* Worktrees list */}
              {trees.map((t) => (
                <div key={t.id} className="pt-2 border-t border-white/[0.04] flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="size-2 rounded-full bg-swarm-textMuted/40 shrink-0" />
                      <span className="text-xs font-semibold text-swarm-text truncate">{t.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => merge(t.id)} className="text-swarm-textMuted hover:text-swarm-goldHi p-0.5" title="Merge into main">
                        <GitMerge size={11} />
                      </button>
                      <button onClick={() => remove(t.id)} className="text-swarm-textMuted hover:text-swarm-err p-0.5" title="Remove tree">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-4 text-xs text-swarm-textMuted/70 font-mono">
                    <GitBranch size={12} className="text-swarm-textMuted/60 shrink-0" />
                    <span>on {t.branch || t.name}</span>
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
        <div className="min-h-0 shrink overflow-y-auto overflow-x-hidden scrollbar-sleek px-1 pb-2 flex flex-col gap-0.5 max-h-[48%]">
          {mine.length === 0 ? (
            <p className="px-2 py-1 text-[11px] text-swarm-textMuted/50 italic">
              No agents running
            </p>
          ) : (
            mine.map((a) => {
              const status = statuses[a.id] ?? "idle";
              const label = a.customName || a.cliName;
              const brand = cliBrand(a.cli);
              const isRunning = status === "running";
              return (
                <div
                  key={a.id}
                  className="group flex h-7 items-center gap-2 rounded-[5px] px-2 text-xs text-swarm-textDim transition-colors hover:bg-white/[0.04] hover:text-swarm-text"
                  title={`${label}\n${a.cliName}${a.model ? ` · ${a.model}` : ""}\n${status}`}
                >
                  <span className={`size-1.5 shrink-0 rounded-full transition-all ${
                    isRunning ? "bg-swarm-ok animate-pulse" : STATUS_DOT_CLASS[status]
                  }`} />
                  {brand ? (
                    <BrandGlyph brand={brand} size={12} className="shrink-0 opacity-80 group-hover:opacity-100" />
                  ) : (
                    <AgentMark size={12} className="shrink-0 text-swarm-textMuted/70" />
                  )}
                  <span className="min-w-0 shrink truncate font-medium text-swarm-text text-xs">{label}</span>
                  {a.isLead && (
                    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-swarm-goldHi/80">
                      <LeadCrown size={8} />
                      lead
                    </span>
                  )}
                  {a.model && (
                    <span className="shrink-0 text-[10px] text-swarm-textMuted/50 font-mono">
                      {a.model}
                    </span>
                  )}
                  <span className={`ml-auto shrink-0 text-[10px] font-medium capitalize ${
                    isRunning ? "text-swarm-ok" : "text-swarm-textMuted/50"
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


