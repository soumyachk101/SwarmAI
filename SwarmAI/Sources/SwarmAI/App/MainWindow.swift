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
	@State private var windowHasAppeared = false

	var body: some View {
		ZStack {
			// Background canvas
			Color.swarmCanvas
				.ignoresSafeArea()

			// Main layout
			HStack(spacing: 0) {
				// Left Sidebar
				if appState.isLeftSidebarOpen {
					LeftSidebar()
						.opacity(windowHasAppeared ? 1 : 0)
						.offset(x: windowHasAppeared ? 0 : -30)
						.animation(.swarmSlideRight, value: windowHasAppeared)
				}

				// Center content
				VStack(spacing: 0) {
					SwarmTitleBar()

					BoardStrip()

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
					.ignoresSafeArea(container: .windows)
					.opacity(windowHasAppeared ? 1 : 0)
					.offset(y: windowHasAppeared ? 0 : 20)
					.scaleEffect(windowHasAppeared ? 1 : 0.98)
					.animation(.spring(response: 0.5, dampingFraction: 0.85).delay(0.1), value: windowHasAppeared)

					StatusBar()
				}

				// Right Dock
				if appState.isRightDockOpen {
					RightDock()
						.opacity(windowHasAppeared ? 1 : 0)
						.offset(x: windowHasAppeared ? 0 : 30)
						.animation(.swarmSlideRight, value: windowHasAppeared)
				}
			}
			.environment(appState)
			.environment(themeStore)
			.environment(agentsStore)
			.environment(workspaceStore)
			.environment(taskStore)
			.environment(settingsStore)
			.environment(uiStore)
			.environment(planeStore)
			.environment(canvasStore)
			.environment(browserStore)
			.environment(extensionStore)
			.environment(dispatchStore)
			.environment(projectStore)
			.opacity(windowHasAppeared ? 1 : 0)
			.animation(.easeOut(duration: 0.5), value: windowHasAppeared)

			// Modals overlay
			ZStack {
				if appState.isCommandPaletteOpen || appState.isCommandPalettePresented {
					CommandPaletteView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}

				if appState.isSettingsOpen || appState.isSettingsPresented {
					SettingsView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}

				if appState.isDashboardPresented {
					DashboardModalView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}

				if appState.isDiffPreviewPresented {
					DiffPreviewModalView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}

				if appState.isTaskTemplatesPresented {
					TaskTemplatesModalView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}

				if appState.isUserGuidePresented {
					UserGuideModalView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}

				if appState.isUpdateCheckerPresented {
					UpdateCheckerModalView()
						.transition(.opacity.combined(with: .scale(scale: 0.95)))
				}
			}
			.environment(appState)
			.environment(agentsStore)
			.environment(taskStore)
			.environment(settingsStore)
			.ignoresSafeArea()
		}
		.frame(minWidth: 1200, minHeight: 800)
		.animation(.easeInOut(duration: 0.3), value: themeStore.currentThemeId)
		.onAppear {
			appState.activeAgentsCount = agentsStore.agents.filter { $0.status == .running }.count
			appState.engineStatus = agentsStore.agents.contains(where: { $0.status == .running }) ? "Running" : "Idle"

			withAnimation(.easeOut(duration: 0.5)) {
				windowHasAppeared = true
			}
		}
	}
}
