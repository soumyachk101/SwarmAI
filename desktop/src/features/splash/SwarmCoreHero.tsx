"use client";

import React, { useMemo } from "react";

interface SwarmCoreHeroProps {
 progress: number;
 isExiting: boolean;
 phase: string;
}

export default function SwarmCoreHero({ progress, isExiting, phase }: SwarmCoreHeroProps) {
 const pRatio = Math.min(1, Math.max(0, progress / 100));

 const hexFacets = useMemo(
 () => [
 { id: "top", x: 0, y: -68, rot: 0 },
 { id: "top-right", x: 58, y: -34, rot: 60 },
 { id: "bottom-right", x: 58, y: 34, rot: 120 },
 { id: "bottom", x: 0, y: 68, rot: 180 },
 { id: "bottom-left", x: -58, y: 34, rot: 240 },
 { id: "top-left", x: -58, y: -34, rot: 300 },
 ],
 []
 );

 const snapStart = 0.12;
 const snapEnd = 0.72;
 const snapRatio = Math.min(1, Math.max(0, (pRatio - snapStart) / (snapEnd - snapStart)));
 const easeSnap = snapRatio < 1 ? 1 - Math.pow(1 - snapRatio, 4) : 1;
 const isLocked = pRatio >= snapEnd;
 const isResolved = phase === "resolve" || phase === "exit";
 const lockPulse = isLocked ? Math.sin(Date.now() * 0.004) * 0.5 + 0.5 : 0;

 const haloGradient = `radial-gradient(circle at center,
 rgba(245,175,45,${(0.12 + pRatio * 0.2 + lockPulse * 0.06).toFixed(3)}) 0%,
 rgba(218,165,72,${(0.06 + lockPulse * 0.03).toFixed(3)}) 30%,
 rgba(245,158,11,0.02) 55%,
 transparent 70%)`;

 const mainShadow = isLocked
 ? `0 25px 60px -15px rgba(0,0,0,0.95), 0 0 50px rgba(245,175,45,0.5), 0 0 100px rgba(245,158,11,0.25), inset 0 1px 2px rgba(255,255,255,0.45), inset 0 -1px 2px rgba(0,0,0,0.3)`
 : "0 15px 40px rgba(0,0,0,0.85)";

 return (
 <div
 className="relative flex items-center justify-center select-none"
 style={{
 width: 380,
 height: 380,
 filter: isLocked && !isExiting
 ? `drop-shadow(0 0 ${(30 + lockPulse * 20).toFixed(1)}px rgba(245,175,45,0.4)) drop-shadow(0 0 80px rgba(245,158,11,0.2))`
 : "none",
 transition: "all 0.8s ease",
 transform: isExiting ? "scale(1.1)" : "scale(1)",
 opacity: isExiting ? 0 : 1,
 }}
 >
 {svgDefs()}

 {/* Outer ambient halo */}
 <div
 className="absolute pointer-events-none"
 style={{
 width: 420,
 height: 420,
 borderRadius: "50%",
 background: haloGradient,
 filter: "blur(40px)",
 transform: isLocked ? `scale(${(1.1 + lockPulse * 0.08).toFixed(3)})` : `scale(${(0.75 + pRatio * 0.35).toFixed(3)})`,
 opacity: 0.3 + pRatio * 0.7,
 transition: "all 1s ease",
 }}
 />

 {/* Chromatic aberration ghost */}
 {isLocked && !isExiting && chromaticGhost(lockPulse)}

 {/* 3D assembly container */}
 <div
 className="relative flex items-center justify-center"
 style={{
 transformStyle: "preserve-3d",
 transform: `rotateX(${((1 - pRatio) * 18).toFixed(2)}deg) rotateY(${((1 - pRatio) * -14).toFixed(2)}deg) rotateZ(${((1 - pRatio) * 3).toFixed(2)}deg) scale(${(0.82 + pRatio * 0.18).toFixed(3)})`,
 transition: "transform 0.7s ease",
 }}
 >
 {hexFacets.map((facet, idx) => hexFacet(facet, idx, easeSnap, isLocked))}

 {/* Center keystone */}
 <div
 className="relative flex items-center justify-center"
 style={{
 transformStyle: "preserve-3d",
 transform: `translateZ(${isLocked ? 22 : 0}px)`,
 transition: "transform 0.9s cubic-bezier(0.16, 1, 0.3, 1)",
 }}
 >
 {/* Keystone plate */}
 <div
 className="relative flex items-center justify-center"
 style={{
 width: 148,
 height: 148,
 borderRadius: "2rem",
 boxShadow: mainShadow,
 transition: "box-shadow 1s ease-out",
 }}
 >
 {hexFrame(isLocked)}
 {specularSweep(pRatio, isLocked)}
 {swarmEmblem(isLocked, lockPulse)}
 </div>
 </div>
 </div>

 {/* Lock phase radiant ring */}
 {isLocked && !isExiting && (
 <div
 className="absolute pointer-events-none"
 style={{
 width: 200 + lockPulse * 30,
 height: 200 + lockPulse * 30,
 borderRadius: "50%",
 border: `1.5px solid rgba(245,175,45,${(0.2 + lockPulse * 0.2).toFixed(2)})`,
 boxShadow: `0 0 30px rgba(245,175,45,${(0.15 + lockPulse * 0.1).toFixed(2)})`,
 transform: "rotateX(70deg)",
 opacity: 0.6 + lockPulse * 0.3,
 transition: "all 0.6s ease-out",
 }}
 />
 )}
 </div>
 );
}

