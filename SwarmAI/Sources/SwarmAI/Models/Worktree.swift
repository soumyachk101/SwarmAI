import Foundation
import SwiftUI

/// A git worktree managed within a workspace.
///
/// Worktrees allow multiple agents to operate on different branches
/// simultaneously without interfering with each other.
public struct Worktree: Identifiable, Codable, Sendable, Hashable {
 public let id: UUID
 public var name: String
 public var path: String
 public var branch: String
 public var ownerId: UUID?
 public var status: WorktreeStatus
 public var lastActivity: Date

 public init(
 id: UUID = UUID(),
 name: String,
 path: String,
 branch: String,
 ownerId: UUID? = nil,
 status: WorktreeStatus = .clean,
 lastActivity: Date = Date()
 ) {
 self.id = id
 self.name = name
 self.path = path
 self.branch = branch
 self.ownerId = ownerId
 self.status = status
 self.lastActivity = lastActivity
 }

 public static func == (lhs: Worktree, rhs: Worktree) -> Bool {
 lhs.id == rhs.id
 }

 public func hash(into hasher: inout Hasher) {
 hasher.combine(id)
 }
}

/// The cleanliness status of a worktree's git state.
@frozen
public enum WorktreeStatus: String, Codable, Sendable, CaseIterable {
 case clean = "clean"
 case dirty = "dirty"
 case locked = "locked"

 public var displayName: String {
 rawValue.capitalized
 }

 public var symbol: String {
 switch self {
 case .clean: "checkmark.circle.fill"
 case .dirty: "exclamationmark.triangle.fill"
 case .locked: "lock.fill"
 }
 }
}
