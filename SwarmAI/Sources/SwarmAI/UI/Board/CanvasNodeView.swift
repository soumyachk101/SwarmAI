import SwiftUI

// MARK: - Canvas Node View

public struct CanvasNodeView: View {
 let node: CanvasNode
 var isSelected: Bool = false
 var isConnectingSource: Bool = false
 var camera: CGPoint = .zero
 var scale: CGFloat = 1.0
 var onSelect: () -> Void = {}
 var onStartConnect: () -> Void = {}
 var onDragChanged: (CGPoint) -> Void = { _ in }
 var onDelete: () -> Void = {}

 @State private var dragOffset: CGSize = .zero
 @State private var isDragging = false
 @State private var showGhost = false
 @State private var ghostPosition: CGPoint? = nil

 public var body: some View {
 nodeCard
 }

 // MARK: - Computed Position

 private var currentX: CGFloat {
 (node.position.x + camera.x) * scale + dragOffset.width
 }

 private var currentY: CGFloat {
 (node.position.y + camera.y) * scale + dragOffset.height
 }

 // MARK: - Shadow Helpers

 private var shadowColorOpacity: CGFloat {
 isDragging ? 0.45 : (isSelected ? 0.3 : 0.15)
 }

 private var shadowRadius: CGFloat {
 isDragging ? 16 : (isSelected ? 8 : 4)
 }

 private var shadowY: CGFloat {
 isDragging ? 8 : 2
 }

 private var cardScale: CGFloat {
 isDragging ? 1.03 : 1.0
 }

 // MARK: - Card Assembly

 private var nodeCard: some View {
 nodeContent
 .padding(10)
 .frame(width: node.width * scale, height: node.height * scale)
 .background(nodeCardBackground)
 .shadow(
 color: .black.opacity(shadowColorOpacity),
 radius: shadowRadius,
 x: 0,
 y: shadowY
 )
 .scaleEffect(cardScale)
 .position(x: currentX + (node.width * scale) / 2, y: currentY + (node.height * scale) / 2)
 .onTapGesture { onSelect() }
 .gesture(dragGesture)
 .contextMenu { contextMenuContent }
 .overlay(ghostOverlay)
 }

 private var nodeContent: some View {
 VStack(alignment: .leading, spacing: 6) {
 // Node Header
 HStack(spacing: 8) {
 Image(systemName: node.agentType.icon)
 .font(.system(size: 13, weight: .semibold))
 .foregroundStyle(node.agentType.color)

 VStack(alignment: .leading, spacing: 1) {
 Text(node.title)
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(Color.swarmTextPrimary)
 .lineLimit(1)

 Text(node.subtitle)
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 .lineLimit(1)
 }

 Spacer(minLength: 4)

 // Agent Status Indicator
 HStack(spacing: 3) {
 Circle()
 .fill(node.status.color)
 .frame(width: 7, height: 7)
 .overlay(
 Circle()
 .stroke(node.status.color.opacity(0.5), lineWidth: 1.5)
 .scaleEffect(node.status.isActive ? 1.5 : 1.0)
 .opacity(node.status.isActive ? 0 : 1)
 .animation(
 node.status.isActive
 ? Animation.easeInOut(duration: 1.0).repeatForever(autoreverses: true)
 : .none,
 value: node.status
 )
 )

 if node.status == .error {
 Image(systemName: "exclamationmark.triangle.fill")
 .font(.swarm(.micro))
 .foregroundStyle(Color.swarmError)
 } else if node.status == .done {
 Image(systemName: "checkmark.seal.fill")
 .font(.swarm(.micro))
 .foregroundStyle(Color.swarmGold)
 }
 }
 }

 Divider()
 .background(Color.swarmBorderSubtle)

 // Bottom Info / Node Type Badge
 HStack {
 Text(node.agentType.displayName.uppercased())
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmGold)
 .padding(.horizontal, 5)
 .padding(.vertical, 2)
 .background(Color.swarmGold.opacity(0.12))
 .cornerRadius(3)

 Spacer()

 if isConnectingSource {
 Text("Connecting...")
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmWarning)
 }
 }
 }
 }

 private var nodeCardBackground: some View {
 RoundedRectangle(cornerRadius: 10)
 .fill(Color.swarmSurface.opacity(isSelected ? 0.8 : 0.6))
 .overlay(
 RoundedRectangle(cornerRadius: 10)
 .stroke(
 isSelected ? Color.swarmGold.opacity(0.6) : Color.swarmBorderSubtle.opacity(0.5),
 lineWidth: isSelected ? 1.5 : 1
 )
 )
 }

 private var dragGesture: some Gesture {
 DragGesture(minimumDistance: 3)
 .onChanged { value in
 isDragging = true
 dragOffset = value.translation
 onDragChanged(CGPoint(x: value.translation.width / scale, y: value.translation.height / scale))
 }
 .onEnded { value in
 isDragging = false
 dragOffset = .zero
 }
 }

 private var contextMenuContent: some View {
 VStack(alignment: .leading, spacing: 6) {
 Button("Connect") {
 onStartConnect()
 }

 Button("Delete") {
 onDelete()
 }
 }
 }

 private var ghostOverlay: some View {
 Group {
 		if showGhost, let pos = ghostPosition {
			GhostNodePreview(
				icon: node.agentType.icon,
				title: node.title,
				displayWidth: node.width * scale * 0.9,
				displayHeight: node.height * scale * 0.85
			)
			.position(x: pos.x, y: pos.y)
		}
 }
 }

 // MARK: - Ghost Node Preview Helper

 fileprivate struct GhostNodePreview: View {
 let icon: String
 let title: String
 let displayWidth: CGFloat
 let displayHeight: CGFloat

 var body: some View {
 VStack(alignment: .leading, spacing: 4) {
 HStack(spacing: 6) {
 Text(icon)
 .font(.system(size: 12))

 VStack(alignment: .leading, spacing: 0) {
 Text(title)
 .font(.swarm(.micro, weight: .semibold))
 .foregroundStyle(Color.swarmTextPrimary)
 .lineLimit(1)
 }
 }
 .padding(6)
 .frame(width: displayWidth, height: displayHeight)
 .background(
 RoundedRectangle(cornerRadius: 8)
 .fill(Color.swarmSurface.opacity(0.6))
 .overlay(
 RoundedRectangle(cornerRadius: 8)
 .stroke(Color.swarmGold.opacity(0.5), lineWidth: 1)
 )
 )
 }
 }
 }
}
