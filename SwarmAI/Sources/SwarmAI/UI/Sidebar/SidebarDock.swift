import SwiftUI

// MARK: - Left Sidebar View

struct LeftSidebar: View {
	@Environment(\.appState) private var appState
	@Environment(\.uiStore) private var uiStore
	@Environment(\.agentsStore) private var agentsStore
	@State private var hasAppeared = false

	var body: some View {
		HStack(spacing: 0) {
			// Tab bar
			VStack(spacing: 2) {
				ForEach(SidebarTab.allCases) { tab in
					let isSelected = uiStore.activeLeftTab == tab

					Button {
						withAnimation(.swarmQuick) {
							uiStore.setLeftTab(tab)
						}
					} label: {
						VStack(spacing: 4) {
							Image(systemName: tab.icon)
								.font(.system(size: 16))

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
				case .git: GitTab()
				case .search: SearchTab()
				case .devTools: DevToolsTab()
				case .agents: AgentsTab()
				case .fleet: FleetTab()
				}
			}
			.frame(width: 240)
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
				case .reports: ReportsPanel()
				}
			}
			.frame(width: appState.isRightDockOpen ? 320 : 0)
			.clipped()

			// Tab bar
			VStack(spacing: 2) {
				ForEach(DockTab.allCases) { tab in
					let isSelected = uiStore.activeRightTab == tab

					Button {
						withAnimation(.swarmQuick) {
							uiStore.setRightTab(tab)
						}
					} label: {
						VStack(spacing: 4) {
							Image(systemName: tab.icon)
								.font(.system(size: 16))

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
					}
					.buttonStyle(.plain)
				}
			}
			.padding(.vertical, 8)
			.padding(.horizontal, 4)
		}
		.frame(width: appState.isRightDockOpen ? 380 : 60)
		.clipped()
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
