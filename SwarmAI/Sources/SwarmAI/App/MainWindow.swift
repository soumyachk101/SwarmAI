import SwiftUI

// MARK: - Main Window

struct MainWindow: View {
	@Environment(\.themeStore) private var themeStore
	@Environment(\.accessibilityReduceMotion) private var reduceMotion
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
	@State private var isSplashDismissed: Bool = false

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
						.animation(.swarmSlideUp.delay(0.11), value: entryPhase)

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
					.animation(.swarmContentEntry.delay(0.15), value: entryPhase)

					StatusBar()
						.opacity(entryPhase >= .statusBarIn ? 1 : 0)
						.offset(y: entryPhase >= .statusBarIn ? 0 : 20)
						.animation(.swarmStatusEntry.delay(0.21), value: entryPhase)
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
			.animation(.swarmEntrySpring.delay(0.08), value: entryPhase)

			// Splash screen overlay
			if !isSplashDismissed && (entryPhase == .splashActive || entryPhase == .splashExiting) {
				SplashScreenView(isLaunching: Binding(
					get: { !isSplashDismissed && entryPhase == .splashActive },
					set: { if !$0 {
						// Let splash's own burst animation finish before completing
						DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
							appState.completeEntryNow()
						}
					}}
				))
				.transition(.opacity)
				.zIndex(999)
				.allowsHitTesting(entryPhase == .splashActive)
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
					SwarmDashboardModal(isOpen: $appState.isDashboardPresented)
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isDiffPreviewPresented {
					DiffPreviewModal(isOpen: $appState.isDiffPreviewPresented)
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isTaskTemplatesPresented {
					TaskTemplatesModal(isOpen: $appState.isTaskTemplatesPresented)
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isUserGuidePresented {
					UserGuideModal(isOpen: $appState.isUserGuidePresented)
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}

				if appState.isUpdateCheckerPresented {
					UpdateCheckerModal(isOpen: $appState.isUpdateCheckerPresented)
						.transition(.opacity.combined(with: .scale(scale: 0.92)))
				}
			}
			.ignoresSafeArea()
		}
		.frame(minWidth: 1100, minHeight: 700)
		.environment(appState)
		.environment(\.appState, appState)
		.environment(agentsStore)
		.environment(\.agentsStore, agentsStore)
		.environment(workspaceStore)
		.environment(\.workspaceStore, workspaceStore)
		.environment(taskStore)
		.environment(\.taskStore, taskStore)
		.environment(settingsStore)
		.environment(\.settingsStore, settingsStore)
		.environment(uiStore)
		.environment(\.uiStore, uiStore)
		.environment(planeStore)
		.environment(\.planeStore, planeStore)
		.environment(canvasStore)
		.environment(\.canvasStore, canvasStore)
		.environment(browserStore)
		.environment(\.browserStore, browserStore)
		.environment(extensionStore)
		.environment(\.extensionStore, extensionStore)
		.environment(dispatchStore)
		.environment(\.dispatchStore, dispatchStore)
		.environment(projectStore)
		.environment(\.projectStore, projectStore)
		.environment(themeStore)
		.environment(\.themeStore, themeStore)
		.animation(.swarmSlow, value: themeStore.currentThemeId)
		.onAppear {
			appState.activeAgentsCount = agentsStore.agents.filter { $0.status == .running }.count
			appState.engineStatus = agentsStore.agents.contains(where: { $0.status == .running }) ? "Running" : "Idle"

			appState.startEntrySequence(reduceMotion: reduceMotion)
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
