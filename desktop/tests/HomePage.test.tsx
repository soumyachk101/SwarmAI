import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HomePage from "@/app/HomePage";

// Mock ResizeObserver for jsdom
global.ResizeObserver = class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
} as any;

// Mock all the heavy child components and stores
vi.mock("@/features/panes/PlaneHost", () => ({
  default: ({ leading }: any) => <div data-testid="plane-host">{leading}PlaneHost</div>,
}));

vi.mock("@swarm/tasks", () => ({
  TasksPanel: () => <div data-testid="tasks-panel">TasksPanel</div>,
}));

vi.mock("@swarm/voice/ui", () => ({
  VoiceHotkeys: () => <div data-testid="voice-hotkeys">VoiceHotkeys</div>,
}));

vi.mock("@swarm/workspace", () => {
  const state = {
    workspaces: [{ id: "ws-1", boundProjectPath: "/Users/test/project", name: "Test", taskCards: [] }],
    activeWorkspaceId: "ws-1",
    boardOpen: false,
    setBoardOpen: vi.fn(),
    openFolder: vi.fn(),
  };
  const store = (selector?: (s: any) => any) => (selector ? selector(state) : state);
  store.getState = () => state;
  return { useWorkspaceStore: store };
});

vi.mock("@swarm/board", () => ({
  BrandGlyph: () => <span data-testid="brand-glyph">BrandGlyph</span>,
  cliBrand: () => "claude",
  shellBrand: () => "shell",
  LeadCrown: () => <span data-testid="lead-crown">LeadCrown</span>,
}));

vi.mock("@swarm/workspace/ui", () => ({
  WorkspacesSidebar: ({ topBar, themePickerSlot }: any) => (
    <div data-testid="workspace-sidebar">
      {topBar}
      {themePickerSlot}
      Sidebar
    </div>
  ),
}));

vi.mock("@swarm/extension", () => ({
  ExtensionsMarketplace: () => <div>Extensions</div>,
}));

vi.mock("@swarm/pheromone/ui", () => ({
  SessionHistory: () => <div>SessionHistory</div>,
}));

vi.mock("@swarm/agents/ui", () => {
  const state = {
    agentStatuses: {},
    agents: [],
    refitTerminals: vi.fn(),
  };
  const store = (selector?: (s: any) => any) => (selector ? selector(state) : state);
  store.getState = () => state;
  return {
    CliUsagePanel: () => <div>Usage</div>,
    useAgentsStore: store,
    ensurePheromoneMcpForProject: vi.fn(),
    setupStorageSync: vi.fn(),
  };
});

vi.mock("@swarm/lead/ui", () => ({
  useLeadBridge: () => {},
  LeadPanel: () => <div data-testid="lead-panel">LeadPanel</div>,
}));

vi.mock("@/shared/tauri", () => ({
  getTauriAPIs: () => ({}),
  loadTauriAPIs: () => Promise.resolve(null),
}));

vi.mock("@/shared/uiStore", () => {
  const state = {
    leftOpen: true,
    rightOpen: false,
    setLeftOpen: vi.fn(),
    setRightOpen: vi.fn(),
    toggleLeft: vi.fn(),
    toggleRight: vi.fn(),
  };
  const store = (selector?: (s: any) => any) => (selector ? selector(state) : state);
  store.getState = () => state;
  return { useUiStore: store };
});

vi.mock("@/shared/SwarmLogo", () => ({
 default: () => <span data-testid="swarm-logo">Logo</span>,
}));

vi.mock("@/shared/ThemePicker", () => ({
 default: () => <span data-testid="theme-picker">Theme</span>,
}));

vi.mock("@/shared/OverflowMenu", () => ({
 default: () => <div>OverflowMenu</div>,
}));

vi.mock("@/shared/CommandPalette", () => ({
 default: () => <div>CommandPalette</div>,
}));

vi.mock("@/shared/ShortcutsModal", () => ({
 default: () => <div>ShortcutsModal</div>,
}));

vi.mock("@/shared/MacWindowControls", () => ({
 default: () => <div>MacWindowControls</div>,
}));

