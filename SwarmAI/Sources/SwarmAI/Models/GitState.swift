import Foundation

/// Git repository state for a worktree or workspace.
public struct GitState: Codable, Sendable, Hashable {
 /// Current checked-out branch.
 public var branch: String

 /// Number of commits ahead of the upstream.
 public var ahead: Int

 /// Number of commits behind the upstream.
 public var behind: Int

 /// Files with staged changes.
 public var stagedFiles: [String]

 /// Files with unstaged changes.
 public var unstagedFiles: [String]

 /// Files that are untracked.
 public var untrackedFiles: [String]

 /// SHA of the last commit, if available.
 public var lastCommit: String?

 /// Full diff of uncommitted changes, if available.
 public var diff: String?

 /// Whether the repository has any uncommitted changes.
 public var isDirty: Bool {
 !stagedFiles.isEmpty || !unstagedFiles.isEmpty || !untrackedFiles.isEmpty
 }

 /// Whether the repository is clean (no uncommitted changes).
 public var isClean: Bool {
 !isDirty
 }

 public init(
 branch: String = "main",
 ahead: Int = 0,
 behind: Int = 0,
 stagedFiles: [String] = [],
 unstagedFiles: [String] = [],
 untrackedFiles: [String] = [],
 lastCommit: String? = nil,
 diff: String? = nil
 ) {
 self.branch = branch
 self.ahead = ahead
 self.behind = behind
 self.stagedFiles = stagedFiles
 self.unstagedFiles = unstagedFiles
 self.untrackedFiles = untrackedFiles
 self.lastCommit = lastCommit
 self.diff = diff
 }
}
