import SwiftUI

@Observable
final class UiStore {
 var isLeftSidebarOpen: Bool = true
 var isRightDockOpen: Bool = true
 var isCommandPaletteOpen: Bool = false
 var isSettingsOpen: Bool = false
 var activeLeftTab: SidebarTab = .projects
 var activeRightTab: DockTab = .lead

 init() {
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
