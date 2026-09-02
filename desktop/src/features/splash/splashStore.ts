import { create } from "zustand";

interface SplashState {
  isOpen: boolean;
  isExiting: boolean;
  isMuted: boolean;
  hasPlayedThisSession: boolean;
  openSplash: (force?: boolean) => void;
  closeSplash: () => void;
  setExiting: (exiting: boolean) => void;
  toggleMute: () => void;
}

export const useSplashStore = create<SplashState>((set, get) => ({
  isOpen: true,
  isExiting: false,
  isMuted: typeof window !== "undefined" ? localStorage.getItem("swarm_splash_muted") === "true" : false,
  hasPlayedThisSession: false,

  openSplash: (force = false) => {
    if (force || !get().hasPlayedThisSession) {
      set({ isOpen: true, isExiting: false, hasPlayedThisSession: true });
    }
  },

  closeSplash: () => {
    set({ isExiting: true });
    setTimeout(() => {
      set({ isOpen: false, isExiting: false });
    }, 600);
  },

  setExiting: (exiting: boolean) => {
    set({ isExiting: true });
    setTimeout(() => {
      set({ isOpen: false, isExiting: false });
    }, 600);
  },

  toggleMute: () => {
    const nextMuted = !get().isMuted;
    set({ isMuted: nextMuted });
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("swarm_splash_muted", String(nextMuted));
      } catch {}
    }
  },
}));
