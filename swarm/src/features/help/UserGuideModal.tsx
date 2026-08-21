"use client";

import { useState, useEffect } from "react";
import {
  BookOpen,
  ShieldCheck,
  Zap,
  GitBranch,
  Network,
  Terminal,
  Cpu,
  Lock,
  EyeOff,
  Key,
  X,
  Radio,
  GitFork,
  Command,
} from "lucide-react";

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserGuideModal({ isOpen, onClose }: UserGuideModalProps) {
  const [activeTab, setActiveTab] = useState<"guide" | "privacy">("guide");
  const [selectedTopic, setSelectedTopic] = useState<string>("quickstart");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative flex flex-col w-full max-w-4xl max-h-[85vh] rounded-2xl bg-swarm-surface/98 backdrop-blur-2xl border border-swarm-borderHi/40 shadow-2xl shadow-black/90 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-swarm-border/40 bg-swarm-surfaceHi/40">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-lg bg-swarm-surfaceHi border border-swarm-borderHi/40 flex items-center justify-center text-swarm-gold">
              {activeTab === "guide" ? <BookOpen size={16} /> : <ShieldCheck size={16} />}
            </div>
            <div>
              <h2 className="text-sm font-bold text-swarm-text tracking-tight flex items-center gap-2">
                <span>{activeTab === "guide" ? "Swarm AI User Guide & Operations" : "Privacy Policy & Local-First Guarantees"}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-swarm-surface text-swarm-textDim border border-swarm-border/40">
                  v0.1.0 PRO
                </span>
              </h2>
              <p className="text-[11px] text-swarm-textMuted">
                {activeTab === "guide" ? "Interactive operational manual for multi-agent parallel workflows" : "Cryptographic and local-first data privacy guarantees"}
              </p>
            </div>
          </div>

          {/* Tab Switcher & Close */}
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg bg-swarm-canvas/60 p-0.5 border border-swarm-border/80 text-xs">
              <button
                onClick={() => {
                  setActiveTab("guide");
                  setSelectedTopic("quickstart");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  activeTab === "guide"
                    ? "bg-swarm-gold text-swarm-canvas font-bold shadow-xs"
                    : "text-swarm-textDim hover:text-swarm-text"
                }`}
              >
                <BookOpen size={12} />
                <span>User Guide</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab("privacy");
                  setSelectedTopic("local-first");
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer font-medium ${
                  activeTab === "privacy"
                    ? "bg-swarm-gold text-swarm-canvas font-bold shadow-xs"
                    : "text-swarm-textDim hover:text-swarm-text"
                }`}
              >
                <ShieldCheck size={12} />
                <span>Privacy & Security</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="size-7 flex items-center justify-center rounded-lg bg-swarm-surfaceHi/60 border border-swarm-borderHi/30 text-swarm-textDim hover:text-swarm-text hover:bg-swarm-surfaceHi transition-colors cursor-pointer"
              title="Close Guide (Esc)"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Modal Body: Sidebar Navigator + Content View */}
        <div className="grid grid-cols-[240px_1fr] flex-1 overflow-hidden min-h-[480px]">
          {/* Sidebar Navigation */}
          <div className="border-r border-swarm-border/40 bg-swarm-canvas/40 p-3 flex flex-col gap-1 overflow-y-auto scrollbar-sleek">
            {activeTab === "guide" ? (
              <>
                <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted tracking-wider uppercase font-mono">
                  Operational Manual
                </div>
                <button
                  onClick={() => setSelectedTopic("quickstart")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "quickstart"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <Zap size={13} className="text-swarm-gold shrink-0" />
                  <span>Quickstart & Hive Setup</span>
                </button>

                <button
                  onClick={() => setSelectedTopic("lead")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "lead"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <Cpu size={13} className="text-swarm-gold shrink-0" />
                  <span>Lead Steward & Missions</span>
                </button>

                <button
                  onClick={() => setSelectedTopic("canvas")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "canvas"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <Network size={13} className="text-swarm-gold shrink-0" />
                  <span>Flow Canvas & Wires</span>
                </button>

                <button
                  onClick={() => setSelectedTopic("worktrees")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "worktrees"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <GitBranch size={13} className="text-swarm-gold shrink-0" />
                  <span>Git Worktrees & 3-Way Merge</span>
                </button>

                <button
                  onClick={() => setSelectedTopic("shortcuts")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "shortcuts"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <Command size={13} className="text-swarm-gold shrink-0" />
                  <span>Keyboard Shortcuts</span>
                </button>
              </>
            ) : (
              <>
                <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted tracking-wider uppercase font-mono">
                  Security & Privacy
                </div>
                <button
                  onClick={() => setSelectedTopic("local-first")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "local-first"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <Lock size={13} className="text-swarm-gold shrink-0" />
                  <span>Zero Cloud Middleman</span>
                </button>

                <button
                  onClick={() => setSelectedTopic("keychain")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "keychain"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <Key size={13} className="text-swarm-gold shrink-0" />
                  <span>OS Keychain Encryption</span>
                </button>

                <button
                  onClick={() => setSelectedTopic("scrubbing")}
                  className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                    selectedTopic === "scrubbing"
                      ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
                      : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text"
                  }`}
                >
                  <EyeOff size={13} className="text-swarm-gold shrink-0" />
                  <span>Secret & Token Scrubbing</span>
                </button>
              </>
            )}
          </div>

          {/* Content View */}
          <div className="p-6 overflow-y-auto scrollbar-sleek flex flex-col gap-4 text-xs leading-relaxed text-swarm-textDim">
            {/* Guide: Quickstart */}
            {selectedTopic === "quickstart" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">1. Getting Started with Swarm AI</h3>
                <p>
                  Swarm AI is designed to coordinate multiple autonomous CLI coding bots (Claude Code, OpenAI Codex, OpenCode, Aider, Antigravity) concurrently inside your workspace.
                </p>
                <div className="p-3 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
                  <span className="font-semibold text-swarm-text flex items-center gap-1.5">
                    <Zap size={13} className="text-swarm-gold" />
                    <span>3-Step Quick Launch</span>
                  </span>
                  <ol className="list-decimal list-inside flex flex-col gap-1.5 pl-1">
                    <li><strong>Open a Project:</strong> Click the top-left logo menu or <code>⌘O</code> to bind a project directory. Swarm AI will auto-initialize <code>.pheromone/</code> for shared vector memory.</li>
                    <li><strong>Spawn Worker Agents:</strong> Click <strong>+ Agent</strong> in the Top Tab Strip to launch your installed CLIs (Claude, Codex, OpenCode).</li>
                    <li><strong>Dispatch Mission:</strong> Switch to the <strong>Lead tab</strong> or use the <strong>Flow Hub</strong> at the top of the canvas to send tasks in parallel.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Guide: Lead Steward */}
            {selectedTopic === "lead" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">2. Lead Steward Orchestrator</h3>
                <p>
                  The Lead Steward is your high-level AI architect. Instead of writing code directly in your primary branch, it analyzes your prompt, breaks it down into subtasks, and assigns them to worker agents across dedicated Git worktrees.
                </p>
                <div className="p-3 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
                  <span className="font-semibold text-swarm-text">Lead Steward Execution Principles:</span>
                  <ul className="list-disc list-inside flex flex-col gap-1 pl-1">
                    <li><strong>Goal Decomposition:</strong> Automatically isolates frontend, backend, and testing responsibilities.</li>
                    <li><strong>File Ownership Locks:</strong> Reserves specific file paths for each worker to prevent concurrent edit collisions.</li>
                    <li><strong>Context Synthesis:</strong> Ingests Pheromone memory updates and synchronizes project architecture.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* Guide: Flow Canvas */}
            {selectedTopic === "canvas" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">3. Infinite Flow Canvas & Synapses</h3>
                <p>
                  The Flow Canvas provides spatial awareness of your entire swarm. You can zoom, pan, rearrange agent nodes, and draw wire connections between them.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/20">
                    <div className="flex items-center gap-1.5 font-bold text-swarm-text mb-1">
                      <Radio size={13} className="text-swarm-gold" />
                      <span>Broadcast All Mode</span>
                    </div>
                    <span>Sends your input prompt simultaneously to all active CLI agents in parallel.</span>
                  </div>

                  <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/20">
                    <div className="flex items-center gap-1.5 font-bold text-swarm-text mb-1">
                      <GitFork size={13} className="text-swarm-gold" />
                      <span>Wire Pipeline Mode</span>
                    </div>
                    <span>Follows drawn wire synapse connections, passing output from one agent into the next.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Guide: Worktrees */}
            {selectedTopic === "worktrees" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">4. Git Worktree Concurrency & 3-Way Merge</h3>
                <p>
                  Swarm AI eliminates multi-agent merge conflicts by giving every worker agent its own ephemeral Git worktree under <code>.swarm/worktrees/&lt;task-id&gt;</code>.
                </p>
                <div className="p-3 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
                  <span className="font-semibold text-swarm-text">Merge & Conflict Resolver Workflow:</span>
                  <ol className="list-decimal list-inside flex flex-col gap-1.5 pl-1">
                    <li>Workers write code on their isolated ephemeral branches.</li>
                    <li>Swarm AI executes an in-memory 3-way dry-run validation using <code>git merge-tree</code>.</li>
                    <li>Once validated, changes are fast-forward merged into your primary branch with zero git pollution.</li>
                  </ol>
                </div>
              </div>
            )}

            {/* Guide: Shortcuts */}
            {selectedTopic === "shortcuts" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">5. Keyboard Shortcuts Cheatsheet</h3>
                <div className="border border-swarm-border/60 rounded-xl overflow-hidden">
                  <table className="w-full text-left font-mono text-[11px]">
                    <thead className="bg-swarm-surfaceHi/80 border-b border-swarm-border/40 text-swarm-text">
                      <tr>
                        <th className="p-2">Shortcut</th>
                        <th className="p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-swarm-border/30">
                      <tr>
                        <td className="p-2 font-bold text-swarm-gold">⌘K / Ctrl+K</td>
                        <td className="p-2 text-swarm-textDim">Open Unified Command Palette</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-swarm-gold">⌘Enter</td>
                        <td className="p-2 text-swarm-textDim">Dispatch Parallel Mission to Active Swarm</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-swarm-gold">Space + Drag</td>
                        <td className="p-2 text-swarm-textDim">Smoothly Pan Flow Canvas</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-swarm-gold">⌘1 .. ⌘9</td>
                        <td className="p-2 text-swarm-textDim">Focus specific Agent Terminal Pane</td>
                      </tr>
                      <tr>
                        <td className="p-2 font-bold text-swarm-gold">⌘0</td>
                        <td className="p-2 text-swarm-textDim">Reset Canvas Camera to 100% Zoom</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Privacy: Zero Cloud Middleman */}
            {selectedTopic === "local-first" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">Zero Cloud Middleman Guarantee</h3>
                <p>
                  Swarm AI operates on a strict <strong>local-first architectural model</strong>. The application contains zero remote proxies, zero telemetry loggers, and zero cloud intermediaries.
                </p>
                <div className="p-3 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
                  <span className="font-semibold text-swarm-text flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>Direct Localhost-to-Provider Sockets</span>
                  </span>
                  <p>
                    All API calls to Anthropic, OpenAI, or local Ollama servers originate strictly from your localhost machine. Your source code, file trees, and project diffs are never transmitted to any third-party Swarm AI server.
                  </p>
                </div>
              </div>
            )}

            {/* Privacy: OS Keychain Encryption */}
            {selectedTopic === "keychain" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">OS-Native Keychain Encryption</h3>
                <p>
                  Your model provider API keys (Anthropic, OpenAI, DeepSeek) are stored directly inside your operating system's native encrypted credential store:
                </p>
                <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1">
                  <li><strong>macOS:</strong> Apple Keychain Services via Security.framework.</li>
                  <li><strong>Windows:</strong> Windows Data Protection API (DPAPI) and Credential Manager.</li>
                  <li><strong>Linux:</strong> FreeDesktop Secret Service API via libsecret / GNOME Keyring.</li>
                </ul>
              </div>
            )}

            {/* Privacy: Secret Scrubbing */}
            {selectedTopic === "scrubbing" && (
              <div className="flex flex-col gap-3 animate-fade-in">
                <h3 className="text-sm font-bold text-swarm-text">Sensitive Secret & Token Scrubbing</h3>
                <p>
                  Swarm AI's PTY streaming pipeline actively monitors terminal stdout for sensitive patterns before writing to local vector memory or displaying in the terminal:
                </p>
                <div className="p-3 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30">
                  <ul className="list-disc list-inside flex flex-col gap-1">
                    <li>RSA / SSH Private Keys (<code>-----BEGIN RSA PRIVATE KEY-----</code>)</li>
                    <li>JWT Bearer Tokens and Session IDs</li>
                    <li>Environment file values (<code>.env</code> variables)</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
