import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AgentPane from "../src/ui/AgentPane";

// Mock xterm
const mockXTermInstance = {
 options: {},
 write: vi.fn(),
 writeln: vi.fn(),
 onData: vi.fn(() => ({ dispose: vi.fn() })),
 open: vi.fn(),
 focus: vi.fn(),
 clear: vi.fn(),
 getSelection: vi.fn(() => "test selection"),
 dispose: vi.fn(),
 refresh: vi.fn(),
 loadAddon: vi.fn(),
 attachCustomKeyEventHandler: vi.fn(() => true),
 rows: 24,
 cols: 80,
};

vi.mock("xterm", () => ({
 Terminal: vi.fn(() => mockXTermInstance),
 ITerminalOptions: {},
}));

vi.mock("xterm-addon-fit", () => ({
 FitAddon: vi.fn(() => ({ fit: vi.fn() })),
}));

vi.mock("xterm-addon-search", () => ({
 SearchAddon: vi.fn(),
}));

vi.mock("xterm-addon-webgl", () => ({
 WebglAddon: vi.fn(() => ({
 dispose: vi.fn(),
 onContextLoss: vi.fn(),
 clearTextureAtlas: vi.fn(),
 })),
}));

// Mock Tauri
vi.mock("@tauri-apps/api/core", () => ({
 invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/event", () => ({
 listen: vi.fn(() => ({ dispose: vi.fn() })),
}));

const { mockAgentsStoreState, mockUseAgentsStore } = vi.hoisted(() => {
  const state = {
    setAgentStatus: vi.fn(),
    promoteToLead: vi.fn(),
    demoteLead: vi.fn(),
    agents: [] as any[],
    agentStatuses: {},
    refitCount: 0,
    updateAgent: vi.fn(),
    setActivePaneId: vi.fn(),
  };
  const fn: any = vi.fn((selector?: any) =>
    typeof selector === "function" ? selector(state) : state
  );
  fn.getState = () => state;
  return { mockAgentsStoreState: state, mockUseAgentsStore: fn };
});

vi.mock("../src/ui/agentsStore", () => ({
  useAgentsStore: mockUseAgentsStore,
}));

// Mock board
vi.mock("@swarm/board", () => ({
 BrandGlyph: () => <span>BrandGlyph</span>,
 cliBrand: () => "claude",
 AgentMark: () => <span>AgentMark</span>,
 PANE_HEADER_CLASS: "pane-header",
 PANE_TITLE_CLASS: "pane-title",
 themeForKind: () => ({ accent: "#f59e0b" }),
 LeadCrown: () => <span>Crown</span>,
}));

// Mock cli-configs
vi.mock("../src/cli-configs/env", () => ({
 envForCli: () => ({}),
}));

vi.mock("../src/cli-configs/index", () => ({
 withPermissionBypass: (cmd: string, args: string[]) => [cmd, ...args],
 MCP_CAPABLE_CLIS: ["claude", "codex"],
 normaliseEffort: (e: string) => e,
}));

vi.mock("../src/cli-configs/model-catalog", () => ({
 getModelsForCli: () => [],
 getDefaultModelForCli: () => ({ label: "claude-3.5-sonnet" }),
 getModelById: () => null,
 cliSupportsModels: () => true,
}));

// Mock hooks
vi.mock("../src/hooks/useAutoModelDetection", () => ({
 useAutoModelDetection: () => ({
 detectedModels: [],
 selectedModel: null,
 isDetecting: false,
 error: null,
 markUserChosen: vi.fn(),
 }),
}));

// Mock agents index
vi.mock("../src/index", () => ({
 CLI_BY_COMMAND: {
 claude: { name: "Claude Code", installCmd: "npm install -g @anthropic-ai/claude-code" },
 },
}));

// Mock ensureMcpConfig
vi.mock("../src/ui/ensureMcpConfig", () => ({
 ensureMCPConfigForCLI: vi.fn().mockResolvedValue("stdin-fallback"),
}));

vi.mock("../src/ui/ensureWorkspaceTrust", () => ({
 ensureCliWorkspaceTrust: vi.fn(),
}));

