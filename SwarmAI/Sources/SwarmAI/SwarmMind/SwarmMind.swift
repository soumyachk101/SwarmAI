import SwiftUI
import Foundation

// MARK: - Swarm Specialized Roles

/// Specialized swarm roles participating in the orchestration DAG.
@frozen
public enum SwarmRole: String, Codable, Sendable, CaseIterable, Identifiable {
  public var id: String { rawValue }
  
  case architect = "architect"
  case scout = "scout"
  case builder = "builder"
  case reviewer = "reviewer"
  case tester = "tester"
  case security = "security"
  case coordinator = "coordinator"

  /// Human-readable display name.
  public var displayName: String {
    switch self {
    case .architect: "Architect"
    case .scout: "Scout"
    case .builder: "Builder"
    case .reviewer: "Reviewer"
    case .tester: "Tester"
    case .security: "Security"
    case .coordinator: "Coordinator"
    }
  }

  /// SF Symbol icon.
  public var icon: String {
    switch self {
    case .architect: "compass.drawing"
    case .scout: "magnifyingglass"
    case .builder: "hammer.fill"
    case .reviewer: "eye.fill"
    case .tester: "testtube.2"
    case .security: "shield.checkered"
    case .coordinator: "point.3.filled.connected.trianglepath.dotted"
    }
  }

  /// The badge color associated with this role.
  public var color: Color {
    switch self {
    case .architect: .swarmGold
    case .scout: .swarmInfo
    case .builder: .swarmWarning
    case .reviewer: .swarmSuccess
    case .tester: Color(hex: "#9B59B6") ?? .purple
    case .security: .swarmError
    case .coordinator: Color(hex: "#00D2D3") ?? .cyan
    }
  }

  /// Recommended default agent type for this role.
  public var defaultAgentType: AgentType {
    switch self {
    case .architect: .claudeCode
    case .scout: .deepSeek
    case .builder: .claudeCode
    case .reviewer: .codex
    case .tester: .aider
    case .security: .cursor
    case .coordinator: .claudeCode
    }
  }
}

// MARK: - DAG Node Status

@frozen
public enum SwarmDAGNodeStatus: String, Codable, Sendable, CaseIterable {
  case blocked = "blocked"
  case ready = "ready"
  case inProgress = "in_progress"
  case review = "review"
  case completed = "completed"
  case failed = "failed"

  public var displayName: String {
    switch self {
    case .blocked: "Blocked"
    case .ready: "Ready"
    case .inProgress: "In Progress"
    case .review: "Review"
    case .completed: "Done"
    case .failed: "Failed"
    }
  }

  public var icon: String {
    switch self {
    case .blocked: "lock.circle.fill"
    case .ready: "play.circle.fill"
    case .inProgress: "arrow.triangle.2.circlepath.circle.fill"
    case .review: "eye.circle.fill"
    case .completed: "checkmark.circle.fill"
    case .failed: "xmark.octagon.fill"
    }
  }

  public var color: Color {
    switch self {
    case .blocked: .swarmTextTertiary
    case .ready: .swarmInfo
    case .inProgress: .swarmWarning
    case .review: .swarmGold
    case .completed: .swarmSuccess
    case .failed: .swarmError
    }
  }

  public var kanbanStatus: TaskStatus {
    switch self {
    case .blocked: .backlog
    case .ready: .todo
    case .inProgress: .inProgress
    case .review: .review
    case .completed: .done
    case .failed: .todo
    }
  }
}

// MARK: - Swarm DAG Node

/// A single discrete unit of work within a dependency DAG plan.
public struct SwarmDAGNode: Identifiable, Codable, Sendable, Hashable {
  public let id: UUID
  public var title: String
  public var description: String
  public var role: SwarmRole
  public var priority: TaskPriority
  /// IDs of prerequisite tasks that must complete before this node becomes ready.
  public var prerequisites: [UUID]
  public var status: SwarmDAGNodeStatus
  public var assignedAgentId: UUID?
  public var assignedAgentName: String?
  public var estimatedEffort: String
  public var artifacts: [String]
  public var errorReason: String?
  public var executionLogs: [String]
  public var createdAt: Date
  public var startedAt: Date?
  public var completedAt: Date?