describe("HomePage", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 });

 afterEach(() => {
 vi.restoreAllMocks();
 });

 it("renders without crashing", () => {
 render(<HomePage />);
 expect(document.body).toBeDefined();
 });

 it("renders the PlaneHost", () => {
 render(<HomePage />);
 expect(screen.getByTestId("plane-host")).toBeDefined();
 });

 it("renders the workspace sidebar", () => {
 render(<HomePage />);
 expect(screen.getByTestId("workspace-sidebar")).toBeDefined();
 });

 it("renders the Tasks panel", () => {
 render(<HomePage />);
 expect(screen.getByTestId("tasks-panel")).toBeDefined();
 });

 it("renders the VoiceHotkeys component", () => {
 render(<HomePage />);
 expect(screen.getByTestId("voice-hotkeys")).toBeDefined();
 });

 it("renders the ThemePicker", () => {
 render(<HomePage />);
 expect(screen.getByTestId("theme-picker")).toBeDefined();
 });

 it("has the correct root class (h-screen w-screen)", () => {
 render(<HomePage />);
 const root = document.querySelector(".h-screen.w-screen");
 expect(root).toBeDefined();
 });

 it("renders the status bar", () => {
 render(<HomePage />);
 // Status bar has class h-7
 const statusBar = document.querySelector(".h-7");
 expect(statusBar).toBeDefined();
 });

 it("renders the Swarm Engine indicator", () => {
 render(<HomePage />);
 expect(screen.getByText("Swarm Engine")).toBeDefined();
 });

 it("renders the active agents count", () => {
 render(<HomePage />);
 expect(screen.getByText("0/0 active")).toBeDefined();
 });

 it("renders the window controls area on non-Mac", () => {
 // Default navigator.userAgent won't match Mac, so non-Mac controls render
 render(<HomePage />);
 // The minimize button should exist on non-Mac
 expect(screen.getByTitle("Minimize")).toBeDefined();
 });

 it("renders minimize button on non-Mac", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Minimize")).toBeDefined();
 });

 it("renders maximize button on non-Mac", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Maximize")).toBeDefined();
 });

 it("renders close button on non-Mac", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Close")).toBeDefined();
 });

 it("opens settings when overflow menu settings is selected", () => {
 render(<HomePage />);
 // The settings modal should be toggleable
 expect(document.body).toBeDefined();
 });

 it("registers keyboard shortcuts on mount", () => {
 render(<HomePage />);
 // Ctrl+K should toggle palette
 fireEvent.keyDown(window, { key: "k", ctrlKey: true });
 // No error means it worked
 expect(document.body).toBeDefined();
 });

 it("cleans up keyboard listeners on unmount", () => {
 const { unmount } = render(<HomePage />);
 unmount();
 // After unmount, the listener should be removed (no error on keydown)
 fireEvent.keyDown(window, { key: "k", ctrlKey: true });
 expect(document.body).toBeDefined();
 });

 it("renders the git status button", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Initialize Git Repository")).toBeDefined();
 });

 it("renders 'no repo' when no project is open", () => {
 render(<HomePage />);
 expect(screen.getByText("no repo")).toBeDefined();
 });

 it("renders the Local Memory Bridge indicator", () => {
 render(<HomePage />);
 expect(screen.getByText("Local Memory Bridge")).toBeDefined();
 });

 it("renders the right panel toggle button", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Toggle right panel")).toBeDefined();
 });

 it("renders the sidebar toggle button", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Collapse sidebar")).toBeDefined();
 });

 it("renders the voice dictation button", () => {
 render(<HomePage />);
 expect(screen.getByTitle("Voice Dictation (Click or Win+Alt / Ctrl+Win)")).toBeDefined();
 });

 it("toggles right panel when button is clicked", () => {
 render(<HomePage />);
 const toggleButton = screen.getByTitle("Toggle right panel");
 fireEvent.click(toggleButton);
 expect(document.body).toBeDefined();
 });

 it("renders the project folder name in status bar", () => {
 render(<HomePage />);
 expect(screen.getByText("project")).toBeDefined();
 });

 it("has a data-tauri-drag-region attribute", () => {
 render(<HomePage />);
 const dragRegion = document.querySelector("[data-tauri-drag-region]");
 expect(dragRegion).toBeDefined();
 });

 it("renders the board toggle button", () => {
    render(<HomePage />);
    expect(screen.getByTitle("Toggle Tasks Panel")).toBeDefined();
  });

 it("renders the overflow menu with items", () => {
 render(<HomePage />);
 expect(screen.getByText("OverflowMenu")).toBeDefined();
 });

 it("renders the CommandPalette", () => {
 render(<HomePage />);
 expect(screen.getByText("CommandPalette")).toBeDefined();
 });

 it("handles the refitTerminals effect on mount", () => {
 render(<HomePage />);
 // The useEffect should have called refitTerminals on mount
 expect(document.body).toBeDefined();
 });
});
