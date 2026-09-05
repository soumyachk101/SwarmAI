import Foundation
import SwiftUI

// MARK: - Layout Algorithm Types

public enum LayoutAlgorithm: String, Codable, Sendable, CaseIterable, Identifiable {
 public var id: String { rawValue }

 case grid = "grid"
 case forceDirected = "force_directed"
 case circular = "circular"
 case hierarchical = "hierarchical"

 public var displayName: String {
 switch self {
 case .grid: return "Grid"
 case .forceDirected: return "Force-Directed"
 case .circular: return "Circular"
 case .hierarchical: return "Hierarchical"
 }
 }

 public var systemImage: String {
 switch self {
 case .grid: return "square.grid.3x3"
 case .forceDirected: return "circle.hexagongrid"
 case .circular: return "circle.circle"
 case .hierarchical: return "arrow.down.forward.and.arrow.up.backward"
 }
 }
}

// MARK: - Canvas Supporting Types

public struct CanvasNode: Identifiable, Codable, Equatable {
 public let id: UUID
 public var position: CGPoint
 public var title: String
 public var subtitle: String
 public var agentType: AgentType
 public var width: CGFloat
 public var height: CGFloat
 public var color: Color = .swarmGold
 public var status: AgentStatus = .idle
 public var isHighlighted: Bool = false

 enum CodingKeys: String, CodingKey {
 case id, position, title, subtitle, agentType, width, height
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 let posArray = try container.decode([Double].self, forKey: .position)
 position = CGPoint(x: posArray[0], y: posArray[1])
 title = try container.decode(String.self, forKey: .title)
 subtitle = try container.decode(String.self, forKey: .subtitle)
 agentType = try container.decode(AgentType.self, forKey: .agentType)
 width = try container.decode(CGFloat.self, forKey: .width)
 height = try container.decode(CGFloat.self, forKey: .height)
 color = .swarmGold
 status = .idle
 }

 public init(id: UUID = UUID(), position: CGPoint, title: String, subtitle: String, agentType: AgentType, width: CGFloat = 200, height: CGFloat = 100, color: Color = .swarmGold, status: AgentStatus = .idle) {
 self.id = id
 self.position = position
 self.title = title
 self.subtitle = subtitle
 self.agentType = agentType
 self.width = width
 self.height = height
 self.color = color
 self.status = status
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode([position.x, position.y], forKey: .position)
 try container.encode(title, forKey: .title)
 try container.encode(subtitle, forKey: .subtitle)
 try container.encode(agentType, forKey: .agentType)
 try container.encode(width, forKey: .width)
 try container.encode(height, forKey: .height)
 }

 func centerPoint() -> CGPoint {
 return CGPoint(x: position.x + width / 2, y: position.y + height / 2)
 }
}

public struct CanvasEdge: Identifiable, Codable, Equatable, Sendable {
 public let id: UUID
 public var from: UUID
 public var to: UUID
 public var label: String?
 public var flowOffset: CGFloat = 0

 public init(id: UUID = UUID(), from: UUID, to: UUID, label: String? = nil) {
 self.id = id
 self.from = from
 self.to = to
 self.label = label
 }
}

public struct CanvasCamera: Codable, Sendable {
 public var x: CGFloat
 public var y: CGFloat
 public var zoom: Double

 public static let defaultCamera = CanvasCamera(x: 0, y: 0, zoom: 1.0)
}

// MARK: - Undoable Action

public enum CanvasAction {
 case addNode(CanvasNode)
 case removeNode(CanvasNode, edges: [CanvasEdge])
 case moveNode(UUID, from: CGPoint, to: CGPoint)
 case addEdge(CanvasEdge)
 case removeEdge(CanvasEdge)
 case batch(nodesAdded: [CanvasNode], nodesRemoved: [(CanvasNode, edges: [CanvasEdge])], edgesAdded: [CanvasEdge], edgesRemoved: [CanvasEdge])

 var label: String {
 switch self {
 case .addNode: return "Add Node"
 case .removeNode: return "Remove Node"
 case .moveNode: return "Move Node"
 case .addEdge: return "Add Edge"
 case .removeEdge: return "Remove Edge"
 case .batch: return "Batch Edit"
 }
 }
}

// MARK: - Canvas Store

@MainActor
@Observable
public final class CanvasStore: @unchecked Sendable {
 public static let shared = CanvasStore()
 public var nodes: [CanvasNode] = []
 public var edges: [CanvasEdge] = []
 public var camera: CanvasCamera = .defaultCamera
 public var selectedNodeId: UUID?

