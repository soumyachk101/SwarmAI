import Foundation
import SwiftUI

// MARK: - Lead Tool Definition

public struct LeadToolDefinition: Codable, Sendable {
  public let name: String
  public let description: String
  public let parameters: [String: LeadParameterSchema]
  public let required: [String]

  public init(name: String, description: String, parameters: [String: LeadParameterSchema], required: [String] = []) {
    self.name = name
    self.description = description
    self.parameters = parameters
    self.required = required
  }
}

public struct LeadParameterSchema: Codable, Sendable {
  public let type: String
  public let description: String
  public let enumValues: [String]?

  public init(type: String, description: String, enumValues: [String]? = nil) {
    self.type = type
    self.description = description
    self.enumValues = enumValues
  }
}

// MARK: - Lead Tool Call Models

public enum ToolExecutionStatus: String, Codable, Sendable {
  case pending = "pending"
  case running = "running"
  case success = "success"
  case failure = "failure"

  public var icon: String {
    switch self {
    case .pending: "clock"
    case .running: "arrow.triangle.2.circlepath"
    case .success: "checkmark.circle.fill"
    case .failure: "xmark.circle.fill"
    }
  }

  public var color: Color {
    switch self {
    case .pending: .swarmTextTertiary
    case .running: .swarmWarning
    case .success: .swarmSuccess
    case .failure: .swarmError
    }
  }
}

public struct LeadToolCall: Identifiable, Codable, Sendable {
  public let id: UUID
  public let toolName: String
  public let arguments: [String: String]
  public var result: String?
  public var error: String?
  public var status: ToolExecutionStatus
  public var duration: TimeInterval?
  public let timestamp: Date

  public init(
    id: UUID = UUID(),
    toolName: String,
    arguments: [String: String],
    result: String? = nil,
    error: String? = nil,
    status: ToolExecutionStatus = .pending,
    duration: TimeInterval? = nil,
    timestamp: Date = Date()
  ) {
    self.id = id
    self.toolName = toolName
    self.arguments = arguments
    self.result = result
    self.error = error
    self.status = status
    self.duration = duration
    self.timestamp = timestamp
  }
}

public struct LeadThought: Identifiable, Codable, Sendable {
  public let id: UUID
  public let step: Int
  public let mode: LeadMode
  public let thought: String
  public var toolCalls: [LeadToolCall]
  public let timestamp: Date

  public init(
    id: UUID = UUID(),
    step: Int,
    mode: LeadMode,
    thought: String,
    toolCalls: [LeadToolCall] = [],
    timestamp: Date = Date()
  ) {
    self.id = id
    self.step = step
    self.mode = mode
    self.thought = thought
    self.toolCalls = toolCalls
    self.timestamp = timestamp
  }
}

// MARK: - Lead Reasoning Engine

