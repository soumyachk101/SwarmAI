import SwiftUI

// MARK: - Left Sidebar View

struct LeftSidebar: View {
 @Bindable var appState: AppState
 @Bindable var uiStore: UiStore
 @Bindable var agentsStore: AgentsStore

 var body: some View {
 HStack(spacing: 0) {
 // Tab bar
 VerticalTabBar(
 tabs: SidebarTab.allCases.map { ($0.icon, $0.rawValue) },
 selection: $uiStore.activeLeftTab.index
 ) { index in
 if let tab = SidebarTab.allCases[safe: index] {
 uiStore.setLeftTab(tab)
 }
 }
 .frame(width: 60)

 // Content
 Group {
 switch uiStore.activeLeftTab {
 case .projects: ProjectsTab(workspaceStore: .constant(WorkspaceStore()))
 case .explorer: ExplorerTab()
 case .git: GitTab(appState: appState)
 case .search: SearchTab()
 case .devTools: DevToolsTab()
 case .agents: AgentsTab(agentsStore: agentsStore)
 case .fleet: FleetTab(agentsStore: agentsStore)
 }
 }
 .frame(width: 240)
 }
 .frame(width: appState.isLeftSidebarOpen ? 300 : 0)
 .clipped()
 .animation(.swarmPaneOpen, value: appState.isLeftSidebarOpen)
 .overlay(alignment: .trailing) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}

// MARK: - Right Dock View

struct RightDock: View {
 @Bindable var appState: AppState
 @Bindable var uiStore: UiStore
 @Bindable var agentsStore: AgentsStore
 @Bindable var taskStore: TaskStore
 @Bindable var canvasStore: CanvasStore

 var body: some View {
 HStack(spacing: 0) {
 // Content
 Group {
 switch uiStore.activeRightTab {
 case .lead: LeadPanel()
 case .devChat: DevChatPanel()
 case .gitPanel: GitPanelView()
 case .snippets: SnippetsPanel()
 case .reports: ReportsPanel(agentsStore: agentsStore, taskStore: taskStore)
 }
 }
 .frame(width: appState.isRightDockOpen ? 320 : 0)
 .clipped()
 .animation(.swarmPaneOpen, value: appState.isRightDockOpen)

 // Tab bar
 VerticalTabBar(
 tabs: DockTab.allCases.map { ($0.icon, $0.rawValue) },
 selection: $uiStore.activeRightTab.index
 ) { index in
 if let tab = DockTab.allCases[safe: index] {
 uiStore.setRightTab(tab)
 }
 }
 .frame(width: 60)
 }
 .frame(width: appState.isRightDockOpen ? 380 : 60)
 .clipped()
 .animation(.swarmPaneOpen, value: appState.isRightDockOpen)
 .overlay(alignment: .leading) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}

// MARK: - Safe Array Access

extension Collection {
 subscript(safe index: Index) -> Element? {
 indices.contains(index) ? self[index] : nil
 }
}