  public init(
    id: UUID = UUID(),
    title: String,
    description: String = "",
    role: SwarmRole = .builder,
    priority: TaskPriority = .medium,
    prerequisites: [UUID] = [],
    status: SwarmDAGNodeStatus = .blocked,
    assignedAgentId: UUID? = nil,
    assignedAgentName: String? = nil,
    estimatedEffort: String = "medium",
    artifacts: [String] = [],
    errorReason: String? = nil,
    executionLogs: [String] = [],
    createdAt: Date = Date(),
    startedAt: Date? = nil,
    completedAt: Date? = nil
  ) {
    self.id = id
    self.title = title
    self.description = description
    self.role = role
    self.priority = priority
    self.prerequisites = prerequisites
    self.status = status
    self.assignedAgentId = assignedAgentId
    self.assignedAgentName = assignedAgentName
    self.estimatedEffort = estimatedEffort
    self.artifacts = artifacts
    self.errorReason = errorReason
    self.executionLogs = executionLogs
    self.createdAt = createdAt
    self.startedAt = startedAt
    self.completedAt = completedAt
  }

  public var isReady: Bool {
    status == .ready
  }

  public var isFinished: Bool {
    status == .completed || status == .failed
  }
}

// MARK: - Swarm DAG Plan

public struct SwarmDAGPlan: Identifiable, Codable, Sendable {
  public let id: UUID
  public var goal: String
  public var leadMode: LeadMode
  public var workspaceId: UUID?
  public var nodes: [SwarmDAGNode]
  public var createdAt: Date
  public var completedAt: Date?
  public var isCompleted: Bool {
    !nodes.isEmpty && nodes.allSatisfy { $0.status == .completed }
  }

  public var progress: Double {
    guard !nodes.isEmpty else { return 0.0 }
    let done = nodes.filter { $0.status == .completed }.count
    return Double(done) / Double(nodes.count)
  }

  public init(
    id: UUID = UUID(),
    goal: String,
    leadMode: LeadMode = .steward,
    workspaceId: UUID? = nil,
    nodes: [SwarmDAGNode] = [],
    createdAt: Date = Date(),
    completedAt: Date? = nil
  ) {
    self.id = id
    self.goal = goal
    self.leadMode = leadMode
    self.workspaceId = workspaceId
    self.nodes = nodes
    self.createdAt = createdAt
    self.completedAt = completedAt
  }

  /// Returns node with specific ID.
  public func node(for id: UUID) -> SwarmDAGNode? {
    nodes.first { $0.id == id }
  }

  /// Returns nodes that currently have all prerequisites completed and are ready to execute.
  public func calculateReadyNodes() -> [SwarmDAGNode] {
    let completedIds = Set(nodes.filter { $0.status == .completed }.map { $0.id })
    return nodes.filter { node in
      guard node.status == .blocked || node.status == .ready else { return false }
      let prereqsMet = node.prerequisites.allSatisfy { completedIds.contains($0) }
      return prereqsMet
    }
  }

  /// Topological sort of nodes with cycle detection.
  public func topologicalSort() -> [SwarmDAGNode]? {
    var inDegree: [UUID: Int] = [:]
    var adj: [UUID: [UUID]] = [:]
    let nodeMap = Dictionary(uniqueKeysWithValues: nodes.map { ($0.id, $0) })

    for node in nodes {
      inDegree[node.id] = node.prerequisites.count
      for prereq in node.prerequisites {
        adj[prereq, default: []].append(node.id)
      }
    }

    var queue: [UUID] = nodes.filter { ($0.prerequisites.isEmpty) }.map { $0.id }
    var sorted: [SwarmDAGNode] = []

    while !queue.isEmpty {
      let currentId = queue.removeFirst()
      if let node = nodeMap[currentId] {
        sorted.append(node)
      }
      for neighbor in adj[currentId, default: []] {
        inDegree[neighbor, default: 0] -= 1
        if inDegree[neighbor] == 0 {
          queue.append(neighbor)
        }
      }
    }

    return sorted.count == nodes.count ? sorted : nil
  }
}

