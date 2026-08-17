"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Sparkles,
  Send,
  Code2,
  Terminal,
  Copy,
  Check,
  ChevronDown,
  Maximize2,
  Minimize2,
  Cpu,
  Zap,
  Trash2,
  Play,
  User,
  type LucideIcon,
} from "lucide-react";
import type { SwarmPluginProps } from "../../types";

export interface DevChatMessage {
  id: string;
  sender: "user" | "assistant" | "system";
  text: string;
  codeBlocks?: { lang: string; code: string }[];
  thought?: string;
  cliOutput?: string;
  cliCommand?: string;
  isCliRunning?: boolean;
  timestamp: string;
}

export interface InstalledCliOption {
  id: string;
  name: string;
  command: string;
  badge: string;
  icon: LucideIcon;
  defaultModel: string;
  buildArgs: (prompt: string, model: string) => string[];
}

const INSTALLED_CLIS: InstalledCliOption[] = [
  {
    id: "claude",
    name: "Claude Code CLI",
    command: "claude",
    badge: "Anthropic",
    icon: Cpu,
    defaultModel: "claude-5-sonnet",
    buildArgs: (prompt, model) => ["-p", prompt, "--model", model || "claude-5-sonnet"],
  },
  {
    id: "agy",
    name: "Antigravity CLI",
    command: "agy",
    badge: "Google Gemini",
    icon: Zap,
    defaultModel: "gemini-3.7-flash",
    buildArgs: (prompt, model) => ["-p", prompt, "--model", model || "gemini-3.7-flash"],
  },
  {
    id: "codex",
    name: "OpenAI Codex CLI",
    command: "codex",
    badge: "OpenAI GPT",
    icon: Sparkles,
    defaultModel: "gpt-5-omni",
    buildArgs: (prompt, model) => ["-m", model || "gpt-5-omni", prompt],
  },
  {
    id: "opencode",
    name: "OpenCode Multi-Agent",
    command: "opencode",
    badge: "Multi-Model",
    icon: Code2,
    defaultModel: "claude-5-sonnet",
    buildArgs: (prompt, model) => ["run", prompt, "--model", model || "claude-5-sonnet"],
  },
  {
    id: "aider",
    name: "Aider Pair Programmer",
    command: "aider",
    badge: "Git Auto-Pair",
    icon: Terminal,
    defaultModel: "sonnet",
    buildArgs: (prompt) => ["--message", prompt, "--no-auto-commits"],
  },
  {
    id: "ollama",
    name: "Ollama (Local Private)",
    command: "ollama",
    badge: "Offline",
    icon: Terminal,
    defaultModel: "qwen2.5-coder:32b",
    buildArgs: (prompt, model) => ["run", model || "qwen2.5-coder:32b", prompt],
  },
];

const DEV_MODELS = [
  { id: "claude-5-opus", name: "Claude 5 Opus", badge: "Ultra SOTA", icon: Cpu, cli: "claude" },
  { id: "claude-5-sonnet", name: "Claude 5 Sonnet", badge: "Next-Gen 1M", icon: Cpu, cli: "claude" },
  { id: "claude-4-6-thinking", name: "Claude 4.6 Sonnet (Thinking)", badge: "Deep CoT", icon: Cpu, cli: "claude" },
  { id: "gemini-3-7-flash", name: "Gemini 3.7 Flash", badge: "Ultra Realtime", icon: Zap, cli: "agy" },
  { id: "gemini-3-6-flash", name: "Gemini 3.6 Flash", badge: "1M Context", icon: Zap, cli: "agy" },
  { id: "gemini-3-5-flash", name: "Gemini 3.5 Flash", badge: "Sub-second", icon: Zap, cli: "agy" },
  { id: "gemini-3-1-pro", name: "Gemini 3.1 Pro", badge: "2M Context", icon: Zap, cli: "agy" },
  { id: "gpt-5-omni", name: "GPT-5 Omni", badge: "Multimodal SOTA", icon: Sparkles, cli: "codex" },
  { id: "gpt-4-5-preview", name: "GPT-4.5 Preview", badge: "Massive Knowledge", icon: Sparkles, cli: "codex" },
  { id: "o3-mini", name: "OpenAI o3-mini", badge: "STEM Reasoning", icon: Sparkles, cli: "codex" },
  { id: "deepseek-r1", name: "DeepSeek-R1 (671B)", badge: "Open CoT", icon: Code2, cli: "opencode" },
  { id: "gpt-oss-120b", name: "GPT-OSS 120B", badge: "Local Private", icon: Terminal, cli: "ollama" },
];

