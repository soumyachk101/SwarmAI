import SwiftUI

// MARK: - Git Panel (Right Dock)

struct GitPanelView: View {
  @Environment(\.appState) private var appState
  @Environment(\.workspaceStore) private var workspaceStore

  @State private var gitStatus: GitStatus?
  @State private var commitMessage: String = ""
  @State private var contentAppeared = false
  @State private var isLoading = false
  @State private var errorMessage: String?
  @State private var branches: [String] = []

  private var repoPath: String {
    workspaceStore.activeWorkspace?.path ?? NSHomeDirectory()
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack {
        Text("Git Control")
          .font(.swarm(.sm, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)

        Spacer()

        Button {
          _Concurrency.Task { await refreshStatus() }
        } label: {
          Image(systemName: "arrow.clockwise")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextSecondary)
        }
        .buttonStyle(.plain)
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 10)
      .overlay(alignment: .bottom) {
        Rectangle()
          .fill(.swarmGold)
          .frame(height: 1.5)
          .frame(width: contentAppeared ? 40 : 0, alignment: .center)
          .animation(.easeOut(duration: 0.5), value: contentAppeared)
      }
      .opacity(contentAppeared ? 1 : 0)
      .animation(.easeOut(duration: 0.4).delay(0.05), value: contentAppeared)

      Divider()
        .background(.swarmBorderSubtle)

      if let error = errorMessage {
        HStack(spacing: 6) {
          Image(systemName: "exclamationmark.triangle.fill")
            .foregroundStyle(.swarmError)
            .font(.swarm(.xs))
          Text(error)
            .font(.swarm(.xs))
            .foregroundStyle(.swarmError)
            .lineLimit(2)
          Spacer()
        }
        .padding(8)
        .background(.swarmError.opacity(0.1))
      }

      ScrollView {
        VStack(spacing: 12) {
          // Branch selector & Pull
          HStack(spacing: 8) {
            Menu {
              ForEach(branches, id: \.self) { branch in
                Button(branch) {
                  _Concurrency.Task { await checkoutBranch(branch) }
                }
              }
            } label: {
              HStack {
                Image(systemName: "arrow.triangle.branch")
                  .font(.swarm(.xs))
                Text(gitStatus?.branch ?? "main")
                  .font(.swarmMono(.xs))
                  .lineLimit(1)
                Spacer()
                Image(systemName: "chevron.down")
                  .font(.swarm(.micro))
              }
              .padding(6)
              .background(.swarmSurface)
              .cornerRadius(4)
            }
            .buttonStyle(.plain)

            Button("Pull") {
              _Concurrency.Task { await pull() }
            }
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextSecondary)
            .padding(.horizontal, 8)
            .padding(.vertical, 6)
            .background(.swarmSurfaceHover)
            .cornerRadius(4)
            .buttonStyle(.plain)
          }
          .modifier(RowEntryModifier(appeared: contentAppeared, delay: 0.12))

          // Staged changes
          VStack(alignment: .leading, spacing: 4) {
            HStack {
              GitSectionHeader(title: "Staged (\(gitStatus?.stagedFiles.count ?? 0))")
              Spacer()
              if let staged = gitStatus?.stagedFiles, !staged.isEmpty {
                Button("Unstage All") {
                  _Concurrency.Task { await unstageAll() }
                }
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .buttonStyle(.plain)
              }
            }

            if let staged = gitStatus?.stagedFiles, !staged.isEmpty {
              ForEach(Array(staged.enumerated()), id: \.element.id) { index, file in
                HStack {
                  GitFileRow(
                    name: file.path,
                    status: file.stagedStatus.toUiStatus(),
                    appeared: contentAppeared,
                    delay: 0.18 + Double(index) * 0.02
                  )
                  Spacer()
                  Button {
                    _Concurrency.Task { await unstage(file.path) }
                  } label: {
                    Image(systemName: "minus")
                      .font(.swarm(.micro))
                      .foregroundStyle(.swarmWarning)
                  }
                  .buttonStyle(.plain)
                }
              }
            } else {
              Text("No staged changes")
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .padding(.vertical, 2)
            }
          }
          .modifier(RowEntryModifier(appeared: contentAppeared, delay: 0.18))

          // Unstaged changes
          VStack(alignment: .leading, spacing: 4) {
            HStack {
              GitSectionHeader(title: "Unstaged (\(gitStatus?.unstagedFiles.count ?? 0))")
              Spacer()
              if let unstaged = gitStatus?.unstagedFiles, !unstaged.isEmpty {
                Button("Stage All") {
                  _Concurrency.Task { await stageAll() }
                }
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmGold)
                .buttonStyle(.plain)
              }
            }

            if let unstaged = gitStatus?.unstagedFiles, !unstaged.isEmpty {
              ForEach(Array(unstaged.enumerated()), id: \.element.id) { index, file in
                HStack {
                  GitFileRow(
                    name: file.path,
                    status: file.unstagedStatus.toUiStatus(),
                    appeared: contentAppeared,
                    delay: 0.22 + Double(index) * 0.02
                  )
                  Spacer()
                  Button {
                    _Concurrency.Task { await stage(file.path) }
                  } label: {
                    Image(systemName: "plus")
                      .font(.swarm(.micro))
                      .foregroundStyle(.swarmSuccess)
                  }
                  .buttonStyle(.plain)
                }
              }
            } else {
              Text("No unstaged changes")
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .padding(.vertical, 2)
            }
          }
          .modifier(RowEntryModifier(appeared: contentAppeared, delay: 0.22))

          // Untracked changes
          if let untracked = gitStatus?.untrackedFiles, !untracked.isEmpty {
            VStack(alignment: .leading, spacing: 4) {
              HStack {
                GitSectionHeader(title: "Untracked (\(untracked.count))")
                Spacer()
                Button("Stage All") {
                  _Concurrency.Task { await stageAll() }
                }
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmGold)
                .buttonStyle(.plain)
              }

              ForEach(Array(untracked.enumerated()), id: \.element.id) { index, file in
                HStack {
                  GitFileRow(
                    name: file.path,
                    status: .untracked,
                    appeared: contentAppeared,
                    delay: 0.30 + Double(index) * 0.02
                  )
                  Spacer()
                  Button {
                    _Concurrency.Task { await stage(file.path) }
                  } label: {
                    Image(systemName: "plus")
                      .font(.swarm(.micro))
                      .foregroundStyle(.swarmSuccess)
                  }
                  .buttonStyle(.plain)
                }
              }
            }
            .modifier(RowEntryModifier(appeared: contentAppeared, delay: 0.30))
          }

