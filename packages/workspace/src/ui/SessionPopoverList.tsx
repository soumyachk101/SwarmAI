import { useState, useEffect, useRef, useCallback } from "react";
import { Search, LoaderCircle, ChevronRight, ExternalLink, MoreVertical } from "lucide-react";

type SessionInfo = {
 id: string;
 name: string;
 mode: "realtime" | "unified" | "haiku" | "sonnet" | "opus" | "codex" | "claudecode" | "custom";
 agent: string;
 model: string;
 status: "running" | "idle" | "queued";
 lastActive: string;
};

type SessionPopoverListProps = {
 workspaceId: string;
 projectPath: string | null;
 onClose: () => void;
};

const MODE_CONFIG: Record<string, { label: string; color: string }> = {
 unified: { label: "Unified", color: "bg-blue-400/20 text-blue-300" },
 realtime: { label: "Realtime", color: "bg-purple-400/20 text-purple-300" },
 haiku: { label: "Haiku", color: "bg-green-400/20 text-green-300" },
 sonnet: { label: "Sonnet", color: "bg-amber-400/20 text-amber-300" },
 opus: { label: "Opus", color: "bg-red-400/20 text-red-300" },
 codex: { label: "Codex", color: "bg-cyan-400/20 text-cyan-300" },
 claudecode: { label: "ClaudeCode", color: "bg-orange-400/20 text-orange-300" },
 custom: { label: "Custom", color: "bg-zinc-400/20 text-zinc-300" },
};

function StatusDot({ status }: { status: SessionInfo["status"] }) {
 const colors = {
 running: "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]",
 idle: "bg-zinc-500",
 queued: "bg-amber-400 animate-pulse",
 };
 return <span className={`inline-block size-1.5 rounded-full ${colors[status]}`} />;
}

