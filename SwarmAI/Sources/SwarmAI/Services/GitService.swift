import Foundation

// MARK: - Git Models

/// The status code of a file in git.
public enum GitFileStatusCode: String, Codable, Sendable, Hashable {
  case unmodified = " "
  case modified = "M"
  case added = "A"
  case deleted = "D"
  case renamed = "R"
  case copied = "C"
  case updatedButUnmerged = "U"
  case untracked = "?"
  case ignored = "!"

  public var label: String {
    switch self {
    case .unmodified: return "Unmodified"
    case .modified: return "Modified"
    case .added: return "Added"
    case .deleted: return "Deleted"
    case .renamed: return "Renamed"
    case .copied: return "Copied"
    case .updatedButUnmerged: return "Unmerged"
    case .untracked: return "Untracked"
    case .ignored: return "Ignored"
    }
  }
}

/// Represents a single file change detected by git status.
public struct GitFileChange: Identifiable, Codable, Sendable, Hashable {
  public var id: String { path }
  public let path: String
  public let oldPath: String?
  public let stagedStatus: GitFileStatusCode
  public let unstagedStatus: GitFileStatusCode

  public var isStaged: Bool {
    stagedStatus != .unmodified && stagedStatus != .untracked && stagedStatus != .ignored
  }

  public var isUnstaged: Bool {
    unstagedStatus != .unmodified && unstagedStatus != .untracked && unstagedStatus != .ignored
  }

  public var isUntracked: Bool {
    stagedStatus == .untracked || unstagedStatus == .untracked
  }

  public var displayStatus: GitFileStatusCode {
    if isStaged { return stagedStatus }
    if isUnstaged { return unstagedStatus }
    return .untracked
  }

  public init(
    path: String,
    oldPath: String? = nil,
    stagedStatus: GitFileStatusCode = .unmodified,
    unstagedStatus: GitFileStatusCode = .unmodified
  ) {
    self.path = path
    self.oldPath = oldPath
    self.stagedStatus = stagedStatus
    self.unstagedStatus = unstagedStatus
  }
}

/// Detailed git status representation.
public struct GitStatus: Codable, Sendable, Hashable {
  public var branch: String
  public var upstream: String?
  public var ahead: Int
  public var behind: Int
  public var stagedFiles: [GitFileChange]
  public var unstagedFiles: [GitFileChange]
  public var untrackedFiles: [GitFileChange]
  public var allChanges: [GitFileChange]

  public var isClean: Bool {
    stagedFiles.isEmpty && unstagedFiles.isEmpty && untrackedFiles.isEmpty
  }

  public var isDirty: Bool {
    !isClean
  }

  public init(
    branch: String = "main",
    upstream: String? = nil,
    ahead: Int = 0,
    behind: Int = 0,
    stagedFiles: [GitFileChange] = [],
    unstagedFiles: [GitFileChange] = [],
    untrackedFiles: [GitFileChange] = [],
    allChanges: [GitFileChange] = []
  ) {
    self.branch = branch
    self.upstream = upstream
    self.ahead = ahead
    self.behind = behind
    self.stagedFiles = stagedFiles
    self.unstagedFiles = unstagedFiles
    self.untrackedFiles = untrackedFiles
    self.allChanges = allChanges
  }

  /// Converts this `GitStatus` to `GitState` for compatibility.
  public func toGitState(lastCommit: String? = nil, diff: String? = nil) -> GitState {
    GitState(
      branch: branch,
      ahead: ahead,
      behind: behind,
      stagedFiles: stagedFiles.map(\.path),
      unstagedFiles: unstagedFiles.map(\.path),
      untrackedFiles: untrackedFiles.map(\.path),
      lastCommit: lastCommit,
      diff: diff
    )
  }
}

/// Commit summary metadata.
public struct GitCommitInfo: Identifiable, Codable, Sendable, Hashable {
  public var id: String { sha }
  public let sha: String
  public let shortSha: String
  public let author: String
  public let email: String
  public let date: Date
  public let message: String

  public init(
    sha: String,
    author: String,
    email: String,
    date: Date,
    message: String
  ) {
    self.sha = sha
    self.shortSha = String(sha.prefix(7))
    self.author = author
    self.email = email
    self.date = date
    self.message = message
  }
}

/// Errors thrown by Git operations.
public enum GitError: LocalizedError, Sendable {
  case commandFailed(command: String, exitCode: Int32, stderr: String)
  case notARepository(path: String)
  case gitNotFound
  case executionError(String)

