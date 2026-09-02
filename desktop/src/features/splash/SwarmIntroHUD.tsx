"use client";

import React from "react";
import { Volume2, VolumeX } from "lucide-react";

interface SwarmIntroHUDProps {
 progress: number;
 isMuted: boolean;
 onToggleMute: () => void;
 onSkip: () => void;
 isExiting: boolean;
 phase: string;
}

export default function SwarmIntroHUD({
 progress,
 isMuted,
 onToggleMute,
 onSkip,
 isExiting,
 phase,
}: SwarmIntroHUDProps) {
 const pRatio = Math.min(1, Math.max(0, progress / 100));
 const isLocked = phase === "lock" || phase === "resolve" || phase === "exit";
 const isResolved = phase === "resolve" || phase === "exit";

 const lockPulse = isLocked ? Math.sin(Date.now() * 0.004) * 0.5 + 0.5 : 0;

 return (
 <div
 className={`relative z-20 flex flex-col items-center w-full max-w-md mx-auto px-6 select-none transition-all duration-600 ${
 isExiting ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
 }`}
 >
 {/* ─── Brand Wordmark ─── */}
 <div className="flex flex-col items-center text-center mb-10">
 <h1
 className={`text-4xl sm:text-5xl font-extrabold tracking-[0.4em] uppercase font-sans mb-3 transition-all duration-700 ${
 isResolved ? "scale-105" : "scale-100"
 }`}
 style={{
 background: isLocked
 ? "linear-gradient(180deg, #FFFFFF 0%, #FEF3C7 25%, #F59E0B 60%, #B45309 100%)"
 : "linear-gradient(180deg, #A1A1AA 0%, #71717A 50%, #52525B 100%)",
 WebkitBackgroundClip: "text",
 backgroundClip: "text",
 WebkitTextFillColor: "transparent",
 filter: isLocked
 ? `drop-shadow(0 4px 20px rgba(245, 175, 45, ${0.35 + lockPulse * 0.2}))`
 : "none",
 }}
 >
 SWARM
 </h1>

 {/* Animated Horizon Line */}
 <div className="relative w-36 h-[1px] my-2 overflow-hidden">
 <div
 className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/50 to-transparent transition-opacity duration-700"
 style={{ opacity: isLocked ? 0.7 + lockPulse * 0.3 : 0.2 }}
 />
 </div>

 <p
 className={`text-[11px] font-mono tracking-[0.3em] uppercase font-medium transition-all duration-700 ${
 isLocked ? "text-amber-200/90" : "text-zinc-600"
 }`}
 style={{
 letterSpacing: "0.3em",
 }}
 >
 Autonomous Intelligence
 </p>

 {/* Locked sub-tag */}
 {isLocked && (
 <p
 className="text-[9px] font-mono tracking-[0.4em] uppercase mt-2 transition-all duration-500"
 style={{
 color: `rgba(245, 175, 45, ${0.4 + lockPulse * 0.3})`,
 }}
 >
 System Ready
 </p>
 )}
 </div>

 {/* ─── Minimal Footer Controls ─── */}
 <div className="flex items-center justify-between w-full pt-5 border-t border-white/[0.04]">
 {/* Audio Toggle */}
 <button
 onClick={(e) => {
 e.stopPropagation();
 onToggleMute();
 }}
 className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[10px] font-mono tracking-wider transition-all cursor-pointer"
 style={{ color: isMuted ? "#71717A" : "#FBBF24" }}
 title={isMuted ? "Unmute sound" : "Mute sound"}
 >
 {isMuted ? (
 <>
 <VolumeX size={12} strokeWidth={1.5} />
 <span>Muted</span>
 </>
 ) : (
 <>
 <Volume2 size={12} strokeWidth={1.5} />
 <span>Audio</span>
 </>
 )}
 </button>

 {/* Skip */}
 <button
 onClick={(e) => {
 e.stopPropagation();
 onSkip();
 }}
 className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] text-[10px] font-mono tracking-wider text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
 >
 <span>ESC to skip</span>
 </button>
 </div>
 </div>
 );
}
