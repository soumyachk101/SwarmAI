import SwiftUI

// MARK: - Command Palette

struct CommandPaletteView: View {
 @Environment(\.dismiss) var dismiss
 @Environment(\.appState) private var appState
 @Environment(\.themeStore) private var themeStore
 @Environment(\.agentsStore) private var agentsStore
 @State private var query: String = ""
 @State private var selectedIndex: Int = 0
 @State private var isPresented = false
 @State private var searchWidth: CGFloat = 0

 let commands: [CommandItem] = [
 CommandItem(title: "New Agent Session", subtitle: "Spawn a new coding agent", icon: "plus.circle", action: .newAgent),
 CommandItem(title: "Toggle Left Sidebar", subtitle: "Show or hide the left sidebar", icon: "sidebar.left", action: .toggleSidebar),
 CommandItem(title: "Toggle Right Dock", subtitle: "Show or hide the right dock", icon: "sidebar.right", action: .toggleDock),
 CommandItem(title: "Switch to Board View", subtitle: "Switch to grid board", icon: "square.grid.3x3", action: .switchBoard),
 CommandItem(title: "Switch to Flow View", subtitle: "Switch to flow canvas", icon: "scribble", action: .switchFlow),
 CommandItem(title: "Dispatch to Lead", subtitle: "Send mission directive to Lead agent", icon: "paperplane", action: .dispatchLead),
 CommandItem(title: "Open Git Control", subtitle: "View git status and changes", icon: "arrow.triangle.branch", action: .openGit),
 CommandItem(title: "Open Settings", subtitle: "Configure SwarmAI", icon: "gearshape", action: .openSettings),
 CommandItem(title: "Cycle Theme", subtitle: "Switch to the next theme", icon: "paintbrush", action: .cycleTheme),
 ]

 var filteredCommands: [CommandItem] {
 if query.isEmpty { return commands }
 return commands.filter { $0.title.localizedCaseInsensitiveContains(query) || $0.subtitle.localizedCaseInsensitiveContains(query) }
 }