  public var errorDescription: String? {
    switch self {
    case .commandFailed(let cmd, let code, let err):
      let cleanErr = err.trimmingCharacters(in: .whitespacesAndNewlines)
      return "Git command '\(cmd)' failed (exit code \(code))\(cleanErr.isEmpty ? "" : ": \(cleanErr)")"
    case .notARepository(let path):
      return "Not a git repository: \(path)"
    case .gitNotFound:
      return "Git executable not found in PATH or standard macOS locations."
    case .executionError(let msg):
      return "Git execution error: \(msg)"
    }
  }
}

// MARK: - Git Service

/// Real native Git CLI service executing git commands via `Process`.
public final class GitService: @unchecked Sendable {
  public static let shared = GitService()

  private let gitExecutableCandidates = [
    "/usr/bin/git",
    "/opt/homebrew/bin/git",
    "/usr/local/bin/git"
  ]

  public init() {}

  // MARK: - Git Binary Resolution

  /// Resolves the absolute path to the git executable on macOS.
  private func resolveGitExecutable() throws -> String {
    for candidate in gitExecutableCandidates {
      if FileManager.default.isExecutableFile(atPath: candidate) {
        return candidate
      }
    }
    // Check PATH environment
    if let pathEnv = ProcessInfo.processInfo.environment["PATH"] {
      for dir in pathEnv.split(separator: ":") {
        let fullPath = (String(dir) as NSString).appendingPathComponent("git")
        if FileManager.default.isExecutableFile(atPath: fullPath) {
          return fullPath
        }
      }
    }
    throw GitError.gitNotFound
  }

  // MARK: - Process Execution

