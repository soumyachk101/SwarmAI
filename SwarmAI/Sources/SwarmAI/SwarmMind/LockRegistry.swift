import Foundation
import SwiftUI

// MARK: - File Lock Type

/// The type of lock held on a file or directory.
@frozen
public enum FileLockType: String, Codable, Sendable, CaseIterable {
  /// Exclusive write lock: Only one agent may hold this lock. No other read or write locks permitted.
  case exclusive = "exclusive"
  /// Shared read lock: Multiple agents may hold read locks simultaneously; blocked by exclusive write lock.
  case sharedRead = "shared_read"

  public var displayName: String {
    switch self {
    case .exclusive: "Exclusive (Write)"
    case .sharedRead: "Shared (Read)"
    }
  }

  public var icon: String {
    switch self {
    case .exclusive: "lock.fill"
    case .sharedRead: "lock.open.fill"
    }
  }
}

// MARK: - File Lock Entry

/// Represents an active lock on a specific file path by an agent.
public struct FileLockEntry: Identifiable, Codable, Sendable, Hashable {
  public let id: UUID
  public var filePath: String
  public var normalizedPath: String
  public var holderAgentId: UUID
  public var holderAgentName: String
  public var holderRole: String
  public var lockType: FileLockType
  public var purpose: String
  public var acquiredAt: Date
  public var expiresAt: Date?

  public init(
    id: UUID = UUID(),
    filePath: String,
    holderAgentId: UUID,
    holderAgentName: String,
    holderRole: String = "builder",
    lockType: FileLockType = .exclusive,
    purpose: String = "",
    acquiredAt: Date = Date(),
    expiresAt: Date? = nil
  ) {
    self.id = id
    self.filePath = filePath
    self.normalizedPath = Self.normalize(filePath)
    self.holderAgentId = holderAgentId
    self.holderAgentName = holderAgentName
    self.holderRole = holderRole
    self.lockType = lockType
    self.purpose = purpose
    self.acquiredAt = acquiredAt
    self.expiresAt = expiresAt
  }

  /// Normalizes a file path for consistent matching across agents.
  public static func normalize(_ path: String) -> String {
    var clean = path.trimmingCharacters(in: .whitespacesAndNewlines)
    if clean.hasPrefix("file://") {
      clean = String(clean.dropFirst(7))
    }
    let url = URL(fileURLWithPath: clean).standardized
    return url.path
  }

  /// Whether the lock has passed its expiration timestamp.
  public var isExpired: Bool {
    guard let expiresAt = expiresAt else { return false }
    return Date() > expiresAt
  }

  /// Remaining valid duration in seconds.
  public var timeRemaining: TimeInterval? {
    guard let expiresAt = expiresAt else { return nil }
    return max(0, expiresAt.timeIntervalSinceNow)
  }
}

// MARK: - Lock Acquisition Result

public enum LockAcquisitionResult: Sendable {
  case success(FileLockEntry)
  case conflict(existingLocks: [FileLockEntry], reason: String)
  case alreadyHeld(FileLockEntry)
}

// MARK: - Lock Event

public struct LockEvent: Identifiable, Sendable {
  public let id = UUID()
  public let timestamp: Date = Date()
  public let filePath: String
  public let agentName: String
  public let action: Action
  public let lockType: FileLockType

  public enum Action: String, Sendable {
    case acquired = "Acquired"
    case released = "Released"
    case conflict = "Conflict"
    case expired = "Expired"
    case forceUnlocked = "Force Unlocked"
  }
}

// MARK: - Lock Registry

/// Thread-safe distributed file lock mutex registry preventing concurrent
/// agents from modifying the same file path simultaneously.
@Observable
public final class LockRegistry: @unchecked Sendable {
  public static let shared = LockRegistry()

  private let lock = NSLock()
  private var internalLocks: [FileLockEntry] = []
  
  public var locks: [FileLockEntry] = []
  public var recentEvents: [LockEvent] = []
  public static let maxEvents: Int = 100

  public init() {}

  // MARK: - Acquisition

