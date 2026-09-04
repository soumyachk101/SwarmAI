
// SwarmAI - Swift macOS AI Agents Platform
// Copyright (c) 2025 SwarmAI Project. All rights reserved.

import SwiftUI

public struct FlowBoardView: View {
	@Environment(\.canvasStore) private var canvasStore
	@Environment(\.agentsStore) private var agentsStore
	@Environment(\.appState) private var appState

	@State private var camera: CGPoint = .zero
	@State private var scale: CGFloat = 1.0
	@State private var selectedNode: String?
	@State private var draggingNode: String?
	@State private var dragOffset: CGSize = .zero

	@GestureState private var pinchScale: CGFloat = 1.0

	public init() {}

	public var body: some View {
		ZStack(alignment: .topLeading) {
			CanvasGridBackground(camera: camera, scale: scale)
				.clipped()

			// Edges layer
			ForEach(canvasStore.edges) { edge in
				edgeView(for: edge)
			}

			// Nodes layer
			ForEach(canvasStore.nodes) { node in
				nodeView(for: node)
			}

			// Empty state
			if canvasStore.nodes.isEmpty {
				emptyStateOverlay
			}
		}
		.contentShape(Rectangle())
		.gesture(panGesture)
		.gesture(pinchGesture)
		.onAppear {
			Task { @MainActor in
				canvasStore.seedDemoData()
			}
		}
	}

	// MARK: - Node View

	@ViewBuilder
	private func nodeView(for node: CanvasNode) -> some View {
		let isSelected = selectedNode == node.id

		VStack(alignment: .leading, spacing: 4) {
			Text(node.title)
				.font(.swarm(.xs, weight: .semibold))
				.foregroundStyle(.swarmTextPrimary)
				.lineLimit(1)

			Text(node.subtitle)
				.font(.swarm(.xs, weight: .regular))
				.foregroundStyle(.swarmTextSecondary)
				.lineLimit(1)
		}
		.padding(.horizontal, 14)
		.padding(.vertical, 10)
		.frame(minWidth: 120, maxWidth: 200)
		.background(
			RoundedRectangle(cornerRadius: 10, style: .continuous)
				.fill(.swarmSurface.opacity(0.85))
				.background(
					RoundedRectangle(cornerRadius: 10, style: .continuous)
						.fill(.ultraThinMaterial)
				)
		)
		.overlay(
			RoundedRectangle(cornerRadius: 10, style: .continuous)
				.stroke(
					isSelected ? .swarmGold.opacity(0.6) : .swarmBorder.opacity(0.4),
					lineWidth: isSelected ? 1.5 : 1
				)
		)
		.shadow(
			color: .black.opacity(isSelected ? 0.3 : 0.15),
			radius: isSelected ? 12 : 8,
			x: 0,
			y: isSelected ? 6 : 4
		)
		.position(
			x: node.position.x + camera.x * scale,
			y: node.position.y + camera.y * scale
		)
		.scaleEffect(scale * pinchScale)
		.gesture(
			DragGesture(minimumDistance: 5)
				.onChanged { value in
					draggingNode = node.id
					dragOffset = value.translation
				}
				.onEnded { value in
					if var current = canvasStore.nodes.first(where: { $0.id == node.id }) {
						current.position.x += value.translation.width / scale
						current.position.y += value.translation.height / scale
						canvasStore.nodes = canvasStore.nodes.map { $0.id == current.id ? current : $0 }
					}
					draggingNode = nil
					dragOffset = .zero
				}
		)
		.onTapGesture {
			withAnimation(.swarmTabSwitch) {
				selectedNode = node.id
			}
		}
	}

	// MARK: - Edge View

	private func edgeView(for edge: CanvasEdge) -> some View {
		guard let from = canvasStore.nodes.first(where: { $0.id == edge.from }),
			 let to = canvasStore.nodes.first(where: { $0.id == edge.to }) else {
			return AnyView(EmptyView())
		}

		let start = CGPoint(x: from.position.x + camera.x * scale, y: from.position.y + camera.y * scale)
		let end = CGPoint(x: to.position.x + camera.x * scale, y: to.position.y + camera.y * scale)

		return AnyView(
			Path { p in
				p.move(to: start)
				p.addLine(to: end)
			}
			.stroke(.swarmBorder.opacity(0.4), lineWidth: 1.5)
			.overlay(
				arrowHead(from: start, to: end)
					.fill(.swarmBorder.opacity(0.5))
			)
		)
	}

	private func arrowHead(from: CGPoint, to: CGPoint) -> Path {
		let angle = atan2(to.y - from.y, to.x - from.x)
		let length: CGFloat = 10
		let arrowSize: CGFloat = 6

		let tip = to
		let left = CGPoint(
			x: to.x - length * cos(angle - .pi / 6),
			y: to.y - length * sin(angle - .pi / 6)
		)
		let right = CGPoint(
			x: to.x - length * cos(angle + .pi / 6),
			y: to.y - length * sin(angle + .pi / 6)
		)

		return Path { p in
			p.move(to: tip)
			p.addLine(to: left)
			p.addLine(to: right)
			p.closeSubpath()
		}
	}

	// MARK: - Empty State

	private var emptyStateOverlay: some View {
		VStack(spacing: 16) {
			Image(systemName: "antenna.radiowaves.left.and.right")
				.font(.system(size: 48))
				.foregroundStyle(.swarmGold.opacity(0.4))

			Text("No agents in this view")
				.font(.swarm(.lg, weight: .medium))
				.foregroundStyle(.swarmTextSecondary)

			Text("Spawn agents or sync from a project")
				.font(.swarm(.xs, weight: .regular))
				.foregroundStyle(.swarmTextTertiary)
		}
		.frame(maxWidth: .infinity, maxHeight: .infinity)
		.allowsHitTesting(false)
	}

	// MARK: - Gestures

	private var panGesture: some Gesture {
		DragGesture()
			.onChanged { value in
				camera.x += value.translation.width / scale
				camera.y += value.translation.height / scale
			}
	}

	private var pinchGesture: some Gesture {
		MagnificationGesture()
			.updating($pinchScale) { value, state, _ in
				state = value
			}
			.onEnded { value in
				let newScale = scale * value
				scale = min(2.5, max(0.4, newScale))
			}
	}
}

// MARK: - Canvas Dot Grid Background

public struct CanvasGridBackground: View {
	let camera: CGPoint
	let scale: CGFloat

	public var body: some View {
		ZStack {
			Color.swarmCanvas

			Canvas { context, size in
				let dotSpacing: CGFloat = 24.0 * scale
				guard dotSpacing > 6 else { return }

				let offsetX = camera.x * scale
				let offsetY = camera.y * scale

				let startX = offsetX.truncatingRemainder(dividingBy: dotSpacing)
				let startY = offsetY.truncatingRemainder(dividingBy: dotSpacing)

				var x = startX
				while x < size.width {
					var y = startY
					while y < size.height {
						let rect = CGRect(x: x - 1, y: y - 1, width: 2, height: 2)
						context.fill(Path(ellipseIn: rect), with: .color(Color.white.opacity(0.07)))
						y += dotSpacing
					}
					x += dotSpacing
				}
			}
		}
	}
}
