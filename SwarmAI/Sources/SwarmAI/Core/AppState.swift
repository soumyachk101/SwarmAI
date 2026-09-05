import SwiftUI

// EntryPhase is defined in Core/EntryPhase.swift

/// Defines the timing for each phase in the entry animation sequence.
/// Tweak these values to fine-tune the overall choreography without
/// touching multiple call sites.
public struct EntryAnimationTimings: Sendable {
	public let splashDuration: TimeInterval
	public let splashExitDuration: TimeInterval
	public let frameInDelay: TimeInterval
	public let sidebarInDelay: TimeInterval
	public let dockInDelay: TimeInterval
	public let titlebarInDelay: TimeInterval
	public let boardStripInDelay: TimeInterval
	public let contentInDelay: TimeInterval
	public let statusBarInDelay: TimeInterval
	public let completeDelay: TimeInterval
	public let safetyTimeout: TimeInterval

	public init(
		splashDuration: TimeInterval = 0.85,
		splashExitDuration: TimeInterval = 0.5,
		frameInDelay: TimeInterval = 0.93,
		sidebarInDelay: TimeInterval = 0.99,
		dockInDelay: TimeInterval = 1.05,
		titlebarInDelay: TimeInterval = 1.05,
		boardStripInDelay: TimeInterval = 1.11,
		contentInDelay: TimeInterval = 1.17,
		statusBarInDelay: TimeInterval = 1.23,
		completeDelay: TimeInterval = 1.30,
		safetyTimeout: TimeInterval = 1.5
	) {
		self.splashDuration = splashDuration
		self.splashExitDuration = splashExitDuration
		self.frameInDelay = frameInDelay
		self.sidebarInDelay = sidebarInDelay
		self.dockInDelay = dockInDelay
		self.titlebarInDelay = titlebarInDelay
		self.boardStripInDelay = boardStripInDelay
		self.contentInDelay = contentInDelay
		self.statusBarInDelay = statusBarInDelay
		self.completeDelay = completeDelay
		self.safetyTimeout = safetyTimeout
	}

	public static let `default` = EntryAnimationTimings()
}

// MARK: - App State

@MainActor
@Observable
public final class AppState: @unchecked Sendable {
	public static let shared = AppState()

	// --- UI Visibility ---
	public var isLeftSidebarOpen: Bool = true
	public var isRightDockOpen: Bool = true
	public var isCommandPaletteOpen: Bool = false
	public var isSettingsOpen: Bool = false
	public var isDashboardPresented: Bool = false
	public var isDiffPreviewPresented: Bool = false
	public var isGitModalPresented: Bool = false
	public var isTaskTemplatesPresented: Bool = false
	public var isUserGuidePresented: Bool = false
	public var isUpdateCheckerPresented: Bool = false
	public var isTaskTemplatesOpen: Bool = false
	public var isUpdateCheckerOpen: Bool = false
	public var boardOpen: Bool = false
	public var isOnboardingSeen: Bool = false

	// --- Active Selections ---
	public var activeLeftTab: SidebarTab = .projects
	public var activeRightTab: DockTab = .chat
	public var activePlane: Plane = .board
	public var boardView: BoardView = .grid

	// --- Window State ---
	public var isFullscreen: Bool = false
	public var workspaceName: String = "Swarm Workspace"
	public var isVoiceActive: Bool = false
	public var activeAgentsCount: Int = 0
	public var totalAgentsCount: Int = 0
	public var erroredAgentsCount: Int = 0
	public var gitBranch: String = "main"
	public var gitBranchCount: Int = 0
	public var engineStatus: String = "Idle"

	// --- Entry Phase System ---

	/// Current phase of the entry animation sequence.
	/// Shared so all subviews can observe and react to transitions.
	public var entryPhase: EntryPhase = .idle

	/// Whether the entry sequence has been fully initiated
	/// (prevents double-starting).
	public private(set) var hasEntrySequenceStarted: Bool = false

	/// Whether the entry sequence has fully completed.
	public private(set) var isEntryComplete: Bool = false

	/// Cancellable handles for entry sequence timers so they can be
	/// invalidated on completion, preventing stale callbacks.
	private var entryTasks: [Swift.Task<Void, Never>?] = []

	/// Animation timings for the entry sequence. Override for testing
	/// or different launch speeds.
	public var entryTimings: EntryAnimationTimings = .default

	init() {
		// Load persisted values from UserDefaults
		isLeftSidebarOpen = UserDefaults.standard.object(forKey: "leftSidebarOpen") as? Bool ?? true
		isRightDockOpen = UserDefaults.standard.object(forKey: "rightDockOpen") as? Bool ?? true
		activeLeftTab = SidebarTab.allCases.first ?? .projects
		activeRightTab = DockTab.allCases.first ?? .chat
	}

	// MARK: - Entry Sequence Orchestration

