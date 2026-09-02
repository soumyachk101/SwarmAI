import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import SettingsPage from "@/features/settings/SettingsPage";

// Mock child sections
vi.mock("./ProvidersSection", () => ({
 default: () => <div data-testid="providers-section">Providers Section</div>,
}));

vi.mock("./ModelsSection", () => ({
 default: () => <div data-testid="models-section">Models Section</div>,
}));

vi.mock("./UpdatesSection", () => ({
 default: () => <div data-testid="updates-section">Updates Section</div>,
}));

vi.mock("./UserGuideSection", () => ({
 default: () => <div data-testid="guide-section">User Guide Section</div>,
}));

vi.mock("./PrivacySection", () => ({
 default: () => <div data-testid="privacy-section">Privacy Section</div>,
}));

describe("SettingsPage", () => {
 const mockOnClose = vi.fn();

 beforeEach(() => {
 vi.clearAllMocks();
 });

 afterEach(() => {
 vi.restoreAllMocks();
 });

 it("renders without crashing", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    expect(screen.getByText("Settings & Tools")).toBeDefined();
 });

 it("renders the close button", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 const closeButtons = screen.getAllByRole("button");
 const xButton = closeButtons.find(btn => btn.querySelector("svg"));
 expect(xButton).toBeDefined();
 });

 it("calls onClose when the close button is clicked", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 const closeButtons = screen.getAllByRole("button");
 const xButton = closeButtons.find(btn => btn.querySelector("svg"));
 if (xButton) fireEvent.click(xButton);
 expect(mockOnClose).toHaveBeenCalled();
 });

 it("renders the Settings dialog", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByRole("dialog")).toBeDefined();
 });

 it("has aria-label 'Settings'", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByLabelText("Settings")).toBeDefined();
 });

 it("has aria-modal='true'", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 const dialog = screen.getByRole("dialog");
 expect(dialog.getAttribute("aria-modal")).toBe("true");
 });

 it("renders the Models & Defaults nav item", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByText("Models & Defaults")).toBeDefined();
 });

 it("renders the API Providers nav item", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByText("API Providers")).toBeDefined();
 });

 it("renders the User Guide & Docs nav item", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByText("User Guide & Docs")).toBeDefined();
 });

 it("renders the Privacy & Security nav item", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByText("Privacy & Security")).toBeDefined();
 });

 it("renders the Updates & Releases nav item", () => {
 render(<SettingsPage onClose={mockOnClose} />);
 expect(screen.getByText("Updates & Releases")).toBeDefined();
 });

  it("renders Tools & Workflows section by default", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    expect(screen.getByTestId("tools-section")).toBeDefined();
  });

  it("renders ModelsSection when models nav is clicked", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const modelsButton = screen.getByText("Models & Defaults").closest("button");
    fireEvent.click(modelsButton!);
    expect(screen.getByTestId("models-section")).toBeDefined();
  });

  it("renders ProvidersSection when providers nav is clicked", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const providersButton = screen.getByText("API Providers").closest("button");
    fireEvent.click(providersButton!);
    expect(screen.getByTestId("providers-section")).toBeDefined();
  });

  it("renders UserGuideSection when guide nav is clicked", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const guideButton = screen.getByText("User Guide & Docs").closest("button");
    fireEvent.click(guideButton!);
    expect(screen.getByTestId("guide-section")).toBeDefined();
  });

  it("renders PrivacySection when privacy nav is clicked", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const privacyButton = screen.getByText("Privacy & Security").closest("button");
    fireEvent.click(privacyButton!);
    expect(screen.getByTestId("privacy-section")).toBeDefined();
  });

  it("renders UpdatesSection when updates nav is clicked", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const updatesButton = screen.getByText("Updates & Releases").closest("button");
    fireEvent.click(updatesButton!);
    expect(screen.getByTestId("updates-section")).toBeDefined();
  });

  it("switches back to Tools section when clicked again", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const providersButton = screen.getByText("API Providers").closest("button");
    fireEvent.click(providersButton!);
    expect(screen.getByTestId("providers-section")).toBeDefined();

    const toolsButton = screen.getByText("Tools & Workflows").closest("button");
    fireEvent.click(toolsButton!);
    expect(screen.getByTestId("tools-section")).toBeDefined();
  });

  it("calls onClose on Escape key", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders the Reload button", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    expect(screen.getByText("Reload")).toBeDefined();
  });

  it("nav items have icons", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const navButtons = screen.getAllByRole("button").filter(btn =>
      btn.textContent?.includes("Tools") ||
      btn.textContent?.includes("Models") ||
      btn.textContent?.includes("Providers") ||
      btn.textContent?.includes("Guide") ||
      btn.textContent?.includes("Privacy") ||
      btn.textContent?.includes("Updates")
    );
    expect(navButtons.length).toBeGreaterThanOrEqual(6);
  });

  it("highlights the active nav item", () => {
    render(<SettingsPage onClose={mockOnClose} />);
    const toolsButton = screen.getAllByText("Tools & Workflows")[0].closest("button");
    expect(toolsButton?.className).toContain("bg-swarm-gold");
  });
});
