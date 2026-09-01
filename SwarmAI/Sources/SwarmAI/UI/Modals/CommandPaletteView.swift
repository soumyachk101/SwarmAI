import SwiftUI

// MARK: - Command Palette

struct CommandPaletteView: View {
 @Environment(\.dismiss) var dismiss
 @State private var query: String = ""
 @State private var selectedIndex: Int = 0

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

 let filteredCommands: [CommandItem] {
 if query.isEmpty { return commands }
 return commands.filter { $0.title.localizedCaseInsensitiveContains(query) || $0.subtitle.localizedCaseInsensitiveContains(query) }
 }

 var body: some View {
 ZStack {
 Color.black.opacity(0.4)
 .ignoresSafeArea()
 .onTapGesture { dismiss() }

 VStack(spacing: 0) {
 // Search field
 HStack(spacing: 10) {
 Image(systemName: "magnifyingglass")
 .font(.swarm(.sm))
 .foregroundStyle(.swarmTextTertiary)

 TextField("Type a command...", text: $query, axis: .vertical)
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
 }
 .padding(.horizontal, 16)
 .padding(.vertical, 12)
 .background(.swarmSurface)

 Divider()
 .background(.swarmBorderSubtle)

 // Results
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
 }
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
 .cornerRadius(12)
 .shadow(color: .black.opacity(0.4), radius: 30, x: 0, y: 10)
 }
 }
 .onReceive(keyPressPublisher(for: .upArrow)) { _ in
 selectedIndex = max(0, selectedIndex - 1)
 }
 .onReceive(keyPressPublisher(for: .downArrow)) { _ in
 selectedIndex = min(filteredCommands.count - 1, selectedIndex + 1)
 }
 .onReceive(keyPressPublisher(for: .escape)) { _ in
 dismiss()
 }
 .onAppear {
 selectedIndex = 0
 }
 .onChange(of: query) { _, _ in
 selectedIndex = 0
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

private func executeSelectedCommand() {
 guard !filteredCommands.isEmpty else { return }
 let index = min(selectedIndex, filteredCommands.count - 1)
 executeCommand(filteredCommands[index])
}

private func executeCommand(_ cmd: CommandItem) {
 // Handle command - in real app this would trigger appropriate action
 dismiss()
}

// MARK: - Keyboard Helper

import Combine

func keyPressPublisher(for key: KeyEquivalent) -> AnyPublisher<Void, Never> {
 Publishers.Merge(
 NotificationCenter.default.publisher(for: NSApplication.willUpdateNotification)
 .compactMap { _ in NSApp.currentEvent }
 .filter { $0.keyCode == key.rawValue }
 .map { _ in () },
 NotificationCenter.default.publisher(for: NSApplication.didUpdateNotification)
 .compactMap { _ in NSApp.currentEvent }
 .filter { $0.keyCode == key.rawValue }
 .map { _ in () }
 )
 .eraseToAnyPublisher()
}
