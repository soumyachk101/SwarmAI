"use client";

import React, { useEffect, useRef } from "react";

interface BokehParticle {
 x: number;
 y: number;
 radius: number;
 vx: number;
 vy: number;
 alpha: number;
 maxAlpha: number;
 phase: number;
 color: string;
 hue: number;
}

interface SwarmCanvasMeshProps {
 progress: number;
 isExiting: boolean;
 phase: string;
}

export default function SwarmCanvasMesh({ progress, isExiting, phase }: SwarmCanvasMeshProps) {
 const canvasRef = useRef<HTMLCanvasElement | null>(null);
 const mouseRef = useRef({ x: 0, y: 0 });

 useEffect(() => {
 const canvas = canvasRef.current;
 if (!canvas) return;
 const ctx = canvas.getContext("2d", { alpha: true });
 if (!ctx) return;

 let animId: number;
 const dpr = Math.min(window.devicePixelRatio || 1, 2);
 let width = (canvas.width = window.innerWidth * dpr);
 let height = (canvas.height = window.innerHeight * dpr);

 const handleResize = () => {
 if (!canvas) return;
 width = canvas.width = window.innerWidth * dpr;
 height = canvas.height = window.innerHeight * dpr;
 };
 window.addEventListener("resize", handleResize);

 const handleMouseMove = (e: MouseEvent) => {
 mouseRef.current = {
 x: (e.clientX / window.innerWidth) * width,
 y: (e.clientY / window.innerHeight) * height,
 };
 };
 window.addEventListener("mousemove", handleMouseMove);

 // Premium color palette
 const palette = [
 { color: "rgba(255, 210, 120,", hue: 42 }, // Warm champagne
 { color: "rgba(245, 175, 45,", hue: 38 }, // Radiant amber
 { color: "rgba(255, 255, 255,", hue: 50 }, // Diamond white
 { color: "rgba(56, 189, 248,", hue: 200 }, // Anamorphic cyan
 { color: "rgba(168, 219, 255,", hue: 205 }, // Soft ice blue
 ];

 const particleCount = 55;
 const particles: BokehParticle[] = [];

 for (let i = 0; i < particleCount; i++) {
 const maxA = 0.08 + Math.random() * 0.35;
 const p = palette[Math.floor(Math.random() * palette.length)];
 particles.push({
 x: Math.random() * width,
 y: Math.random() * height,
 radius: (1.2 + Math.random() * 3.8) * dpr,
 vx: (Math.random() - 0.5) * 0.35 * dpr,
 vy: (-0.2 - Math.random() * 0.45) * dpr,
 alpha: Math.random() * maxA,
 maxAlpha: maxA,
 phase: Math.random() * Math.PI * 2,
 color: p.color,
 hue: p.hue,
 });
 }

 let time = 0;

 const render = () => {
 time += 0.012;
 ctx.clearRect(0, 0, width, height);

 const cx = width / 2;
 const cy = height / 2;
 const progressRatio = Math.min(1, Math.max(0, progress / 100));
 const mouseX = mouseRef.current.x;
 const mouseY = mouseRef.current.y;
 const exitFade = isExiting ? 0.15 : 1;

 // ─── 1. Deep Space Ambient ───
 const spaceGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(width, height) * 0.7);
 spaceGrad.addColorStop(0, `rgba(18, 16, 8, ${0.25 * exitFade})`);
 spaceGrad.addColorStop(0.4, `rgba(8, 8, 18, ${0.15 * exitFade})`);
 spaceGrad.addColorStop(1, "rgba(2, 3, 10, 0)");
 ctx.fillStyle = spaceGrad;
 ctx.fillRect(0, 0, width, height);

 // ─── 2. Energy Core Pulse ───
 if (progressRatio > 0.05) {
 const pulseIntensity = progressRatio < 0.7
 ? Math.pow(progressRatio / 0.7, 2) * 0.6
 : 0.6 + Math.sin(time * 3) * 0.08;
 const pulseRadius = (80 + progressRatio * 180) * dpr;

 const coreGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, pulseRadius);
 coreGrad.addColorStop(0, `rgba(245, 175, 45, ${0.22 * pulseIntensity * exitFade})`);
 coreGrad.addColorStop(0.3, `rgba(245, 158, 11, ${0.12 * pulseIntensity * exitFade})`);
 coreGrad.addColorStop(0.6, `rgba(217, 119, 6, ${0.04 * pulseIntensity * exitFade})`);
 coreGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
 ctx.fillStyle = coreGrad;
 ctx.beginPath();
 ctx.arc(cx, cy, pulseRadius, 0, Math.PI * 2);
 ctx.fill();
 }

 // ─── 3. Orbital Energy Rings ───
 if (progressRatio > 0.3) {
 const ringAlpha = Math.min(1, (progressRatio - 0.3) / 0.4) * 0.25 * exitFade;
 const ringBaseR = (100 + progressRatio * 120) * dpr;

 [0, 1, 2].forEach((ring) => {
 const r = ringBaseR + ring * 28 * dpr;
 const wobble = Math.sin(time * 1.5 + ring * 2.1) * 8 * dpr;
 const tilt = 0.55 + ring * 0.12;

 ctx.save();
 ctx.translate(cx, cy);
 ctx.scale(1, tilt);
 ctx.beginPath();
 ctx.arc(0, 0, r + wobble, 0, Math.PI * 2);
 ctx.strokeStyle = `rgba(245, 175, 45, ${ringAlpha * (1 - ring * 0.25)})`;
 ctx.lineWidth = (1.2 - ring * 0.3) * dpr;
 ctx.setLineDash([4 * dpr, 12 * dpr + ring * 6 * dpr]);
 ctx.lineDashOffset = -time * 30 + ring * 20;
 ctx.stroke();
 ctx.restore();
 });
 }

 // ─── 4. Anamorphic Lens Flare ───
 if (progressRatio > 0.1 && progressRatio < 0.92) {
 const flareAlpha = Math.sin(progressRatio * Math.PI) * (isExiting ? 0.05 : 0.5);
 const flareWidth = width * 0.9;

 const streakGrad = ctx.createLinearGradient(cx - flareWidth / 2, cy, cx + flareWidth / 2, cy);
 streakGrad.addColorStop(0, "rgba(56, 189, 248, 0)");
 streakGrad.addColorStop(0.2, `rgba(255, 240, 200, ${flareAlpha * 0.3})`);
 streakGrad.addColorStop(0.5, `rgba(255, 255, 255, ${flareAlpha * 0.8})`);
 streakGrad.addColorStop(0.8, `rgba(245, 175, 45, ${flareAlpha * 0.3})`);
 streakGrad.addColorStop(1, "rgba(56, 189, 248, 0)");

 ctx.save();
 ctx.fillStyle = streakGrad;
 ctx.fillRect(cx - flareWidth / 2, cy - 1 * dpr, flareWidth, 2 * dpr);

 // Halo bloom
 const haloGrad = ctx.createRadialGradient(cx, cy, 1 * dpr, cx, cy, 200 * dpr);
 haloGrad.addColorStop(0, `rgba(255, 255, 255, ${flareAlpha * 0.3})`);
 haloGrad.addColorStop(0.3, `rgba(245, 175, 45, ${flareAlpha * 0.12})`);
 haloGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
 ctx.fillStyle = haloGrad;
 ctx.fillRect(cx - 250 * dpr, cy - 80 * dpr, 500 * dpr, 160 * dpr);

 // Chromatic ghost flares
 if (progressRatio > 0.35) {
 const ghostAlpha = flareAlpha * 0.25;
 ctx.fillStyle = `rgba(100, 200, 255, ${ghostAlpha})`;
 ctx.fillRect(cx - flareWidth / 2 - 80 * dpr, cy - 0.5 * dpr, flareWidth * 0.6, 1 * dpr);
 ctx.fillStyle = `rgba(255, 160, 50, ${ghostAlpha})`;
 ctx.fillRect(cx - flareWidth / 2 + 60 * dpr, cy + 0.5 * dpr, flareWidth * 0.6, 1 * dpr);
 }
 ctx.restore();
 }

 // ─── 5. Floating Liquid Gold Bokeh Motes ───
 particles.forEach((p) => {
 p.x += p.vx;
 p.y += p.vy;

 if (p.y < -20) { p.y = height + 20; p.x = Math.random() * width; }
 if (p.x < -20) p.x = width + 20;
 if (p.x > width + 20) p.x = -20;

 const pulse = (Math.sin(time * 1.8 + p.phase) + 1) / 2;
 const currentAlpha = p.maxAlpha * (0.4 + pulse * 0.6) * exitFade;
 const progressFade = progressRatio > 0.02 ? 1 : progressRatio / 0.02;
 const finalAlpha = currentAlpha * progressFade;

 if (finalAlpha < 0.005) return;

 // Soft focus circle
 const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
 grad.addColorStop(0, `${p.color}${finalAlpha})`);
 grad.addColorStop(0.5, `${p.color}${finalAlpha * 0.4})`);
 grad.addColorStop(1, `${p.color}0)`);
 ctx.fillStyle = grad;
 ctx.beginPath();
 ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
 ctx.fill();

 // Mouse proximity — particles gently attract
 const dx = mouseX - p.x;
 const dy = mouseY - p.y;
 const dist = Math.sqrt(dx * dx + dy * dy);
 if (dist < 150 * dpr && dist > 0) {
 const force = (1 - dist / (150 * dpr)) * 0.4;
 p.vx += (dx / dist) * force * 0.08;
 p.vy += (dy / dist) * force * 0.08;
 }

 // Damping
 p.vx *= 0.998;
 p.vy *= 0.998;
 });

 // ─── 6. Lock Phase — Energy Surge ───
 if (phase === "lock" || phase === "resolve") {
 const surgeAlpha = phase === "resolve" ? 0.35 * exitFade : 0.2 * exitFade;
 const surgeR = (60 + (phase === "resolve" ? 80 : 0)) * dpr;

 const surgeGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, surgeR);
 surgeGrad.addColorStop(0, `rgba(255, 255, 255, ${surgeAlpha})`);
 surgeGrad.addColorStop(0.2, `rgba(245, 210, 120, ${surgeAlpha * 0.8})`);
 surgeGrad.addColorStop(0.5, `rgba(245, 175, 45, ${surgeAlpha * 0.3})`);
 surgeGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
 ctx.fillStyle = surgeGrad;
 ctx.beginPath();
 ctx.arc(cx, cy, surgeR, 0, Math.PI * 2);
 ctx.fill();
 }

 // ─── 7. Floating Data Dust (Lock+) ───
 if (progressRatio > 0.6) {
 const dustAlpha = Math.min(1, (progressRatio - 0.6) / 0.3) * 0.15 * exitFade;
 for (let i = 0; i < 12; i++) {
 const angle = (i / 12) * Math.PI * 2 + time * 0.3;
 const orbitR = (160 + i * 12) * dpr + Math.sin(time * 2 + i) * 15 * dpr;
 const dx = cx + Math.cos(angle) * orbitR;
 const dy = cy + Math.sin(angle) * orbitR * 0.4;

 ctx.fillStyle = `rgba(245, 175, 45, ${dustAlpha * (0.5 + Math.sin(time * 3 + i) * 0.5)})`;
 ctx.beginPath();
 ctx.arc(dx, dy, 1.5 * dpr, 0, Math.PI * 2);
 ctx.fill();
 }
 }

 animId = requestAnimationFrame(render);
 };

 render();

 return () => {
 cancelAnimationFrame(animId);
 window.removeEventListener("resize", handleResize);
 window.removeEventListener("mousemove", handleMouseMove);
 };
 }, [progress, isExiting, phase]);

 return (
 <canvas
 ref={canvasRef}
 className="absolute inset-0 pointer-events-none z-0 transition-opacity duration-700"
 style={{ opacity: isExiting ? 0 : 1 }}
 />
 );
}
