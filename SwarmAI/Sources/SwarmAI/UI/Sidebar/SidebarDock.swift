import SwiftUI
import AppKit

// MARK: - Left Sidebar View (Matching Tauri ADEWorktreeSidebar / WorkspacesSidebar)

public struct LeftSidebar: View {
	@Environment(\.appState) private var appState
	@Environment(\.agentsStore) private var agentsStore
	@State private var hoveredTab: SidebarTab? = nil
	@State private var isSettingsOpen: Bool = false

	public var body: some View {
		VStack(spacing: 0) {
			// ── 1. Full-Width App Top Header (40px height, aligned with BoardStrip) ──
			appHeaderRow

			// ── 2. Sidebar Body: 44px Activity Rail + Main Content Column ──────────
			HStack(spacing: 0) {
				activityBarRail
					.frame(width: 44)

				Rectangle()
					.fill(Color.white.opacity(0.06))
					.frame(width: 1)

				contentArea
					.frame(maxWidth: .infinity, maxHeight: .infinity)
					.background(Color(red: 9/255, green: 11/255, blue: 16/255))
			}
		}
		.frame(width: appState.isLeftSidebarOpen ? 295 : 0)
		.clipped()
		.background(Color(red: 7/255, green: 8/255, blue: 12/255))
		.overlay(alignment: .trailing) {
			Rectangle()
				.fill(Color.white.opacity(0.08))
				.frame(width: 1)
		}
		.animation(.swarmSidebarEntry, value: appState.isLeftSidebarOpen)
	}

	// MARK: - App Header Row
	/// Height 40px to align with BoardStrip; leading padding for native macOS traffic lights
	private var appHeaderRow: some View {
		HStack(spacing: 8) {
			// Window drag spacer for traffic lights
			Color.clear
				.frame(width: 72, height: 40)

			Text(appState.activeLeftTab.title.uppercased())
				.font(.system(size: 11, weight: .bold))
				.tracking(0.8)
				.foregroundStyle(Color.zinc300)

			Spacer()

			// Toggle Tasks Panel
			Button {
				withAnimation(.swarmQuick) {
					appState.boardOpen.toggle()
				}
			} label: {
				Image(systemName: "square.grid.2x2")
					.font(.system(size: 11.5))
					.foregroundStyle(appState.boardOpen ? Color.swarmGold : Color.zinc400)
					.frame(width: 26, height: 26)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.fill(appState.boardOpen ? Color.swarmGold.opacity(0.18) : Color.white.opacity(0.04))
							.overlay {
								if appState.boardOpen {
									RoundedRectangle(cornerRadius: 6)
										.stroke(Color.swarmGold.opacity(0.4), lineWidth: 1)
								}
							}
					}
			}
			.buttonStyle(.plain)
			.help("Toggle Tasks Panel")

			// Collapse Sidebar Button
			Button {
				withAnimation(.swarmQuick) {
					appState.isLeftSidebarOpen.toggle()
				}
			} label: {
				Image(systemName: "sidebar.leading")
					.font(.system(size: 11.5))
					.foregroundStyle(Color.zinc400)
					.frame(width: 26, height: 26)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.fill(Color.white.opacity(0.04))
					}
			}
			.buttonStyle(.plain)
			.help("Collapse sidebar")
		}
		.padding(.trailing, 8)
		.frame(height: 40)
		.background {
			Color(red: 12/255, green: 14/255, blue: 22/255).opacity(0.95)
				.overlay(
					Rectangle()
						.fill(Color.white.opacity(0.08))
						.frame(height: 1),
					alignment: .bottom
				)
		}
	}

	// MARK: - 44px Activity Bar Rail (Far Left, Full Height)
	private var activityBarRail: some View {
		VStack(spacing: 6) {
			// Top Activity Tabs
			VStack(spacing: 5) {
				ForEach(SidebarTab.allCases) { tab in
					let isSelected = appState.activeLeftTab == tab
					let isHovered = hoveredTab == tab

					Button {
						withAnimation(.swarmQuick) {
							appState.setLeftTab(tab)
						}
					} label: {
						ZStack {
							if isSelected {
								RoundedRectangle(cornerRadius: 10)
									.fill(Color.swarmGold.opacity(0.15))
									.overlay(
										RoundedRectangle(cornerRadius: 10)
											.stroke(Color.swarmGold.opacity(0.3), lineWidth: 1)
									)
									.shadow(color: Color.swarmGold.opacity(0.15), radius: 6)
							} else if isHovered {
								RoundedRectangle(cornerRadius: 10)
									.fill(Color.white.opacity(0.06))
							}

							Image(systemName: tab.icon)
								.font(.system(size: 14, weight: isSelected ? .semibold : .regular))
								.foregroundStyle(isSelected ? Color.swarmGold : (isHovered ? Color.white : Color.zinc400))
						}
						.frame(width: 32, height: 32)
					}
					.buttonStyle(.plain)
					.help(tab.title)
					.onHover { hovering in
						withAnimation(.swarmQuick) {
							hoveredTab = hovering ? tab : nil
						}
					}
				}
			}

			Spacer()

			// Bottom Section: Theme Picker, Settings Gear, Collapse
			VStack(spacing: 4) {
				// Settings & Tools Button
				Button {
					appState.isSettingsOpen = true
				} label: {
					Image(systemName: "gearshape")
						.font(.system(size: 14))
						.foregroundStyle(Color.zinc400)
						.frame(width: 30, height: 30)
						.background(Color.clear)
						.contentShape(Rectangle())
				}
				.buttonStyle(.plain)
				.help("Settings & Tools")

				// Collapse Sidebar Button
				Button {
					withAnimation(.swarmQuick) {
						appState.isLeftSidebarOpen.toggle()
					}
				} label: {
					Image(systemName: "xmark")
						.font(.system(size: 12))
						.foregroundStyle(Color.zinc500)
						.frame(width: 30, height: 30)
				}
				.buttonStyle(.plain)
				.help("Close sidebar")
			}
			.padding(.top, 6)
			.overlay(alignment: .top) {
				Rectangle()
					.fill(Color.white.opacity(0.06))
					.frame(height: 1)
			}
			.padding(.bottom, 8)
		}
		.background(Color(red: 7/255, green: 8/255, blue: 12/255))
	}

	// MARK: - Content Area
	@ViewBuilder
	private var contentArea: some View {
		switch appState.activeLeftTab {
		case .projects:
			ProjectsTab()
		case .git:
			GitTab()
		case .search:
			SearchTab()
		case .devtools:
			DevToolsTab()
		case .agents:
			AgentsTab()
		case .fleet:
			FleetTab()
		}
	}
}
