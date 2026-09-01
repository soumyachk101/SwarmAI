import SwiftUI

// MARK: - Git Panel (Right Dock)

struct GitPanelView: View {
 @State private var commitMessage: String = ""

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 HStack {
 Text("Git Control")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)

 Divider()
 .background(.swarmBorderSubtle)

 ScrollView {
 VStack(spacing: 12) {
 // Branch & remote
 HStack(spacing: 8) {
 TextField("branch", text: .constant("main"))
 .font(.swarmMono(.xs))
 .textFieldStyle(.plain)
 .padding(6)
 .background(.swarmSurface)
 .cornerRadius(4)

 Button("Pull") { }
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 }

 // Staged changes
 SectionHeader(title: "Staged (0)")

 // Unstaged changes
 SectionHeader(title: "Unstaged (3)")
 GitFileRow(name: "Sources/Theme/Theme.swift", status: .modified)
 GitFileRow(name: "Sources/App/MainWindow.swift", status: .modified)
 GitFileRow(name: "Sources/Models/Agent.swift", status: .modified)

 // Untracked
 SectionHeader(title: "Untracked (1)")
 GitFileRow(name: "Sources/SwarmMind/", status: .untracked)

 // Commit
 VStack(alignment: .leading, spacing: 6) {
 Text("Commit Message")
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)

 TextEditor(text: $commitMessage)
 .font(.swarm(.sm))
 .frame(height: 60)
 .scrollContentBackground(.hidden)
 .padding(6)
 .background(.swarmSurface)
 .cornerRadius(6)

 Button("Commit & Push") { }
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmCanvas)
 .frame(maxWidth: .infinity)
 .padding(.vertical, 8)
 .background(.swarmGold)
 .cornerRadius(6)
 }
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 }
 .background(.swarmCanvas)
 }
}

struct GitFileRow: View {
 let name: String
 let status: GitFileStatus

 var body: some View {
 HStack(spacing: 8) {
 Image(systemName: status.icon)
 .font(.swarm(.xs))
 .foregroundStyle(status.color)

 Text(name)
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 .lineLimit(1)

 Spacer()
 }
 .padding(.horizontal, 4)
 .padding(.vertical, 2)
}

enum GitFileStatus {
 case modified, added, deleted, renamed, untracked

 var icon: String {
 switch self {
 case .modified: return "pencil"
 case .added: return "plus"
 case .deleted: return "minus"
 case .renamed: return "arrow.left.arrow.right"
 case .untracked: return "questionmark"
 }
 }

 var color: Color {
 switch self {
 case .modified: return .swarmWarning
 case .added: return .swarmSuccess
 case .deleted: return .swarmError
 case .renamed: return .swarmInfo
 case .untracked: return .swarmTextTertiary
 }
 }
}
