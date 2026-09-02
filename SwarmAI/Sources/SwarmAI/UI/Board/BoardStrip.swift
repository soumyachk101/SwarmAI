import SwiftUI

// MARK: - Board Strip (Tab Bar for open panes)

struct BoardStrip: View {
	@Environment(\.agentsStore) private var agentsStore
	@State private var hasAppeared = false

	var body: some View {
		ScrollView(.horizontal, showsIndicators: false) {
			HStack(spacing: 4) {
				ForEach(Array(agentsStore.agents.enumerated()), id: \.element.id) { index, agent in
					BoardStripTab(agent: agent, isActive: agentsStore.activePaneId == agent.id.uuidString)
						.swarmStaggerItem(index: index, delay: 0.72, factor: 0.025, animation: .swarmTabSwitch)
				}

				AddPaneButton()
					.swarmStaggerItem(index: max(0, agentsStore.agents.count), delay: 0.72, factor: 0.025, animation: .swarmTabSwitch)
			}
			.padding(.horizontal, 12)
		}
		.padding(.vertical, 4)
		.background(Color.swarmSurface)
		.overlay(alignment: .bottom) {
			Divider()
				.background(Color.swarmBorderSubtle)
		}
		.opacity(hasAppeared ? 1 : 0)
		.offset(y: hasAppeared ? 0 : -20)
		.animation(.swarmSlideUp.delay(0.72), value: hasAppeared)
		.onAppear {
			guard !hasAppeared else { return }
			hasAppeared = true
		}
	}
}

// MARK: - Board Strip Tab

struct BoardStripTab: View {
	let agent: Agent
	var isActive: Bool = false
	@Environment(\.agentsStore) private var agentsStore
	@State private var isHovered: Bool = false

	var body: some View {
		Button {
			withAnimation(.swarmTabSwitch) {
				agentsStore.activePaneId = agent.id.uuidString
			}
		} label: {
			HStack(spacing: 6) {
				Text(agent.agentType.icon)
					.font(.swarm(.xs))

				Text(agent.name)
					.font(.swarm(.xs, weight: isActive ? .medium : .regular))
					.foregroundStyle(isActive ? Color.swarmGold : Color.swarmTextSecondary)
					.lineLimit(1)

				CloseButton {
					agentsStore.closePane(agent.id)
				}
				.opacity(isHovered ? 1 : 0)
				.animation(.swarmQuick, value: isHovered)
			}
			.padding(.horizontal, 10)
			.padding(.vertical, 4)
			.background {
				RoundedRectangle(cornerRadius: 6)
					.fill(isActive ? Color.swarmGold.opacity(0.15) : (isHovered ? Color.swarmSurfaceHover.opacity(0.6) : Color.swarmSurface))
					.overlay {
						RoundedRectangle(cornerRadius: 6)
							.stroke(isActive ? Color.swarmGold : Color.swarmBorderSubtle, lineWidth: 1)
					}
			}
		}
		.buttonStyle(.plain)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}

// MARK: - Close Button (mini)

struct CloseButton: View {
	let action: () -> Void
	@State private var isHovered: Bool = false

	var body: some View {
		Button(action: action) {
			Image(systemName: "xmark")
				.font(.swarm(.micro))
				.foregroundStyle(isHovered ? Color.swarmTextPrimary : Color.swarmTextTertiary)
				.scaleEffect(isHovered ? 1.1 : 1.0)
		}
		.buttonStyle(.plain)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}

// MARK: - Add Pane Button

struct AddPaneButton: View {
	@Environment(\.agentsStore) private var agentsStore
	@State private var isHovered: Bool = false

	var body: some View {
		Button {
			withAnimation(.spring(duration: 0.3)) {
				_ = agentsStore.spawnAgent(.claudeCode)
			}
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
					.stroke(isHovered ? Color.swarmBorder : Color.swarmBorderSubtle, lineWidth: 1)
			}
			.scaleEffect(isHovered ? 1.02 : 1.0)
		}
		.buttonStyle(.plain)
		.onHover { hovering in
			isHovered = hovering
		}
	}
}
