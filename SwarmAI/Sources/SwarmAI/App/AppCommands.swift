import SwiftUI

struct AppCommands: Commands {
 @Bindable var appState: AppState
 @Bindable var themeStore: ThemeStore

 var body: some Commands {
 CommandGroup(replacing: .appInfo) {
 Button("About SwarmAI") {
 // Show about panel
 }
 }

 CommandGroup(replacing: .newItem) {
 Button("New Agent Session") {
 appState.isCommandPaletteOpen = true
 }
 .keyboardShortcut("n", modifiers: [.command, .shift])
 }

 CommandGroup(replacing: .sidebar) {
 Button("Toggle Left Sidebar") {
 withAnimation(.spring(duration: 0.3)) {
 appState.isLeftSidebarOpen.toggle()
 }
 }
 .keyboardShortcut("b", modifiers: [.command])

 Button("Toggle Right Dock") {
 withAnimation(.spring(duration: 0.3)) {
 appState.isRightDockOpen.toggle()
 }
 }
 .keyboardShortcut("\\", modifiers: [.command, .shift])
 }

 CommandGroup(replacing: .toolbar) {
 Button("Command Palette") {
 appState.isCommandPaletteOpen.toggle()
 }
 .keyboardShortcut("k", modifiers: .command)

 Button("Settings") {
 appState.isSettingsOpen.toggle()
 }
 .keyboardShortcut(",", modifiers: .command)
 }

 CommandMenu("Swarm") {
 Button("Dispatch Goal to Lead") {
 appState.isCommandPaletteOpen = true
 }
 .keyboardShortcut("d", modifiers: [.command, .shift])

 Divider()

 Button("Cycle Theme") {
 themeStore.cycleTheme()
 }
 .keyboardShortcut("t", modifiers: [.command, .shift])

 Divider()

 ForEach(Theme.allCases, id: \.id) { theme in
 Button(theme.displayName) {
 themeStore.setTheme(theme.id)
 }
 }
 }
 }
}
