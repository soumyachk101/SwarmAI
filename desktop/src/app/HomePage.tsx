"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import PlaneHost from "@/features/panes/PlaneHost";
import { usePlaneStore } from "@/features/panes/planeStore";
import { TasksPanel } from "@swarm/tasks";
import { SessionHistory } from "@swarm/pheromone/ui";
import { VoiceHotkeys } from "@swarm/voice/ui";
import SwarmLogo from "@/shared/SwarmLogo";
import SettingsPage from "@/features/settings/SettingsPage";
import UpdateCheckerModal from "@/features/updates/UpdateCheckerModal";
import { ExtensionsMarketplace } from "@swarm/extension";
import { Blocks, Gauge } from "lucide-react";
import { useAgentsStore, CliUsagePanel, setupStorageSync } from "@swarm/agents/ui";
import { getTauriAPIs, loadTauriAPIs, isTauri } from "@/shared/tauri";
import { WorkspacesSidebar as ADEWorktreeSidebar } from "@swarm/workspace/ui";
import ADERightDock from "@/features/dock/RightDock";
import { useWorkspaceStore } from "@swarm/workspace";
import { useUiStore } from "@/shared/uiStore";
import { useSettingsStore } from "@/features/settings/settingsStore";
import { themeAccentHex } from "@/shared/themes";
import { useThemeStore } from "@/shared/themeStore";
import { ensurePheromoneMcpForProject } from "@swarm/agents/ui";
import { useLeadBridge } from "@swarm/lead/ui";
import {
  Settings,
  X,
  Minus,
  Square,
  Copy,
  FolderOpen,
  Folder,
  GitBranch,
  PanelLeft,
  PanelRight,
  Columns3,
  Mic,
  FolderGit2,
 History,
} from "lucide-react";
import ThemePicker from "@/shared/ThemePicker";
import OverflowMenu from "@/shared/OverflowMenu";
import CommandPalette from "@/shared/CommandPalette";
import ShortcutsModal from "@/shared/ShortcutsModal";
import OnboardingModal, { useOnboarding } from "@/shared/OnboardingModal";
import CommandHistoryPopup from "@/shared/CommandHistoryPopup";
import GitControlModal from "@/features/git/GitControlModal";
import UserGuideModal from "@/features/help/UserGuideModal";
import SwarmDashboardModal from "@/features/dashboard/SwarmDashboardModal";
import DiffPreviewModal from "@/features/diff/DiffPreviewModal";
import TaskTemplatesModal from "@/features/templates/TaskTemplatesModal";
import MacWindowControls from "@/shared/MacWindowControls";
import { BookOpen, Activity, FileDiff, Layers, Sparkles } from "lucide-react";
import { AppOpeningAnimation, useSplashStore } from "@/features/splash";


/**
 * Live width of an element, or 0 when it isn't mounted.
 *
 * The window-control cluster's width used to be a hardcoded 142. It happened to
 * be right, which is worse than being wrong: adding one button to that corner
 * silently slides the board strip's `+` underneath the overlay, where it can't
 * be clicked. Measuring costs one observer and can't drift.
 */
