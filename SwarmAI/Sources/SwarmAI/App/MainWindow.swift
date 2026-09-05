import SwiftUI

// MARK: - Main Window

struct MainWindow: View {
	@Environment(\.appState) private var appState
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.workspaceStore) private var workspaceStore
	@Environment(\.taskStore) private var taskStore
	@Environment(\.settingsStore) private var settingsStore
	@Environment(\.uiStore) private var uiStore
	@Environment(\.planeStore) private var planeStore
	@Environment(\.canvasStore) private var canvasStore
	@Environment(\.browserStore) private var browserStore
	@Environment(\.extensionStore) private var extensionStore
	@Environment(\.dispatchStore) private var dispatchStore
	@Environment(\.projectStore) private var projectStore
	@Environment(\.themeStore) private var themeStore
	@Environment(\.accessibilityReduceMotion) private var reduceMotion

	@State private var isSplashDismissed: Bool = false

	var body: some View {
		@Bindable var appState = appState
		ZStack {
			// Background canvas with subtle vignette
			Color.swarmCanvas
				.ignoresSafeArea()
				.overlay(alignment: .center) {
					SubtleVignette()
						.allowsHitTesting(false)
				}

			// Main layout: 3 full-height columns starting from the top
			HStack(spacing: 0) {
				// Left Sidebar
				if appState.isLeftSidebarOpen {
					LeftSidebar()
						.opacity(appState.entryPhase >= .sidebarIn ? 1 : 0)
						.offset(x: appState.entryPhase >= .sidebarIn ? 0 : -30)
						.animation(.swarmSidebarEntry, value: appState.entryPhase)
				}

				// Center content
				VStack(spacing: 0) {
					BoardStrip()
						.opacity(appState.entryPhase >= .boardStripIn ? 1 : 0)
						.animation(.swarmSlideUp.delay(0.11), value: appState.entryPhase)

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
					.opacity(appState.entryPhase >= .contentIn ? 1 : 0)
					.scaleEffect(appState.entryPhase >= .contentIn ? 1 : 0.98)
					.animation(.swarmContentEntry.delay(0.15), value: appState.entryPhase)

					StatusBar()
						.opacity(appState.entryPhase >= .statusBarIn ? 1 : 0)
						.animation(.swarmStatusEntry.delay(0.21), value: appState.entryPhase)
				}

				// Right Dock
				if appState.isRightDockOpen {
					RightDock()
						.padding(.top, 40)
						.opacity(appState.entryPhase >= .dockIn ? 1 : 0)
						.offset(x: appState.entryPhase >= .dockIn ? 0 : 30)
						.animation(.swarmDockEntry, value: appState.entryPhase)
				}
			}
			.opacity(appState.entryPhase >= .frameIn ? 1 : 0)
			.scaleEffect(appState.entryPhase >= .frameIn ? 1 : 0.97)
			.animation(.swarmEntrySpring.delay(0.08), value: appState.entryPhase)
			.overlay(alignment: .topTrailing) {
				FloatingTopRightIsland()
					.padding(.trailing, 8)
					.padding(.top, 5)
					.opacity(appState.entryPhase >= .frameIn ? 1 : 0)
					.zIndex(60)
			}

			// Splash screen overlay
			if !isSplashDismissed && (appState.entryPhase < .frameIn || appState.entryPhase == .splashExiting) {
				SplashScreenView(isLaunching: Binding(
					get: { !isSplashDismissed && appState.entryPhase <= .splashActive },
					set: { if !$0 {
						isSplashDismissed = true
						// Let splash's own burst animation finish before completing
						DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
							appState.completeEntryNow()
						}
					}}
				))
				.transition(.opacity)
				.zIndex(999)
				.allowsHitTesting(appState.entryPhase <= .splashActive)
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
