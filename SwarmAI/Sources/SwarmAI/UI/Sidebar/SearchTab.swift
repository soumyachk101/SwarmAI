import SwiftUI
import AppKit

// MARK: - Search Tab

struct SearchTab: View {
  @Environment(\.workspaceStore) private var workspaceStore
  @Environment(\.projectStore) private var projectStore
  @State private var fileManager = WorkspaceFileManager.shared
  @State private var searchQuery: String = ""
  @State private var caseSensitive: Bool = false
  @State private var collapsedFiles: Set<String> = []

  var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header
      HStack(spacing: 6) {
        Text("SEARCH")
          .font(.swarm(.xs, weight: .bold))
          .foregroundStyle(.swarmTextTertiary)

        Spacer()

        if !fileManager.searchResults.isEmpty {
          Text("\(fileManager.searchResults.count) results")
            .font(.swarm(.micro))
            .foregroundStyle(.swarmGold)
        }

        // Match case toggle
        Button {
          caseSensitive.toggle()
          executeSearch()
        } label: {
          Text("Aa")
            .font(.system(size: 11, weight: .bold, design: .monospaced))
            .foregroundStyle(caseSensitive ? .swarmGold : .swarmTextTertiary)
            .padding(.horizontal, 4)
            .padding(.vertical, 2)
            .background {
              if caseSensitive {
                RoundedRectangle(cornerRadius: 3)
                  .fill(Color.swarmGold.opacity(0.2))
              }
            }
        }
        .buttonStyle(.plain)
        .help("Match Case")

        // Clear button
        if !searchQuery.isEmpty {
          Button {
            searchQuery = ""
            fileManager.cancelSearch()
            fileManager.searchResults = []
          } label: {
            Image(systemName: "xmark.circle.fill")
              .font(.swarm(.xs))
              .foregroundStyle(.swarmTextTertiary)
          }
          .buttonStyle(.plain)
          .help("Clear Search")
        }
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(.swarmSurface)

      Divider()
        .background(.swarmBorderSubtle)

      // Search input box
      HStack(spacing: 8) {
        Image(systemName: "magnifyingglass")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)

        TextField("Search in workspace...", text: $searchQuery)
          .font(.swarm(.sm))
          .foregroundStyle(.swarmTextPrimary)
          .textFieldStyle(.plain)
          .onSubmit {
            executeSearch()
          }

        if fileManager.isSearching {
          ProgressView()
            .controlSize(.mini)
        }
      }
      .padding(.horizontal, 12)
      .padding(.vertical, 8)
      .background(.swarmCanvas)

      Divider()
        .background(.swarmBorderSubtle)

      // Results Content
      if searchQuery.trimmingCharacters(in: .whitespaces).isEmpty {
        VStack(spacing: 12) {
          Spacer()
          Image(systemName: "text.magnifyingglass")
            .font(.system(size: 32))
            .foregroundStyle(.swarmTextTertiary)

          Text("Search Your Workspace")
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmTextPrimary)

          Text("Find symbols, functions, text, and references across all files in your workspace.")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
            .multilineTextAlignment(.center)
            .padding(.horizontal, 16)
          Spacer()
        }
        .frame(maxWidth: .infinity)
      } else if fileManager.isSearching && fileManager.searchResults.isEmpty {
        VStack(spacing: 12) {
          Spacer()
          ProgressView()
            .controlSize(.small)
          Text("Searching across files...")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
          Spacer()
        }
        .frame(maxWidth: .infinity)
      } else if fileManager.searchResults.isEmpty {
        VStack(spacing: 12) {
          Spacer()
          Image(systemName: "slash.circle")
            .font(.system(size: 28))
            .foregroundStyle(.swarmTextTertiary)

          Text("No results found")
            .font(.swarm(.sm, weight: .medium))
            .foregroundStyle(.swarmTextPrimary)

          Text("No files matched \"\(searchQuery)\"")
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextTertiary)
          Spacer()
        }
        .padding(16)
        .frame(maxWidth: .infinity)
      } else {
        // Grouped Results List
        ScrollView {
          LazyVStack(alignment: .leading, spacing: 6) {
            ForEach(groupedResults, id: \.filePath) { group in
              SearchFileGroupView(
                filePath: group.filePath,
                relativePath: group.relativePath,
                fileName: group.fileName,
                results: group.results,
                isCollapsed: collapsedFiles.contains(group.filePath),
                searchQuery: searchQuery,
                onToggleCollapse: {
                  if collapsedFiles.contains(group.filePath) {
                    collapsedFiles.remove(group.filePath)
                  } else {
                    collapsedFiles.insert(group.filePath)
                  }
                },
                onSelectResult: { result in
                  openSearchResult(result)
                }
              )
            }
          }
          .padding(.horizontal, 6)
          .padding(.vertical, 8)
        }
      }
    }
    .background(.swarmCanvas)
    .onChange(of: searchQuery) { _, _ in
      executeSearch()
    }
  }

  private var currentRootPath: String {
    workspaceStore.activeWorkspace?.path ?? NSHomeDirectory()
  }

  private func executeSearch() {
    let trimmed = searchQuery.trimmingCharacters(in: .whitespaces)
    guard !trimmed.isEmpty else {
      fileManager.searchResults = []
      fileManager.cancelSearch()
      return
    }
    fileManager.search(query: trimmed, in: currentRootPath, caseSensitive: caseSensitive)
  }

  private func openSearchResult(_ result: WorkspaceSearchResult) {
    fileManager.selectFile(path: result.filePath)
    if let activeId = workspaceStore.activeWorkspaceId {
      projectStore.openFile(result.filePath, workspaceId: activeId)
    }
  }

  private struct FileGroup: Identifiable {
    var id: String { filePath }
    let filePath: String
    let relativePath: String
    let fileName: String
    let results: [WorkspaceSearchResult]
  }

  private var groupedResults: [FileGroup] {
    let grouped = Dictionary(grouping: fileManager.searchResults, by: { $0.filePath })
    return grouped.compactMap { filePath, results in
      guard let first = results.first else { return nil }
      let sortedResults = results.sorted(by: { $0.lineNumber < $1.lineNumber })
      return FileGroup(
        filePath: filePath,
        relativePath: first.relativePath,
        fileName: first.fileName,
        results: sortedResults
      )
    }.sorted { $0.relativePath.localizedStandardCompare($1.relativePath) == .orderedAscending }
  }
}

