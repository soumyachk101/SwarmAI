"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { Plus, X, Maximize2, Minimize2 } from "lucide-react";
import { themeForKind } from "./themes.js";
import { activatable } from "./activatable.js";
import BoardLogo from "./BoardLogo.js";

export interface StripItem {
  id: string;
  name: string;
  /** Agent kind — drives the chip accent (agent = gold, shell = blade). */
  kind?: string;
  icon?: ReactNode;
}

/**
 * The Board board's top strip: the app logo (only when maximized), a chip
 * per open component (name + close), and the + button to add more. Purely
 * presentational — the host owns state and the add menu.
 */
export default function BoardStrip({
  items,
  activeId,
  showLogo = false,
  onSelect,
  onClose,
  onAdd,
  addRef,
  fullscreen,
  onToggleFullscreen,
  logoNode,
  viewToggle,
  leading,
  reserveRight,
}: {
  items: StripItem[];
  activeId?: string | null;
  showLogo?: boolean;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onAdd: () => void;
  addRef?: React.Ref<HTMLButtonElement>;
  fullscreen?: boolean;
  onToggleFullscreen?: () => void;
  /** App logo shown when maximized (showLogo); falls back to the Board mark. */
  logoNode?: ReactNode;
  /** Board / Flow switch. Rendered leftmost: it changes what the whole
   *  surface below is, so it outranks anything acting on a single pane. */
  viewToggle?: ReactNode;
  /** App-level controls (mark, sidebar toggles). This row is the top of the
   *  window in its column — there is no bar above it to hold them. */
  leading?: ReactNode;
  /** Right padding reserved for the floating window controls, so the last
   *  chip and the `+` never slide underneath them. */
  reserveRight?: number;
}) {
  // The strip scrolls once enough panes are open, and panes are just as often
  // activated from somewhere else (a keyboard shortcut, the sidebar, a drag
  // swap) as from the strip itself. Without this the active chip can sit
  // scrolled off-screen and the strip looks like it lost the selection.
  const activeRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activeId]);

  return (
    // Only the tabs scroll horizontally. App controls and the view switch sit
    // left, then the scrolling tab block, then + and maximize pinned in-flow at
    // the right — so + can never slide under the maximize button.
    <div
      className="flex h-11 shrink-0 items-center gap-1.5 border-b border-swarm-border/50 glass-toolbar px-2"
      style={reserveRight ? { paddingRight: reserveRight } : undefined}
      data-tauri-drag-region
    >
      {leading}
      {showLogo && (logoNode ?? <BoardLogo size={18} className="shrink-0 text-swarm-gold" />)}
      {viewToggle}
      {viewToggle && <span className="h-5 w-px shrink-0 bg-swarm-border/60" />}

      {items.length > 0 && (
        <div className="flex flex-1 min-w-0 items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden py-0.5">
          {items.map((it) => {
            const t = themeForKind(it.kind);
            const active = activeId === it.id;
            return (
              <div
                key={it.id}
                ref={active ? activeRef : undefined}
                onClick={() => onSelect(it.id)}
                {...activatable(() => onSelect(it.id), it.name)}
                aria-current={active ? "true" : undefined}
                className={`group flex h-7 shrink-0 cursor-pointer select-none items-center gap-2 rounded-lg border px-2.5 text-xs font-medium transition-all ${
                  active
                    ? "border-white/[0.16] bg-white/[0.08] text-white shadow-sm ring-1 ring-white/[0.06]"
                    : "border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                }`}
                title={it.name}
              >
                <span
                  className="size-1.5 shrink-0 rounded-full"
                  style={{ background: t.accent, boxShadow: active ? `0 0 0 3px ${t.accentSoft}` : undefined }}
                  aria-hidden
                />
                {it.icon && <span className="shrink-0 text-slate-400">{it.icon}</span>}
                <span className="max-w-[160px] truncate">{it.name}</span>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onClose(it.id); }}
                  className="shrink-0 rounded p-0.5 opacity-0 transition-opacity hover:bg-white/[0.1] hover:text-white group-hover:opacity-100 focus-visible:opacity-100"
                  title={`Close ${it.name}`}
                  aria-label={`Close ${it.name}`}
                >
                  <X className="size-3" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* + and maximize sit OUTSIDE the scroller and in normal flow */}
      <button
        type="button"
        ref={addRef}
        onClick={onAdd}
        className="flex size-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.05] text-slate-300 transition-all hover:bg-white/[0.1] hover:text-white active:scale-95"
        title="Add component"
        aria-label="Add component"
      >
        <Plus className="size-4" />
      </button>
      {onToggleFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          // Tokenised hover, not bg-black: on the lighter themes a black wash
          // reads as a hole punched in the toolbar rather than a hover state.
          // No `ml-auto`: it shoved this button to the far right and left a dead
          // stretch of toolbar between it and `+` that read as a missing group.
          // The empty run at the right end is the window controls' reserved
          // space (reserveRight), not a gap in the layout.
          className="flex size-6.5 shrink-0 items-center justify-center rounded-md text-swarm-textMuted transition-colors hover:bg-swarm-border/60 hover:text-swarm-text"
          title={fullscreen ? "Restore" : "Maximize plane"}
          aria-label={fullscreen ? "Restore" : "Maximize plane"}
        >
          {fullscreen ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
        </button>
      )}
    </div>
  );
}
