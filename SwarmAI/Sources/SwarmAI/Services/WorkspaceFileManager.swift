import Foundation
import SwiftUI
import AppKit

// MARK: - File Node Model

public struct FileNode: Identifiable, Hashable, Sendable {
  public let id: String
  public let name: String
  public let path: String
  public let relativePath: String
  public let isDirectory: Bool
  public let size: Int64
  public let modificationDate: Date?
  public let fileExtension: String
  public var children: [FileNode]?
  public var isExpanded: Bool

  public init(
    id: String? = nil,
    name: String,
    path: String,
    relativePath: String,
    isDirectory: Bool,
    size: Int64 = 0,
    modificationDate: Date? = nil,
    fileExtension: String = "",
    children: [FileNode]? = nil,
    isExpanded: Bool = false
  ) {
    self.id = id ?? path
    self.name = name
    self.path = path
    self.relativePath = relativePath
    self.isDirectory = isDirectory
    self.size = size
    self.modificationDate = modificationDate
    self.fileExtension = fileExtension.lowercased()
    self.children = children
    self.isExpanded = isExpanded
  }

  // MARK: - Display Properties

  public var iconName: String {
    if isDirectory {
      return isExpanded ? "folder.fill" : "folder"
    }

    switch fileExtension {
    case "swift":
      return "swift"
    case "ts", "tsx":
      return "curlybraces"
    case "js", "jsx", "mjs", "cjs":
      return "curlybraces"
    case "rs":
      return "gearshape.2.fill"
    case "py":
      return "chevron.left.forwardslash.chevron.right"
    case "json":
      return "curlybraces.square"
    case "md", "markdown":
      return "doc.richtext"
    case "png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "tiff", "heic":
      return "photo"
    case "html", "htm":
      return "safari"
    case "css", "scss", "sass", "less":
      return "paintbrush"
    case "sh", "bash", "zsh", "fish":
      return "terminal"
    case "toml", "yaml", "yml", "xml", "plist":
      return "slider.horizontal.3"
    case "c", "h":
      return "c.square"
    case "cpp", "cc", "cxx", "hpp":
      return "plus.square"
    case "go":
      return "g.square"
    case "java", "kt", "kts":
      return "cup.and.saucer.fill"
    case "sql", "sqlite", "db":
      return "cylinder.split.1x2"
    case "zip", "tar", "gz", "tgz", "7z", "rar":
      return "doc.zipper"
    case "pdf":
      return "doc.text.fill"
    case "txt", "log":
      return "doc.plaintext"
    case "env", "gitignore", "dockerignore", "gitattributes":
      return "gearshape"
    default:
      return "doc"
    }
  }

  public var iconColor: Color {
    if isDirectory {
      return .swarmGold
    }

    switch fileExtension {
    case "swift":
      return .orange
    case "ts", "tsx":
      return .blue
    case "js", "jsx":
      return .yellow
    case "rs":
      return .orange
    case "py":
      return .green
    case "json":
      return .yellow
    case "md", "markdown":
      return .purple
    case "png", "jpg", "jpeg", "gif", "svg", "webp":
      return .pink
    case "html", "htm":
      return .red
    case "css", "scss":
      return .cyan
    case "sh", "bash", "zsh":
      return .mint
    case "yaml", "yml", "toml", "xml", "plist":
      return .gray
    case "c", "cpp", "h", "hpp":
      return .indigo
    case "go":
      return .teal
    case "java", "kt":
      return .red
    case "sql", "sqlite":
      return .teal
    case "zip", "tar", "gz":
      return .brown
    case "pdf":
      return .red
    default:
      return .swarmTextSecondary
    }
  }

  public var formattedSize: String {
    if isDirectory {
      let count = children?.count ?? 0
      return "\(count) items"
    }
    let byteCountFormatter = ByteCountFormatter()
    byteCountFormatter.allowedUnits = [.useBytes, .useKB, .useMB, .useGB]
    byteCountFormatter.countStyle = .file
    return byteCountFormatter.string(fromByteCount: size)
  }

  public var formattedDate: String {
    guard let modificationDate else { return "" }
    let formatter = RelativeDateTimeFormatter()
    formatter.unitsStyle = .abbreviated
    return formatter.localizedString(for: modificationDate, relativeTo: Date())
  }
}