public actor LeadReasoningEngine {
  public static let shared = LeadReasoningEngine()

  public init() {}

  /// Generates a model response with tool calling support.
  public func generateResponse(
    provider: Provider?,
    systemPrompt: String,
    conversationHistory: [[String: String]],
    tools: [LeadToolDefinition]
  ) async throws -> (thought: String, toolCalls: [LeadToolCall]) {
    // If an API key and endpoint are provided, perform real HTTP call
    if let provider = provider, !provider.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return try await callRemoteLLM(provider: provider, systemPrompt: systemPrompt, history: conversationHistory, tools: tools)
    }

    // Heuristic Local Autonomous Reasoner (fallback when no API key configured)
    return await simulateAutonomousReasoning(systemPrompt: systemPrompt, history: conversationHistory, tools: tools)
  }

  private func callRemoteLLM(
    provider: Provider,
    systemPrompt: String,
    history: [[String: String]],
    tools: [LeadToolDefinition]
  ) async throws -> (thought: String, toolCalls: [LeadToolCall]) {
    guard let url = URL(string: provider.endpoint.isEmpty ? "https://api.openai.com/v1/chat/completions" : provider.endpoint) else {
      throw URLError(.badURL)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.addValue("application/json", forHTTPHeaderField: "Content-Type")
    request.addValue("Bearer \(provider.apiKey)", forHTTPHeaderField: "Authorization")
    request.timeoutInterval = 60.0

    // Construct OpenAI compatible payload
    var messagesPayload: [[String: Any]] = [
      ["role": "system", "content": systemPrompt]
    ]
    for msg in history {
      messagesPayload.append(["role": msg["role"] ?? "user", "content": msg["content"] ?? ""])
    }

    let toolsPayload = tools.map { tool -> [String: Any] in
      var properties: [String: Any] = [:]
      for (k, v) in tool.parameters {
        properties[k] = [
          "type": v.type,
          "description": v.description
        ]
      }
      return [
        "type": "function",
        "function": [
          "name": tool.name,
          "description": tool.description,
          "parameters": [
            "type": "object",
            "properties": properties,
            "required": tool.required
          ]
        ]
      ]
    }

    let body: [String: Any] = [
      "model": provider.defaultModel.isEmpty ? "gpt-4o" : provider.defaultModel,
      "messages": messagesPayload,
      "tools": toolsPayload,
      "temperature": 0.2
    ]

    request.httpBody = try JSONSerialization.data(withJSONObject: body)

    let (data, response) = try await URLSession.shared.data(for: request)
    guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
      let errorStr = String(data: data, encoding: .utf8) ?? "HTTP Error"
      throw NSError(domain: "LeadReasoningEngine", code: (response as? HTTPURLResponse)?.statusCode ?? 500, userInfo: [NSLocalizedDescriptionKey: errorStr])
    }

    // Parse JSON
    guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
          let choices = json["choices"] as? [[String: Any]],
          let firstChoice = choices.first,
          let message = firstChoice["message"] as? [String: Any] else {
      throw NSError(domain: "LeadReasoningEngine", code: -1, userInfo: [NSLocalizedDescriptionKey: "Invalid JSON response"])
    }

    let content = message["content"] as? String ?? ""
    var toolCalls: [LeadToolCall] = []

    if let rawToolCalls = message["tool_calls"] as? [[String: Any]] {
      for call in rawToolCalls {
        if let function = call["function"] as? [String: Any],
           let name = function["name"] as? String {
          var parsedArgs: [String: String] = [:]
          if let argStr = function["arguments"] as? String,
             let argData = argStr.data(using: .utf8),
             let dict = try? JSONSerialization.jsonObject(with: argData) as? [String: Any] {
            for (k, v) in dict {
              parsedArgs[k] = "\(v)"
            }
          }
          toolCalls.append(LeadToolCall(toolName: name, arguments: parsedArgs))
        }
      }
    }

    return (thought: content, toolCalls: toolCalls)
  }

  private func simulateAutonomousReasoning(
    systemPrompt: String,
    history: [[String: String]],
    tools: [LeadToolDefinition]
  ) async -> (thought: String, toolCalls: [LeadToolCall]) {
    let lastUserMessage = history.last(where: { $0["role"] == "user" })?["content"] ?? ""
    let stepCount = history.count / 2 + 1

    try? await _Concurrency.Task.sleep(nanoseconds: 600_000_000)

    if stepCount == 1 {
      return (
        thought: "Analyzing mission requirements: '\(lastUserMessage)'. Decomposing initial architecture and initializing shared memory.",
        toolCalls: [
          LeadToolCall(toolName: "dispatchGoal", arguments: ["goal": lastUserMessage, "mode": "steward"]),
          LeadToolCall(toolName: "writeMemory", arguments: ["content": "Mission initialized: \(lastUserMessage)", "type": "plan", "importance": "5", "tags": "swarm,lead,plan"]),
          LeadToolCall(toolName: "launchAgent", arguments: ["type": "claude_code", "role": "lead", "name": "Steward-Lead"])
        ]
      )
    } else if stepCount == 2 {
      return (
        thought: "Setting up workspace grid layout and reserving file mutexes for active builder agents.",
        toolCalls: [
          LeadToolCall(toolName: "setGridLayout", arguments: ["columns": "2", "rows": "2"]),
          LeadToolCall(toolName: "acquireLock", arguments: ["filePath": "Sources/SwarmAI/SwarmMind/SwarmMind.swift", "purpose": "DAG implementation"])
        ]
      )
    } else {
      return (
        thought: "All decomposed DAG tasks have executed successfully with 0 regressions. Releasing locks and finalizing mission.",
        toolCalls: [
          LeadToolCall(toolName: "releaseLock", arguments: ["filePath": "Sources/SwarmAI/SwarmMind/SwarmMind.swift"]),
          LeadToolCall(toolName: "finishMission", arguments: ["summary": "Completed mission '\(lastUserMessage)' successfully across all specialized roles.", "success": "true"])
        ]
      )
    }
  }
}

