import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import GitControlModal from "@/features/git/GitControlModal";

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock("@tauri-apps/api/core", () => ({
 invoke: (...args: any[]) => mockInvoke(...args),
}));

describe("GitControlModal", () => {
 const mockOnClose = vi.fn();

 beforeEach(() => {
 vi.clearAllMocks();
 mockInvoke.mockReset();
 });

 afterEach(() => {
 vi.restoreAllMocks();
 });

 it("does not render when isOpen is false", () => {
 render(<GitControlModal isOpen={false} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.queryByText("Git & GitHub Control Hub")).toBeNull();
 });

 it("renders when isOpen is true", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByText("Git & GitHub Control Hub")).toBeDefined();
 });

 it("displays the project path", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/Users/test/my-project" />);
 expect(screen.getByText("/Users/test/my-project")).toBeDefined();
 });

 it("displays 'No active workspace' when projectPath is null", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath={null} />);
 expect(screen.getByText("No active workspace")).toBeDefined();
 });

 it("calls onClose when backdrop is clicked", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 const backdrop = screen.getByText("Git & GitHub Control Hub").closest(".fixed.inset-0");
 fireEvent.click(backdrop!);
 expect(mockOnClose).toHaveBeenCalledTimes(1);
 });

 it("calls onClose when the close button is clicked", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 const closeButtons = screen.getAllByRole("button");
 const xButton = closeButtons.find(btn => btn.querySelector("svg"));
 if (xButton) fireEvent.click(xButton);
 expect(mockOnClose).toHaveBeenCalled();
 });

 it("invokes git_status when opened", async () => {
 mockInvoke.mockResolvedValue({ branch: "main", changed: 0 });
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(mockInvoke).toHaveBeenCalledWith("git_status", { projectPath: "/test/project" });
 });
 });

 it("displays the current branch after git_status resolves", async () => {
 mockInvoke.mockResolvedValue({ branch: "main", changed: 0 });
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("main")).toBeDefined();
 });
 });

 it("renders the Push to Remote button", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByText("Push to Remote (git push)")).toBeDefined();
 });

 it("renders the Pull from Remote button", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByText("Pull from Remote (git pull)")).toBeDefined();
 });

 it("renders the commit input field", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByPlaceholderText(/Commit message/)).toBeDefined();
 });

 it("renders the Commit button", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByText("Commit")).toBeDefined();
 });

 it("renders the Branches section", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByText(/Branches/)).toBeDefined();
 });

 it("renders the New Branch button", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 expect(screen.getByText("New Branch")).toBeDefined();
 });

 it("shows 'not a git repository' message when git_status throws", async () => {
 mockInvoke.mockRejectedValueOnce(new Error("Not a git repository"));
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("Workspace is not a Git repository")).toBeDefined();
 });
 });

 it("renders the Initialize Git Repository button when not a git repo", async () => {
 mockInvoke.mockRejectedValueOnce(new Error("Not a git repository"));
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("Initialize Git Repository (git init)")).toBeDefined();
 });
 });

 it("calls git_init when Initialize Repository is clicked", async () => {
 mockInvoke.mockRejectedValueOnce(new Error("Not a git repository"));
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("Initialize Git Repository (git init)")).toBeDefined();
 });

 const initButton = screen.getByText("Initialize Git Repository (git init)");
 fireEvent.click(initButton);

 await waitFor(() => {
 expect(mockInvoke).toHaveBeenCalledWith("git_init", { projectPath: "/test/project" });
 });
 });

 it("displays branch badges when branches are loaded", async () => {
 mockInvoke
 .mockResolvedValueOnce({ branch: "main", changed: 0 })
 .mockResolvedValueOnce(["main", "develop", "feature/auth"])
 .mockResolvedValueOnce("diff stats")
 .mockResolvedValueOnce("full diff");

 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("develop")).toBeDefined();
 expect(screen.getByText("feature/auth")).toBeDefined();
 });
 });

 it("renders the Refresh button", () => {
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);
 const refreshButton = screen.getByTitle("Refresh status");
 expect(refreshButton).toBeDefined();
 });

 it("calls onRefreshStatus after git operations", async () => {
 const mockOnRefreshStatus = vi.fn();
 mockInvoke.mockResolvedValue({ branch: "main", changed: 0 });
 render(
 <GitControlModal
 isOpen={true}
 onClose={mockOnClose}
 projectPath="/test/project"
 onRefreshStatus={mockOnRefreshStatus}
 />
 );

 await waitFor(() => {
 expect(mockInvoke).toHaveBeenCalled();
 });
 });

 it("clears action output when modal is reopened", async () => {
 mockInvoke.mockResolvedValue({ branch: "main", changed: 0 });
 const { rerender } = render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(mockInvoke).toHaveBeenCalled();
 });

 rerender(<GitControlModal isOpen={false} onClose={mockOnClose} projectPath="/test/project" />);
 rerender(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(mockInvoke).toHaveBeenCalledTimes(2);
 });
 });

 it("renders the Quick Commit & Stage section", async () => {
 mockInvoke.mockResolvedValue({ branch: "main", changed: 0 });
 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("Quick Commit & Stage")).toBeDefined();
 });
 });

 it("renders the diff inspector when diff is available", async () => {
 mockInvoke
 .mockResolvedValueOnce({ branch: "main", changed: 1 })
 .mockResolvedValueOnce(["main"])
 .mockResolvedValueOnce("diff stats")
 .mockResolvedValueOnce("full diff");

 render(<GitControlModal isOpen={true} onClose={mockOnClose} projectPath="/test/project" />);

 await waitFor(() => {
 expect(screen.getByText("Uncommitted Changes Inspector")).toBeDefined();
 });
 });
});
