import SwiftUI

@Observable
public final class AgentsStore: @unchecked Sendable {
  public var agents: [Agent] = []
  public var gridLayout: GridLayout = GridLayout(columns: 2, rows: 2, panePositions: [])
  public var maximizedPaneId: String?
  public var activePaneId: String?

 init() {
 loadFromStorage()
 if agents.isEmpty {
 // Seed with example data for preview
 agents = [
 Agent(name: "Claude Lead", agentType: .claudeCode, status: .idle, role: .lead, leadMode: .steward),
 Agent(name: "Worker-1", agentType: .codex, status: .idle),
 ]
 }
 }

 func spawnAgent(_ type: AgentType = .claudeCode, name: String? = nil) -> Agent {
 let agent = Agent(
 name: name ?? "\(type.displayName)-\(agents.count + 1)",
 agentType: type,
 status: .launching
 )
 agents.append(agent)
 saveToStorage()
 return agent
 }

 func removeAgent(_ id: UUID) {
 agents.removeAll { $0.id == id }
 if maximizedPaneId == nil { maximizedPaneId = nil }
 saveToStorage()
 }

 func updateAgentStatus(_ id: UUID, status: AgentStatus) {
 if let index = agents.firstIndex(where: { $0.id == id }) {
 agents[index].status = status
 agents[index].lastActivity = Date()
 }
 }

 func maximizePane(_ agentId: UUID?) {
 maximizedPaneId = agentId?.uuidString
 }

 func closePane(_ agentId: UUID) {
 removeAgent(agentId)
 maximizedPaneId = nil
 }

 func getAgent(by id: UUID) -> Agent? {
 agents.first { $0.id == id }
 }

  func setGridLayout(_ preset: GridPreset) {
    var layout = GridLayout(columns: preset.defaultColumns, rows: preset.defaultRows, preset: preset)
    let positions = agents.enumerated().map { index, agent in
      PanePosition(
        id: UUID(),
        paneId: agent.id.uuidString,
        x: index % max(layout.columns, 1),
        y: index / max(layout.columns, 1),
        width: 1,
        height: 1,
        paneType: .agent
      )
    }
    layout.panePositions = positions
    gridLayout = layout
    saveToStorage()
  }

 func agentCount(for status: AgentStatus) -> Int {
 agents.filter { $0.status == status }.count
 }

 private func saveToStorage() {
 if let data = try? JSONEncoder().encode(agents) {
 UserDefaults.standard.set(data, forKey: "savedAgents")
 }
 }

 private func loadFromStorage() {
 guard let data = UserDefaults.standard.data(forKey: "savedAgents"),
 let decoded = try? JSONDecoder().decode([Agent].self, from: data) else { return }
 agents = decoded
 }
}
