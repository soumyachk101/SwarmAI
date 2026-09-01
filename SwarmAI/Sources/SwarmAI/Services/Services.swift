import Foundation

// MARK: - Git Worktree Management

@Observable
final class WorktreeService {
 static let shared = WorktreeService()

 func createWorktree(branch: String, baseBranch: String = "main", at path: String) throws -> Worktree {
 // In production: execute `git worktree add -b <branch> <path> <base>`
 let worktree = Worktree(
 name: branch,
 path: path,
 branch: branch
 )
 return worktree
 }

 func removeWorktree(_ worktree: Worktree) throws {
 // In production: execute `git worktree remove <path>`
 }

 func listWorktrees() -> [Worktree] {
 // In production: execute `git worktree list`
 []
 }

 func switchBranch(_ worktree: Worktree, to branch: String) throws {
 // In production: execute `git -C <path> switch <branch>`
 }
}

// MARK: - Agent Process Spawner

@Observable
final class AgentSpawner {
 static let shared = AgentSpawner()

 func spawn(_ type: AgentType, in worktree: Worktree?) throws -> Agent {
 let agent = Agent(
 name: "\(type.displayName)-\(UUID().uuidString.prefix(4))",
 agentType: type,
 status: .launching
 )

 // In production: actually spawn the CLI process
 // This would use NSTask/Process to spawn the CLI with appropriate arguments
 agent.status = .running
 agent.lastActivity = Date()

 return agent
 }

 func terminate(_ agent: Agent) throws {
 // In production: kill the process
 }
}

// MARK: - MCP Server

@Observable
final class PheromoneMCPServer {
 static let shared = PheromoneMCPServer()

 var isRunning: Bool = false
 var connectedClients: [UUID] = []

 func start() {
 isRunning = true
 }

 func stop() {
 isRunning = false
 connectedClients.removeAll()
 }

 func handleRequest(_ request: MCPRequest) -> MCPResponse {
 switch request.method {
 case "search_memories":
 let results = PheromoneService.shared.search(query: request.params["query"] as? String ?? "")
 return MCPResponse(id: request.id, result: results.map { $0.content })
 case "store_memory":
 // Handle memory storage
 return MCPResponse(id: request.id, result: "stored")
 default:
 return MCPResponse(id: request.id, error: .init(code: -32601, message: "Method not found"))
 }
 }
}

struct MCPRequest: Codable {
 let id: UUID
 let method: String
 let params: [String: AnyCodable]
}

struct MCPResponse: Codable {
 let id: UUID
 let result: AnyCodable?
 let error: MCPError?

 struct MCPError: Codable {
 let code: Int
 let message: String
 }
}

struct AnyCodable: Codable {
 let value: Any

 init(_ value: Any) {
 self.value = value
 }

 init(from decoder: Decoder) throws {
 let container = try decoder.singleValueContainer()
 if let int = try? container.decode(Int.self) {
 value = int
 } else if let string = try? container.decode(String.self) {
 value = string
 } else if let bool = try? container.decode(Bool.self) {
 value = bool
 } else if let array = try? container.decode([AnyCodable].self) {
 value = array.map { $0.value }
 } else if let dict = try? container.decode([String: AnyCodable].self) {
 value = dict.mapValues { $0.value }
 } else {
 value = NSNull()
 }
 }

 func encode(to encoder: Encoder) throws {
 var container = encoder.singleValueContainer()
 // Encoding logic
 }
}
