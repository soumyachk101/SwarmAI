"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Sparkles,
  Bot,
  Zap,
  Terminal,
  Columns3,
  PanelLeft,
  PanelRight,
  Settings,
  FolderOpen,
  Mic,
  LayoutGrid,
  ShieldCheck,
  ClipboardList,
  Blocks,
  Activity,
  Layers,
  HelpCircle,
  FileCode2,
  DollarSign,
  GitPullRequest,
  CheckCircle2,
  Stethoscope,
  Trash2,
  Download,
  FolderGit2,
} from "lucide-react";
import { invoke } from "@tauri-apps/api/core";
import { useAgentsStore } from "@swarm/agents/ui";
import { useWorkspaceStore } from "@swarm/workspace";
import { useUiStore } from "./uiStore.js";
import { usePlaneStore } from "@/features/panes/planeStore";
import { leadHost } from "@swarm/lead/ui";
import { modelArgs } from "@swarm/agents/cli-configs";

export interface PaletteCommand {
  id: string;
  category: "Claude Code (/)" | "OpenCode & AI Tools" | "Summon Agents" | "Lead Orchestration" | "Views & Tools" | "Grid Layouts" | "Project";
  label: string;
  hint?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenExtensions: () => void;
  onOpenFolder: () => void;
  onOpenUpdates?: () => void;
  onOpenGit?: () => void;
  onOpenDashboard?: () => void;
  onOpenTemplates?: () => void;
  onOpenDiff?: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onOpenSettings,
  onOpenExtensions,
  onOpenFolder,
  onOpenUpdates,
  onOpenGit,
  onOpenDashboard,
  onOpenTemplates,
  onOpenDiff,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const activeWsId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const addAgent = useAgentsStore((s) => s.addAgent);
  const setGridLayout = useAgentsStore((s) => s.setGridLayout);
  const toggleLeft = useUiStore((s) => s.toggleLeft);
  const setRightOpen = useUiStore((s) => s.setRightOpen);
  const setBoardOpen = useWorkspaceStore((s) => s.setBoardOpen);
  const boardOpen = useWorkspaceStore((s) => s.boardOpen);
  const toggleView = usePlaneStore((s) => s.toggleView);
  const view = usePlaneStore((s) => s.view);

