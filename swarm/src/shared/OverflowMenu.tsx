"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { MoreHorizontal } from "lucide-react";

export interface OverflowItem {
  id: string;
  label: string;
  hint?: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
  onSelect: () => void;
}

/**
 * The app's overflow menu.
 *
 * Everything that acts on the application rather than on a pane lives behind
 * one glyph: settings, extensions, plan limits, opening a project. They were
 * a row of six icons competing with the panes for the same strip; as a menu
 * they cost one button and gain readable labels.
 */
/** Must match the `w-56` on the panel below — the clamp needs a real number. */
const MENU_W = 224;

export default function OverflowMenu({ items }: { items: OverflowItem[] }) {
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        btnRef.current?.focus();
        return;
      }
      if (e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
      e.preventDefault();
      const rows = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[data-row]") ?? []);
      if (rows.length === 0) return;
      const at = rows.indexOf(document.activeElement as HTMLButtonElement);
      const next = e.key === "ArrowDown"
        ? (at + 1) % rows.length
        : (at - 1 + rows.length) % rows.length;
      rows[next]?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) menuRef.current?.querySelector<HTMLButtonElement>("[data-row]")?.focus();
  }, [open]);

  // The panel is positioned from a rect measured at open time. Resizing the
  // window (or dragging it between displays) leaves that rect stale and the
  // menu floating detached from its button, so close rather than mis-place it.
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("resize", close);
    return () => window.removeEventListener("resize", close);
  }, [open]);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => {
          setRect(btnRef.current?.getBoundingClientRect() ?? null);
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="More"
        title="More"
        className={`shrink-0 flex items-center justify-center size-7 rounded-lg border transition-all cursor-pointer ${
          open
            ? "border-white/30 bg-white/15 text-white shadow-xs"
            : "border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        }`}
      >
        <MoreHorizontal size={15} strokeWidth={2.2} />
      </button>

      {open &&
        rect &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[300]" onClick={() => setOpen(false)} />
            <div
              ref={menuRef}
              role="menu"
              aria-label="More"
              className="fixed z-[301] w-56 overflow-y-auto scrollbar-sleek rounded-2xl bg-[#0d0f17]/98 backdrop-blur-2xl border border-white/[0.14] p-1.5 shadow-2xl shadow-black/90 animate-fade-in"
              style={{
                top: rect.bottom + 6,
                left: Math.min(Math.max(8, rect.left), window.innerWidth - MENU_W - 8),
                maxHeight: Math.max(120, window.innerHeight - rect.bottom - 16),
              }}
            >
              {items.map(({ id, label, hint, icon: Icon, onSelect }) => (
                <button
                  key={id}
                  data-row
                  role="menuitem"
                  onClick={() => {
                    setOpen(false);
                    onSelect();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-left text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white group cursor-pointer"
                >
                  <Icon size={14} className="shrink-0 text-slate-300 group-hover:text-white" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{label}</span>
                    {hint && (
                      <span className="block truncate text-[10px] text-zinc-400">{hint}</span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}
