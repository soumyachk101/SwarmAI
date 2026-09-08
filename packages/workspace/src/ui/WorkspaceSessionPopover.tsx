"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import {
 Bot,
 LoaderCircle,
 MessageSquare,
 GitBranch,
 Clock,
 ArchiveRestore,
 RefreshCw,
 Search,
 X,
 ArrowRight,
} from "lucide-react";
import { TauriPheromone, type PheromoneSessionEntry } from "@swarm/pheromone/tauri";

interface Props {
 projectPath: string | null;
 workspaceId: string;
 workspaceName: string;
 /** Measured rect of the trigger card; the popover anchors to this. */
 anchorRect: DOMRect;
 onClose: () => void;
 /** Open the full session history view for the active project. */
 onOpenFullHistory?: () => void;
 /** Click on a session row — for now just surfaces a console hint. The chat
 * routing doesn't exist yet, but the parent can wire it up later. */
 onSelectSession?: (session: PheromoneSessionEntry) => void;
}

function relativeTime(ts: number | null): string {
 if (!ts) return "";
 const now = Date.now();
 const diff = now - ts;
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return "just now";
 if (mins < 60) return `${mins}m ago`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs}h ago`;
 const days = Math.floor(hrs / 24);
 if (days < 7) return `${days}d ago`;
 const weeks = Math.floor(days / 7);
 return `${weeks}w ago`;
}

const AGENT_ICON: Record<string, string> = {
 "claude-code": "CC",
  "codex-cli": "CX",
 aider: "AD",
 "antigravity-cli": "AG",
 opencode: "OC",
 "": "KC",
 cline: "CL",
 cursor: "CU",
 kiro: "KR",
 kilo: "KL",
};

const AGENT_COLORS: Record<string, string> = {
 "claude-code": "text-purple-400 border-purple-400/30 bg-purple-400/10",
 "codex-cli": "text-blue-400 border-blue-400/30 bg-blue-400/10",
 aider: "text-green-400 border-green-400/30 bg-green-400/10",
 "antigravity-cli": "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
 opencode: "text-orange-400 border-orange-400/30 bg-orange-400/10",
 "": "text-pink-400 border-pink-400/30 bg-pink-400/10",
 cline: "text-yellow-400 border-yellow-400/30 bg-yellow-400/10",
 cursor: "text-teal-400 border-teal-400/30 bg-teal-400/10",
 kiro: "text-rose-400 border-rose-400/30 bg-rose-400/10",
 kilo: "text-indigo-400 border-indigo-400/30 bg-indigo-400/10",
};

export default function WorkspaceSessionPopover({
 projectPath,
 workspaceId,
 workspaceName,
 anchorRect,
 onClose,
 onOpenFullHistory,
 onSelectSession,
}: Props) {
 const [sessions, setSessions] = useState<PheromoneSessionEntry[]>([]);
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [searchQuery, setSearchQuery] = useState("");
 const fetchIdRef = useRef(0);

 const fetchSessions = useCallback(async () => {
 if (!projectPath) return;
 setLoading(true);
 setError(null);
 const fetchId = ++fetchIdRef.current;
 try {
 const pheromone = new TauriPheromone(projectPath);
 // scope='all' + workspaceId filter = every session for this workspace
 const result = await pheromone.listSessions("all", undefined, undefined, workspaceId);
 if (fetchId !== fetchIdRef.current) return;
 setSessions(result.sessions ?? []);
 } catch (e: any) {
 if (fetchId !== fetchIdRef.current) return;
 setError(String(e?.message ?? e));
 setSessions([]);
 } finally {
 if (fetchId === fetchIdRef.current) setLoading(false);
 }
 }, [projectPath, workspaceId]);

 useEffect(() => {
 fetchSessions();
 }, [fetchSessions]);

 // Escape closes; click outside handled by the backdrop.
 useEffect(() => {
 const onKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 };
 window.addEventListener("keydown", onKey);
 return () => window.removeEventListener("keydown", onKey);
 }, [onClose]);

 // Anchor to the right side of the card so it doesn't overlap the workspace
 // list. Flip above the card if there isn't 360px of room below.
 const POPOVER_WIDTH = 340;
 const POPOVER_MAX_HEIGHT = 420;
 const rect = anchorRect;
 const wantAbove = window.innerHeight - rect.bottom < 360 && rect.top > 360;
 const left = Math.max(8, Math.min(rect.right + 8, window.innerWidth - POPOVER_WIDTH - 8));
 const top = wantAbove
 ? Math.max(8, rect.top - POPOVER_MAX_HEIGHT - 8)
 : Math.max(8, rect.top);

 const filtered = useMemo(() => {
 if (!searchQuery.trim()) return sessions;
 const q = searchQuery.toLowerCase();
 return sessions.filter(
 (s) =>
 (s.title ?? "").toLowerCase().includes(q) ||
 (s.preview ?? "").toLowerCase().includes(q) ||
 (s.agent_type ?? "").toLowerCase().includes(q),
 );
 }, [sessions, searchQuery]);

 const groups = useMemo(() => {
 const map = new Map<string, PheromoneSessionEntry[]>();
 for (const s of filtered) {
 const key = s.agent_type || "unknown";
 const existing = map.get(key) || [];
 existing.push(s);
 map.set(key, existing);
 }
 return Array.from(map.entries()).sort((a, b) => b[1].length - a[1].length);
 }, [filtered]);

 return createPortal(
 <>
 <div className="fixed inset-0 z-[250]" onClick={onClose} onContextMenu={(e) => { e.preventDefault(); onClose(); }} />
 <div
 role="dialog"
 aria-label={`Session history for ${workspaceName}`}
 className="fixed z-[251] flex flex-col rounded-xl border border-white/[0.10] bg-[#0d0f17]/98 backdrop-blur-2xl shadow-[0_24px_64px_rgba(0,0,0,0.6)] overflow-hidden"
 style={{
 left,
 top,
 width: POPOVER_WIDTH,
 maxHeight: POPOVER_MAX_HEIGHT,
  }}
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="shrink-0 px-3 py-2.5 border-b border-white/[0.08] bg-gradient-to-b from-white/[0.03] to-transparent">
 <div className="flex items-center gap-2">
 <div className="size-6 rounded-md flex items-center justify-center bg-amber-400/15 border border-amber-400/30 text-amber-300 shrink-0">
 <Bot className="size-3.5" />
 </div>
 <div className="min-w-0 flex-1">
 <div className="text-[12px] font-semibold text-white truncate">
 Chat history
 </div>
 <div className="text-[10px] text-zinc-500 truncate">
 {workspaceName} · {loading ? "Loading…" : `${sessions.length} session${sessions.length !== 1 ? "s" : ""}`}
 </div>
 </div>
 <button
 onClick={fetchSessions}
 disabled={loading}
 className="size-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors disabled:opacity-50"
 title="Refresh"
 >
 <RefreshCw className={`size-3 ${loading ? "animate-spin" : ""}`} />
 </button>
 <button
 onClick={onClose}
 className="size-6 rounded-md flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors"
 title="Close (Esc)"
 >
 <X className="size-3" />
  </button>
 </div>

 {/* Search */}
 <div className="mt-2 flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.08] bg-black/40 px-2 focus-within:border-amber-400/40 focus-within:ring-1 focus-within:ring-amber-400/15">
 <Search className="size-3 shrink-0 text-zinc-500" />
 <input
 value={searchQuery}
 onChange={(e) => setSearchQuery(e.target.value)}
 placeholder="Search sessions…"
 className="min-w-0 flex-1 bg-transparent text-[11px] text-zinc-100 outline-none placeholder:text-zinc-600"
 spellCheck={false}
 />
 {searchQuery && (
  <button onClick={() => setSearchQuery("")} className="text-zinc-500 hover:text-zinc-300">
 <X className="size-3" />
 </button>
 )}
 </div>
 </div>

 {/* Body */}
 <div className="flex-1 overflow-y-auto scrollbar-sleek">
 {!projectPath ? (
 <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center text-zinc-500">
 <ArchiveRestore className="mb-2 size-5 opacity-60" />
 <p className="text-[11px] font-medium">No project bound</p>
 <p className="text-[10px] mt-1 text-zinc-600">
 Bind this workspace to a folder to see chat history.
 </p>
 </div>
 ) : loading && sessions.length === 0 ? (
 <div className="px-3 py-3 space-y-2">
 {Array.from({ length: 4 }, (_, i) => (
 <div key={i} className="flex items-start gap-2 px-1">
 <div className="mt-1 size-4 rounded-md bg-white/[0.04]" />
 <div className="min-w-0 flex-1 space-y-1.5">
 <div className="h-2.5 w-4/5 rounded-sm bg-white/[0.05]" />
 <div className="h-2 w-3/5 rounded-sm bg-white/[0.03]" />
 <div className="h-1.5 w-1/2 rounded-sm bg-white/[0.03]" />
 </div>
 </div>
 ))}
 </div>
 ) : error ? (
 <div className="px-3 py-2 text-[10px] text-red-400 break-words font-mono">{error}</div>
 ) : groups.length === 0 ? (
 <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center text-zinc-500">
 <ArchiveRestore className="mb-2 size-5 opacity-60" />
 <p className="text-[11px] font-medium">
 {searchQuery ? "No matches" : "No agent sessions yet"}
 </p>
 <p className="text-[10px] mt-1 text-zinc-600">
 {searchQuery
 ? "Try a different search term."
 : "Sessions appear here once an agent runs in this workspace."}
 </p>
 </div>
 ) : (
 <div className="py-1">
 {groups.map(([agentKey, agentSessions]) => (
 <div key={agentKey} className="border-b border-white/[0.04] last:border-b-0">
 {/* Group header */}
 <div className="flex items-center gap-1.5 px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-zinc-500">
 <span className={`inline-flex items-center justify-center size-4 rounded font-mono font-bold text-[9px] border ${AGENT_COLORS[agentKey] || "text-amber-300 border-amber-400/30 bg-amber-400/10"}`}>
 {AGENT_ICON[agentKey] || agentKey.slice(0, 2).toUpperCase()}
  </span>
 <span className="min-w-0 flex-1 truncate">{agentKey}</span>
 <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] tabular-nums font-mono text-zinc-500">
 {agentSessions.length}
 </span>
 </div>

 {/* Session rows */}
 {agentSessions.map((session) => (
 <button
 key={session.id}
 onClick={() => onSelectSession?.(session)}
 className="group/session flex w-full flex-col items-start gap-1 px-3 py-2 text-left hover:bg-white/[0.04] transition-colors border-b border-white/[0.03] last:border-b-0"
 >
 <div className="flex items-start gap-2 min-w-0 w-full">
  <div className="min-w-0 flex-1">
 <div className="text-[11.5px] font-medium text-zinc-100 truncate leading-tight">
 {session.title || `Session ${session.id.slice(0, 6)}`}
 </div>
  {session.preview && (
 <div className="text-[10px] leading-snug text-zinc-500 mt-0.5 line-clamp-2">
 {session.preview}
  </div>
 )}
 </div>
 <ArrowRight className="size-3 mt-1 shrink-0 text-zinc-600 opacity-0 group-hover/session:opacity-100 group-hover/session:text-amber-300 transition-all" />
 </div>
 <div className="flex items-center gap-2 flex-wrap">
 {session.message_count != null && session.message_count > 0 && (
 <span className="inline-flex items-center gap-0.5 text-[9px] text-zinc-500">
 <MessageSquare className="size-2.5" />
 {session.message_count}
 </span>
 )}
 {session.branch && (
 <span className="inline-flex items-center gap-0.5 text-[9px] text-zinc-500 bg-white/[0.04] px-1.5 py-0.5 rounded font-mono max-w-[100px]">
 <GitBranch className="size-2.5 shrink-0" />
 <span className="truncate">{session.branch}</span>
 </span>
 )}
 {session.timestamp && (
 <span className="inline-flex items-center gap-0.5 text-[9px] text-zinc-500 ml-auto">
 <Clock className="size-2.5" />
 {relativeTime(session.timestamp)}
 </span>
 )}
 </div>
 </button>
 ))}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Footer */}
 {onOpenFullHistory && sessions.length > 0 && (
 <div className="shrink-0 border-t border-white/[0.08] px-2 py-1.5 bg-black/30">
 <button
 onClick={onOpenFullHistory}
 className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-[11px] text-zinc-300 hover:bg-white/[0.06] hover:text-white transition-colors"
 >
 <span className="flex items-center gap-1.5">
 <ArchiveRestore className="size-3 text-amber-300" />
 View full history
 </span>
 <ArrowRight className="size-3" />
 </button>
 </div>
 )}
 </div>
 </>,
 document.body,
 );
}
