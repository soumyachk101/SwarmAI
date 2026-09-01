import SwiftUI

enum SidebarTab: String, CaseIterable {
 case projects = "Projects"
 case explorer = "Explorer"
 case git = "Git"
 case search = "Search"
 case devTools = "DevTools"
 case agents = "Agents"
 case fleet = "Swarm Fleet"

 var icon: String {
 switch self {
 case .projects: return "square.grid.2x2.fill"
 case .explorer: return "folder.fill"
 case .git: return "arrow.triangle.branch"
 case .search: return "magnifyingglass"
 case .devTools: return "wrench.fill"
 case .agents: return "cpu.fill"
 case .fleet: return "antenna.radiowaves.left.and.right"
 }
 }

 var index: Int {
 Self.allCases.firstIndex(of: self) ?? 0
 }
}

enum DockTab: String, CaseIterable {
 case lead = "Lead"
 case devChat = "DevChat"
 case gitPanel = "Git"
 case snippets = "Snippets"
 case reports = "Reports"

 var icon: String {
 switch self {
 case .lead: return "crown.fill"
 case .devChat: return "message.fill"
 case .gitPanel: return "chevron.left.forwardslash.chevron.right"
 case .snippets: return "text.quote"
 case .reports: return "chart.bar.fill"
 }
 }

 var index: Int {
 Self.allCases.firstIndex(of: self) ?? 0
 }
}

enum Plane: String, CaseIterable {
 case board = "Board"
 case browser = "Browser"
 case emulator = "Emulator"

 var icon: String {
 switch self {
 case .board: return "square.grid.3x3.fill"
 case .browser: return "globe"
 case .emulator: return "iphone"
 }
 }
}

enum BoardView: String, CaseIterable {
 case grid = "Grid"
 case flow = "Flow"
}
