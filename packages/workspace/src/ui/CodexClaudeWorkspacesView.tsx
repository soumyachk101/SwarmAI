"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  ChevronDown,
  ChevronRight,
  Plus,
  SlidersHorizontal,
  MoreVertical,
  Search,
  X,
  Check,
  Trash2,
  Copy,
  Edit2,
  Terminal,
  FolderOpen,
  FolderPlus,
  Network,
  Sparkles,
  Play,
  RotateCcw,
} from "lucide-react";
import {
  useWorkspaceStore,
  type Workspace,
  type WorkspaceThread,
} from "../store.js";
import { useAgentsStore, type Agent, type AgentStatus } from "@swarm/agents/ui";

interface Props {
  projectPath?: string | null;
  onOpenProject?: () => void;
  onOpenCreateDialog: () => void;
}

interface WorkspaceSessionItem {
  id: string;
  title: string;
  workspaceId: string;
  agentId?: string;
  status: AgentStatus;
  cli?: string;
  isAgent: boolean;
}

export default function CodexClaudeWorkspacesView({
  projectPath,
  onOpenProject,
  onOpenCreateDialog,
}: Props) {
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activateAndSync = useWorkspaceStore((s) => s.activateWorkspaceAndSync);
  const renameWorkspace = useWorkspaceStore((s) => s.renameWorkspace);
  const deleteWorkspace = useWorkspaceStore((s) => s.deleteWorkspace);
  const commitDeleteWorkspace = useWorkspaceStore((s) => s.commitDeleteWorkspace);
  const cancelDeleteWorkspace = useWorkspaceStore((s) => s.cancelDeleteWorkspace);
  const openFolder = useWorkspaceStore((s) => s.openFolder);

  const activeThreadId = useWorkspaceStore((s) => s.activeThreadId);
  const setActiveThreadId = useWorkspaceStore((s) => s.setActiveThreadId);
  const addThread = useWorkspaceStore((s) => s.addThread);
  const removeThread = useWorkspaceStore((s) => s.removeThread);
  const renameThread = useWorkspaceStore((s) => s.renameThread);

  const boardOpen = useWorkspaceStore((s) => s.boardOpen);
  const setBoardOpen = useWorkspaceStore((s) => s.setBoardOpen);

  const agents = useAgentsStore((s) => s.agents);
  const agentStatuses = useAgentsStore((s) => s.agentStatuses);
  const activePaneId = useAgentsStore((s) => s.activePaneId);
  const setActivePaneId = useAgentsStore((s) => s.setActivePaneId);
  const addAgent = useAgentsStore((s) => s.addAgent);
  const removeAgent = useAgentsStore((s) => s.removeAgent);
  const updateAgent = useAgentsStore((s) => s.updateAgent);

  // Clean up any mock dummy workspaces from earlier tests
  useEffect(() => {
    const dummyIds = workspaces.filter((w) => w.id.startsWith("ws-ref-")).map((w) => w.id);
    if (dummyIds.length > 0) {
      useWorkspaceStore.setState((state) => {
        const remaining = state.workspaces.filter((w) => !dummyIds.includes(w.id));
        return {
          workspaces: remaining,
          activeWorkspaceId: dummyIds.includes(state.activeWorkspaceId)
            ? remaining[0]?.id || ""
            : state.activeWorkspaceId,
        };
      });
    }
  }, [workspaces]);

  // Local UI states
  const [showWorkspaceDropdown, setShowWorkspaceDropdown] = useState(false);
  const [dropdownAnchorRect, setDropdownAnchorRect] = useState<DOMRect | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [collapsedWorkspaces, setCollapsedWorkspaces] = useState<Record<string, boolean>>({});

  // Inline editing state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editSessionValue, setEditSessionValue] = useState("");
  const [editingWorkspaceId, setEditingWorkspaceId] = useState<string | null>(null);
  const [editWorkspaceValue, setEditWorkspaceValue] = useState("");

  // Context Menu state
  const [sessionMenu, setSessionMenu] = useState<{
    item: WorkspaceSessionItem;
    x: number;
    y: number;
  } | null>(null);

  const [workspaceMenu, setWorkspaceMenu] = useState<{
    ws: Workspace;
    x: number;
    y: number;
  } | null>(null);

  const headerBtnRef = useRef<HTMLButtonElement>(null);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus inline edit input
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  // Close menus on Escape or click outside
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowWorkspaceDropdown(false);
        setSessionMenu(null);
        setWorkspaceMenu(null);
        setEditingSessionId(null);
        setEditingWorkspaceId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter out any mock ref workspaces to only show real workspaces
  const realWorkspaces = useMemo(() => {
    return workspaces.filter((w) => !w.id.startsWith("ws-ref-"));
  }, [workspaces]);

  // Active workspace calculation
  const activeWorkspace = useMemo(() => {
    return realWorkspaces.find((w) => w.id === activeWorkspaceId) || realWorkspaces[0] || null;
  }, [realWorkspaces, activeWorkspaceId]);

  // Derive real sessions for any workspace
  const getSessionsForWorkspace = useCallback(
    (ws: Workspace): WorkspaceSessionItem[] => {
      const items: WorkspaceSessionItem[] = [];
      const seenIds = new Set<string>();

      // 1. Live/persisted agent panes for this workspace (or unassigned in active workspace)
      const wsAgents = agents.filter(
        (a) => a.workspaceId === ws.id || (!a.workspaceId && ws.id === activeWorkspaceId)
      );
      for (const a of wsAgents) {
        let title = a.customName?.trim();
        // If title is "New session" or generic, but user has chatted or initialPrompt exists, show the chat!
        if (!title || title.toLowerCase() === "new session" || title.toLowerCase() === "agent session") {
          if (a.initialPrompt) {
            let pTitle = a.initialPrompt.replace(/^\/[a-zA-Z0-9_-]+\s*/, "").replace(/[\r\n]+/g, " ").trim();
            if (pTitle.length > 38) pTitle = pTitle.slice(0, 35).trim() + "…";
            title = pTitle || a.customName || a.cliName || "Agent session";
          } else {
            title = a.customName || a.cliName || "Agent session";
          }
        }
        const status = agentStatuses[a.id] || "idle";
        items.push({
          id: a.id,
          title,
          workspaceId: ws.id,
          agentId: a.id,
          status,
          cli: a.cli,
          isAgent: true,
        });
        seenIds.add(a.id);
      }

      // 2. Persisted threads for this workspace
      const wsThreads = ws.threads ?? [];
      for (const t of wsThreads) {
        if (!seenIds.has(t.id) && (!t.agentId || !seenIds.has(t.agentId))) {
          let title = t.title?.trim();
          if (t.agentId) {
            const linked = agents.find((a) => a.id === t.agentId);
            if (linked) {
              if (linked.customName && linked.customName.toLowerCase() !== "new session") {
                title = linked.customName;
              } else if (linked.initialPrompt) {
                let pTitle = linked.initialPrompt.replace(/^\/[a-zA-Z0-9_-]+\s*/, "").replace(/[\r\n]+/g, " ").trim();
                if (pTitle.length > 38) pTitle = pTitle.slice(0, 35).trim() + "…";
                title = pTitle;
              }
            }
          }
          items.push({
            id: t.id,
            title: title || "Session",
            workspaceId: ws.id,
            agentId: t.agentId,
            status: t.status === "running" ? "running" : "idle",
            isAgent: !!t.agentId,
          });
          seenIds.add(t.id);
        }
      }

      // 3. DevChat sessions from localStorage if active workspace
      try {
        if (ws.id === activeWorkspaceId && typeof window !== "undefined") {
          const savedDevchat = localStorage.getItem("swarm_devchat_sessions_v2");
          if (savedDevchat) {
            const devchatSessions = JSON.parse(savedDevchat);
            if (Array.isArray(devchatSessions)) {
              for (const ds of devchatSessions) {
                if (!seenIds.has(ds.id)) {
                  const firstUserMsg = ds.messages?.find((m: any) => m.sender === "user")?.text;
                  let dTitle = ds.title?.trim();
                  if ((!dTitle || dTitle === "Main Copilot Session" || dTitle.toLowerCase() === "new session") && firstUserMsg) {
                    let pTitle = firstUserMsg.replace(/[\r\n]+/g, " ").trim();
                    if (pTitle.length > 38) pTitle = pTitle.slice(0, 35).trim() + "…";
                    dTitle = pTitle;
                  }
                  items.push({
                    id: ds.id,
                    title: dTitle || "Copilot Chat",
                    workspaceId: ws.id,
                    agentId: ds.id,
                    status: "idle",
                    cli: "devchat",
                    isAgent: false,
                  });
                  seenIds.add(ds.id);
                }
              }
            }
          }
        }
      } catch (_) {}

      // 4. Task cards as session threads if not already present
      const wsTasks = ws.taskCards ?? [];
      for (const card of wsTasks) {
        if (!seenIds.has(card.id)) {
          items.push({
            id: card.id,
            title: card.title,
            workspaceId: ws.id,
            agentId: card.agentId,
            status: card.column === "in-progress" ? "running" : "idle",
            isAgent: false,
          });
          seenIds.add(card.id);
        }
      }

      return items;
    },
    [agents, agentStatuses, activeWorkspaceId]
  );

  // Auto-sync agent customName into workspace threads
  useEffect(() => {
    for (const a of agents) {
      if (a.customName && a.customName.toLowerCase() !== "new session") {
        const wsId = a.workspaceId || activeWorkspaceId;
        if (wsId) {
          renameThread(wsId, a.id, a.customName);
        }
      }
    }
  }, [agents, activeWorkspaceId, renameThread]);

  // Active selected session
  const activeSessionItem = useMemo(() => {
    if (!activeWorkspace) return null;
    const items = getSessionsForWorkspace(activeWorkspace);
    if (activePaneId) {
      const found = items.find((i) => i.id === activePaneId || i.agentId === activePaneId);
      if (found) return found;
    }
    if (activeThreadId) {
      const found = items.find((i) => i.id === activeThreadId);
      if (found) return found;
    }
    return items[0] || null;
  }, [activeWorkspace, activePaneId, activeThreadId, getSessionsForWorkspace]);

  // Toggle workspace collapse
  const toggleCollapse = (wsId: string) => {
    setCollapsedWorkspaces((prev) => ({
      ...prev,
      [wsId]: !prev[wsId],
    }));
  };

  // Launch a new real session in a workspace
  const handleAddNewSession = (workspaceId: string) => {
    activateAndSync(workspaceId);
    setCollapsedWorkspaces((prev) => ({ ...prev, [workspaceId]: false }));

    const newAgentId = `agent-${Date.now()}`;
    const newAgent: Agent = {
      id: newAgentId,
      cli: "claude",
      cliName: "Claude Code",
      customName: "New session",
      kind: "agent",
      plane: "board",
      workspaceId,
    };
    addAgent(newAgent);
    setActivePaneId(newAgentId);
    addThread(workspaceId, "New session", newAgentId);
    setActiveThreadId(newAgentId);

    // Start inline editing of session name
    setEditingSessionId(newAgentId);
    setEditSessionValue("New session");
  };

  // Select / focus session
  const handleSelectSession = (item: WorkspaceSessionItem) => {
    if (editingSessionId === item.id) return;
    activateAndSync(item.workspaceId);
    setActiveThreadId(item.id);
    if (item.agentId) {
      const agentExists = agents.some((a) => a.id === item.agentId);
      if (agentExists) {
        setActivePaneId(item.agentId);
      } else if (item.cli === "devchat") {
        addAgent({
          id: item.agentId,
          cli: "devchat",
          cliName: "AI Copilot Chat",
          customName: item.title,
          kind: "devchat",
          plane: "board",
          workspaceId: item.workspaceId,
        });
        setActivePaneId(item.agentId);
      } else {
        addAgent({
          id: item.agentId,
          cli: item.cli || "claude",
          cliName: item.cli || "Claude Code",
          customName: item.title,
          kind: "agent",
          plane: "board",
          workspaceId: item.workspaceId,
        });
        setActivePaneId(item.agentId);
      }
    }
  };

  // Commit session rename
  const handleCommitSessionRename = (item: WorkspaceSessionItem) => {
    const trimmed = editSessionValue.trim();
    if (trimmed) {
      if (item.agentId) {
        updateAgent(item.agentId, { customName: trimmed });
      }
      renameThread(item.workspaceId, item.id, trimmed);
    }
    setEditingSessionId(null);
    setEditSessionValue("");
  };

  // Delete session
  const handleDeleteSession = (item: WorkspaceSessionItem) => {
    if (item.agentId) {
      removeAgent(item.agentId);
    }
    removeThread(item.workspaceId, item.id);
    setSessionMenu(null);
  };

  // Duplicate session
  const handleDuplicateSession = (item: WorkspaceSessionItem) => {
    const ws = realWorkspaces.find((w) => w.id === item.workspaceId);
    if (!ws) return;
    const newId = `agent-${Date.now()}`;
    const newTitle = `${item.title} (copy)`;
    addAgent({
      id: newId,
      cli: item.cli || "claude",
      cliName: item.cli ? item.cli : "Claude Code",
      customName: newTitle,
      kind: "agent",
      plane: "board",
      workspaceId: item.workspaceId,
    });
    addThread(item.workspaceId, newTitle, newId);
    setActivePaneId(newId);
    setActiveThreadId(newId);
    setSessionMenu(null);
  };

  // Commit workspace rename
  const handleCommitWorkspaceRename = (wsId: string) => {
    if (editWorkspaceValue.trim()) {
      renameWorkspace(wsId, editWorkspaceValue.trim());
    }
    setEditingWorkspaceId(null);
    setEditWorkspaceValue("");
  };

  // Filter workspaces & sessions
  const filteredWorkspaces = useMemo(() => {
    if (!searchQuery.trim()) return realWorkspaces;
    const q = searchQuery.toLowerCase();
    return realWorkspaces
      .map((ws) => {
        const sessions = getSessionsForWorkspace(ws);
        const wsMatch = ws.name.toLowerCase().includes(q);
        const matchingSessions = sessions.filter((s) =>
          s.title.toLowerCase().includes(q)
        );
        if (wsMatch || matchingSessions.length > 0) {
          return {
            ...ws,
            _filteredSessions: wsMatch ? sessions : matchingSessions,
          };
        }
        return null;
      })
      .filter(Boolean) as (Workspace & { _filteredSessions?: WorkspaceSessionItem[] })[];
  }, [realWorkspaces, searchQuery, getSessionsForWorkspace]);

  // If no workspaces exist yet
  if (realWorkspaces.length === 0) {
    return (
      <div className="flex h-full flex-col select-none overflow-hidden bg-[#0d0e12] text-[#e3e3e8] font-sans antialiased">
        <div className="flex h-11 shrink-0 items-center justify-between px-3 border-b border-white/[0.06] bg-[#0c0d11]">
          <span className="text-[13px] font-medium text-zinc-300">Workspaces</span>
          <button
            onClick={onOpenCreateDialog}
            className="size-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Add Workspace"
          >
            <Plus size={15} />
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <FolderOpen size={32} className="text-zinc-600 mb-3" />
          <h3 className="text-xs font-semibold text-zinc-200">No Projects Open</h3>
          <p className="text-[11px] text-zinc-500 mt-1 max-w-[200px] leading-relaxed">
            Open a folder or project to manage coding sessions and agent threads.
          </p>
          <div className="mt-4 flex flex-col gap-2 w-full max-w-[200px]">
            <button
              onClick={onOpenProject || onOpenCreateDialog}
              className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-amber-400/15 border border-amber-400/30 text-amber-300 text-xs font-semibold hover:bg-amber-400/25 transition-all cursor-pointer"
            >
              <FolderPlus size={13} />
              <span>Open Project Folder</span>
            </button>
            {projectPath && (
              <button
                onClick={() => {
                  const id = openFolder(projectPath);
                  activateAndSync(id);
                }}
                className="flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg bg-white/[0.04] border border-white/[0.08] text-zinc-300 text-xs font-medium hover:bg-white/[0.08] hover:text-white transition-all cursor-pointer"
              >
                <span>Bind Current Folder</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col select-none overflow-hidden bg-[#0d0e12] text-[#e3e3e8] font-sans antialiased">
      {/* ── Top Header Row (Codex / Claude Style) ────────────────────────── */}
      <div className="flex h-11 shrink-0 items-center justify-between px-3 border-b border-white/[0.06] bg-[#0c0d11]">
        {/* Workspace Dropdown Switcher Button */}
        <button
          ref={headerBtnRef}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            setDropdownAnchorRect(rect);
            setShowWorkspaceDropdown(!showWorkspaceDropdown);
          }}
          className="group flex items-center gap-1.5 min-w-0 max-w-[190px] py-1 px-1.5 -ml-1.5 rounded-lg text-left hover:bg-white/[0.06] transition-colors cursor-pointer"
          title={activeWorkspace?.name || "Select Workspace"}
        >
          <span className="text-[13px] font-medium text-zinc-100 group-hover:text-white truncate">
            {activeWorkspace?.name || "Workspace"}
          </span>
          <ChevronDown
            size={12}
            className={`text-zinc-400 group-hover:text-zinc-200 shrink-0 transition-transform duration-150 ${
              showWorkspaceDropdown ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Top Right Action Icons: New Session (+) & Filter (Sliders) */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => activeWorkspace && handleAddNewSession(activeWorkspace.id)}
            className="size-7 flex items-center justify-center rounded-lg text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="New session in active project (+)"
            aria-label="New session"
          >
            <Plus size={15} strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setFilterOpen(!filterOpen)}
            className={`size-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer ${
              filterOpen
                ? "text-zinc-100 bg-white/[0.1] border border-white/[0.12]"
                : "text-zinc-400 hover:text-white hover:bg-white/[0.08]"
            }`}
            title={filterOpen ? "Close filter" : "Filter sessions"}
            aria-label="Filter sessions"
          >
            <SlidersHorizontal size={13} strokeWidth={1.75} />
          </button>
        </div>
      </div>

      {/* ── Instant Filter Bar (when toggled via Sliders) ────────────────── */}
      {filterOpen && (
        <div className="px-2.5 py-1.5 border-b border-white/[0.06] bg-[#111217]">
          <div className="flex h-7 items-center gap-2 rounded-lg bg-black/40 border border-white/[0.08] px-2.5 focus-within:border-white/[0.2] transition-colors">
            <Search size={11} className="text-zinc-500 shrink-0" />
            <input
              autoFocus
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter sessions and projects..."
              className="min-w-0 flex-1 bg-transparent text-[11.5px] text-zinc-200 outline-none placeholder:text-zinc-600 font-sans"
              spellCheck={false}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="text-zinc-500 hover:text-zinc-300"
                title="Clear filter"
              >
                <X size={11} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Main Tree Scroll Area ────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden scrollbar-sleek px-2 py-2 space-y-1">
        {/* Active Selected Session Capsule Pill (Prominent Top Card) */}
        {activeSessionItem && !searchQuery && (
          <div
            onClick={() => handleSelectSession(activeSessionItem)}
            className="group/active-pill relative flex h-8 items-center justify-between rounded-lg bg-[#222327] border border-white/[0.08] px-2.5 text-xs text-white shadow-xs transition-colors cursor-pointer select-none mb-2"
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Hollow circle bullet or green pulsing dot if running */}
              {activeSessionItem.status === "running" ? (
                <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse shrink-0" />
              ) : (
                <span className="size-2 rounded-full border-[1.5px] border-zinc-400 shrink-0" />
              )}

              {editingSessionId === activeSessionItem.id ? (
                <input
                  ref={editInputRef}
                  value={editSessionValue}
                  onChange={(e) => setEditSessionValue(e.target.value)}
                  onBlur={() => handleCommitSessionRename(activeSessionItem)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleCommitSessionRename(activeSessionItem);
                    if (e.key === "Escape") setEditingSessionId(null);
                  }}
                  className="min-w-0 flex-1 bg-transparent text-[12.5px] text-white outline-none border-b border-zinc-400 font-sans"
                />
              ) : (
                <span
                  className="text-[12.5px] font-normal text-white truncate"
                  title={activeSessionItem.title}
                  onDoubleClick={() => {
                    setEditingSessionId(activeSessionItem.id);
                    setEditSessionValue(activeSessionItem.title);
                  }}
                >
                  {activeSessionItem.title}
                </span>
              )}
            </div>

            {/* Three dots menu */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSessionMenu({
                  item: activeSessionItem,
                  x: Math.min(e.clientX, window.innerWidth - 180),
                  y: Math.min(e.clientY, window.innerHeight - 150),
                });
              }}
              className="size-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 ml-1"
              title="Session options"
            >
              <MoreVertical size={13} />
            </button>
          </div>
        )}

        {/* ── Project / Workspace Groups ─────────────────────────────────── */}
        {filteredWorkspaces.map((ws) => {
          const isCurrentActiveWs = ws.id === activeWorkspaceId;
          const isCollapsed = Boolean(collapsedWorkspaces[ws.id]);
          const sessions: WorkspaceSessionItem[] = (ws as any)._filteredSessions ?? getSessionsForWorkspace(ws);

          return (
            <div key={ws.id} className="relative group/ws mb-1">
              {/* Workspace Group Header Row */}
              <div
                onClick={() => {
                  if (editingWorkspaceId === ws.id) return;
                  activateAndSync(ws.id);
                  toggleCollapse(ws.id);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  setWorkspaceMenu({
                    ws,
                    x: Math.min(e.clientX, window.innerWidth - 180),
                    y: Math.min(e.clientY, window.innerHeight - 150),
                  });
                }}
                className="flex h-7.5 items-center justify-between px-1.5 rounded-md hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
              >
                {/* Project Name */}
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  {editingWorkspaceId === ws.id ? (
                    <input
                      autoFocus
                      value={editWorkspaceValue}
                      onChange={(e) => setEditWorkspaceValue(e.target.value)}
                      onBlur={() => handleCommitWorkspaceRename(ws.id)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleCommitWorkspaceRename(ws.id);
                        if (e.key === "Escape") setEditingWorkspaceId(null);
                      }}
                      className="min-w-0 flex-1 bg-transparent text-[12.5px] font-medium text-white outline-none border-b border-zinc-400 font-sans"
                    />
                  ) : (
                    <span
                      className={`text-[12.5px] font-medium truncate tracking-tight ${
                        isCurrentActiveWs ? "text-zinc-200" : "text-[#8e8e93] group-hover/ws:text-zinc-300"
                      }`}
                      title={ws.name}
                      onDoubleClick={() => {
                        setEditingWorkspaceId(ws.id);
                        setEditWorkspaceValue(ws.name);
                      }}
                    >
                      {ws.name}
                    </span>
                  )}
                </div>

                {/* Plus Button (+) to Add Real Session in this Workspace */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddNewSession(ws.id);
                  }}
                  className="size-5 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors cursor-pointer shrink-0"
                  title={`New session in ${ws.name}`}
                  aria-label={`New session in ${ws.name}`}
                >
                  <Plus size={13} />
                </button>
              </div>

              {/* Sessions List under Project */}
              {!isCollapsed && (
                <div className="pl-3.5 pr-1 space-y-0.5 mt-0.5">
                  {sessions.length === 0 ? (
                    <div
                      onClick={() => handleAddNewSession(ws.id)}
                      className="flex h-6.5 items-center gap-2 px-2 rounded-md text-[11.5px] text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02] cursor-pointer italic transition-colors"
                    >
                      <Plus size={11} />
                      <span>Start a session</span>
                    </div>
                  ) : (
                    sessions.map((s) => {
                      const isSelected =
                        isCurrentActiveWs &&
                        (activePaneId === s.id || activePaneId === s.agentId || activeThreadId === s.id);
                      const isRunning = s.status === "running";

                      return (
                        <div
                          key={s.id}
                          onClick={() => handleSelectSession(s)}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            setSessionMenu({
                              item: s,
                              x: Math.min(e.clientX, window.innerWidth - 180),
                              y: Math.min(e.clientY, window.innerHeight - 150),
                            });
                          }}
                          className={`group/item flex h-7 items-center justify-between rounded-lg px-2 text-xs transition-all cursor-pointer select-none ${
                            isSelected
                              ? "bg-[#222327] text-white border border-white/[0.08] shadow-xs"
                              : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04] border border-transparent"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Hollow circle icon */}
                            {isRunning ? (
                              <span className="size-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] animate-pulse shrink-0" />
                            ) : (
                              <span
                                className={`size-2 rounded-full border-[1.5px] shrink-0 transition-colors ${
                                  isSelected
                                    ? "border-zinc-300"
                                    : "border-zinc-500/80 group-hover/item:border-zinc-300"
                                }`}
                              />
                            )}

                            {editingSessionId === s.id ? (
                              <input
                                ref={editInputRef}
                                value={editSessionValue}
                                onChange={(e) => setEditSessionValue(e.target.value)}
                                onBlur={() => handleCommitSessionRename(s)}
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleCommitSessionRename(s);
                                  if (e.key === "Escape") setEditingSessionId(null);
                                }}
                                className="min-w-0 flex-1 bg-transparent text-[12px] text-white outline-none border-b border-zinc-400 font-sans"
                              />
                            ) : (
                              <span
                                className={`text-[12px] font-normal truncate ${
                                  isSelected ? "text-white font-medium" : "text-zinc-300 group-hover/item:text-white"
                                }`}
                                title={s.title}
                                onDoubleClick={() => {
                                  setEditingSessionId(s.id);
                                  setEditSessionValue(s.title);
                                }}
                              >
                                {s.title}
                              </span>
                            )}
                          </div>

                          {/* Options three dots on hover or when selected */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSessionMenu({
                                item: s,
                                x: Math.min(e.clientX, window.innerWidth - 180),
                                y: Math.min(e.clientY, window.innerHeight - 150),
                              });
                            }}
                            className={`size-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-opacity shrink-0 ml-1 ${
                              isSelected ? "opacity-100" : "opacity-0 group-hover/item:opacity-100"
                            }`}
                            title="Session options"
                          >
                            <MoreVertical size={12} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Workspace deletion confirmation overlay */}
              {ws.isDeleting && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-black/80 backdrop-blur-xs">
                  <div className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[#181a24] border border-white/[0.12] px-2 py-0.5 text-mini text-zinc-200 shadow-xl">
                    <span className="truncate text-[11px]">Delete?</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); cancelDeleteWorkspace(ws.id); }}
                      className="text-zinc-400 hover:text-zinc-200"
                      title="Cancel"
                    >
                      <X size={11} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); commitDeleteWorkspace(ws.id); }}
                      className="font-semibold text-red-400 hover:text-red-300 text-[11px]"
                      title="Confirm delete"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Bottom Task Pipeline Quick Access ────────────────────────────── */}
      <div className="px-2 py-1.5 border-t border-white/[0.05] shrink-0 bg-[#0c0d11]">
        <button
          onClick={() => setBoardOpen(!boardOpen)}
          className={`flex w-full h-7 items-center justify-between px-2 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
            boardOpen
              ? "bg-amber-400/15 border-amber-400/30 text-amber-200 shadow-xs"
              : "bg-white/[0.02] border-white/[0.06] text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05]"
          }`}
          title="Toggle Task Pipeline Board"
        >
          <div className="flex items-center gap-2">
            <Network size={12} className={boardOpen ? "text-amber-400" : "text-zinc-400"} />
            <span className="text-[11px]">Task Pipeline</span>
          </div>
          {activeWorkspace?.taskCards && activeWorkspace.taskCards.length > 0 && (
            <span className="rounded bg-white/[0.06] px-1 py-0.2 text-[9.5px] font-mono text-zinc-300">
              {activeWorkspace.taskCards.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Workspace Dropdown Switcher Popover (createPortal) ────────────── */}
      {showWorkspaceDropdown && dropdownAnchorRect && createPortal(
        <>
          <div
            className="fixed inset-0 z-[290]"
            onClick={() => setShowWorkspaceDropdown(false)}
          />
          <div
            className="fixed z-[291] w-64 py-1 rounded-xl bg-[#14151b] border border-white/[0.1] shadow-2xl backdrop-blur-xl animate-fade-in flex flex-col overflow-hidden text-xs"
            style={{
              top: dropdownAnchorRect.bottom + 4,
              left: Math.max(8, dropdownAnchorRect.left),
            }}
          >
            <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500 border-b border-white/[0.05]">
              Select Project
            </div>
            <div className="max-h-56 overflow-y-auto scrollbar-sleek py-1">
              {realWorkspaces.map((w) => {
                const isSelected = w.id === activeWorkspaceId;
                return (
                  <button
                    key={w.id}
                    onClick={() => {
                      activateAndSync(w.id);
                      setShowWorkspaceDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-1.5 text-left transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-white/[0.08] text-white font-medium"
                        : "text-zinc-300 hover:bg-white/[0.04] hover:text-white"
                    }`}
                  >
                    <span className="truncate text-[12px]">{w.name}</span>
                    {isSelected && <Check size={12} className="text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            <div className="border-t border-white/[0.06] p-1 flex flex-col gap-0.5">
              <button
                onClick={() => {
                  setShowWorkspaceDropdown(false);
                  onOpenCreateDialog();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11.5px] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <Plus size={12} className="text-zinc-400" />
                <span>New Project / Workspace</span>
              </button>
              {onOpenProject && (
                <button
                  onClick={() => {
                    setShowWorkspaceDropdown(false);
                    onOpenProject();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left text-[11.5px] text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  <FolderOpen size={12} className="text-zinc-400" />
                  <span>Open Existing Folder…</span>
                </button>
              )}
            </div>
          </div>
        </>,
        document.body
      )}

      {/* ── Session Context Menu ─────────────────────────────────────────── */}
      {sessionMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setSessionMenu(null)} />
          <div
            className="fixed z-[301] w-44 py-1 rounded-xl bg-[#16171d] border border-white/[0.1] shadow-2xl backdrop-blur-xl animate-fade-in text-xs"
            style={{ top: sessionMenu.y, left: sessionMenu.x }}
          >
            <button
              onClick={() => {
                setEditingSessionId(sessionMenu.item.id);
                setEditSessionValue(sessionMenu.item.title);
                setSessionMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Edit2 size={12} className="text-zinc-400" />
              <span>Rename</span>
            </button>
            <button
              onClick={() => handleDuplicateSession(sessionMenu.item)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Copy size={12} className="text-zinc-400" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={() => {
                handleSelectSession(sessionMenu.item);
                setSessionMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Terminal size={12} className="text-zinc-400" />
              <span>Focus Session</span>
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              onClick={() => handleDeleteSession(sessionMenu.item)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Close / Delete</span>
            </button>
          </div>
        </>,
        document.body
      )}

      {/* ── Workspace Context Menu ──────────────────────────────────────── */}
      {workspaceMenu && createPortal(
        <>
          <div className="fixed inset-0 z-[300]" onClick={() => setWorkspaceMenu(null)} />
          <div
            className="fixed z-[301] w-44 py-1 rounded-xl bg-[#16171d] border border-white/[0.1] shadow-2xl backdrop-blur-xl animate-fade-in text-xs"
            style={{ top: workspaceMenu.y, left: workspaceMenu.x }}
          >
            <button
              onClick={() => {
                handleAddNewSession(workspaceMenu.ws.id);
                setWorkspaceMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Plus size={12} className="text-zinc-400" />
              <span>New Session</span>
            </button>
            <button
              onClick={() => {
                setEditingWorkspaceId(workspaceMenu.ws.id);
                setEditWorkspaceValue(workspaceMenu.ws.name);
                setWorkspaceMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-zinc-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <Edit2 size={12} className="text-zinc-400" />
              <span>Rename Project</span>
            </button>
            <div className="my-1 border-t border-white/[0.06]" />
            <button
              onClick={() => {
                deleteWorkspace(workspaceMenu.ws.id);
                setWorkspaceMenu(null);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors cursor-pointer"
            >
              <Trash2 size={12} />
              <span>Delete Project</span>
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