function svgDefs() {
 return (
 <svg className="absolute w-0 h-0" aria-hidden="true">
 <defs>
 <linearGradient id="gold-bezel" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
 <stop offset="12%" stopColor="#FEF3C7" stopOpacity="0.85" />
 <stop offset="38%" stopColor="#F59E0B" stopOpacity="0.75" />
 <stop offset="72%" stopColor="#B45309" stopOpacity="0.9" />
 <stop offset="100%" stopColor="#78350F" stopOpacity="1" />
 </linearGradient>
 <linearGradient id="dark-surface" x1="0%" y1="0%" x2="0%" y2="100%">
 <stop offset="0%" stopColor="#1A1C24" />
 <stop offset="50%" stopColor="#0F1118" />
 <stop offset="100%" stopColor="#08090E" />
 </linearGradient>
 <linearGradient id="wing-grad" x1="0%" y1="0%" x2="100%" y2="100%">
 <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.92" />
 <stop offset="40%" stopColor="#FDE68A" stopOpacity="0.7" />
 <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.2" />
 </linearGradient>
 <filter id="gold-glow" x="-40%" y="-40%" width="180%" height="180%">
 <feGaussianBlur stdDeviation="4" result="blur" />
 <feComposite in="SourceGraphic" in2="blur" operator="over" />
 </filter>
 <filter id="soft-glow" x="-60%" y="-60%" width="220%" height="220%">
 <feGaussianBlur stdDeviation="8" result="blur" />
 <feMerge>
 <feMergeNode in="blur" />
 <feMergeNode in="SourceGraphic" />
 </feMerge>
 </filter>
 <filter id="chromatic" x="-10%" y="-10%" width="120%" height="120%">
 <feColorMatrix type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.6 0" />
 </filter>
 <clipPath id="bee-body">
 <path d="M24 13C30.5 13 33.5 18.5 33.5 24.5C33.5 32 29.5 39.5 24 42.5C18.5 39.5 14.5 32 14.5 24.5C14.5 18.5 17.5 13 24 13Z" />
 </clipPath>
 </defs>
 </svg>
 );
}

