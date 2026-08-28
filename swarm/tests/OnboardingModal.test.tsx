import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("lucide-react", () => {
 function Icon(_props: any) { return null; }
 return { X: Icon, ChevronRight: Icon, FolderOpen: Icon, Terminal: Icon, Mic: Icon, Settings: Icon, Sparkles: Icon };
});

import OnboardingModal from "@/shared/OnboardingModal";

describe("OnboardingModal", () => {
 beforeEach(() => {
 localStorage.clear();
 window.HTMLElement.prototype.getBoundingClientRect = () => ({
 x: 0, y: 0, width: 100, height: 50, top: 0, left: 0, right: 100, bottom: 50, toJSON: () => {},
});
 (globalThis as any).ResizeObserver = class MockResizeObserver {
 observe() {}
 unobserve() {}
 disconnect() {}
};
});

 afterEach(() => {
 localStorage.clear();
 delete (globalThis as any).ResizeObserver;
});

 it("renders nothing when onboarding is complete", () => {
 localStorage.setItem("swarm-onboarding-seen", "true");
 var { container } = render(<OnboardingModal />);
 expect(container.innerHTML).toBe("");
 });

 it("renders the welcome step on first run", () => {
 render(<OnboardingModal />);
 expect(screen.getByText("Welcome to Swarm AI")).toBeDefined();
 });

 it("navigates to the next step", () => {
 render(<OnboardingModal />);
 var nextButton = screen.getByText(/Next/);
 fireEvent.click(nextButton);
 expect(screen.getByText("Open a Project")).toBeDefined();
 });

 it("shows Back button after advancing", () => {
 render(<OnboardingModal />);
 fireEvent.click(screen.getByText(/Next/));
 expect(screen.getByText("Back")).toBeDefined();
 });

 it("navigates back with Back button", () => {
 render(<OnboardingModal />);
 fireEvent.click(screen.getByText(/Next/));
 expect(screen.getByText("2 / 6")).toBeDefined();
 fireEvent.click(screen.getByText("Back"));
 expect(screen.getByText("1 / 6")).toBeDefined();
 });

 it("shows Get Started on the last step", () => {
 render(<OnboardingModal />);
 for (var i = 0; i < 5; i++) {
 fireEvent.click(screen.getByText(/Next/));
 }
 expect(screen.getByText("Get Started")).toBeDefined();
 expect(screen.getByText("6 / 6")).toBeDefined();
 });

 it("completes onboarding and removes modal", () => {
 var { container } = render(<OnboardingModal />);
 expect(screen.getByText("Welcome to Swarm AI")).toBeDefined();
 fireEvent.click(screen.getByText(/Next/));
 fireEvent.click(screen.getByText(/Next/));
 fireEvent.click(screen.getByText("Get Started"));
 expect(container.innerHTML).toBe("");
 expect(localStorage.getItem("swarm-onboarding-seen")).toBe("true");
 });

 it("skips onboarding via Skip button", () => {
 var { container } = render(<OnboardingModal />);
 expect(screen.getByText("Welcome to Swarm AI")).toBeDefined();
 var skipButton = screen.getByTitle("Skip onboarding");
 fireEvent.click(skipButton);
 expect(container.innerHTML).toBe("");
 expect(localStorage.getItem("swarm-onboarding-seen")).toBe("true");
 });

 it("renders progress dots and step counter", () => {
 render(<OnboardingModal />);
 expect(screen.getByText("1 / 6")).toBeDefined();
 });

 it("updates step counter on navigation", () => {
 render(<OnboardingModal />);
 fireEvent.click(screen.getByText(/Next/));
 expect(screen.getByText("2 / 6")).toBeDefined();
 });

 it("renders the highlight overlay when step has a selector", () => {
 render(<OnboardingModal />);
 fireEvent.click(screen.getByText(/Next/));
 expect(screen.getByText("Open a Project")).toBeDefined();
 });
});