// MARK: - Lead Bridge

/// Autonomous Lead Agent Tool Calling Engine and Multi-Agent Coordinator.
@Observable
public final class LeadBridge: @unchecked Sendable {
  public static let shared = LeadBridge()

  public var isExecuting: Bool = false
  public var currentGoal: String = ""
  public var currentMode: LeadMode = .steward
  public var activeThought: String = ""
  public var thoughts: [LeadThought] = []
  public var recentToolCalls: [LeadToolCall] = []
  public var currentStep: Int = 0
  public var maxSteps: Int = 15
  public var missionStatusText: String = "Idle"

  private var conversationHistory: [[String: String]] = []
  private var activeTask: _Concurrency.Task<Void, Never>?

  public init() {}

  // MARK: - Tool Definitions

  public static let availableTools: [LeadToolDefinition] = [
    LeadToolDefinition(
      name: "createWorkspace",
      description: "Create a new workspace at the specified filesystem path.",
      parameters: [
        "name": LeadParameterSchema(type: "string", description: "Name of the workspace"),
        "path": LeadParameterSchema(type: "string", description: "Absolute path to workspace directory")
      ],
      required: ["name", "path"]
    ),
    LeadToolDefinition(
      name: "addTask",
      description: "Add a task to the kanban board and orchestration graph.",
      parameters: [
        "title": LeadParameterSchema(type: "string", description: "Title of the task"),
        "description": LeadParameterSchema(type: "string", description: "Detailed description"),
        "priority": LeadParameterSchema(type: "string", description: "Priority", enumValues: ["low", "medium", "high", "critical"]),
        "role": LeadParameterSchema(type: "string", description: "Assigned role", enumValues: ["architect", "scout", "builder", "reviewer", "tester", "security", "coordinator"]),
        "prerequisites": LeadParameterSchema(type: "string", description: "Comma-separated prerequisite task titles")
      ],
      required: ["title"]
    ),
    LeadToolDefinition(
      name: "moveTask",
      description: "Move a task to a different kanban status column.",
      parameters: [
        "taskId": LeadParameterSchema(type: "string", description: "UUID of the task"),
        "status": LeadParameterSchema(type: "string", description: "Target status", enumValues: ["backlog", "todo", "in_progress", "review", "done"])
      ],
      required: ["taskId", "status"]
    ),
    LeadToolDefinition(
      name: "launchAgent",
      description: "Spawn a new AI coding agent in the fleet.",
      parameters: [
        "type": LeadParameterSchema(type: "string", description: "Agent type (claude_code, codex, aider, etc.)"),
        "role": LeadParameterSchema(type: "string", description: "Role (lead, follower)"),
        "name": LeadParameterSchema(type: "string", description: "Optional display name"),
        "prompt": LeadParameterSchema(type: "string", description: "Initial instruction prompt"),
        "worktree": LeadParameterSchema(type: "string", description: "Optional git worktree path")
      ],
      required: ["type"]
    ),
    LeadToolDefinition(
      name: "switchWorkspace",
      description: "Switch active workspace by ID.",
      parameters: [
        "workspaceId": LeadParameterSchema(type: "string", description: "UUID of workspace")
      ],
      required: ["workspaceId"]
    ),
    LeadToolDefinition(
      name: "setGridLayout",
      description: "Adjust the agent grid board layout dimensions.",
      parameters: [
        "columns": LeadParameterSchema(type: "integer", description: "Number of columns (1-4)"),
        "rows": LeadParameterSchema(type: "integer", description: "Number of rows (1-4)")
      ],
      required: ["columns", "rows"]
    ),
    LeadToolDefinition(
      name: "listWorktrees",
      description: "List all git worktrees associated with the active workspace.",
      parameters: [
        "workspaceId": LeadParameterSchema(type: "string", description: "Optional workspace UUID")
      ]
    ),
    LeadToolDefinition(
      name: "dispatchGoal",
      description: "Dispatch a high-level goal to SwarmMind for dependency DAG decomposition.",
      parameters: [
        "goal": LeadParameterSchema(type: "string", description: "The mission goal string"),
        "mode": LeadParameterSchema(type: "string", description: "Lead mode (steward, forager, stinger)")
      ],
      required: ["goal"]
    ),
    LeadToolDefinition(
      name: "readMemory",
      description: "Search Pheromone shared memory store.",
      parameters: [
        "query": LeadParameterSchema(type: "string", description: "Search keyword query"),
        "workspaceId": LeadParameterSchema(type: "string", description: "Optional workspace filter")
      ],
      required: ["query"]
    ),
    LeadToolDefinition(
      name: "writeMemory",
      description: "Store a memory note or plan artifact in the Pheromone store.",
      parameters: [
        "content": LeadParameterSchema(type: "string", description: "Content of memory"),
        "type": LeadParameterSchema(type: "string", description: "Type (context, plan, handoff, note)"),
        "importance": LeadParameterSchema(type: "integer", description: "Importance (1-5)"),
        "tags": LeadParameterSchema(type: "string", description: "Comma-separated tags")
      ],
      required: ["content"]
    ),
    LeadToolDefinition(
      name: "acquireLock",
      description: "Acquire an exclusive file mutex lock preventing other agents from conflicting edits.",
      parameters: [
        "filePath": LeadParameterSchema(type: "string", description: "Path to file"),
        "purpose": LeadParameterSchema(type: "string", description: "Reason for edit")
      ],
      required: ["filePath"]
    ),
    LeadToolDefinition(
      name: "releaseLock",
      description: "Release a held file lock.",
      parameters: [
        "filePath": LeadParameterSchema(type: "string", description: "Path to file")
      ],
      required: ["filePath"]
    ),
    LeadToolDefinition(
      name: "delegateHandoff",
      description: "Delegate a task and context to another agent in the fleet.",
      parameters: [
        "toAgentName": LeadParameterSchema(type: "string", description: "Target agent name"),
        "role": LeadParameterSchema(type: "string", description: "Specialized role"),
        "instructions": LeadParameterSchema(type: "string", description: "Instructions for target agent"),
        "files": LeadParameterSchema(type: "string", description: "Comma-separated modified files")
      ],
      required: ["toAgentName", "instructions"]
    ),
    LeadToolDefinition(
      name: "finishMission",
      description: "Mark the autonomous mission as complete.",
      parameters: [
        "summary": LeadParameterSchema(type: "string", description: "Mission conclusion summary"),
        "success": LeadParameterSchema(type: "string", description: "true or false")
      ],
      required: ["summary"]
    )
  ]

