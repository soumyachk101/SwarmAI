import SwiftUI

// MARK: - Board Strip (Tab Bar for open panes)

struct BoardStrip: View {
	@Environment(\.agentsStore) private var agentsStore

	var body: some View {
		ScrollView(.horizontal, showsIndicators: false) {
			HStack(spacing: 4) {
				// Active pane tabs
				ForEach(agentsStore.agents) { agent in
					BoardStripTab(
						agent: agent,
						isActive: agentsStore.activePaneId == agent.id.uuidString
					)
				}

				// Add pane button
				Button {
					_ = agentsStore.spawnAgent(.claudeCode)
				} label: {
					HStack(spacing: 4) {
						Image(systemName: "plus")
							.font(.swarm(.micro))

						Text("Add Pane")
							.font(.swarm(.micro))
					}
					.foregroundStyle(Color.swarmTextTertiary)
					.padding(.horizontal, 10)
					.padding(.vertical, 4)
					.background {
						RoundedRectangle(cornerRadius: 6)
							.stroke(Color.swarmBorderSubtle, lineWidth: 1)
					}
				}
				.buttonStyle(.plain)
			}
			.padding(.horizontal, 12)
		}
		.padding(.vertical, 4)
		.background(Color.swarmSurface)
		.overlay(alignment: .bottom) {
			Divider()
				.background(Color.swarmBorderSubtle)
		}
	}
}

struct BoardStripTab: View {
	let agent: Agent
	var isActive: Bool = false
	@Environment(\.agentsStore) private var agentsStore

	var body: some View {
		Button {
			agentsStore.activePaneId = agent.id.uuidString
		} label: {
			HStack(spacing: 6) {
				Text(agent.agentType.icon)
					.font(.swarm(.xs))

				Text(agent.name)
					.font(.swarm(.xs, weight: isActive ? .medium : .regular))
					.foregroundStyle(isActive ? Color.swarmGold : Color.swarmTextSecondary)
					.lineLimit(1)

				Button {
					agentsStore.closePane(agent.id)
				} label: {
					Image(systemName: "xmark")
						.font(.swarm(.micro))
						.foregroundStyle(Color.swarmTextTertiary)
				}
				.buttonStyle(.plain)
			}
			.padding(.horizontal, 10)
			.padding(.vertical, 4)
			.background {
				RoundedRectangle(cornerRadius: 6)
					.fill(isActive ? Color.swarmGold.opacity(0.15) : Color.swarmSurface)
					.overlay {
						RoundedRectangle(cornerRadius: 6)
							.stroke(isActive ? Color.swarmGold : Color.swarmBorderSubtle, lineWidth: 1)
					}
			}
		}
		.buttonStyle(.plain)
	}
}
