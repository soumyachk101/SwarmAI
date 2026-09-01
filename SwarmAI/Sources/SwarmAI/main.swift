import SwiftUI

@main
struct SwarmAIApp: App {
 @State private var appState = AppState()
 @State private var themeStore = ThemeStore()

 var body: some Scene {
 WindowGroup {
 MainWindow()
 .environment(appState)
 .environment(themeStore)
 .preferredColorScheme(themeStore.colorScheme)
 }
 .windowStyle(.titleBar)
 .windowResizability(.contentSize)
 .commands {
 AppCommands(appState: appState, themeStore: themeStore)
 }
 }
}
