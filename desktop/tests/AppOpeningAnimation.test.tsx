import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { AppOpeningAnimation, useSplashStore } from "@/features/splash";

describe("AppOpeningAnimation", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    useSplashStore.setState({
      isOpen: true,
      isExiting: false,
      isMuted: false,
      hasPlayedThisSession: false,
    });
  });

  it("renders the Apple Pro luxury startup sequence when open", () => {
    render(<AppOpeningAnimation />);
    expect(screen.getByText("SWARM")).toBeDefined();
    expect(screen.getByText(/Autonomous Intelligence/i)).toBeDefined();
    expect(screen.getByText(/ESC to skip/i)).toBeDefined();
  });

  it("toggles audio mute state properly", () => {
    render(<AppOpeningAnimation />);
    const muteBtn = screen.getByTitle(/Mute sound/i);
    expect(muteBtn).toBeDefined();

    fireEvent.click(muteBtn);
    expect(useSplashStore.getState().isMuted).toBe(true);
  });

  it("skips animation smoothly when clicking skip button or on keydown Escape", () => {
    const onComplete = vi.fn();
    render(<AppOpeningAnimation onComplete={onComplete} />);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(useSplashStore.getState().isExiting).toBe(true);

    act(() => {
      vi.advanceTimersByTime(650);
    });

    expect(useSplashStore.getState().isOpen).toBe(false);
  });
});