// MARK: - Grouped File Search Results View

struct SearchFileGroupView: View {
  let filePath: String
  let relativePath: String
  let fileName: String
  let results: [WorkspaceSearchResult]
  let isCollapsed: Bool
  let searchQuery: String
  let onToggleCollapse: () -> Void
  let onSelectResult: (WorkspaceSearchResult) -> Void

  @State private var isHeaderHovered = false

  var body: some View {
    VStack(alignment: .leading, spacing: 2) {
      // File Header
      HStack(spacing: 6) {
        Button {
          withAnimation(.swarmQuick) {
            onToggleCollapse()
          }
        } label: {
          Image(systemName: "chevron.right")
            .font(.system(size: 9, weight: .bold))
            .foregroundStyle(.swarmTextTertiary)
            .rotationEffect(.degrees(isCollapsed ? 0 : 90))
            .frame(width: 12, height: 12)
        }
        .buttonStyle(.plain)

        if let first = results.first {
          Image(systemName: first.iconName)
            .font(.system(size: 12))
            .foregroundStyle(first.iconColor)
        }

        Text(fileName)
          .font(.swarm(.xs, weight: .semibold))
          .foregroundStyle(.swarmTextPrimary)

        Text(relativePath)
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
          .lineLimit(1)
          .truncationMode(.head)

        Spacer()

        Text("\(results.count)")
          .font(.swarm(.micro, weight: .bold))
          .foregroundStyle(.swarmGold)
          .padding(.horizontal, 5)
          .padding(.vertical, 1)
          .background(Color.swarmGold.opacity(0.15))
          .clipShape(Capsule())
      }
      .padding(.horizontal, 6)
      .padding(.vertical, 4)
      .background {
        if isHeaderHovered {
          RoundedRectangle(cornerRadius: 4)
            .fill(Color.swarmSurfaceHover)
        }
      }
      .onHover { isHeaderHovered = $0 }
      .onTapGesture {
        withAnimation(.swarmQuick) {
          onToggleCollapse()
        }
      }
      .contextMenu {
        Button("Reveal in Finder") {
          WorkspaceFileManager.shared.revealInFinder(path: filePath)
        }
        Button("Copy Path") {
          WorkspaceFileManager.shared.copyPathToClipboard(path: filePath, relative: false)
        }
        Button("Copy Relative Path") {
          WorkspaceFileManager.shared.copyPathToClipboard(path: filePath, relative: true)
        }
      }

      // Result Items
      if !isCollapsed {
        VStack(alignment: .leading, spacing: 1) {
          ForEach(results) { result in
            SearchResultLineRow(
              result: result,
              searchQuery: searchQuery,
              onSelect: {
                onSelectResult(result)
              }
            )
          }
        }
        .padding(.leading, 18)
      }
    }
  }
}

// MARK: - Single Search Result Line Row

struct SearchResultLineRow: View {
  let result: WorkspaceSearchResult
  let searchQuery: String
  let onSelect: () -> Void
  @State private var isHovered = false

  var body: some View {
    Button {
      onSelect()
    } label: {
      HStack(alignment: .top, spacing: 6) {
        // Line number badge
        Text("\(result.lineNumber)")
          .font(.swarmMono(.micro))
          .foregroundStyle(.swarmTextTertiary)
          .frame(minWidth: 26, alignment: .trailing)

        // Line content with highlighted search query
        highlightedText(content: result.lineContent, query: searchQuery)
          .font(.swarmMono(.xs))
          .lineLimit(2)
          .truncationMode(.tail)
          .frame(maxWidth: .infinity, alignment: .leading)
      }
      .padding(.horizontal, 6)
      .padding(.vertical, 3)
      .background {
        if isHovered {
          RoundedRectangle(cornerRadius: 4)
            .fill(Color.swarmSurfaceHover)
        }
      }
    }
    .buttonStyle(.plain)
    .onHover { isHovered = $0 }
  }

  @ViewBuilder
  private func highlightedText(content: String, query: String) -> some View {
    if query.isEmpty {
      Text(content)
        .foregroundStyle(.swarmTextSecondary)
    } else {
      let lowerContent = content.lowercased()
      let lowerQuery = query.lowercased()

      if let range = lowerContent.range(of: lowerQuery) {
        let prefix = String(content[..<range.lowerBound])
        let match = String(content[range])
        let suffix = String(content[range.upperBound...])

        HStack(spacing: 0) {
          Text(prefix)
            .foregroundStyle(.swarmTextSecondary)
          Text(match)
            .foregroundStyle(.black)
            .background(Color.swarmGold.clipShape(RoundedRectangle(cornerRadius: 2)))
            .bold()
          Text(suffix)
            .foregroundStyle(.swarmTextSecondary)
        }
      } else {
        Text(content)
          .foregroundStyle(.swarmTextSecondary)
      }
    }
  }
}