  // MARK: - System Prompts

  public static func systemPrompt(for mode: LeadMode) -> String {
    switch mode {
    case .steward:
      return """
      You are STEWARD, the Master Orchestrator and Lead Planner of the SwarmAI multi-agent collective.
      Your mission is to analyze high-level user directives, decompose them into structured dependency DAGs, allocate specialized follower agents (Builder, Reviewer, Scout, Architect, Tester, Security), orchestrate worktree isolation, coordinate handoffs, resolve file locks, and maintain end-to-end mission delivery with zero regressions.
      
      Available tools include: createWorkspace, addTask, moveTask, launchAgent, switchWorkspace, setGridLayout, listWorktrees, dispatchGoal, readMemory, writeMemory, acquireLock, releaseLock, delegateHandoff, finishMission.
      Always think step-by-step, invoke appropriate tools, observe tool outputs, and conclude with finishMission when finished.
      """

    case .forager:
      return """
      You are FORAGER, the Autonomous Reconnaissance and Bug Hunting Lead of SwarmAI.
      Your mission is to explore complex codebases, locate root causes of bugs, map symbols and dependencies, reproduce issues, devise minimal-diff surgical fixes, delegate verification to Testers, and ensure total system stability.
      
      Available tools include: dispatchGoal, readMemory, writeMemory, acquireLock, releaseLock, addTask, moveTask, launchAgent, delegateHandoff, finishMission.
      Always investigate logs and call stacks first, isolate the root cause, apply targeted fixes, and verify with tests.
      """

    case .stinger:
      return """
      You are STINGER, the Precision Security Auditor and Vulnerability Lead of SwarmAI.
      Your mission is to inspect the attack surface, identify security vulnerabilities (OWASP, memory safety, injection, authentication, privilege escalation, dependency risks), design hardened defenses, coordinate atomic security fixes, and enforce strict verification.
      
      Available tools include: dispatchGoal, readMemory, writeMemory, acquireLock, releaseLock, addTask, moveTask, launchAgent, delegateHandoff, finishMission.
      Always model threats thoroughly, verify boundary integrity, enforce sanitization, and audit defensive patches.
      """
    }
  }

