// Voice's UI needs to know where the Lead and active agent/terminals are.
// The app registers them once at boot; Voice never imports app stores,
// so it stays a standalone modular package.
export interface VoiceHost {
  /** Deliver dictated text to the current Lead (no trailing Enter). */
  deliverToLead(text: string): void;
  /** Deliver dictated text to whichever terminal / agent pane is currently active. */
  deliverToActive(text: string): void;
  /** Bring the Lead into view before dictating into it. */
  revealLead(): void;
  /** Get current target name/info (e.g. "Claude Code", "Terminal 1", "Lead Steward"). */
  getActiveTargetInfo?(): { name: string; isLead: boolean };
}

let host: VoiceHost = {
  deliverToLead: () => console.warn("[Voice] no host registered — dictation dropped"),
  deliverToActive: () => console.warn("[Voice] no host registered — dictation dropped"),
  revealLead: () => {},
  getActiveTargetInfo: () => ({ name: "Lead", isLead: true }),
};

export function setVoiceHost(next: VoiceHost): void {
  host = next;
}

export function swarmVoiceHost(): VoiceHost {
  return host;
}
