"use client";

import { useEffect, useCallback, useRef, useState } from "react";

type Size = "sm" | "md" | "lg" | "xl";

const SIZE_CLASSES: Record<Size, string> = {
 sm: "max-w-[420px]",
 md: "max-w-[560px]",
 lg: "max-w-[720px]",
 xl: "max-w-[900px]",
};

const FOCUSABLE_SELECTOR =
 "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

interface ModalProps {
 open: boolean;
 onClose: () => void;
 children: React.ReactNode;
 title?: string;
 size?: Size;
 staggerDelay?: number;
}

export default function Modal({
 open,
 onClose,
 children,
 title,
 size = "md",
 staggerDelay = 40,
}: ModalProps) {
 const [visible, setVisible] = useState(false);
 const [animatingOut, setAnimatingOut] = useState(false);
 const panelRef = useRef<HTMLDivElement>(null);
 const stableOnClose = useRef(onClose);
 stableOnClose.current = onClose;

 const handleClose = useCallback(() => {
 stableOnClose.current();
 }, []);

 useEffect(() => {
 if (open && !visible) {
 setAnimatingOut(false);
 setVisible(true);
 } else if (!open && visible && !animatingOut) {
 setAnimatingOut(true);
 }
 }, [open, visible, animatingOut]);

 const handleAnimationEnd = useCallback(() => {
 if (animatingOut) {
 setAnimatingOut(false);
 setVisible(false);
 }
 }, [animatingOut]);

 // Focus trap + Escape handling
 useEffect(() => {
 const container = panelRef.current;
 if (!container || !visible) return;

 const previousFocus = document.activeElement as HTMLElement | null;

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape") {
 e.preventDefault();
 e.stopPropagation();
 handleClose();
 return;
 }

 if (e.key !== "Tab") return;

 const focusable = Array.from(
 container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
 ).filter((el) => el.offsetParent !== null);

 if (focusable.length === 0) {
 e.preventDefault();
 return;
 }

 const first = focusable[0];
 const last = focusable[focusable.length - 1];

 if (e.shiftKey) {
 if (document.activeElement === first || !container.contains(document.activeElement)) {
 e.preventDefault();
 last.focus();
 }
 } else {
 if (document.activeElement === last || !container.contains(document.activeElement)) {
 e.preventDefault();
 first.focus();
 }
 }
 };

 container.addEventListener("keydown", handleKeyDown);

 const timer = setTimeout(() => {
 const first = container.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
 first?.focus();
 }, 0);

 return () => {
 clearTimeout(timer);
 container.removeEventListener("keydown", handleKeyDown);
 previousFocus?.focus();
 };
 }, [visible, handleClose]);

 // Body scroll lock
 useEffect(() => {
 if (!visible) return;
 const original = document.body.style.overflow;
 document.body.style.overflow = "hidden";
 return () => {
 document.body.style.overflow = original;
 };
 }, [visible]);

 if (!visible) return null;

 const overlayAnim = animatingOut ? "animate-overlay-exit" : "animate-overlay-enter";
 const panelAnim = animatingOut ? "animate-modal-exit" : "animate-modal-enter";

 const childArray = Array.isArray(children) ? children : [children];
 const shouldStagger = staggerDelay > 0 && childArray.length > 1;

 return (
 <div
 className={"fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-md " + overlayAnim}
 onClick={handleClose}
 >
 <div
 ref={panelRef}
 className={
 "w-full mx-4 rounded-2xl border border-zinc-700/60 bg-zinc-950/95 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col "
 + SIZE_CLASSES[size]
 + " "
 + panelAnim
 }
 onClick={(e) => e.stopPropagation()}
 onAnimationEnd={animatingOut ? handleAnimationEnd : undefined}
 >
 {title && (
 <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800/60 shrink-0">
 <h2 className="text-sm font-semibold text-zinc-100">{title}</h2>
 <button
 onClick={handleClose}
 className="text-zinc-400 hover:text-zinc-200 transition-colors p-1 rounded-md hover:bg-zinc-800/50"
 aria-label="Close"
 >
 ✕
 </button>
 </div>
 )}
 <div className="p-4 overflow-y-auto">
 {shouldStagger
 ? childArray.map((child, i) => (
 <div
 key={i}
 className="palette-stagger-item"
 style={{ animationDelay: i * staggerDelay + "ms" }}
 >
 {child}
 </div>
 ))
 : children}
 </div>
 </div>
 </div>
 );
}
