"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import SwarmCanvasMesh from "./SwarmCanvasMesh";
import SwarmCoreHero from "./SwarmCoreHero";
import SwarmIntroHUD from "./SwarmIntroHUD";
import { swarmSound } from "./soundEffects";
import { useSplashStore } from "./splashStore";

interface AppOpeningAnimationProps {
 onComplete?: () => void;
 forceShow?: boolean;
}

export default function AppOpeningAnimation({ onComplete }: AppOpeningAnimationProps) {
 const isOpen = useSplashStore((s) => s.isOpen);
 const isExiting = useSplashStore((s) => s.isExiting);
 const isMuted = useSplashStore((s) => s.isMuted);
 const closeSplash = useSplashStore((s) => s.closeSplash);
 const toggleMute = useSplashStore((s) => s.toggleMute);

 const [progress, setProgress] = useState(0);
 const [phase, setPhase] = useState<"intro" | "core" | "lock" | "resolve" | "exit">("intro");
 const hasFinishedRef = useRef(false);

 useEffect(() => {
 swarmSound.setMuted(isMuted);
 }, [isMuted]);

 const handleSkip = useCallback(() => {
 if (hasFinishedRef.current) return;
 hasFinishedRef.current = true;
 setProgress(100);
 setPhase("resolve");
 swarmSound.playResolutionSwell();
 closeSplash();
 onComplete?.();
 }, [closeSplash, onComplete]);

 useEffect(() => {
 if (!isOpen) return;
 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape" || e.key === " ") {
 e.preventDefault();
 handleSkip();
 }
 };
 window.addEventListener("keydown", handleKeyDown);
 return () => window.removeEventListener("keydown", handleKeyDown);
 }, [isOpen, handleSkip]);

 // Premium 4-Phase Cinematic Choreography
 useEffect(() => {
 if (!isOpen) return;

 hasFinishedRef.current = false;
 setProgress(0);
 setPhase("intro");

 const DURATION = 2800;

 // Phase 1: Impact (t=0)
 const tImpact = setTimeout(() => {
 swarmSound.playHapticImpact();
 setPhase("core");
 }, 80);

 // Phase 2: Lock swell (t=1.2s)
 const tLock = setTimeout(() => {
 setPhase("lock");
 }, 1200);

 // Phase 3: Resolve (t=2.2s)
 const tResolve = setTimeout(() => {
 setPhase("resolve");
 }, 2200);

 const startTime = performance.now();
 let animFrame: number;

 const tick = (now: number) => {
 if (hasFinishedRef.current) return;

 const elapsed = now - startTime;
 const rawPct = Math.min(100, (elapsed / DURATION) * 100);

 // Cinematic ease — slow intro, explosive mid, smooth resolve
 let easedPct: number;
 if (rawPct < 40) {
 easedPct = rawPct * 0.6;
 } else if (rawPct < 70) {
 const mid = (rawPct - 40) / 30;
 easedPct = 24 + mid * mid * 50;
 } else {
 const late = (rawPct - 70) / 30;
 easedPct = 74 + late * 26;
 }

 setProgress(easedPct);

 if (elapsed < DURATION) {
 animFrame = requestAnimationFrame(tick);
 } else {
 hasFinishedRef.current = true;
 setProgress(100);
 swarmSound.playResolutionSwell();
 setTimeout(() => {
 closeSplash();
 onComplete?.();
 }, 250);
 }
 };

 animFrame = requestAnimationFrame(tick);

 return () => {
 cancelAnimationFrame(animFrame);
 clearTimeout(tImpact);
 clearTimeout(tLock);
 clearTimeout(tResolve);
 };
 }, [isOpen, closeSplash, onComplete]);

 if (!isOpen) return null;

 return (
 <div
 onClick={handleSkip}
 className={`fixed inset-0 z-[99999] flex flex-col items-center justify-between overflow-hidden select-none cursor-pointer transition-all duration-700 ${
 isExiting
 ? "opacity-0 scale-105 pointer-events-none"
 : "opacity-100 scale-100"
 }`}
 style={{
 backgroundColor: "#02030A",
 backgroundImage: `
 radial-gradient(ellipse 140% 80% at 50% 40%, rgba(245, 158, 11, 0.06) 0%, transparent 55%),
 radial-gradient(ellipse 60% 50% at 50% 100%, rgba(6, 10, 30, 0.95), transparent 70%)
 `,
 }}
 >
 {/* Cinematic Scanlines Overlay */}
 <div
 className="absolute inset-0 pointer-events-none z-30 opacity-[0.03]"
 style={{
 backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.15) 2px, rgba(0,0,0,0.15) 4px)",
 }}
 />

 {/* 1. Premium Canvas Background */}
 <SwarmCanvasMesh progress={progress} isExiting={isExiting} phase={phase} />

 {/* 2. Vignette */}
 <div
 className="absolute inset-0 pointer-events-none z-10"
 style={{
 background: "radial-gradient(ellipse 70% 65% at 50% 50%, transparent 0%, rgba(2,3,10,0.55) 70%, rgba(2,3,10,0.92) 100%)",
 }}
 />

 {/* 3. Center Hero */}
 <div className="relative z-20 flex flex-col items-center justify-center my-auto">
 <SwarmCoreHero progress={progress} isExiting={isExiting} phase={phase} />
 </div>

 {/* 4. Bottom HUD */}
 <div className="relative z-20 w-full pb-4">
 <SwarmIntroHUD
 progress={progress}
 isMuted={isMuted}
 onToggleMute={toggleMute}
 onSkip={handleSkip}
 isExiting={isExiting}
 phase={phase}
 />
 </div>
 </div>
 );
}