 public var selectedNode: CanvasNode? {
 guard let id = selectedNodeId else { return nil }
 return nodes.first { $0.id == id }
 }

 // MARK: - Undo/Redo

 private(set) var undoStack: [CanvasAction] = []
 private(set) var redoStack: [CanvasAction] = []
 private let maxUndoSteps = 50

 public var canUndo: Bool { !undoStack.isEmpty }
 public var canRedo: Bool { !redoStack.isEmpty }

 public init() {
 seedDemoNodes()
 }

 // MARK: - Selection

 func selectNode(_ id: UUID?) {
 selectedNodeId = id
 }

 func clearSelection() {
 selectedNodeId = nil
 }

 // MARK: - Node Operations

 func addNode(title: String, subtitle: String, agentType: AgentType, position: CGPoint, status: AgentStatus = .idle) {
 let node = CanvasNode(
 id: UUID(),
 position: position,
 title: title,
 subtitle: subtitle,
 agentType: agentType,
 width: 200,
 height: 100,
 status: status
 )
 nodes.append(node)
 undoStack.append(.addNode(node))
 redoStack.removeAll()
 trimUndoStack()
 }

 func connectNodes(from: UUID, to: UUID, label: String? = nil) {
 guard nodes.contains(where: { $0.id == from }),
 nodes.contains(where: { $0.id == to }),
 from != to else { return }
 let edge = CanvasEdge(id: UUID(), from: from, to: to, label: label)
 edges.append(edge)
 undoStack.append(.addEdge(edge))
 redoStack.removeAll()
 trimUndoStack()
 }

 func disconnectNodes(from: UUID, to: UUID) {
 let removed = edges.filter { $0.from == from && $0.to == to }
 guard !removed.isEmpty else { return }
 for edge in removed {
 undoStack.append(.removeEdge(edge))
 }
 edges.removeAll { $0.from == from && $0.to == to }
 redoStack.removeAll()
 trimUndoStack()
 }

 func removeNode(_ id: UUID) {
 guard let node = nodes.first(where: { $0.id == id }) else { return }
 let relatedEdges = edges.filter { $0.from == id || $0.to == id }
 nodes.removeAll { $0.id == id }
 edges.removeAll { $0.from == id || $0.to == id }
 if selectedNodeId == id {
 selectedNodeId = nil
 }
 undoStack.append(.removeNode(node, edges: relatedEdges))
 redoStack.removeAll()
 trimUndoStack()
 }

 func updateNodePosition(_ id: UUID, newPosition: CGPoint, animated: Bool = false) {
 guard let index = nodes.firstIndex(where: { $0.id == id }) else { return }
 let oldPosition = nodes[index].position
 nodes[index].position = newPosition
 if !animated {
 undoStack.append(.moveNode(id, from: oldPosition, to: newPosition))
 redoStack.removeAll()
 trimUndoStack()
 }
 }

 // MARK: - Undo/Redo

 func undo() {
 guard let action = undoStack.popLast() else { return }
 redoStack.append(action)

 switch action {
 case .addNode(let node):
 nodes.removeAll { $0.id == node.id }
 edges.removeAll { $0.from == node.id || $0.to == node.id }
 if selectedNodeId == node.id { selectedNodeId = nil }
 case .removeNode(let node, let relatedEdges):
 nodes.append(node)
 edges.append(contentsOf: relatedEdges)
 case .moveNode(let id, let from, _):
 if let index = nodes.firstIndex(where: { $0.id == id }) {
 nodes[index].position = from
 }
 case .addEdge(let edge):
 edges.removeAll { $0.id == edge.id }
 case .removeEdge(let edge):
 edges.append(edge)
 case .batch(let addedNodes, let removedNodes, let addedEdges, let removedEdges):
 nodes.removeAll { addedNodes.map(\.id).contains($0.id) }
 edges.removeAll { addedEdges.map(\.id).contains($0.id) }
 for (node, relatedEdges) in removedNodes {
 nodes.append(node)
 edges.append(contentsOf: relatedEdges)
 }
 edges.append(contentsOf: removedEdges)
 }
 }

