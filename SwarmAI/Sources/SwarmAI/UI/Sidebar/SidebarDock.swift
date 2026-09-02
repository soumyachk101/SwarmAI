import SwiftUI

// MARK: - Left Sidebar View

struct LeftSidebar: View {
 @Environment(\.appState) private var appState
 @Environment(\.uiStore) private var uiStore
 @Environment(\.agentsStore) private var agentsStore

 var body: some View {
 HStack(spacing: 0) {
 // Tab bar
 VStack(spacing: 2) {
 ForEach(Array(SidebarTab.allCases.enumerated()), id: \.element.id) { index, tab in
 let isSelected = uiStore.activeLeftTab == tab

 Button {
 withAnimation(.swarmQuick) {
 uiStore.setLeftTab(tab)
 }
 } label: {
 VStack(spacing: 4) {
 Image(systemName: tab.icon)
 .font(.system(size: 16))
 .symbolEffect(.bounce, value: isSelected)

 Text(tab.title)
 .font(.swarm(.micro))
 .opacity(isSelected ? 1 : 0)
 }
 .frame(width: 56, height: 48)
 .foregroundStyle(isSelected ? .swarmGold : .swarmTextTertiary)
 .background {
 if isSelected {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmGold.opacity(0.15))
 .padding(.horizontal, 4)
 }
 }
 // Staggered icon entry
 .opacity(1)
 .scaleEffect(1)
 .animation(.swarmTabIconStagger.delay(Double(index) * 0.04), value: appState.isLeftSidebarOpen)
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.vertical, 8)
 .padding(.horizontal, 4)

 // Content
 Group {
 switch uiStore.activeLeftTab {
 case .projects: ProjectsTab()
 case .explorer: ExplorerTab()
 case .git: GitTab(appState: appState)
 case .search: SearchTab()
 case .devTools: DevToolsTab()
 case .agents: AgentsTab()
 case .fleet: FleetTab()
 }
 }
 .frame(width: 240)
 // Tab content entry animation
 .opacity(1)
 .offset(y: 0)
 .animation(.swarmTabContentEntry.delay(0.2), value: appState.isLeftSidebarOpen)
 // Crossfade on tab switch
 .animation(.swarmTabSwitch, value: uiStore.activeLeftTab)
 }
 .frame(width: appState.isLeftSidebarOpen ? 300 : 0)
 .clipped()
 .animation(.swarmPaneOpen, value: appState.isLeftSidebarOpen)
 // Slide in from left
 .offset(x: appState.isLeftSidebarOpen ? 0 : -300)
 .opacity(appState.isLeftSidebarOpen ? 1 : 0)
 .animation(.swarmSidebarEntry, value: appState.isLeftSidebarOpen)
 .overlay(alignment: .trailing) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}

// MARK: - Right Dock View

struct RightDock: View {
 @Environment(\.appState) private var appState
 @Environment(\.uiStore) private var uiStore
 @Environment(\.agentsStore) private var agentsStore
 @Environment(\.taskStore) private var taskStore
 @Environment(\.canvasStore) private var canvasStore

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
 VStack(spacing: 2) {
 ForEach(Array(DockTab.allCases.enumerated()), id: \.element.id) { index, tab in
 let isSelected = uiStore.activeRightTab == tab

 Button {
 withAnimation(.swarmQuick) {
 uiStore.setRightTab(tab)
 }
 } label: {
 VStack(spacing: 4) {
 Image(systemName: tab.icon)
 .font(.system(size: 16))
 .symbolEffect(.bounce, value: isSelected)

 Text(tab.title)
 .font(.swarm(.micro))
 .opacity(isSelected ? 1 : 0)
 }
 .frame(width: 56, height: 48)
 .foregroundStyle(isSelected ? .swarmGold : .swarmTextTertiary)
 .background {
 if isSelected {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmGold.opacity(0.15))
 .padding(.horizontal, 4)
 }
 }
 // Staggered icon entry
 .opacity(1)
 .scaleEffect(1)
 .animation(.swarmTabIconStagger.delay(0.1 + Double(index) * 0.04), value: appState.isRightDockOpen)
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.vertical, 8)
 .padding(.horizontal, 4)
 }
 .frame(width: appState.isRightDockOpen ? 380 : 60)
 .clipped()
 .animation(.swarmPaneOpen, value: appState.isRightDockOpen)
 // Slide in from right with 0.1s delay
 .offset(x: appState.isRightDockOpen ? 0 : 300)
 .opacity(appState.isRightDockOpen ? 1 : 0)
 .animation(.swarmDockEntry, value: appState.isRightDockOpen)
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
