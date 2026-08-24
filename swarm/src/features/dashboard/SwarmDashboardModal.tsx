"use client";

import { useState, useMemo, useEffect } from "react";
import {
  X,
  Activity,
  Cpu,
  Terminal,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  FileCode,
} from "lucide-react";
import { useAgentsStore, type Agent } from "@swarm/agents/ui";
import { useWorkspaceStore } from "@swarm/workspace";
import { invoke } from "@tauri-apps/api/core";

interface Props {
  open: boolean;
  projectPath: string | null;
  onClose: () => void;
}

const ROLE_COLORS: Record<string, string> = {
  builder: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
  reviewer: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
  scout: "border-amber-500/40 text-amber-400 bg-amber-500/10",
  coordinator: "border-purple-500/40 text-purple-400 bg-purple-500/10",
};

export default function SwarmDashboardModal({ open, projectPath, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");
  const [logFilter, setLogFilter] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string | "all">("all");
  const [mockLogs, setMockLogs] = useState<Array<{ id: string; agentName: string; text: string; time: string; level: "info" | "warn" | "error" }>>([]);

  const agents = useAgentsStore((s) => s.agents);
  const agentStatuses = useAgentsStore((s) => s.agentStatuses);
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

  // Compute live statistics
  const stats = useMemo(() => {
    const total = agents.length;
    const running = agents.filter((a) => agentStatuses[a.id] === "running").length;
    const launching = agents.filter((a) => agentStatuses[a.id] === "launching").length;
    const error = agents.filter((a) => agentStatuses[a.id] === "error").length;
    const idle = total - running - launching - error;
    const tasks = activeWorkspace?.taskCards ?? [];
    const completedTasks = tasks.filter((t) => t.column === "done").length;

    return { total, running, launching, error, idle, totalTasks: tasks.length, completedTasks };
  }, [agents, agentStatuses, activeWorkspace]);

  // Simulate or read recent log entries for observability
  useEffect(() => {
    if (!open) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const initialLogs = agents.map((a, i) => ({
      id: `log-${a.id}-${i}`,
      agentName: a.customName || a.cliName || a.cli || "Agent",
      text: `Initialized session for workspace ${activeWorkspace?.name ?? "default"} with mode: standard permissions.`,
      time: timeStr,
      level: "info" as const,
    }));
    setMockLogs(initialLogs);
  }, [open, agents, activeWorkspace]);

  const filteredLogs = useMemo(() => {
    return mockLogs.filter((l) => {
      const matchAgent = selectedAgentId === "all" || l.agentName.toLowerCase().includes(selectedAgentId.toLowerCase());
      const matchText = !logFilter || l.text.toLowerCase().includes(logFilter.toLowerCase()) || l.agentName.toLowerCase().includes(logFilter.toLowerCase());
      return matchAgent && matchText;
    });
  }, [mockLogs, selectedAgentId, logFilter]);

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
            <div className="size-9 rounded-lg bg-swarm-gold/15 border border-swarm-gold/30 flex items-center justify-center text-swarm-gold">
              <Activity className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-swarm-text flex items-center gap-2">
                Swarm Live Observability Dashboard
                <span className="text-micro font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Live
                </span>
              </h2>
              <p className="text-micro text-swarm-textMuted">
                Real-time status, workload metrics, and logs across all active agents
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Tabs */}
            <div className="flex bg-swarm-surface/60 rounded-lg p-0.5 border border-swarm-border/40">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === "overview"
                    ? "bg-swarm-gold/20 text-swarm-goldHi shadow-sm border border-swarm-gold/30"
                    : "text-swarm-textMuted hover:text-swarm-text"
                }`}
              >
                Swarm Grid
              </button>
              <button
                onClick={() => setActiveTab("logs")}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  activeTab === "logs"
                    ? "bg-swarm-gold/20 text-swarm-goldHi shadow-sm border border-swarm-gold/30"
                    : "text-swarm-textMuted hover:text-swarm-text"
                }`}
              >
                Aggregated Logs
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-surface transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Global Metric Strip */}
        <div className="grid grid-cols-4 gap-3 px-6 py-3 border-b border-swarm-border/30 bg-swarm-surface/20 shrink-0">
          <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-micro text-swarm-textMuted uppercase font-semibold">Active Swarms</span>
              <div className="text-lg font-bold text-swarm-text">{stats.total}</div>
            </div>
            <Cpu className="size-5 text-swarm-gold/60" />
          </div>

          <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-micro text-swarm-textMuted uppercase font-semibold">Running</span>
              <div className="text-lg font-bold text-emerald-400">{stats.running}</div>
            </div>
            <Flame className="size-5 text-emerald-400/60" />
          </div>

          <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-micro text-swarm-textMuted uppercase font-semibold">Idle / Ready</span>
              <div className="text-lg font-bold text-swarm-textDim">{stats.idle}</div>
            </div>
            <Clock className="size-5 text-swarm-textMuted" />
          </div>

          <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between">
            <div>
              <span className="text-micro text-swarm-textMuted uppercase font-semibold">Tasks Completed</span>
              <div className="text-lg font-bold text-cyan-400">
                {stats.completedTasks} / {stats.totalTasks}
              </div>
            </div>
            <CheckCircle2 className="size-5 text-cyan-400/60" />
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-sleek min-h-[320px]">
          {activeTab === "overview" && (
            <div>
              {agents.length === 0 ? (
                <div className="text-center py-12 text-swarm-textMuted">
                  <Terminal className="size-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No agents spawned in this workspace yet.</p>
                  <p className="text-micro text-swarm-textMuted mt-1">
                    Spawn Claude Code, OpenCode, Codex or Terminal from the Board strip.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {agents.map((agent) => {
                    const status = agentStatuses[agent.id] ?? "idle";
                    const isRunning = status === "running";
                    const isLaunching = status === "launching";
                    const isError = status === "error";

                    return (
                      <div
                        key={agent.id}
                        className="glass-hi rounded-xl p-4 border border-swarm-border/60 hover:border-swarm-gold/50 transition-all flex flex-col justify-between gap-3 shadow-sm hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="size-8 rounded-lg bg-swarm-surface flex items-center justify-center font-mono text-xs text-swarm-gold font-bold border border-swarm-border">
                              {agent.cliName?.[0]?.toUpperCase() || "A"}
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-swarm-text flex items-center gap-2">
                                {agent.customName || agent.cliName || "Agent"}
                                <span
                                  className={`size-2 rounded-full ${
                                    isRunning
                                      ? "bg-emerald-400 animate-pulse"
                                      : isLaunching
                                      ? "bg-amber-400"
                                      : isError
                                      ? "bg-red-400"
                                      : "bg-swarm-textMuted"
                                  }`}
                                />
                              </div>
                              <span className="text-micro font-mono text-swarm-textMuted">
                                CLI: {agent.cli || "shell"} | ID: {agent.id.slice(0, 10)}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-micro font-semibold uppercase px-2 py-0.5 rounded-full border ${
                              isRunning
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                                : isLaunching
                                ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
                                : isError
                                ? "bg-red-500/10 text-red-400 border-red-500/30"
                                : "bg-swarm-border/30 text-swarm-textMuted border-swarm-border/40"
                            }`}
                          >
                            {status}
                          </span>
                        </div>

                        {agent.model && (
                          <div className="flex items-center gap-2 text-micro text-swarm-textMuted">
                            <span className="font-mono bg-swarm-canvas/60 px-1.5 py-0.5 rounded border border-swarm-border/30">
                              Model: {agent.model}
                            </span>
                            {agent.effort && (
                              <span className="font-mono bg-swarm-canvas/60 px-1.5 py-0.5 rounded border border-swarm-border/30">
                                Effort: {agent.effort}
                              </span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-swarm-border/30 text-micro">
                          <span className="text-swarm-textMuted flex items-center gap-1">
                            <Sliders className="size-3 text-swarm-gold" />
                            Permission: Standard Workspace
                          </span>

                          <button
                            onClick={onClose}
                            className="inline-flex items-center gap-1 text-swarm-gold hover:text-swarm-goldHi font-medium transition-colors"
                          >
                            <Eye className="size-3" /> Focus Terminal
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "logs" && (
            <div className="flex flex-col h-full space-y-3">
              {/* Filter controls */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1">
                  <Search className="size-3.5 text-swarm-textMuted absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    placeholder="Search logs across all agents..."
                    className="w-full bg-swarm-canvas/80 border border-swarm-border/60 rounded px-8 py-1.5 text-xs text-swarm-text placeholder:text-swarm-textMuted focus:outline-none focus:border-swarm-gold"
                  />
                </div>

                <select
                  value={selectedAgentId}
                  onChange={(e) => setSelectedAgentId(e.target.value)}
                  className="bg-swarm-canvas/80 border border-swarm-border/60 rounded px-2.5 py-1.5 text-xs text-swarm-text focus:outline-none focus:border-swarm-gold shrink-0"
                >
                  <option value="all">All Agents</option>
                  {agents.map((a) => (
                    <option key={a.id} value={a.customName || a.cliName}>
                      {a.customName || a.cliName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Log List */}
              <div className="flex-1 bg-swarm-canvas/90 border border-swarm-border/40 rounded-lg p-3 font-mono text-micro overflow-y-auto max-h-[350px] space-y-1.5">
                {filteredLogs.length === 0 ? (
                  <div className="text-swarm-textMuted italic py-4 text-center">No logs matching query</div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="flex items-start gap-2 hover:bg-swarm-surface/40 p-1 rounded">
                      <span className="text-swarm-textMuted shrink-0">[{log.time}]</span>
                      <span className="text-swarm-goldHi shrink-0 font-semibold">[{log.agentName}]</span>
                      <span className="text-swarm-text flex-1 break-all">{log.text}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