 func redo() {
 guard let action = redoStack.popLast() else { return }
 undoStack.append(action)

 switch action {
 case .addNode(let node):
 nodes.append(node)
 case .removeNode(let node, let relatedEdges):
 nodes.removeAll { $0.id == node.id }
 edges.removeAll { $0.from == node.id || $0.to == node.id }
 if selectedNodeId == node.id { selectedNodeId = nil }
 case .moveNode(let id, _, let to):
 if let index = nodes.firstIndex(where: { $0.id == id }) {
 nodes[index].position = to
 }
 case .addEdge(let edge):
 edges.append(edge)
 case .removeEdge(let edge):
 edges.removeAll { $0.id == edge.id }
 case .batch(let addedNodes, let removedNodes, let addedEdges, let removedEdges):
 nodes.append(contentsOf: addedNodes)
 edges.append(contentsOf: addedEdges)
 for (node, relatedEdges) in removedNodes {
 nodes.removeAll { $0.id == node.id }
 edges.removeAll { relatedEdges.map(\.id).contains($0.id) }
 }
 edges.removeAll { removedEdges.map(\.id).contains($0.id) }
 }
 }

 private func trimUndoStack() {
 if undoStack.count > maxUndoSteps {
 undoStack.removeFirst(undoStack.count - maxUndoSteps)
 }
 }

 // MARK: - Camera

 func resetCamera() {
 camera = .defaultCamera
 }

 // MARK: - Layout

 func applyLayout(_ algorithm: LayoutAlgorithm) {
 guard !nodes.isEmpty else { return }
 let positions: [UUID: CGPoint]

 switch algorithm {
 case .grid:
 positions = gridLayoutPositions()
 case .forceDirected:
 positions = forceDirectedLayoutPositions()
 case .circular:
 positions = circularLayoutPositions()
 case .hierarchical:
 positions = hierarchicalLayoutPositions()
 }

 for (id, pos) in positions {
 if let index = nodes.firstIndex(where: { $0.id == id }) {
 withAnimation(.spring(response: 0.6, dampingFraction: 0.8)) {
 nodes[index].position = pos
 }
 }
 }
 }

 private func gridLayoutPositions() -> [UUID: CGPoint] {
 var positions: [UUID: CGPoint] = [:]
 let cols = max(1, Int(ceil(sqrt(Double(nodes.count)))))
 let spacingX: CGFloat = 280
 let spacingY: CGFloat = 160
 let startX: CGFloat = 80
 let startY: CGFloat = 80

 for (index, node) in nodes.enumerated() {
 let col = index % cols
 let row = index / cols
 positions[node.id] = CGPoint(x: startX + CGFloat(col) * spacingX, y: startY + CGFloat(row) * spacingY)
 }
 return positions
 }

 private func circularLayoutPositions() -> [UUID: CGPoint] {
 var positions: [UUID: CGPoint] = [:]
 let centerX: CGFloat = 400
 let centerY: CGFloat = 300
 let radius: CGFloat = 200

 for (index, node) in nodes.enumerated() {
 let angle = (Double(index) / Double(max(nodes.count, 1))) * 2.0 * .pi - .pi / 2.0
 positions[node.id] = CGPoint(
 x: centerX + radius * cos(angle),
 y: centerY + radius * sin(angle)
 )
 }
 return positions
 }

 private func hierarchicalLayoutPositions() -> [UUID: CGPoint] {
 var positions: [UUID: CGPoint] = [:]
 let startY: CGFloat = 100
 let verticalSpacing: CGFloat = 180
 let horizontalSpacing: CGFloat = 260

 let leadNodes = nodes.filter { $0.agentType == .claudeCode }
 let workerNodes = nodes.filter { $0.agentType != .claudeCode }
 let remainingNodes = nodes.filter { node in
 !leadNodes.contains(where: { $0.id == node.id }) && !workerNodes.contains(where: { $0.id == node.id })
 }

 var xOffset: CGFloat = 80
 for (index, node) in leadNodes.enumerated() {
 positions[node.id] = CGPoint(x: xOffset + CGFloat(index) * 300, y: startY)
 }
 xOffset = 80
 for (index, node) in workerNodes.enumerated() {
 positions[node.id] = CGPoint(x: xOffset + CGFloat(index) * horizontalSpacing, y: startY + verticalSpacing)
 }
 xOffset = 80
 for (index, node) in remainingNodes.enumerated() {
 positions[node.id] = CGPoint(x: xOffset + CGFloat(index) * horizontalSpacing, y: startY + 2 * verticalSpacing)
 }
 return positions
 }

