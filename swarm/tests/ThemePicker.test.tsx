import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ThemePicker from "@/shared/ThemePicker";

var savedThemeId = "midnight-amber";
var savedSetThemeId: any = vi.fn();

beforeEach(() => {
 vi.clearAllMocks();
 savedThemeId = "midnight-amber";
 savedSetThemeId = vi.fn();
 window.HTMLElement.prototype.scrollIntoView = () => {};
});

afterEach(() => {
 vi.restoreAllMocks();
});

vi.mock("@/shared/themes", () => ({
 THEMES: [
 {
 id: "midnight-amber",
 label: "Midnight Amber",
 description: "Dark theme with amber accents",
 swatch: ["#f59e0b", "#141824", "#0b0d14"],
 tokens: { canvas: "11 15 20", canvasHi: "18 19 24", surface: "20 24 36", surfaceHi: "30 34 50", border: "40 44 56", borderHi: "75 82 102", gold: "245 158 11", goldHi: "252 211 77", goldDim: "165 120 45", honey: "240 195 110", amber: "218 165 72", text: "226 232 240", textDim: "148 163 184", textMuted: "100 116 139", ok: "52 211 153", warn: "245 158 11", err: "239 68 68" },
 },
 {
 id: "ocean-mist",
 label: "Ocean Mist",
 description: "Cool blues and teals",
 swatch: ["#3b82f6", "#111a2e", "#0b1220"],
 tokens: { canvas: "11 18 32", canvasHi: "18 19 24", surface: "17 26 46", surfaceHi: "22 32 52", border: "30 40 60", borderHi: "75 82 102", gold: "59 130 246", goldHi: "96 165 250", goldDim: "40 80 160", honey: "96 165 250", amber: "59 130 246", text: "226 232 240", textDim: "148 163 184", textMuted: "100 116 139", ok: "52 211 153", warn: "245 158 11", err: "239 68 68" },
 },
 ],
}));

vi.mock("@/shared/themeStore", () => ({
 useThemeStore: (selector: any) => {
 var state: Record<string, any> = {
 themeId: savedThemeId,
 setThemeId: savedSetThemeId,
 };
 if (typeof selector === "function") {
 return selector(state);
 }
 return state;
 },
}));

describe("ThemePicker", () => {
 it("renders the theme picker button in compact mode", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 expect(button).toBeDefined();
 });

 it("renders the theme picker button in non-compact mode", () => {
 render(<ThemePicker />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 expect(button).toBeDefined();
 });

 it("opens the theme menu on click", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByText("Color Themes")).toBeDefined();
 });

 it("closes the theme menu on second click", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByText("Color Themes")).toBeDefined();
 fireEvent.click(button);
 expect(screen.queryByText("Color Themes")).toBeNull();
 });

 it("displays all available themes", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByText("Midnight Amber")).toBeDefined();
 expect(screen.getByText("Ocean Mist")).toBeDefined();
 });

 it("displays theme descriptions", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByText("Dark theme with amber accents")).toBeDefined();
 expect(screen.getByText("Cool blues and teals")).toBeDefined();
 });

 it("shows theme count", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByText("2 Available")).toBeDefined();
 });

 it("calls setThemeId when a theme is selected", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);

 var oceanMistButton = screen.getByText("Ocean Mist").closest("button");
 fireEvent.click(oceanMistButton!);

 expect(savedSetThemeId).toHaveBeenCalledWith("ocean-mist");
 });

 it("marks the active theme with aria-checked='true'", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);

 var activeThemeRow = screen.getByRole("menuitemradio", { checked: true });
 expect(activeThemeRow.textContent).toContain("Midnight Amber");
 });

 it("closes the menu after selecting a theme", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);

 var oceanMistButton = screen.getByText("Ocean Mist").closest("button");
 fireEvent.click(oceanMistButton!);

 expect(screen.queryByText("Color Themes")).toBeNull();
 });

 it("has role='menu' on the theme list", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByRole("menu")).toBeDefined();
 });

 it("has aria-label='Choose theme' on the menu", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByLabelText("Choose theme")).toBeDefined();
 });

 it("closes the menu on Escape key", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 expect(screen.getByText("Color Themes")).toBeDefined();

 fireEvent.keyDown(window, { key: "Escape" });
 expect(screen.queryByText("Color Themes")).toBeNull();
 });

 it("has aria-haspopup='menu' on the trigger button", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 expect(button.getAttribute("aria-haspopup")).toBe("menu");
 });

 it("reflects open state in aria-expanded", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 expect(button.getAttribute("aria-expanded")).toBe("false");
 fireEvent.click(button);
 expect(button.getAttribute("aria-expanded")).toBe("true");
 });

 it("renders the Palette icon in compact mode", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 var svg = button.querySelector("svg");
 expect(svg).toBeDefined();
 });

 it("renders the theme label in non-compact mode", () => {
 render(<ThemePicker />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 expect(button.textContent).toContain("Midnight Amber");
 });

 it("updates aria-label when theme changes", () => {
 savedThemeId = "ocean-mist";
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Ocean Mist/ });
 expect(button).toBeDefined();
 });

 it("theme rows have role='menuitemradio'", () => {
 render(<ThemePicker compact />);
 var button = screen.getByRole("button", { name: /Theme: Midnight Amber/ });
 fireEvent.click(button);
 var menuItems = screen.getAllByRole("menuitemradio");
 expect(menuItems.length).toBe(2);
 });
});
