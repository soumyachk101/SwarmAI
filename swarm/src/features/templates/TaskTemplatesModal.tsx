"use client";

import { useState, useEffect } from "react";
import {
 X,
 Layers,
 Bug,
 Sparkles,
 ShieldCheck,
 Compass,
 ArrowRight,
 CheckCircle2,
 BookOpen,
 Zap,
 GitBranch,
 Network,
 Terminal,
 Cpu,
 Lock,
 EyeOff,
 Key,
 Command,
} from "lucide-react";
import { useWorkspaceStore } from "@swarm/workspace";
import type { TaskCard } from "@swarm/tasks";

interface Props {
 open: boolean;
 onClose: () => void;
 initialTab?: ModalTab;
}

type ModalTab = "templates" | "guide" | "privacy";
type GuideTopic = "quickstart" | "lead" | "canvas" | "worktrees" | "shortcuts";
type PrivacyTopic = "local-first" | "keychain" | "scrubbing";

interface TemplateItem {
 id: string;
 title: string;
 category: string;
 icon: typeof Bug;
 description: string;
 tasks: Array<{ title: string; role: "builder" | "reviewer" | "scout" | "coordinator"; description: string }>;
}

const TEMPLATES: TemplateItem[] = [
 {
 id: "bugfix",
 title: "Bug Fix & Verification Workflow",
 category: "Maintenance",
 icon: Bug,
 description: "Multi-agent loop: scout locates root cause, builder implements fix, reviewer verifies tests.",
 tasks: [
 { title: "Investigate and isolate bug root cause", role: "scout", description: "Search logs, inspect stack trace and identify faulty module." },
 { title: "Implement bug fix and regression test", role: "builder", description: "Apply code changes and ensure regression test case passes." },
 { title: "Code review & edge case audit", role: "reviewer", description: "Check edge cases, type safety and security impacts." },
 ],
 },
 {
 id: "feature",
 title: "Full-Stack Feature Implementation",
 category: "Development",
 icon: Sparkles,
 description: "End-to-end flow: lead coordinates, builder drafts UI & API, reviewer runs quality checks.",
 tasks: [
 { title: "Architecture breakdown & interface design", role: "coordinator", description: "Define data schemas, component contracts and subtasks." },
 { title: "Implement frontend components and styling", role: "builder", description: "Build interactive React UI matching design specs." },
 { title: "Implement backend logic and API endpoints", role: "builder", description: "Connect database and backend handlers." },
 { title: "End-to-end integration and UX audit", role: "reviewer", description: "Test the user flow end to end." },
 ],
 },
 {
 id: "security",
 title: "Security & Vulnerability Audit",
 category: "Safety",
 icon: ShieldCheck,
 description: "Deep audit of dependencies, inputs, auth tokens and file system access points.",
 tasks: [
 { title: "Scan dependencies and package configs", role: "scout", description: "Identify outdated or vulnerable packages." },
 { title: "Review auth flows and input sanitization", role: "reviewer", description: "Check SQL injection, XSS and path traversal vectors." },
 { title: "Generate audit report and remediation patch", role: "builder", description: "Draft report with security patch recommendations." },
 ],
 },
 {
 id: "refactor",
 title: "Codebase Exploration & Refactoring",
 category: "Architecture",
 icon: Compass,
 description: "Discover legacy patterns, decouple modules, and optimize bundle/build speed.",
 tasks: [
 { title: "Analyze dependency graph and circular imports", role: "scout", description: "Map out module interdependencies." },
 { title: "Refactor core modules to clean abstractions", role: "builder", description: "Extract reusable utilities and improve typing." },
 { title: "Verify backwards compatibility and benchmarks", role: "reviewer", description: "Confirm existing features and tests run without regression." },
 ],
 },
];

const GUIDE_TOPICS: { id: GuideTopic; label: string; icon: typeof Zap }[] = [
 { id: "quickstart", label: "Quickstart & Hive Setup", icon: Zap },
 { id: "lead", label: "Lead Steward & Missions", icon: Cpu },
 { id: "canvas", label: "Flow Canvas & Wires", icon: Network },
 { id: "worktrees", label: "Git Worktrees & 3-Way Merge", icon: GitBranch },
 { id: "shortcuts", label: "Keyboard Shortcuts", icon: Command },
];

