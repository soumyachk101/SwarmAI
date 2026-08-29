import { useEffect, type RefObject } from "react";

/**
 * Hook that traps Tab / Shift+Tab focus within a container.
 * Wraps focus to the first and last focusable child so keyboard users
 * cannot tab into content behind an open modal.
 */
export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, active: boolean): void {
 useEffect(() => {
 if (!active || !containerRef.current) return;

 const container = containerRef.current;

 const getFocusable = (): HTMLElement[] => {
 const selectors = [
 "a[href]",
 "button:not([disabled])",
 "input:not([disabled])",
 "textarea:not([disabled])",
 "select:not([disabled])",
 "[tabindex]:not([tabindex='-1'])",
 "audio[controls]",
 "video[controls]",
 "[contenteditable]:not([contenteditable='false'])",
 ];
 return Array.from(container.querySelectorAll(selectors.join(", "))).filter(
 (el): el is HTMLElement => el instanceof HTMLElement && el.offsetParent !== null
 );
 };

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key !== "Tab") return;

 const focusable = getFocusable();
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

 const focusable = getFocusable();
 if (focusable.length > 0) {
 focusable[0].focus();
 }

 document.addEventListener("keydown", handleKeyDown);
 return () => document.removeEventListener("keydown", handleKeyDown);
 }, [containerRef, active]);
}