function chromaticGhost(lockPulse: number) {
 return (
 <div
 className="absolute inset-0 pointer-events-none"
 style={{
 opacity: 0.25 + lockPulse * 0.15,
 transform: `translate(${Math.sin(Date.now() * 0.002) * 1.5}px, ${Math.cos(Date.now() * 0.003) * 1}px)`,
 filter: "url(#chromatic)",
 transition: "opacity 0.5s ease",
 }}
 >
 <div
 className="w-full h-full"
 style={{
 background: "radial-gradient(circle at center, rgba(56,189,248,0.3) 0%, rgba(168,219,255,0.1) 30%, transparent 60%)",
 }}
 />
 </div>
 );
}

function hexFacet(facet: any, idx: number, easeSnap: number, isLocked: boolean) {
 const displacement = (1 - easeSnap) * 65;
 const dirX = facet.x === 0 ? 0 : Math.sign(facet.x);
 const dirY = facet.y === 0 ? 0 : Math.sign(facet.y);
 const offsetX = facet.x + dirX * displacement;
 const offsetY = facet.y + (facet.y !== 0 ? dirY * displacement : 0);
 const cellZ = (1 - easeSnap) * -70;
 const cellOpacity = 0.15 + easeSnap * 0.85;
 const facetPulse = isLocked ? Math.sin(Date.now() * 0.003 + idx) * 0.08 : 0;

 return (
 <div
 key={facet.id}
 className="absolute pointer-events-none"
 style={{
 transform: `translate3d(${offsetX.toFixed(1)}px, ${offsetY.toFixed(1)}px, ${cellZ.toFixed(1)}px) rotate(${(facet.rot + (isLocked ? Math.sin(Date.now() * 0.002 + idx) * 2 : 0)).toFixed(1)}deg)`,
 opacity: cellOpacity + facetPulse,
 transition: "opacity 0.8s ease-out",
 }}
 >
 <svg width="68" height="68" viewBox="0 0 68 68" fill="none">
 <polygon
 points="34,5 62,19 62,49 34,63 6,49 6,19"
 fill="url(#dark-surface)"
 stroke="url(#gold-bezel)"
 strokeWidth={isLocked ? 1.4 : 0.9}
 strokeOpacity={isLocked ? 0.85 : 0.35}
 />
 <polygon
 points="34,12 57,22 57,46 34,56 11,46 11,22"
 stroke="rgba(245,158,11,0.2)"
 strokeWidth="0.6"
 fill="none"
 />
 <polygon
 points="34,18 52,25 52,43 34,50 16,43 16,25"
 stroke="rgba(255,255,255,0.06)"
 strokeWidth="0.4"
 fill="none"
 />
 </svg>
 </div>
 );
}

function hexFrame(isLocked: boolean) {
 const sw = isLocked ? 2.2 : 1.3;
 return (
 <svg width="148" height="148" viewBox="0 0 148 148" fill="none" className="absolute inset-0">
 <polygon
 points="74,6 136,40 136,108 74,142 12,108 12,40"
 fill="url(#dark-surface)"
 stroke="url(#gold-bezel)"
 strokeWidth={sw}
 />
 <polygon
 points="74,14 129,44 129,104 74,134 19,104 19,44"
 stroke="rgba(255,255,255,0.12)"
 strokeWidth="0.9"
 fill="none"
 />
 <circle cx="74" cy="6" r="2.5" fill={isLocked ? "rgba(245,175,45,0.8)" : "rgba(245,175,45,0.3)"} />
 <circle cx="136" cy="40" r="2" fill={isLocked ? "rgba(245,175,45,0.6)" : "rgba(245,175,45,0.2)"} />
 <circle cx="136" cy="108" r="2" fill={isLocked ? "rgba(245,175,45,0.6)" : "rgba(245,175,45,0.2)"} />
 <circle cx="74" cy="142" r="2.5" fill={isLocked ? "rgba(245,175,45,0.8)" : "rgba(245,175,45,0.3)"} />
 <circle cx="12" cy="108" r="2" fill={isLocked ? "rgba(245,175,45,0.6)" : "rgba(245,175,45,0.2)"} />
 <circle cx="12" cy="40" r="2" fill={isLocked ? "rgba(245,175,45,0.6)" : "rgba(245,175,45,0.2)"} />
 </svg>
 );
}