// MARK: - Search Result Model

public struct WorkspaceSearchResult: Identifiable, Hashable, Sendable {
  public let id = UUID()
  public let filePath: String
  public let relativePath: String
  public let fileName: String
  public let lineNumber: Int
  public let lineContent: String
  public let matchSubstring: String
  public let resultType: SearchResultType
  public let fileExtension: String

  public init(
    filePath: String,
    relativePath: String,
    fileName: String,
    lineNumber: Int,
    lineContent: String,
    matchSubstring: String,
    resultType: SearchResultType = .match,
    fileExtension: String = ""
  ) {
    self.filePath = filePath
    self.relativePath = relativePath
    self.fileName = fileName
    self.lineNumber = lineNumber
    self.lineContent = lineContent
    self.matchSubstring = matchSubstring
    self.resultType = resultType
    self.fileExtension = fileExtension.lowercased()
  }

  public var iconName: String {
    switch fileExtension {
    case "swift": return "swift"
    case "ts", "tsx", "js", "jsx": return "curlybraces"
    case "rs": return "gearshape.2.fill"
    case "py": return "chevron.left.forwardslash.chevron.right"
    case "json": return "curlybraces.square"
    case "md": return "doc.richtext"
    case "html": return "safari"
    case "css", "scss": return "paintbrush"
    case "sh", "bash", "zsh": return "terminal"
    default: return "doc.text"
    }
  }

  public var iconColor: Color {
    switch fileExtension {
    case "swift": return .orange
    case "ts", "tsx": return .blue
    case "js", "jsx": return .yellow
    case "rs": return .orange
    case "py": return .green
    case "json": return .yellow
    case "md": return .purple
    default: return .swarmTextSecondary
    }
  }
}

public enum SearchResultType: String, Codable, Sendable {
  case definition
  case reference
  case match
  case string
}

// MARK: - Workspace File Manager

@Observable
@MainActor
public final class WorkspaceFileManager {
  public static let shared = WorkspaceFileManager()

  // State
  public var rootNodes: [FileNode] = []
  public var isLoading: Bool = false
  public var isSearching: Bool = false
  public var searchResults: [WorkspaceSearchResult] = []
  public var expandedPaths: Set<String> = []
  public var selectedPath: String? = nil
  public var currentRootPath: String? = nil
  public var errorMessage: String? = nil
  public var showHiddenFiles: Bool = false
  public var filterText: String = ""

  // Ignored directory names for fast scanning & searching
  public static let defaultIgnoredDirectories: Set<String> = [
    ".git", ".build", "node_modules", ".DerivedData", ".swiftpm",
    ".Trash", ".DS_Store", "Pods", "target", "dist", "build",
    ".next", ".cache", ".idea", ".vscode", "xcuserdata"
  ]

  // Binary extensions to skip during text searches
  public static let binaryExtensions: Set<String> = [
    "png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp", "tiff", "heic",
    "zip", "tar", "gz", "tgz", "7z", "rar", "dmg", "iso", "pkg",
    "pdf", "exe", "dylib", "so", "a", "o", "class", "pyc", "wasm",
    "mp3", "wav", "aac", "flac", "mp4", "mov", "avi", "mkv",
    "db", "sqlite", "sqlite3", "bin", "dat", "car"
  ]

  private var searchTask: _Concurrency.Task<Void, Never>?

  public init() {}

  // MARK: - File Tree Scanning

  public func loadWorkspace(at rootPath: String) async {
    guard !rootPath.isEmpty else {
      rootNodes = []
      currentRootPath = nil
      return
    }

    currentRootPath = rootPath
    isLoading = true
    errorMessage = nil

    let path = rootPath
    let showHidden = showHiddenFiles
    let currentExpanded = expandedPaths

    let nodes = await _Concurrency.Task.detached(priority: .userInitiated) {
      Self.scanDirectory(at: path, rootPath: path, showHidden: showHidden, expandedPaths: currentExpanded)
    }.value

    self.rootNodes = nodes
    self.isLoading = false
  }

  public func refresh() async {
    guard let rootPath = currentRootPath else { return }
    await loadWorkspace(at: rootPath)
  }

