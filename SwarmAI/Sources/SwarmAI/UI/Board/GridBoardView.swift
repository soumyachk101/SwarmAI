import SwiftUI

// MARK: - Grid Layout View

struct GridBoardView: View {
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.appState) private var appState

	@State private var bgOpacity: Double = 0
	@State private var gridOpacity: Double = 0
	@State private var presetBarOffset: CGFloat = -10
	@State private var gridCornerRadius: CGFloat = 16
	@State private var breathingPhase: CGFloat = 0
	@State private var hasAppeared = false

	private var currentPreset: GridPreset {
		agentsStore.gridLayout.preset ?? .auto
	}

	var body: some View {
		VStack(spacing: 0) {
			// Grid preset picker bar
			GridPresetBar()
				.offset(y: hasAppeared ? 0 : presetBarOffset)
				.opacity(hasAppeared ? 1 : 0)
				.animation(
					hasAppeared
						? .easeOut(duration: 0.4).delay(0.25)
						: .none,
					value: hasAppeared
				)

			// Agent Layout Panes Container
			Group {
				if agentsStore.agents.isEmpty {
					emptyStateView
				} else {
					layoutContentView
				}
			}
			.padding(4)
			.background(Color.swarmCanvas.opacity(bgOpacity))
			.clipShape(RoundedRectangle(cornerRadius: gridCornerRadius))
			.overlay(
				RoundedRectangle(cornerRadius: gridCornerRadius)
					.stroke(Color.swarmBorderSubtle, lineWidth: 1)
			)
			.animation(.easeInOut(duration: 0.5), value: bgOpacity)
			.animation(.spring(response: 0.6, dampingFraction: 0.85), value: gridCornerRadius)

			Spacer(minLength: 0)
		}
		.ignoresSafeArea(.container, edges: .bottom)
		.onAppear {
			guard !hasAppeared else { return }
			hasAppeared = true

			withAnimation(.easeIn(duration: 0.3)) {
				bgOpacity = 1
			}

			withAnimation(.spring(response: 0.5, dampingFraction: 0.85).delay(0.15)) {
				gridCornerRadius = 4
			}

			withAnimation(.linear(duration: 3.0).repeatCount(1, autoreverses: true)) {
				breathingPhase = 1
			}

			DispatchQueue.main.asyncAfter(deadline: .now() + 3.3) {
				withAnimation(.linear(duration: 6.0).repeatForever(autoreverses: true)) {
					breathingPhase = 1
				}
			}
		}
	}

	// MARK: - Layout Switcher

	@ViewBuilder
	private var layoutContentView: some View {
		switch currentPreset {
		case .auto:
			autoGridLayout
		case .twoByTwo:
			fixedGridLayout(columns: 2)
		case .threeByThree:
			fixedGridLayout(columns: 3)
		case .fourByFour:
			fixedGridLayout(columns: 4)
		case .master:
			masterDetailLayout
		case .focus:
			focusLayout
		case .columns:
			columnsLayout
		case .rows:
			rowsLayout
		}
	}

	// MARK: - Preset 1: Auto Grid Layout
	private var autoGridLayout: some View {
		let count = agentsStore.agents.count
		let colCount: Int = {
			switch count {
			case 0...1: return 1
			case 2...4: return 2
			case 5...9: return 3
			case 10...16: return 4
			default: return max(1, Int(ceil(sqrt(Double(count)))))
			}
		}()

		return fixedGridLayout(columns: colCount)
	}

	// MARK: - Presets 2-4: Fixed N-Column Grid Layout
	private func fixedGridLayout(columns: Int) -> some View {
		ScrollView {
			LazyVGrid(
				columns: Array(repeating: GridItem(.flexible(minimum: 280), spacing: 4), count: max(columns, 1)),
				spacing: 4
			) {
				ForEach(Array(agentsStore.agents.enumerated()), id: \.element.id) { index, agent in
					AgentPaneView(agent: agent)
						.frame(minHeight: 280)
						.opacity(hasAppeared ? 1 : 0)
						.scaleEffect(hasAppeared ? 1.0 : 0.9)
						.offset(y: hasAppeared ? 0 : 15)
						.animation(
							hasAppeared
								? .spring(response: 0.5, dampingFraction: 0.8)
									.delay(Double(index) * 0.04)
								: .none,
							value: hasAppeared
						)
				}
			}
			.padding(2)
		}
	}

	// MARK: - Preset 5: Master-Detail Layout
	private var masterDetailLayout: some View {
		let agents = agentsStore.agents
		let primaryAgent = agents.first(where: { $0.id.uuidString == agentsStore.activePaneId }) ?? agents.first!
		let detailAgents = agents.filter { $0.id != primaryAgent.id }

		return HStack(spacing: 4) {
			// Master (Primary) Pane
			AgentPaneView(agent: primaryAgent)
				.frame(maxWidth: .infinity, maxHeight: .infinity)

			// Detail Side Strip
			if !detailAgents.isEmpty {
				VStack(spacing: 4) {
					ForEach(detailAgents) { detail in
						AgentPaneView(agent: detail)
							.frame(maxWidth: .infinity, maxHeight: .infinity)
							.onTapGesture {
								agentsStore.activePaneId = detail.id.uuidString
							}
					}
				}
				.frame(width: 380)
			}
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
	}

	// MARK: - Preset 6: Focus Layout
	private var focusLayout: some View {
		let active = agentsStore.agents.first(where: { $0.id.uuidString == agentsStore.activePaneId }) ?? agentsStore.agents.first!

		return VStack(spacing: 4) {
			// Focus switcher bar if multiple agents
			if agentsStore.agents.count > 1 {
				HStack(spacing: 4) {
					ForEach(agentsStore.agents) { agent in
						Button {
							agentsStore.activePaneId = agent.id.uuidString
						} label: {
							HStack(spacing: 4) {
								Text(agent.agentType.icon)
								Text(agent.name)
									.font(.swarm(.micro, weight: agent.id == active.id ? .bold : .regular))
							}
							.padding(.horizontal, 8)
							.padding(.vertical, 3)
							.background(agent.id == active.id ? Color.swarmGold.opacity(0.2) : Color.swarmSurface)
							.cornerRadius(4)
						}
						.buttonStyle(.plain)
					}
					Spacer()
				}
				.padding(.horizontal, 4)
			}

			AgentPaneView(agent: active)
				.frame(maxWidth: .infinity, maxHeight: .infinity)
		}
	}

	// MARK: - Preset 7: Horizontal Columns Layout
	private var columnsLayout: some View {
		HStack(spacing: 4) {
			ForEach(agentsStore.agents) { agent in
				AgentPaneView(agent: agent)
					.frame(maxWidth: .infinity, maxHeight: .infinity)
			}
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
	}

	// MARK: - Preset 8: Vertical Rows Layout
	private var rowsLayout: some View {
		VStack(spacing: 4) {
			ForEach(agentsStore.agents) { agent in
				AgentPaneView(agent: agent)
					.frame(maxWidth: .infinity, maxHeight: .infinity)
			}
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
	}

	// MARK: - Empty State
	private var emptyStateView: some View {
		VStack(spacing: 16) {
			Image(systemName: "square.grid.2x2")
				.font(.system(size: 40))
				.foregroundStyle(Color.swarmTextTertiary)

			Text("No Active Agent Panes")
				.font(.swarm(.base, weight: .medium))
				.foregroundStyle(Color.swarmTextPrimary)

			Text("Spawn a new agent or select a template to begin.")
				.font(.swarm(.sm))
				.foregroundStyle(Color.swarmTextSecondary)

			Button {
				_ = agentsStore.spawnAgent(.claudeCode)
			} label: {
				Label("Spawn Claude Agent", systemImage: "plus")
					.font(.swarm(.sm, weight: .medium))
					.foregroundStyle(.black)
					.padding(.horizontal, 16)
					.padding(.vertical, 8)
					.background(Color.swarmGold)
					.cornerRadius(6)
			}
			.buttonStyle(.plain)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.padding(40)
	}
}

// MARK: - Grid Preset Bar

struct GridPresetBar: View {
	@Environment(\.agentsStore) private var agentsStore

	var body: some View {
		HStack(spacing: 4) {
			ForEach(GridPreset.allCases, id: \.self) { preset in
				Button {
					agentsStore.setGridLayout(preset)
				} label: {
					Text(preset.displayName)
						.font(.swarm(.micro, weight: .medium))
						.foregroundStyle(agentsStore.gridLayout.preset == preset ? Color.swarmGold : Color.swarmTextSecondary)
						.padding(.horizontal, 8)
						.padding(.vertical, 4)
						.background {
							RoundedRectangle(cornerRadius: 4)
								.fill(agentsStore.gridLayout.preset == preset ? Color.swarmGold.opacity(0.2) : Color.swarmSurface)
						}
				}
				.buttonStyle(.plain)
			}
			.padding(.horizontal, 8)
			.padding(.vertical, 4)

			Spacer()
		}
	}
}

// MARK: - Flow Canvas View

struct FlowBoardView: View {
	@Environment(\.canvasStore) private var canvasStore
	@Environment(\.agentsStore) private var agentsStore
	@State private var cameraOffset: CGPoint = .zero
	@State private var scale: CGFloat = 1.0
	@State private var hasAppeared = false

	var body: some View {
		ZStack {
			// Canvas background
			Color.swarmCanvas
				.gesture(
					DragGesture()
						.onChanged { value in
							cameraOffset.x += value.translation.width
							cameraOffset.y += value.translation.height
						}
				)
				.opacity(hasAppeared ? 1 : 0)
				.animation(.easeIn(duration: 0.3), value: hasAppeared)

			// Edges
			FlowEdgesView(nodes: canvasStore.nodes, edges: canvasStore.edges, camera: cameraOffset, scale: scale)
				.opacity(hasAppeared ? 0.6 : 0)
				.animation(.easeOut(duration: 0.4).delay(0.1), value: hasAppeared)

			// Nodes
			ForEach(Array(canvasStore.nodes.enumerated()), id: \.element.id) { index, node in
				CanvasNodeView(
					node: node,
					isSelected: canvasStore.selectedNodeId == node.id,
					camera: cameraOffset,
					scale: scale,
					staggerIndex: hasAppeared ? index : 0
				)
				.onTapGesture {
					canvasStore.selectNode(node.id)
				}
				.opacity(hasAppeared ? 1 : 0)
				.scaleEffect(hasAppeared ? 1.0 : 0.9)
				.offset(y: hasAppeared ? 0 : 15)
				.animation(
					hasAppeared
						? .spring(response: 0.5, dampingFraction: 0.8)
							.delay(Double(index) * 0.05 + 0.05)
						: .none,
					value: hasAppeared
				)
			}

			// Zoom controls
			VStack {
				Spacer()
				HStack {
					Spacer()
					FlowZoomControl(scale: $scale)
						.padding(.trailing, 16)
						.padding(.bottom, 16)
				}
			}
		}
		.onAppear {
			guard !hasAppeared else { return }
			hasAppeared = true
		}
	}
}

// MARK: - Canvas Node View

struct CanvasNodeView: View {
	let node: CanvasNode
	var isSelected: Bool = false
	var camera: CGPoint = .zero
	var scale: CGFloat = 1.0
	var staggerIndex: Int = 0

	@State private var isDragging = false

	var body: some View {
		let x = (node.position.x + camera.x) * scale
		let y = (node.position.y + camera.y) * scale

		VStack(spacing: 6) {
			HStack(spacing: 6) {
				Text(node.agentType.icon)
					.font(.system(size: 14))

				Text(node.title)
					.font(.swarm(.xs, weight: .semibold))
					.foregroundStyle(Color.swarmTextPrimary)
			}

			Text(node.subtitle)
				.font(.swarm(.micro))
				.foregroundStyle(Color.swarmTextTertiary)

			Circle()
				.fill(Color.swarmSuccess)
				.frame(width: 6, height: 6)
		}
		.padding(.horizontal, 12)
		.padding(.vertical, 8)
		.frame(width: node.width * scale, height: node.height * scale)
		.background {
			RoundedRectangle(cornerRadius: 10)
				.fill(Color.swarmSurface)
				.overlay {
					RoundedRectangle(cornerRadius: 10)
						.stroke(isSelected ? Color.swarmGold : Color.swarmBorderSubtle, lineWidth: isSelected ? 2 : 1)
				}
		}
		.shadow(color: .black.opacity(0.3), radius: isDragging ? 16 : 8, x: 0, y: isDragging ? 8 : 4)
		.scaleEffect(isDragging ? 1.05 : 1.0)
		.position(x: x + node.width * scale / 2, y: y + node.height * scale / 2)
		.gesture(
			DragGesture()
				.onChanged { _ in isDragging = true }
				.onEnded { _ in isDragging = false }
		)
	}
}

// MARK: - Flow Edges

struct FlowEdgesView: View {
	let nodes: [CanvasNode]
	let edges: [CanvasEdge]
	var camera: CGPoint = .zero
	var scale: CGFloat = 1.0

	var body: some View {
		Canvas { context, size in
			for edge in edges {
				guard let fromNode = nodes.first(where: { $0.id == edge.from }),
					  let toNode = nodes.first(where: { $0.id == edge.to }) else { continue }

				let fromX = (fromNode.position.x + fromNode.width / 2 + camera.x) * scale
				let fromY = (fromNode.position.y + fromNode.height / 2 + camera.y) * scale
				let toX = (toNode.position.x + toNode.width / 2 + camera.x) * scale
				let toY = (toNode.position.y + toNode.height / 2 + camera.y) * scale

				let path = Path { p in
					p.move(to: CGPoint(x: fromX, y: fromY))
					p.addCurve(
						to: CGPoint(x: toX, y: toY),
						control1: CGPoint(x: fromX + 80, y: fromY),
						control2: CGPoint(x: toX - 80, y: toY)
					)
				}

				context.stroke(path, with: .color(Color.swarmGold.opacity(0.4)), lineWidth: 2)
			}
		}
	}
}

// MARK: - Zoom Control

struct FlowZoomControl: View {
	@Binding var scale: CGFloat

	var body: some View {
		HStack(spacing: 2) {
			Button {
				withAnimation(.swarmQuick) {
					scale = max(0.25, scale - 0.25)
				}
			} label: {
				Image(systemName: "minus")
					.font(.swarm(.xs))
			}

			Text("\(Int(scale * 100))%")
				.font(.swarm(.micro))
				.foregroundStyle(Color.swarmTextSecondary)
				.frame(minWidth: 40)

			Button {
				withAnimation(.swarmQuick) {
					scale = min(3.0, scale + 0.25)
				}
			} label: {
				Image(systemName: "plus")
					.font(.swarm(.xs))
			}

			Button {
				withAnimation(.swarmMedium) {
					scale = 1.0
				}
			} label: {
				Image(systemName: "arrow.counterclockwise")
					.font(.swarm(.micro))
					.foregroundStyle(Color.swarmTextTertiary)
			}
			.padding(.horizontal, 8)
			.padding(.vertical, 4)
			.background {
				RoundedRectangle(cornerRadius: 6)
					.fill(Color.swarmSurface)
			}
		}
	}
}
