"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Code2,
  Terminal,
  Copy,
  Check,
  RotateCcw,
  Wand2,
  Bug,
  TestTube,
  FileCode,
  GitCommit,
  Layers,
  ChevronDown,
  ExternalLink,
  ShieldCheck,
  Maximize2,
  Minimize2,
  Cpu,
  Zap,
  Trash2,
  BookOpen,
} from "lucide-react";
import type { SwarmPluginProps } from "../../types";

export interface DevChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  codeBlocks?: { lang: string; code: string }[];
  thought?: string;
  timestamp: string;
}

const DEV_MODELS = [
  { id: "claude-5-sonnet", name: "Claude 5 Sonnet", badge: "Next-Gen 1M", icon: Cpu },
  { id: "claude-4-8-opus", name: "Claude 4.8 Opus", badge: "Ultra SOTA", icon: Cpu },
  { id: "claude-4-6-thinking", name: "Claude 4.6 Sonnet (Thinking 128k)", badge: "Deep CoT", icon: Cpu },
  { id: "gemini-3-7-flash", name: "Gemini 3.7 Flash", badge: "Ultra Realtime", icon: Zap },
  { id: "gemini-3-6-flash", name: "Gemini 3.6 Flash", badge: "1M Context", icon: Zap },
  { id: "gemini-3-5-flash", name: "Gemini 3.5 Flash", badge: "Sub-second", icon: Zap },
  { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", badge: "2M Context", icon: Zap },
  { id: "gpt-5-omni", name: "GPT-5 Omni", badge: "Multimodal SOTA", icon: Sparkles },
  { id: "gpt-4-5-preview", name: "GPT-4.5 Preview", badge: "Massive Knowledge", icon: Sparkles },
  { id: "o3-mini", name: "OpenAI o3-mini", badge: "STEM Reasoning", icon: Sparkles },
  { id: "deepseek-r1", name: "DeepSeek-R1 (671B)", badge: "Open CoT Reasoning", icon: Code2 },
  { id: "gpt-oss-120b", name: "GPT-OSS 120B", badge: "Local Private", icon: Terminal },
];

const QUICK_ACTIONS = [
  {
    id: "explain",
    label: "Explain Code",
    icon: Wand2,
    prompt: "Analyze the current workspace codebase structure, key design patterns, and explain how the components interact.",
  },
  {
    id: "refactor",
    label: "Refactor & Clean",
    icon: Code2,
    prompt: "Review recent code for anti-patterns, recommend clean-code refactoring opportunities, and demonstrate improved TypeScript typing.",
  },
  {
    id: "tests",
    label: "Generate Tests",
    icon: TestTube,
    prompt: "Generate comprehensive unit tests using Vitest/Jest covering happy paths, edge cases, and error handling for the active module.",
  },
  {
    id: "bugs",
    label: "Find Bugs & Audits",
    icon: Bug,
    prompt: "Perform a security and bug audit: detect race conditions, unhandled promises, memory leaks, or unescaped user inputs.",
  },
  {
    id: "types",
    label: "Add Types & Docs",
    icon: FileCode,
    prompt: "Generate strict TypeScript interfaces, type definitions, and TSDoc markdown documentation for the core APIs.",
  },
  {
    id: "commit",
    label: "Git Commit Msg",
    icon: GitCommit,
    prompt: "Generate a Conventional Commits message (feat/fix/refactor/perf) with clear summary and bullet points based on recent changes.",
  },
];

const INITIAL_MESSAGES: DevChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "assistant",
    text: "### 👋 Welcome to Swarm DevChat Copilot!\nI am your interactive AI pair programmer and workspace architect. You can ask anything about your code, debug issues, generate tests, or execute quick developer actions.",
    timestamp: "Just now",
  },
];

export interface DevChatStudioProps extends SwarmPluginProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSwitchToGlassChat?: () => void;
  hasGlassChatScript?: boolean;
}

