import SwiftUI

// MARK: - Board Strip (Tab Bar matching Tauri @swarm/board BoardStrip)

struct BoardStrip: View {
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.appState) private var appState

	var body: some View {
		HStack(spacing: 8) {
			// Leading: If sidebar is closed, provide space for traffic lights + expand sidebar button
			if !appState.isLeftSidebarOpen {
				HStack(spacing: 6) {
					Button {
						withAnimation(.swarmQuick) {
							appState.isLeftSidebarOpen.toggle()
						}
					} label: {
						Image(systemName: "sidebar.leading")
							.font(.system(size: 12))
							.foregroundStyle(Color.zinc400)
							.frame(width: 26, height: 26)
							.background {
								RoundedRectangle(cornerRadius: 6)
									.fill(Color.white.opacity(0.04))
							}
					}
					.buttonStyle(.plain)
					.help("Show sidebar")

					Rectangle()
						.fill(Color.white.opacity(0.12))
						.frame(width: 1, height: 16)
				}
				.padding(.leading, 70)
			}

			// View Toggle: Grid | Flow
			BoardViewToggle()

			Rectangle()
				.fill(Color.white.opacity(0.12))
				.frame(width: 1, height: 16)

			// Horizontal scrollable chips for open panes
			ScrollView(.horizontal, showsIndicators: false) {
				HStack(spacing: 6) {
					ForEach(agentsStore.agents) { agent in
						BoardStripTab(
							agent: agent,
							isActive: agentsStore.activePaneId == agent.id.uuidString
						)
					}

					AddPaneButton()
				}
				.padding(.vertical, 2)
			}

			Spacer(minLength: 0)
		}
		.padding(.horizontal, 10)
		.padding(.trailing, appState.isRightDockOpen ? 12 : 95)
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
}

// MARK: - Board Strip Tab Chip

struct BoardStripTab: View {
	let agent: Agent
	var isActive: Bool = false
	@Environment(\.agentsStore) private var agentsStore
	@State private var isHovered: Bool = false

	var body: some View {
		HStack(spacing: 6) {
			// Status glowing dot
			Circle()
				.fill(statusColor)
				.frame(width: 7, height: 7)
				.shadow(color: statusColor.opacity(isActive ? 0.8 : 0.3), radius: isActive ? 4 : 2)

			// Agent name
			Text(agent.name)
				.font(.system(size: 12, weight: isActive ? .semibold : .regular))
				.foregroundStyle(isActive ? Color.white : Color.zinc400)
				.lineLimit(1)
				.frame(maxWidth: 150, alignment: .leading)

			// Close button on hover
			Button {
				withAnimation(.swarmQuick) {
					agentsStore.closePane(agent.id)
				}
			} label: {
				Image(systemName: "xmark")
					.font(.system(size: 8, weight: .bold))
					.foregroundStyle(Color.zinc400)
					.frame(width: 14, height: 14)
					.background {
						RoundedRectangle(cornerRadius: 3)
							.fill(isHovered ? Color.white.opacity(0.12) : Color.clear)
					}
			}
			.buttonStyle(.plain)
			.opacity(isHovered || isActive ? 1 : 0.4)
		}
		.padding(.horizontal, 8)
		.frame(height: 28)
		.background {
			RoundedRectangle(cornerRadius: 8)
				.fill(isActive ? Color(red: 22/255, green: 26/255, blue: 38/255) : (isHovered ? Color.white.opacity(0.04) : Color.clear))
				.overlay(
					RoundedRectangle(cornerRadius: 8)
						.stroke(isActive ? Color.white.opacity(0.16) : Color.clear, lineWidth: 1)
				)
		}
		.contentShape(Rectangle())
		.onTapGesture {
			agentsStore.activePaneId = agent.id.uuidString
		}
		.onHover { hovering in
			withAnimation(.swarmQuick) {
				isHovered = hovering
			}
		}
	}

	private var statusColor: Color {
		switch agent.status {
		case .running: return Color.swarmOk
		case .launching: return Color.swarmWarn
		case .error: return Color.swarmErr
		default: return Color.swarmGold
		}
	}
}

// MARK: - Add Pane Button

struct AddPaneButton: View {
	@Environment(\.agentsStore) private var agentsStore
	@State private var isHovered: Bool = false

	var body: some View {
		Button {
			_ = agentsStore.spawnAgent(.claudeCode)
		} label: {
			Image(systemName: "plus")
				.font(.system(size: 11, weight: .semibold))
				.foregroundStyle(isHovered ? Color.swarmGoldHi : Color.zinc300)
				.frame(width: 26, height: 26)
				.background {
					RoundedRectangle(cornerRadius: 7)
						.fill(Color.white.opacity(0.04))
						.overlay(
							RoundedRectangle(cornerRadius: 7)
								.stroke(isHovered ? Color.swarmGold.opacity(0.4) : Color.white.opacity(0.1), lineWidth: 1)
						)
				}
		}
		.buttonStyle(.plain)
		.help("Add Agent")
		.onHover { hovering in
			withAnimation(.swarmQuick) {
				isHovered = hovering
			}
		}
	}
}