          // Commit Box
          VStack(alignment: .leading, spacing: 6) {
            Text("Commit Message")
              .font(.swarm(.xs, weight: .medium))
              .foregroundStyle(.swarmTextSecondary)

            TextEditor(text: $commitMessage)
              .font(.swarmMono(.xs))
              .frame(height: 60)
              .scrollContentBackground(.hidden)
              .padding(6)
              .background(.swarmSurface)
              .cornerRadius(6)

            Button {
              _Concurrency.Task { await commitAndPush() }
            } label: {
              Text("Commit & Push")
                .font(.swarm(.sm, weight: .medium))
                .foregroundStyle(.swarmCanvas)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 8)
                .background(.swarmGold)
                .cornerRadius(6)
            }
            .buttonStyle(.plain)
            .disabled(commitMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
          }
          .modifier(RowEntryModifier(appeared: contentAppeared, delay: 0.36))
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 8)
      }
      .background(.swarmCanvas)
    }
    .modifier(PanelEntryModifier(appeared: contentAppeared))
    .task(id: repoPath) {
      contentAppeared = false
      await refreshStatus()
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
        contentAppeared = true
      }
    }
  }

  // MARK: - Actions

  private func refreshStatus() async {
    isLoading = true
    errorMessage = nil
    do {
      let isRepo = await GitService.shared.isGitRepository(at: repoPath)
      if isRepo {
        let status = try await GitService.shared.gitStatus(at: repoPath)
        let branchList = try await GitService.shared.gitBranches(at: repoPath)
        gitStatus = status
        branches = branchList
      }
    } catch {
      errorMessage = error.localizedDescription
    }
    isLoading = false
  }

  private func stage(_ file: String) async {
    do {
      try await GitService.shared.gitAdd(at: repoPath, files: [file])
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func stageAll() async {
    do {
      try await GitService.shared.gitAdd(at: repoPath, files: [])
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func unstage(_ file: String) async {
    do {
      try await GitService.shared.gitReset(at: repoPath, files: [file])
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func unstageAll() async {
    do {
      try await GitService.shared.gitReset(at: repoPath, files: [])
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func pull() async {
    do {
      try await GitService.shared.gitPull(at: repoPath)
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func checkoutBranch(_ branch: String) async {
    do {
      try await GitService.shared.gitCheckout(at: repoPath, branch: branch, createNew: false)
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func commitAndPush() async {
    do {
      try await GitService.shared.gitCommit(at: repoPath, message: commitMessage, stageAll: false)
      try await GitService.shared.gitPush(at: repoPath)
      commitMessage = ""
      await refreshStatus()
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}

// MARK: - Helper Types

public enum GitFileStatus {
  case modified, added, deleted, renamed, untracked

  public var icon: String {
    switch self {
    case .modified: return "pencil"
    case .added: return "plus"
    case .deleted: return "minus"
    case .renamed: return "arrow.left.arrow.right"
    case .untracked: return "questionmark"
    }
  }

  public var color: Color {
    switch self {
    case .modified: return .swarmWarning
    case .added: return .swarmSuccess
    case .deleted: return .swarmError
    case .renamed: return .swarmInfo
    case .untracked: return .swarmTextTertiary
    }
  }
}

extension GitFileStatusCode {
  public func toUiStatus() -> GitFileStatus {
    switch self {
    case .modified: return .modified
    case .added, .copied: return .added
    case .deleted: return .deleted
    case .renamed: return .renamed
    default: return .untracked
    }
  }
}

struct GitFileRow: View {
  let name: String
  let status: GitFileStatus
  let appeared: Bool
  let delay: Double

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: status.icon)
        .font(.swarm(.xs))
        .foregroundStyle(status.color)

      Text(name)
        .font(.swarmMono(.xs))
        .foregroundStyle(.swarmTextSecondary)
        .lineLimit(1)

      Spacer()
    }
    .padding(.horizontal, 4)
    .padding(.vertical, 2)
    .modifier(RowEntryModifier(appeared: appeared, delay: delay))
  }
}

struct GitSectionHeader: View {
  let title: String

  var body: some View {
    Text(title)
      .font(.swarm(.xs, weight: .medium))
      .foregroundStyle(.swarmTextSecondary)
  }
}