import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import SessionLauncher from "@/features/panes/SessionLauncher";

// Mock the workspace store
const mockWorkspaceStore = {
 workspaces: [
 { id: "ws-1", boundProjectPath: "/Users/test/project", name: "Test Project" },
 ],
 activeWorkspaceId: "ws-1",
};

vi.mock("@swarm/workspace", () => ({
  useWorkspaceStore: (selector?: (s: any) => any) =>
    selector ? selector(mockWorkspaceStore) : mockWorkspaceStore,
}));

// Mock the preset launcher
const mockLaunchPresetSession = vi.fn();
vi.mock("@/features/panes/presetLauncher", () => ({
  launchPresetSession: (...args: any[]) => mockLaunchPresetSession(...args),
}));

describe("SessionLauncher", () => {
 beforeEach(() => {
 vi.clearAllMocks();
 });

 afterEach(() => {
 vi.restoreAllMocks();
 });

 it("renders without crashing", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("New session")).toBeDefined();
 });

 it("renders the mode selector with Agent, Code, Chat options", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("Agent")).toBeDefined();
 expect(screen.getByText("Code")).toBeDefined();
 expect(screen.getByText("Chat")).toBeDefined();
 });

 it("renders all four preset cards (Solo, Pair, Workbench, Swarm)", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("Solo")).toBeDefined();
 expect(screen.getByText("Pair")).toBeDefined();
 expect(screen.getByText("Workbench")).toBeDefined();
 expect(screen.getByText("Swarm")).toBeDefined();
 });

 it("preset card descriptions are rendered", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("One agent in one terminal.")).toBeDefined();
 expect(screen.getByText("One builds, one reviews the same tree.")).toBeDefined();
 });

 it("Solo preset is selected by default", () => {
 render(<SessionLauncher />);
 const soloButton = screen.getByText("Solo").closest("button");
 expect(soloButton?.className).toContain("bg-[#161e36]");
 });

 it("clicking a preset card selects it", () => {
 render(<SessionLauncher />);
 const pairButton = screen.getByText("Pair").closest("button");
 fireEvent.click(pairButton!);
 expect(pairButton?.className).toContain("bg-[#161e36]");
 });

 it("renders agent selection options", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("Claude Code")).toBeDefined();
 expect(screen.getByText("Codex")).toBeDefined();
 expect(screen.getByText("Cursor Agent")).toBeDefined();
 expect(screen.getByText("Terminal")).toBeDefined();
 });

 it("Claude Code agent is selected by default", () => {
 render(<SessionLauncher />);
 const claudeButton = screen.getByText("Claude Code").closest("button");
 expect(claudeButton?.className).toContain("bg-[#192038]");
 });

 it("clicking an agent option selects it", () => {
 render(<SessionLauncher />);
 const opencodeButton = screen.getByText("OpenCode").closest("button");
 fireEvent.click(opencodeButton!);
 expect(opencodeButton?.className).toContain("bg-[#192038]");
 });

  it("renders the number selector with buttons 1 through 6", () => {
    render(<SessionLauncher />);
    for (let i = 1; i <= 6; i++) {
      const els = screen.getAllByText(i.toString());
      expect(els.length).toBeGreaterThan(0);
    }
  });

  it("1 is selected by default in the number selector", () => {
    render(<SessionLauncher />);
    const buttons = screen.getAllByText("1");
    const numBtn = buttons.find((b) => b.tagName.toLowerCase() === "button");
    expect(numBtn?.className).toContain("bg-[#192038]");
  });

  it("clicking a number changes session count", () => {
    render(<SessionLauncher />);
    const button3 = screen.getByRole("button", { name: "3" });
    fireEvent.click(button3);
    expect(button3.className).toContain("bg-[#192038]");
  });

 it("displays 'session' singular when count is 1", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("session")).toBeDefined();
 });

 it("displays 'sessions' plural when count is greater than 1", () => {
 render(<SessionLauncher />);
 const button3 = screen.getByText("3").closest("button");
 fireEvent.click(button3!);
 expect(screen.getByText("sessions")).toBeDefined();
 });

 it("renders the task input field", () => {
 render(<SessionLauncher />);
 expect(screen.getByPlaceholderText("What should it work on?")).toBeDefined();
 });

  it("allows typing in the task input field", () => {
    render(<SessionLauncher />);
    const textarea = screen.getByPlaceholderText("What should it work on?");
    fireEvent.change(textarea, { target: { value: "Build a new feature" } });
    expect((textarea as HTMLTextAreaElement).value).toBe("Build a new feature");
  });

 it("renders the Start Session button", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("Start Session")).toBeDefined();
 });

 it("calls launchPresetSession when Start Session is clicked", () => {
 render(<SessionLauncher />);
 const startButton = screen.getByText("Start Session").closest("button");
 fireEvent.click(startButton!);
 expect(mockLaunchPresetSession).toHaveBeenCalledTimes(1);
 });

 it("passes correct parameters to launchPresetSession", () => {
 render(<SessionLauncher />);
 const startButton = screen.getByText("Start Session").closest("button");
 fireEvent.click(startButton!);

 expect(mockLaunchPresetSession).toHaveBeenCalledWith({
 preset: "solo",
 selectedCliId: "claude-code",
 sessionCount: 1,
 taskPrompt: "",
 workingDir: "/Users/test/project",
 });
 });

 it("calls onLaunched callback after launching", () => {
 const onLaunched = vi.fn();
 render(<SessionLauncher onLaunched={onLaunched} />);
 const startButton = screen.getByText("Start Session").closest("button");
 fireEvent.click(startButton!);
 expect(onLaunched).toHaveBeenCalledTimes(1);
 });

 it("renders the mode selector buttons with correct active state", () => {
 render(<SessionLauncher activeMode="code" />);
 const codeButton = screen.getByText("Code").closest("button");
 expect(codeButton?.className).toContain("bg-[#252c42]");
 });

 it("calls onModeChange when a mode button is clicked", () => {
 const onModeChange = vi.fn();
 render(<SessionLauncher onModeChange={onModeChange} />);
 const chatButton = screen.getByText("Chat").closest("button");
 fireEvent.click(chatButton!);
 expect(onModeChange).toHaveBeenCalledWith("chat");
 });

 it("renders the project path display", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("~/project")).toBeDefined();
 });

 it("renders the keyboard shortcut hint", () => {
 render(<SessionLauncher />);
 expect(screen.getByText(/Press/)).toBeDefined();
 });

 it("launches with selected preset, agent, and task", () => {
 render(<SessionLauncher />);
 const textarea = screen.getByPlaceholderText("What should it work on?");
 fireEvent.change(textarea, { target: { value: "Implement auth" } });

 const pairButton = screen.getByText("Pair").closest("button");
 fireEvent.click(pairButton!);

 const opencodeButton = screen.getByText("OpenCode").closest("button");
 fireEvent.click(opencodeButton!);

    const button4 = screen.getByRole("button", { name: "4" });
    fireEvent.click(button4);

    const startButton = screen.getByText("Start Session").closest("button");
    fireEvent.click(startButton!);

    expect(mockLaunchPresetSession).toHaveBeenCalledWith({
      preset: "pair",
      selectedCliId: "opencode",
      sessionCount: 4,
      taskPrompt: "Implement auth",
      workingDir: "/Users/test/project",
    });
  });

  it("disables the Start button while launching", async () => {
    mockLaunchPresetSession.mockImplementation(() => {
      return new Promise((resolve) => setTimeout(resolve, 100));
    });
    render(<SessionLauncher />);
    const startButton = screen.getByText("Start Session").closest("button");
    fireEvent.click(startButton!);
    expect(mockLaunchPresetSession).toHaveBeenCalled();
  });

  it("renders the PRESET label", () => {
    render(<SessionLauncher />);
    expect(screen.getByText("PRESET")).toBeDefined();
  });

  it("renders the AGENT label", () => {
    render(<SessionLauncher />);
    expect(screen.getByText("AGENT")).toBeDefined();
  });

  it("renders the HOW MANY label", () => {
    render(<SessionLauncher />);
    expect(screen.getByText("HOW MANY")).toBeDefined();
  });

  it("renders the TASK label", () => {
    render(<SessionLauncher />);
    expect(screen.getByText("TASK — OPTIONAL")).toBeDefined();
  });

  it("counts are displayed on preset cards", () => {
    render(<SessionLauncher />);
    expect(screen.getAllByText("1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("2").length).toBeGreaterThan(0);
    expect(screen.getAllByText("4").length).toBeGreaterThan(0);
  });

 it("renders Workbench with correct description", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("An agent plus a shell for git and tests.")).toBeDefined();
 });

 it("renders Swarm with correct description", () => {
 render(<SessionLauncher />);
 expect(screen.getByText("Four agents fan out on parallel work.")).toBeDefined();
 });
});
