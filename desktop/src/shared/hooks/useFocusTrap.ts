import { useEffect, useRef, useCallback } from "react";

/**
 * Focusable element selector: buttons, links, inputs, selects, textareas,
 * and any element with a non-negative tabindex.
 */
const FOCUSABLE_SELECTOR =
 "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])";

interface UseFocusTrapOptions {
 /** Called when the user presses Escape inside the container. */
 onEscape?: () => void;
 /** Whether the trap is active. Defaults to true. */
 enabled?: boolean;
}

/**
 * Traps keyboard focus within a container element, returns focus to the
 * trigger on unmount, and optionally handles the Escape key.
 *
 * No external dependencies — pure vanilla JS via DOM APIs.
 */
export function useFocusTrap<T extends HTMLElement = HTMLElement>(
 options: UseFocusTrapOptions = {}
) {
 const { onEscape, enabled = true } = options;
 const containerRef = useRef<T>(null);
 const previousFocusRef = useRef<HTMLElement | null>(null);

 useEffect(() => {
 const container = containerRef.current;
 if (!container || !enabled) return;

 // Remember where focus was before the modal opened so we can restore it.
 previousFocusRef.current = document.activeElement as HTMLElement | null;

 const handleKeyDown = (e: KeyboardEvent) => {
 if (e.key === "Escape") {
 if (onEscape) {
 e.preventDefault();
 e.stopPropagation();
 onEscape();
 }
 return;
 }

 if (e.key !== "Tab") return;

 const focusable = Array.from(
 container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
 ).filter((el) => el.offsetParent !== null); // skip hidden elements

 if (focusable.length === 0) {
 e.preventDefault();
 return;
 }

 const first = focusable[0];
 const last = focusable[focusable.length - 1];

 if (e.shiftKey) {
 // Shift+Tab: if focus is on the first element, wrap to last.
 if (document.activeElement === first || !container.contains(document.activeElement)) {
 e.preventDefault();
 last.focus();
 }
 } else {
 // Tab: if focus is on the last element, wrap to first.
 if (document.activeElement === last || !container.contains(document.activeElement)) {
 e.preventDefault();
 first.focus();
 }
 }
 };

 container.addEventListener("keydown", handleKeyDown);

 // Move focus into the container once it's mounted.
 const focusable = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
 const firstFocusable = focusable[0];
 if (firstFocusable) {
 // Use setTimeout so the focus call runs after React has finished
 // painting the modal content into the DOM.
 const timer = setTimeout(() => firstFocusable.focus(), 0);
 return () => {
 clearTimeout(timer);
 container.removeEventListener("keydown", handleKeyDown);
 // Return focus to whatever had it before the modal opened.
 previousFocusRef.current?.focus();
 };
 }

 return () => {
 container.removeEventListener("keydown", handleKeyDown);
 previousFocusRef.current?.focus();
 };
 }, [enabled, onEscape]);

 return containerRef;
}