function specularSweep(pRatio: number, isLocked: boolean) {
 return (
 <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ borderRadius: "2rem" }}>
 <div
 className="absolute inset-0"
 style={{
 background: `linear-gradient(105deg,
 transparent 30%,
 rgba(255,255,255,${(0.03 + pRatio * 0.06).toFixed(3)}) 45%,
 rgba(255,255,255,${(0.08 + pRatio * 0.12).toFixed(3)}) 50%,
 rgba(255,255,255,${(0.03 + pRatio * 0.06).toFixed(3)}) 55%,
 transparent 70%)`,
 transform: `translateX(${isLocked ? 120 : -120}%)`,
 transition: "transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)",
 }}
 />
 </div>
 );
}

function swarmEmblem(isLocked: boolean, lockPulse: number) {
 return (
 <div
 className="relative z-10"
 style={{
 filter: `drop-shadow(0 10px 30px rgba(245,158,11,${(0.5 + lockPulse * 0.3).toFixed(2)}))`,
 transform: isLocked ? "scale(1.06)" : "scale(0.94)",
 transition: "transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
 }}
 >
 <svg
 width="78"
 height="78"
 viewBox="0 0 48 48"
 fill="none"
 xmlns="http://www.w3.org/2000/svg"
 style={{ filter: isLocked ? "url(#gold-glow)" : "none" }}
 >
 <g transform={`rotate(${-8 + (isLocked ? Math.sin(Date.now() * 0.001) * 1.5 : 0)} 24 24)`}>
 <ellipse
 cx="14.2"
 cy="15.5"
 rx="9"
 ry="5.2"
 transform="rotate(-38 14.2 15.5)"
 fill="url(#wing-grad)"
 stroke="#D97706"
 strokeWidth="1.1"
 />
 <ellipse
 cx="33.8"
 cy="15.5"
 rx="9"
 ry="5.2"
 transform="rotate(38 33.8 15.5)"
 fill="url(#wing-grad)"
 stroke="#D97706"
 strokeWidth="1.1"
 />
 <path
 d="M22.3 13.2C21.6 10.4 20.8 8.6 19.8 7.1"
 stroke="#08090E"
 strokeWidth="2.2"
 strokeLinecap="round"
 />
 <path
 d="M25.7 13.2C26.4 10.4 27.2 8.6 28.2 7.1"
 stroke="#08090E"
 strokeWidth="2.2"
 strokeLinecap="round"
 />
 <circle cx="19.5" cy="6.6" r="1.8" fill="#F59E0B" filter="url(#soft-glow)" />
 <circle cx="28.5" cy="6.6" r="1.8" fill="#F59E0B" filter="url(#soft-glow)" />
 <path
 d="M24 13C30.5 13 33.5 18.5 33.5 24.5C33.5 32 29.5 39.5 24 42.5C18.5 39.5 14.5 32 14.5 24.5C14.5 18.5 17.5 13 24 13Z"
 fill="url(#gold-bezel)"
 />
 <g clipPath="url(#bee-body)" fill="#08090E">
 <rect x="11" y="19" width="26" height="4.6" />
 <rect x="11" y="26.6" width="26" height="4.6" />
 <rect x="11" y="34.2" width="26" height="4.6" />
 </g>
 {isLocked && (
 <React.Fragment>
 <circle cx="20.5" cy="23" r="1.2" fill="rgba(255,255,255,0.8)" />
 <circle cx="27.5" cy="23" r="1.2" fill="rgba(255,255,255,0.8)" />
 </React.Fragment>
 )}
 </g>
 </svg>
 </div>
 );
}
