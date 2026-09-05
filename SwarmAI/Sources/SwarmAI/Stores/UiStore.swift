import SwiftUI

@Observable
public final class UiStore: @unchecked Sendable {
  public static let shared = UiStore()
  public var isLeftSidebarOpen: Bool = true
  public var isRightDockOpen: Bool = true
  public var isCommandPaletteOpen: Bool = false
  public var isSettingsOpen: Bool = false
  public var activeLeftTab: SidebarTab = .projects
  public var activeRightTab: DockTab = .chat

  public init() {
 if let saved = UserDefaults.standard.object(forKey: "leftSidebarOpen") as? Bool {
 isLeftSidebarOpen = saved
 }
 if let saved = UserDefaults.standard.object(forKey: "rightDockOpen") as? Bool {
 isRightDockOpen = saved
 }
 }

 func toggleLeftSidebar() {
 withAnimation(.swarmTabSwitch) {
 isLeftSidebarOpen.toggle()
 UserDefaults.standard.set(isLeftSidebarOpen, forKey: "leftSidebarOpen")
 }
 }

 func toggleRightDock() {
 withAnimation(.swarmTabSwitch) {
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
}