  public func toggleExpanded(path: String) {
    if expandedPaths.contains(path) {
      expandedPaths.remove(path)
    } else {
      expandedPaths.insert(path)
    }
    // Update existing tree in-memory
    rootNodes = updateExpandedState(in: rootNodes, path: path, isExpanded: expandedPaths.contains(path))
  }

  public func isExpanded(path: String) -> Bool {
    expandedPaths.contains(path)
  }

  public func expandAll() {
    func collectDirPaths(nodes: [FileNode]) -> [String] {
      var paths: [String] = []
      for node in nodes where node.isDirectory {
        paths.append(node.path)
        if let children = node.children {
          paths.append(contentsOf: collectDirPaths(nodes: children))
        }
      }
      return paths
    }

    let allDirs = collectDirPaths(nodes: rootNodes)
    expandedPaths.formUnion(allDirs)
    rootNodes = setAllExpanded(in: rootNodes, expanded: true)
  }

  public func collapseAll() {
    expandedPaths.removeAll()
    rootNodes = setAllExpanded(in: rootNodes, expanded: false)
  }

  public func selectFile(path: String) {
    selectedPath = path
  }

  public func setShowHiddenFiles(_ show: Bool) async {
    showHiddenFiles = show
    if let root = currentRootPath {
      await loadWorkspace(at: root)
    }
  }

  // MARK: - Recursive Tree Builder

  private static func scanDirectory(
    at dirPath: String,
    rootPath: String,
    showHidden: Bool,
    expandedPaths: Set<String>,
    depth: Int = 0,
    maxDepth: Int = 10
  ) -> [FileNode] {
    guard depth <= maxDepth else { return [] }
    let fileManager = FileManager.default
    let url = URL(fileURLWithPath: dirPath)

    var isDir: ObjCBool = false
    guard fileManager.fileExists(atPath: dirPath, isDirectory: &isDir), isDir.boolValue else {
      return []
    }

    let resourceKeys: [URLResourceKey] = [
      .isDirectoryKey,
      .fileSizeKey,
      .contentModificationDateKey,
      .isHiddenKey
    ]

    guard let contents = try? fileManager.contentsOfDirectory(
      at: url,
      includingPropertiesForKeys: resourceKeys,
      options: showHidden ? [] : [.skipsHiddenFiles]
    ) else {
      return []
    }

    var nodes: [FileNode] = []

    for itemURL in contents {
      let itemName = itemURL.lastPathComponent

      // Skip ignored root/hidden folders
      if !showHidden && (itemName.hasPrefix(".") || defaultIgnoredDirectories.contains(itemName)) {
        continue
      }
      if defaultIgnoredDirectories.contains(itemName) {
        continue
      }

      let values = try? itemURL.resourceValues(forKeys: Set(resourceKeys))
      let isItemDir = values?.isDirectory ?? false
      let size = Int64(values?.fileSize ?? 0)
      let modDate = values?.contentModificationDate
      let fileExt = itemURL.pathExtension
      let itemPath = itemURL.path

      let relativePath: String
      if itemPath.hasPrefix(rootPath) {
        let trimmed = String(itemPath.dropFirst(rootPath.count))
        relativePath = trimmed.hasPrefix("/") ? String(trimmed.dropFirst()) : trimmed
      } else {
        relativePath = itemName
      }

      let isExpanded = expandedPaths.contains(itemPath)
      var children: [FileNode]? = nil

      if isItemDir {
        // Recursively load children
        children = scanDirectory(
          at: itemPath,
          rootPath: rootPath,
          showHidden: showHidden,
          expandedPaths: expandedPaths,
          depth: depth + 1,
          maxDepth: maxDepth
        )
      }

      let node = FileNode(
        name: itemName,
        path: itemPath,
        relativePath: relativePath,
        isDirectory: isItemDir,
        size: size,
        modificationDate: modDate,
        fileExtension: fileExt,
        children: children,
        isExpanded: isExpanded
      )
      nodes.append(node)
    }

    // Sort: directories first (alphabetical), then files (alphabetical)
    return nodes.sorted { a, b in
      if a.isDirectory != b.isDirectory {
        return a.isDirectory && !b.isDirectory
      }
      return a.name.localizedStandardCompare(b.name) == .orderedAscending
    }
  }

