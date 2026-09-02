import SwiftUI

// MARK: - Main Window

struct MainWindow: View {
	@Environment(\.themeStore) private var themeStore
	@State private var appState = AppState()
	@State private var agentsStore = AgentsStore()
	@State private var workspaceStore = WorkspaceStore()
	@State private var taskStore = TaskStore()
	@State private var settingsStore = SettingsStore()
	@State private var uiStore = UiStore()
	@State private var planeStore = PlaneStore()
	@State private var canvasStore = CanvasStore()
	@State private var browserStore = BrowserStore()
	@State private var extensionStore = ExtensionStore()
	@State private var dispatchStore = DispatchStore()
	@State private var projectStore = ProjectStore()

	@State private var entryPhase: EntryPhase = .idle
	@State private var hasStartedSequence: Bool = false

	var body: some View {
		ZStack {
			// Background canvas with subtle vignette
			Color.swarmCanvas
				.ignoresSafeArea()
				.overlay(alignment: .center) {
					SubtleVignette()
						.allowsHitTesting(false)
				}

			// Main layout
			HStack(spacing: 0) {
				// Left Sidebar
				if appState.isLeftSidebarOpen {
					LeftSidebar()
						.opacity(entryPhase >= .sidebarIn ? 1 : 0)
						.offset(x: entryPhase >= .sidebarIn ? 0 : -30)
						.animation(.swarmSidebarEntry, value: entryPhase)
				}

				// Center content
				VStack(spacing: 0) {
					SwarmTitleBar(entryPhase: $entryPhase)

					BoardStrip()
						.opacity(entryPhase >= .boardStripIn ? 1 : 0)
						.offset(y: entryPhase >= .boardStripIn ? 0 : -20)
						.animation(.swarmSlideUp.delay(0.72), value: entryPhase)

					// Board / Browser / Emulator
					Group {
						switch appState.activePlane {
						case .board:
							switch appState.boardView {
							case .grid: GridBoardView()
							case .flow: FlowBoardView()
							}
						case .browser: BrowserPaneView()
						case .emulator: EmulatorPaneView()
						}
					}
					.ignoresSafeArea()
					.opacity(entryPhase >= .contentIn ? 1 : 0)
					.offset(y: entryPhase >= .contentIn ? 0 : 20)
					.scaleEffect(entryPhase >= .contentIn ? 1 : 0.98)
					.animation(.swarmContentEntry.delay(0.87), value: entryPhase)

					StatusBar()
						.opacity(entryPhase >= .statusBarIn ? 1 : 0)
						.offset(y: entryPhase >= .statusBarIn ? 0 : 20)
						.animation(.swarmStatusEntry.delay(0.97), value: entryPhase)
				}

				// Right Dock
				if appState.isRightDockOpen {
					RightDock()
						.opacity(entryPhase >= .dockIn ? 1 : 0)
						.offset(x: entryPhase >= .dockIn ? 0 : 30)
						.animation(.swarmDockEntry, value: entryPhase)
				}
			}
			.opacity(entryPhase >= .frameIn ? 1 : 0)
			.scaleEffect(entryPhase >= .frameIn ? 1 : 0.97)
			.animation(.swarmEntrySpring.delay(0.3), value: entryPhase)

			// Splash screen overlay
			if entryPhase == .splashActive {
				SplashScreenView(isLaunching: .constant(true))
					.transition(.opacity)
					.zIndex(999)
			}

			// Modals overlay
			ZStack {
				if appState.isCommandPaletteOpen {
					CommandPaletteView()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isSettingsOpen {
					SettingsView()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isDashboardPresented {
					SwarmDashboardModal()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isDiffPreviewPresented {
					DiffPreviewModal()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isTaskTemplatesPresented {
					TaskTemplatesModal()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isUserGuidePresented {
					UserGuideModal()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isUpdateCheckerPresented {
					UpdateCheckerModal()
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}
			}
			.environment(appState)
			.environment(agentsStore)
			.environment(taskStore)
			.environment(settingsStore)
			.ignoresSafeArea()
		}
		.frame(minWidth: 1200, minHeight: 800)
		.animation(.swarmSlow, value: themeStore.currentThemeId)
		.onAppear {
			appState.activeAgentsCount = agentsStore.agents.filter { $0.status == .running }.count
			appState.engineStatus = agentsStore.agents.contains(where: { $0.status == .running }) ? "Running" : "Idle"

			guard !hasStartedSequence else { return }
			hasStartedSequence = true
			startEntrySequence()
		}
	}

	// MARK: - Entry Sequence Orchestration

	private func startEntrySequence() {
		entryPhase = .splashActive

		// Phase 1: splash exits → frame appears (at 2.3s splash duration)
		DispatchQueue.main.asyncAfter(deadline: .now() + 2.3) {
			entryPhase = .splashExiting
			DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
				entryPhase = .frameIn
			}
		}

		// Phase 2: sidebar slides in (0.1s after frame)
		DispatchQueue.main.asyncAfter(deadline: .now() + 2.9) {
			entryPhase = .sidebarIn
		}

		// Phase 3: dock slides in (0.15s after sidebar)
		DispatchQueue.main.asyncAfter(deadline: .now() + 3.05) {
			entryPhase = .dockIn
		}

		// Phase 4: title bar cascades in (simultaneous with dock)
		DispatchQueue.main.asyncAfter(deadline: .now() + 3.05) {
			entryPhase = .titlebarIn
		}

		// Phase 5: board strip slides up (0.1s after titlebar)
		DispatchQueue.main.asyncAfter(deadline: .now() + 3.15) {
			entryPhase = .boardStripIn
		}

		// Phase 6: content area reveals (0.15s after boardStrip)
		DispatchQueue.main.asyncAfter(deadline: .now() + 3.3) {
			entryPhase = .contentIn
		}

		// Phase 7: status bar slides up (0.1s after content)
		DispatchQueue.main.asyncAfter(deadline: .now() + 3.4) {
			entryPhase = .statusBarIn
		}

		// Complete
		DispatchQueue.main.asyncAfter(deadline: .now() + 3.6) {
			entryPhase = .complete
		}
	}
}

// MARK: - Subtle Vignette

struct SubtleVignette: View {
	var body: some View {
		Rectangle()
			.fill(
				RadialGradient(
					colors: [
						.clear,
						Color.black.opacity(0.15),
						Color.black.opacity(0.3)
					],
					center: .center,
					startRadius: 100,
					endRadius: 600
				)
			)
			.ignoresSafeArea()
	}
}