// MARK: - Swarm Event

public struct SwarmEvent: Identifiable, Sendable {
  public let id = UUID()
  public let timestamp: Date = Date()
  public let category: String
  public let message: String
  public let agentName: String?
  public let taskId: UUID?
}

// MARK: - SwarmMind Orchestrator Core

@Observable
public final class SwarmMind: @unchecked Sendable {
  public static let shared = SwarmMind()

  public var isRunning: Bool = false
  public var isPaused: Bool = false
  public var currentGoal: String?
  public var currentPlan: SwarmDAGPlan?
  public var executionLogs: [SwarmEvent] = []
  public var handoffs: [Handoff] = []

  private let stateLock = NSLock()

  public init() {}

  // MARK: - Mission Lifecycle

  /// Start a mission goal: decomposes the goal into a structured DAG plan and begins execution.
  public func start(goal: String, mode: LeadMode = .steward, workspaceId: UUID? = nil) {
    stateLock.lock()
    isRunning = true
    isPaused = false
    currentGoal = goal
    
    // Decompose the goal into structured DAG
    var plan = decompose(goal: goal, mode: mode, workspaceId: workspaceId)
    
    // Update initial ready states
    let readyIds = Set(plan.calculateReadyNodes().map { $0.id })
    for i in 0..<plan.nodes.count {
      if readyIds.contains(plan.nodes[i].id) {
        plan.nodes[i].status = .ready
      }
    }
    self.currentPlan = plan
    stateLock.unlock()

    logEvent(category: "Orchestrator", message: "Dispatched mission: '\(goal)' with \(plan.nodes.count) decomposed DAG tasks.", agentName: "Lead (\(mode.displayName))")

    // Synchronize tasks to Kanban store if available
    syncPlanToTaskStore(plan)

    // Trigger initial execution step
    stepExecution()
  }

  /// Pause execution of the current mission.
  public func pause() {
    stateLock.lock()
    isPaused = true
    stateLock.unlock()
    logEvent(category: "Orchestrator", message: "Mission execution paused.")
  }

  /// Resume execution of the current mission.
  public func resume() {
    stateLock.lock()
    isPaused = false
    stateLock.unlock()
    logEvent(category: "Orchestrator", message: "Mission execution resumed.")
    stepExecution()
  }

  /// Stop and reset the current mission.
  public func stop() {
    stateLock.lock()
    isRunning = false
    isPaused = false
    currentGoal = nil
    currentPlan = nil
    stateLock.unlock()
    logEvent(category: "Orchestrator", message: "Mission stopped and reset.")
  }

  // MARK: - Goal Decomposition Engine

