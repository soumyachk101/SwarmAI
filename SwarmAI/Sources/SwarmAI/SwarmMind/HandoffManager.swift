import Foundation
import SwiftUI

// MARK: - Handoff Record

/// A comprehensive inter-agent handoff record carrying execution context,
/// modified file paths, instructions, and lifecycle status.
public struct HandoffRecord: Identifiable, Codable, Sendable, Hashable {
  public let id: UUID
  public var fromAgentId: UUID
  public var fromAgentName: String
  public var toAgentId: UUID
  public var toAgentName: String
  public var taskId: UUID?
  public var taskTitle: String?
  public var targetRole: SwarmRole
  public var status: HandoffStatus
  public var context: String
  public var files: [String]
  public var instructions: String
  public var artifacts: [String]
  public var rejectionReason: String?
  public var completionSummary: String?
  public var createdAt: Date
  public var updatedAt: Date
  public var completedAt: Date?

  public init(
    id: UUID = UUID(),
    fromAgentId: UUID,
    fromAgentName: String,
    toAgentId: UUID,
    toAgentName: String,
    taskId: UUID? = nil,
    taskTitle: String? = nil,
    targetRole: SwarmRole = .builder,
    status: HandoffStatus = .pending,
    context: String = "",
    files: [String] = [],
    instructions: String = "",
    artifacts: [String] = [],
    rejectionReason: String? = nil,
    completionSummary: String? = nil,
    createdAt: Date = Date(),
    updatedAt: Date = Date(),
    completedAt: Date? = nil
  ) {
    self.id = id
    self.fromAgentId = fromAgentId
    self.fromAgentName = fromAgentName
    self.toAgentId = toAgentId
    self.toAgentName = toAgentName
    self.taskId = taskId
    self.taskTitle = taskTitle
    self.targetRole = targetRole
    self.status = status
    self.context = context
    self.files = files
    self.instructions = instructions
    self.artifacts = artifacts
    self.rejectionReason = rejectionReason
    self.completionSummary = completionSummary
    self.createdAt = createdAt
    self.updatedAt = updatedAt
    self.completedAt = completedAt
  }

  /// Convert to lightweight Handoff model.
  public func toHandoff() -> Handoff {
    Handoff(
      id: id,
      fromAgentId: fromAgentId,
      toAgentId: toAgentId,
      status: status,
      context: context,
      files: files,
      instructions: instructions,
      createdAt: createdAt
    )
  }
}

// MARK: - Handoff Event

public struct HandoffEvent: Identifiable, Sendable {
  public let id = UUID()
  public let timestamp: Date = Date()
  public let handoffId: UUID
  public let action: Action
  public let message: String

  public enum Action: String, Sendable {
    case created = "Delegated"
    case accepted = "Accepted"
    case inProgress = "Started"
    case completed = "Completed"
    case rejected = "Rejected"
    case cancelled = "Cancelled"
  }
}

// MARK: - Handoff Manager

/// Manages multi-agent handoff lifecycles, context migrations, and real-time monitoring.
@Observable
public final class HandoffManager: @unchecked Sendable {
  public static let shared = HandoffManager()

  private let lock = NSLock()
  private var internalRecords: [HandoffRecord] = []

  public var handoffs: [HandoffRecord] = []
  public var recentEvents: [HandoffEvent] = []
  public static let maxEvents: Int = 100

  public init() {}

  // MARK: - Creation & Delegation

  /// Creates and registers a new handoff delegation.
  @discardableResult
  public func createHandoff(
    fromAgentId: UUID,
    fromAgentName: String,
    toAgentId: UUID,
    toAgentName: String,
    taskId: UUID? = nil,
    taskTitle: String? = nil,
    targetRole: SwarmRole = .builder,
    context: String,
    files: [String] = [],
    instructions: String
  ) -> HandoffRecord {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    let record = HandoffRecord(
      fromAgentId: fromAgentId,
      fromAgentName: fromAgentName,
      toAgentId: toAgentId,
      toAgentName: toAgentName,
      taskId: taskId,
      taskTitle: taskTitle,
      targetRole: targetRole,
      status: .pending,
      context: context,
      files: files,
      instructions: instructions,
      createdAt: Date(),
      updatedAt: Date()
    )

    internalRecords.insert(record, at: 0)
    recordEvent(
      handoffId: record.id,
      action: .created,
      message: "[\(fromAgentName)] delegated to [\(toAgentName)] (\(targetRole.displayName)): '\(instructions.prefix(40))...'"
    )

    return record
  }

