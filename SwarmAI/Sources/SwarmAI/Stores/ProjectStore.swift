import SwiftUI

@Observable
final class ProjectStore {
 var openFiles: [String: [OpenFile]] = [:] // workspaceId -> files
 var activeFileId: String?

 struct OpenFile: Identifiable, Codable {
 let id: String
 let path: String
 let name: String
 let language: String
 let isModified: Bool
 }

 func openFile(_ path: String, workspaceId: UUID) {
 let name = URL(fileURLWithPath: path).lastPathComponent
 let language = languageForFile(path)
 let file = OpenFile(
 id: path,
 path: path,
 name: name,
 language: language,
 isModified: false
 )
 let key = workspaceId.uuidString
 if openFiles[key] == nil {
 openFiles[key] = []
 }
 if !openFiles[key]!.contains(where: { $0.id == path }) {
 openFiles[key]!.append(file)
 }
 activeFileId = path
 }

 func closeFile(_ path: String) {
 for (key, files) in openFiles {
 openFiles[key] = files.filter { $0.id != path }
 }
 if activeFileId == path { activeFileId = nil }
 }

 func setActiveFile(_ path: String) {
 activeFileId = path
 }

 func filesForWorkspace(_ workspaceId: UUID) -> [OpenFile] {
 openFiles[workspaceId.uuidString] ?? []
 }

 private func languageForFile(_ path: String) -> String {
 let ext = URL(fileURLWithPath: path).pathExtension.lowercased()
 switch ext {
 case "swift": return "Swift"
 case "ts", "tsx": return "TypeScript"
 case "js", "jsx": return "JavaScript"
 case "py": return "Python"
 case "rs": return "Rust"
 case "json": return "JSON"
 case "md": return "Markdown"
 case "yaml", "yml": return "YAML"
 default: return "Plain Text"
 }
 }
}
