import SwiftUI
import AppKit

// MARK: - Left Sidebar View

struct LeftSidebar: View {
 @Environment(\.appState) private var appState
 @Environment(\.agentsStore) private var agentsStore
 @State private var hoveredTab: SidebarTab? = nil

 var body: some View {
 HStack(spacing: 0) {
 // Tab bar rail — frosted glass background
 tabBar

 // Subtle vertical separator between rail and content
 Rectangle()
 .fill(.swarmBorderSubtle.opacity(0.3))
 .frame(width: 1)

 // Content area
 contentArea
 }
 .frame(width: appState.isLeftSidebarOpen ? 300 : 0)
 .clipped()
 .offset(x: appState.isLeftSidebarOpen ? 0 : -300)
 .opacity(appState.isLeftSidebarOpen ? 1 : 0)
 .animation(.swarmSidebarEntry, value: appState.isLeftSidebarOpen)
 .overlay(alignment: .trailing) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }

 // MARK: - Tab Bar

 private var tabBar: some View {
 VStack(spacing: 1) {
 Spacer(minLength: 8)

 ForEach(SidebarTab.allCases) { tab in
 let isSelected = appState.activeLeftTab == tab
 let isHovered = hoveredTab == tab

 Button {
 withAnimation(.spring(response: 0.4, dampingFraction: 0.82)) {
 appState.setLeftTab(tab)
 }
 } label: {
 HStack(spacing: 8) {
 Image(systemName: tab.icon)
 .font(.system(size: 16, weight: isSelected ? .semibold : .regular))
 .frame(width: 20, alignment: .center)
 .foregroundStyle(tabColor(isSelected: isSelected, isHovered: isHovered))

 Text(tab.title)
 .font(.swarm(.mini, weight: isSelected ? .semibold : .regular))
 .foregroundStyle(tabColor(isSelected: isSelected, isHovered: isHovered))
 .opacity(labelOpacity(isSelected: isSelected, isHovered: isHovered))
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 8)
 .frame(height: 44)
 .frame(maxWidth: .infinity, alignment: .leading)
 .contentShape(Rectangle())
 .background {
 if isHovered && !isSelected {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmSurfaceHover.opacity(0.5))
 }
 }
 .overlay(alignment: .leading) {
 if isSelected {
 RoundedRectangle(cornerRadius: 1.5)
 .fill(.swarmGold)
 .frame(width: 3)
 .padding(.vertical, 6)
 }
 }
 }
 .buttonStyle(.plain)
 .onHover { hovering in
 withAnimation(.swarmQuick) {
 hoveredTab = hovering ? tab : nil
 }
 }
 }

 Spacer(minLength: 8)
 }
 .frame(width: 56)
 .background(.ultraThinMaterial)
 }

 // MARK: - Content Area

 private var contentArea: some View {
 Group {
 switch appState.activeLeftTab {
 case .projects: ProjectsTab()
 case .explorer: ExplorerTab()
 case .git: GitTab()
 case .search: SearchTab()
 case .devTools: DevToolsTab()
 case .agents: AgentsTab()
 case .fleet: FleetTab()
 }
 }
 .frame(width: 244)
 .background(.swarmCanvas)
 }

 // MARK: - Helpers

 private func tabColor(isSelected: Bool, isHovered: Bool) -> Color {
 if isSelected { return .swarmGold }
 if isHovered { return .swarmTextPrimary }
 return .swarmTextTertiary
 }

 private func labelOpacity(isSelected: Bool, isHovered: Bool) -> CGFloat {
 if isSelected { return 1.0 }
 if isHovered { return 1.0 }
 return 0.0
 }
}

// MARK: - Right Dock View

struct RightDock: View {
 @Environment(\.appState) private var appState
 @Environment(\.agentsStore) private var agentsStore
 @Environment(\.taskStore) private var taskStore
 @Environment(\.canvasStore) private var canvasStore
 @State private var isHoveringTabBar = false

 private let tabBarWidth: CGFloat = 60
 private let contentWidth: CGFloat = 320

 var body: some View {
 HStack(spacing: 0) {
 // Tab Content Panel
 Group {
 switch appState.activeRightTab {
 case .lead: LeadPanel()
 case .devChat: DevChatPanel()
 case .gitPanel: GitPanelView()
 case .snippets: SnippetsPanel()
 case .reports: ReportsPanel()
 }
 }
 .frame(width: appState.isRightDockOpen ? contentWidth : 0)
 .clipped()
 .glassInset()

 // Tab Bar with glass rail background
 VStack(spacing: 0) {
 ForEach(DockTab.allCases) { tab in
 let isSelected = appState.activeRightTab == tab

 Button {
 withAnimation(.swarmTabSwitch) {
 appState.setRightTab(tab)
 }
 } label: {
 VStack(spacing: 5) {
 Image(systemName: tab.icon)
 .font(.system(size: 17, weight: isSelected ? .semibold : .regular))
 .frame(height: 18)

 Text(tab.title)
 .font(.swarm(.micro))
 }
 .foregroundStyle(isSelected ? .swarmGold : .swarmTextTertiary)
 .frame(maxWidth: .infinity, minHeight: 52)
 .background {
 // Gold indicator bar on the right edge for active tab
 if isSelected {
 VStack {
 Spacer()
 Rectangle()
 .fill(.swarmGold)
 .frame(width: 3)
 }
 }

 // Hover highlight for non-selected tabs
 if !isSelected && isHoveringTabBar {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurfaceHover.opacity(0.5))
 .padding(.horizontal, 6)
 }
 }
 }
 .buttonStyle(.plain)
 .onHover { hovering in
 withAnimation(.swarmQuick) {
 isHoveringTabBar = hovering
 }
 }
 }

 Spacer(minLength: 0)
 }
 .frame(width: tabBarWidth)
 .glassRail()
 .overlay(alignment: .leading) {
 // Subtle vertical border on the left edge of the rail
 Rectangle()
 .fill(.swarmBorderSubtle.opacity(0.4))
 .frame(width: 0.5)
 }
 }
 .frame(width: appState.isRightDockOpen ? (contentWidth + tabBarWidth) : tabBarWidth)
 .clipped()
 .offset(x: appState.isRightDockOpen ? 0 : contentWidth)
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