 var body: some View {
 ZStack {
 // Backdrop — ultraThinMaterial at 0.7 opacity, fades in over 0.2s
 Color.clear
 .ignoresSafeArea()
 .background(.ultraThinMaterial.opacity(isPresented ? 0.7 : 0))
 .allowsHitTesting(isPresented)
 .onTapGesture { dismissPalette() }
 .animation(.easeOut(duration: 0.2), value: isPresented)

 // Hidden Escape Button for macOS keyboard shortcut routing
 Button("") {
 dismissPalette()
 }
 .keyboardShortcut(.cancelAction)
 .keyboardShortcut(.escape, modifiers: [])
 .opacity(0)
 .frame(width: 0, height: 0)

 VStack(spacing: 0) {
 // Search field — expands width from 0 to full
 HStack(spacing: 10) {
 Image(systemName: "magnifyingglass")
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextTertiary)

 TextField("Type a command...", text: $query)
 .font(.swarm(.base))
 .foregroundStyle(.swarmTextPrimary)
 .textFieldStyle(.plain)
 .onSubmit {
 executeSelectedCommand()
 }
 .onChange(of: query) { _, _ in
 selectedIndex = 0
 }

 if !query.isEmpty {
 Button {
 query = ""
 selectedIndex = 0
 } label: {
 Image(systemName: "xmark.circle.fill")
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }

 Button {
 dismissPalette()
 } label: {
 Image(systemName: "xmark")
 .font(.system(size: 11, weight: .bold))
 .foregroundStyle(.swarmTextTertiary)
 .frame(width: 22, height: 22)
 .background(Color.swarmSurface)
 .cornerRadius(4)
 }
 .buttonStyle(.plain)
 .help("Close command palette (Esc)")
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)
 .background(.swarmSurface)
 .frame(maxWidth: searchWidth)
 .animation(.spring(response: 0.4, dampingFraction: 0.85).delay(0.1), value: searchWidth)

 Divider()
 .background(.swarmBorderSubtle)

 // Results — cascade in with 30ms stagger per item
 if filteredCommands.isEmpty {
 ContentUnavailableView(
 "No Results",
 systemImage: "magnifyingglass",
 description: Text("No commands match \"\(query)\"")
 )
 .padding(.top, 40)
 } else {
 ScrollView {
 VStack(spacing: 2) {
 ForEach(Array(filteredCommands.enumerated()), id: \.offset) { index, cmd in
 Button {
 executeCommand(cmd)
 } label: {
 HStack(spacing: 10) {
 Image(systemName: cmd.icon)
 .font(.swarm(.sm))
 .foregroundStyle(.swarmGold)
 .frame(width: 24)

 VStack(alignment: .leading, spacing: 1) {
 Text(cmd.title)
 .font(.swarm(.sm, weight: selectedIndex == index ? .medium : .regular))
 .foregroundStyle(selectedIndex == index ? .swarmGold : .swarmTextPrimary)

 Text(cmd.subtitle)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }

 Spacer()
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 8)
 .background {
 if selectedIndex == index {
 RoundedRectangle(cornerRadius: 6)
 .fill(.swarmGold.opacity(0.1))
 }
 }
 }
 .buttonStyle(.plain)
 .opacity(isPresented ? 1 : 0)
 .offset(y: isPresented ? 0 : 8)
 .animation(
 .easeOut(duration: 0.2)
 .delay(0.15 + Double(index) * 0.03),
 value: isPresented
 )
 }
 .padding(.horizontal, 8)
 .padding(.vertical, 4)
 }
 }
 }

 Divider()
 .background(.swarmBorderSubtle)

 // Footer
 HStack {
 Text("Use ↑↓ to navigate, ↩ to select, esc to close")
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 .padding(.horizontal, 16)
 .padding(.vertical, 6)
 }
 }
 .frame(width: 500)
 .background(.swarmSurface)
 .cornerRadius(20)
 .shadow(color: themeStore.currentTheme.color(for: .shadowColor).opacity(0.4), radius: 30, x: 0, y: 10)
 .scaleEffect(isPresented ? 1.0 : 0.95)
 .opacity(isPresented ? 1 : 0)
 .animation(.easeOut(duration: 0.2).delay(0.05), value: isPresented)
 }
 .onKeyPress(.escape) {
 dismissPalette()
 return .handled
 }
 .onKeyPress(.upArrow) {
 if selectedIndex > 0 {
 selectedIndex -= 1
 }
 return .handled
 }
 .onKeyPress(.downArrow) {
 if selectedIndex < filteredCommands.count - 1 {
 selectedIndex += 1
 }
 return .handled
 }
 .onAppear {
 withAnimation(.easeOut(duration: 0.2)) {
 isPresented = true
 searchWidth = 500
 }
 }
 .onChange(of: query) { _, _ in
 selectedIndex = 0
 }
 }

 private func executeSelectedCommand() {
 guard !filteredCommands.isEmpty else { return }
 let index = min(selectedIndex, filteredCommands.count - 1)
 executeCommand(filteredCommands[index])
 }

 private func executeCommand(_ cmd: CommandItem) {
 switch cmd.action {
 case .newAgent:
 _ = agentsStore.spawnAgent(.claudeCode)
 case .toggleSidebar:
 appState.toggleLeftSidebar()
 case .toggleDock:
 appState.toggleRightDock()
 case .switchBoard:
 appState.setPlane(.board)
 appState.setBoardView(.grid)
 case .switchFlow:
 appState.setPlane(.board)
 appState.setBoardView(.flow)
 case .dispatchLead:
 appState.setRightTab(.chat)
 if !appState.isRightDockOpen {
 appState.toggleRightDock()
 }
 case .openGit:
 appState.setLeftTab(.git)
 if !appState.isLeftSidebarOpen {
 appState.toggleLeftSidebar()
 }
 case .openSettings:
 appState.isSettingsOpen = true
 case .cycleTheme:
 themeStore.cycleTheme()
 }
 dismissPalette()
 }

 private func dismissPalette() {
 withAnimation(.easeOut(duration: 0.15)) {
 isPresented = false
 }
 DispatchQueue.main.asyncAfter(deadline: .now() + 0.15) {
 appState.isCommandPaletteOpen = false
 dismiss()
 }
 }
}

// MARK: - Command Types

struct CommandItem: Identifiable {
 let id = UUID()
 let title: String
 let subtitle: String
 let icon: String
 let action: CommandAction
}

enum CommandAction {
 case newAgent
 case toggleSidebar
 case toggleDock
 case switchBoard
 case switchFlow
 case dispatchLead
 case openGit
 case openSettings
 case cycleTheme
}
