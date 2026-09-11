"use client";

import { useMemo } from "react";
import {
 HelpCircle
} from "lucide-react";
import { PaletteCommand } from "@/shared/CommandPalette";
import Modal from "@/shared/Modal";

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
 <Modal open size="lg" onClose={onClose} title="Keyboard Shortcuts" staggerDelay={30}>
 <div className="space-y-5">
 {SHORTCUTS.map((group) => (
 <div key={group.group}>
 <h3 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-2 font-mono">{group.group}</h3>
 <div className="space-y-1">
 {group.items.map((item, i) => (
 <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-zinc-800/30 transition-colors">
 <span className="text-xs text-zinc-300 font-sans">{item.action}</span>
 <div className="flex items-center gap-1">
 {item.keys.map((k, ki) => (
 <span key={ki} className="flex items-center gap-1">
 <kbd className="font-mono text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 rounded shadow-sm">{k}</kbd>
 {ki < item.keys.length - 1 && <span className="text-[10px] text-zinc-600 mx-0.5">then</span>}
 </span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </Modal>
 );
}
