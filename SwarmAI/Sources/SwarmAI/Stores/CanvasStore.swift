import SwiftUI

// MARK: - Shared (ThemeStore accessible as shared)

extension ThemeStore {
 static let shared = ThemeStore()
}

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

 init(id: UUID, position: CGPoint, title: String, subtitle: String, agentType: AgentType, width: CGFloat, height: CGFloat, color: Color = .swarmGold) {
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
}

struct CanvasCamera: Codable {
 var x: CGFloat
 var y: CGFloat
 var zoom: Double

 static let `default` = CanvasCamera(x: 0, y: 0, zoom: 1.0)
}
