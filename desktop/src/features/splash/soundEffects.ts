/**
 * Apple Pro / Linear Style Sound Synthesizer
 * Uses Web Audio API to create pristine, executive haptic soundscapes
 */

class SwarmSoundEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("swarm_splash_muted");
        this.isMuted = stored === "true";
      } catch {
        this.isMuted = false;
      }
    }
  }

  private initContext() {
    if (!this.ctx && typeof window !== "undefined") {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === "suspended") {
      this.ctx.resume().catch(() => {});
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("swarm_splash_muted", String(muted));
      } catch {}
    }
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Apple Keynote Style Haptic Sub-Bass Impact & Shimmer
   */
  public playHapticImpact() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // 1. Deep Sub-Bass Haptic Thump (48Hz -> 32Hz)
      const subOsc = this.ctx.createOscillator();
      const subGain = this.ctx.createGain();
      subOsc.type = "sine";
      subOsc.frequency.setValueAtTime(54, now);
      subOsc.frequency.exponentialRampToValueAtTime(32, now + 0.35);

      subGain.gain.setValueAtTime(0.001, now);
      subGain.gain.linearRampToValueAtTime(0.28, now + 0.03);
      subGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);

      subOsc.connect(subGain);
      subGain.connect(this.ctx.destination);

      subOsc.start(now);
      subOsc.stop(now + 0.75);

      // 2. Pristine Glass Resonance (C5, G5, D6, A6 harmonics)
      const freqs = [523.25, 783.99, 1174.66, 1760.0];
      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const panner = this.ctx.createStereoPanner ? this.ctx.createStereoPanner() : null;

        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.04);

        if (panner) {
          panner.pan.setValueAtTime((idx - 1.5) * 0.4, now);
        }

        const noteStart = now + idx * 0.04;
        gain.gain.setValueAtTime(0.001, noteStart);
        gain.gain.linearRampToValueAtTime(0.05 / freqs.length, noteStart + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, noteStart + 1.2);

        if (panner) {
          osc.connect(panner);
          panner.connect(gain);
        } else {
          osc.connect(gain);
        }
        gain.connect(this.ctx.destination);

        osc.start(noteStart);
        osc.stop(noteStart + 1.3);
      });
    } catch {}
  }

  /**
   * Final optical resolution swell
   */
  public playResolutionSwell() {
    if (this.isMuted) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(880, now);
      osc.frequency.exponentialRampToValueAtTime(1760, now + 0.2);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.04, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.65);
    } catch {}
  }
}

export const swarmSound = new SwarmSoundEngine();
