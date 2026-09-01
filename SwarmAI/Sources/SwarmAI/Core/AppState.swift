import SwiftUI

@Observable
final class AppState {
 var isLeftSidebarOpen: Bool = true
 var isRightDockOpen: Bool = true
 var isCommandPaletteOpen: Bool = false
 var isSettingsOpen: Bool = false
 var activeLeftTab: SidebarTab = .projects
 var activeRightTab: DockTab = .lead
 var activePlane: Plane = .board
 var boardView: BoardView = .grid
 var isFullscreen: Bool = false
 var workspaceName: String = "Swarm Workspace"
 var isVoiceActive: Bool = false
 var activeAgentsCount: Int = 0
 var gitBranch: String = "main"
 var engineStatus: String = "Idle"

 init() {
 // Load persisted values from UserDefaults
 isLeftSidebarOpen = UserDefaults.standard.object(forKey: "leftSidebarOpen") as? Bool ?? true
 isRightDockOpen = UserDefaults.standard.object(forKey: "rightDockOpen") as? Bool ?? true
 activeLeftTab = SidebarTab.allCases.first ?? .projects
 activeRightTab = DockTab.allCases.first ?? .lead
 }

 func toggleLeftSidebar() {
 withAnimation(.spring(duration: 0.3)) {
 isLeftSidebarOpen.toggle()
 UserDefaults.standard.set(isLeftSidebarOpen, forKey: "leftSidebarOpen")
 }
 }

 func toggleRightDock() {
 withAnimation(.spring(duration: 0.3)) {
 isRightDockOpen.toggle()
 UserDefaults.standard.set(isRightDockOpen, forKey: "rightDockOpen")
 }
 }

 func toggleCommandPalette() {
 isCommandPaletteOpen.toggle()
 }

 func toggleSettings() {
 isSettingsOpen.toggle()
 }

 func setLeftTab(_ tab: SidebarTab) {
 activeLeftTab = tab
 }

 func setRightTab(_ tab: DockTab) {
 activeRightTab = tab
 }

 func setPlane(_ plane: Plane) {
 withAnimation(.spring(duration: 0.3)) {
 activePlane = plane
 }
 }

 func setBoardView(_ view: BoardView) {
 withAnimation(.spring(duration: 0.3)) {
 boardView = view
 }
 }

 func toggleFullscreen() {
 withAnimation(.spring(duration: 0.3)) {
 isFullscreen.toggle()
 }
 }
}
