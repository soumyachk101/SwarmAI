import SwiftUI

// MARK: - Explorer Tab

struct ExplorerTab: View {
 @State private var searchText = ""
 let files: [String] = [
 "Sources/",
 "Sources/App/MainWindow.swift",
 "Sources/Theme/Theme.swift",
 "Sources/Models/Agent.swift",
 "Sources/Stores/AgentsStore.swift",
 "Sources/SwarmMind/Orchestrator.swift",
 "Resources/Assets.xcassets/",
 "Package.swift",
 "README.md",
 ]

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Search bar
 HStack(spacing: 8) {
 Image(systemName: "magnifyingglass")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)

 TextField("Search files...", text: $searchText)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)
 .textFieldStyle(.plain)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background(.swarmSurface)

 Divider()
 .background(.swarmBorderSubtle)

 // File tree
 ScrollView {
 VStack(alignment: .leading, spacing: 0) {
 ForEach(filteredFiles, id: \.self) { file in
 FileTreeRow(fileName: file, depth: file.components(separatedBy: "/").count - 1)
 }
 }
 .padding(.horizontal, 8)
 .padding(.top, 4)
 }
 }
 .background(.swarmCanvas)
 }

 private var filteredFiles: [String] {
 if searchText.isEmpty { return files }
 return files.filter { $0.localizedCaseInsensitiveContains(searchText) }
 }
}

struct FileTreeRow: View {
 let fileName: String
 let depth: Int

 var body: some View {
 let isDirectory = fileName.hasSuffix("/")
 let nameOnly = String(fileName.split(separator: "/").last ?? "")

 HStack(spacing: 4) {
 Rectangle()
 .fill(Color.clear)
 .frame(width: CGFloat(depth) * 16)

 Image(systemName: isDirectory ? "folder.fill" : "doc.text.fill")
 .font(.swarm(.xs))
 .foregroundStyle(isDirectory ? .swarmGold : .swarmTextTertiary)

 Text(nameOnly)
 .font(.swarm(.xs))
 .foregroundStyle(isDirectory ? .swarmTextPrimary : .swarmTextSecondary)
 }
 .padding(.vertical, 2)
 }
}
