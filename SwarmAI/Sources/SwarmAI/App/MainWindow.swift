import SwiftUI

// MARK: - Main Window

struct MainWindow: View {
 @State private var appState = AppState()
 @State private var themeStore = ThemeStore()
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

 var body: some View {
 ZStack {
 // Background canvas
 Color.swarmCanvas
 .ignoresSafeArea()

 // Main layout
 HStack(spacing: 0) {
 // Left Sidebar
 if appState.isLeftSidebarOpen {
 LeftSidebar(
 appState: appState,
 uiStore: uiStore,
 agentsStore: agentsStore
 )
 }

 // Center content
 VStack(spacing: 0) {
 SwarmTitleBar(appState: appState, uiStore: uiStore)

 // Board / Browser / Emulator
 Group {
 switch appState.activePlane {
 case .board:
 switch appState.boardView {
 case .grid: GridBoardView(agentsStore: agentsStore, appState: appState)
 case .flow: FlowBoardView(canvasStore: canvasStore, agentsStore: agentsStore)
 }
 case .browser: BrowserPaneView(browserStore: browserStore)
 case .emulator: EmulatorPaneView()
 }
 }
 .ignoresSafeArea(container: .windows)

 StatusBar(appState: appState)
 }
 }

 // Right Dock
 if appState.isRightDockOpen {
 RightDock(
 appState: appState,
 uiStore: uiStore,
 agentsStore: agentsStore,
 taskStore: taskStore,
 canvasStore: canvasStore
 )
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

 // Modals overlay
 ZStack {
 if appState.isCommandPaletteOpen {
 CommandPaletteView()
 .transition(.opacity.combined(with: .scale(scale: 0.95)))
 }

 if appState.isSettingsOpen {
 SettingsView()
 .transition(.opacity.combined(with: .scale(scale: 0.95)))
 }
 }
 .ignoresSafeArea()
 }
 .frame(minWidth: 1200, minHeight: 800)
 .onAppear {
 appState.activeAgentsCount = agentsStore.agents.filter { $0.status == .running }.count
 appState.engineStatus = agentsStore.agents.contains(where: { $0.status == .running }) ? "Running" : "Idle"
 }
}