  /// Decomposes a high-level goal into a multi-tier dependency DAG based on the lead mode and goal content.
  public func decompose(goal: String, mode: LeadMode = .steward, workspaceId: UUID? = nil) -> SwarmDAGPlan {
    var nodes: [SwarmDAGNode] = []

    switch mode {
    case .steward:
      // Multi-phase structured engineering workflow
      let archId = UUID()
      let scoutId = UUID()
      let builderCoreId = UUID()
      let builderUiId = UUID()
      let testerId = UUID()
      let secId = UUID()
      let reviewId = UUID()
      let coordId = UUID()

      nodes = [
        SwarmDAGNode(
          id: archId,
          title: "System Architecture & Schema Design",
          description: "Analyze goal requirements, define interface contracts, model schemas, and dependency flow for '\(goal)'.",
          role: .architect,
          priority: .critical,
          prerequisites: [],
          status: .ready,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: scoutId,
          title: "Codebase Reconnaissance & Symbol Indexing",
          description: "Inspect project directory, locate relevant files, verify dependencies, and prepare context for implementation.",
          role: .scout,
          priority: .high,
          prerequisites: [archId],
          status: .blocked,
          estimatedEffort: "low"
        ),
        SwarmDAGNode(
          id: builderCoreId,
          title: "Core Service & Engine Implementation",
          description: "Implement backend logic, services, state machines, and data processing routines according to architectural blueprint.",
          role: .builder,
          priority: .high,
          prerequisites: [scoutId],
          status: .blocked,
          estimatedEffort: "high"
        ),
        SwarmDAGNode(
          id: builderUiId,
          title: "UI / View Integration & Interactions",
          description: "Construct user-facing interfaces, HUD components, real-time reactive bindings, and smooth transitions.",
          role: .builder,
          priority: .medium,
          prerequisites: [builderCoreId],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: testerId,
          title: "Test Suite & Regression Verification",
          description: "Write and execute unit tests, mock edge cases, assert data integrity, and verify zero regression.",
          role: .tester,
          priority: .high,
          prerequisites: [builderUiId],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: secId,
          title: "Security & Concurrency Audit",
          description: "Inspect memory safety, thread concurrency, input validation, file lock hygiene, and access controls.",
          role: .security,
          priority: .high,
          prerequisites: [testerId],
          status: .blocked,
          estimatedEffort: "low"
        ),
        SwarmDAGNode(
          id: reviewId,
          title: "Comprehensive Code Review",
          description: "Perform peer inspection against code style, Swift 6 concurrency compliance, and API consistency.",
          role: .reviewer,
          priority: .medium,
          prerequisites: [secId],
          status: .blocked,
          estimatedEffort: "low"
        ),
        SwarmDAGNode(
          id: coordId,
          title: "Release Summary & Pheromone Sync",
          description: "Synthesize mission deliverables, record final memories into Pheromone store, and summarize outcomes.",
          role: .coordinator,
          priority: .low,
          prerequisites: [reviewId],
          status: .blocked,
          estimatedEffort: "low"
        )
      ]

    case .forager:
      // Bug hunting and rapid root-cause isolation
      let scout1 = UUID()
      let scout2 = UUID()
      let builder = UUID()
      let tester = UUID()
      let reviewer = UUID()

      nodes = [
        SwarmDAGNode(
          id: scout1,
          title: "Trace Logs & Reproduce Defect",
          description: "Search logs, error traces, and crash dumps to reproduce the issue in '\(goal)'.",
          role: .scout,
          priority: .critical,
          prerequisites: [],
          status: .ready,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: scout2,
          title: "Root Cause & Call Stack Analysis",
          description: "Isolate precise lines of code and state permutations triggering the failure.",
          role: .scout,
          priority: .high,
          prerequisites: [scout1],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: builder,
          title: "Surgical Bug Fix Implementation",
          description: "Apply minimal-diff patch addressing the defect without side effects.",
          role: .builder,
          priority: .high,
          prerequisites: [scout2],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: tester,
          title: "Regression & Reproduction Testing",
          description: "Run automated tests to assert the bug is eradicated and no new failures are introduced.",
          role: .tester,
          priority: .high,
          prerequisites: [builder],
          status: .blocked,
          estimatedEffort: "low"
        ),
        SwarmDAGNode(
          id: reviewer,
          title: "Verification & Patch Sign-off",
          description: "Review fix quality and approve merge.",
          role: .reviewer,
          priority: .medium,
          prerequisites: [tester],
          status: .blocked,
          estimatedEffort: "low"
        )
      ]

    case .stinger:
      // Security and vulnerability audit
      let secThreat = UUID()
      let scoutCve = UUID()
      let secExploit = UUID()
      let builderPatch = UUID()
      let testerSec = UUID()
      let reviewSec = UUID()

      nodes = [
        SwarmDAGNode(
          id: secThreat,
          title: "Threat Modeling & Attack Surface Audit",
          description: "Map endpoints, data inputs, and permission boundaries related to '\(goal)'.",
          role: .security,
          priority: .critical,
          prerequisites: [],
          status: .ready,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: scoutCve,
          title: "Dependency & Vulnerability Scanning",
          description: "Audit third-party dependencies, package versions, and static security vulnerabilities.",
          role: .scout,
          priority: .high,
          prerequisites: [secThreat],
          status: .blocked,
          estimatedEffort: "low"
        ),
        SwarmDAGNode(
          id: secExploit,
          title: "Vulnerability Verification & Boundary Probing",
          description: "Probe identified security boundaries to confirm risk severity and attack vectors.",
          role: .security,
          priority: .critical,
          prerequisites: [scoutCve],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: builderPatch,
          title: "Hardening & Defensive Patch Implementation",
          description: "Implement input sanitization, hardened auth checks, and safe concurrency guards.",
          role: .builder,
          priority: .high,
          prerequisites: [secExploit],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: testerSec,
          title: "Security Regression & Fuzz Testing",
          description: "Execute security assertion suite and fuzz tests to guarantee defensive efficacy.",
          role: .tester,
          priority: .high,
          prerequisites: [builderPatch],
          status: .blocked,
          estimatedEffort: "medium"
        ),
        SwarmDAGNode(
          id: reviewSec,
          title: "Security Audit Sign-Off",
          description: "Verify hardening compliance and sign off on security audit.",
          role: .reviewer,
          priority: .high,
          prerequisites: [testerSec],
          status: .blocked,
          estimatedEffort: "low"
        )
      ]
    }

    return SwarmDAGPlan(goal: goal, leadMode: mode, workspaceId: workspaceId, nodes: nodes)
  }