  private func updateExpandedState(in nodes: [FileNode], path: String, isExpanded: Bool) -> [FileNode] {
    nodes.map { node in
      var updated = node
      if updated.path == path {
        updated.isExpanded = isExpanded
      }
      if let children = updated.children {
        updated.children = updateExpandedState(in: children, path: path, isExpanded: isExpanded)
      }
      return updated
    }
  }

  private func setAllExpanded(in nodes: [FileNode], expanded: Bool) -> [FileNode] {
    nodes.map { node in
      var updated = node
      if updated.isDirectory {
        updated.isExpanded = expanded
      }
      if let children = updated.children {
        updated.children = setAllExpanded(in: children, expanded: expanded)
      }
      return updated
    }
  }

  // MARK: - Fast Workspace Search

  public func search(query: String, in rootPath: String? = nil, caseSensitive: Bool = false, maxResults: Int = 300) {
    searchTask?.cancel()

    let targetRoot = rootPath ?? currentRootPath
    guard let targetRoot, !targetRoot.isEmpty, !query.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
      searchResults = []
      isSearching = false
      return
    }

    isSearching = true
    let trimmedQuery = query.trimmingCharacters(in: .whitespacesAndNewlines)

    searchTask = _Concurrency.Task.detached(priority: .userInitiated) { [weak self] in
      let results = Self.performSearch(
        query: trimmedQuery,
        in: targetRoot,
        caseSensitive: caseSensitive,
        maxResults: maxResults
      )

      guard !_Concurrency.Task.isCancelled else { return }

      await MainActor.run {
        self?.searchResults = results
        self?.isSearching = false
      }
    }
  }

  public func cancelSearch() {
    searchTask?.cancel()
    searchTask = nil
    isSearching = false
  }

  private static func performSearch(
    query: String,
    in rootPath: String,
    caseSensitive: Bool,
    maxResults: Int
  ) -> [WorkspaceSearchResult] {
    let fileManager = FileManager.default
    let rootURL = URL(fileURLWithPath: rootPath)

    guard let enumerator = fileManager.enumerator(
      at: rootURL,
      includingPropertiesForKeys: [.isDirectoryKey, .fileSizeKey, .isRegularFileKey],
      options: [.skipsHiddenFiles, .skipsPackageDescendants]
    ) else {
      return []
    }

    var results: [WorkspaceSearchResult] = []
    let maxFileSize: Int64 = 3 * 1024 * 1024 // 3 MB max file search size

    for case let fileURL as URL in enumerator {
      guard results.count < maxResults else { break }

      let fileName = fileURL.lastPathComponent

      // Skip ignored directories
      if defaultIgnoredDirectories.contains(fileName) {
        enumerator.skipDescendants()
        continue
      }

      guard let resourceValues = try? fileURL.resourceValues(forKeys: [.isDirectoryKey, .fileSizeKey, .isRegularFileKey]),
            let isDir = resourceValues.isDirectory, !isDir,
            let isRegular = resourceValues.isRegularFile, isRegular else {
        continue
      }

      let ext = fileURL.pathExtension.lowercased()
      if binaryExtensions.contains(ext) {
        continue
      }

      let fileSize = Int64(resourceValues.fileSize ?? 0)
      if fileSize > maxFileSize {
        continue
      }

      let filePath = fileURL.path
      guard let content = try? String(contentsOfFile: filePath, encoding: .utf8) else {
        continue
      }

      let relativePath: String
      if filePath.hasPrefix(rootPath) {
        let trimmed = String(filePath.dropFirst(rootPath.count))
        relativePath = trimmed.hasPrefix("/") ? String(trimmed.dropFirst()) : trimmed
      } else {
        relativePath = fileName
      }

      let lines = content.components(separatedBy: .newlines)
      for (lineIndex, line) in lines.enumerated() {
        guard results.count < maxResults else { break }

        let matches: Bool
        if caseSensitive {
          matches = line.contains(query)
        } else {
          matches = line.localizedCaseInsensitiveContains(query)
        }

        if matches {
          let trimmedLine = line.trimmingCharacters(in: .whitespaces)
          let resultType = classifyLine(trimmedLine, query: query)

          let result = WorkspaceSearchResult(
            filePath: filePath,
            relativePath: relativePath,
            fileName: fileName,
            lineNumber: lineIndex + 1,
            lineContent: trimmedLine,
            matchSubstring: query,
            resultType: resultType,
            fileExtension: ext
          )
          results.append(result)
        }
      }
    }

    return results
  }

  private static func classifyLine(_ line: String, query: String) -> SearchResultType {
    let lower = line.lowercased()
    if lower.hasPrefix("func ") || lower.hasPrefix("def ") || lower.hasPrefix("fn ") ||
       lower.hasPrefix("class ") || lower.hasPrefix("struct ") || lower.hasPrefix("enum ") ||
       lower.hasPrefix("protocol ") || lower.hasPrefix("interface ") || lower.hasPrefix("type ") ||
       lower.hasPrefix("export class ") || lower.hasPrefix("export function ") || lower.hasPrefix("export const ") {
      return .definition
    } else if lower.contains("\"\(query.lowercased())\"") || lower.contains("'\(query.lowercased())'") || lower.contains("`\(query.lowercased())`") {
      return .string
    } else {
      return .reference
    }
  }

  // MARK: - File System Operations

  public func readFile(at path: String) throws -> String {
    try String(contentsOfFile: path, encoding: .utf8)
  }

  public func writeFile(at path: String, content: String) throws {
    try content.write(toFile: path, atomically: true, encoding: .utf8)
  }

  public func createFile(at parentPath: String, name: String, initialContent: String = "") throws -> String {
    let fullPath = (parentPath as NSString).appendingPathComponent(name)
    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: fullPath) {
      throw NSError(domain: "WorkspaceFileManager", code: 409, userInfo: [NSLocalizedDescriptionKey: "File already exists at \(fullPath)"])
    }
    try initialContent.write(toFile: fullPath, atomically: true, encoding: .utf8)
    return fullPath
  }

  public func createFolder(at parentPath: String, name: String) throws -> String {
    let fullPath = (parentPath as NSString).appendingPathComponent(name)
    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: fullPath) {
      throw NSError(domain: "WorkspaceFileManager", code: 409, userInfo: [NSLocalizedDescriptionKey: "Folder already exists at \(fullPath)"])
    }
    try fileManager.createDirectory(atPath: fullPath, withIntermediateDirectories: true, attributes: nil)
    return fullPath
  }

  public func deleteItem(at path: String) throws {
    let fileManager = FileManager.default
    if fileManager.fileExists(atPath: path) {
      try fileManager.removeItem(atPath: path)
    }
  }

  public func renameItem(at path: String, to newName: String) throws -> String {
    let parent = (path as NSString).deletingLastPathComponent
    let newPath = (parent as NSString).appendingPathComponent(newName)
    let fileManager = FileManager.default
    try fileManager.moveItem(atPath: path, toPath: newPath)
    return newPath
  }

  public func duplicateItem(at path: String) throws -> String {
    let parent = (path as NSString).deletingLastPathComponent
    let ext = (path as NSString).pathExtension
    let base = ((path as NSString).deletingPathExtension as NSString).lastPathComponent
    let newName = ext.isEmpty ? "\(base) copy" : "\(base) copy.\(ext)"
    let newPath = (parent as NSString).appendingPathComponent(newName)
    let fileManager = FileManager.default
    try fileManager.copyItem(atPath: path, toPath: newPath)
    return newPath
  }

  public func revealInFinder(path: String) {
    let url = URL(fileURLWithPath: path)
    NSWorkspace.shared.activateFileViewerSelecting([url])
  }

  public func openWithDefaultApp(path: String) {
    let url = URL(fileURLWithPath: path)
    NSWorkspace.shared.open(url)
  }

  public func copyPathToClipboard(path: String, relative: Bool = false, rootPath: String? = nil) {
    let pasteboard = NSPasteboard.general
    pasteboard.clearContents()
    if relative, let root = rootPath ?? currentRootPath, path.hasPrefix(root) {
      let trimmed = String(path.dropFirst(root.count))
      let rel = trimmed.hasPrefix("/") ? String(trimmed.dropFirst()) : trimmed
      pasteboard.setString(rel, forType: .string)
    } else {
      pasteboard.setString(path, forType: .string)
    }
  }
}