  /// Executes a git command with arguments in a given repository path.
  @discardableResult
  public func runGit(
    args: [String],
    at path: String
  ) async throws -> (stdout: String, stderr: String) {
    let gitPath = try resolveGitExecutable()
    let repoURL = URL(fileURLWithPath: path).standardized

    var isDirectory: ObjCBool = false
    guard FileManager.default.fileExists(atPath: repoURL.path, isDirectory: &isDirectory),
          isDirectory.boolValue else {
      throw GitError.notARepository(path: path)
    }

    return try await withCheckedThrowingContinuation { continuation in
      DispatchQueue.global(qos: .userInitiated).async {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: gitPath)
        process.currentDirectoryURL = repoURL
        process.arguments = args

        var env = ProcessInfo.processInfo.environment
        env["GIT_TERMINAL_PROMPT"] = "0"
        env["LANG"] = "en_US.UTF-8"
        env["LC_ALL"] = "en_US.UTF-8"
        if let currentPath = env["PATH"] {
          env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:\(currentPath)"
        } else {
          env["PATH"] = "/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
        }
        process.environment = env

        let stdoutPipe = Pipe()
        let stderrPipe = Pipe()
        process.standardOutput = stdoutPipe
        process.standardError = stderrPipe

        do {
          try process.run()
        } catch {
          continuation.resume(throwing: GitError.executionError(error.localizedDescription))
          return
        }

        // Read pipes before waitUntilExit to prevent buffer deadlock
        let stdoutData = stdoutPipe.fileHandleForReading.readDataToEndOfFile()
        let stderrData = stderrPipe.fileHandleForReading.readDataToEndOfFile()
        process.waitUntilExit()

        let stdoutString = String(data: stdoutData, encoding: .utf8) ?? ""
        let stderrString = String(data: stderrData, encoding: .utf8) ?? ""

        if process.terminationStatus != 0 {
          continuation.resume(
            throwing: GitError.commandFailed(
              command: "git " + args.joined(separator: " "),
              exitCode: process.terminationStatus,
              stderr: stderrString
            )
          )
        } else {
          continuation.resume(returning: (stdout: stdoutString, stderr: stderrString))
        }
      }
    }
  }

  // MARK: - Repository Status & Verification

  /// Checks if the given path is inside a git repository.
  public func isGitRepository(at path: String) async -> Bool {
    do {
      let result = try await runGit(args: ["rev-parse", "--is-inside-work-tree"], at: path)
      return result.stdout.trimmingCharacters(in: .whitespacesAndNewlines) == "true"
    } catch {
      return false
    }
  }

  /// Retrieves the root path of the git repository.
  public func repositoryRoot(at path: String) async throws -> String {
    let result = try await runGit(args: ["rev-parse", "--show-toplevel"], at: path)
    return result.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
  }

  /// Parses `git status --porcelain=v1 -z` and returns structured `GitStatus`.
  public func gitStatus(at path: String) async throws -> GitStatus {
    // 1. Get current branch name
    let branch = try await currentBranch(at: path)

    // 2. Get upstream tracking and ahead/behind
    var upstream: String? = nil
    var ahead = 0
    var behind = 0

    if let counts = try? await aheadBehindCounts(at: path) {
      ahead = counts.ahead
      behind = counts.behind
      upstream = counts.upstream
    }

    // 3. Run status with porcelain v1 -z
    let statusResult = try await runGit(args: ["status", "--porcelain=v1", "-z", "--untracked-files=all"], at: path)
    let output = statusResult.stdout

    var stagedList: [GitFileChange] = []
    var unstagedList: [GitFileChange] = []
    var untrackedList: [GitFileChange] = []
    var allList: [GitFileChange] = []

    if !output.isEmpty {
      let entries = output.split(separator: "\0", omittingEmptySubsequences: false)
      var index = 0

      while index < entries.count {
        let entry = String(entries[index])
        guard !entry.isEmpty else {
          index += 1
          continue
        }

        if entry.count >= 3 {
          let xChar = entry[entry.startIndex]
          let yChar = entry[entry.index(after: entry.startIndex)]
          let filePath = String(entry.dropFirst(3))

          let stagedStatus = GitFileStatusCode(rawValue: String(xChar)) ?? .unmodified
          let unstagedStatus = GitFileStatusCode(rawValue: String(yChar)) ?? .unmodified

          var oldPath: String? = nil
          if stagedStatus == .renamed || stagedStatus == .copied ||
             unstagedStatus == .renamed || unstagedStatus == .copied {
            // Next NUL token is the original path
            if index + 1 < entries.count {
              index += 1
              oldPath = String(entries[index])
            }
          }

          let change = GitFileChange(
            path: filePath,
            oldPath: oldPath,
            stagedStatus: stagedStatus,
            unstagedStatus: unstagedStatus
          )

          allList.append(change)

          if change.isUntracked {
            untrackedList.append(change)
          } else {
            if change.isStaged {
              stagedList.append(change)
            }
            if change.isUnstaged {
              unstagedList.append(change)
            }
          }
        }
        index += 1
      }
    }

    return GitStatus(
      branch: branch,
      upstream: upstream,
      ahead: ahead,
      behind: behind,
      stagedFiles: stagedList,
      unstagedFiles: unstagedList,
      untrackedFiles: untrackedList,
      allChanges: allList
    )
  }

  // MARK: - Branches & Current Branch

  /// Retrieves the current checked-out branch name or commit SHA if detached.
  public func currentBranch(at path: String) async throws -> String {
    do {
      let result = try await runGit(args: ["branch", "--show-current"], at: path)
      let branchName = result.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
      if !branchName.isEmpty {
        return branchName
      }
      // Detached HEAD fallback
      let revResult = try await runGit(args: ["rev-parse", "--short", "HEAD"], at: path)
      let sha = revResult.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
      return sha.isEmpty ? "HEAD" : "detached@\(sha)"
    } catch {
      return "main"
    }
  }

  /// Lists all local and remote branches.
  public func gitBranches(at path: String) async throws -> [String] {
    let result = try await runGit(args: ["branch", "--format=%(refname:short)"], at: path)
    let lines = result.stdout.components(separatedBy: .newlines)
    return lines
      .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
      .filter { !$0.isEmpty }
  }

  /// Gets ahead / behind count relative to upstream branch.
  public func aheadBehindCounts(at path: String) async throws -> (ahead: Int, behind: Int, upstream: String?) {
    guard let upstreamResult = try? await runGit(args: ["rev-parse", "--abbrev-ref", "@{upstream}"], at: path) else {
      return (ahead: 0, behind: 0, upstream: nil)
    }
    let upstream = upstreamResult.stdout.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !upstream.isEmpty else {
      return (ahead: 0, behind: 0, upstream: nil)
    }

    let countResult = try await runGit(args: ["rev-list", "--left-right", "--count", "HEAD...@{upstream}"], at: path)
    let parts = countResult.stdout.trimmingCharacters(in: .whitespacesAndNewlines).split(separator: "\t")
    if parts.count == 2,
       let ahead = Int(parts[0]),
       let behind = Int(parts[1]) {
      return (ahead: ahead, behind: behind, upstream: upstream)
    }
    return (ahead: 0, behind: 0, upstream: upstream)
  }

  // MARK: - Diff Operations

  /// Generates git diff output for the repository or a specific file.
  public func gitDiff(
    at path: String,
    file: String? = nil,
    staged: Bool = false
  ) async throws -> String {
    var args = ["diff"]
    if staged {
      args.append("--cached")
    }
    if let file = file, !file.isEmpty {
      args.append("--")
      args.append(file)
    }
    let result = try await runGit(args: args, at: path)
    return result.stdout
  }

  // MARK: - Staging & Discarding

  /// Stages one or more files (or all if files list is empty).
  public func gitAdd(at path: String, files: [String] = []) async throws {
    if files.isEmpty {
      try await runGit(args: ["add", "-A"], at: path)
    } else {
      var args = ["add", "--"]
      args.append(contentsOf: files)
      try await runGit(args: args, at: path)
    }
  }

  /// Unstages one or more files from the index.
  public func gitReset(at path: String, files: [String] = []) async throws {
    if files.isEmpty {
      try await runGit(args: ["restore", "--staged", "."], at: path)
    } else {
      var args = ["restore", "--staged", "--"]
      args.append(contentsOf: files)
      try await runGit(args: args, at: path)
    }
  }

  /// Discards unstaged modifications in working directory.
  public func gitDiscard(at path: String, files: [String]) async throws {
    guard !files.isEmpty else { return }
    var args = ["restore", "--"]
    args.append(contentsOf: files)
    _ = try? await runGit(args: args, at: path)

    for file in files {
      _ = try? await runGit(args: ["clean", "-f", "--", file], at: path)
    }
  }

  // MARK: - Commit, Push, Pull & Checkout

  /// Creates a git commit.
  public func gitCommit(
    at path: String,
    message: String,
    stageAll: Bool = false
  ) async throws {
    let trimmed = message.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      throw GitError.executionError("Commit message cannot be empty")
    }

    if stageAll {
      try await gitAdd(at: path, files: [])
    }
    try await runGit(args: ["commit", "-m", trimmed], at: path)
  }

  /// Pushes commits to the remote repository.
  public func gitPush(
    at path: String,
    remote: String = "origin",
    branch: String? = nil,
    setUpstream: Bool = false
  ) async throws {
    var args = ["push"]
    if setUpstream {
      args.append("-u")
    }
    args.append(remote)
    if let branch = branch, !branch.isEmpty {
      args.append(branch)
    }
    try await runGit(args: args, at: path)
  }

  /// Pulls commits from the remote repository.
  public func gitPull(
    at path: String,
    remote: String = "origin",
    branch: String? = nil
  ) async throws {
    var args = ["pull"]
    if let branch = branch, !branch.isEmpty {
      args.append(remote)
      args.append(branch)
    }
    try await runGit(args: args, at: path)
  }

  /// Fetches latest updates from remote.
  public func gitFetch(at path: String, remote: String = "origin") async throws {
    try await runGit(args: ["fetch", remote], at: path)
  }

  /// Switches branch or creates a new branch.
  public func gitCheckout(
    at path: String,
    branch: String,
    createNew: Bool = false
  ) async throws {
    let trimmed = branch.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !trimmed.isEmpty else {
      throw GitError.executionError("Branch name cannot be empty")
    }

    if createNew {
      try await runGit(args: ["checkout", "-b", trimmed], at: path)
    } else {
      try await runGit(args: ["checkout", trimmed], at: path)
    }
  }

  // MARK: - Git Log & Commits

  /// Fetches recent commit history.
  public func gitLog(at path: String, maxCount: Int = 20) async throws -> [GitCommitInfo] {
    let format = "%H%x00%an%x00%ae%x00%at%x00%s"
    let result = try await runGit(
      args: ["log", "-n", "\(maxCount)", "--pretty=format:\(format)"],
      at: path
    )

    var commits: [GitCommitInfo] = []
    let lines = result.stdout.components(separatedBy: .newlines)
    for line in lines where !line.isEmpty {
      let parts = line.split(separator: "\0", omittingEmptySubsequences: false)
      if parts.count >= 5 {
        let sha = String(parts[0])
        let author = String(parts[1])
        let email = String(parts[2])
        let timestamp = TimeInterval(parts[3]) ?? 0
        let message = String(parts[4])
        let date = Date(timeIntervalSince1970: timestamp)

        commits.append(
          GitCommitInfo(
            sha: sha,
            author: author,
            email: email,
            date: date,
            message: message
          )
        )
      }
    }
    return commits
  }

  /// Initializes a new git repository.
  public func gitInit(at path: String) async throws {
    try await runGit(args: ["init"], at: path)
  }
}