  // MARK: - Orchestration Step Execution

  /// Evaluates the DAG, promotes unblocked nodes to ready, and dispatches them.
  public func stepExecution() {
    guard isRunning, !isPaused, var plan = currentPlan else { return }

    stateLock.lock()
    let completedIds = Set(plan.nodes.filter { $0.status == .completed }.map { $0.id })

    // Advance ready nodes
    for i in 0..<plan.nodes.count {
      if plan.nodes[i].status == .blocked {
        let prereqsMet = plan.nodes[i].prerequisites.allSatisfy { completedIds.contains($0) }
        if prereqsMet {
          plan.nodes[i].status = .ready
          logEvent(
            category: "DAG",
            message: "Task '\(plan.nodes[i].title)' is now ready for execution.",
            agentName: plan.nodes[i].role.displayName,
            taskId: plan.nodes[i].id
          )
        }
      }
    }

    // Check if entire mission is complete
    if plan.isCompleted {
      isRunning = false
      plan.completedAt = Date()
      self.currentPlan = plan
      stateLock.unlock()
      logEvent(category: "Orchestrator", message: "Mission '\(plan.goal)' successfully completed 100% of DAG tasks!")
      return
    }

    self.currentPlan = plan
    stateLock.unlock()

    // Dispatch ready nodes to matching agents
    let readyNodes = plan.nodes.filter { $0.status == .ready && $0.assignedAgentId == nil }
    for node in readyNodes {
      dispatchNode(node)
    }
  }

  /// Dispatch a single DAG node for active execution.
  private func dispatchNode(_ node: SwarmDAGNode) {
    guard var plan = currentPlan else { return }

    // Mark in progress
    if let index = plan.nodes.firstIndex(where: { $0.id == node.id }) {
      plan.nodes[index].status = .inProgress
      plan.nodes[index].startedAt = Date()
      self.currentPlan = plan
    }

    logEvent(
      category: "Dispatch",
      message: "Executing [\(node.role.displayName)]: '\(node.title)'",
      agentName: node.role.displayName,
      taskId: node.id
    )

    // Simulate / execute task progress asynchronously
    DispatchQueue.global(qos: .userInitiated).asyncAfter(deadline: .now() + 2.0) { [weak self] in
      guard let self = self else { return }
      self.completeNode(id: node.id, artifacts: ["Completed \(node.title)"])
    }
  }

