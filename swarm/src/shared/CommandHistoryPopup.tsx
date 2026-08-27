"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { Clock, Search, Trash2, X, Command } from "lucide-react";
import { useCommandHistory, type HistoryEntry } from "./useCommandHistory";

export default function CommandHistory({
 onSelect,
 onClose,
}: {
 onSelect: (command: string) => void;
 onClose: () => void;
}) {
 const { recent, clear } = useCommandHistory();
 const [filter, setFilter] = useState("");
 const inputRef = useRef<HTMLInputElement>(null);
 const listRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 inputRef.current?.focus();
 }, []);

 const filtered = useMemo(() => {
 if (!filter.trim()) return recent;
 const q = filter.toLowerCase();
 return recent.filter((e) => e.command.toLowerCase().includes(q));
 }, [recent, filter]);

 useEffect(() => {
 const handleKey = (e: KeyboardEvent) => {
 if (e.key === "Escape") { e.preventDefault(); onClose(); }
 };
 window.addEventListener("keydown", handleKey, { capture: true });
 return () => window.removeEventListener("keydown", handleKey, { capture: true });
 }, [onClose]);

 const formatTime = (ts: number) => {
 const diff = Date.now() - ts;
 if (diff < 60000) return "just now";
 if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
 if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
 return new Date(ts).toLocaleDateString();
 };

 return (
 <div
 className="fixed inset-0 z-[700] flex items-start justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
 onClick={onClose}
 >
 <div
 className="w-full max-w-lg mx-4 mt-[15vh] rounded-2xl border border-zinc-700/60 bg-[#0d0f14]/98 shadow-2xl backdrop-blur-2xl overflow-hidden animate-in zoom-in-95 duration-200"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Input */}
 <div className="flex items-center gap-2 px-3 py-2.5 border-b border-zinc-800/60">
 <Clock size={15} className="text-zinc-500 shrink-0" />
 <input
 ref={inputRef}
 type="text"
 value={filter}
 onChange={(e) => setFilter(e.target.value)}
 placeholder="Filter command history..."
 className="flex-1 bg-transparent text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none font-mono"
 />
 <div className="flex items-center gap-1">
 <button
 onClick={clear}
 className="text-zinc-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-zinc-800/50"
 title="Clear all history"
 disabled={recent.length === 0}
 >
 <Trash2 size={13} />
 </button>
 <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800/50 transition-colors">
 <X size={13} />
 </button>
 </div>
 </div>

 {/* List */}
 <div ref={listRef} className="max-h-[300px] overflow-y-auto p-1.5 scrollbar-sleek">
 {filtered.length === 0 ? (
 <div className="p-6 text-center text-xs text-zinc-500">
 {recent.length === 0 ? "No commands in history yet. Start typing!" : "No matching commands."}
 </div>
 ) : (
 <div className="space-y-0.5">
 {filtered.map((entry) => (
 <HistoryRow key={entry.id} entry={entry} onSelect={onSelect} formatTime={formatTime} />
 ))}
 </div>
 )}
 </div>

 {/* Footer */}
 <div className="px-3 py-2 border-t border-zinc-800/60 flex items-center justify-between">
 <span className="text-[10px] text-zinc-500 font-mono">{recent.length} commands</span>
 <div className="flex items-center gap-1 text-zinc-500">
 <kbd className="font-mono text-[10px] bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-300">↑↓</kbd>
 <span className="text-[10px]">navigate</span>
 <kbd className="font-mono text-[10px] bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-300 ml-2">↵</kbd>
 <span className="text-[10px]">re-run</span>
 <kbd className="font-mono text-[10px] bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700 text-zinc-300 ml-2">ESC</kbd>
 <span className="text-[10px]">close</span>
 </div>
 </div>
 </div>
 </div>
 );
}

function HistoryRow({
 entry,
 onSelect,
 formatTime,
}: {
 entry: HistoryEntry;
 onSelect: (c: string) => void;
 formatTime: (ts: number) => string;
}) {
 const [hovered, setHovered] = useState(false);

 return (
 <button
 onMouseEnter={() => setHovered(true)}
 onMouseLeave={() => setHovered(false)}
 onClick={() => onSelect(entry.command)}
 className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
 hovered ? "bg-zinc-800/60 border border-zinc-700/50" : "border border-transparent"
 }`}
 >
 <Clock size={12} className="text-zinc-600 shrink-0" />
 <div className="flex-1 min-w-0">
 <span className="text-[11px] font-mono text-zinc-300 truncate block">{entry.command}</span>
 <span className="text-[10px] text-zinc-600">{formatTime(entry.timestamp)}</span>
 </div>
 {entry.count > 1 && (
 <span className="text-[10px] font-mono text-zinc-500 bg-zinc-800/60 px-1.5 py-0.5 rounded border border-zinc-700/50 shrink-0">
 {entry.count}×
 </span>
 )}
 </button>
 );
}