export default function SessionPopoverList({ workspaceId, projectPath, onClose }: SessionPopoverListProps) {
 const [sessions, setSessions] = useState<SessionInfo[]>([]);
 const [loading, setLoading] = useState(true);
 const [search, setSearch] = useState("");
 const [filter, setFilter] = useState<string>("all");
 const [selectedId, setSelectedId] = useState<string | null>(null);
 const scrollRef = useRef<HTMLDivElement>(null);

 const loadSessions = useCallback(async () => {
 setLoading(true);
 try {
 const [tabRes, claudeRes] = await Promise.all([
 fetch(`/api/workspace/${workspaceId}/claude-tabs`).catch(() => null),
 fetch(`/api/workspace/${workspaceId}/sessions`).catch(() => null),
 ]);

 const tabSessions: SessionInfo[] = tabRes?.ok ? await tabRes.json() : [];
 const claudeSessions: SessionInfo[] = claudeRes?.ok ? await claudeRes.json() : [];

 const merged = [...tabSessions, ...claudeSessions];
 setSessions(merged);
 } catch {
 setSessions([]);
 } finally {
 setLoading(false);
 }
 }, [workspaceId]);

 useEffect(() => {
 loadSessions();
 const interval = setInterval(loadSessions, 5000);
 return () => clearInterval(interval);
 }, [loadSessions]);

 const filtered = sessions.filter((s) => {
 const matchesSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
 s.agent.toLowerCase().includes(search.toLowerCase()) ||
 s.model.toLowerCase().includes(search.toLowerCase());
 const matchesFilter = filter === "all" || s.mode === filter || s.status === filter;
 return matchesSearch && matchesFilter;
 });

 const grouped = {
 running: filtered.filter((s) => s.status === "running"),
 queued: filtered.filter((s) => s.status === "queued"),
 idle: filtered.filter((s) => s.status === "idle"),
 };

 return (
 <div className="flex flex-col h-full">
 {/* Search */}
 <div className="px-2.5 pt-2 pb-1.5 shrink-0">
 <div className="relative">
 <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-zinc-500" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search sessions..."
 className="w-full h-7 rounded-lg border border-white/[0.08] bg-black/40 pl-7 pr-2 text-[11px] text-zinc-200 outline-none focus:border-amber-400/40 placeholder:text-zinc-600"
 />
 </div>
 </div>

 {/* Filters */}
 <div className="flex items-center gap-1 px-2.5 py-1 shrink-0 overflow-x-auto">
 {[
 { key: "all", label: "All" },
 { key: "running", label: "Running" },
 { key: "idle", label: "Idle" },
 { key: "queued", label: "Queued" },
 { key: "claudecode", label: "CC" },
 { key: "codex", label: "Codex" },
 { key: "custom", label: "Other" },
 ].map((f) => (
 <button
 key={f.key}
 onClick={() => setFilter(f.key)}
 className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${
 filter === f.key
 ? "bg-amber-400/15 text-amber-300"
 : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
 }`}
 >
 {f.label}
 </button>
 ))}
 </div>

 {/* Session List */}
 <div ref={scrollRef} className="flex-1 overflow-y-auto px-2 pb-2 space-y-0.5 min-h-0">
 {loading ? (
 <div className="flex items-center justify-center py-6">
 <LoaderCircle className="size-4 animate-spin text-zinc-500" />
 </div>
 ) : filtered.length === 0 ? (
 <div className="text-center py-4">
 <p className="text-[11px] text-zinc-500">No sessions found</p>
 </div>
 ) : (
 <>
 {grouped.running.length > 0 && (
 <SessionGroup
 label="Running"
 count={grouped.running.length}
 sessions={grouped.running}
 selectedId={selectedId}
 onSelect={setSelectedId}
 projectPath={projectPath}
 />
 )}
 {grouped.queued.length > 0 && (
 <SessionGroup
 label="Queued"
 count={grouped.queued.length}
 sessions={grouped.queued}
 selectedId={selectedId}
 onSelect={setSelectedId}
 projectPath={projectPath}
 />
 )}
 {grouped.idle.length > 0 && (
 <SessionGroup
 label="Recent"
 count={grouped.idle.length}
 sessions={grouped.idle}
 selectedId={selectedId}
 onSelect={setSelectedId}
 projectPath={projectPath}
 />
 )}
 </>
 )}
 </div>

 {/* Footer */}
 <div className="px-2.5 py-1.5 border-t border-white/[0.06] flex items-center justify-between shrink-0">
 <span className="text-[10px] text-zinc-500">{filtered.length} sessions</span>
 <button
 onClick={loadSessions}
 className="text-[10px] text-zinc-400 hover:text-zinc-200 transition-colors"
 >
 Refresh
 </button>
 </div>
 </div>
 );
}

function SessionGroup({
 label,
 count,
 sessions,
 selectedId,
 onSelect,
 projectPath,
}: {
 label: string;
 count: number;
 sessions: SessionInfo[];
 selectedId: string | null;
 onSelect: (id: string) => void;
 projectPath: string | null;
}) {
 const [open, setOpen] = useState(count <= 3);

 return (
 <div className="space-y-0.5">
 <button
 onClick={() => setOpen(!open)}
 className="flex items-center gap-1.5 w-full py-1 text-[10px] font-semibold text-zinc-500 hover:text-zinc-300 transition-colors"
 >
 <ChevronRight
 size={10}
 className={`transition-transform ${open ? "rotate-90" : ""}`}
 />
 <span>{label}</span>
 <span className="text-zinc-600">{count}</span>
 </button>
 {open && (
 <div className="space-y-0.5 ml-1">
 {sessions.map((session) => (
 <SessionRow
 key={session.id}
 session={session}
 isSelected={selectedId === session.id}
 onSelect={() => onSelect(session.id)}
 projectPath={projectPath}
 />
 ))}
 </div>
 )}
 </div>
 );
}

function SessionRow({
 session,
 isSelected,
 onSelect,
 projectPath,
}: {
 session: SessionInfo;
 isSelected: boolean;
 onSelect: () => void;
 projectPath: string | null;
}) {
 const modeConfig = MODE_CONFIG[session.mode] || MODE_CONFIG.custom;

 return (
 <div
 onClick={onSelect}
 className={`group flex items-center gap-2 p-1.5 rounded-lg cursor-pointer transition-colors ${
 isSelected
 ? "bg-amber-400/10 border border-amber-400/20"
 : "hover:bg-white/[0.04] border border-transparent"
 }`}
 >
 <StatusDot status={session.status} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-1.5">
 <span className="text-[11px] text-zinc-200 truncate">{session.name}</span>
 <span className={`text-[9px] px-1 py-0.5 rounded ${modeConfig.color}`}>
 {modeConfig.label}
 </span>
 </div>
 <div className="flex items-center gap-2 mt-0.5">
 <span className="text-[10px] text-zinc-500">{session.agent}</span>
 <span className="text-[10px] text-zinc-600">·</span>
 <span className="text-[10px] text-zinc-600">{session.model}</span>
 </div>
 </div>
 <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
 {projectPath && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 window.open(`/workspace/${session.id}/chat`, "_blank");
 }}
 className="size-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
 title="Open chat"
 >
 <ExternalLink size={10} />
 </button>
 )}
 <button
 onClick={(e) => {
 e.stopPropagation();
 onSelect();
 }}
 className="size-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/[0.08]"
 title="Session details"
 >
 <MoreVertical size={10} />
 </button>
 </div>
 </div>
 );
}
