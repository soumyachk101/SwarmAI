import SwiftUI

// MARK: - Git Tab

struct GitTab: View {
 @Bindable var appState: AppState

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Branch info
 HStack(spacing: 8) {
 Image(systemName: "arrow.triangle.branch")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)

 Text("main")
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)

 Divider()
 .background(.swarmBorderSubtle)

 ScrollView {
 VStack(alignment: .leading, spacing: 12) {
 // Staged changes
 SectionHeader(title: "Staged Changes", count: 0)
 SectionRow(icon: "plus.circle.fill", color: .swarmSuccess, text: "No staged changes")

 // Unstaged changes
 SectionHeader(title: "Unstaged Changes", count: 3)
 SectionRow(icon: "circle", color: .swarmTextTertiary, text: "Sources/Theme/Theme.swift")
 SectionRow(icon: "circle", color: .swarmTextTertiary, text: "Sources/App/MainWindow.swift")
 SectionRow(icon: "circle", color: .swarmTextTertiary, text: "Sources/Models/Agent.swift")

 // Commit actions
 HStack(spacing: 8) {
 Button("Commit") {
 }
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmSurfaceHover)
 }

 Button("Push") {
 }
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmSurfaceHover)
 }
 }
 .padding(.top, 8)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 }
 }
 .background(.swarmCanvas)
 }
}

struct SectionHeader: View {
 let title: String
 let count: Int

 var body: some View {
 HStack {
 Text(title)
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextSecondary)

 if count > 0 {
 Text("\(count)")
 .font(.swarm(.micro))
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
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextSecondary)
 .lineLimit(1)
 }
 .padding(.horizontal, 4)
 .padding(.vertical, 2)
}
