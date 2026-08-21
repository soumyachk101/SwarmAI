"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Brain,
  Search,
  Plus,
  RefreshCw,
  Database,
  Sparkles,
  Layers,
  FileCode,
  CheckCircle2,
  Trash2,
  Send,
  Zap,
  Activity,
} from "lucide-react";
import { TauriPheromone as Pheromone } from "../tauri/index.js";

export interface MemoryEntry {
  id: string;
  key: string;
  category: "architecture" | "decision" | "fact" | "rule" | "plan";
  content: string;
  sourceAgent: string;
  timestamp: number;
}

interface Props {
  projectPath: string | null;
  onClose?: () => void;
}

export default function PheromoneMemoryInspector({ projectPath, onClose }: Props) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [newKey, setNewKey] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newCategory, setNewCategory] = useState<MemoryEntry["category"]>("architecture");
  const [showInjectForm, setShowInjectForm] = useState(false);
  const [memories, setMemories] = useState<MemoryEntry[]>([
    {
      id: "mem-1",
      key: "arch.state_management",
      category: "architecture",
      content: "Use Zustand with localStorage persistence for flow nodes and workspace selection.",
      sourceAgent: "Claude Code (Lead)",
      timestamp: Date.now() - 1000 * 60 * 14,
    },
    {
      id: "mem-2",
      key: "rules.theme_palette",
      category: "rule",
      content: "Strictly adhere to Obsidian Charcoal (#060709) and Smokie Platinum with zero raw yellow buttons.",
      sourceAgent: "Lead Architect",
      timestamp: Date.now() - 1000 * 60 * 28,
    },
    {
      id: "mem-3",
      key: "task.parallel_sprint",
      category: "plan",
      content: "Claude Code owns backend memory bridge; Codex CLI implements visual worktree merge modal.",
      sourceAgent: "Pheromone Bridge",
      timestamp: Date.now() - 1000 * 60 * 45,
    },
    {
      id: "mem-4",
      key: "fact.wire_mesh",
      category: "fact",
      content: "Wires use double traveling photon pulses with cubic Bezier interpolation clamped to 180px delta.",
      sourceAgent: "OpenCode",
      timestamp: Date.now() - 1000 * 60 * 90,
    },
  ]);

  const handleInject = () => {
    if (!newKey.trim() || !newContent.trim()) return;
    const item: MemoryEntry = {
      id: `mem-${Date.now()}`,
      key: newKey.trim(),
      category: newCategory,
      content: newContent.trim(),
      sourceAgent: "Developer Injection",
      timestamp: Date.now(),
    };
    setMemories([item, ...memories]);
    setNewKey("");
    setNewContent("");
    setShowInjectForm(false);
  };

  const handleDelete = (id: string) => {
    setMemories(memories.filter((m) => m.id !== id));
  };

  const filteredMemories = memories.filter((m) => {
    const matchesCategory = activeCategory === "all" || m.category === activeCategory;
    const matchesQuery =
      !searchQuery.trim() ||
      m.key.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sourceAgent.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <div className="flex flex-col h-full bg-[#0c0d14]/98 backdrop-blur-2xl text-zinc-200 select-none font-sans">
      {/* Header */}
      <div className="flex h-11 shrink-0 items-center justify-between px-3 border-b border-white/[0.06] bg-black/20">
        <div className="flex items-center gap-2">
          <div className="flex size-6 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-xs">
            <Brain size={13} />
          </div>
          <span className="text-xs font-semibold text-white tracking-tight">
            Pheromone Shared Memory Map
          </span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-300">
            {memories.length} keys
          </span>
        </div>

        <button
          onClick={() => setShowInjectForm(!showInjectForm)}
          className="inline-flex items-center gap-1 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold px-2.5 py-1 text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
        >
          <Plus size={12} strokeWidth={2.5} />
          <span>Inject Fact</span>
        </button>
      </div>

      {/* Inject Memory Form */}
      {showInjectForm && (
        <div className="p-3 border-b border-white/[0.08] bg-black/40 flex flex-col gap-2 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-white">
            <span className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-slate-300" />
              <span>Broadcast New Fact to All Agents</span>
            </span>
            <button onClick={() => setShowInjectForm(false)} className="text-zinc-500 hover:text-zinc-300">
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder="Key (e.g. arch.auth_pattern)"
              className="flex-1 bg-black/50 border border-white/[0.12] rounded-lg px-2.5 py-1 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-mono"
            />
            <select
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value as any)}
              className="bg-black/60 border border-white/[0.12] rounded-lg px-2 py-1 text-xs text-zinc-200 focus:outline-none cursor-pointer"
            >
              <option value="architecture">Architecture</option>
              <option value="decision">Decision</option>
              <option value="fact">Fact</option>
              <option value="rule">Rule</option>
              <option value="plan">Plan</option>
            </select>
          </div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            placeholder="Fact or rule content shared across all agent contexts..."
            rows={2}
            className="w-full bg-black/50 border border-white/[0.12] rounded-lg p-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/40 font-sans"
          />
          <button
            onClick={handleInject}
            className="self-end inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-bold px-3 py-1 text-xs shadow-xs cursor-pointer"
          >
            <Send size={11} />
            <span>Inject Into Pheromone Memory</span>
          </button>
        </div>
      )}

      {/* Search & Category Filter */}
      <div className="p-2.5 border-b border-white/[0.06] flex flex-col gap-2">
        <div className="flex h-8 items-center gap-2 rounded-xl border border-white/[0.08] bg-black/40 px-2.5 focus-within:border-white/40">
          <Search size={13} className="text-zinc-500 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shared memory & semantic embeddings..."
            className="min-w-0 flex-1 bg-transparent text-xs text-zinc-200 outline-none placeholder-zinc-500"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hair">
          {["all", "architecture", "decision", "rule", "plan", "fact"].map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-2 py-0.5 rounded-md text-[10px] font-mono capitalize transition-all cursor-pointer ${
                activeCategory === cat
                  ? "bg-white/[0.16] text-white border border-white/[0.22] font-semibold"
                  : "text-zinc-400 hover:text-white hover:bg-white/[0.06]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Memory List */}
      <div className="flex-1 overflow-y-auto scrollbar-sleek p-2.5 flex flex-col gap-2">
        {filteredMemories.length === 0 ? (
          <div className="p-6 text-center text-zinc-500 text-xs border border-dashed border-white/[0.08] rounded-xl">
            No memories match your query
          </div>
        ) : (
          filteredMemories.map((mem) => (
            <div
              key={mem.id}
              className="p-2.5 rounded-xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.14] transition-all flex flex-col gap-1.5 group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-mono text-xs font-semibold text-emerald-300 truncate">
                    {mem.key}
                  </span>
                  <span className="px-1.5 py-0.2 rounded bg-white/[0.06] border border-white/[0.10] text-[9px] font-mono text-zinc-300 uppercase">
                    {mem.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-zinc-500 font-mono">{mem.sourceAgent}</span>
                  <button
                    onClick={() => handleDelete(mem.id)}
                    className="opacity-0 group-hover:opacity-100 text-zinc-500 hover:text-rose-400 transition-opacity p-0.5"
                    title="Remove from shared memory"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{mem.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
