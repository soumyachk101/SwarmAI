import SwiftUI

// MARK: - Shortcut Item

public struct ShortcutItem: Sendable, Identifiable {
 public let id = UUID()
 public let icon: String
 public let action: String
 public let shortcut: String
 public let category: String
}

// MARK: - Shortcuts Modal

public struct ShortcutsModal: View {
 @Environment(\.dismiss) private var dismiss
 @State private var isPresented: Bool = false
 @State private var selectedCategory: String = "All"
 @State private var searchText: String = ""

 private let categories = ["All", "General", "Navigation", "Agents", "Board", "Terminal"]

 private let allShortcuts: [ShortcutItem] = [
 ShortcutItem(icon: "command.square", action: "Command Palette", shortcut: "⌘ K", category: "General"),
 ShortcutItem(icon: "plus", action: "New Agent", shortcut: "⌘ N", category: "Agents"),
 ShortcutItem(icon: "gearshape", action: "Settings", shortcut: "⌘ ,", category: "General"),
 ShortcutItem(icon: "xmark", action: "Close Window", shortcut: "⌘ W", category: "General"),
 ShortcutItem(icon: "arrow.clockwise", action: "Refresh", shortcut: "⌘ R", category: "General"),
 ShortcutItem(icon: "terminal", action: "New Terminal", shortcut: "⌘ T", category: "Terminal"),
 ShortcutItem(icon: "sidebar.left", action: "Toggle Sidebar", shortcut: "⌘ B", category: "Navigation"),
 ShortcutItem(icon: "square.grid.2x2", action: "Toggle Board Strip", shortcut: "⌘ B", category: "Navigation"),
 ShortcutItem(icon: "chart.bar", action: "Dashboard", shortcut: "⌘ D", category: "General"),
 ShortcutItem(icon: "wrench", action: "DevTools", shortcut: "⌘ /", category: "General"),
 ShortcutItem(icon: "grid", action: "Grid View", shortcut: "⌘ 1", category: "Board"),
 ShortcutItem(icon: "scribble", action: "Flow View", shortcut: "⌘ 2", category: "Board"),
 ShortcutItem(icon: "cpu", action: "Agents Tab", shortcut: "⌘ 3", category: "Navigation"),
 ShortcutItem(icon: "folder", action: "Workspaces Tab", shortcut: "⌘ 4", category: "Navigation"),
 ShortcutItem(icon: "antenna.radiowaves", action: "Fleet Tab", shortcut: "⌘ 5", category: "Navigation"),
 ShortcutItem(icon: "escape", action: "Close Modal", shortcut: "Esc", category: "General"),
 ShortcutItem(icon: "arrow.left.arrow.right", action: "Focus Terminal", shortcut: "⌘ Enter", category: "Terminal"),
 ShortcutItem(icon: "arrow.up.and.down", action: "Split Terminal", shortcut: "⌘ \\", category: "Terminal"),
 ]

 public init() {}

 public var body: some View {
 ZStack {
 // Backdrop
 Color.black.opacity(isPresented ? 0.4 : 0)
 .ignoresSafeArea()
 .allowsHitTesting(isPresented)
 .onTapGesture {
 dismissShortcuts()
 }
 .animation(.spring(response: 0.4, dampingFraction: 0.85), value: isPresented)

 // Modal
 VStack(spacing: 0) {
 // Header
 HStack(spacing: 12) {
 Image(systemName: "keyboard")
 .font(.swarm(.lg))
 .foregroundStyle(Color.swarmGold)

 Text("Keyboard Shortcuts")
 .font(.swarm(.lg, weight: .semibold))
 .foregroundStyle(Color.swarmTextPrimary)

 Spacer()

 Button {
 dismissShortcuts()
 } label: {
 Image(systemName: "xmark.circle.fill")
 .font(.system(size: 18))
 .foregroundStyle(Color.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 24)
 .padding(.vertical, 16)

 Divider()
 .background(Color.swarmBorderSubtle)

 // Category filter
 ScrollView(.horizontal, showsIndicators: false) {
 HStack(spacing: 8) {
 ForEach(categories, id: \.self) { category in
 Button(category) {
 withAnimation(.swarmQuick) {
 selectedCategory = category
 searchText = ""
 }
 }
 .font(.swarm(.xs, weight: selectedCategory == category ? .semibold : .regular))
 .foregroundStyle(
 selectedCategory == category ? Color.swarmCanvas : Color.swarmTextSecondary
 )
 .padding(.horizontal, 12)
 .padding(.vertical, 6)
 .background {
 Capsule()
 .fill(
 selectedCategory == category ? Color.swarmGold : Color.swarmSurface
 )
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.horizontal, 20)
 }
 .padding(.vertical, 12)

 // Search bar
 HStack(spacing: 8) {
 Image(systemName: "magnifyingglass")
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextTertiary)

 TextField("Search shortcuts...", text: $searchText)
 .font(.swarm(.sm))
 .foregroundStyle(Color.swarmTextPrimary)
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 8)
 .background(Color.swarmSurface)
 .cornerRadius(8)
 .padding(.horizontal, 20)
 .padding(.bottom, 12)

 // Shortcuts list
 ScrollView {
 LazyVStack(spacing: 2) {
 let filtered = filteredShortcuts

 if filtered.isEmpty {
 ContentUnavailableView(
 "No Shortcuts Found",
 systemImage: "keyboard",
 description: Text("Try a different search term")
 )
 .padding(.vertical, 40)
 } else {
 ForEach(filtered) { shortcut in
 shortcutRow(shortcut)
 }
 }
 }
 .padding(.horizontal, 20)
 }

 // Footer
 HStack {
 Text("Press Esc to close")
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 Spacer()
 }
 .padding(.horizontal, 24)
 .padding(.vertical, 10)
 }
 .frame(width: 480, height: 560)
 .background {
 Color.swarmCanvas
 }
 .overlay(
 RoundedRectangle(cornerRadius: 16, style: .continuous)
 .stroke(Color.swarmBorderSubtle.opacity(0.5), lineWidth: 1)
 )
 .shadow(color: .black.opacity(0.3), radius: 24, x: 0, y: 12)
 .scaleEffect(isPresented ? 1.0 : 0.9)
 .opacity(isPresented ? 1 : 0)
 .onAppear {
 isPresented = true
 }
 }
 }

 // MARK: - Filtered Shortcuts

 private var filteredShortcuts: [ShortcutItem] {
 var result = allShortcuts

 if selectedCategory != "All" {
 result = result.filter { $0.category == selectedCategory }
 }

 if !searchText.isEmpty {
 result = result.filter {
 $0.action.localizedCaseInsensitiveContains(searchText) ||
 $0.shortcut.localizedCaseInsensitiveContains(searchText)
 }
 }

 return result
 }

 // MARK: - Shortcut Row

 private func shortcutRow(_ shortcut: ShortcutItem) -> some View {
 HStack(spacing: 12) {
 Image(systemName: shortcut.icon)
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextTertiary)
 .frame(width: 20, alignment: .center)

 Text(shortcut.action)
 .font(.swarm(.sm))
 .foregroundStyle(Color.swarmTextPrimary)

 Spacer()

 // Key badge
 Text(shortcut.shortcut)
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextSecondary)
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 .background(
 Capsule()
 .fill(Color.swarmSurface)
 .overlay(
 Capsule()
 .stroke(Color.swarmBorderSubtle, lineWidth: 1)
 )
 )
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 8)
 .contentShape(Rectangle())
 }

 private func dismissShortcuts() {
 withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
 isPresented = false
 }

 DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
 dismiss()
 }
 }
}