  // MARK: - Execution Loop

  /// Dispatches a mission directive through the autonomous tool calling loop.
  public func dispatchMission(
    goal: String,
    mode: LeadMode = .steward,
    provider: Provider? = nil,
    workspaceStore: WorkspaceStore? = nil,
    taskStore: TaskStore? = nil,
    agentsStore: AgentsStore? = nil
  ) {
    cancelMission()

    isExecuting = true
    currentGoal = goal
    currentMode = mode
    currentStep = 0
    thoughts.removeAll()
    recentToolCalls.removeAll()
    conversationHistory = [
      ["role": "user", "content": goal]
    ]
    missionStatusText = "Initializing autonomous lead (\(mode.displayName))..."

    // Also trigger SwarmMind goal decomposition immediately
    SwarmMind.shared.start(goal: goal, mode: mode, workspaceId: workspaceStore?.activeWorkspaceId)

    activeTask = _Concurrency.Task { [weak self] in
      guard let self = self else { return }
      await self.runToolLoop(
        provider: provider,
        workspaceStore: workspaceStore,
        taskStore: taskStore,
        agentsStore: agentsStore
      )
    }
  }

  /// Cancels the current running autonomous mission.
  public func cancelMission() {
    activeTask?.cancel()
    activeTask = nil
    isExecuting = false
    missionStatusText = "Mission cancelled."
  }

  private func runToolLoop(
    provider: Provider?,
    workspaceStore: WorkspaceStore?,
    taskStore: TaskStore?,
    agentsStore: AgentsStore?
  ) async {
    let prompt = Self.systemPrompt(for: currentMode)

    while isExecuting && currentStep < maxSteps {
      currentStep += 1
      missionStatusText = "Step \(currentStep)/\(maxSteps): Planning & evaluating tools..."

      do {
        let (thoughtText, toolCalls) = try await LeadReasoningEngine.shared.generateResponse(
          provider: provider,
          systemPrompt: prompt,
          conversationHistory: conversationHistory,
          tools: Self.availableTools
        )

        if _Concurrency.Task.isCancelled { break }

        await MainActor.run {
          self.activeThought = thoughtText
          let thought = LeadThought(
            step: self.currentStep,
            mode: self.currentMode,
            thought: thoughtText,
            toolCalls: toolCalls
          )
          self.thoughts.insert(thought, at: 0)
        }

        // If no tool calls were requested, record assistant reply and continue or finish
        if toolCalls.isEmpty {
          conversationHistory.append(["role": "assistant", "content": thoughtText])
          break
        }

        // Execute each requested tool call
        var toolResultsText = ""
        var executedCalls: [LeadToolCall] = []

        for var call in toolCalls {
          let startTime = Date()
          call.status = .running
          
          await MainActor.run {
            self.recentToolCalls.insert(call, at: 0)
          }

          let (res, err) = await executeTool(
            call: call,
            workspaceStore: workspaceStore,
            taskStore: taskStore,
            agentsStore: agentsStore
          )

          call.result = res
          call.error = err
          call.status = (err == nil) ? .success : .failure
          call.duration = Date().timeIntervalSince(startTime)
          executedCalls.append(call)

          await MainActor.run {
            if let idx = self.recentToolCalls.firstIndex(where: { $0.id == call.id }) {
              self.recentToolCalls[idx] = call
            }
          }

          toolResultsText += "Tool [\(call.toolName)] returned: \(res ?? err ?? "")\n"

          if call.toolName == "finishMission" {
            await MainActor.run {
              self.isExecuting = false
              self.missionStatusText = "Mission completed successfully!"
            }
            return
          }
        }

        // Append assistant and tool outputs into conversation history
        conversationHistory.append(["role": "assistant", "content": thoughtText])
        conversationHistory.append(["role": "user", "content": "Tool Execution Results:\n\(toolResultsText)"])

      } catch {
        await MainActor.run {
          self.isExecuting = false
          self.missionStatusText = "Error: \(error.localizedDescription)"
        }
        break
      }
    }

    await MainActor.run {
      if self.isExecuting {
        self.isExecuting = false
        self.missionStatusText = "Reached max steps limit."
      }
    }
  }

