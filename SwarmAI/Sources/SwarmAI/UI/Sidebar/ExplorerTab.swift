import SwiftUI
import AppKit

// MARK: - Explorer Tab

struct ExplorerTab: View {
  @Environment(\.workspaceStore) private var workspaceStore
  @Environment(\.projectStore) private var projectStore
  @State private var fileManager = WorkspaceFileManager.shared
  @State private var searchText = ""
  @State private var showingNewFileDialog = false
  @State private var showingNewFolderDialog = false
  @State private var newItemName = ""
  @State private var targetParentPath: String = ""

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header & Actions Bar
      HStack(spacing: 6) {
        Text("EXPLORER")
          .font(.swarm(.xs, weight: .bold))
          .foregroundStyle(.swarmTextTertiary)

        Spacer()

        // New File
        Button {
          targetParentPath = currentRootPath
          newItemName = ""
          showingNewFileDialog = true
        } label: {
          Image(systemName: "doc.badge.plus")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextSecondary)
        }
        .buttonStyle(.plain)
        .help("New File")

        // New Folder
        Button {
          targetParentPath = currentRootPath
          newItemName = ""
          showingNewFolderDialog = true
        } label: {
          Image(systemName: "folder.badge.plus")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextSecondary)
        }
        .buttonStyle(.plain)
        .help("New Folder")

        // Refresh
        Button {
          _Concurrency.Task {
            await fileManager.refresh()
          }
        } label: {
          Image(systemName: "arrow.clockwise")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextSecondary)
        }
        .buttonStyle(.plain)
        .help("Refresh Explorer")

        // Collapse All
        Button {
          withAnimation(.swarmQuick) {
            fileManager.collapseAll()
          }
        } label: {
          Image(systemName: "arrow.up.and.line.horizontal.and.arrow.down")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextSecondary)
        }
        .buttonStyle(.plain)
        .help("Collapse All Folders")
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(.swarmSurface)

      Divider()
        .background(.swarmBorderSubtle)

      // Search / Filter bar
      HStack(spacing: 8) {
        Image(systemName: "magnifyingglass")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)

        TextField("Filter files...", text: $searchText)
          .font(.swarm(.sm))
          .foregroundStyle(.swarmTextPrimary)
          .textFieldStyle(.plain)

        if !searchText.isEmpty {
          Button {
            searchText = ""
          } label: {
            Image(systemName: "xmark.circle.fill")
              .font(.swarm(.xs))
              .foregroundStyle(.swarmTextTertiary)
          }
          .buttonStyle(.plain)
        }
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 6)
      .background(.swarmCanvas)

      Divider()
        .background(.swarmBorderSubtle)

      // Workspace Root Title
      if let activeWs = workspaceStore.activeWorkspace {
        HStack(spacing: 6) {
          Image(systemName: "folder.fill")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmGold)

          Text(activeWs.name.uppercased())
            .font(.swarm(.micro, weight: .bold))
            .foregroundStyle(.swarmTextPrimary)
            .lineLimit(1)

          Spacer()

          Text("\(fileManager.rootNodes.count) items")
            .font(.swarm(.micro))
            .foregroundStyle(.swarmTextTertiary)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.swarmSurface.opacity(0.5))

        Divider()
          .background(.swarmBorderSubtle)
      }

      // Content
      if fileManager.isLoading {
        VStack(spacing: 12) {
          Spacer()
          ProgressView()
            .controlSize(.small)
          Text("Scanning workspace...")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
          Spacer()
        }
        .frame(maxWidth: .infinity)
      } else if filteredNodes.isEmpty {
        VStack(spacing: 12) {
          Spacer()
          Image(systemName: searchText.isEmpty ? "folder.badge.questionmark" : "doc.text.magnifyingglass")
            .font(.system(size: 28))
            .foregroundStyle(.swarmTextTertiary)

          Text(searchText.isEmpty ? "No files found in workspace" : "No matches for \"\(searchText)\"")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
            .multilineTextAlignment(.center)

          if searchText.isEmpty, let activeWs = workspaceStore.activeWorkspace {
            Button("Scan \(activeWs.name)") {
              _Concurrency.Task {
                await fileManager.loadWorkspace(at: activeWs.path)
              }
            }
            .buttonStyle(.borderedProminent)
            .tint(.swarmGold)
            .controlSize(.small)
          }
          Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity)
      } else {
        ScrollView {
          LazyVStack(alignment: .leading, spacing: 1) {
            ForEach(filteredNodes) { node in
              FileTreeItemView(
                node: node,
                depth: 0,
                selectedPath: fileManager.selectedPath,
                onSelect: { selected in
                  handleNodeSelection(selected)
                },
                onToggleExpand: { dirNode in
                  withAnimation(.swarmQuick) {
                    fileManager.toggleExpanded(path: dirNode.path)
                  }
                },
                onNewFileInFolder: { folderPath in
                  targetParentPath = folderPath
                  newItemName = ""
                  showingNewFileDialog = true
                },
                onNewFolderInFolder: { folderPath in
                  targetParentPath = folderPath
                  newItemName = ""
                  showingNewFolderDialog = true
                }
              )
            }
          }
          .padding(.vertical, 4)
        }
      }
    }
    .background(.swarmCanvas)
    .task(id: workspaceStore.activeWorkspaceId) {
      if let activeWs = workspaceStore.activeWorkspace {
        await fileManager.loadWorkspace(at: activeWs.path)
      }
    }
    .sheet(isPresented: $showingNewFileDialog) {
      NewItemSheet(
        title: "New File",
        prompt: "Enter file name (e.g. Service.swift):",
        icon: "doc.badge.plus",
        itemName: $newItemName,
        onConfirm: {
          createNewFile()
        }
      )
    }
    .sheet(isPresented: $showingNewFolderDialog) {
      NewItemSheet(
        title: "New Folder",
        prompt: "Enter folder name:",
        icon: "folder.badge.plus",
        itemName: $newItemName,
        onConfirm: {
          createNewFolder()
        }
      )
    }
  }

  private var currentRootPath: String {
    workspaceStore.activeWorkspace?.path ?? NSHomeDirectory()
  }

  private var filteredNodes: [FileNode] {
    if searchText.isEmpty {
      return fileManager.rootNodes
    }
    return filterNodes(fileManager.rootNodes, query: searchText)
  }

  private func filterNodes(_ nodes: [FileNode], query: String) -> [FileNode] {
    var matching: [FileNode] = []
    for node in nodes {
      if node.isDirectory {
        let matchingChildren = filterNodes(node.children ?? [], query: query)
        if !matchingChildren.isEmpty || node.name.localizedCaseInsensitiveContains(query) {
          var copy = node
          copy.children = matchingChildren
          copy.isExpanded = true
          matching.append(copy)
        }
      } else if node.name.localizedCaseInsensitiveContains(query) {
        matching.append(node)
      }
    }
    return matching
  }

  private func handleNodeSelection(_ node: FileNode) {
    fileManager.selectFile(path: node.path)
    if node.isDirectory {
      withAnimation(.swarmQuick) {
        fileManager.toggleExpanded(path: node.path)
      }
    } else {
      if let activeId = workspaceStore.activeWorkspaceId {
        projectStore.openFile(node.path, workspaceId: activeId)
      }
    }
  }

  private func createNewFile() {
    guard !newItemName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
    let parent = targetParentPath.isEmpty ? currentRootPath : targetParentPath
    do {
      let createdPath = try fileManager.createFile(at: parent, name: newItemName.trimmingCharacters(in: .whitespaces))
      _Concurrency.Task {
        await fileManager.refresh()
        if let activeId = workspaceStore.activeWorkspaceId {
          projectStore.openFile(createdPath, workspaceId: activeId)
        }
      }
    } catch {
      fileManager.errorMessage = error.localizedDescription
    }
  }

  private func createNewFolder() {
    guard !newItemName.trimmingCharacters(in: .whitespaces).isEmpty else { return }
    let parent = targetParentPath.isEmpty ? currentRootPath : targetParentPath
    do {
      _ = try fileManager.createFolder(at: parent, name: newItemName.trimmingCharacters(in: .whitespaces))
      _Concurrency.Task {
        await fileManager.refresh()
      }
    } catch {
      fileManager.errorMessage = error.localizedDescription
    }
  }
}

