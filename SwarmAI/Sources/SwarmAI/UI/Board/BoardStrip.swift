import SwiftUI

// MARK: - Board Strip (Tab Bar for open panes)

struct BoardStrip: View {
	@Environment(\.agentsStore) private var agentsStore

	var body: some View {
		ScrollView(.horizontal, showsIndicators: false) {
			HStack(spacing: 4) {
				ForEach(agentsStore.agents) { agent in
					BoardStripTab(
						agent: agent,
						isActive: agentsStore.activePaneId == agent.id.uuidString
					)
					.switchTabAnimation(isActive: agentsStore.activePaneId == agent.id.uuidString)
				}

				AddPaneButton()
			}
			.padding(.horizontal, 12)
		}
		.padding(.vertical, 4)
		.glassToolbar()
	}
}

// MARK: - Board Strip Tab

struct BoardStripTab: View {
	let agent: Agent
	var isActive: Bool = false
	@Environment(\.agentsStore) private var agentsStore
	@State private var isHovered: Bool = false
	@State private var showClose: Bool = false

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
					.truncationMode(.tail)
					.frame(maxWidth: 100, alignment: .leading)

				// Close Pane Button
				Button {
					withAnimation(.swarmButtonPress) {
						agentsStore.closePane(agent.id)
					}
				} label: {
					Image(systemName: "xmark")
						.font(.swarm(.micro))
						.foregroundStyle(Color.swarmTextSecondary)
						.frame(width: 14, height: 14)
						.contentShape(Rectangle())
				}
				.buttonStyle(.plain)
				.opacity(showClose ? 1 : 0)
				.allowsHitTesting(showClose)
				.animation(.swarmQuick, value: showClose)
			}
			.padding(.horizontal, 10)
			.padding(.vertical, 5)
			.background {
				RoundedRectangle(cornerRadius: 6)
					.fill(backgroundFill)
					.overlay {
						RoundedRectangle(cornerRadius: 6)
							.stroke(borderColor, lineWidth: 1)
					}
			}
		}
		.buttonStyle(.plain)
		.onHover { hovering in
			withAnimation(.swarmQuick) {
				isHovered = hovering
				showClose = hovering
			}
		}
	}

	private var backgroundFill: AnyShapeStyle {
		if isActive {
			return AnyShapeStyle(Color.swarmGold.opacity(0.15))
		}
		if isHovered {
			return AnyShapeStyle(Color.swarmSurfaceHover.opacity(0.6))
		}
		return AnyShapeStyle(Color.clear)
	}

	private var borderColor: Color {
		if isActive {
			return Color.swarmGold
		}
		if isHovered {
			return Color.swarmBorderSubtle
		}
		return Color.clear
	}
}

// MARK: - Smooth Tab Switch Animation

struct SwitchTabAnimation: ViewModifier {
	let isActive: Bool
	@State private var animatedValue: CGFloat = 0

	func body(content: Content) -> some View {
		content
			.overlay {
				RoundedRectangle(cornerRadius: 6)
					.fill(Color.swarmGold.opacity(0.08 * animatedValue))
					.stroke(Color.swarmGold.opacity(0.5 * animatedValue), lineWidth: 1)
					.allowsHitTesting(false)
			}
			.onChange(of: isActive) { _, newActive in
				withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
					animatedValue = newActive ? 1 : 0
				}
			}
	}
}

extension View {
	func switchTabAnimation(isActive: Bool) -> some View {
		self.modifier(SwitchTabAnimation(isActive: isActive))
	}
}

// MARK: - Add Pane Button

struct AddPaneButton: View {
	@Environment(\.agentsStore) private var agentsStore
	@State private var isHovered: Bool = false

	var body: some View {
		Button {
			agentsStore.spawnAgent(.claudeCode)
		} label: {
			Image(systemName: "plus")
				.font(.swarm(.xs))
				.foregroundStyle(isHovered ? Color.swarmGold : Color.swarmTextTertiary)
				.frame(width: 28, height: 28)
				.background {
					RoundedRectangle(cornerRadius: 6)
						.fill(isHovered ? Color.swarmGold.opacity(0.08) : Color.swarmSurfaceHover.opacity(0.3))
						.overlay(
							RoundedRectangle(cornerRadius: 6)
								.stroke(isHovered ? Color.swarmGold.opacity(0.4) : Color.swarmBorderSubtle, style: StrokeStyle(lineWidth: 1, dash: [3, 3]))
						)
				}
		}
		.buttonStyle(.plain)
		.onHover { hovering in
			withAnimation(.swarmQuick) {
				isHovered = hovering
			}
		}
		.scaleEffect(isHovered ? 1.05 : 1.0)
		.animation(.swarmQuick, value: isHovered)
	}
}