  const spawnAgent = (cli: string, name: string) => {
    const id = `swarm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    addAgent({
      id,
      cli,
      cliName: cli,
      customName: name,
      args: modelArgs(cli),
      workspaceId: activeWsId,
    });
    onClose();
  };

  const writeToActive = (cmd: string) => {
    const swarms = useAgentsStore.getState();
    const activePaneId = swarms.activePaneId;
    const wsPanes = swarms.swarmsOf(activeWsId);
    const target = activePaneId
      ? swarms.agents.find((b) => b.id === activePaneId)
      : wsPanes[0] || swarms.leadOf(activeWsId);

    if (target) {
      invoke("write_to_terminal", { paneId: target.id, data: cmd + "\r" });
    }
    onClose();
  };

  const commands = useMemo<PaletteCommand[]>(() => [
    // Real Claude Code Slash Commands
    {
      id: "claude-compact",
      category: "Claude Code (/)",
      label: "/compact",
      hint: "Compact and clear conversation context in Claude Code",
      icon: <Layers size={16} className="text-amber-400" />,
      action: () => writeToActive("/compact"),
    },
    {
      id: "claude-cost",
      category: "Claude Code (/)",
      label: "/cost",
      hint: "Display token usage stats and session cost in Claude Code",
      icon: <DollarSign size={16} className="text-emerald-400" />,
      action: () => writeToActive("/cost"),
    },
    {
      id: "claude-review",
      category: "Claude Code (/)",
      label: "/review",
      hint: "Review uncommitted git diffs and codebase changes",
      icon: <CheckCircle2 size={16} className="text-blue-400" />,
      action: () => writeToActive("/review"),
    },
    {
      id: "claude-init",
      category: "Claude Code (/)",
      label: "/init",
      hint: "Initialize CLAUDE.md architecture guide in current repo",
      icon: <FileCode2 size={16} className="text-purple-400" />,
      action: () => writeToActive("/init"),
    },
    {
      id: "claude-pr",
      category: "Claude Code (/)",
      label: "/pr",
      hint: "Draft and create a GitHub Pull Request with changelog",
      icon: <GitPullRequest size={16} className="text-cyan-400" />,
      action: () => writeToActive("/pr"),
    },
    {
      id: "claude-bug",
      category: "Claude Code (/)",
      label: "/bug",
      hint: "Deep scan for bugs, regressions, and broken edge cases",
      icon: <ShieldCheck size={16} className="text-red-400" />,
      action: () => writeToActive("/bug"),
    },
    {
      id: "claude-doctor",
      category: "Claude Code (/)",
      label: "/doctor",
      hint: "Run diagnostic health check on CLI authentication & MCP",
      icon: <Stethoscope size={16} className="text-emerald-400" />,
      action: () => writeToActive("/doctor"),
    },
    {
      id: "claude-help",
      category: "Claude Code (/)",
      label: "/help",
      hint: "Show all available CLI slash commands & flags",
      icon: <HelpCircle size={16} className="text-zinc-400" />,
      action: () => writeToActive("/help"),
    },
    {
      id: "claude-clear",
      category: "Claude Code (/)",
      label: "/clear",
      hint: "Clear active terminal screen buffer",
      icon: <Trash2 size={16} className="text-zinc-400" />,
      action: () => writeToActive("/clear"),
    },

    // OpenCode & AI Tools
    {
      id: "opencode-zen",
      category: "OpenCode & AI Tools",
      label: "/opencode (or /zen)",
      hint: "Spawn OpenCode Zen with Nemotron Free AI",
      icon: <Bot size={16} className="text-purple-400" />,
      action: () => spawnAgent("opencode", "OpenCode"),
    },
    {
      id: "opencode-models",
      category: "OpenCode & AI Tools",
      label: "/models",
      hint: "List and switch active LLM models (OpenCode / Codex)",
      icon: <Bot size={16} className="text-purple-400" />,
      action: () => writeToActive("/models"),
    },

    // Summon Agents
    {
      id: "summon-claude",
      category: "Summon Agents",
      label: "+ Claude Code",
      hint: "Opus 5 · Anthropic Coding Agent",
      icon: <Sparkles size={16} className="text-amber-400" />,
      action: () => spawnAgent("claude", "Claude Code"),
    },
    {
      id: "summon-antigravity",
      category: "Summon Agents",
      label: "+ Antigravity CLI (agy)",
      hint: "Google Gemini 3.7 Flash · Deep Coding Agent",
      icon: <Zap size={16} className="text-blue-400" />,
      action: () => spawnAgent("agy", "Antigravity"),
    },
    {
      id: "summon-opencode",
      category: "Summon Agents",
      label: "+ OpenCode Zen",
      hint: "Nemotron Free · Autonomous Worker",
      icon: <Bot size={16} className="text-purple-400" />,
      action: () => spawnAgent("opencode", "OpenCode"),
    },
    {
      id: "summon-codex",
      category: "Summon Agents",
      label: "+ Codex CLI",
      hint: "GPT-5 · OpenAI Core Agent",
      icon: <Zap size={16} className="text-cyan-400" />,
      action: () => spawnAgent("codex", "Codex"),
    },
    {
      id: "summon-cursor",
      category: "Summon Agents",
      label: "+ Cursor Agent",
      hint: "Cursor IDE AI Coding Agent",
      icon: <Bot size={16} className="text-indigo-400" />,
      action: () => spawnAgent("cursor", "Cursor Agent"),
    },
    {
      id: "summon-gemini",
      category: "Summon Agents",
      label: "+ Gemini CLI",
      hint: "Google Gemini CLI Assistant",
      icon: <Zap size={16} className="text-blue-400" />,
      action: () => spawnAgent("gemini", "Gemini CLI"),
    },
    {
      id: "summon-droid",
      category: "Summon Agents",
      label: "+ Factory Droid",
      hint: "Autonomous Coding Droid",
      icon: <Bot size={16} className="text-emerald-400" />,
      action: () => spawnAgent("droid", "Droid"),
    },
    {
      id: "summon-terminal",
      category: "Summon Agents",
      label: "+ Terminal Shell",
      hint: "Plain PTY terminal (zsh / bash / pwsh)",
      icon: <Terminal size={16} className="text-emerald-400" />,
      action: () => spawnAgent("shell", "Terminal"),
    },

    // Lead Orchestration
    {
      id: "lead-summon",
      category: "Lead Orchestration",
      label: "/lead steward",
      hint: "Crown autonomous Lead Steward (Planner & Router)",
      icon: <Sparkles size={16} className="text-amber-400" />,
      action: () => {
        leadHost().summonLead(activeWsId, "claude", "Claude Lead");
        onClose();
      },
    },
    {
      id: "lead-forager",
      category: "Lead Orchestration",
      label: "/lead forager",
      hint: "Switch Lead to Forager (Autonomous Bug Hunter)",
      icon: <Search size={16} className="text-blue-400" />,
      action: () => {
        const lead = leadHost().leadOf(activeWsId);
        if (lead) {
          leadHost().setLeadMode(lead.id, "Forager");
          leadHost().publishRole("Forager");
        }
        setRightOpen(true);
        onClose();
      },
    },
    {
      id: "lead-stinger",
      category: "Lead Orchestration",
      label: "/lead stinger",
      hint: "Switch Lead to Stinger (Deep Security Auditor)",
      icon: <ShieldCheck size={16} className="text-emerald-400" />,
      action: () => {
        const lead = leadHost().leadOf(activeWsId);
        if (lead) {
          leadHost().setLeadMode(lead.id, "Stinger");
          leadHost().publishRole("Stinger");
        }
        setRightOpen(true);
        onClose();
      },
    },

    // Views & Tools
    {
      id: "swarm-dashboard",
      category: "Views & Tools",
      label: "/dashboard",
      hint: "Open Swarm Live Observability & Log stream",
      icon: <Activity size={16} className="text-emerald-400" />,
      action: () => {
        onOpenDashboard?.();
        onClose();
      },
    },
    {
      id: "task-templates",
      category: "Views & Tools",
      label: "/templates",
      hint: "1-Click Multi-Agent Workflow Templates",
      icon: <Layers size={16} className="text-swarm-gold" />,
      action: () => {
        onOpenTemplates?.();
        onClose();
      },
    },
    {
      id: "diff-preview",
      category: "Views & Tools",
      label: "/diff",
      hint: "Preview git worktree changes before merge",
      icon: <FileCode2 size={16} className="text-cyan-400" />,
      action: () => {
        onOpenDiff?.();
        onClose();
      },
    },
    {
      id: "voice-toggle",
      category: "Views & Tools",
      label: "/voice",
      hint: "Start Voice Dictation Island",
      icon: <Mic size={16} className="text-amber-400" />,
      shortcut: "Win+Alt",
      action: () => {
        window.dispatchEvent(new CustomEvent("swarm:voice:toggle", { detail: { mode: "lead" } }));
        onClose();
      },
    },
    {
      id: "toggle-tasks",
      category: "Views & Tools",
      label: "/tasks",
      hint: boardOpen ? "Hide Kanban board" : "Show Kanban board",
      icon: <Columns3 size={16} className="text-zinc-300" />,
      action: () => {
        setBoardOpen(!boardOpen);
        onClose();
      },
    },
    {
      id: "toggle-flow",
      category: "Views & Tools",
      label: "/flow",
      hint: view === "flow" ? "Switch to Grid view" : "Switch to infinite Flow canvas",
      icon: <Activity size={16} className="text-cyan-400" />,
      action: () => {
        toggleView();
        onClose();
      },
    },
    {
      id: "toggle-lead-dock",
      category: "Views & Tools",
      label: "/lead",
      hint: "Show/hide Lead orchestrator dock",
      icon: <PanelRight size={16} className="text-zinc-300" />,
      action: () => {
        setRightOpen(true);
        onClose();
      },
    },
    {
      id: "toggle-sidebar",
      category: "Views & Tools",
      label: "Toggle Sidebar",
      hint: "Show/hide left navigation sidebar",
      icon: <PanelLeft size={16} className="text-zinc-300" />,
      shortcut: "Cmd+B",
      action: () => {
        toggleLeft();
        onClose();
      },
    },

    // Grid Layouts
    {
      id: "layout-auto",
      category: "Grid Layouts",
      label: "/layout auto",
      hint: "Smart responsive grid sizing",
      icon: <LayoutGrid size={16} className="text-zinc-300" />,
      action: () => {
        setGridLayout("auto");
        onClose();
      },
    },
    {
      id: "layout-grid2x2",
      category: "Grid Layouts",
      label: "/layout 2x2",
      hint: "4 equal quadrants",
      icon: <Layers size={16} className="text-zinc-300" />,
      action: () => {
        setGridLayout("grid2x2");
        onClose();
      },
    },
    {
      id: "layout-cols2",
      category: "Grid Layouts",
      label: "/layout cols2",
      hint: "Side-by-side split view",
      icon: <Columns3 size={16} className="text-zinc-300" />,
      action: () => {
        setGridLayout("cols2");
        onClose();
      },
    },
    {
      id: "layout-master",
      category: "Grid Layouts",
      label: "/layout master",
      hint: "1 large focus pane + right stack",
      icon: <LayoutGrid size={16} className="text-zinc-300" />,
      action: () => {
        setGridLayout("master");
        onClose();
      },
    },

    // Project & Settings
    {
      id: "open-folder",
      category: "Project",
      label: "Open Project Folder…",
      hint: "Switch or add workspace",
      icon: <FolderOpen size={16} className="text-amber-400" />,
      shortcut: "Cmd+O",
      action: () => {
        onOpenFolder();
        onClose();
      },
    },
    {
      id: "open-extensions",
      category: "Project",
      label: "Extensions Marketplace",
      hint: "Install AI tools & Open-VSX packages",
      icon: <Blocks size={16} className="text-purple-400" />,
      action: () => {
        onOpenExtensions();
        onClose();
      },
    },
    {
      id: "open-settings",
      category: "Project",
      label: "Settings & API Keys",
      hint: "Configure models, tokens, and voice",
      icon: <Settings size={16} className="text-zinc-300" />,
      shortcut: "Cmd+,",
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: "check-updates",
      category: "Project",
      label: "/update",
      hint: "Check for new SwarmAI DMG & OS release updates",
      icon: <Download size={16} className="text-emerald-400" />,
      action: () => {
        if (onOpenUpdates) onOpenUpdates();
        else onOpenSettings();
        onClose();
      },
    },
    {
      id: "open-git",
      category: "Project",
      label: "/git",
      hint: "Git & GitHub Hub (commit, push, pull, branch, init)",
      icon: <FolderGit2 size={16} className="text-amber-400" />,
      shortcut: "Cmd+G",
      action: () => {
        if (onOpenGit) onOpenGit();
        onClose();
      },
    },
  ], [activeWsId, boardOpen, view, onClose, onOpenSettings, onOpenExtensions, onOpenFolder, onOpenUpdates, onOpenGit]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase().trim();
    // Support typing "+" to list summon commands
    if (q === "+") {
      return commands.filter((cmd) => cmd.category === "Summon Agents");
    }
    // Support typing "/" to list all slash commands
    if (q === "/") {
      return commands.filter((cmd) => cmd.label.startsWith("/"));
    }
    const cleanQ = q.startsWith("/") ? q.slice(1) : q.startsWith("+") ? q.slice(1).trim() : q;
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.label.toLowerCase().includes(cleanQ) ||
        cmd.hint?.toLowerCase().includes(q) ||
        cmd.hint?.toLowerCase().includes(cleanQ) ||
        cmd.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  useEffect(() => {
    if (!isOpen) return;
    restoreRef.current = document.activeElement as HTMLElement | null;
    inputRef.current?.focus();
    return () => {
      setQuery("");
      setSelectedIndex(0);
      restoreRef.current?.focus();
      restoreRef.current = null;
    };
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const current = filteredCommands[selectedIndex];
      if (current) current.action();
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-start justify-center pt-[15vh] bg-black/65 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-[0_25px_70px_rgba(0,0,0,0.85),0_0_40px_rgba(245,158,11,0.15)] backdrop-blur-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-800/80 bg-zinc-900/50">
          <Search size={18} className="text-amber-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type / for real CLI commands, + to summon agents, or search..."
            className="w-full bg-transparent text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none font-mono"
          />
          <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded">
            ESC
          </span>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="max-h-[380px] overflow-y-auto p-2 flex flex-col gap-1 scrollbar-sleek"
        >
          {filteredCommands.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400">
              No matching commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.action}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-left text-xs transition-all ${
                    isSelected
                      ? "bg-amber-500/15 text-amber-200 shadow-sm border border-amber-500/30"
                      : "text-zinc-300 hover:bg-zinc-800/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-zinc-900 border border-zinc-800 shrink-0">
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-zinc-100 truncate font-mono">{cmd.label}</div>
                      {cmd.hint && (
                        <div className="text-[11px] text-zinc-400 truncate">{cmd.hint}</div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {cmd.shortcut && (
                      <span className="font-mono text-[10px] text-zinc-400 bg-zinc-900/80 px-1.5 py-0.5 rounded border border-zinc-800">
                        {cmd.shortcut}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-400 font-sans">{cmd.category}</span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts tip */}
        <div className="px-4 py-2 border-t border-zinc-800/60 bg-zinc-900/40 text-[11px] text-zinc-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">↑↓</kbd> Navigate</span>
            <span><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">↵</kbd> Execute</span>
            <span><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">/</kbd> CLI Commands</span>
            <span><kbd className="font-mono bg-zinc-800 px-1 py-0.5 rounded text-zinc-300">+</kbd> Summon</span>
          </div>
          <span className="text-amber-400 font-medium font-mono text-[10px]">Swarm AI CLI Hub</span>
        </div>
      </div>
    </div>
  );
}
