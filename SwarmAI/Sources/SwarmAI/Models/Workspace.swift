import Foundation
import SwiftUI

/// A workspace that groups agents, worktrees, and tasks together.
///
/// Workspaces represent a project or codebase that the swarm is
/// actively working on. Each workspace has its own set of git worktrees,
/// open files, and associated agents.
@Observable
public class Workspace: Codable, Identifiable {
 /// Unique identifier for the workspace.
 public let id: UUID

 /// Display name for the workspace.
 public var name: String

 /// File system path to the workspace root.
 public var path: String

 /// Display color for this workspace in the UI.
 public var color: Color

 /// Git worktrees managed within this workspace.
 public var worktrees: [Worktree]

 /// The currently active worktree ID, if any.
 public var activeWorktreeId: UUID?

 /// Files currently open in the editor pane.
 public var openFiles: [String]

 /// Whether the kanban board is currently open.
 public var boardOpen: Bool

 // MARK: - Codable

 private enum CodingKeys: String, CodingKey {
 case id
 case name
 case path
 case colorHex = "color"
 case worktrees
 case activeWorktreeId
 case openFiles
 case boardOpen
 }

 public init(from decoder: Decoder) throws {
 let container = try decoder.container(keyedBy: CodingKeys.self)
 id = try container.decode(UUID.self, forKey: .id)
 name = try container.decode(String.self, forKey: .name)
 path = try container.decode(String.self, forKey: .path)

 let colorHex = try container.decode(String.self, forKey: .colorHex)
 color = Color(hex: colorHex) ?? .blue

 worktrees = try container.decode([Worktree].self, forKey: .worktrees)
 activeWorktreeId = try container.decodeIfPresent(UUID.self, forKey: .activeWorktreeId)
 openFiles = try container.decode([String].self, forKey: .openFiles)
 boardOpen = try container.decode(Bool.self, forKey: .boardOpen)
 }

 public func encode(to encoder: Encoder) throws {
 var container = encoder.container(keyedBy: CodingKeys.self)
 try container.encode(id, forKey: .id)
 try container.encode(name, forKey: .name)
 try container.encode(path, forKey: .path)
 try container.encode(color.toHex(), forKey: .colorHex)
 try container.encode(worktrees, forKey: .worktrees)
 try container.encodeIfPresent(activeWorktreeId, forKey: .activeWorktreeId)
 try container.encode(openFiles, forKey: .openFiles)
 try container.encode(boardOpen, forKey: .boardOpen)
 }

 // MARK: - Init

 /// Create a new workspace.
 public init(
 id: UUID = UUID(),
 name: String,
 path: String,
 color: Color? = nil,
 worktrees: [Worktree] = [],
 activeWorktreeId: UUID? = nil,
 openFiles: [String] = [],
 boardOpen: Bool = false
 ) {
 self.id = id
 self.name = name
 self.path = path
 self.color = color ?? .blue
 self.worktrees = worktrees
 self.activeWorktreeId = activeWorktreeId
 self.openFiles = openFiles
 self.boardOpen = boardOpen
 }

 // MARK: - Active Worktree

 /// The currently active worktree, if one is set.
 public var activeWorktree: Worktree? {
 guard let activeId = activeWorktreeId else { return nil }
 return worktrees.first { $0.id == activeId }
 }

 /// The active branch, derived from the active worktree.
 public var activeBranch: String? {
 activeWorktree?.branch
 }
}