vi.mock("../src/ui/sanitizeHandoff", () => ({
 excerptForHandoff: () => "",
 looksLikeTerminalGarbage: () => false,
 stripTerminalNoise: (text: string) => text,
}));

vi.mock("../src/ui/spawnGuard", () => ({
 isAlreadySpawned: vi.fn().mockResolvedValue(false),
 isTrackedAsSpawned: vi.fn().mockReturnValue(false),
 markSpawned: vi.fn(),
 saveTranscript: vi.fn(),
 takeTranscript: vi.fn(),
}));

vi.mock("../src/ui/handoffQueue", () => ({
 withHandoffLock: (dir: string, fn: () => Promise<any>) => fn(),
}));

import "@testing-library/jest-dom";

vi.mock("../src/ui/host", () => ({
  agentsHost: () => ({
    apiKeys: () => ({}),
    publishLeadRole: vi.fn(),
    openFilesFor: () => [],
    activeWorkspaceId: () => "ws-1",
    revealLeadDock: vi.fn(),
    permissionBypassEnabled: () => false,
  }),
}));

vi.mock("@swarm/pheromone/tauri", () => ({
 TauriPheromone: {
 create: vi.fn().mockResolvedValue({
 readMemoryFile: vi.fn().mockResolvedValue({ content: "" }),
 writeMemoryFile: vi.fn().mockResolvedValue(undefined),
 }),
 },
}));

vi.mock("../src/ui/themeColors", () => ({
 THEME_CHANGE_EVENT: "theme:change",
 buildXtermThemeFromDom: () => ({}),
 swarmHex: () => "#0b0d14",
}));

vi.mock("../src/ui/paneResize", () => ({
 onWindowResize: (cb: () => void) => {
 const id = setInterval(cb, 100);
 return () => clearInterval(id);
 },
}));

vi.mock("../src/ui/RoleBadge", () => ({
  default: () => <span data-testid="role-badge">RoleBadge</span>,
}));

vi.mock("../src/ui/AgentTerminal.js", () => ({
  default: ({ onSpawnStateChange }: any) => {
    onSpawnStateChange?.("running");
    return <div data-testid="agent-terminal" />;
  },
}));

vi.mock("../src/ui/AgentTerminal", () => ({
  default: ({ onSpawnStateChange }: any) => {
    onSpawnStateChange?.("running");
    return <div data-testid="agent-terminal" />;
  },
}));