// MARK: - Recursive File Tree Item View

struct FileTreeItemView: View {
  let node: FileNode
  let depth: Int
  let selectedPath: String?
  let onSelect: (FileNode) -> Void
  let onToggleExpand: (FileNode) -> Void
  let onNewFileInFolder: (String) -> Void
  let onNewFolderInFolder: (String) -> Void

  @State private var isHovered = false

  var isSelected: Bool {
    selectedPath == node.path
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Row Content
      HStack(spacing: 6) {
        // Indentation
        if depth > 0 {
          Spacer()
            .frame(width: CGFloat(depth) * 14)
        }

        // Folder Chevron
        if node.isDirectory {
          Button {
            onToggleExpand(node)
          } label: {
            Image(systemName: "chevron.right")
              .font(.system(size: 9, weight: .bold))
              .foregroundStyle(.swarmTextTertiary)
              .rotationEffect(.degrees(node.isExpanded ? 90 : 0))
              .animation(.swarmQuick, value: node.isExpanded)
              .frame(width: 12, height: 12)
          }
          .buttonStyle(.plain)
        } else {
          Spacer()
            .frame(width: 12)
        }

        // Icon
        Image(systemName: node.iconName)
          .font(.system(size: 13))
          .foregroundStyle(node.iconColor)
          .frame(width: 16)

        // Name
        Text(node.name)
          .font(.swarm(.xs))
          .foregroundStyle(isSelected ? .swarmGold : (node.isDirectory ? .swarmTextPrimary : .swarmTextSecondary))
          .lineLimit(1)
          .truncationMode(.middle)

        Spacer()

        // Size / Badge on hover
        if isHovered && !node.isDirectory {
          Text(node.formattedSize)
            .font(.swarm(.micro))
            .foregroundStyle(.swarmTextTertiary)
        }
      }
      .padding(.horizontal, 8)
      .padding(.vertical, 3)
      .contentShape(Rectangle())
      .background {
        if isSelected {
          RoundedRectangle(cornerRadius: 4)
            .fill(Color.swarmGold.opacity(0.18))
            .padding(.horizontal, 4)
        } else if isHovered {
          RoundedRectangle(cornerRadius: 4)
            .fill(Color.swarmSurfaceHover)
            .padding(.horizontal, 4)
        }
      }
      .onHover { hovering in
        isHovered = hovering
      }
      .onTapGesture {
        onSelect(node)
      }
      .contextMenu {
        if node.isDirectory {
          Button("New File Here...") {
            onNewFileInFolder(node.path)
          }
          Button("New Folder Here...") {
            onNewFolderInFolder(node.path)
          }
          Divider()
        }

        Button("Reveal in Finder") {
          WorkspaceFileManager.shared.revealInFinder(path: node.path)
        }

        Button("Open with Default Application") {
          WorkspaceFileManager.shared.openWithDefaultApp(path: node.path)
        }

        Divider()

        Button("Copy Path") {
          WorkspaceFileManager.shared.copyPathToClipboard(path: node.path, relative: false)
        }

        Button("Copy Relative Path") {
          WorkspaceFileManager.shared.copyPathToClipboard(path: node.path, relative: true)
        }

        Divider()

        Button("Duplicate") {
          _ = try? WorkspaceFileManager.shared.duplicateItem(at: node.path)
          _Concurrency.Task {
            await WorkspaceFileManager.shared.refresh()
          }
        }

        Button("Delete", role: .destructive) {
          try? WorkspaceFileManager.shared.deleteItem(at: node.path)
          _Concurrency.Task {
            await WorkspaceFileManager.shared.refresh()
          }
        }
      }

      // Render Children if Expanded
      if node.isDirectory && node.isExpanded, let children = node.children {
        ForEach(children) { child in
          FileTreeItemView(
            node: child,
            depth: depth + 1,
            selectedPath: selectedPath,
            onSelect: onSelect,
            onToggleExpand: onToggleExpand,
            onNewFileInFolder: onNewFileInFolder,
            onNewFolderInFolder: onNewFolderInFolder
          )
        }
      }
    }
  }
}

