import SwiftUI

@Observable
public final class AppState: @unchecked Sendable {
  public static let shared = AppState()

  public var isLeftSidebarOpen: Bool = true
  public var isRightDockOpen: Bool = true
  public var isCommandPaletteOpen: Bool = false
  public var isSettingsOpen: Bool = false
  public var isDashboardPresented: Bool = false
  public var isDiffPreviewPresented: Bool = false
  public var isTaskTemplatesPresented: Bool = false
  public var isUserGuidePresented: Bool = false
  public var isUpdateCheckerPresented: Bool = false

  public var activeLeftTab: SidebarTab = .projects
  public var activeRightTab: DockTab = .lead
  public var activePlane: Plane = .board
  public var boardView: BoardView = .grid
  public var isFullscreen: Bool = false
  public var workspaceName: String = "Swarm Workspace"
  public var isVoiceActive: Bool = false
  public var activeAgentsCount: Int = 0
  public var gitBranch: String = "main"
  public var engineStatus: String = "Idle"

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