  /// Automatically delegates work to an appropriate agent in the pool matching targetRole.
  public func autoDelegate(
    fromAgentId: UUID,
    fromAgentName: String,
    availableAgents: [Agent],
    targetRole: SwarmRole,
    taskId: UUID? = nil,
    taskTitle: String? = nil,
    context: String,
    files: [String] = [],
    instructions: String
  ) -> HandoffRecord? {
    // Find candidate agent matching role
    let candidate = availableAgents.first(where: {
      $0.id != fromAgentId && $0.status != .error && $0.status != .terminating
    })

    guard let target = candidate else { return nil }

    return createHandoff(
      fromAgentId: fromAgentId,
      fromAgentName: fromAgentName,
      toAgentId: target.id,
      toAgentName: target.name,
      taskId: taskId,
      taskTitle: taskTitle,
      targetRole: targetRole,
      context: context,
      files: files,
      instructions: instructions
    )
  }

  // MARK: - State Transitions

  /// Accept a pending handoff.
  @discardableResult
  public func acceptHandoff(id: UUID) -> Bool {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    if let index = internalRecords.firstIndex(where: { $0.id == id && $0.status == .pending }) {
      internalRecords[index].status = .accepted
      internalRecords[index].updatedAt = Date()
      let rec = internalRecords[index]
      recordEvent(handoffId: id, action: .accepted, message: "[\(rec.toAgentName)] accepted handoff from [\(rec.fromAgentName)]")
      return true
    }
    return false
  }

  /// Mark a handoff as actively in progress.
  @discardableResult
  public func startHandoffWork(id: UUID) -> Bool {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    if let index = internalRecords.firstIndex(where: { $0.id == id }) {
      internalRecords[index].status = .accepted
      internalRecords[index].updatedAt = Date()
      let rec = internalRecords[index]
      recordEvent(handoffId: id, action: .inProgress, message: "[\(rec.toAgentName)] began executing handoff instructions")
      return true
    }
    return false
  }

  /// Complete a handoff with final output summary and artifacts.
  @discardableResult
  public func completeHandoff(id: UUID, summary: String, artifacts: [String] = []) -> Bool {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    if let index = internalRecords.firstIndex(where: { $0.id == id }) {
      internalRecords[index].status = .completed
      internalRecords[index].completionSummary = summary
      internalRecords[index].artifacts.append(contentsOf: artifacts)
      internalRecords[index].completedAt = Date()
      internalRecords[index].updatedAt = Date()
      let rec = internalRecords[index]
      recordEvent(handoffId: id, action: .completed, message: "[\(rec.toAgentName)] finished handoff successfully: \(summary.prefix(50))")
      return true
    }
    return false
  }

  /// Reject a handoff with a specific reason.
  @discardableResult
  public func rejectHandoff(id: UUID, reason: String) -> Bool {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    if let index = internalRecords.firstIndex(where: { $0.id == id }) {
      internalRecords[index].status = .rejected
      internalRecords[index].rejectionReason = reason
      internalRecords[index].completedAt = Date()
      internalRecords[index].updatedAt = Date()
      let rec = internalRecords[index]
      recordEvent(handoffId: id, action: .rejected, message: "[\(rec.toAgentName)] rejected handoff: \(reason)")
      return true
    }
    return false
  }

  // MARK: - Query

  public func pendingHandoffs(for agentId: UUID) -> [HandoffRecord] {
    lock.lock()
    defer { lock.unlock() }
    return internalRecords.filter { $0.toAgentId == agentId && $0.status == .pending }
  }

  public var activeHandoffs: [HandoffRecord] {
    lock.lock()
    defer { lock.unlock() }
    return internalRecords.filter { $0.status == .pending || $0.status == .accepted }
  }

  public var history: [HandoffRecord] {
    lock.lock()
    defer { lock.unlock() }
    return internalRecords
  }

  // MARK: - Internal Helpers

  private func recordEvent(handoffId: UUID, action: HandoffEvent.Action, message: String) {
    let event = HandoffEvent(handoffId: handoffId, action: action, message: message)
    recentEvents.insert(event, at: 0)
    if recentEvents.count > Self.maxEvents {
      recentEvents.removeLast(recentEvents.count - Self.maxEvents)
    }
  }

  private func syncPublishedState() {
    let records = self.internalRecords
    DispatchQueue.main.async {
      self.handoffs = records
    }
  }
}
