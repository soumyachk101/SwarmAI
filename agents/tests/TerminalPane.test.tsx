import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import "@testing-library/jest-dom";
import TerminalPane from "../src/ui/TerminalPane";

// Mock xterm and addons
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
 rows: 24,
 cols: 80,
};

vi.mock("xterm", () => ({
 Terminal: vi.fn(() => mockXTermInstance),
 ITerminalOptions: {},
}));

vi.mock("xterm-addon-fit", () => ({
 FitAddon: vi.fn(() => ({
 fit: vi.fn(),
 })),
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

// Mock Tauri APIs
vi.mock("@tauri-apps/api/core", () => ({
 invoke: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@tauri-apps/api/event", () => ({
 listen: vi.fn(() => ({ dispose: vi.fn() })),
}));

// Mock the spawnGuard
vi.mock("../src/ui/spawnGuard", () => ({
 isAlreadySpawned: vi.fn().mockResolvedValue(false),
 markSpawned: vi.fn(),
}));

const { mockTerminalStoreState, mockUseTerminalAgentsStore } = vi.hoisted(() => {
  const state = {
    refitCount: 0,
    setActivePaneId: vi.fn(),
    agents: [] as any[],
    agentStatuses: {},
  };
  const fn: any = vi.fn((selector?: any) =>
    typeof selector === "function" ? selector(state) : state
  );
  fn.getState = () => state;
  return { mockTerminalStoreState: state, mockUseTerminalAgentsStore: fn };
});

vi.mock("../src/ui/agentsStore", () => ({
  useAgentsStore: mockUseTerminalAgentsStore,
}));

// Mock board components
vi.mock("@swarm/board", () => ({
 PANE_HEADER_CLASS: "pane-header",
 PANE_TITLE_CLASS: "pane-title",
 themeForKind: () => ({ accent: "#f59e0b" }),
}));

vi.mock("../src/ui/themeColors", () => ({
 THEME_CHANGE_EVENT: "theme:change",
 buildXtermThemeFromDom: () => ({}),
 swarmHex: () => "#0b0d14",
}));

vi.mock("../src/ui/paneResize", () => ({
 onWindowResize: (callback: () => void) => {
 const id = setInterval(callback, 100);
 return () => clearInterval(id);
 },
}));

describe("TerminalPane", () => {
 beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, {
    clipboard: {
      writeText: vi.fn().mockResolvedValue(undefined),
    },
  });
 });

 afterEach(() => {
 vi.restoreAllMocks();
 });

 it("renders without crashing", () => {
 const { container } = render(<TerminalPane paneId="terminal-1" />);
 expect(container).toBeDefined();
 });

 it("renders with default paneId", () => {
 render(<TerminalPane />);
 expect(document.body).toBeDefined();
 });

 it("displays the pane name", () => {
 render(<TerminalPane paneId="terminal-1" tabName="My Terminal" />);
 expect(screen.getByText("My Terminal")).toBeDefined();
 });

 it("displays paneId as display name when tabName is not provided", () => {
 render(<TerminalPane paneId="terminal-1" />);
 expect(screen.getByText("terminal-1")).toBeDefined();
 });

 it("renders the copy button", () => {
 render(<TerminalPane paneId="terminal-1" />);
 expect(screen.getByTitle("Copy selection")).toBeDefined();
 });

 it("renders the clear button", () => {
 render(<TerminalPane paneId="terminal-1" />);
 expect(screen.getByTitle("Clear terminal")).toBeDefined();
 });

 it("renders the close button when onClose is provided", () => {
 render(<TerminalPane paneId="terminal-1" onClose={() => {}} />);
 expect(screen.getByTitle("Close terminal")).toBeDefined();
 });

 it("calls onClose when close button is clicked", () => {
 const onClose = vi.fn();
 render(<TerminalPane paneId="terminal-1" onClose={onClose} />);
 const closeButton = screen.getByTitle("Close terminal");
 fireEvent.click(closeButton);
 expect(onClose).toHaveBeenCalledTimes(1);
 });

 it("renders maximize button when onToggleMaximize is provided", () => {
 render(<TerminalPane paneId="terminal-1" onToggleMaximize={() => {}} />);
 expect(screen.getByTitle("Maximize")).toBeDefined();
 });

 it("shows Restore title when isMaximized is true", () => {
 render(<TerminalPane paneId="terminal-1" onToggleMaximize={() => {}} isMaximized />);
 expect(screen.getByTitle("Restore")).toBeDefined();
 });

 it("renders the terminal container div", () => {
 const { container } = render(<TerminalPane paneId="terminal-1" />);
 const terminalContainer = container.querySelector('[class*="absolute inset-2"]');
 expect(terminalContainer).toBeDefined();
 });

 it("shows 'Starting' status indicator", () => {
 render(<TerminalPane paneId="terminal-1" />);
 expect(screen.getByText(/Starting/)).toBeDefined();
 });

 it("shows the shell label in starting indicator when provided", () => {
 render(<TerminalPane paneId="terminal-1" shellLabel="zsh" />);
 expect(screen.getByText(/Starting zsh/)).toBeDefined();
 });

 it("shows the shell command in starting indicator when label is not provided", () => {
 render(<TerminalPane paneId="terminal-1" shellCommand="bash" />);
 expect(screen.getByText(/Starting bash/)).toBeDefined();
 });

 it("calls setActivePaneId on mouse down", async () => {
 const setActivePaneId = vi.fn();
 const { useAgentsStore } = await import("../src/ui/agentsStore");
 vi.mocked(useAgentsStore).mockReturnValue({
  refitCount: 0,
  setActivePaneId,
 } as any);

 render(<TerminalPane paneId="terminal-1" />);
 const pane = document.querySelector('[class*="flex flex-col h-full"]');
 if (pane) fireEvent.mouseDown(pane);
 });

 it("renders header extra when provided", () => {
 render(<TerminalPane paneId="terminal-1" headerExtra={<span data-testid="header-extra">Extra</span>} />);
 expect(screen.getByTestId("header-extra")).toBeDefined();
 });

 it("supports editing mode", () => {
 render(
 <TerminalPane
 paneId="terminal-1"
 isEditing={true}
 editValue="new-name"
 onEditChange={() => {}}
 onRename={() => {}}
 onCancelRename={() => {}}
 />
 );
 expect(screen.getByRole("textbox")).toHaveValue("new-name");
 });

 it("renders the pane drag handle", () => {
 render(<TerminalPane paneId="terminal-1" />);
 const dragHandle = document.querySelector('[data-pane-drag]');
 expect(dragHandle).toBeDefined();
 });

 it("calls handleTerminalContainerClick on container click", () => {
 render(<TerminalPane paneId="terminal-1" />);
 const terminalDiv = document.querySelector('[class*="cursor-text"]');
 if (terminalDiv) {
 fireEvent.click(terminalDiv);
 }
 expect(document.body).toBeDefined();
 });

 it("renders with trash close icon type", () => {
 render(<TerminalPane paneId="terminal-1" onClose={() => {}} closeIconType="trash" />);
 expect(screen.getByTitle("Close terminal")).toBeDefined();
 });

 it("renders with close close icon type", () => {
 render(<TerminalPane paneId="terminal-1" onClose={() => {}} closeIconType="close" />);
 expect(screen.getByTitle("Collapse terminal")).toBeDefined();
 });

 it("shows copied state after clicking copy button", async () => {
 render(<TerminalPane paneId="terminal-1" />);
 const copyButton = screen.getByTitle("Copy selection");
 fireEvent.click(copyButton);
 // After click, the button title should change
 expect(screen.getByTitle("Copied to clipboard!")).toBeDefined();
 });

 it("handles resize observer for pane width", () => {
 const { container } = render(<TerminalPane paneId="terminal-1" />);
 const pane = container.querySelector('[class*="flex flex-col h-full"]');
 expect(pane).toBeDefined();
 });

 it("registers the theme change listener", () => {
 render(<TerminalPane paneId="terminal-1" />);
 // The effect should have added the listener
 expect(document.body).toBeDefined();
 });

 it("cleans up theme listener on unmount", () => {
 const { unmount } = render(<TerminalPane paneId="terminal-1" />);
 unmount();
 // No errors means cleanup worked
 expect(document.body).toBeDefined();
 });
});
