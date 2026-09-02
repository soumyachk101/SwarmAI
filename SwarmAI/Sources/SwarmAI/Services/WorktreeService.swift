import Foundation

/// Service for managing isolated Git Worktrees for concurrent agent workflows.
@Observable
public final class WorktreeService: @unchecked Sendable {
  public static let shared = WorktreeService()

  public init() {}

  /// Creates a new git worktree with dedicated branch isolation.
  /// Executes `git worktree add -b <branch> <path> <baseBranch>` or `git worktree add <path> <branch>`.
  public func createWorktree(
    repoPath: String,
    branch: String,
    baseBranch: String = "main",
    customPath: String? = nil
  ) async throws -> Worktree {
    let cleanBranch = branch.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !cleanBranch.isEmpty else {
      throw GitError.executionError("Branch name cannot be empty")
    }

    let targetPath: String
    if let customPath = customPath, !customPath.isEmpty {
      targetPath = URL(fileURLWithPath: customPath).standardized.path
    } else {
      let repoURL = URL(fileURLWithPath: repoPath).standardized
      targetPath = repoURL.appendingPathComponent(".worktrees").appendingPathComponent(cleanBranch).path
    }

    // Ensure parent directory exists
    let parentDir = (targetPath as NSString).deletingLastPathComponent
    try? FileManager.default.createDirectory(atPath: parentDir, withIntermediateDirectories: true)

    // Check if branch already exists in repo
    let existingBranches = (try? await GitService.shared.gitBranches(at: repoPath)) ?? []
    let branchExists = existingBranches.contains(cleanBranch)

    var args = ["worktree", "add"]
    if branchExists {
      args.append(targetPath)
      args.append(cleanBranch)
    } else {
      args.append("-b")
      args.append(cleanBranch)
      args.append(targetPath)
      args.append(baseBranch)
    }

    try await GitService.shared.runGit(args: args, at: repoPath)

    return Worktree(
      name: cleanBranch,
      path: targetPath,
      branch: cleanBranch,
      status: .clean,
      lastActivity: Date()
    )
  }

  /// Removes an existing worktree and prunes dead references.
  /// Executes `git worktree remove --force <path>` and `git worktree prune`.
  public func removeWorktree(repoPath: String, path: String) async throws {
    let cleanPath = URL(fileURLWithPath: path).standardized.path

    // Run remove --force
    _ = try? await GitService.shared.runGit(args: ["worktree", "remove", "--force", cleanPath], at: repoPath)

    // Run prune
    _ = try? await GitService.shared.runGit(args: ["worktree", "prune"], at: repoPath)

    // Clean directory if still present
    if FileManager.default.fileExists(atPath: cleanPath) {
      try? FileManager.default.removeItem(atPath: cleanPath)
    }
  }

  /// Lists all worktrees attached to the repository.
  /// Parses `git worktree list --porcelain`.
  public func listWorktrees(repoPath: String) async throws -> [Worktree] {
    let result = try await GitService.shared.runGit(args: ["worktree", "list", "--porcelain"], at: repoPath)
    let output = result.stdout

    var worktrees: [Worktree] = []
    let blocks = output.components(separatedBy: "\n\n")

    for block in blocks {
      let lines = block.components(separatedBy: .newlines).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      guard !lines.isEmpty else { continue }

      var path: String?
      var head: String?
      var branch: String?
      var isLocked = false
      var isPrunable = false

      for line in lines {
        if line.hasPrefix("worktree ") {
          path = String(line.dropFirst("worktree ".count))
        } else if line.hasPrefix("HEAD ") {
          head = String(line.dropFirst("HEAD ".count))
        } else if line.hasPrefix("branch ") {
          let fullRef = String(line.dropFirst("branch ".count))
          branch = fullRef.replacingOccurrences(of: "refs/heads/", with: "")
        } else if line == "detached" {
          branch = "detached@\(head?.prefix(7) ?? "HEAD")"
        } else if line.hasPrefix("locked") {
          isLocked = true
        } else if line.hasPrefix("prunable") {
          isPrunable = true
        }
      }

      if let wtPath = path {
        let wtName = URL(fileURLWithPath: wtPath).lastPathComponent
        let wtBranch = branch ?? "main"

        var status: WorktreeStatus = .clean
        if isLocked {
          status = .locked
        } else if isPrunable {
          status = .dirty
        } else if let gitStatus = try? await GitService.shared.gitStatus(at: wtPath), gitStatus.isDirty {
          status = .dirty
        }

        let worktree = Worktree(
          name: wtName,
          path: wtPath,
          branch: wtBranch,
          status: status,
          lastActivity: Date()
        )
        worktrees.append(worktree)
      }
    }

    return worktrees
  }

  /// Switches branch within a worktree.
  public func switchBranch(_ worktree: Worktree, to branch: String) async throws {
    try await GitService.shared.gitCheckout(at: worktree.path, branch: branch, createNew: false)
  }

  /// Locks a worktree to prevent accidental removal.
  public func lockWorktree(repoPath: String, path: String, reason: String? = nil) async throws {
    var args = ["worktree", "lock"]
    if let reason = reason, !reason.isEmpty {
      args.append("--reason")
      args.append(reason)
    }
    args.append(path)
    try await GitService.shared.runGit(args: args, at: repoPath)
  }

  /// Unlocks a previously locked worktree.
  public func unlockWorktree(repoPath: String, path: String) async throws {
    try await GitService.shared.runGit(args: ["worktree", "unlock", path], at: repoPath)
  }
}