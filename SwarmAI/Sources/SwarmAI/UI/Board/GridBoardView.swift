import SwiftUI

// MARK: - Grid Layout View

struct GridBoardView: View {
 @Bindable var agentsStore: AgentsStore
 @Bindable var appState: AppState

 var columns: Int {
 agentsStore.gridLayout.columns
 }

 var rows: Int {
 agentsStore.gridLayout.rows
 }

 var body: some View {
 VStack(spacing: 0) {
 // Grid preset picker bar
 GridPresetBar(agentsStore: agentsStore)

 // Grid
 LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 2), count: max(columns, 1)), spacing: 2) {
 ForEach(agentsStore.agents) { agent in
 AgentPaneView(agent: agent, agentsStore: agentsStore)
 }
 }
 .padding(2)
 .background(.swarmCanvas)

 Spacer()
 }
 }
}

// MARK: - Grid Preset Bar

struct GridPresetBar: View {
 @Bindable var agentsStore: AgentsStore
 @State private var showPresetPicker = false

 let presets: [(name: String, columns: Int, rows: Int)] = [
 ("Auto", 0, 0),
 ("2x2", 2, 2),
 ("3x3", 3, 3),
 ("4x4", 4, 4),
 ("Columns", 1, 0),
 ("Rows", 0, 1),
 ("Master", 1, 1),
 ("Focus", 1, 1),
 ]

 var body: some View {
 HStack(spacing: 4) {
 ForEach(Array(presets.enumerated()), id: \.offset) { index, preset in
 Button {
 let gridPreset = GridPreset.allCases[index]
 agentsStore.setGridLayout(gridPreset)
 } label: {
 Text(preset.name)
 .font(.swarm(.micro, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 4)
 .fill(agentsStore.gridLayout.columns == preset.columns && agentsStore.gridLayout.rows == preset.rows ? .swarmGold.opacity(0.2) : .swarmSurface)
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 }
}

// MARK: - Flow Canvas View

struct FlowBoardView: View {
 @Bindable var canvasStore: CanvasStore
 @Bindable var agentsStore: AgentsStore
 @State private var cameraOffset: CGPoint = .zero
 @State private var scale: CGFloat = 1.0
 @State private var selectedNode: UUID?

 var body: some View {
 ZStack {
 // Canvas background
 Color.swarmCanvas
 .gesture(
 DragGesture()
 .onChanged { value in
 cameraOffset.x += value.translation.width - (value.translation.width * 0)
 cameraOffset.y += value.translation.height - (value.translation.height * 0)
 }
 )

 // Edges (drawn first, behind nodes)
 FlowEdgesView(nodes: canvasStore.nodes, edges: canvasStore.edges, camera: cameraOffset, scale: scale)

 // Nodes
 ForEach(canvasStore.nodes) { node in
 CanvasNodeView(
 node: node,
 isSelected: selectedNode == node.id,
 camera: cameraOffset,
 scale: scale
 )
 .onTapGesture {
 canvasStore.selectNode(node.id)
 selectedNode = node.id
 }
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
 }
}

// MARK: - Canvas Node View

struct CanvasNodeView: View {
 let node: CanvasNode
 var isSelected: Bool = false
 var camera: CGPoint = .zero
 var scale: CGFloat = 1.0

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
 .foregroundStyle(.swarmTextPrimary)
 }

 Text(node.subtitle)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)

 // Status dot
 Circle()
 .fill(.swarmSuccess)
 .frame(width: 6, height: 6)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .frame(width: node.width * scale, height: node.height * scale)
 .background {
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface)
 .overlay {
 RoundedRectangle(cornerRadius: 10)
 .stroke(isSelected ? .swarmGold : .swarmBorderSubtle, lineWidth: isSelected ? 2 : 1)
 }
 }
 .shadow(color: .black.opacity(0.3), radius: isDragging ? 16 : 8, x: 0, y: isDragging ? 8 : 4)
 .scaleEffect(isDragging ? 1.05 : 1.0)
 .position(x: x + node.width * scale / 2, y: y + node.height * scale / 2)
 .gesture(
 DragGesture()
 .onChanged { value in
 isDragging = true
 }
 .onEnded { value in
 isDragging = false
 }
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

 let fromX = (fromNode.position.x + fromNode.width/2 + camera.x) * scale
 let fromY = (fromNode.position.y + fromNode.height/2 + camera.y) * scale
 let toX = (toNode.position.x + toNode.width/2 + camera.x) * scale
 let toY = (toNode.position.y + toNode.height/2 + camera.y) * scale

 let path = Path { p in
 p.move(to: CGPoint(x: fromX, y: fromY))
 p.addCurve(
 to: CGPoint(x: toX, y: toY),
 control1: CGPoint(x: fromX + 80, y: fromY),
 control2: CGPoint(x: toX - 80, y: toY)
 )
 }

 context.stroke(path, with: .color(.swarmGold.opacity(0.4)), lineWidth: 2)
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
 .foregroundStyle(.swarmTextSecondary)
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
 .foregroundStyle(.swarmTextTertiary)
 }
 }
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmSurface)
 }
 }
}