	/// Begins the full entry animation sequence.
	///
	/// Call once from the root view's `onAppear`. Sets up the timed
	/// phase transitions from splash through content materialization.
	///
	/// If `reduceMotion` is true, jumps straight to `.complete`.
	public func startEntrySequence(reduceMotion: Bool) {
		guard !hasEntrySequenceStarted else { return }
		hasEntrySequenceStarted = true

		if reduceMotion {
			completeEntryNow()
			return
		}

		// Phase 1: Splash screen activates
		entryPhase = .splashActive

		let t = entryTimings

		// Safety timeout — guarantees we never stall mid-animation
		let safetyTask = Swift.Task<Void, Never> { @MainActor in
			try? await Swift.Task.sleep(nanoseconds: UInt64(t.safetyTimeout * 1_000_000_000))
			self.completeEntryNow()
		}
		entryTasks.append(safetyTask)

		// Phase 2a: Splash starts exiting
		schedulePhase(.splashExiting, at: t.splashDuration)

		// Phase 2b: Window frame scales in
		schedulePhase(.frameIn, at: t.frameInDelay)

		// Phase 3: Sidebar slides from left
		schedulePhase(.sidebarIn, at: t.sidebarInDelay)

		// Phase 4: Dock slides from right + title bar cascade
		schedulePhase(.dockIn, at: t.dockInDelay)
		schedulePhase(.titlebarIn, at: t.titlebarInDelay)

		// Phase 5: Board strip slides up
		schedulePhase(.boardStripIn, at: t.boardStripInDelay)

		// Phase 6: Board / Content materializes
		schedulePhase(.contentIn, at: t.contentInDelay)

		// Phase 7: Status bar slides up
		schedulePhase(.statusBarIn, at: t.statusBarInDelay)

		// Phase 8: Complete
		schedulePhase(.complete, at: t.completeDelay)
	}

	/// Transitions to a given entry phase at the specified delay.
	private func schedulePhase(_ phase: EntryPhase, at delay: TimeInterval) {
		let task = Swift.Task { @MainActor in
			try? await Swift.Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
			guard entryPhase < phase else { return }
			self.transitionToPhase(phase)
		}
		entryTasks.append(task)
	}

	/// Animates a single phase transition.
	private func transitionToPhase(_ phase: EntryPhase) {
		guard entryPhase < phase else { return }

		switch phase {
		case .splashExiting:
			withAnimation(.swarmSplashExit) {
				entryPhase = phase
			}
		case .frameIn:
			withAnimation(.swarmEntrySpring) {
				entryPhase = phase
			}
		case .sidebarIn:
			withAnimation(.swarmSidebarEntry) {
				entryPhase = phase
			}
		case .dockIn:
			withAnimation(.swarmDockEntry) {
				entryPhase = phase
			}
		case .titlebarIn:
			withAnimation(.swarmTitleEntry) {
				entryPhase = phase
			}
		case .boardStripIn:
			withAnimation(.swarmSlideUp) {
				entryPhase = phase
			}
		case .contentIn:
			withAnimation(.swarmContentEntry) {
				entryPhase = phase
			}
		case .statusBarIn:
			withAnimation(.swarmStatusEntry) {
				entryPhase = phase
			}
		case .complete:
			completeEntryNow()
		default:
			entryPhase = phase
		}
	}

	/// Instantly marks the entry sequence as complete and cleans up.
	public func completeEntryNow() {
		guard !isEntryComplete else { return }

		// Discard all pending tasks
		entryTasks.removeAll()

		withAnimation(.swarmQuick) {
			entryPhase = .complete
			isEntryComplete = true
		}
	}

	/// Resets the entry state so the sequence can be replayed.
	/// Call this when re-showing the splash screen (e.g. after logout).
	public func resetEntryState() {
		entryTasks.removeAll()

		entryPhase = .idle
		hasEntrySequenceStarted = false
		isEntryComplete = false
	}

	// MARK: - Sidebar & Dock Toggles

	func toggleLeftSidebar() {
		withAnimation(.spring(duration: 0.3)) {
			isLeftSidebarOpen.toggle()
			UserDefaults.standard.set(isLeftSidebarOpen, forKey: "leftSidebarOpen")
		}
	}

	func toggleRightDock() {
		withAnimation(.spring(duration: 0.3)) {
			isRightDockOpen.toggle()
			UserDefaults.standard.set(isRightDockOpen, forKey: "rightDockOpen")
		}
	}

	func toggleCommandPalette() {
		isCommandPaletteOpen.toggle()
	}

	func toggleSettings() {
		isSettingsOpen.toggle()
	}

	func toggleTaskTemplates() {
		isTaskTemplatesOpen.toggle()
	}

	func toggleUpdateChecker() {
		isUpdateCheckerOpen.toggle()
	}

	func setLeftTab(_ tab: SidebarTab) {
		activeLeftTab = tab
	}

	func setRightTab(_ tab: DockTab) {
		activeRightTab = tab
	}

	func setPlane(_ plane: Plane) {
		withAnimation(.spring(duration: 0.3)) {
			activePlane = plane
		}
	}

	func setBoardView(_ view: BoardView) {
		withAnimation(.spring(duration: 0.3)) {
			boardView = view
		}
	}

	func toggleFullscreen() {
		withAnimation(.spring(duration: 0.3)) {
			isFullscreen.toggle()
		}
	}
}
