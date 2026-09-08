"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Plus, MoreHorizontal, LoaderCircle } from "lucide-react";

type SessionInfo = {
 id: string;
 name: string;
 mode: string;
 agent: string;
 model: string;
 status: "running" | "idle" | "queued";
 lastActive: string;
};

type WorkspaceSessionDropdownProps = {
 workspaceId: string;
 workspaceName: string;
 projectPath: string | null;
 anchorRect: DOMRect;
 onClose: () => void;
 onSpawnSubagents?: (count: number) => void;
};

const MODE_LABEL: Record<string, string> = {
 unified: "Unified",
 realtime: "Realtime",
 haiku: "Haiku",
 sonnet: "Sonnet",
 opus: "Opus",
 codex: "Codex",
 claudecode: "CC",
 custom: "Custom",
};

function timeAgo(iso: string): string {
 const diff = Date.now() - new Date(iso).getTime();
 const mins = Math.floor(diff / 60000);
 if (mins < 1) return "just now";
 if (mins < 60) return `${mins}m ago`;
 const hrs = Math.floor(mins / 60);
 if (hrs < 24) return `${hrs}h ago`;
 const days = Math.floor(hrs / 24);
 return `${days}d ago`;
}

export default function WorkspaceSessionDropdown({
 workspaceId,
 workspaceName,
 anchorRect,
 onClose,
 onSpawnSubagents,
}: WorkspaceSessionDropdownProps) {
 const [sessions, setSessions] = useState<SessionInfo[]>([]);
 const [loading, setLoading] = useState(true);
 const [spawning, setSpawning] = useState(false);
 const [spawnCount, setSpawnCount] = useState(5);
 const [showSpawnMenu, setShowSpawnMenu] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 const loadSessions = useCallback(async () => {
 setLoading(true);
 try {
 const [tabRes, claudeRes] = await Promise.all([
 fetch(`/api/workspace/${workspaceId}/claude-tabs`).catch(() => null),
 fetch(`/api/workspace/${workspaceId}/sessions`).catch(() => null),
 ]);
 const tabSessions: SessionInfo[] = tabRes?.ok ? await tabRes.json() : [];
 const claudeSessions: SessionInfo[] = claudeRes?.ok ? await claudeRes.json() : [];
 setSessions([...tabSessions, ...claudeSessions]);
 } catch {
 setSessions([]);
 } finally {
 setLoading(false);
 }
 }, [workspaceId]);

 useEffect(() => {
 loadSessions();
 const interval = setInterval(loadSessions, 8000);
 return () => clearInterval(interval);
 }, [loadSessions]);

 useEffect(() => {
 const handleClick = (e: MouseEvent) => {
 if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
 onClose();
 }
 };
 const handleKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") onClose();
 };
 document.addEventListener("mousedown", handleClick);
 window.addEventListener("keydown", handleKey);
 return () => {
 document.removeEventListener("mousedown", handleClick);
 window.removeEventListener("keydown", handleKey);
 };
 }, [onClose]);

 const handleSpawn = async () => {
 setSpawning(true);
 setShowSpawnMenu(false);
 try {
 await onSpawnSubagents?.(spawnCount);
 } finally {
 setSpawning(false);
 }
 };

 const sorted = [...sessions].sort((a, b) =>
 new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
 );

 const top = Math.min(anchorRect.bottom + 4, window.innerHeight - 360);
 const left = Math.min(anchorRect.left, window.innerWidth - 340);

 return createPortal(
 <div className="fixed inset-0 z-[300]" onClick={onClose}>
 <div
 ref={dropdownRef}
 onClick={(e) => e.stopPropagation()}
 className="fixed z-[301] w-[340px] max-h-[400px] flex flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-[#11131a]/95 shadow-2xl shadow-black/60 backdrop-blur-xl"
 style={{ top, left }}
 >
 <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06] shrink-0">
 <div className="flex items-center gap-2 min-w-0 flex-1">
 <span className="text-[11px] font-semibold text-zinc-200 truncate">{workspaceName}</span>
 <span className="text-[9px] text-zinc-600 font-mono">{sessions.length}</span>
 </div>
 <div className="flex items-center gap-0.5 shrink-0">
 <button
 onClick={() => setShowSpawnMenu(!showSpawnMenu)}
 className="size-5 flex items-center justify-center rounded text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
 title="Spawn agents"
 >
 <Plus size={11} />
 </button>
 <button
 onClick={onClose}
 className="size-5 flex items-center justify-center rounded text-zinc-500 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
 >
 <MoreHorizontal size={11} />
 </button>
 </div>
 </div>

 {showSpawnMenu && (
 <div className="px-2.5 py-2 border-b border-white/[0.05] shrink-0">
 <div className="flex items-center gap-2">
 <div className="flex-1">
 <div className="text-[10px] font-semibold text-zinc-300 uppercase tracking-wider">Spawn Swarm</div>
 <div className="text-[9px] text-zinc-500 mt-0.5">Launch agents for this workspace</div>
 </div>
 <div className="flex items-center gap-1">
 {[3, 5, 8].map((n) => (
 <button
 key={n}
 onClick={() => { setSpawnCount(n); handleSpawn(); }}
 disabled={spawning}
 className={`size-6 rounded-md text-[10px] font-mono font-bold transition-all cursor-pointer ${
 spawnCount === n
 ? "bg-amber-400/20 text-amber-300 border border-amber-400/40"
 : "text-zinc-400 hover:text-zinc-200 border border-transparent hover:bg-white/[0.04]"
 }`}
 >
 {n}
 </button>
 ))}
 <button
 onClick={handleSpawn}
 disabled={spawning}
 className="h-6 px-2 rounded-md bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-semibold hover:bg-amber-500/25 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
 >
 {spawning ? <LoaderCircle size={9} className="animate-spin" /> : <span>Go</span>}
 </button>
 </div>
 </div>
 </div>
 )}

 <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-sleek min-h-0">
 {loading ? (
 <div className="flex items-center justify-center py-8">
 <LoaderCircle className="size-4 animate-spin text-zinc-500" />
 </div>
 ) : sorted.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
 <p className="text-[11px] text-zinc-500">No sessions yet</p>
 <p className="text-[10px] text-zinc-600 mt-1">Spawn agents above to start</p>
 </div>
 ) : (
 <div className="py-1">
 {sorted.map((s) => (
 <div
 key={s.id}
 className="group flex items-start gap-2 px-3 py-1.5 hover:bg-white/[0.03] transition-colors cursor-pointer"
 title={`${s.name} · ${s.model}`}
 >
 <span className="mt-1 size-1 rounded-full bg-zinc-500 shrink-0 group-hover:bg-amber-400 transition-colors" />
 <div className="flex-1 min-w-0">
 <div className="text-[11px] text-zinc-300 truncate leading-tight">{s.name}</div>
 <div className="flex items-center gap-1.5 mt-0.5">
 <span className="text-[9px] text-zinc-600 truncate">{s.agent}</span>
 <span className="text-[8px] text-zinc-700">·</span>
 <span className="text-[9px] text-zinc-600 truncate">{s.model}</span>
 <span className="text-[8px] text-zinc-700 ml-auto shrink-0">{timeAgo(s.lastActive)}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 </div>,
 document.body
 );
}
