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
 let currentX = (node.position.x + camera.x) * scale + dragOffset.width
 let currentY = (node.position.y + camera.y) * scale + dragOffset.height

 VStack(alignment: .leading, spacing: 6) {
 // Node Header
 HStack(spacing: 8) {
 Text(node.agentType.icon)
 .font(.system(size: 14))

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

 // Agent Status Indicator (Issue #8)
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
 .padding(10)
 .frame(width: node.width * scale, height: node.height * scale)
 .background(
 RoundedRectangle(cornerRadius: 10)
 .fill(Color.swarmSurface)
 .overlay(
 RoundedRectangle(cornerRadius: 10)
 .stroke(
 isConnectingSource ? Color.swarmWarning : (isSelected ? Color.swarmGold : Color.swarmBorderSubtle),
 lineWidth: (isSelected || isConnectingSource) ? 2 : 1
 )
 )
 )
 .shadow(
 color: .black.opacity(isDragging ? 0.45 : (isSelected ? 0.3 : 0.15)),
 radius: isDragging ? 16 : (isSelected ? 8 : 4),
 x: 0,
 y: isDragging ? 8 : 2
 )
 .scaleEffect(isDragging ? 1.03 : 1.0)
 .position(x: currentX + (node.width * scale) / 2, y: currentY + (node.height * scale) / 2)
 .onTapGesture {
 onSelect()
 }
 .gesture(
 // Node drag gesture — needs higher priority than canvas drag
 DragGesture(minimumDistance: 2)
 .onChanged { val in
 isDragging = true
 dragOffset = val.translation
 // Show ghost preview (Issue #9)
 showGhost = true
 ghostPosition = CGPoint(
 x: (node.position.x + camera.x) * scale + val.translation.width + (node.width * scale) / 2,
 y: (node.position.y + camera.y) * scale + val.translation.height + (node.height * scale) / 2
 )
 }
 .onEnded { val in
 isDragging = false
 showGhost = false
 ghostPosition = nil
 let finalX = node.position.x + val.translation.width / scale
 let finalY = node.position.y + val.translation.height / scale
 dragOffset = .zero
 onDragChanged(CGPoint(x: finalX, y: finalY))
 }
 )
 .contextMenu {
 Button("Connect to Another Node") {
 onStartConnect()
 }
 Button("Delete Node", role: .destructive) {
 onDelete()
 }
 }
 // Ghost node preview while dragging (Issue #9)
 .overlay(
 Group {
 if showGhost, let ghostPos = ghostPosition {
 ghostNodeView(at: ghostPos)
 }
 }
 )
 }

 // Ghost/drag preview node (Issue #9)
 @ViewBuilder
 private func ghostNodeView(at position: CGPoint) -> some View {
 VStack(alignment: .leading, spacing: 4) {
 HStack(spacing: 6) {
 Text(node.agentType.icon)
 .font(.system(size: 12))

 VStack(alignment: .leading, spacing: 0) {
 Text(node.title)
 .font(.swarm(.micro, weight: .semibold))
 .foregroundStyle(Color.swarmTextPrimary)
 .lineLimit(1)
 }
 }
 }
 .padding(6)
 .frame(width: node.width * scale * 0.9, height: node.height * scale * 0.85)
 .background(
 RoundedRectangle(cornerRadius: 8)
 .fill(Color.swarmSurface.opacity(0.6))
 .overlay(
 RoundedRectangle(cornerRadius: 8)
 .stroke(Color.swarmGold.opacity(0.5), lineWidth: 1)
 )
 )
 .position(x: position.x, y: position.y)
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