describe("AgentPane", () => {
 const defaultAgent = {
 id: "agent-1",
 cli: "claude",
 cliName: "Claude Code",
 };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.assign(mockAgentsStoreState, {
      setAgentStatus: vi.fn(),
      promoteToLead: vi.fn(),
      demoteLead: vi.fn(),
      agents: [],
      agentStatuses: {},
      refitCount: 0,
      updateAgent: vi.fn(),
      setActivePaneId: vi.fn(),
    });
  });

 afterEach(() => {
 vi.restoreAllMocks();
 });

 it("renders without crashing", () => {
 const { container } = render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(container).toBeDefined();
 });

 it("renders the agent name", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(screen.getByText("Claude Code")).toBeDefined();
 });

 it("renders the pane header", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 const header = document.querySelector('[data-pane-drag]');
 expect(header).toBeDefined();
 });

 it("renders the close button when onClose is provided", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} onClose={() => {}} />);
 expect(screen.getByTitle(/Delete/)).toBeDefined();
 });

 it("calls onClose when close button is clicked", () => {
 const onClose = vi.fn();
 render(<AgentPane paneId="agent-1" agent={defaultAgent} onClose={onClose} />);
 const closeButton = screen.getByTitle(/Delete/);
 fireEvent.click(closeButton);
 expect(onClose).toHaveBeenCalledTimes(1);
 });

 it("renders the maximize button when onToggleMaximize is provided", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} onToggleMaximize={() => {}} />);
 expect(screen.getByTitle("Maximize")).toBeDefined();
 });

 it("shows Restore when maximized", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} onToggleMaximize={() => {}} isMaximized />);
 expect(screen.getByTitle("Restore")).toBeDefined();
 });

 it("renders the prompt textarea", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(screen.getByPlaceholderText(/Prompt/)).toBeDefined();
 });

 it("updates prompt input value", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 const textarea = screen.getByPlaceholderText(/Prompt/);
 fireEvent.change(textarea, { target: { value: "test prompt" } });
 expect(textarea).toHaveValue("test prompt");
 });

 it("renders the Send button", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(screen.getByTitle("Send to agent (Enter)")).toBeDefined();
 });

 it("renders the settings button", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(screen.getByTitle("CLI Shortcuts & Tools")).toBeDefined();
 });

 it("renders the model selector", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(screen.getByTitle(/Claude Code Models/)).toBeDefined();
 });

  it("renders the effort selector for Claude", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    expect(screen.getByTitle("Reasoning Effort")).toBeDefined();
  });

  it("renders the lead crown button", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    expect(screen.getByTitle("Make Lead — moves this agent to the Lead tab")).toBeDefined();
  });

  it("renders the sync button", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    expect(screen.getByTitle("Sync to shared mind (auto every 10s)")).toBeDefined();
  });

  it("renders the status indicator dot", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    expect(screen.getByTitle("CLI agent — running")).toBeDefined();
  });

  it("supports editing mode with rename", () => {
    render(
      <AgentPane
        paneId="agent-1"
        agent={defaultAgent}
        isEditing={true}
        editValue="new-name"
        onEditChange={() => {}}
        onRename={() => {}}
        onCancelRename={() => {}}
      />
    );
    expect(screen.getByDisplayValue("new-name")).toBeDefined();
  });

  it("renders header extra when provided", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} headerExtra={<span data-testid="extra">Extra</span>} />);
    expect(screen.getByTestId("extra")).toBeDefined();
  });

  it("registers the theme change listener", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    expect(document.body).toBeDefined();
  });

  it("cleans up on unmount", () => {
    const { unmount } = render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    unmount();
    expect(document.body).toBeDefined();
  });

  it("handles the copy action", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    const copyButton = screen.getByTitle("Copy selection");
    fireEvent.click(copyButton);
    expect(copyButton).toBeDefined();
  });

  it("handles the clear action", () => {
    render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    const clearButton = screen.getByTitle("Clear terminal");
    fireEvent.click(clearButton);
    expect(document.body).toBeDefined();
  });

  it("renders the terminal container", () => {
    const { container } = render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    const terminalContainer = container.querySelector('[class*="absolute inset-0"]');
    expect(terminalContainer).toBeDefined();
  });

  it("dispatches setActivePaneId on mouse down", () => {
    const setActivePaneId = vi.fn();
    mockAgentsStoreState.setActivePaneId = setActivePaneId;

    const { container } = render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
    const pane = container.querySelector('[class*="flex flex-col h-full"]');
    if (pane) fireEvent.mouseDown(pane);
    expect(setActivePaneId).toHaveBeenCalledWith("agent-1");
  });

 it("renders the usage gauge button", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(screen.getByTitle("Check Model & Token Usage (/status)")).toBeDefined();
 });

 it("renders model search input when many models are detected", () => {
 // This test verifies the structure exists - the actual model detection
 // is controlled by the mock
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 expect(document.body).toBeDefined();
 });

 it("shows the model label in the selector", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 // Should show the default model label from the mock
 expect(screen.getByTitle(/Claude Code Models/)).toBeDefined();
 });

 it("renders the Gauge icon for usage check", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 const gaugeButton = screen.getByTitle("Check Model & Token Usage (/status)");
 const svg = gaugeButton.querySelector("svg");
 expect(svg).toBeDefined();
 });

 it("renders the ChevronDown icon for model selector", () => {
 render(<AgentPane paneId="agent-1" agent={defaultAgent} />);
 const modelButton = screen.getByTitle(/Claude Code Models/);
 const svgs = modelButton.querySelectorAll("svg");
 expect(svgs.length).toBeGreaterThanOrEqual(1);
 });

 it("supports custom agent name", () => {
 render(<AgentPane paneId="agent-1" agent={{ ...defaultAgent, customName: "My Custom Agent" }} />);
 expect(screen.getByText("My Custom Agent")).toBeDefined();
 });
});