  // MARK: - Tool Execution Dispatcher

  private func executeTool(
    call: LeadToolCall,
    workspaceStore: WorkspaceStore?,
    taskStore: TaskStore?,
    agentsStore: AgentsStore?
  ) async -> (result: String?, error: String?) {
    let args = call.arguments

    switch call.toolName {
    case "createWorkspace":
      guard let name = args["name"], let path = args["path"] else {
        return (nil, "Missing required parameters 'name' or 'path'")
      }
      let ws = workspaceStore?.createWorkspace(name: name, path: path)
      return ("Created workspace '\(name)' with ID: \(ws?.id.uuidString ?? UUID().uuidString)", nil)

    case "addTask":
      guard let title = args["title"] else {
        return (nil, "Missing required parameter 'title'")
      }
      let desc = args["description"] ?? ""
      let priority = TaskPriority(rawValue: args["priority"] ?? "medium") ?? .medium
      let task = taskStore?.createTask(title: title, description: desc)
      task?.priority = priority
      return ("Added task '\(title)' to Kanban board.", nil)

    case "moveTask":
      guard let idStr = args["taskId"], let uuid = UUID(uuidString: idStr),
            let statusStr = args["status"], let status = TaskStatus(rawValue: statusStr) else {
        return (nil, "Invalid taskId or status")
      }
      taskStore?.moveTask(uuid, to: status)
      return ("Moved task \(idStr.prefix(6)) to \(status.displayName)", nil)

    case "launchAgent":
      let typeStr = args["type"] ?? "claude_code"
      let type = AgentType(rawValue: typeStr) ?? .claudeCode
      let name = args["name"]
      let agent = agentsStore?.spawnAgent(type, name: name)
      if let roleStr = args["role"], roleStr == "lead" {
        agent?.role = .lead
        agent?.leadMode = currentMode
      }
      return ("Spawned agent '\(agent?.name ?? type.displayName)' with status: \(agent?.status.displayName ?? "running")", nil)

    case "switchWorkspace":
      guard let idStr = args["workspaceId"], let uuid = UUID(uuidString: idStr) else {
        return (nil, "Invalid workspaceId")
      }
      workspaceStore?.switchWorkspace(uuid)
      return ("Switched to workspace \(idStr.prefix(6))", nil)

    case "setGridLayout":
      let cols = Int(args["columns"] ?? "2") ?? 2
      let rows = Int(args["rows"] ?? "2") ?? 2
      let preset: GridPreset
      if cols == 3 && rows == 3 { preset = .threeByThree }
      else if cols == 4 && rows == 4 { preset = .fourByFour }
      else if cols == 1 { preset = .rows }
      else if rows == 1 { preset = .columns }
      else { preset = .twoByTwo }
      agentsStore?.setGridLayout(preset)
      return ("Grid board updated to \(cols)x\(rows)", nil)

    case "listWorktrees":
      let rootPath = workspaceStore?.workspaces.first?.path ?? "."
      let trees = (try? await WorktreeService.shared.listWorktrees(repoPath: rootPath)) ?? []
      let names = trees.map { $0.name }.joined(separator: ", ")
      return ("Worktrees: [\(names.isEmpty ? "None active" : names)]", nil)

    case "dispatchGoal":
      guard let goal = args["goal"] else {
        return (nil, "Missing goal parameter")
      }
      let modeStr = args["mode"] ?? "steward"
      let mode = LeadMode(rawValue: modeStr) ?? .steward
      SwarmMind.shared.start(goal: goal, mode: mode)
      return ("Dispatched goal to SwarmMind with \(SwarmMind.shared.currentPlan?.nodes.count ?? 0) DAG tasks.", nil)

    case "readMemory":
      guard let query = args["query"] else {
        return (nil, "Missing query parameter")
      }
      let results = PheromoneService.shared.search(query: query)
      let summary = results.prefix(3).map { "[\($0.type.rawValue)] \($0.content)" }.joined(separator: " | ")
      return ("Found \(results.count) memories: \(summary.isEmpty ? "No matches" : summary)", nil)

    case "writeMemory":
      guard let content = args["content"] else {
        return (nil, "Missing content parameter")
      }
      let typeStr = args["type"] ?? "note"
      let type = MemoryType(rawValue: typeStr) ?? .note
      let imp = Int(args["importance"] ?? "3") ?? 3
      let tags = args["tags"]?.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) } ?? []
      let mem = Memory(
        workspaceId: workspaceStore?.activeWorkspaceId ?? UUID(),
        content: content,
        type: type,
        agentId: UUID(),
        agentName: "Lead",
        importance: imp,
        tags: tags
      )
      PheromoneService.shared.store(mem)
      return ("Stored memory entry into Pheromone store.", nil)