  /// Mark a DAG node as completed with generated artifacts.
  public func completeNode(id: UUID, artifacts: [String] = []) {
    stateLock.lock()
    guard var plan = currentPlan,
          let index = plan.nodes.firstIndex(where: { $0.id == id }) else {
      stateLock.unlock()
      return
    }

    plan.nodes[index].status = .completed
    plan.nodes[index].completedAt = Date()
    plan.nodes[index].artifacts.append(contentsOf: artifacts)
    let nodeTitle = plan.nodes[index].title
    let role = plan.nodes[index].role
    self.currentPlan = plan
    stateLock.unlock()

    logEvent(
      category: "Task",
      message: "Completed task [\(role.displayName)]: '\(nodeTitle)'",
      agentName: role.displayName,
      taskId: id
    )

    // Continue DAG execution loop
    DispatchQueue.main.async { [weak self] in
      self?.stepExecution()
    }
  }

  /// Mark a DAG node as failed with an error reason.
  public func failNode(id: UUID, error: String) {
    stateLock.lock()
    guard var plan = currentPlan,
          let index = plan.nodes.firstIndex(where: { $0.id == id }) else {
      stateLock.unlock()
      return
    }

    plan.nodes[index].status = .failed
    plan.nodes[index].errorReason = error
    let nodeTitle = plan.nodes[index].title
    self.currentPlan = plan
    stateLock.unlock()

    logEvent(
      category: "Error",
      message: "Task failed: '\(nodeTitle)' - \(error)",
      taskId: id
    )
  }

  // MARK: - Handoff Support

  public func sendHandoff(from: UUID, to: UUID, context: String, files: [String]) {
    let handoff = Handoff(
      fromAgentId: from,
      toAgentId: to,
      status: .pending,
      context: context,
      files: files,
      instructions: ""
    )
    handoffs.append(handoff)
    logEvent(category: "Handoff", message: "Handoff initiated between agents.")
  }

  public func approveHandoff(_ id: UUID) {
    if let index = handoffs.firstIndex(where: { $0.id == id }) {
      handoffs[index].status = .completed
      logEvent(category: "Handoff", message: "Handoff \(id.uuidString.prefix(6)) approved.")
    }
  }

  public func rejectHandoff(_ id: UUID) {
    if let index = handoffs.firstIndex(where: { $0.id == id }) {
      handoffs[index].status = .rejected
      logEvent(category: "Handoff", message: "Handoff \(id.uuidString.prefix(6)) rejected.")
    }
  }

  // MARK: - Internal Utilities

  private func logEvent(category: String, message: String, agentName: String? = nil, taskId: UUID? = nil) {
    let event = SwarmEvent(category: category, message: message, agentName: agentName, taskId: taskId)
    DispatchQueue.main.async {
      self.executionLogs.insert(event, at: 0)
      if self.executionLogs.count > 200 {
        self.executionLogs.removeLast(self.executionLogs.count - 200)
      }
    }
  }

  private func syncPlanToTaskStore(_ plan: SwarmDAGPlan) {
    // Synchronize to TaskStore if needed
  }
}

// MARK: - Swarm Node Helper

@Observable
public final class SwarmNode: Identifiable {
  public let id: UUID
  public let task: Task
  public var agent: Agent?
  public var status: NodeStatus = .idle

  public init(task: Task) {
    self.id = UUID()
    self.task = task
  }

  public func start() {
    status = .running
  }

  public func stop() {
    status = .idle
  }
}

@frozen
public enum NodeStatus: String, Codable, Sendable {
  case idle
  case running
  case completed
  case failed
  case waiting
}
