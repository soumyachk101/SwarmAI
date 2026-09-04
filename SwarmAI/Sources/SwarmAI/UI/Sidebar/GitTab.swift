import SwiftUI

// MARK: - Git Tab (Sidebar)

struct GitTab: View {
  @Environment(\.appState) private var appState
  @Environment(\.workspaceStore) private var workspaceStore

  @State private var gitStatus: GitStatus?
  @State private var branches: [String] = []
  @State private var selectedBranch: String = "main"
  @State private var commitMessage: String = ""
  @State private var isLoading: Bool = false
  @State private var errorMessage: String?
  @State private var showingDiffModal: Bool = false
  @State private var diffContent: String = ""
  @State private var diffTitle: String = ""
  @State private var isCreatingBranch: Bool = false
  @State private var newBranchName: String = ""

  private var repoPath: String {
    workspaceStore.activeWorkspace?.path ?? NSHomeDirectory()
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Branch & Sync bar
      branchHeaderView

      Divider()
        .background(.swarmBorderSubtle)

      if isLoading && gitStatus == nil {
        ProgressView("Reading git status...")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)
          .frame(maxWidth: .infinity, maxHeight: .infinity)
      } else {
        ScrollView {
          VStack(alignment: .leading, spacing: 14) {
            if let error = errorMessage {
              errorBanner(error)
            }

            // Staged Changes Section
            stagedChangesSection

            // Unstaged Changes Section
            unstagedChangesSection

            // Untracked Changes Section
            untrackedChangesSection

            // Commit Box
            commitBoxView

            // Quick Push / Pull / Fetch Controls
            syncControlsView
          }
          .padding(.horizontal, 12)
          .padding(.vertical, 10)
        }
        .background(.swarmCanvas)
      }
    }
    .task(id: repoPath) {
      await refreshGit()
    }
    .sheet(isPresented: $showingDiffModal) {
      diffSheetView
    }
    .sheet(isPresented: $isCreatingBranch) {
      createBranchSheetView
    }
  }

  // MARK: - Subviews

  private var branchHeaderView: some View {
    HStack(spacing: 8) {
      Image(systemName: "arrow.triangle.branch")
        .font(.swarm(.xs))
        .foregroundStyle(.swarmGold)

      Menu {
        ForEach(branches, id: \.self) { branch in
          Button {
            _Concurrency.Task { await switchBranch(to: branch) }
          } label: {
            HStack {
              Text(branch)
              if branch == (gitStatus?.branch ?? selectedBranch) {
                Image(systemName: "checkmark")
              }
            }
          }
        }
        Divider()
        Button("Create New Branch...") {
          isCreatingBranch = true
        }
      } label: {
        Text(gitStatus?.branch ?? selectedBranch)
          .font(.swarm(.sm, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)
      }
      .buttonStyle(.plain)

      Spacer()

      if let status = gitStatus {
        if status.ahead > 0 || status.behind > 0 {
          HStack(spacing: 4) {
            if status.ahead > 0 {
              Text("↑\(status.ahead)")
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmSuccess)
            }
            if status.behind > 0 {
              Text("↓\(status.behind)")
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmWarning)
            }
          }
        }
      }

      Button {
        _Concurrency.Task { await refreshGit() }
      } label: {
        Image(systemName: "arrow.clockwise")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextSecondary)
      }
      .buttonStyle(.plain)
    }
    .padding(.horizontal, 14)
    .padding(.vertical, 10)
  }

  private var stagedChangesSection: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        SectionHeader(title: "Staged Changes", count: gitStatus?.stagedFiles.count ?? 0)
        Spacer()
        if let staged = gitStatus?.stagedFiles, !staged.isEmpty {
          Button("Unstage All") {
            _Concurrency.Task { await unstageFiles([]) }
          }
          .font(.swarmMono(.micro))
          .foregroundStyle(.swarmTextTertiary)
          .buttonStyle(.plain)
        }
      }

      if let staged = gitStatus?.stagedFiles, !staged.isEmpty {
        ForEach(staged) { file in
          HStack(spacing: 6) {
            Button {
              _Concurrency.Task { await unstageFiles([file.path]) }
            } label: {
              Image(systemName: "minus.circle")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmWarning)
            }
            .buttonStyle(.plain)

            Text(file.path)
              .font(.swarmMono(.micro))
              .foregroundStyle(.swarmTextPrimary)
              .lineLimit(1)
              .onTapGesture {
                _Concurrency.Task { await showDiff(for: file.path, staged: true) }
              }

            Spacer()

            Text(file.stagedStatus.rawValue)
              .font(.swarmMono(.micro))
              .foregroundStyle(.swarmSuccess)
          }
          .padding(.vertical, 2)
        }
      } else {
        Text("No staged changes")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)
          .padding(.vertical, 2)
      }
    }
  }

  private var unstagedChangesSection: some View {
    VStack(alignment: .leading, spacing: 6) {
      HStack {
        SectionHeader(title: "Changes", count: gitStatus?.unstagedFiles.count ?? 0)
        Spacer()
        if let unstaged = gitStatus?.unstagedFiles, !unstaged.isEmpty {
          Button("Stage All") {
            _Concurrency.Task { await stageFiles([]) }
          }
          .font(.swarmMono(.micro))
          .foregroundStyle(.swarmGold)
          .buttonStyle(.plain)
        }
      }

      if let unstaged = gitStatus?.unstagedFiles, !unstaged.isEmpty {
        ForEach(unstaged) { file in
          HStack(spacing: 6) {
            Button {
              _Concurrency.Task { await stageFiles([file.path]) }
            } label: {
              Image(systemName: "plus.circle")
                .font(.swarm(.xs))
                .foregroundStyle(.swarmSuccess)
            }
            .buttonStyle(.plain)

            Text(file.path)
              .font(.swarmMono(.micro))
              .foregroundStyle(.swarmTextSecondary)
              .lineLimit(1)
              .onTapGesture {
                _Concurrency.Task { await showDiff(for: file.path, staged: false) }
              }

            Spacer()

            Button {
              _Concurrency.Task { await discardChanges([file.path]) }
            } label: {
              Image(systemName: "arrow.uturn.backward")
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextTertiary)
            }
            .buttonStyle(.plain)

            Text(file.unstagedStatus.rawValue)
              .font(.swarmMono(.micro))
              .foregroundStyle(.swarmWarning)
          }
          .padding(.vertical, 2)
        }
      } else {
        Text("Working tree clean")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)
          .padding(.vertical, 2)
      }
    }
  }

  private var untrackedChangesSection: some View {
    Group {
      if let untracked = gitStatus?.untrackedFiles, !untracked.isEmpty {
        VStack(alignment: .leading, spacing: 6) {
          HStack {
            SectionHeader(title: "Untracked", count: untracked.count)
            Spacer()
            Button("Stage All") {
              _Concurrency.Task { await stageFiles(untracked.map(\.path)) }
            }
            .font(.swarmMono(.micro))
            .foregroundStyle(.swarmGold)
            .buttonStyle(.plain)
          }

          ForEach(untracked) { file in
            HStack(spacing: 6) {
              Button {
                _Concurrency.Task { await stageFiles([file.path]) }
              } label: {
                Image(systemName: "plus.circle")
                  .font(.swarm(.xs))
                  .foregroundStyle(.swarmSuccess)
              }
              .buttonStyle(.plain)

              Text(file.path)
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextSecondary)
                .lineLimit(1)

              Spacer()

              Text("?")
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
            }
            .padding(.vertical, 2)
          }
        }
      }
    }
  }

  private var commitBoxView: some View {
    VStack(alignment: .leading, spacing: 6) {
      Text("Commit Message")
        .font(.swarm(.xs, weight: .medium))
        .foregroundStyle(.swarmTextSecondary)

      TextEditor(text: $commitMessage)
        .font(.swarmMono(.xs))
        .frame(height: 55)
        .scrollContentBackground(.hidden)
        .padding(6)
        .background(.swarmSurface)
        .cornerRadius(6)
        .overlay(
          RoundedRectangle(cornerRadius: 6)
            .stroke(Color.swarmBorderSubtle, lineWidth: 1)
        )

      HStack(spacing: 8) {
        Button {
          _Concurrency.Task { await commit(stageAll: false) }
        } label: {
          Text("Commit")
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmTextPrimary)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(.swarmSurfaceHover)
            .cornerRadius(6)
        }
        .buttonStyle(.plain)
        .disabled(commitMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)

        Button {
          _Concurrency.Task { await commit(stageAll: true) }
        } label: {
          Text("Commit All")
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmCanvas)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 6)
            .background(.swarmGold)
            .cornerRadius(6)
        }
        .buttonStyle(.plain)
        .disabled(commitMessage.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
      }
    }
    .padding(.top, 4)
  }

  private var syncControlsView: some View {
    HStack(spacing: 8) {
      Button {
        _Concurrency.Task { await pull() }
      } label: {
        Label("Pull", systemImage: "arrow.down")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextPrimary)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 6)
          .background(.swarmSurfaceHover)
          .cornerRadius(6)
      }
      .buttonStyle(.plain)

      Button {
        _Concurrency.Task { await push() }
      } label: {
        Label("Push", systemImage: "arrow.up")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextPrimary)
          .frame(maxWidth: .infinity)
          .padding(.vertical, 6)
          .background(.swarmSurfaceHover)
          .cornerRadius(6)
      }
      .buttonStyle(.plain)
    }
  }

  private func errorBanner(_ message: String) -> some View {
    HStack(spacing: 6) {
      Image(systemName: "exclamationmark.triangle.fill")
        .foregroundStyle(.swarmError)
        .font(.swarm(.xs))
      Text(message)
        .font(.swarm(.xs))
        .foregroundStyle(.swarmError)
        .lineLimit(2)
      Spacer()
      Button {
        errorMessage = nil
      } label: {
        Image(systemName: "xmark")
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
      }
      .buttonStyle(.plain)
    }
    .padding(8)
    .background(.swarmError.opacity(0.1))
    .cornerRadius(6)
  }

  private var diffSheetView: some View {
    VStack(alignment: .leading, spacing: 0) {
      HStack {
        Text("Diff: \(diffTitle)")
          .font(.swarm(.sm, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)
        Spacer()
        Button("Close") {
          showingDiffModal = false
        }
        .buttonStyle(.plain)
      }
      .padding(12)
      .background(.swarmSurface)

      Divider()

      ScrollView([.horizontal, .vertical]) {
        Text(diffContent.isEmpty ? "No changes to show." : diffContent)
          .font(.swarmMono(.xs))
          .foregroundStyle(.swarmTextSecondary)
          .padding(12)
          .frame(maxWidth: .infinity, alignment: .leading)
      }
      .background(.swarmCanvas)
    }
    .frame(minWidth: 500, minHeight: 400)
  }

  private var createBranchSheetView: some View {
    VStack(alignment: .leading, spacing: 14) {
      HStack(spacing: 8) {
        Image(systemName: "arrow.triangle.branch")
          .font(.swarm(.base))
          .foregroundStyle(.swarmGold)

        Text("Create New Branch")
          .font(.swarm(.sm, weight: .bold))
          .foregroundStyle(.swarmTextPrimary)
      }

      Text("Enter the name for the new branch to create and check out:")
        .font(.swarm(.xs))
        .foregroundStyle(.swarmTextSecondary)

      TextField("Branch name (e.g. feat/login-screen)", text: $newBranchName)
        .font(.swarmMono(.xs))
        .textFieldStyle(.roundedBorder)
        .onSubmit {
          createBranchAction()
        }

      HStack {
        Spacer()

        Button("Cancel") {
          isCreatingBranch = false
          newBranchName = ""
        }
        .buttonStyle(.plain)
        .foregroundStyle(.swarmTextSecondary)

        Button("Create & Checkout") {
          createBranchAction()
        }
        .buttonStyle(.borderedProminent)
        .tint(.swarmGold)
        .disabled(newBranchName.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
      }
    }
    .padding(20)
    .frame(width: 360)
    .background(.swarmCanvas)
  }

  private func createBranchAction() {
    let branch = newBranchName.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !branch.isEmpty else { return }
    isCreatingBranch = false
    newBranchName = ""
    _Concurrency.Task {
      do {
        try await GitService.shared.gitCheckout(at: repoPath, branch: branch, createNew: true)
        await refreshGit()
      } catch {
        errorMessage = error.localizedDescription
      }
    }
  }

  // MARK: - Actions

  private func refreshGit() async {
    isLoading = true
    errorMessage = nil
    do {
      let isRepo = await GitService.shared.isGitRepository(at: repoPath)
      guard isRepo else {
        errorMessage = "Directory is not a Git repository."
        isLoading = false
        return
      }
      let status = try await GitService.shared.gitStatus(at: repoPath)
      let branchList = try await GitService.shared.gitBranches(at: repoPath)
      gitStatus = status
      branches = branchList
      selectedBranch = status.branch
      appState.gitBranch = status.branch
    } catch {
      errorMessage = error.localizedDescription
    }
    isLoading = false
  }

  private func stageFiles(_ files: [String]) async {
    do {
      try await GitService.shared.gitAdd(at: repoPath, files: files)
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func unstageFiles(_ files: [String]) async {
    do {
      try await GitService.shared.gitReset(at: repoPath, files: files)
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func discardChanges(_ files: [String]) async {
    do {
      try await GitService.shared.gitDiscard(at: repoPath, files: files)
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func commit(stageAll: Bool) async {
    do {
      try await GitService.shared.gitCommit(at: repoPath, message: commitMessage, stageAll: stageAll)
      commitMessage = ""
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func push() async {
    do {
      try await GitService.shared.gitPush(at: repoPath)
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func pull() async {
    do {
      try await GitService.shared.gitPull(at: repoPath)
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func switchBranch(to branch: String) async {
    do {
      try await GitService.shared.gitCheckout(at: repoPath, branch: branch, createNew: false)
      await refreshGit()
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  private func showDiff(for file: String, staged: Bool) async {
    do {
      diffTitle = file
      diffContent = try await GitService.shared.gitDiff(at: repoPath, file: file, staged: staged)
      showingDiffModal = true
    } catch {
      errorMessage = error.localizedDescription
    }
  }
}

// MARK: - Reusable Section Components

struct SectionHeader: View {
  let title: String
  let count: Int

  var body: some View {
    HStack(spacing: 6) {
      Text(title)
        .font(.swarm(.xs, weight: .semibold))
        .foregroundStyle(.swarmTextSecondary)

      if count > 0 {
        Text("\(count)")
          .font(.swarmMono(.micro))
          .foregroundStyle(.swarmTextTertiary)
          .padding(.horizontal, 6)
          .padding(.vertical, 1)
          .background {
            RoundedRectangle(cornerRadius: 3)
              .fill(.swarmSurfaceHover)
          }
      }
    }
  }
}

struct SectionRow: View {
  let icon: String
  let color: Color
  let text: String

  var body: some View {
    HStack(spacing: 8) {
      Image(systemName: icon)
        .font(.swarm(.xs))
        .foregroundStyle(color)

      Text(text)
        .font(.swarmMono(.micro))
        .foregroundStyle(.swarmTextSecondary)
        .lineLimit(1)
    }
    .padding(.vertical, 2)
  }
}