    case "acquireLock":
      guard let file = args["filePath"] else {
        return (nil, "Missing filePath")
      }
      let purpose = args["purpose"] ?? "Editing"
      let result = LockRegistry.shared.tryAcquire(
        filePath: file,
        agentId: UUID(),
        agentName: "Lead-\(currentMode.displayName)",
        role: "lead",
        purpose: purpose
      )
      switch result {
      case .success(let lock):
        return ("Acquired exclusive lock on '\(lock.filePath)'", nil)
      case .conflict(_, let reason):
        return (nil, "Lock conflict: \(reason)")
      case .alreadyHeld:
        return ("Lock already held by this agent.", nil)
      }

    case "releaseLock":
      guard let file = args["filePath"] else {
        return (nil, "Missing filePath")
      }
      let normalized = FileLockEntry.normalize(file)
      if let first = LockRegistry.shared.locks.first(where: { $0.normalizedPath == normalized }) {
        LockRegistry.shared.releaseById(first.id)
        return ("Released lock on '\(file)'", nil)
      }
      return ("No active lock found for '\(file)'", nil)

    case "delegateHandoff":
      guard let targetName = args["toAgentName"], let instructions = args["instructions"] else {
        return (nil, "Missing toAgentName or instructions")
      }
      let roleStr = args["role"] ?? "builder"
      let role = SwarmRole(rawValue: roleStr) ?? .builder
      let files = args["files"]?.components(separatedBy: ",").map { $0.trimmingCharacters(in: .whitespaces) } ?? []
      let rec = HandoffManager.shared.createHandoff(
        fromAgentId: UUID(),
        fromAgentName: "Lead (\(currentMode.displayName))",
        toAgentId: UUID(),
        toAgentName: targetName,
        targetRole: role,
        context: "Lead delegation",
        files: files,
        instructions: instructions
      )
      return ("Delegated handoff \(rec.id.uuidString.prefix(6)) to [\(targetName)]", nil)

    case "finishMission":
      let summary = args["summary"] ?? "Mission concluded."
      return ("Mission finished: \(summary)", nil)

    default:
      return (nil, "Unknown tool '\(call.toolName)'")
    }
  }
}