const PRIVACY_TOPICS: { id: PrivacyTopic; label: string; icon: typeof Lock }[] = [
 { id: "local-first", label: "Zero Cloud Middleman", icon: Lock },
 { id: "keychain", label: "OS Keychain Encryption", icon: Key },
 { id: "scrubbing", label: "Secret & Token Scrubbing", icon: EyeOff },
];

const TABS: { id: ModalTab; label: string; icon: typeof Layers }[] = [
 { id: "templates", label: "Templates", icon: Layers },
 { id: "guide", label: "User Guide", icon: BookOpen },
 { id: "privacy", label: "Privacy & Security", icon: ShieldCheck },
];

export default function TaskTemplatesModal({ open, onClose, initialTab = "templates" }: Props) {
 const [activeTab, setActiveTab] = useState<ModalTab>(initialTab);

 // When the modal opens with an explicit initialTab (e.g. HomePage routing),
 // jump to that tab after the open transition starts.
 useEffect(() => {
 if (open) {
 setActiveTab(initialTab);
 }
 }, [open, initialTab]);
 const [selectedTemplate, setSelectedTemplate] = useState<TemplateItem>(TEMPLATES[0]);
 const [applied, setApplied] = useState(false);
 const [selectedGuideTopic, setSelectedGuideTopic] = useState<GuideTopic>("quickstart");
 const [selectedPrivacyTopic, setSelectedPrivacyTopic] = useState<PrivacyTopic>("local-first");

 const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
 const workspaces = useWorkspaceStore((s) => s.workspaces);
 const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);

 const handleApply = () => {
 if (!activeWorkspace) return;
 const now = Date.now();
 const newCards: TaskCard[] = selectedTemplate.tasks.map((t, idx) => ({
 id: `task-${now}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
 title: t.title,
 description: t.description,
 column: "todo",
 sortOrder: (activeWorkspace.taskCards?.length ?? 0) + idx,
 assignedRole: t.role,
 owns: [],
 reads: [],
 dependsOn: [],
 createdAt: now,
 updatedAt: now,
 }));

 useWorkspaceStore.setState((state) => ({
 workspaces: state.workspaces.map((w) =>
 w.id === activeWorkspaceId
 ? { ...w, taskCards: [...(w.taskCards ?? []), ...newCards] }
 : w
 ),
 }));

 setApplied(true);
 setTimeout(() => {
 setApplied(false);
 onClose();
 }, 1200);
 };

 if (!open) return null;

 const renderTabContent = () => {
 if (activeTab === "templates") {
 return (
 <div className="flex h-full">
 {/* Template Selection List */}
 <div className="w-64 border-r border-swarm-border/40 p-3 bg-swarm-surface/20 flex flex-col gap-2 overflow-y-auto shrink-0">
 <span className="text-micro uppercase font-semibold text-swarm-textMuted px-2 py-1">
 Select Template
 </span>
 {TEMPLATES.map((tmpl) => {
 const Icon = tmpl.icon;
 const isSel = selectedTemplate.id === tmpl.id;
 return (
 <button
 key={tmpl.id}
 onClick={() => setSelectedTemplate(tmpl)}
 className={`flex items-start gap-2.5 p-3 rounded-lg text-left transition-all cursor-pointer ${
 isSel
 ? "bg-swarm-gold/20 text-swarm-goldHi border border-swarm-gold/40 shadow-sm"
 : "hover:bg-swarm-surface/60 text-swarm-textDim hover:text-swarm-text border border-transparent"
 }`}
 >
 <div className={`p-1.5 rounded-md shrink-0 ${isSel ? "bg-swarm-gold/20 text-swarm-goldHi" : "bg-swarm-surface text-swarm-textMuted"}`}>
 <Icon className="size-4" />
 </div>
 <div className="min-w-0">
 <div className="text-xs font-semibold truncate">{tmpl.title}</div>
 <div className="text-micro text-swarm-textMuted line-clamp-1">{tmpl.category}</div>
 </div>
 </button>
 );
 })}
 </div>

 {/* Template Preview */}
 <div className="flex-1 p-6 flex flex-col justify-between overflow-y-auto">
 <div className="space-y-4">
 <div>
 <span className="text-micro font-mono uppercase text-swarm-goldHi bg-swarm-gold/10 px-2 py-0.5 rounded border border-swarm-gold/20">
 {selectedTemplate.category}
 </span>
 <h3 className="text-base font-bold text-swarm-text mt-2">{selectedTemplate.title}</h3>
 <p className="text-xs text-swarm-textMuted mt-1">{selectedTemplate.description}</p>
 </div>

 <div className="space-y-2">
 <span className="text-micro font-semibold uppercase tracking-wider text-swarm-textDim">
 Included Subtasks ({selectedTemplate.tasks.length})
 </span>

 <div className="space-y-2">
 {selectedTemplate.tasks.map((task, i) => (
 <div key={i} className="glass-inset rounded-lg p-3 border border-swarm-border/40 space-y-1">
 <div className="flex items-center justify-between">
 <span className="text-xs font-medium text-swarm-text flex items-center gap-1.5">
 <span className="size-1.5 rounded-full bg-swarm-gold" />
 {task.title}
 </span>
 <span className="text-micro uppercase font-semibold text-swarm-gold px-1.5 py-0.5 rounded bg-swarm-gold/10 border border-swarm-gold/20">
 {task.role}
 </span>
 </div>
 <p className="text-micro text-swarm-textMuted leading-relaxed">{task.description}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 {/* Apply Button */}
 <div className="pt-4 border-t border-swarm-border/30 flex justify-end">
 <button
 onClick={handleApply}
 disabled={applied}
 className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-swarm-gold text-swarm-canvas hover:bg-swarm-goldHi text-xs font-bold transition-all shadow-md disabled:opacity-60"
 >
 {applied ? (
 <>
 <CheckCircle2 className="size-4" />
 <span>Applied to Board!</span>
 </>
 ) : (
 <>
 <span>Apply Template to Board</span>
 <ArrowRight className="size-3.5" />
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 );
 }

 if (activeTab === "guide") {
 return (
 <div className="flex h-full">
 {/* Guide Sidebar Navigation */}
 <div className="w-56 border-r border-swarm-border/40 bg-swarm-surface/20 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
 <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted tracking-wider uppercase font-mono">
 Operational Manual
 </div>
 {GUIDE_TOPICS.map((topic) => {
 const Icon = topic.icon;
 const isSel = selectedGuideTopic === topic.id;
 return (
 <button
 key={topic.id}
 onClick={() => setSelectedGuideTopic(topic.id)}
 className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
 isSel
 ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
 : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text border border-transparent"
 }`}
 >
 <Icon size={13} className="text-swarm-gold shrink-0" />
 <span>{topic.label}</span>
 </button>
 );
 })}
 </div>

 {/* Guide Content */}
 <div className="flex-1 p-6 overflow-y-auto text-xs leading-relaxed text-swarm-textDim">
 {selectedGuideTopic === "quickstart" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">1. Getting Started with Swarm AI</h3>
 <p>
 Swarm AI is designed to coordinate multiple autonomous CLI coding bots (Claude Code, OpenAI Codex, OpenCode, Aider, Antigravity) concurrently inside your workspace.
 </p>
 <div className="p-4 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
 <span className="font-semibold text-swarm-text flex items-center gap-1.5">
 <Zap size={14} className="text-swarm-gold" />
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

 {selectedGuideTopic === "lead" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">2. Lead Steward Orchestrator</h3>
 <p>
 The Lead Steward is your high-level AI architect. Instead of writing code directly in your primary branch, it analyzes your prompt, breaks it down into subtasks, and assigns them to worker agents across dedicated Git worktrees.
 </p>
 <div className="p-4 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
 <span className="font-semibold text-swarm-text">Lead Steward Execution Principles:</span>
 <ul className="list-disc list-inside flex flex-col gap-1.5 pl-1">
 <li><strong>Goal Decomposition:</strong> Automatically isolates frontend, backend, and testing responsibilities.</li>
 <li><strong>File Ownership Locks:</strong> Reserves specific file paths for each worker to prevent concurrent edit collisions.</li>
 <li><strong>Context Synthesis:</strong> Ingests Pheromone memory updates and synchronizes project architecture.</li>
 </ul>
 </div>
 </div>
 )}

 {selectedGuideTopic === "canvas" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">3. Infinite Flow Canvas & Synapses</h3>
 <p>
 The Flow Canvas provides spatial awareness of your entire swarm. You can zoom, pan, rearrange agent nodes, and draw wire connections between them.
 </p>
 <div className="grid grid-cols-2 gap-3">
 <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/20">
 <div className="flex items-center gap-1.5 font-bold text-swarm-text mb-1">
 <Terminal size={14} className="text-swarm-gold" />
 <span>Broadcast All Mode</span>
 </div>
 <span>Sends your input prompt simultaneously to all active CLI agents in parallel.</span>
 </div>
 <div className="p-3 rounded-xl bg-swarm-surfaceHi/40 border border-swarm-borderHi/20">
 <div className="flex items-center gap-1.5 font-bold text-swarm-text mb-1">
 <GitBranch size={14} className="text-swarm-gold" />
 <span>Wire Pipeline Mode</span>
 </div>
 <span>Follows drawn wire synapse connections, passing output from one agent into the next.</span>
 </div>
 </div>
 </div>
 )}

 {selectedGuideTopic === "worktrees" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">4. Git Worktree Concurrency & 3-Way Merge</h3>
 <p>
 Swarm AI eliminates multi-agent merge conflicts by giving every worker agent its own ephemeral Git worktree under <code>.swarm/worktrees/&lt;task-id&gt;</code>.
 </p>
 <div className="p-4 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
 <span className="font-semibold text-swarm-text">Merge & Conflict Resolver Workflow:</span>
 <ol className="list-decimal list-inside flex flex-col gap-1.5 pl-1">
 <li>Workers write code on their isolated ephemeral branches.</li>
 <li>Swarm AI executes an in-memory 3-way dry-run validation using <code>git merge-tree</code>.</li>
 <li>Once validated, changes are fast-forward merged into your primary branch with zero git pollution.</li>
 </ol>
 </div>
 </div>
 )}

 {selectedGuideTopic === "shortcuts" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">5. Keyboard Shortcuts Cheatsheet</h3>
 <div className="border border-swarm-border/60 rounded-xl overflow-hidden">
 <table className="w-full text-left font-mono text-[11px]">
 <thead className="bg-swarm-surfaceHi/80 border-b border-swarm-border/40 text-swarm-text">
 <tr>
 <th className="p-2.5 font-semibold">Shortcut</th>
 <th className="p-2.5 font-semibold">Action</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-swarm-border/30">
 <tr>
 <td className="p-2.5 font-bold text-swarm-gold">⌘K / Ctrl+K</td>
 <td className="p-2.5 text-swarm-textDim">Open Unified Command Palette</td>
 </tr>
 <tr>
 <td className="p-2.5 font-bold text-swarm-gold">⌘Enter</td>
 <td className="p-2.5 text-swarm-textDim">Dispatch Parallel Mission to Active Swarm</td>
 </tr>
 <tr>
 <td className="p-2.5 font-bold text-swarm-gold">Space + Drag</td>
 <td className="p-2.5 text-swarm-textDim">Smoothly Pan Flow Canvas</td>
 </tr>
 <tr>
 <td className="p-2.5 font-bold text-swarm-gold">⌘1 .. ⌘9</td>
 <td className="p-2.5 text-swarm-textDim">Focus specific Agent Terminal Pane</td>
 </tr>
 <tr>
 <td className="p-2.5 font-bold text-swarm-gold">⌘0</td>
 <td className="p-2.5 text-swarm-textDim">Reset Canvas Camera to 100% Zoom</td>
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

 // Privacy & Security tab
 return (
 <div className="flex h-full">
 {/* Privacy Sidebar Navigation */}
 <div className="w-56 border-r border-swarm-border/40 bg-swarm-surface/20 p-3 flex flex-col gap-1 overflow-y-auto shrink-0">
 <div className="px-2 py-1 text-[10px] font-bold text-swarm-textMuted tracking-wider uppercase font-mono">
 Security & Privacy
 </div>
 {PRIVACY_TOPICS.map((topic) => {
 const Icon = topic.icon;
 const isSel = selectedPrivacyTopic === topic.id;
 return (
 <button
 key={topic.id}
 onClick={() => setSelectedPrivacyTopic(topic.id)}
 className={`flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
 isSel
 ? "bg-swarm-surfaceHi text-swarm-text font-semibold border border-swarm-borderHi/40"
 : "text-swarm-textDim hover:bg-swarm-surfaceHi/40 hover:text-swarm-text border border-transparent"
 }`}
 >
 <Icon size={13} className="text-swarm-gold shrink-0" />
 <span>{topic.label}</span>
 </button>
 );
 })}
 </div>

 {/* Privacy Content */}
 <div className="flex-1 p-6 overflow-y-auto text-xs leading-relaxed text-swarm-textDim">
 {selectedPrivacyTopic === "local-first" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">Zero Cloud Middleman Guarantee</h3>
 <p>
 Swarm AI operates on a strict <strong>local-first architectural model</strong>. The application contains zero remote proxies, zero telemetry loggers, and zero cloud intermediaries.
 </p>
 <div className="p-4 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30 flex flex-col gap-2">
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

 {selectedPrivacyTopic === "keychain" && (
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

 {selectedPrivacyTopic === "scrubbing" && (
 <div className="flex flex-col gap-3 animate-fade-in">
 <h3 className="text-sm font-bold text-swarm-text">Sensitive Secret & Token Scrubbing</h3>
 <p>
 Swarm AI's PTY streaming pipeline actively monitors terminal stdout for sensitive patterns before writing to local vector memory or displaying in the terminal:
 </p>
 <div className="p-4 rounded-xl bg-swarm-surfaceHi/50 border border-swarm-borderHi/30">
 <ul className="list-disc list-inside flex flex-col gap-1.5">
 <li>RSA / SSH Private Keys (<code>-----BEGIN RSA PRIVATE KEY-----</code>)</li>
 <li>JWT Bearer Tokens and Session IDs</li>
 <li>Environment file values (<code>.env</code> variables)</li>
 </ul>
 </div>
 </div>
 )}
 </div>
 </div>
 );
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md animate-fade-in p-4">
 <div
 className="w-full max-w-4xl max-h-[85vh] flex flex-col rounded-xl glass-rail border border-swarm-gold/30 shadow-2xl overflow-hidden bg-swarm-canvas/95"
 role="dialog"
 aria-modal="true"
 >
 {/* Header */}
 <div className="flex items-center justify-between px-5 py-3.5 border-b border-swarm-border/50 bg-swarm-surface/40 shrink-0">
 <div className="flex items-center gap-3">
 <div className="size-8 rounded-lg bg-swarm-gold/15 border border-swarm-gold/30 flex items-center justify-center text-swarm-gold">
 <Layers className="size-4" />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-swarm-text">
 {activeTab === "templates" ? "Multi-Agent Task Templates" : activeTab === "guide" ? "User Guide & Operations" : "Privacy Policy & Security"}
 </h2>
 <p className="text-[11px] text-swarm-textMuted">
 {activeTab === "templates" ? "Pre-configured workflows for builder, reviewer, and scout roles" : activeTab === "guide" ? "Interactive operational manual for multi-agent workflows" : "Local-first data privacy and security guarantees"}
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 {/* Tab Switcher */}
 <div className="flex items-center rounded-lg bg-swarm-canvas/60 p-0.5 border border-swarm-border/80">
 {TABS.map((tab) => {
 const Icon = tab.icon;
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all cursor-pointer text-xs font-medium ${
 isActive
 ? "bg-swarm-gold text-swarm-canvas font-bold shadow-xs"
 : "text-swarm-textDim hover:text-swarm-text"
 }`}
 >
 <Icon size={12} />
 <span className="hidden sm:inline">{tab.label}</span>
 </button>
 );
 })}
 </div>

 <button
 onClick={onClose}
 className="size-7 flex items-center justify-center rounded-lg bg-swarm-surfaceHi/60 border border-swarm-borderHi/30 text-swarm-textDim hover:text-swarm-text hover:bg-swarm-surfaceHi transition-colors cursor-pointer"
 title="Close"
 >
 <X size={14} />
 </button>
 </div>
 </div>

 {/* Tab Content */}
 <div className="flex-1 overflow-hidden min-h-[420px]">
 {renderTabContent()}
 </div>
 </div>
 </div>
 );
}