function useMeasuredWidth(initial = 0) {
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

export default function HomePage() {
  const isMac = typeof navigator !== "undefined" && (/Mac|iPod|iPhone|iPad/.test(navigator.userAgent) || navigator.platform?.includes("Mac"));
  const [isMaximized, setIsMaximized] = useState(false);
  const [windowControlsRef, windowControlsWidth] = useMeasuredWidth(isMac ? 68 : 142);
  const [dockRef, dockWidth] = useMeasuredWidth();
  const [showSettings, setShowSettings] = useState(false);
  const [showUpdates, setShowUpdates] = useState(false);
  const [showExtensions, setShowExtensions] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showPalette, setShowPalette] = useState(false);
  const [showGitModal, setShowGitModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showDiffModal, setShowDiffModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const onboarding = useOnboarding();
  const [gitStatus, setGitStatus] = useState<{
    branch: string;
    changed: number;
  } | null>(null);

  // Sidebar state: pinned = takes flex space, unpinned = overlay.
  // Open/closed lives in uiStore so Lead's tools can toggle it too.
  const [leftPinned, setLeftPinned] = useState(true);
  const leftOpen = useUiStore((s) => s.leftOpen);
  const rightOpen = useUiStore((s) => s.rightOpen);
  const setLeftOpen = useUiStore((s) => s.setLeftOpen);
  const setRightOpen = useUiStore((s) => s.setRightOpen);
  const toggleLeft = useUiStore((s) => s.toggleLeft);
  const toggleRight = useUiStore((s) => s.toggleRight);

  // Only the statuses are read here. Subscribing to the whole agents array
  // re-rendered the entire shell (and every dock/pane inside it) on each
  // agent-store tick, which is what made resizing and typing feel sticky.
  const agentStatuses = useAgentsStore((state) => state.agentStatuses);
  // A scalar selector, so this re-renders on a count change and not on every
  // mutation of the agents array.
  const totalAgents = useAgentsStore((state) => state.agents.length);
  const refitTerminals = useAgentsStore((state) => state.refitTerminals);
  const statusList = Object.values(agentStatuses);
  const busyAgents = statusList.filter((s) => s === "running" || s === "launching").length;
  const erroredAgents = statusList.filter((s) => s === "error").length;
  const workspaces = useWorkspaceStore((s) => s.workspaces);
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const boardOpen = useWorkspaceStore((s) => s.boardOpen);
  const setBoardOpen = useWorkspaceStore((s) => s.setBoardOpen);
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  // The project shown in the chrome is whatever the active agent is bound
  // to — other workspaces keep their own folders open and running behind it.
  const projectPath = activeWorkspace?.boundProjectPath || null;

  // Answer Lead's tool calls for as long as a project is open — the crowned
  // CLI can be talking even while its dock tab is hidden.
  useLeadBridge();

 // Cross-tab storage sync: when another window changes localStorage, reload
 // to re-hydrate every persisted Zustand store in this tab.
 setupStorageSync(() => window.location.reload());

  useEffect(() => {
    const id = requestAnimationFrame(() => refitTerminals());
    return () => cancelAnimationFrame(id);
  }, []);

  // Native minimize/restore doesn't reliably fire a DOM resize on the
  // terminal panes, so xterm's canvas goes stale and glyphs overlap on
  // restore. Window focus (which restore always triggers) forces a refit.
  useEffect(() => {
    window.addEventListener("focus", refitTerminals);
    return () => window.removeEventListener("focus", refitTerminals);
  }, [refitTerminals]);

  // The window can be maximized without going through our button — OS snap,
  // a double-click on the drag region, a keyboard shortcut. Mirroring the real
  // state keeps the restore icon honest instead of frozen on whatever the last
  // in-app click did.
  useEffect(() => {
    let cancelled = false;
    let unlisten: (() => void) | undefined;
    (async () => {
      try {
        const apis = await loadTauriAPIs();
        if (!apis?.getCurrentWindow) return;
        const win = apis.getCurrentWindow();
        const sync = async () => {
          const max = await win.isMaximized();
          if (!cancelled) setIsMaximized(max);
        };
        await sync();
        unlisten = await win.onResized(sync);
        // The effect may have been torn down while onResized was in flight.
        if (cancelled) unlisten();
      } catch (e) {
        console.error("Failed to initialize window:", e);
      }
    })();
    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setShowPalette((prev) => !prev);
        return;
      }
      if (e.ctrlKey && e.key === "b") {
        // Let a focused terminal/input keep Ctrl+B (tmux prefix, readline, etc.)
        // instead of the global dock toggle stealing it — same guard used for
        // Ctrl+C interception in AgentPane. contentEditable counts too: the
        // GlassChat embed composes in one, and losing every ^B there reads as
        // the panel eating keystrokes.
        const active = document.activeElement;
        if (
          active instanceof HTMLTextAreaElement ||
          active instanceof HTMLInputElement ||
          (active instanceof HTMLElement && active.isContentEditable)
        ) {
          return;
        }
        e.preventDefault();
        toggleRight();
      }
    };

    // Dropdowns close via their own click-catcher overlay.
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleMinimize = async () => {
    try {
      const apis = getTauriAPIs();
      if (apis?.getCurrentWindow) {
        const window = apis.getCurrentWindow();
        if (window) await window.minimize();
      }
    } catch (e) {
      console.error("Failed to minimize window:", e);
    }
  };

  const handleMaximize = async () => {
    try {
      const apis = getTauriAPIs();
      if (apis?.getCurrentWindow) {
        const window = apis.getCurrentWindow();
        // Toggle against the window's own state, not ours: acting on a stale
        // `isMaximized` sent the window the wrong way after an OS-side snap.
        if (window) {
          await window.toggleMaximize();
          setIsMaximized(await window.isMaximized());
        }
      }
    } catch (e) {
      console.error("Failed to toggle maximize:", e);
    }
  };

  const handleClose = async () => {
    try {
      const apis = getTauriAPIs();
      if (apis?.getCurrentWindow) {
        const window = apis.getCurrentWindow();
        if (window) await window.close();
      }
    } catch (e) {
      console.error("Failed to close window:", e);
    }
  };


  const handleFolderSelect = async (folderPath: string) => {
    // One call decides everything: reuse the swarm already bound to this folder,
    // adopt the active swarm if it is unbound, or start a new one named after the
    // folder — including the very first swarm on a fresh install. The rule lives
    // in the Workspace package, not here.
    useWorkspaceStore
      .getState()
      .openFolder(folderPath, themeAccentHex(useThemeStore.getState().themeId));
    try {
      const apis = getTauriAPIs();
      if (apis?.invoke) {
        await apis.invoke("ensure_pheromone_structure", { projectPath: folderPath });
      }
      // Auto-wire Pheromone MCP (+ approve all project MCP servers) as soon as the
      // folder is opened — not only when a Agent pane spawns.
      const defaultCli = useSettingsStore.getState().defaultAgent || "claude";
      await ensurePheromoneMcpForProject(folderPath, defaultCli);
    } catch (e) {
      console.error("Failed to initialize Pheromone for folder:", e);
    }
  };

  const handleOpenFolder = async () => {
    try {
      const apis = getTauriAPIs();
      if (apis?.open) {
        const folderPath = await apis.open({ directory: true, multiple: false, title: "Open Folder" });
        if (folderPath && typeof folderPath === "string") {
          await handleFolderSelect(folderPath);
        }
        return;
      }

      // Browser Web Fallback (HTML5 File System Access API for Vercel / Chrome / Edge)
      if (typeof window !== "undefined" && "showDirectoryPicker" in window) {
        try {
          const dirHandle = await (window as any).showDirectoryPicker({ mode: "readwrite" });
          if (dirHandle?.name) {
            await handleFolderSelect(`/${dirHandle.name}`);
          }
        } catch (err: any) {
          if (err.name !== "AbortError") {
            console.error("Directory picker error:", err);
          }
        }
        return;
      }

      // Universal Input Fallback
      if (typeof document !== "undefined") {
        const input = document.createElement("input");
        input.type = "file";
        (input as any).webkitdirectory = true;
        input.onchange = async (e: any) => {
          const files = e.target.files;
          if (files && files.length > 0) {
            const firstPath = files[0].webkitRelativePath || files[0].name;
            const rootDir = firstPath.split("/")[0] || "Workspace";
            await handleFolderSelect(`/${rootDir}`);
          }
        };
        input.click();
      }
    } catch (e) {
      console.error("Failed to open folder:", e);
    }
  };

  /**
   * The window's top-left corner, rendered inside the sidebar.
   */
  const appRow = (
    <div className="flex w-full items-center justify-between min-w-0">
      <div className="flex items-center gap-2 min-w-0">
        {isMac && (
          isTauri() ? (
            <div className="w-[65px] shrink-0 h-full select-none" data-tauri-drag-region />
          ) : (
            <MacWindowControls
              onClose={handleClose}
              onMinimize={handleMinimize}
              onMaximize={handleMaximize}
              isMaximized={isMaximized}
              className="pl-0 pr-1"
            />
          )
        )}
        <span className="text-xs font-semibold text-zinc-300 truncate tracking-tight">
          Workspaces
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          onClick={() => setBoardOpen(!boardOpen)}
          className={`size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            boardOpen
              ? "text-swarm-goldHi bg-swarm-gold/[0.18] border border-swarm-gold/40 shadow-xs"
              : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
          }`}
          title="Toggle Tasks Panel"
        >
          <Columns3 size={14} />
        </button>
        <button
          onClick={() => toggleLeft()}
          className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition-all cursor-pointer"
          title="Collapse sidebar"
        >
          <PanelLeft size={14} />
        </button>
      </div>
    </div>
  );

  useEffect(() => {
    if (!projectPath) { setGitStatus(null); return; }
    let cancelled = false;
    const fetchStatus = async () => {
      try {
        const apis = getTauriAPIs();
        if (!apis?.invoke) return;
        const status = await apis.invoke<{ branch: string; changed: number }>("git_status", { projectPath });
        if (!cancelled) setGitStatus(status);
      } catch { if (!cancelled) setGitStatus(null); }
    };
    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [projectPath]);

  // Pane adds live in each plane's own header now (see PlaneHost).


  // Pinned sidebars take flex space (docked); unpinned float over the content.
  const leftTakesSpace = leftPinned && leftOpen;
  // Right dock always reserves space when open — floating it over the center
  // buried the Mission Pipeline's right edge under the panel.
  // A fullscreen plane covers the dock anyway, and its floating widgets take
  // over there. Unmount it rather than leaving it hidden underneath: the dock
  // and the widget would otherwise both mount the Lead's pane, and two
  // xterms draining one pty leaves the widget blank.
  const planeFullscreen = usePlaneStore((s) => s.fullscreen);
  const dockVisible = rightOpen && !planeFullscreen;

  return (
    <div className="h-screen w-screen flex flex-col text-swarm-text font-sans select-none">
      {/*
        No window-wide title bar. The window is three columns that each start
        at the very top: sidebar, centre, dock. The centre column's first row
        IS the pane strip, which is why resizing the sidebar shifts the strip
        with it — they are one component, not a bar with panes underneath.

        Splitting them is what broke fullscreen: the strip stayed pinned to a
        bar the fullscreen plane had already covered.

        Only the app/window controls float, fixed to the window's top-right
        corner, because those belong to the window rather than to any column.
      */}
      {/*
        "deep" so the padding and the gaps between the controls drag the window
        too — a bare drag region only reacts to direct hits on itself, which
        left this whole corner dead except for the container's own few pixels.
        Buttons still click: Tauri stops the walk at any clickable element.

        No onDoubleClick either: Tauri's drag region already toggles maximize on
        double-click, so handling it again toggled it straight back — and the
        handler fired for double-clicks on the buttons as well.
      */}
      <div
        ref={windowControlsRef}
        className="fixed right-2 top-1.5 z-[60] flex h-8 items-center gap-1"
        data-tauri-drag-region="deep"
      >
        {/* Window controls only */}
        <div className="flex items-center gap-1 bg-[#121520]/95 backdrop-blur-xl px-1.5 py-0.5 rounded-xl border border-white/[0.12] shadow-lg">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent("swarm:voice:toggle", { detail: { mode: "lead" } }))}
            className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-swarm-gold hover:bg-white/[0.08] transition-colors cursor-pointer"
            title="Voice Dictation (Click or Win+Alt / Ctrl+Win)"
          >
            <Mic size={14} />
          </button>
          <button
            onClick={() => toggleRight()}
            className={`size-7 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
              rightOpen
                ? "text-swarm-goldHi bg-swarm-gold/[0.18] border border-swarm-gold/40 shadow-xs"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08]"
            }`}
            title="Toggle right panel"
          >
            <PanelRight size={14} />
          </button>
          <OverflowMenu
            items={[
              {
                id: "replay-splash",
                label: "Replay Opening Animation",
                hint: "Cinematic 3D intro",
                icon: Sparkles,
                onSelect: () => useSplashStore.getState().openSplash(true),
              },
              {
                id: "dashboard",
                label: "Swarm Dashboard",
                hint: "Live telemetry & logs",
                icon: Activity,
                onSelect: () => setShowDashboard(true),
              },
              {
                id: "templates",
                label: "Task Templates",
                hint: "Multi-agent pipelines",
                icon: Layers,
                onSelect: () => setShowTemplatesModal(true),
              },
              {
                id: "extensions",
                label: "Extensions Marketplace",
                hint: "Agents & tools",
                icon: Blocks,
                onSelect: () => setShowExtensions(true),
              },
              {
                id: "settings",
                label: "Settings & Tools",
                hint: "API keys & models",
                icon: Settings,
                onSelect: () => setShowSettings(true),
              },
              {
                id: "guide",
                label: "User Guide & Docs",
                hint: "Architecture & manual",
                icon: BookOpen,
                onSelect: () => setShowGuide(true),
              },
            ]}
          />
          {!isMac && (
            <>
              <div className="w-px h-4 bg-swarm-border/40 mx-0.5" />
              <button
                onClick={handleMinimize}
                className="p-1.5 rounded-md hover:bg-swarm-border/60 text-swarm-textMuted hover:text-swarm-text transition-colors"
                title="Minimize"
              >
                <Minus size={14} />
              </button>
              <button
                onClick={handleMaximize}
                className="p-1.5 rounded-md hover:bg-swarm-border/60 text-swarm-textMuted hover:text-swarm-text transition-colors"
                title={isMaximized ? "Restore" : "Maximize"}
              >
                {isMaximized ? <Copy size={14} /> : <Square size={14} />}
              </button>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-md hover:bg-swarm-err/80 text-swarm-textMuted hover:text-white transition-colors"
                title="Close"
              >
                <X size={14} />
              </button>
            </>
          )}
        </div>
      </div>

      {showUsage && (
        <>
          <div className="fixed inset-0 z-[149]" onClick={() => setShowUsage(false)} />
          <div className="fixed left-3 top-14 z-[150] animate-fade-in">
            <CliUsagePanel onClose={() => setShowUsage(false)} />
          </div>
        </>
      )}

      {/* The three columns. Starts at the very top of the window: there is no
          bar above it. position:relative so floating (unpinned) sidebars
          anchor here. */}
      <div className="relative flex-1 flex overflow-hidden">
        {/* Left sidebar — docked (takes space) when pinned, floating overlay when unpinned */}
        {leftOpen && (
          <div className={`${leftTakesSpace ? "relative flex-shrink-0" : "absolute left-0 top-0 bottom-0 z-40 shadow-2xl shadow-black/40"}`}>
            <ADEWorktreeSidebar
              projectPath={projectPath}
              pinned={leftPinned}
              onTogglePin={() => setLeftPinned((p) => !p)}
              onClose={() => setLeftOpen(false)}
              topBar={appRow}
              onOpenProject={handleOpenFolder}
              onOpenGit={() => setShowGitModal(true)}
              onOpenExtensions={() => setShowExtensions(true)}
              onOpenUsage={() => setShowUsage(true)}
              onOpenSettings={() => setShowSettings(true)}
              themePickerSlot={<ThemePicker compact />}
            />
          </div>
        )}

        {/* Main grid area — min-w-0 allows flex to shrink below children's intrinsic width when sidebars are docked */}
        <div className="flex-1 flex flex-col overflow-hidden relative min-w-0">
          <PlaneHost
            workingDir={projectPath || "~/Desktop/SwarmAI"}
            leading={
              leftOpen ? undefined : (
                <div className="flex items-center gap-1 shrink-0">
                  {isMac && (
                    isTauri() ? (
                      <div className="w-[65px] shrink-0 h-full select-none" data-tauri-drag-region />
                    ) : (
                      <MacWindowControls
                        onClose={handleClose}
                        onMinimize={handleMinimize}
                        onMaximize={handleMaximize}
                        isMaximized={isMaximized}
                        className="pl-0 pr-1"
                      />
                    )
                  )}
                  <button
                    onClick={() => toggleLeft()}
                    className="size-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.08] transition-all cursor-pointer"
                    title="Show sidebar"
                  >
                    <PanelLeft size={14} />
                  </button>
                  <div className="h-4 w-px bg-white/[0.12] mx-0.5 shrink-0" />
                </div>
              )
            }
            reserveRight={dockVisible ? 0 : windowControlsWidth + 16}
          />
          {/* Tasks is docked to the center, outside the plane, so switching
              planes never moves it. A fullscreen plane covers it — the plane's
              floating Tasks widget takes over there. */}
          <TasksPanel
            open={boardOpen}
            tasks={activeWorkspace?.taskCards ?? []}
            statuses={agentStatuses}
            onClose={() => setBoardOpen(false)}
            // Tasks owns the boards; Pheromone owns session history. Swarm is the
            // only place that knows both, so it hands one to the other.
            history={
              <SessionHistory projectPath={projectPath} activeWorkspaceId={activeWorkspaceId} />
            }
          />
        </div>

        {/* Right dock — always docked, never floating (see the note above:
            floating it buried the pipeline's right edge). The pin control it
            used to render did nothing at all, so it is gone. */}
        {dockVisible && (
          <div
            ref={dockRef}
            className="relative flex-shrink-0 h-full flex flex-col box-border min-h-0"
            // The dock reaches the window's top-right corner, where the
            // window controls float. Start its content below them.
            style={{ paddingTop: 44 }}
          >
            <ADERightDock projectPath={projectPath} onClose={() => setRightOpen(false)} />
          </div>
        )}
      </div>

      {/* Status bar. It used to spend a whole row on the word "no repo"; it now
          carries the four things worth glancing at — where you are, what the
          repo looks like, and whether anything is running or has failed. */}
      {/* Luxury Pro Developer Status Bar */}
      <div className="h-7 border-t border-swarm-border/50 bg-swarm-surface/98 backdrop-blur-2xl flex items-center gap-2.5 px-3 text-mini select-none z-10 font-sans text-swarm-textDim">
        {projectPath && (
          <span
            className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-zinc-300 font-mono text-[11px] max-w-[200px] truncate shadow-xs"
            title={projectPath}
          >
            <Folder size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{projectPath.split(/[\\/]/).filter(Boolean).pop()}</span>
          </span>
        )}

        <button
          onClick={() => setShowGitModal(true)}
          className="flex shrink-0 items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/20 text-zinc-200 transition-colors cursor-pointer group shadow-xs"
          title={gitStatus ? `Git Control Hub (Branch: ${gitStatus.branch})` : "Initialize Git Repository"}
        >
          <GitBranch size={11} className="group-hover:scale-110 transition-transform text-slate-300 shrink-0" />
          <span className="max-w-[24ch] truncate font-mono font-medium text-[11px]">{gitStatus?.branch ?? "no repo"}</span>
          {gitStatus && gitStatus.changed > 0 && (
            <span className="ml-0.5 px-1.5 py-0.2 rounded bg-white/[0.14] text-white text-[10px] font-mono font-bold border border-white/[0.18]">
              +{gitStatus.changed}
            </span>
          )}
        </button>

        <span className="hidden md:flex items-center gap-2 text-[11px] font-mono text-zinc-400 ml-1">
          <span className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 text-[10px] font-medium">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Swarm Engine</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-400 text-[10px]">Local Memory Bridge</span>
        </span>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          {erroredAgents > 0 && (
            <button
              onClick={() => setShowDashboard(true)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded-md text-rose-300 border border-rose-500/30 bg-rose-500/10 font-mono text-[10px] hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              {erroredAgents} failed
            </button>
          )}
          <button
            onClick={() => setShowDashboard(true)}
            className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white/[0.05] border border-white/[0.12] text-zinc-200 text-[11px] font-mono font-semibold shadow-xs hover:bg-white/[0.1] hover:border-swarm-gold/40 transition-all cursor-pointer"
            title={`${busyAgents} of ${totalAgents} agents working — Click to open Swarm Dashboard`}
          >
            <span className={`size-1.5 rounded-full ${busyAgents > 0 ? "bg-emerald-400 animate-pulse shadow-[0_0_6px_rgba(52,211,153,0.8)]" : "bg-zinc-500"}`} />
            <span>{busyAgents}/{totalAgents} active</span>
          </button>
        </span>
      </div>

      {showDashboard && (
        <SwarmDashboardModal
          open={showDashboard}
          projectPath={projectPath}
          onClose={() => setShowDashboard(false)}
        />
      )}
      {showDiffModal && (
        <DiffPreviewModal
          open={showDiffModal}
          projectPath={projectPath}
          onClose={() => setShowDiffModal(false)}
        />
      )}
      {showTemplatesModal && (
        <TaskTemplatesModal
          open={showTemplatesModal}
          onClose={() => setShowTemplatesModal(false)}
        />
      )}
      {showSettings && (
        <SettingsPage
          onClose={() => setShowSettings(false)}
          onOpenProject={handleOpenFolder}
          onOpenGit={() => setShowGitModal(true)}
          onOpenDashboard={() => setShowDashboard(true)}
          onOpenTemplates={() => setShowTemplatesModal(true)}
          onOpenDiff={() => setShowDiffModal(true)}
          onOpenExtensions={() => setShowExtensions(true)}
          onOpenUsage={() => setShowUsage(true)}
        />
      )}
      {showExtensions && <ExtensionsMarketplace onClose={() => setShowExtensions(false)} />}
      {showUpdates && <UpdateCheckerModal isOpen={showUpdates} onClose={() => setShowUpdates(false)} />}
      {showGuide && <UserGuideModal isOpen={showGuide} onClose={() => setShowGuide(false)} />}
      {showGitModal && (
        <GitControlModal
          isOpen={showGitModal}
          onClose={() => setShowGitModal(false)}
          projectPath={projectPath}
        />
      )}
      <CommandPalette
        isOpen={showPalette}
        onClose={() => setShowPalette(false)}
        onOpenSettings={() => setShowSettings(true)}
        onOpenExtensions={() => setShowExtensions(true)}
        onOpenFolder={handleOpenFolder}
        onOpenUpdates={() => setShowUpdates(true)}
        onOpenGit={() => setShowGitModal(true)}
        onOpenDashboard={() => setShowDashboard(true)}
        onOpenTemplates={() => setShowTemplatesModal(true)}
        onOpenDiff={() => setShowDiffModal(true)}
        onReplayOpening={() => useSplashStore.getState().openSplash(true)}
      />

      {/* Global voice hotkeys: Ctrl+Win (type anywhere) · Ctrl+Alt (Agent). */}
      <VoiceHotkeys />

      {/* Luxury Cinematic Swarm AI Opening Animation */}
      <AppOpeningAnimation />
    </div>
  );
}
