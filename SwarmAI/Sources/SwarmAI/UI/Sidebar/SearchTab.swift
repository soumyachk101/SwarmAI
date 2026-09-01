import SwiftUI

// MARK: - Search Tab

struct SearchTab: View {
 @State private var searchQuery: String = ""
 let searchResults: [SearchResult] = [
 SearchResult(file: "Sources/Models/Agent.swift", line: 12, text: "class Agent: Identifiable, Codable", type: .definition),
 SearchResult(file: "Sources/Stores/AgentsStore.swift", line: 8, text: "final class AgentsStore", type: .definition),
 SearchResult(file: "Sources/SwarmMind/Orchestrator.swift", line: 24, text: "func spawnAgent()", type: .reference),
 SearchResult(file: "Sources/App/MainWindow.swift", line: 45, text: "AgentsStore", type: .reference),
 SearchResult(file: "Sources/Theme/Theme.swift", line: 3, text: "struct Theme: Identifiable", type: .definition),
 ]

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Search input
 HStack(spacing: 8) {
 Image(systemName: "magnifyingglass")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)

 TextField("Search in workspace...", text: $searchQuery)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)
 .textFieldStyle(.plain)

 if !searchQuery.isEmpty {
 Button {
 searchQuery = ""
 } label: {
 Image(systemName: "xmark.circle.fill")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background(.swarmSurface)

 Divider()
 .background(.swarmBorderSubtle)

 // Results
 if searchQuery.isEmpty {
 ContentUnavailableView(
 "Search Your Workspace",
 systemImage: "magnifyingglass",
 description: Text("Enter a query to search across all files")
 )
 .padding(.top, 40)
 } else {
 ScrollView {
 VStack(alignment: .leading, spacing: 0) {
 ForEach(searchResults) { result in
 SearchResultRow(result: result)
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
 }
 .padding(.horizontal, 8)
 .padding(.top, 4)
 }
 }
 .background(.swarmCanvas)
 }
}

struct SearchResult: Identifiable {
 let id = UUID()
 let file: String
 let line: Int
 let text: String
 let type: SearchResultType
}

enum SearchResultType {
 case definition
 case reference
 case string
}

struct SearchResultRow: View {
 let result: SearchResult

 var body: some View {
 VStack(alignment: .leading, spacing: 2) {
 HStack(spacing: 6) {
 Text(result.file)
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)

 Spacer()

 Text("L\(result.line)")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 Text(result.text)
 .font(.swarmMono(.xs))
 .foregroundStyle(result.type == .definition ? .swarmGold : .swarmTextSecondary)
 .lineLimit(1)
 }
 .padding(.horizontal, 8)
 .padding(.vertical, 6)
 .contentShape(Rectangle())
 }
}
