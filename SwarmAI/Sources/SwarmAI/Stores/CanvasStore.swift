import SwiftUI

// MARK: - Canvas Supporting Types

struct CanvasNode: Identifiable, Codable {
	let id: UUID
	var position: CGPoint
	var title: String
	var subtitle: String
	var agentType: AgentType
	var width: CGFloat
	var height: CGFloat
	var color: Color = .swarmGold

	enum CodingKeys: String, CodingKey {
		case id, position, title, subtitle, agentType, width, height
	}

	init(from decoder: Decoder) throws {
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
	}

	init(id: UUID = UUID(), position: CGPoint, title: String, subtitle: String, agentType: AgentType, width: CGFloat = 200, height: CGFloat = 100, color: Color = .swarmGold) {
		self.id = id
		self.position = position
		self.title = title
		self.subtitle = subtitle
		self.agentType = agentType
		self.width = width
		self.height = height
		self.color = color
	}

	func encode(to encoder: Encoder) throws {
		var container = encoder.container(keyedBy: CodingKeys.self)
		try container.encode(id, forKey: .id)
		try container.encode([position.x, position.y], forKey: .position)
		try container.encode(title, forKey: .title)
		try container.encode(subtitle, forKey: .subtitle)
		try container.encode(agentType, forKey: .agentType)
		try container.encode(width, forKey: .width)
		try container.encode(height, forKey: .height)
	}
}

struct CanvasEdge: Identifiable, Codable {
	let id: UUID
	var from: UUID
	var to: UUID
	var label: String?

	init(id: UUID = UUID(), from: UUID, to: UUID, label: String? = nil) {
		self.id = id
		self.from = from
		self.to = to
		self.label = label
	}
}

struct CanvasCamera: Codable {
	var x: CGFloat
	var y: CGFloat
	var zoom: Double

	static let `default` = CanvasCamera(x: 0, y: 0, zoom: 1.0)
}

// MARK: - Canvas Store

@Observable
final class CanvasStore {
	var nodes: [CanvasNode] = []
	var edges: [CanvasEdge] = []
	var camera: CanvasCamera = .default
	var selectedNodeId: UUID?

	var selectedNode: CanvasNode? {
		guard let id = selectedNodeId else { return nil }
		return nodes.first { $0.id == id }
	}

	init() {
		seedDemoNodes()
	}

	func selectNode(_ id: UUID?) {
		selectedNodeId = id
	}

	func clearSelection() {
		selectedNodeId = nil
	}

	func addNode(title: String, subtitle: String, agentType: AgentType, position: CGPoint) {
		let node = CanvasNode(
			id: UUID(),
			position: position,
			title: title,
			subtitle: subtitle,
			agentType: agentType,
			width: 200,
			height: 100
		)
		nodes.append(node)
	}

	func connectNodes(from: UUID, to: UUID, label: String? = nil) {
		guard nodes.contains(where: { $0.id == from }),
			  nodes.contains(where: { $0.id == to }) else { return }
		let edge = CanvasEdge(id: UUID(), from: from, to: to, label: label)
		edges.append(edge)
	}

	func disconnectNodes(from: UUID, to: UUID) {
		edges.removeAll { $0.from == from && $0.to == to }
	}

	func removeNode(_ id: UUID) {
		nodes.removeAll { $0.id == id }
		edges.removeAll { $0.from == id || $0.to == id }
		if selectedNodeId == id {
			selectedNodeId = nil
		}
	}

	func updateNodePosition(_ id: UUID, newPosition: CGPoint) {
		if let index = nodes.firstIndex(where: { $0.id == id }) {
			nodes[index].position = newPosition
		}
	}

	func resetCamera() {
		camera = .default
	}

	private func seedDemoNodes() {
		let leadId = UUID()
		let builder1Id = UUID()
		let builder2Id = UUID()

		nodes = [
			CanvasNode(id: leadId, position: CGPoint(x: 200, y: 150), title: "Swarm Lead", subtitle: "Claude Sonnet", agentType: .claudeCode, width: 220, height: 110),
			CanvasNode(id: builder1Id, position: CGPoint(x: 100, y: 320), title: "Frontend Builder", subtitle: "Codex Agent", agentType: .codex, width: 200, height: 100),
			CanvasNode(id: builder2Id, position: CGPoint(x: 320, y: 320), title: "Backend Builder", subtitle: "Claude Agent", agentType: .claudeCode, width: 200, height: 100)
		]

		edges = [
			CanvasEdge(id: UUID(), from: leadId, to: builder1Id, label: "Dispatch UI"),
			CanvasEdge(id: UUID(), from: leadId, to: builder2Id, label: "Dispatch API")
		]
	}
}
