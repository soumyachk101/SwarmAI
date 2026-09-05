import SwiftUI

// MARK: - Toolbox Pane View

public struct ToolboxPaneView: View {
 @Environment(\.themeStore) private var themeStore
 @Environment(\.accessibilityReduceMotion) private var reduceMotion

 @State private var contentAppeared: Bool = false
 @State private var searchText: String = ""
 @State private var selectedCategory: ToolCategory = .all

 public init() {}

 public var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 headerView

 ScrollView {
 VStack(alignment: .leading, spacing: 12) {
 searchBar

 categoryFilter

 toolsGrid
 }
 .padding(12)
 }
 }
 .background(.swarmCanvas)
 .onAppear {
 withAnimation(.easeOut(duration: 0.35).delay(0.1)) {
 contentAppeared = true
 }
 }
 }

 // MARK: - Header

 private var headerView: some View {
 HStack {
 Text("Toolbox")
 .font(.swarm(.lg, weight: .bold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Text("\(filteredTools.count) tools")
 .font(.swarm(.xs, weight: .medium))
 .foregroundStyle(.swarmTextSecondary)
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)
 .background(.swarmSurface.opacity(0.6))
 .overlay(
 Rectangle()
 .fill(.swarmBorder.opacity(0.4))
 .frame(height: 1),
 alignment: .bottom
 )
 }

 // MARK: - Search Bar

 private var searchBar: some View {
 HStack(spacing: 8) {
 Image(systemName: "magnifyingglass")
 .font(.system(size: 13))
 .foregroundStyle(.swarmTextSecondary)

 TextField("Search tools...", text: $searchText)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextPrimary)
 .textFieldStyle(.plain)

 if !searchText.isEmpty {
 Button {
 withAnimation {
 searchText = ""
 }
 } label: {
 Image(systemName: "xmark.circle.fill")
 .font(.system(size: 14))
 .foregroundStyle(.swarmTextSecondary)
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 10)
 .padding(.vertical, 7)
 .background(.swarmSurface)
 .cornerRadius(8)
 .overlay(
 RoundedRectangle(cornerRadius: 8)
 .stroke(.swarmBorder.opacity(0.5), lineWidth: 1)
 )
 }

 // MARK: - Category Filter

 private var categoryFilter: some View {
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 6) {
 ForEach(ToolCategory.allCases) { category in
 let isSelected = selectedCategory == category

 Button {
 withAnimation(.spring(duration: 0.2)) {
 selectedCategory = category
 }
 } label: {
 Text(category.label)
 .font(.swarm(.xs, weight: isSelected ? .semibold : .regular))
 .foregroundStyle(isSelected ? .swarmGold : .swarmTextSecondary)
 .padding(.horizontal, 10)
 .padding(.vertical, 5)
 .background(
 RoundedRectangle(cornerRadius: 6)
 .fill(isSelected ? .swarmGold.opacity(0.18) : .swarmSurface.opacity(0.6))
 )
 .overlay(
 RoundedRectangle(cornerRadius: 6)
 .stroke(isSelected ? .swarmGold.opacity(0.5) : .swarmBorder.opacity(0.3), lineWidth: 1)
 )
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 2)
 }
 }

 // MARK: - Tools Grid

 private var toolsGrid: some View {
 LazyVGrid(columns: [GridItem(.adaptive(minimum: 100, maximum: 140), spacing: 10)], spacing: 10) {
 ForEach(filteredTools) { tool in
 ToolCard(tool: tool)
 }
 }
 }

 private var filteredTools: [ToolItem] {
 let allTools: [ToolItem] = [
 ToolItem(id: "git", name: "Git", category: .versionControl, icon: "git.branch", description: "Version control"),
 ToolItem(id: "docker", name: "Docker", category: .devOps, icon: "cube.box", description: "Container platform"),
 ToolItem(id: "npm", name: "NPM", category: .packageManager, icon: "arrow.up.and.down.circle", description: "Node packages"),
 ToolItem(id: "python", name: "Python", category: .language, icon: "swift", description: "Python runtime"),
 ToolItem(id: "rust", name: "Rust", category: .language, icon: "hexagon", description: "Rust toolchain"),
 ToolItem(id: "swift", name: "Swift", category: .language, icon: "swift", description: "Swift compiler"),
 ToolItem(id: "xc", name: "Xcode", category: .ide, icon: "hammer", description: "IDE"),
 ToolItem(id: "vscode", name: "VS Code", category: .ide, icon: "chevron.left.forwardslash.chevron.right", description: "Code editor"),
 ]

 let filtered = allTools.filter { tool in
 let matchesCategory = selectedCategory == .all || tool.category == selectedCategory
 let matchesSearch = searchText.isEmpty ||
 tool.name.localizedCaseInsensitiveContains(searchText) ||
 tool.description.localizedCaseInsensitiveContains(searchText)
 return matchesCategory && matchesSearch
 }

 return filtered
 }
}

// MARK: - Tool Card

public struct ToolCard: View {
 public let tool: ToolItem
 @State private var isEnabled: Bool = true
 @State private var isHovered: Bool = false

 public init(tool: ToolItem) {
 self.tool = tool
 }

 public var body: some View {
 VStack(spacing: 8) {
 Image(systemName: tool.icon)
 .font(.system(size: 24))
 .foregroundStyle(isEnabled ? .swarmGold : .swarmTextSecondary)
 .frame(width: 44, height: 44)
 .background(
 Circle()
 .fill(isEnabled ? .swarmGold.opacity(0.15) : .swarmSurface)
 )
 .overlay(
 Circle()
 .stroke(isEnabled ? .swarmGold.opacity(0.3) : .swarmBorder.opacity(0.3), lineWidth: 1.5)
 )

 Text(tool.name)
 .font(.swarm(.xs, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)
 .lineLimit(1)

 Text(tool.description)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextSecondary)
 .lineLimit(1)
 }
 .frame(maxWidth: .infinity)
 .padding(.vertical, 10)
 .padding(.horizontal, 8)
 .background(
 RoundedRectangle(cornerRadius: 10)
 .fill(.swarmSurface.opacity(isHovered ? 0.8 : 0.5))
 )
 .overlay(
 RoundedRectangle(cornerRadius: 10)
 .stroke(isEnabled ? .swarmGold.opacity(0.2) : .swarmBorder.opacity(0.3), lineWidth: 1)
 )
 .scaleEffect(isHovered ? 1.03 : 1.0)
 .animation(.spring(duration: 0.2), value: isHovered)
 .onHover { hovering in
 isHovered = hovering
 }
 }
}

// MARK: - Tool Models

public struct ToolItem: Identifiable, Equatable {
 public let id: String
 public let name: String
 public let category: ToolCategory
 public let icon: String
 public let description: String

 public init(id: String, name: String, category: ToolCategory, icon: String, description: String) {
 self.id = id
 self.name = name
 self.category = category
 self.icon = icon
 self.description = description
 }
}

public enum ToolCategory: String, CaseIterable, Identifiable {
 case all = "all"
 case versionControl = "versionControl"
 case packageManager = "packageManager"
 case language = "language"
 case ide = "ide"
 case devOps = "devOps"
 case database = "database"
 case testing = "testing"
 case monitoring = "monitoring"

 public var id: String { rawValue }

 public var label: String {
 switch self {
 case .all: return "All"
 case .versionControl: return "VCS"
 case .packageManager: return "Packages"
 case .language: return "Languages"
 case .ide: return "IDE"
 case .devOps: return "DevOps"
 case .database: return "Database"
 case .testing: return "Testing"
 case .monitoring: return "Monitor"
 }
 }
}