  /// Attempt to acquire a lock on a file path.
  @discardableResult
  public func tryAcquire(
    filePath: String,
    agentId: UUID,
    agentName: String,
    role: String = "builder",
    purpose: String = "",
    lockType: FileLockType = .exclusive,
    ttlSeconds: TimeInterval? = 300
  ) -> LockAcquisitionResult {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    cleanExpiredInternalLocks()

    let normalized = FileLockEntry.normalize(filePath)

    // Check if same agent already holds the lock
    if let existing = internalLocks.first(where: {
      $0.normalizedPath == normalized && $0.holderAgentId == agentId
    }) {
      return .alreadyHeld(existing)
    }

    // Check for conflicting locks
    let conflicts = internalLocks.filter { entry in
      guard entry.normalizedPath == normalized else { return false }
      if entry.lockType == .exclusive || lockType == .exclusive {
        return true
      }
      return false
    }

    if !conflicts.isEmpty {
      let holders = conflicts.map { "\($0.holderAgentName) (\($0.holderRole))" }.joined(separator: ", ")
      let reason = "File is currently locked by: \(holders)"
      recordEvent(filePath: filePath, agentName: agentName, action: .conflict, lockType: lockType)
      return .conflict(existingLocks: conflicts, reason: reason)
    }

    // Create new lock entry
    let expiresAt = ttlSeconds.map { Date().addingTimeInterval($0) }
    let entry = FileLockEntry(
      filePath: filePath,
      holderAgentId: agentId,
      holderAgentName: agentName,
      holderRole: role,
      lockType: lockType,
      purpose: purpose,
      acquiredAt: Date(),
      expiresAt: expiresAt
    )

    internalLocks.append(entry)
    recordEvent(filePath: filePath, agentName: agentName, action: .acquired, lockType: lockType)

    return .success(entry)
  }

  // MARK: - Release

  /// Release a file lock held by a specific agent.
  @discardableResult
  public func release(filePath: String, agentId: UUID) -> Bool {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    let normalized = FileLockEntry.normalize(filePath)
    if let index = internalLocks.firstIndex(where: {
      $0.normalizedPath == normalized && $0.holderAgentId == agentId
    }) {
      let removed = internalLocks.remove(at: index)
      recordEvent(filePath: filePath, agentName: removed.holderAgentName, action: .released, lockType: removed.lockType)
      return true
    }
    return false
  }

  /// Release a file lock by lock entry ID.
  @discardableResult
  public func releaseById(_ lockId: UUID) -> Bool {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    if let index = internalLocks.firstIndex(where: { $0.id == lockId }) {
      let removed = internalLocks.remove(at: index)
      recordEvent(filePath: removed.filePath, agentName: removed.holderAgentName, action: .released, lockType: removed.lockType)
      return true
    }
    return false
  }

  /// Release all locks held by a specific agent.
  @discardableResult
  public func releaseAll(for agentId: UUID) -> [FileLockEntry] {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }

    let matching = internalLocks.filter { $0.holderAgentId == agentId }
    internalLocks.removeAll { $0.holderAgentId == agentId }

    for entry in matching {
      recordEvent(filePath: entry.filePath, agentName: entry.holderAgentName, action: .released, lockType: entry.lockType)
    }

    return matching
  }

  /// Force unlock all active locks.
  public func forceUnlockAll() {
    lock.lock()
    defer {
      lock.unlock()
      syncPublishedState()
    }
    for item in internalLocks {
      recordEvent(filePath: item.filePath, agentName: item.holderAgentName, action: .forceUnlocked, lockType: item.lockType)
    }
    internalLocks.removeAll()
  }

  // MARK: - Query

  /// Check whether a file is currently locked.
  public func isLocked(filePath: String) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    cleanExpiredInternalLocks()
    let normalized = FileLockEntry.normalize(filePath)
    return internalLocks.contains { $0.normalizedPath == normalized }
  }

  /// Returns all active holders for a file path.
  public func holders(for filePath: String) -> [FileLockEntry] {
    lock.lock()
    defer { lock.unlock() }
    cleanExpiredInternalLocks()
    let normalized = FileLockEntry.normalize(filePath)
    return internalLocks.filter { $0.normalizedPath == normalized }
  }

  /// Check if an agent holds an exclusive lock on a file path.
  public func isLockedByAgent(filePath: String, agentId: UUID) -> Bool {
    lock.lock()
    defer { lock.unlock() }
    let normalized = FileLockEntry.normalize(filePath)
    return internalLocks.contains { $0.normalizedPath == normalized && $0.holderAgentId == agentId }
  }

  // MARK: - Internal Helpers

  private func cleanExpiredInternalLocks() {
    let now = Date()
    let expired = internalLocks.filter { $0.expiresAt != nil && now > $0.expiresAt! }
    internalLocks.removeAll { $0.expiresAt != nil && now > $0.expiresAt! }
    for item in expired {
      recordEvent(filePath: item.filePath, agentName: item.holderAgentName, action: .expired, lockType: item.lockType)
    }
  }

  private func recordEvent(filePath: String, agentName: String, action: LockEvent.Action, lockType: FileLockType) {
    let event = LockEvent(filePath: filePath, agentName: agentName, action: action, lockType: lockType)
    recentEvents.insert(event, at: 0)
    if recentEvents.count > Self.maxEvents {
      recentEvents.removeLast(recentEvents.count - Self.maxEvents)
    }
  }

  private func syncPublishedState() {
    let currentLocks = self.internalLocks
    DispatchQueue.main.async {
      self.locks = currentLocks
    }
  }
}
