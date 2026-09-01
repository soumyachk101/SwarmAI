import SwiftUI

// MARK: - Snippets Panel

struct SnippetsPanel: View {
 @State private var snippets: [Snippet] = [
 Snippet(title: "Git Status", category: "Git", content: "git status"),
 Snippet(title: "Git Diff", category: "Git", content: "git diff HEAD~1"),
 Snippet(title: "List Agents", category: "Swarm", content: "swarm agents list"),
 Snippet(title: "Dispatch Goal", category: "Swarm", content: "swarm dispatch 'refactor auth'"),
 Snippet(title: "Run Tests", category: "Build", content: "swift test"),
 ]
 @State private var selectedCategory: SnippetCategory = .all

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 HStack {
 Text("Snippets")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Button { } label: {
 Image(systemName: "plus")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmGold)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)

 Divider()
 .background(.swarmBorderSubtle)

 // Category filter
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 4) {
 ForEach(SnippetCategory.allCases) { cat in
 Button {
 selectedCategory = cat
 } label: {
 Text(cat.rawValue)
 .font(.swarm(.micro, weight: .medium))
 .foregroundStyle(selectedCategory == cat ? .swarmCanvas : .swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 3)
 .background {
 RoundedRectangle(cornerRadius: 4)
 .fill(selectedCategory == cat ? .swarmGold : .swarmSurface)
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 12)
 }
 }
 .padding(.vertical, 6)

 Divider()
 .background(.swarmBorderSubtle)

 // Snippet list
 ScrollView {
 VStack(spacing: 2) {
 ForEach(filteredSnippets) { snippet in
 SnippetRow(snippet: snippet)
 }
 }
 .padding(.horizontal, 8)
 .padding(.top, 4)
 }
 .background(.swarmCanvas)
 }
}

struct Snippet: Identifiable {
 let id = UUID()
 let title: String
 let category: SnippetCategory
 let content: String
}

enum SnippetCategory: String, CaseIterable, Identifiable {
 case all = "All"
 case git = "Git"
 case swarm = "Swarm"
 case build = "Build"

 var id: String { rawValue }
}

private extension SnippetsPanel {
 var filteredSnippets: [Snippet] {
 if selectedCategory == .all { return snippets }
 return snippets.filter { $0.category == selectedCategory }
 }
}

struct SnippetRow: View {
 let snippet: Snippet
 @State private var isCopied = false

 var body: some View {
 HStack(spacing: 8) {
 // Category color dot
 Circle()
 .fill(categoryColor)
 .frame(width: 6, height: 6)

 VStack(alignment: .leading, spacing: 1) {
 Text(snippet.title)
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(.swarmTextPrimary)

 Text(snippet.content)
 .font(.swarmMono(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .lineLimit(1)
 }

 Spacer()

 // Copy button
 Button {
 copyToClipboard(snippet.content)
 } label: {
 Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
 .font(.swarm(.xs))
 .foregroundStyle(isCopied ? .swarmSuccess : .swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 6)
 .background {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmSurface)
 }
 .overlay(alignment: .trailing) {
 if isCopied {
 Text("Copied!")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmSuccess)
 .padding(.trailing, 30)
 .transition(.opacity)
 }
 }
 }

 private var categoryColor: Color {
 switch snippet.category {
 case .git: return .swarmInfo
 case .swarm: return .swarmGold
 case .build: return .swarmSuccess
 case .all: return .swarmTextTertiary
 }
 }

 private func copyToClipboard(_ text: String) {
 #if os(macOS)
 NSPasteboard.general.clearContents()
 NSPasteboard.general.setString(text, forType: .string)
 #endif
 isCopied = true
 DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
 isCopied = false
 }
 }
}
