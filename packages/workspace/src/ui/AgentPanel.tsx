"use client";

import { useState, useMemo } from "react";
import {
  Trash2,
  Search,
  Plus,
  Sparkles,
  Maximize2,
  Terminal,
  Cpu,
  Bot,
  Globe,
  Radio,
  ExternalLink,
  Zap,
} from "lucide-react";
import { useAgentsStore, type Agent, type AgentStatus } from "@swarm/agents/ui";
import { useWorkspaceStore } from "../store.js";
import { BrandGlyph, cliBrand, LeadCrown } from "@swarm/board";

interface AgentPanelProps {
  projectPath?: string | null;
}

const STATUS_COLOR: Record<AgentStatus, { bg: string; dot: string; label: string; text: string }> = {
  running: {
    bg: "bg-emerald-500/10 border-emerald-500/20",
    dot: "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]",
    label: "Running",
    text: "text-emerald-400",
  },
  launching: {
    bg: "bg-amber-500/10 border-amber-500/20",
    dot: "bg-amber-400 animate-pulse shadow-[0_0_6px_rgba(251,191,36,0.8)]",
    label: "Launching",
    text: "text-amber-400",
  },
  idle: {
    bg: "bg-zinc-500/10 border-zinc-500/20",
    dot: "bg-zinc-400",
    label: "Idle",
    text: "text-zinc-400",
  },
  error: {
    bg: "bg-rose-500/10 border-rose-500/20",
    dot: "bg-rose-400",
    label: "Error",
    text: "text-rose-400",
  },
  done: {
    bg: "bg-blue-500/10 border-blue-500/20",
    dot: "bg-blue-400",
    label: "Done",
    text: "text-blue-400",
  },
};

const DEFAULT_CLIS = [
  { id: "claude", name: "Claude Code", brand: "claude" },
  { id: "agy", name: "Antigravity", brand: "agy" },
  { id: "codex", name: "Codex", brand: "codex" },
  { id: "opencode", name: "OpenCode", brand: "opencode" },
  { id: "shell", name: "Terminal Shell", brand: "shell", kind: "shell" as const },
];

