import { useState, useRef, useCallback } from "react";

/**
 * Live width of an element, or 0 when it isn't mounted.
 *
 * The window-control cluster's width used to be a hardcoded 142. It happened to
 * be right, which is worse than being wrong: adding one button to that corner
 * silently slides the board strip's `+` underneath the overlay, where it can't
 * be clicked. Measuring costs one observer and can't drift.
 */
export function useMeasuredWidth(initial = 0) {
 const [width, setWidth] = useState(initial);
 const observer = useRef<ResizeObserver | null>(null);
 // A callback ref, not useRef+useEffect: the elements measured here mount and
 // unmount with the dock, and React hands the callback `null` on unmount so
 // the width drops to 0 instead of freezing at the last dock size.
 const ref = useCallback((el: HTMLElement | null) => {
 observer.current?.disconnect();
 if (!el) {
 setWidth(0);
 return;
 }
 const measure = () => setWidth(el.getBoundingClientRect().width);
 observer.current = new ResizeObserver(measure);
 observer.current.observe(el);
 measure();
 }, []);
 return [ref, width] as const;
}