// MARK: - New Item Dialog Sheet

struct NewItemSheet: View {
  let title: String
  let prompt: String
  let icon: String
  @Binding var itemName: String
  let onConfirm: () -> Void
  @Environment(\.dismiss) private var dismiss

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      HStack(spacing: 8) {
        Image(systemName: icon)
          .font(.swarm(.base))
          .foregroundStyle(.swarmGold)

        Text(title)
          .font(.swarm(.sm, weight: .bold))
          .foregroundStyle(.swarmTextPrimary)
      }

      Text(prompt)
        .font(.swarm(.xs))
        .foregroundStyle(.swarmTextSecondary)

      TextField("Name", text: $itemName)
        .font(.swarm(.sm))
        .textFieldStyle(.roundedBorder)
        .onSubmit {
          onConfirm()
          dismiss()
        }

      HStack {
        Spacer()

        Button("Cancel") {
          dismiss()
        }
        .buttonStyle(.plain)
        .foregroundStyle(.swarmTextSecondary)

        Button("Create") {
          onConfirm()
          dismiss()
        }
        .buttonStyle(.borderedProminent)
        .tint(.swarmGold)
        .disabled(itemName.trimmingCharacters(in: .whitespaces).isEmpty)
      }
    }
    .padding(20)
    .frame(width: 320)
    .background(.swarmCanvas)
  }
}
