"use client";

import React, { useMemo } from "react";
import {
 Search, Command, Terminal, Bot, Zap, Settings, FolderOpen, Mic,
 PanelLeft, PanelRight, Columns3, Sparkles, Activity, Layers,
 HelpCircle, FileCode2, DollarSign, GitPullRequest, CheckCircle2,
 ShieldCheck, Trash2, Download, Blocks, LayoutGrid, ClipboardList
} from "lucide-react";
import { PaletteCommand } from "@/shared/CommandPalette";

const SHORTCUTS = [
 {
 group: "Navigation & Panels",
 items: [
 { keys: ["Cmd", "K"], action: "Command Palette" },
 { keys: ["Cmd", "B"], action: "Toggle Sidebar" },
 { keys: ["Ctrl", "B"], action: "Toggle Right Panel" },
 { keys: ["Cmd", "O"], action: "Open Project Folder" },
 { keys: ["Cmd", ","], action: "Open Settings" },
 { keys: ["Cmd", "G"], action: "Open Git Hub" },
 ],
 },
 {
 group: "Agent Controls",
 items: [
 { keys: ["+", "Claude"], action: "Spawn Claude Code agent" },
 { keys: ["+", "OpenCode"], action: "Spawn OpenCode agent" },
 { keys: ["+", "Codex"], action: "Spawn Codex CLI agent" },
 { keys: ["+", "Terminal"], action: "Spawn Shell terminal" },
 { keys: ["Win", "Alt"], action: "Voice Dictation" },
 { keys: ["Ctrl", "Win"], action: "Voice Dictation (alt)" },
 ],
 },
 {
 group: "CLI Slash Commands",
 items: [
 { keys: ["/", "help"], action: "Show all CLI commands" },
 { keys: ["/", "compact"], action: "Compact conversation context" },
 { keys: ["/", "cost"], action: "Show token usage & cost" },
 { keys: ["/", "review"], action: "Review uncommitted changes" },
 { keys: ["/", "init"], action: "Initialize CLAUDE.md" },
 { keys: ["/", "pr"], action: "Create GitHub PR" },
 { keys: ["/", "bug"], action: "Deep bug scan" },
 { keys: ["/", "doctor"], action: "Run diagnostics" },
 { keys: ["/", "clear"], action: "Clear terminal screen" },
 { keys: ["/", "dashboard"], action: "Open Swarm Dashboard" },
 { keys: ["/", "tasks"], action: "Toggle Kanban board" },
 { keys: ["/", "lead"], action: "Toggle Lead dock" },
 { keys: ["/", "voice"], action: "Toggle Voice Dictation" },
 ],
 },
 {
 group: "Grid Layouts",
 items: [
 { keys: ["/", "layout", "auto"], action: "Smart responsive grid" },
 { keys: ["/", "layout", "2x2"], action: "4 equal quadrants" },
 { keys: ["/", "layout", "cols2"], action: "Side-by-side split" },
 { keys: ["/", "layout", "master"], action: "Focus + stack layout" },
 ],
 },
];

export default function ShortcutsModal({ onClose }: { onClose: () => void }) {
 return (
 <div className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-150"
 onClick={onClose}>
 <div
 className="w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150"
 onClick={(e) => e.stopPropagation()}
 >
 <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 sticky top-0 bg-zinc-950/95 z-10 backdrop-blur-xl">
 <div className="flex items-center gap-2">
 <HelpCircle size={18} className="text-amber-400" />
 <h2 className="text-sm font-semibold text-zinc-100 font-mono">Keyboard Shortcuts</h2>
 </div>
 <button onClick={onClose} className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800/50">✕</button>
 </div>
 <div className="p-4 space-y-5">
 {SHORTCUTS.map((group) => (
 <div key={group.group}>
 <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">{group.group}</h3>
 <div className="space-y-1">
 {group.items.map((item, i) => (
 <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
 <span className="text-xs text-zinc-300 font-sans">{item.action}</span>
 <div className="flex items-center gap-1">
 {item.keys.map((k, ki) => (
 <React.Fragment key={ki}>
 <kbd className="font-mono text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm">{k}</kbd>
 {ki < item.keys.length - 1 && <span className="text-[10px] text-zinc-600 mx-0.5">then</span>}
 </React.Fragment>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
