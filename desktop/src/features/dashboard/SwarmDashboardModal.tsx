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
 Timer,
 Zap,
 TrendingUp,
 Gauge,
 Play,
 Square,
 ArrowRight,
 ChevronRight,
 BarChart3,
 PieChart,
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
 architect: "border-indigo-500/40 text-indigo-400 bg-indigo-500/10",
 frontend: "border-cyan-500/40 text-cyan-400 bg-cyan-500/10",
 backend: "border-purple-500/40 text-purple-400 bg-purple-500/10",
 tester: "border-emerald-500/40 text-emerald-400 bg-emerald-500/10",
 security: "border-rose-500/40 text-rose-400 bg-rose-500/10",
};

const LEVEL_COLORS: Record<string, string> = {
 info: "text-blue-400 bg-blue-500/10 border-blue-500/30",
 warn: "text-amber-400 bg-amber-500/10 border-amber-500/30",
 error: "text-red-400 bg-red-500/10 border-red-500/30",
};

/** Tiny inline bar chart for stat cards */
function MiniBars({ values, color = "bg-swarm-gold" }: { values: number[]; color?: string }) {
 const max = Math.max(...values, 1);
 return (
 <div className="flex items-end gap-[2px] h-4">
 {values.map((v, i) => (
 <div
 key={i}
 className={`w-[3px] rounded-full ${color} transition-all duration-300`}
 style={{ height: `${Math.max(15, (v / max) * 100)}%` }}
 />
 ))}
 </div>
 );
}

