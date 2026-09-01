import SwiftUI

// MARK: - SwarmMind Orchestration Core

@Observable
final class SwarmMind {
 static let shared = SwarmMind()

 var isRunning: Bool = false
 var currentGoal: String?
 var activeNodes: [SwarmNode] = []
 var handoffs: [Handoff] = []

 func start(goal: String) {
 isRunning = true
 currentGoal = goal

 // Decompose goal into tasks
 let tasks = decompose(goal)

 // Spawn nodes for each task
 for task in tasks {
 let node = SwarmNode(task: task)
 activeNodes.append(node)
 node.start()
 }

 // Connect nodes
 connectNodes()
 }

 func stop() {
 isRunning = false
 currentGoal = nil
 for node in activeNodes {
 node.stop()
 }
 activeNodes.removeAll()
 }

 private func decompose(_ goal: String) -> [Task] {
 // Goal decomposition logic
 // In production, this would use the Lead agent to break down the goal
 let task = Task(title: goal, status: .inProgress, priority: .high)
 return [task]
 }

 private func connectNodes() {
 // Set up communication channels between nodes
 }

 func sendHandoff(from: UUID, to: UUID, context: String, files: [String]) {
 let handoff = Handoff(
 fromAgentId: from,
 toAgentId: to,
 status: .pending,
 context: context,
 files: files,
 instructions: ""
 )
 handoffs.append(handoff)
 }

 func approveHandoff(_ id: UUID) {
 if let index = handoffs.firstIndex(where: { $0.id == id }) {
 handoffs[index].status = .completed
 }
 }

 func rejectHandoff(_ id: UUID) {
 if let index = handoffs.firstIndex(where: { $0.id == id }) {
 handoffs[index].status = .rejected
 }
 }
}

// MARK: - Swarm Node

@Observable
final class SwarmNode {
 let id: UUID
 let task: Task
 var agent: Agent?
 var status: NodeStatus = .idle

 init(task: Task) {
 self.id = UUID()
 self.task = task
 }

 func start() {
 status = .running
 // In production: spawn actual agent process
 }

 func stop() {
 status = .idle
 }
}

enum NodeStatus: String {
 case idle
 case running
 case completed
 case failed
 case waiting
}
