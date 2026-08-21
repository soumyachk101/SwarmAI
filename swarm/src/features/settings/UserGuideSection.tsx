"use client";

import { useState } from "react";
import {
  BookOpen,
  Zap,
  Cpu,
  Network,
  GitBranch,
  Command,
  Radio,
  GitFork,
  CheckCircle2,
  Terminal,
  Layers,
  Sparkles,
} from "lucide-react";

export default function UserGuideSection() {
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "lead" | "flow" | "worktrees" | "clis" | "shortcuts"
  >("overview");

  return (
    <div className="flex flex-col h-full overflow-hidden text-xs text-swarm-textDim">
      {/* Sub Header & Sub Tabs */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-swarm-border/40 shrink-0">
        <div>
          <h3 className="text-sm font-bold text-swarm-text flex items-center gap-2">
            <BookOpen size={15} className="text-swarm-gold" />
            <span>Swarm AI Operational User Manual</span>
          </h3>
          <p className="text-[11px] text-swarm-textMuted mt-0.5">
            Complete guide on multi-agent parallel orchestration, spatial canvas wiring, and git concurrency.
          </p>
        </div>

        {/* Sub-nav Pills */}
        <div className="flex items-center rounded-lg bg-swarm-canvas/60 p-0.5 border border-swarm-border/80">
          {[
            { id: "overview", label: "Quickstart" },
            { id: "lead", label: "Lead Steward" },
            { id: "flow", label: "Flow Canvas" },
            { id: "worktrees", label: "Git Worktrees" },
            { id: "clis", label: "Coding CLIs" },
            { id: "shortcuts", label: "Keymap" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer ${
                activeSubTab === tab.id
                  ? "bg-swarm-gold text-swarm-canvas font-bold shadow-xs"
                  : "text-swarm-textDim hover:text-swarm-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto scrollbar-sleek pr-2 flex flex-col gap-4">
        {/* 1. Quickstart Overview */}
        {activeSubTab === "overview" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <div className="p-3.5 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
              <span className="font-bold text-swarm-text text-xs flex items-center gap-2">
                <Zap size={14} className="text-swarm-gold" />
                <span>3-Step Quick Launch Workflow</span>
              </span>
              <div className="grid grid-cols-3 gap-2.5 mt-1">
                <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 flex flex-col gap-1">
                  <span className="font-mono text-[10px] font-bold text-swarm-gold">STEP 01</span>
                  <span className="font-semibold text-swarm-text">Bind Project Hive</span>
                  <span className="text-[11px] text-swarm-textMuted">Click top-left logo menu or <code>⌘O</code> to open your workspace repository.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 flex flex-col gap-1">
                  <span className="font-mono text-[10px] font-bold text-swarm-gold">STEP 02</span>
                  <span className="font-semibold text-swarm-text">Spawn Worker Agents</span>
                  <span className="text-[11px] text-swarm-textMuted">Click <strong>+ Agent</strong> in the Top Tab Strip to launch Claude Code, Codex, or OpenCode.</span>
                </div>
                <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40 flex flex-col gap-1">
                  <span className="font-mono text-[10px] font-bold text-swarm-gold">STEP 03</span>
                  <span className="font-semibold text-swarm-text">Parallel Dispatch</span>
                  <span className="text-[11px] text-swarm-textMuted">Enter your mission in the Lead panel or Flow Hub and execute concurrently.</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <h4 className="font-bold text-swarm-text">How Swarm AI Coordinates Autonomous Agents</h4>
              <p>
                Unlike traditional chatbots that require you to copy-paste prompts sequentially, Swarm AI acts as an autonomous operating system for AI software engineers. Multiple agents run simultaneously in isolated Git worktrees, synchronized by a shared local Pheromone vector memory.
              </p>
            </div>
          </div>
        )}

        {/* 2. Lead Steward */}
        {activeSubTab === "lead" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h4 className="font-bold text-swarm-text flex items-center gap-2">
              <Cpu size={14} className="text-swarm-gold" />
              <span>Lead Steward Autonomous Decomposition</span>
            </h4>
            <p>
              The Lead Steward is your high-level AI architect. Instead of editing application code directly in your main working branch, it decomposes your directives into isolated sub-problems and manages worker lifecycles.
            </p>

            <div className="p-3 rounded-xl bg-swarm-surfaceHi/30 border border-swarm-borderHi/20 flex flex-col gap-2">
              <span className="font-bold text-swarm-text text-[11px]">Recommended Prompt Structure for Lead Steward:</span>
              <div className="p-2.5 rounded-lg bg-swarm-canvas/80 border border-swarm-border/60 font-mono text-[11px] text-swarm-text">
                "Build user authentication with email magic-links and session tokens. Decompose into backend REST routes in /api/auth, React login modal in /src/components/auth, and end-to-end integration tests."
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-swarm-canvas/50 border border-swarm-border/40">
                <span className="font-bold text-swarm-text block mb-1">File Lock Governance</span>
                <p className="text-[11px] text-swarm-textMuted">
                  The Lead assigns explicit write-paths (e.g. <code>src/auth/**</code>) to prevent multiple agents from modifying the same files concurrently.
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-swarm-canvas/50 border border-swarm-border/40">
                <span className="font-bold text-swarm-text block mb-1">Pheromone Memory Broadcast</span>
                <p className="text-[11px] text-swarm-textMuted">
                  Whenever an agent declares an API interface, the Lead tags it and indexes it into the local SQLite vector database for instant retrieval.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 3. Flow Canvas */}
        {activeSubTab === "flow" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h4 className="font-bold text-swarm-text flex items-center gap-2">
              <Network size={14} className="text-swarm-gold" />
              <span>Infinite Flow Canvas & Wire Sockets</span>
            </h4>
            <p>
              The Flow Canvas is an interactive 2D visual plane for orchestrating multi-model pipelines. Drag between sockets to create data wires connecting inputs and outputs.
            </p>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-1">
                <span className="font-bold text-swarm-text flex items-center gap-1.5">
                  <Radio size={13} className="text-swarm-gold" />
                  <span>Broadcast All Mode</span>
                </span>
                <span className="text-[11px] text-swarm-textMuted">
                  Sends your prompt atomically to every active agent simultaneously. Ideal for parallel brainstorming, architecture reviews, and multi-file generation.
                </span>
              </div>

              <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-1">
                <span className="font-bold text-swarm-text flex items-center gap-1.5">
                  <GitFork size={13} className="text-swarm-gold" />
                  <span>Wire Pipeline Mode</span>
                </span>
                <span className="text-[11px] text-swarm-textMuted">
                  Follows drawn wire synapse paths: output from Node A flows into Node B with real-time token pulse indicators and single-click disconnections.
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40">
              <span className="font-bold text-swarm-text block mb-1">Canvas Navigation Shortcuts:</span>
              <span className="text-[11px] text-swarm-textMuted">
                • <code>Space + Drag</code> to pan the canvas • <code>⌘+ / ⌘-</code> to zoom in/out • <code>⌘0</code> to reset camera to 100%.
              </span>
            </div>
          </div>
        )}

        {/* 4. Git Worktrees */}
        {activeSubTab === "worktrees" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h4 className="font-bold text-swarm-text flex items-center gap-2">
              <GitBranch size={14} className="text-swarm-gold" />
              <span>Git Worktree Isolation & 3-Way Merge</span>
            </h4>
            <p>
              Swarm AI uses ephemeral Git worktrees located in <code>.swarm/worktrees/&lt;task-id&gt;</code> to isolate disk changes across parallel agents.
            </p>

            <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/30 flex flex-col gap-2">
              <span className="font-bold text-swarm-text text-[11px]">Deterministic Merge Lifecycle:</span>
              <ol className="list-decimal list-inside flex flex-col gap-1 pl-1 text-[11px]">
                <li><strong>Worktree Creation:</strong> Swarm creates <code>swarm/task-X</code> branched from <code>main</code>.</li>
                <li><strong>Isolated Generation:</strong> Agent edits files in dedicated disk path with zero risk of overwrite collisions.</li>
                <li><strong>3-Way Dry-Run:</strong> <code>git merge-tree</code> validates in-memory AST compatibility.</li>
                <li><strong>Fast-Forward Merge:</strong> Cleanly merged into <code>main</code> with zero merge conflict commits.</li>
                <li><strong>Ephemeral Cleanup:</strong> Worktree directory unmounted and pruned automatically.</li>
              </ol>
            </div>
          </div>
        )}

        {/* 5. Supported CLIs */}
        {activeSubTab === "clis" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h4 className="font-bold text-swarm-text flex items-center gap-2">
              <Terminal size={14} className="text-swarm-gold" />
              <span>Supported Coding CLIs & Arguments</span>
            </h4>

            <div className="flex flex-col gap-2">
              <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40">
                <span className="font-bold text-swarm-text">Anthropic Claude Code</span>
                <p className="text-[11px] text-swarm-textMuted mt-0.5">
                  Full 1M Opus context support. Normalizes <code>/effort low</code>, <code>medium</code>, <code>high</code>, and <code>ultracode</code> arguments automatically.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40">
                <span className="font-bold text-swarm-text">OpenAI Codex CLI</span>
                <p className="text-[11px] text-swarm-textMuted mt-0.5">
                  Sol 5.6 and Terra 5.5 models with configurable reasoning tokens and automated YOLO permissions mode.
                </p>
              </div>

              <div className="p-2.5 rounded-lg bg-swarm-canvas/60 border border-swarm-border/40">
                <span className="font-bold text-swarm-text">OpenCode & Local Inference</span>
                <p className="text-[11px] text-swarm-textMuted mt-0.5">
                  Connects to local Ollama / vLLM servers running DeepSeek R1 671B, Qwen 2.5 Coder, and LLaMA 3.3 for 100% air-gapped coding.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 6. Shortcuts Keymap */}
        {activeSubTab === "shortcuts" && (
          <div className="flex flex-col gap-3 animate-fade-in">
            <h4 className="font-bold text-swarm-text flex items-center gap-2">
              <Command size={14} className="text-swarm-gold" />
              <span>Keyboard Velocity Shortcuts Map</span>
            </h4>

            <div className="border border-swarm-border/60 rounded-xl overflow-hidden">
              <table className="w-full text-left font-mono text-[11px]">
                <thead className="bg-swarm-surfaceHi/80 border-b border-swarm-border/40 text-swarm-text">
                  <tr>
                    <th className="p-2">Shortcut</th>
                    <th className="p-2">Action Description</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-swarm-border/30">
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">⌘K / Ctrl+K</td>
                    <td className="p-2 text-swarm-textDim">Open Unified Swarm Command Palette</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">⌘Enter</td>
                    <td className="p-2 text-swarm-textDim">Dispatch Parallel Mission to Swarm</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">⌘B</td>
                    <td className="p-2 text-swarm-textDim">Toggle Broadcast All Mode</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">⌘P</td>
                    <td className="p-2 text-swarm-textDim">Toggle Wire Pipeline Mode</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">Space + Drag</td>
                    <td className="p-2 text-swarm-textDim">Smoothly Pan Flow Canvas Viewport</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">⌘1 .. ⌘9</td>
                    <td className="p-2 text-swarm-textDim">Focus specific Agent Terminal Pane 1..9</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold text-swarm-gold">⌘0</td>
                    <td className="p-2 text-swarm-textDim">Reset Zoom to 100% & Center Viewport</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