 private func forceDirectedLayoutPositions() -> [UUID: CGPoint] {
 var positions: [UUID: CGPoint] = [:]
 let centerX: CGFloat = 400
 let centerY: CGFloat = 300
 let idealLength: CGFloat = 220.0
 let iterations = 120

 for (index, node) in nodes.enumerated() {
 let angle = (Double(index) / Double(max(nodes.count, 1))) * 2.0 * .pi
 positions[node.id] = CGPoint(
 x: centerX + 180 * cos(angle),
 y: centerY + 180 * sin(angle)
 )
 }

 var adjacency: [UUID: Set<UUID>] = [:]
 for node in nodes { adjacency[node.id] = [] }
 for edge in edges {
 adjacency[edge.from]?.insert(edge.to)
 adjacency[edge.to]?.insert(edge.from)
 }

 var velocities: [UUID: CGPoint] = [:]
 for node in nodes {
 velocities[node.id] = CGPoint.zero
 }

 for _ in 0..<iterations {
 for i in 0..<nodes.count {
 for j in (i + 1)..<nodes.count {
 let nodeA = nodes[i]
 let nodeB = nodes[j]
 let posA = positions[nodeA.id]!
 let posB = positions[nodeB.id]!
 let dx = posB.x - posA.x
 let dy = posB.y - posA.y
 let dist = max(sqrt(dx * dx + dy * dy), 1.0)
 let force = 5000.0 / (dist * dist)
 let fx = (dx / dist) * force
 let fy = (dy / dist) * force
 velocities[nodeA.id]!.x -= fx
 velocities[nodeA.id]!.y -= fy
 velocities[nodeB.id]!.x += fx
 velocities[nodeB.id]!.y += fy
 }
 }

 for edge in edges {
 guard let posA = positions[edge.from],
 let posB = positions[edge.to],
 let velA = velocities[edge.from],
 let velB = velocities[edge.to] else { continue }
 let dx = posB.x - posA.x
 let dy = posB.y - posA.y
 let dist = max(sqrt(dx * dx + dy * dy), 1.0)
 let force = (dist - idealLength) * 0.05
 let fx = (dx / dist) * force
 let fy = (dy / dist) * force
 velocities[edge.from]!.x += fx
 velocities[edge.from]!.y += fy
 velocities[edge.to]!.x -= fx
 velocities[edge.to]!.y -= fy
 }

 for node in nodes {
 guard let pos = positions[node.id],
 var vel = velocities[node.id] else { continue }
 vel.x += (centerX - pos.x) * 0.001
 vel.y += (centerY - pos.y) * 0.001
 }

 for node in nodes {
 guard var pos = positions[node.id],
 var vel = velocities[node.id] else { continue }
 vel.x *= 0.85
 vel.y *= 0.85
 vel.x = max(-20, min(20, vel.x))
 vel.y = max(-20, min(20, vel.y))
 pos.x += vel.x
 pos.y += vel.y
 pos.x = max(40, min(760, pos.x))
 pos.y = max(40, min(560, pos.y))
 positions[node.id] = pos
 }
 }

 return positions
 }

 // MARK: - Zoom to Fit

 func computeBoundingBox() -> CGRect? {
 guard !nodes.isEmpty else { return nil }
 var minX: CGFloat = .greatestFiniteMagnitude
 var minY: CGFloat = .greatestFiniteMagnitude
 var maxX: CGFloat = 0
 var maxY: CGFloat = 0

 for node in nodes {
 minX = min(minX, node.position.x)
 minY = min(minY, node.position.y)
 maxX = max(maxX, node.position.x + node.width)
 maxY = max(maxY, node.position.y + node.height)
 }

 return CGRect(x: minX - 60, y: minY - 60, width: maxX - minX + 120, height: maxY - minY + 120)
 }

 // MARK: - Demo Data

 func seedDemoNodes() {
 let leadId = UUID()
 let builder1Id = UUID()
 let builder2Id = UUID()

 nodes = [
 CanvasNode(id: leadId, position: CGPoint(x: 200, y: 150), title: "Swarm Lead", subtitle: "Claude Sonnet", agentType: .claudeCode, width: 220, height: 110, status: .running),
 CanvasNode(id: builder1Id, position: CGPoint(x: 100, y: 320), title: "Frontend Builder", subtitle: "Codex Agent", agentType: .codex, width: 200, height: 100, status: .idle),
 CanvasNode(id: builder2Id, position: CGPoint(x: 320, y: 320), title: "Backend Builder", subtitle: "Claude Agent", agentType: .claudeCode, width: 200, height: 100, status: .launching)
 ]

 edges = [
 CanvasEdge(id: UUID(), from: leadId, to: builder1Id, label: "Dispatch UI"),
 CanvasEdge(id: UUID(), from: leadId, to: builder2Id, label: "Dispatch API")
 ]
 }
}