/** Animated circular progress */
function CircularProgress({ value, max, size = 40, strokeWidth = 3 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
 const pct = max > 0 ? value / max : 0;
 const r = (size - strokeWidth) / 2;
 const circ = 2 * Math.PI * r;
 const offset = circ * (1 - pct);
 return (
 <svg width={size} height={size} className="transform -rotate-90">
 <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-swarm-border/40" strokeWidth={strokeWidth} />
 <circle
 cx={size / 2}
 cy={size / 2}
 r={r}
 fill="none"
 stroke="currentColor"
 className="text-swarm-gold"
 strokeWidth={strokeWidth}
 strokeDasharray={circ}
 strokeDashoffset={offset}
 strokeLinecap="round"
 style={{ transition: "stroke-dashoffset 0.6s ease-out" }}
 />
 </svg>
 );
}

export default function SwarmDashboardModal({ open, projectPath, onClose }: Props) {
 const [activeTab, setActiveTab] = useState<"overview" | "logs">("overview");
 const [logFilter, setLogFilter] = useState("");
 const [selectedAgentId, setSelectedAgentId] = useState<string | "all">("all");
 const [mockLogs, setMockLogs] = useState<Array<{ id: string; agentName: string; text: string; time: string; level: "info" | "warn" | "error" }>>([]);
 const [now, setNow] = useState(new Date());
 const [isRefreshing, setIsRefreshing] = useState(false);

 const agents = useAgentsStore((s) => s.agents);
 const agentStatuses = useAgentsStore((s) => s.agentStatuses);
 const workspaces = useWorkspaceStore((s) => s.workspaces);
 const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
 const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

 // Tick clock every second for live feel
 useEffect(() => {
 if (!open) return;
 const timer = setInterval(() => setNow(new Date()), 1000);
 return () => clearInterval(timer);
 }, [open]);

 // Compute live statistics
 const stats = useMemo(() => {
 const total = agents.length;
 const running = agents.filter((a) => agentStatuses[a.id] === "running").length;
 const launching = agents.filter((a) => agentStatuses[a.id] === "launching").length;
 const error = agents.filter((a) => agentStatuses[a.id] === "error").length;
 const idle = total - running - launching - error;
 const tasks = activeWorkspace?.taskCards ?? [];
 const completedTasks = tasks.filter((t) => t.column === "done").length;

 // Build distribution data for mini chart
 const distribution = [running, launching, idle, error];

 return { total, running, launching, error, idle, totalTasks: tasks.length, completedTasks, distribution };
 }, [agents, agentStatuses, activeWorkspace]);

 // Simulate or read recent log entries for observability
 useEffect(() => {
 if (!open) return;
 const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
 const initialLogs = agents.map((a, i) => ({
 id: `log-${a.id}-${i}`,
 agentName: a.customName || a.cliName || a.cli || "Agent",
 text: `Session initialized in workspace ${activeWorkspace?.name ?? "default"} · mode: standard permissions · model: ${a.model || "default"}`,
 time: timeStr,
 level: "info" as const,
 }));
 setMockLogs(initialLogs);
 }, [open, agents, activeWorkspace, now]);

 const filteredLogs = useMemo(() => {
 return mockLogs.filter((l) => {
 const matchAgent = selectedAgentId === "all" || l.agentName.toLowerCase().includes(selectedAgentId.toLowerCase());
 const matchText = !logFilter || l.text.toLowerCase().includes(logFilter.toLowerCase()) || l.agentName.toLowerCase().includes(logFilter.toLowerCase());
 return matchAgent && matchText;
 });
 }, [mockLogs, selectedAgentId, logFilter]);

 const handleRefresh = () => {
 setIsRefreshing(true);
 setTimeout(() => setIsRefreshing(false), 800);
 };

 if (!open) return null;

 const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4">
 <div
 className="w-full max-w-5xl max-h-[85vh] flex flex-col rounded-xl glass-rail border border-swarm-gold/30 shadow-2xl overflow-hidden bg-swarm-canvas/95"
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
 Swarm Live Dashboard
 <span className="text-micro font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
 <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
 Live
 </span>
 </h2>
 <p className="text-micro text-swarm-textMuted flex items-center gap-2">
 {activeWorkspace?.name ?? "Default Workspace"}
 <span className="text-swarm-border">·</span>
 <span className="font-mono">{timeStr}</span>
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
 onClick={handleRefresh}
 className={`p-1.5 rounded-lg text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-surface transition-all ${isRefreshing ? "animate-spin" : ""}`}
 title="Refresh dashboard"
 >
 <RefreshCw className="size-4" />
 </button>

 <button
 onClick={onClose}
 className="p-1.5 rounded-lg text-swarm-textMuted hover:text-swarm-text hover:bg-swarm-surface transition-colors"
 >
 <X className="size-4" />
 </button>
 </div>
 </div>

 {/* Global Metric Strip */}
 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 px-6 py-3 border-b border-swarm-border/30 bg-swarm-surface/20 shrink-0">
 {/* Total Agents */}
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between group hover:border-swarm-gold/30 transition-colors">
 <div>
 <span className="text-micro text-swarm-textMuted uppercase font-semibold block">Total</span>
 <div className="text-lg font-bold text-swarm-text">{stats.total}</div>
 </div>
 <Cpu className="size-4 text-swarm-gold/50 group-hover:text-swarm-gold transition-colors" />
 </div>

 {/* Running */}
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between group hover:border-emerald-500/30 transition-colors">
 <div>
 <span className="text-micro text-swarm-textMuted uppercase font-semibold block">Running</span>
 <div className="text-lg font-bold text-emerald-400 flex items-center gap-1.5">
 {stats.running}
 {stats.running > 0 && <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />}
 </div>
 </div>
 <Flame className="size-4 text-emerald-400/50 group-hover:text-emerald-400 transition-colors" />
 </div>

 {/* Launching */}
 {stats.launching > 0 && (
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between border-amber-500/20 bg-amber-500/5">
 <div>
 <span className="text-micro text-amber-400 uppercase font-semibold block">Launching</span>
 <div className="text-lg font-bold text-amber-400 flex items-center gap-1.5">
 {stats.launching}
 <Zap className="size-3.5 animate-pulse" />
 </div>
 </div>
 <div className="size-4 rounded-full border-2 border-amber-400/30 border-t-amber-400 animate-spin" />
 </div>
 )}

 {/* Idle */}
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between group hover:border-swarm-border transition-colors">
 <div>
 <span className="text-micro text-swarm-textMuted uppercase font-semibold block">Idle</span>
 <div className="text-lg font-bold text-swarm-textDim">{stats.idle}</div>
 </div>
 <Clock className="size-4 text-swarm-textMuted group-hover:text-swarm-text transition-colors" />
 </div>

 {/* Errors */}
 {stats.error > 0 ? (
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between border-red-500/20 bg-red-500/5">
 <div>
 <span className="text-micro text-red-400 uppercase font-semibold block">Errors</span>
 <div className="text-lg font-bold text-red-400 flex items-center gap-1.5">
 {stats.error}
 <AlertTriangle className="size-3.5" />
 </div>
 </div>
 <AlertTriangle className="size-4 text-red-400/50" />
 </div>
 ) : (
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between opacity-40">
 <div>
 <span className="text-micro text-swarm-textMuted uppercase font-semibold block">Errors</span>
 <div className="text-lg font-bold text-swarm-textMuted">0</div>
 </div>
 <CheckCircle2 className="size-4 text-emerald-400/50" />
 </div>
 )}

 {/* Tasks */}
 <div className="glass-inset rounded-lg p-2.5 flex items-center justify-between group hover:border-cyan-500/30 transition-colors">
 <div className="flex-1 min-w-0">
 <span className="text-micro text-swarm-textMuted uppercase font-semibold block">Tasks</span>
 <div className="flex items-baseline gap-1">
 <div className="text-lg font-bold text-cyan-400">{stats.completedTasks}</div>
 <div className="text-micro text-swarm-textMuted">/ {stats.totalTasks}</div>
 </div>
 {stats.totalTasks > 0 && (
 <div className="mt-1 h-1 bg-swarm-border/40 rounded-full overflow-hidden">
 <div
 className="h-full bg-cyan-400/70 rounded-full transition-all duration-500"
 style={{ width: `${(stats.completedTasks / stats.totalTasks) * 100}%` }}
 />
 </div>
 )}
 </div>
 <CheckCircle2 className="size-4 text-cyan-400/50 group-hover:text-cyan-400 transition-colors shrink-0 ml-2" />
 </div>
 </div>

 {/* Content Area */}
 <div className="flex-1 overflow-y-auto p-6 scrollbar-sleek min-h-[320px]">
 {activeTab === "overview" && (
 <div>
 {agents.length === 0 ? (
 <div className="text-center py-16 text-swarm-textMuted">
 <div className="size-16 mx-auto mb-4 rounded-2xl bg-swarm-surface/60 border border-swarm-border/40 flex items-center justify-center">
 <Terminal className="size-8 opacity-30" />
 </div>
 <p className="text-sm font-medium text-swarm-text">No agents spawned in this workspace yet.</p>
 <p className="text-micro text-swarm-textMuted mt-1.5 max-w-sm mx-auto">
 Spawn Claude Code, OpenCode, Codex, or a Terminal from the Board strip or use <kbd className="font-mono bg-swarm-surface px-1.5 py-0.5 rounded border border-swarm-border/40 text-swarm-gold text-[10px]">Cmd+K</kbd> to summon agents.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {agents.map((agent) => {
 const status = agentStatuses[agent.id] ?? "idle";
 const isRunning = status === "running";
 const isLaunching = status === "launching";
 const isError = status === "error";
 const role = (agent as any).role;
 const roleColor = role ? ROLE_COLORS[role] : null;

 return (
 <div
 key={agent.id}
 className={`glass-hi rounded-xl border transition-all flex flex-col gap-3 shadow-sm hover:shadow-md ${
 isError
 ? "border-red-500/40 hover:border-red-500/60"
 : isRunning
 ? "border-emerald-500/30 hover:border-swarm-gold/50"
 : "border-swarm-border/60 hover:border-swarm-gold/50"
 }`}
 >
 {/* Agent Header */}
 <div className="flex items-start justify-between gap-3 p-4">
 <div className="flex items-center gap-3">
 <div className={`size-10 rounded-lg flex items-center justify-center font-mono text-sm font-bold border ${
 isRunning
 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
 : isError
 ? "bg-red-500/10 text-red-400 border-red-500/30"
 : "bg-swarm-surface text-swarm-gold border-swarm-border"
 }`}>
 {agent.cliName?.[0]?.toUpperCase() || "A"}
 </div>
 <div className="min-w-0">
 <div className="text-sm font-semibold text-swarm-text flex items-center gap-2 flex-wrap">
 {agent.customName || agent.cliName || "Agent"}
 <span className={`size-2 rounded-full shrink-0 ${
 isRunning
 ? "bg-emerald-400 animate-pulse"
 : isLaunching
 ? "bg-amber-400 animate-pulse"
 : isError
 ? "bg-red-400"
 : "bg-swarm-textMuted"
 }`} />
 </div>
 <div className="text-micro font-mono text-swarm-textMuted mt-0.5">
 {agent.cli || "shell"} · {agent.id.slice(0, 10)}
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 {roleColor && (
 <span className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full border ${roleColor}`}>
 {role}
 </span>
 )}
 <span className={`text-micro font-semibold uppercase px-2 py-0.5 rounded-full border ${
 isRunning
 ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
 : isLaunching
 ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
 : isError
 ? "bg-red-500/10 text-red-400 border-red-500/30"
 : "bg-swarm-border/30 text-swarm-textMuted border-swarm-border/40"
 }`}>
 {status}
 </span>
 </div>
 </div>

 {/* Agent Meta */}
 <div className="px-4 flex flex-wrap items-center gap-2">
 {agent.model && (
 <span className="font-mono text-[11px] bg-swarm-canvas/60 px-2 py-0.5 rounded border border-swarm-border/30 text-swarm-textMuted">
 Model: {agent.model}
 </span>
 )}
 {agent.effort && (
 <span className="font-mono text-[11px] bg-swarm-canvas/60 px-2 py-0.5 rounded border border-swarm-border/30 text-swarm-textMuted">
 Effort: {agent.effort}
 </span>
 )}
 <span className="font-mono text-[11px] bg-swarm-canvas/60 px-2 py-0.5 rounded border border-swarm-border/30 text-swarm-textMuted flex items-center gap-1">
 <Timer className="size-2.5" />
 Workspace
 </span>
 </div>

 {/* Agent Footer */}
 <div className="flex items-center justify-between px-4 py-2.5 border-t border-swarm-border/30 bg-swarm-surface/10">
 <span className="text-micro text-swarm-textMuted flex items-center gap-1.5">
 <Sliders className="size-3 text-swarm-gold/70" />
 Standard Workspace
 </span>

 <div className="flex items-center gap-1">
 {isRunning && (
 <button
 onClick={onClose}
 className="inline-flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-medium px-2 py-1 rounded-md hover:bg-red-500/10 transition-colors"
 title="Stop agent"
 >
 <Square className="size-3" /> Stop
 </button>
 )}
 <button
 onClick={onClose}
 className="inline-flex items-center gap-1 text-[11px] text-swarm-gold hover:text-swarm-goldHi font-medium px-2 py-1 rounded-md hover:bg-swarm-gold/10 transition-colors"
 >
 <Eye className="size-3" /> Focus <ChevronRight className="size-3" />
 </button>
 </div>
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
 className="w-full bg-swarm-canvas/80 border border-swarm-border/60 rounded-lg px-8 py-2 text-xs text-swarm-text placeholder:text-swarm-textMuted focus:outline-none focus:border-swarm-gold transition-colors"
 />
 </div>

 <select
 value={selectedAgentId}
 onChange={(e) => setSelectedAgentId(e.target.value)}
 className="bg-swarm-canvas/80 border border-swarm-border/60 rounded-lg px-3 py-2 text-xs text-swarm-text focus:outline-none focus:border-swarm-gold shrink-0 transition-colors"
 >
 <option value="all">All Agents</option>
 {agents.map((a) => (
 <option key={a.id} value={a.customName || a.cliName}>
 {a.customName || a.cliName}
 </option>
 ))}
 </select>

 <div className="text-micro text-swarm-textMuted bg-swarm-surface/60 px-2.5 py-2 rounded-lg border border-swarm-border/40">
 {filteredLogs.length} entries
 </div>
 </div>

 {/* Log Level Legend */}
 <div className="flex items-center gap-3 text-[10px] font-medium uppercase tracking-wider">
 <span className="flex items-center gap-1.5 text-blue-400">
 <span className="size-1.5 rounded-full bg-blue-400" /> Info
 </span>
 <span className="flex items-center gap-1.5 text-amber-400">
 <span className="size-1.5 rounded-full bg-amber-400" /> Warning
 </span>
 <span className="flex items-center gap-1.5 text-red-400">
 <span className="size-1.5 rounded-full bg-red-400" /> Error
 </span>
 </div>

 {/* Log List */}
 <div className="flex-1 bg-swarm-canvas/90 border border-swarm-border/40 rounded-lg overflow-hidden">
 <div className="overflow-y-auto max-h-[400px] scrollbar-sleek">
 {filteredLogs.length === 0 ? (
 <div className="text-swarm-textMuted italic py-8 text-center text-xs">No logs matching query</div>
 ) : (
 <div className="divide-y divide-swarm-border/20">
 {filteredLogs.map((log, idx) => (
 <div key={log.id} className="flex items-start gap-3 px-3 py-2 hover:bg-swarm-surface/40 transition-colors group">
 <span className="text-micro font-mono text-swarm-textMuted shrink-0 pt-0.5 w-[70px]">{log.time}</span>
 <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border shrink-0 ${LEVEL_COLORS[log.level] || LEVEL_COLORS.info}`}>
 {log.level}
 </span>
 <span className="text-swarm-goldHi text-xs font-semibold shrink-0 max-w-[120px] truncate" title={log.agentName}>
 [{log.agentName}]
 </span>
 <span className="text-swarm-text text-xs flex-1 break-all leading-relaxed">{log.text}</span>
 <span className="text-micro font-mono text-swarm-textMuted/50 group-hover:text-swarm-textMuted shrink-0">
 #{idx + 1}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