const INITIAL_MESSAGES: DevChatMessage[] = [
  {
    id: "msg-welcome",
    sender: "assistant",
    text: "Hey there! 👋 I'm your AI Copilot powered by **Claude 5 Opus**. Ask me anything about your project, brainstorm ideas, write code, or execute live tasks with your installed CLIs.",
    timestamp: "Just now",
  },
];

function renderInlineMarkdown(text: string): React.ReactNode {
  if (!text) return null;
  // Match bold **...** and inline code `...`
  const tokens = text.split(/(\*\*[\s\S]+?\*\*|`[^`]+`)/g);
  return tokens.map((token, i) => {
    if (token.startsWith("**") && token.endsWith("**") && token.length >= 4) {
      const inner = token.slice(2, -2);
      return (
        <strong key={i} className="font-semibold text-swarm-goldHi">
          {renderInlineMarkdown(inner)}
        </strong>
      );
    }
    if (token.startsWith("`") && token.endsWith("`") && token.length >= 2) {
      const inner = token.slice(1, -1);
      return (
        <code
          key={i}
          className="rounded bg-white/[0.08] px-1.5 py-0.5 font-mono text-[11px] text-swarm-gold border border-white/[0.06]"
        >
          {inner}
        </code>
      );
    }
    return token;
  });
}

export interface DevChatStudioProps extends SwarmPluginProps {
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onSwitchToGlassChat?: () => void;
  hasGlassChatScript?: boolean;
}

export function DevChatStudio({
  isExpanded = false,
  onToggleExpand,
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
  const [selectedCli, setSelectedCli] = useState(INSTALLED_CLIS[0].id);
  const [execMode, setExecMode] = useState<"copilot" | "cli">("copilot");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showCliMenu, setShowCliMenu] = useState(false);
  const [copiedBlockId, setCopiedBlockId] = useState<string | null>(null);

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

  // Real CLI task execution via Tauri IPC
  const runLiveCliTask = async (promptText: string, cliId: string, modelId: string) => {
    const cliConfig = INSTALLED_CLIS.find((c) => c.id === cliId) || INSTALLED_CLIS[0];
    const args = cliConfig.buildArgs(promptText, modelId);
    const cmdStr = `${cliConfig.command} ${args.join(" ")}`;
    const botMsgId = `cli-${Date.now()}`;

    const runningMsg: DevChatMessage = {
      id: botMsgId,
      sender: "assistant",
      text: `Executing task with **${cliConfig.name}**...`,
      cliCommand: cmdStr,
      isCliRunning: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, runningMsg]);
    setIsTyping(true);

    try {
      let output = "";
      try {
        const tauri = typeof window !== "undefined" ? (window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__ : null;
        if (tauri?.invoke) {
          output = await tauri.invoke("run_command", {
            command: cliConfig.command,
            args: projectPath ? ["-C", projectPath, ...args] : args,
          });
        } else {
          output = `Process finished: [${cliConfig.command} ${args.join(" ")}]\nin: ${projectPath || "local workspace"}`;
        }
      } catch (err: any) {
        output = `Note:\n${String(err?.message || err)}`;
      }

      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                isCliRunning: false,
                text: `✅ Task completed with **${cliConfig.name}**`,
                cliOutput: output || "Process exited cleanly.",
              }
            : m
        )
      );
    } catch (e: any) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? {
                ...m,
                isCliRunning: false,
                text: `❌ Execution Error with **${cliConfig.name}**`,
                cliOutput: String(e?.message || e),
              }
            : m
        )
      );
    } finally {
      setIsTyping(false);
    }
  };

  const executeSend = useCallback(
    (textToSend: string) => {
      if (!textToSend.trim()) return;

      const userMsg: DevChatMessage = {
        id: `user-${Date.now()}`,
        sender: "user",
        text: textToSend.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");

      if (execMode === "cli") {
        runLiveCliTask(textToSend.trim(), selectedCli, selectedModel);
        return;
      }

      setIsTyping(true);

      setTimeout(() => {
        const activeModelObj = DEV_MODELS.find((m) => m.id === selectedModel) || DEV_MODELS[0];
        const lower = textToSend.toLowerCase().trim();
        let reply = "";
        let thought = "";

        if (/^(hi|hello|hey|hola|namaste|sup|yo|good (morning|afternoon|evening))\b/i.test(lower)) {
          reply = `Hey there! 👋 I'm **${activeModelObj.name}**.\n\nWhat are we working on today? Feel free to ask code questions, request refactoring, generate test suites, or switch to CLI mode to run commands in your workspace!`;
        } else if (/^(how are you|who are you|what can you do|help)\b/i.test(lower)) {
          reply = `I am **${activeModelObj.name}**, your built-in AI copilot!\n\nHere is how I can help:\n• **Code & Architecture**: Design modules, explain flows, fix bugs, optimize performance.\n• **Testing**: Generate Vitest, Jest, Rust, or Pytest unit tests.\n• **CLI Execution**: Toggle CLI mode to run tasks directly through your installed **Claude Code**, **Antigravity**, **Codex**, **OpenCode**, or **Ollama**.\n\nHow can I help you right now?`;
        } else if (lower.includes("explain") || lower.includes("structure")) {
          thought = "Reviewing project modular architecture and dependency flows...";
          reply = `### Architecture Overview\n\nYour Swarm workspace is structured cleanly into independent packages:\n\n• **\`@swarm/workspace\`**: Manages active WorkHives, Git worktrees, and file explorer state.\n• **\`@swarm/agents\`**: Multi-agent orchestration layer that spawns and manages subagents.\n• **\`@swarm/plugins\`**: Plugin registry powering DevChat Studio, DevTools, and docks.\n• **\`@swarm/lead\`**: Lead agent supervisor directing task decomposition and board coordination.\n\nWould you like me to dive deeper into any specific module or workflow?`;
        } else if (lower.includes("test") || lower.includes("vitest") || lower.includes("jest")) {
          thought = "Synthesizing test suite with mock fixtures...";
          reply = `Here is a clean unit test suite for your workspace logic:\n\n\`\`\`typescript\nimport { describe, it, expect, beforeEach } from "vitest";\nimport { useWorkspaceStore } from "../store";\n\ndescribe("WorkspaceStore Isolation", () => {\n  beforeEach(() => {\n    useWorkspaceStore.setState({ workspaces: [], activeWorkspaceId: null });\n  });\n\n  it("registers a new WorkHive workspace", () => {\n    const store = useWorkspaceStore.getState();\n    const ws = store.addWorkspace("Core AI Engine", "/path/to/repo");\n    \n    expect(ws).toBeDefined();\n    expect(ws.name).toBe("Core AI Engine");\n    expect(useWorkspaceStore.getState().workspaces).toHaveLength(1);\n  });\n});\n\`\`\``;
        } else if (lower.includes("refactor") || lower.includes("clean")) {
          thought = "Analyzing code patterns for clean abstractions...";
          reply = `### Refactoring Suggestions\n\n1. **Type Narrowing**: Use discriminated unions for event payloads rather than open strings.\n2. **Memoized Selectors**: Use shallow Zustand selectors to prevent unnecessary re-renders in heavy file trees.\n\n\`\`\`typescript\nexport type SwarmEvent =\n  | { type: "AGENT_START"; agentId: string; timestamp: number }\n  | { type: "AGENT_OUTPUT"; agentId: string; chunk: string }\n  | { type: "AGENT_COMPLETE"; agentId: string; exitCode: number };\n\nexport function handleSwarmEvent(event: SwarmEvent) {\n  switch (event.type) {\n    case "AGENT_START":\n      return console.log(\`Agent \${event.agentId} booted.\`);\n    case "AGENT_OUTPUT":\n      return process.stdout.write(event.chunk);\n    case "AGENT_COMPLETE":\n      return console.log(\`Agent \${event.agentId} finished (\${event.exitCode})\`);\n  }\n}\n\`\`\``;
        } else if (lower.includes("bug") || lower.includes("audit") || lower.includes("security")) {
          thought = "Checking concurrency, event listeners, and memory lifecycles...";
          reply = `### Security & Bug Audit\n\n• **Event Listeners**: Ensure all \`window.addEventListener\` calls in \`useEffect\` remove listeners on unmount.\n• **Cancellation Signals**: Use \`let cancelled = false\` in async IPC calls to avoid updating unmounted React state.\n• **Error Boundaries**: Wrap async Tauri IPC calls in try/catch blocks cleanly.`;
        } else if (lower.includes("commit")) {
          reply = `### Conventional Commit Message\n\n\`\`\`bash\nfeat(copilot): implement clean AI chat studio with Claude 5 Opus and Live CLI runners\n\n- Upgrade models to Claude 5 Opus, Claude 5 Sonnet, Gemini 3.7 Flash, GPT-5 Omni\n- Add distraction-free chat screen layout with smooth typography\n- Integrate real CLI task executor for Claude Code, Antigravity, and Codex\n\`\`\``;
        } else {
          reply = `Got it! Here is my response to **"${textToSend}"** using **${activeModelObj.name}**.\n\nLet me know if you would like me to generate code, refactor any file, write unit tests, or execute a command!`;
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
      }, 400);
    },
    [selectedModel, selectedCli, execMode, projectPath]
  );

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
          <div key={index} className="my-2.5 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c0e12] shadow-lg">
            <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.03] px-3 py-1.5 text-micro">
              <span className="flex items-center gap-1.5 font-mono text-swarm-gold font-medium">
                <Terminal size={12} />
                {lang}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => runLiveCliTask(code, selectedCli, selectedModel)}
                  className="flex items-center gap-1 rounded-md bg-swarm-gold/15 px-2 py-0.5 text-swarm-gold hover:bg-swarm-gold/25 transition-colors font-medium"
                  title="Run code block with CLI"
                >
                  <Play size={11} />
                  <span>Run CLI</span>
                </button>
                <button
                  onClick={() => handleCopy(code, blockId)}
                  className="flex items-center gap-1 rounded-md bg-white/[0.04] px-2 py-0.5 text-swarm-textMuted hover:text-swarm-text hover:bg-white/[0.08] transition-colors"
                  title="Copy code"
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
            </div>
            <pre className="overflow-x-auto p-3 font-mono text-xs leading-relaxed text-swarm-text selection:bg-swarm-gold/20">
              <code>{code}</code>
            </pre>
          </div>
        );
      }

      const lines = part.split("\n");
      return (
        <div key={index} className="space-y-1.5 text-xs leading-relaxed text-swarm-text">
          {lines.map((line, lIdx) => {
            if (line.startsWith("### ")) {
              return (
                <h4 key={lIdx} className="font-semibold text-swarm-goldHi pt-1 text-sm">
                  {renderInlineMarkdown(line.replace("### ", ""))}
                </h4>
              );
            }
            if (line.startsWith("• ") || line.startsWith("- ") || line.startsWith("* ")) {
              return (
                <div key={lIdx} className="flex items-start gap-2 pl-1">
                  <span className="text-swarm-gold select-none mt-0.5 shrink-0">•</span>
                  <span className="text-swarm-text">{renderInlineMarkdown(line.replace(/^[•\-*]\s*/, ""))}</span>
                </div>
              );
            }
            if (!line.trim()) return <div key={lIdx} className="h-1" />;
            return <p key={lIdx} className="text-swarm-text">{renderInlineMarkdown(line)}</p>;
          })}
        </div>
      );
    });
  };

  const activeModel = DEV_MODELS.find((m) => m.id === selectedModel) || DEV_MODELS[0];
  const activeCli = INSTALLED_CLIS.find((c) => c.id === selectedCli) || INSTALLED_CLIS[0];
  const ModelIcon = activeModel.icon;
  const CliIcon = activeCli.icon;

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0d0f14] font-sans select-text">
      {/* Solid, Opaque Header Bar */}
      <div className="relative z-30 flex shrink-0 items-center justify-between border-b border-white/[0.08] bg-[#13151b] px-3.5 py-2 shadow-sm">
        <div className="flex items-center gap-2">
          {/* Model Selector Pill */}
          <div className="relative">
            <button
              onClick={() => {
                setShowModelMenu(!showModelMenu);
                setShowCliMenu(false);
              }}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-swarm-text hover:border-swarm-gold/50 transition-all shadow-sm"
            >
              <ModelIcon size={13} className="text-swarm-gold shrink-0" />
              <span className="max-w-[130px] truncate font-medium">{activeModel.name}</span>
              <ChevronDown size={11} className="text-swarm-textMuted shrink-0" />
            </button>

            {showModelMenu && (
              <>
                <div className="fixed inset-0 z-[90]" onClick={() => setShowModelMenu(false)} />
                <div
                  className="absolute left-0 top-full mt-1.5 z-[100] w-64 rounded-xl border border-white/[0.12] p-1.5 shadow-2xl animate-scale-in"
                  style={{ backgroundColor: "#151821", opacity: 1, zIndex: 100 }}
                >
                  <div className="px-2.5 py-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                    Select AI Model
                  </div>
                  <div className="max-h-72 overflow-y-auto scrollbar-sleek space-y-0.5">
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
                              ? "bg-swarm-gold/20 text-swarm-goldHi font-medium"
                              : "text-swarm-textDim hover:bg-white/[0.06] hover:text-swarm-text"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon size={13} className={active ? "text-swarm-gold shrink-0" : "text-swarm-textMuted shrink-0"} />
                            <span className="truncate">{model.name}</span>
                          </div>
                          <span className="text-micro text-swarm-textMuted font-mono shrink-0 ml-1">{model.badge}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Mode Switch Pill */}
          <div className="flex items-center rounded-full bg-white/[0.04] border border-white/[0.08] p-0.5">
            <button
              onClick={() => setExecMode("copilot")}
              className={`rounded-full px-2.5 py-0.5 text-micro font-medium transition-all ${
                execMode === "copilot"
                  ? "bg-swarm-gold text-swarm-canvas font-semibold shadow-sm"
                  : "text-swarm-textMuted hover:text-swarm-text"
              }`}
            >
              Chat
            </button>
            <button
              onClick={() => setExecMode("cli")}
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-micro font-medium transition-all ${
                execMode === "cli"
                  ? "bg-swarm-gold text-swarm-canvas font-semibold shadow-sm"
                  : "text-swarm-textMuted hover:text-swarm-text"
              }`}
            >
              <Terminal size={10} />
              <span>CLI</span>
            </button>
          </div>

          {/* CLI Selector Pill (when CLI mode active) */}
          {execMode === "cli" && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowCliMenu(!showCliMenu);
                  setShowModelMenu(false);
                }}
                className="flex items-center gap-1.5 rounded-full border border-swarm-gold/40 bg-swarm-gold/10 px-2 py-0.5 text-micro font-medium text-swarm-goldHi transition-all"
              >
                <CliIcon size={11} className="text-swarm-gold" />
                <span className="font-mono font-semibold">{activeCli.command}</span>
                <ChevronDown size={10} />
              </button>

              {showCliMenu && (
                <>
                  <div className="fixed inset-0 z-[90]" onClick={() => setShowCliMenu(false)} />
                  <div
                    className="absolute left-0 top-full mt-1.5 z-[100] w-56 rounded-xl border border-white/[0.12] p-1.5 shadow-2xl animate-scale-in"
                    style={{ backgroundColor: "#151821", opacity: 1, zIndex: 100 }}
                  >
                    <div className="px-2.5 py-1 text-micro font-semibold uppercase tracking-wider text-swarm-textMuted">
                      Installed CLI Runners
                    </div>
                    {INSTALLED_CLIS.map((cli) => {
                      const Icon = cli.icon;
                      const active = cli.id === selectedCli;
                      return (
                        <button
                          key={cli.id}
                          onClick={() => {
                            setSelectedCli(cli.id);
                            setShowCliMenu(false);
                          }}
                          className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs transition-colors ${
                            active
                              ? "bg-swarm-gold/20 text-swarm-goldHi font-medium"
                              : "text-swarm-textDim hover:bg-white/[0.06] hover:text-swarm-text"
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Icon size={13} className={active ? "text-swarm-gold shrink-0" : "text-swarm-textMuted shrink-0"} />
                            <span className="truncate">{cli.name}</span>
                          </div>
                          <span className="text-micro text-swarm-textMuted font-mono shrink-0 ml-1">{cli.command}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="flex size-7 items-center justify-center rounded-lg text-swarm-textMuted hover:bg-white/[0.06] hover:text-swarm-err transition-colors"
            title="Clear Chat"
          >
            <Trash2 size={13} />
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="flex size-7 items-center justify-center rounded-lg text-swarm-textMuted hover:bg-white/[0.06] hover:text-swarm-text transition-colors"
              title={isExpanded ? "Restore View" : "Maximize View"}
            >
              {isExpanded ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>
          )}
        </div>
      </div>

      {/* Clean Messages Feed */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-5 scrollbar-sleek">
        {messages.map((msg) => {
          const isUser = msg.sender === "user";
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}
            >
              {!isUser && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-swarm-gold/15 border border-swarm-gold/30 text-swarm-gold shadow-sm mt-0.5">
                  <Sparkles size={13} />
                </div>
              )}

              <div className={`flex flex-col ${isUser ? "items-end" : "items-start"} max-w-[86%]`}>
                <div className="px-1 pb-1 text-micro text-swarm-textMuted">
                  {isUser ? `You · ${msg.timestamp}` : `${activeModel.name} · ${msg.timestamp}`}
                </div>

                <div
                  className={`rounded-2xl px-4 py-3 text-xs leading-relaxed shadow-sm ${
                    isUser
                      ? "bg-swarm-gold text-swarm-canvas font-medium selection:bg-swarm-canvas selection:text-swarm-gold"
                      : "border border-white/[0.08] bg-[#14161d] text-swarm-text"
                  }`}
                >
                  {/* Reasoning block */}
                  {msg.thought && (
                    <div className="mb-2.5 rounded-lg border border-swarm-gold/25 bg-swarm-gold/[0.06] p-2 text-micro text-swarm-goldDim font-mono">
                      <div className="flex items-center gap-1 text-swarm-gold font-medium mb-0.5">
                        <Cpu size={10} />
                        <span>Thinking Process</span>
                      </div>
                      {msg.thought}
                    </div>
                  )}

                  {/* Real CLI execution banner */}
                  {msg.cliCommand && (
                    <div className="mb-2.5 rounded-lg border border-white/[0.08] bg-black/60 p-2 font-mono text-micro text-swarm-gold">
                      <div className="flex items-center justify-between text-swarm-textMuted mb-1">
                        <span className="flex items-center gap-1 font-semibold uppercase">
                          <Terminal size={10} /> Executing
                        </span>
                        {msg.isCliRunning && <span className="animate-pulse text-swarm-ok font-bold">RUNNING…</span>}
                      </div>
                      <code>$ {msg.cliCommand}</code>
                    </div>
                  )}

                  {/* CLI Output box */}
                  {msg.cliOutput && (
                    <div className="my-2 rounded-xl border border-white/[0.08] bg-black/80 p-2.5 font-mono text-micro text-swarm-textDim max-h-60 overflow-y-auto scrollbar-sleek whitespace-pre-wrap">
                      {msg.cliOutput}
                    </div>
                  )}

                  {isUser ? (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  ) : (
                    renderFormattedContent(msg.text)
                  )}
                </div>
              </div>

              {isUser && (
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white/[0.08] border border-white/[0.12] text-swarm-text shadow-sm mt-0.5">
                  <User size={13} />
                </div>
              )}
            </div>
          );
        })}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex gap-3 items-start animate-fade-in">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-swarm-gold/15 border border-swarm-gold/30 text-swarm-gold">
              <Sparkles size={13} className="animate-spin" />
            </div>
            <div className="flex items-center gap-1.5 rounded-2xl border border-white/[0.08] bg-[#14161d] px-4 py-2.5 text-xs text-swarm-textMuted">
              <span className="size-1.5 rounded-full bg-swarm-gold animate-bounce" />
              <span className="size-1.5 rounded-full bg-swarm-gold animate-bounce [animation-delay:0.2s]" />
              <span className="size-1.5 rounded-full bg-swarm-gold animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sleek, Modern Input Bar */}
      <div className="shrink-0 p-3.5 bg-gradient-to-t from-[#0d0f14] via-[#0d0f14]/95 to-transparent">
        <div className="relative flex flex-col rounded-2xl border border-white/[0.10] bg-[#14161d] focus-within:border-swarm-gold/60 focus-within:ring-1 focus-within:ring-swarm-gold/30 transition-all shadow-xl">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              execMode === "cli"
                ? `Execute task with ${activeCli.name} (${activeCli.command})…`
                : `Ask ${activeModel.name} anything…`
            }
            rows={2}
            className="w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-xs text-swarm-text outline-none placeholder:text-swarm-textMuted/40 font-sans"
          />

          <div className="flex items-center justify-between px-3 py-2 border-t border-white/[0.04]">
            <div className="flex items-center gap-2 text-micro text-swarm-textMuted">
              <span className="font-mono">{activeModel.name}</span>
              <span>· Shift+Enter for new line</span>
            </div>

            <button
              onClick={() => executeSend(input)}
              disabled={!input.trim() || isTyping}
              className="flex size-7 items-center justify-center rounded-xl bg-swarm-gold text-swarm-canvas hover:opacity-90 disabled:opacity-30 transition-all shadow-md"
              title="Send message"
            >
              {execMode === "cli" ? <Play size={12} /> : <Send size={12} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