export default function AgentPanel({ projectPath }: AgentPanelProps) {
  const [search, setSearch] = useState("");
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const agents = useAgentsStore((s) => s.agents);
  const agentStatuses = useAgentsStore((s) => s.agentStatuses);
  const activePaneId = useAgentsStore((s) => s.activePaneId);
  const setActivePaneId = useAgentsStore((s) => s.setActivePaneId);
  const setMaximizedPane = useAgentsStore((s) => s.setMaximizedPane);
  const removeAgent = useAgentsStore((s) => s.removeAgent);
  const addAgent = useAgentsStore((s) => s.addAgent);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);

  // Filter agents belonging to active workspace (or all if none pinned)
  const currentAgents = useMemo(() => {
    if (!activeWorkspaceId) return agents;
    const wsAgents = agents.filter((a) => !a.workspaceId || a.workspaceId === activeWorkspaceId);
    return wsAgents.length > 0 ? wsAgents : agents;
  }, [agents, activeWorkspaceId]);

  const filteredAgents = useMemo(() => {
    if (!search.trim()) return currentAgents;
    const q = search.toLowerCase();
    return currentAgents.filter(
      (a) =>
        a.cliName?.toLowerCase().includes(q) ||
        a.customName?.toLowerCase().includes(q) ||
        a.cli?.toLowerCase().includes(q) ||
        a.model?.toLowerCase().includes(q) ||
        (a.kind || "").toLowerCase().includes(q)
    );
  }, [currentAgents, search]);

  const runningCount = useMemo(() => {
    return currentAgents.filter((a) => {
      const st = agentStatuses[a.id];
      return st === "running" || st === "launching";
    }).length;
  }, [currentAgents, agentStatuses]);

  const handleLaunchCli = (cliId: string, cliName: string, kind?: "agent" | "shell" | "browser") => {
    const newId = `agent-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newAgent: Agent = {
      id: newId,
      cli: cliId,
      cliName: cliName,
      kind: kind || (cliId === "shell" ? "shell" : "agent"),
      workspaceId: activeWorkspaceId || undefined,
    };
    addAgent(newAgent);
    setActivePaneId(newId);
    setShowQuickMenu(false);
  };

  return (
    <div className="flex h-full flex-col min-h-0 select-none bg-[#0a0c12]">
      {/* Header */}
      <div className="flex h-9 shrink-0 items-center justify-between px-3 border-b border-white/[0.06] bg-[#0c0e18]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-300 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Agents</span>
          </span>
          <span className="text-[10px] font-mono text-zinc-400 bg-white/[0.04] px-1.5 py-0.2 rounded border border-white/[0.06]">
            {runningCount}/{currentAgents.length}
          </span>
        </div>

        {/* Quick Launch + Button */}
        <div className="relative">
          <button
            onClick={() => setShowQuickMenu(!showQuickMenu)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
            title="Launch new agent"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>

          {showQuickMenu && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-[#141722] border border-white/[0.1] rounded-lg shadow-2xl py-1 z-50 animate-fade-in">
              <div className="px-2.5 py-1 text-[10px] font-mono text-zinc-500 uppercase tracking-wider border-b border-white/[0.06]">
                Launch Agent
              </div>
              {DEFAULT_CLIS.map((cli) => {
                const brand = cliBrand(cli.brand);
                return (
                  <button
                    key={cli.id}
                    onClick={() => handleLaunchCli(cli.id, cli.name, cli.kind)}
                    className="w-full text-left px-2.5 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-white/[0.08] flex items-center gap-2"
                  >
                    {brand ? <BrandGlyph brand={brand} className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                    <span>{cli.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="shrink-0 px-2 pt-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter agents..."
            className="w-full text-xs bg-white/[0.03] border border-white/[0.06] rounded-md pl-7 pr-2 py-1.5 text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-white/[0.15] transition-colors"
          />
        </div>
      </div>

      {/* Agent List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs gap-3 py-8 px-4 text-center">
            <div className="w-9 h-9 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center text-zinc-400">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-medium text-zinc-300">No active agents</span>
              <span className="text-[11px] text-zinc-500">
                Launch an AI coding agent to start working
              </span>
            </div>

            {/* Quick launch suggestions in empty state */}
            <div className="flex flex-col w-full gap-1 pt-2">
              {DEFAULT_CLIS.slice(0, 3).map((cli) => {
                const brand = cliBrand(cli.brand);
                return (
                  <button
                    key={cli.id}
                    onClick={() => handleLaunchCli(cli.id, cli.name, cli.kind)}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12] text-zinc-300 transition-all text-xs text-left group"
                  >
                    <span className="flex items-center gap-2">
                      {brand ? <BrandGlyph brand={brand} className="w-3.5 h-3.5" /> : <Terminal className="w-3.5 h-3.5" />}
                      <span>Launch {cli.name}</span>
                    </span>
                    <Plus className="w-3 h-3 text-zinc-500 group-hover:text-white transition-colors" />
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          filteredAgents.map((agent) => {
            const statusKey: AgentStatus = agentStatuses[agent.id] || "running";
            const statusConfig = STATUS_COLOR[statusKey] || STATUS_COLOR.running;
            const isSelected = activePaneId === agent.id;
            const brand = cliBrand(agent.cli || "claude");

            return (
              <div
                key={agent.id}
                onClick={() => setActivePaneId(agent.id)}
                className={`group relative flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white/[0.07] border-[#38bdf8]/40 shadow-sm"
                    : "bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.05] hover:border-white/[0.1]"
                }`}
              >
                {/* Header: Brand, Name, Status & Actions */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    {/* Status Dot */}
                    <span className={`w-2 h-2 rounded-full shrink-0 ${statusConfig.dot}`} />

                    {/* Brand Icon */}
                    {brand ? (
                      <BrandGlyph brand={brand} className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Terminal className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                    )}

                    {/* Agent Name */}
                    <span
                      className={`text-xs font-semibold truncate ${
                        isSelected ? "text-white" : "text-zinc-200"
                      }`}
                    >
                      {agent.customName || agent.cliName || agent.cli || "Agent"}
                    </span>

                    {/* Lead Crown */}
                    {agent.isLead && <LeadCrown className="w-3 h-3 text-amber-400 shrink-0" />}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActivePaneId(agent.id);
                        setMaximizedPane(agent.id);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-zinc-200 hover:bg-white/[0.08] transition-colors"
                      title="Focus / Maximize"
                    >
                      <Maximize2 className="w-3 h-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeAgent(agent.id);
                      }}
                      className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Terminate Agent"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Subtitle / Model & Details */}
                <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-400 pl-4">
                  <span className="truncate">
                    {agent.model || agent.cliName || (agent.kind === "shell" ? "Terminal" : "AI Agent")}
                    {agent.effort ? ` · ${agent.effort}` : ""}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9.5px] font-medium border ${statusConfig.bg} ${statusConfig.text}`}
                  >
                    {statusConfig.label}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