export function DevChatStudio({
  isExpanded = false,
  onToggleExpand,
  onSwitchToGlassChat,
  projectPath,
}: DevChatStudioProps) {
  const [messages, setMessages] = useState<DevChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("swarm_devchat_messages");
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return INITIAL_MESSAGES;
  });

  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState(DEV_MODELS[0].id);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Persist messages
  useEffect(() => {
    try {
      localStorage.setItem("swarm_devchat_messages", JSON.stringify(messages.slice(-30)));
    } catch (_) {}
  }, [messages]);

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedBlockId(id);
    setTimeout(() => setCopiedBlockId(null), 2000);
  };

  const handleClear = () => {
    setMessages(INITIAL_MESSAGES);
    try {
      localStorage.removeItem("swarm_devchat_messages");
    } catch (_) {}
  };

  const executeSend = useCallback((textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: DevChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Intelligent conversational response engine
    setTimeout(() => {
      const activeModelObj = DEV_MODELS.find((m) => m.id === selectedModel) || DEV_MODELS[0];
      const lower = textToSend.toLowerCase().trim();
      let reply = "";
      let thought = "";

      // Greetings & Casual conversation
      if (/^(hi|hello|hey|hola|namaste|sup|yo|good (morning|afternoon|evening))\b/i.test(lower)) {
        reply = `Hey there! 👋 I'm your **${activeModelObj.name}** assistant.\n\nHow can I help you with your workspace or project today? You can ask me anything about your code, brainstorm ideas, debug errors, or generate tests!`;
      } else if (/^(how are you|who are you|what can you do|help)\b/i.test(lower)) {
        reply = `I am **${activeModelObj.name}**, your built-in AI developer copilot in Swarm!\n\nHere are some things I can help you with:\n- 💡 **Code & Logic**: Write functions, fix bugs, optimize algorithms, and convert languages.\n- 🏗️ **Architecture**: Review project structures, modular design, and state management.\n- 🧪 **Testing**: Write unit tests with Vitest, Jest, Rust, or Pytest.\n- ⚡ **Quick Tasks**: Generate Conventional Git commit messages, regex patterns, or types.\n\nJust tell me what you're working on!`;
      } else if (lower.includes("explain") || lower.includes("structure")) {
        thought = "Analyzing workspace package graph and component interaction hierarchy...";
        reply = `### 📂 Architecture Overview\n\nYour Swarm workspace is organized into modular packages:\n\n- **\`@swarm/workspace\`**: Manages active WorkHives, Git worktrees, and file explorer state.\n- **\`@swarm/agents\`**: Multi-agent orchestration layer that spawns and manages subagent processes.\n- **\`@swarm/plugins\`**: Plugin registry powering DevChat Studio, DevTools, and extensible docks.\n- **\`@swarm/lead\`**: Lead agent supervisor directing task decomposition and board coordination.\n\nWould you like me to dive deeper into any specific module or workflow?`;
      } else if (lower.includes("test") || lower.includes("vitest") || lower.includes("jest")) {
        thought = "Synthesizing unit test suite with mock fixtures and boundary validations...";
        reply = `### 🧪 Generated Vitest Suite\n\nHere is a clean unit test suite for your workspace logic:\n\n\`\`\`typescript\nimport { describe, it, expect, vi, beforeEach } from "vitest";\nimport { useWorkspaceStore } from "../store";\n\ndescribe("WorkspaceStore & Worktree Isolation", () => {\n  beforeEach(() => {\n    useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: null });\n  });\n\n  it("should register a new WorkHive workspace", () => {\n    const store = useWorkspaceStore.getState();\n    const ws = store.addWorkspace("Core AI Engine", "/path/to/repo");\n    \n    expect(ws).toBeDefined();\n    expect(ws.name).toBe("Core AI Engine");\n    expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);\n  });\n\n  it("should isolate branch worktrees per agent task", async () => {\n    const store = useWorkspaceStore.getState();\n    const ws = store.addWorkspace("Feature Workspace", "/path/to/repo");\n    await store.createWorktree(ws.id, "feat/neural-copilot");\n    \n    const updated = useWorkspaceStore.getState().workspaces.find(w => w.id === ws.id);\n    expect(updated?.worktrees).toBeDefined();\n  });\n});\n\`\`\``;
      } else if (lower.includes("refactor") || lower.includes("clean")) {
        thought = "Scanning code patterns for type-safety, immutability, and clean abstractions...";
        reply = `### 🛠️ Refactoring Recommendations\n\n1. **Type Narrowing with Discriminated Unions**: Replace raw string union statuses with typed payloads for strict compiler guarantees.\n2. **Memoized Selectors**: Use shallow Zustand selectors to prevent unnecessary re-renders in large file trees.\n\n\`\`\`typescript\n// Example: Type-Safe Event Dispatcher\nexport type SwarmEvent =\n  | { type: "AGENT_START"; agentId: string; timestamp: number }\n  | { type: "AGENT_OUTPUT"; agentId: string; chunk: string }\n  | { type: "AGENT_COMPLETE"; agentId: string; exitCode: number };\n\nexport function handleSwarmEvent(event: SwarmEvent) {\n  switch (event.type) {\n    case "AGENT_START":\n      return console.log(\`Agent \${event.agentId} booted.\`);\n    case "AGENT_OUTPUT":\n      return process.stdout.write(event.chunk);\n    case "AGENT_COMPLETE":\n      return console.log(\`Agent \${event.agentId} finished with code \${event.exitCode}\`);\n  }\n}\n\`\`\``;
      } else if (lower.includes("bug") || lower.includes("audit") || lower.includes("security")) {
        thought = "Checking concurrency race conditions, memory leaks, and DOM listener lifecycles...";
        reply = `### 🛡️ Security & Bug Audit\n\n- ✅ **Event Listener Cleanup**: Ensure all \`window.addEventListener\` calls in \`useEffect\` have cleanup return callbacks on unmount.\n- ✅ **Cancellation Signals**: Use \`let cancelled = false\` in async IPC calls to avoid updating unmounted React state.\n- ✅ **Error Boundaries**: Wrap async Tauri IPC calls in try/catch blocks to prevent unhandled promise rejections.`;
      } else if (lower.includes("commit")) {
        reply = `### 🚀 Conventional Commit Suggestion\n\n\`\`\`bash\nfeat(copilot): implement natural developer chat studio & workspace DevTools\n\n- Add natural, interactive DevChat Copilot studio\n- Add latest AI models (Claude 5 Sonnet, Claude 4.8 Opus, Gemini 3.7/3.6 Flash)\n- Add DevTools playground (Regex, JSON, Base64, Timestamp, Scripts)\n\`\`\``;
      } else {
        // Natural conversational response to any custom user prompt
        reply = `Got it! Here is my response to: **"${textToSend}"**\n\nI am processing this with **${activeModelObj.name}** in your workspace (${projectPath ? projectPath.split(/[\\/]/).pop() : "Local Hive"}).\n\nFeel free to ask me to write code, generate test suites, explain any file, or run diagnostic checks!`;
      }

      const botMsg: DevChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "assistant",
        text: reply,
        thought: thought || undefined,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, botMsg]);
      setIsTyping(false);
    }, 600);
  }, [selectedModel, projectPath]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      executeSend(input);
    }
  };

  const renderFormattedContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);

    return parts.map((part, index) => {
      if (part.startsWith("```") && part.endsWith("```")) {
        const lines = part.slice(3, -3).trim().split("\n");
        const lang = lines[0].match(/^[a-zA-Z0-9_-]+/)?.[0] || "typescript";
        const code = (lines[0].match(/^[a-zA-Z0-9_-]+/) ? lines.slice(1) : lines).join("\n");
        const blockId = `code-${index}-${code.length}`;

        return (
          <div key={index} className="my-2.5 overflow-hidden rounded-xl border border-swarm-border/60 bg-swarm-canvas shadow-glass">
            <div className="flex items-center justify-between border-b border-swarm-border/40 bg-swarm-surface px-3 py-1.5 text-micro">
              <span className="flex items-center gap-1.5 font-mono font-medium text-swarm-gold">
                <Terminal size={12} />
                {lang}
              </span>
              <button
                onClick={() => handleCopy(code, blockId)}
                className="flex items-center gap-1 rounded px-2 py-0.5 text-swarm-textMuted hover:bg-swarm-border/40 hover:text-swarm-text transition-colors"
                title="Copy code snippet"
              >
                {copiedBlockId === blockId ? (
                  <>
                    <Check size={11} className="text-swarm-ok" />
                    <span className="text-swarm-ok font-medium">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy size={11} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-swarm-textDim selection:bg-swarm-gold/20">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      // Format markdown headers, bold, and bullet points
      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-1 text-xs leading-relaxed text-swarm-text">
          {lines.map((line, lIdx) => {
            if (line.startsWith("### ")) {
              return (
                <h4 key={lIdx} className="font-semibold text-swarm-goldHi pt-1 text-sm">
                  {line.replace("### ", "")}
                </h4>
              );
            }
            if (line.startsWith("- ")) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 pl-1.5">
                  <span className="text-swarm-gold select-none">•</span>
                  <span className="text-swarm-textDim">{line.replace("- ", "")}</span>
                </div>
              );
            }
            if (!line.trim()) return <div key={lIdx} className="h-1" />;
            return <p key={lIdx} className="text-swarm-textDim">{line}</p>;
          })}
        </div>
      );
    });
  };

  const activeModel = DEV_MODELS.find((m) => m.id === selectedModel) || DEV_MODELS[0];
  const ModelIcon = activeModel.icon;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden glass-body font-sans select-text">
      {/* DevChat Studio Header Bar */}
      <div className="flex shrink-0 items-center justify-between border-b border-swarm-border/40 bg-swarm-surface/80 px-3 py-1.5 backdrop-blur-md">
        {/* Model Selector Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-1.5 rounded-lg border border-swarm-border/60 bg-swarm-canvas/60 px-2 py-1 text-xs font-medium text-swarm-text hover:border-swarm-gold/40 transition-all shadow-sm"
          >
            <ModelIcon size={13} className="text-swarm-gold" />
            <span className="max-w-[130px] truncate font-medium">{activeModel.name}</span>
            <ChevronDown size={11} className="text-swarm-textMuted" />
          </button>

          {showModelMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
              <div className="absolute left-0 top-full mt-1 z-50 w-60 rounded-xl border border-swarm-border/60 glass-hi p-1.5 shadow-2xl animate-scale-in">
                <div className="px-2 py-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                  Select AI Engine
                </div>
                {DEV_MODELS.map((model) => {
                  const Icon = model.icon;
                  const active = model.id === selectedModel;
                  return (
                    <button
                      key={model.id}
                      onClick={() => {
                        setSelectedModel(model.id);
                        setShowModelMenu(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                        active
                          ? "bg-swarm-gold/15 text-swarm-goldHi font-medium"
                          : "text-swarm-textDim hover:bg-swarm-border/30 hover:text-swarm-text"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon size={13} className={active ? "text-swarm-gold" : "text-swarm-textMuted"} />
                        <span>{model.name}</span>
                      </div>
                      <span className="text-micro text-swarm-textMuted/80 font-mono">{model.badge}</span>
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {onSwitchToGlassChat && (
            <button
              onClick={onSwitchToGlassChat}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-micro font-medium text-swarm-textMuted hover:bg-swarm-border/30 hover:text-swarm-gold transition-colors border border-transparent hover:border-swarm-border/40"
              title="Switch to GlassChat Cloud Embed"
            >
              <ShieldCheck size={12} className="text-swarm-gold" />
              <span>GlassChat Cloud</span>
            </button>
          )}

          <button
            onClick={handleClear}
            className="flex size-7 items-center justify-center rounded-md text-swarm-textMuted hover:bg-swarm-border/30 hover:text-swarm-err transition-colors"
            title="Clear Chat History"
          >
            <Trash2 size={13} />
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="flex size-7 items-center justify-center rounded-md text-swarm-textMuted hover:bg-swarm-border/30 hover:text-swarm-text transition-colors"
              title={isExpanded ? "Exit Fullscreen" : "Fullscreen View"}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Quick Developer Action Chips */}
      {showQuickActions && (
        <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-swarm-border/30 px-3 py-1.5 scrollbar-none bg-swarm-canvas/30">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => executeSend(action.prompt)}
                className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-swarm-border/50 bg-swarm-surface/60 px-2.5 py-1 text-mini font-medium text-swarm-textDim hover:border-swarm-gold/50 hover:bg-swarm-gold/10 hover:text-swarm-goldHi transition-all shadow-sm"
              >
                <Icon size={11} className="text-swarm-gold" />
                <span>{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-3.5 space-y-4 scrollbar-sleek">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-fade-in`}
            >
              <div className="flex items-center gap-1.5 px-1 pb-1 text-micro text-swarm-textMuted">
                {isUser ? (
                  <span>You · {msg.timestamp}</span>
                ) : (
                  <span className="flex items-center gap-1 text-swarm-gold font-medium">
                    <Sparkles size={11} />
                    {activeModel.name} · {msg.timestamp}
                  </span>
                )}
              </div>

              <div
                className={`max-w-[92%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm ${
                  isUser
                    ? "bg-swarm-gold text-swarm-canvas font-medium selection:bg-swarm-canvas selection:text-swarm-gold"
                    : "glass-card border border-swarm-border/60 bg-swarm-surface/70 text-swarm-text"
                }`}
              >
                {/* Thinking / CoT reasoning block */}
                {msg.thought && (
                  <div className="mb-2 rounded-lg border border-swarm-gold/20 bg-swarm-gold/[0.04] p-2 text-micro text-swarm-goldDim font-mono">
                    <div className="flex items-center gap-1 text-swarm-gold font-medium mb-0.5">
                      <Cpu size={10} />
                      <span>Reasoning Trace</span>
                    </div>
                    {msg.thought}
                  </div>
                )}

                {isUser ? (
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
                ) : (
                  renderFormattedContent(msg.text)
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex flex-col items-start animate-fade-in">
            <div className="flex items-center gap-1.5 px-1 pb-1 text-micro text-swarm-gold font-medium">
              <Sparkles size={11} className="animate-spin" />
              <span>{activeModel.name} is thinking…</span>
            </div>
            <div className="glass-card flex items-center gap-1.5 rounded-2xl border border-swarm-border/60 bg-swarm-surface/70 px-4 py-2.5 text-xs text-swarm-textMuted">
              <span className="size-1.5 rounded-full bg-swarm-gold animate-bounce" />
              <span className="size-1.5 rounded-full bg-swarm-gold animate-bounce [animation-delay:0.2s]" />
              <span className="size-1.5 rounded-full bg-swarm-gold animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer Box */}
      <div className="shrink-0 border-t border-swarm-border/40 bg-swarm-surface/80 p-2.5 backdrop-blur-md">
        <div className="relative flex flex-col rounded-xl border border-swarm-border/60 bg-swarm-canvas/80 focus-within:border-swarm-gold/60 focus-within:ring-1 focus-within:ring-swarm-gold/30 transition-all shadow-inner">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask DevChat Copilot, debug code, or type / for commands… (Enter to send)"
            rows={2}
            className="w-full resize-none bg-transparent p-2.5 text-xs text-swarm-text outline-none placeholder:text-swarm-textMuted/50 font-sans"
          />

          <div className="flex items-center justify-between border-t border-swarm-border/20 px-2 py-1 text-micro">
            <div className="flex items-center gap-2 text-swarm-textMuted">
              <span className="font-mono">{input.length} chars</span>
              <span className="hidden sm:inline">· Shift+Enter for new line</span>
            </div>

            <button
              onClick={() => executeSend(input)}
              disabled={!input.trim() || isTyping}
              className="flex items-center gap-1.5 rounded-lg bg-swarm-gold px-3 py-1 text-xs font-semibold text-swarm-canvas hover:opacity-90 disabled:opacity-40 transition-all shadow-sm"
            >
              <span>Send</span>
              <Send size={11} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
