import SwiftUI

public enum SidebarTab: String, CaseIterable, Identifiable {
	public var id: String { rawValue }
	case projects = "Projects"
	case agents = "Agents"
	case fleet = "Swarm Fleet"
	case git = "Git"
	case devtools = "DevTools"
	case search = "Search"

	public var icon: String {
		switch self {
		case .projects: return "square.grid.2x2.fill"
		case .agents: return "cpu.fill"
		case .fleet: return "antenna.radiowaves.left.and.right"
		case .git: return "arrow.triangle.branch"
		case .devtools: return "wrench.fill"
		case .search: return "magnifyingglass"
		}
	}

	public var index: Int {
		Self.allCases.firstIndex(of: self) ?? 0
	}

	public var title: String {
		rawValue
	}
}

public enum DockTab: String, CaseIterable, Identifiable {
	public var id: String { rawValue }
	case chat = "Chat"
	case glassChat = "GlassChat"
	case gitPanel = "Git"
	case snippets = "Snippets"
	case reports = "Reports"

	public var icon: String {
		switch self {
		case .chat: return "message.fill"
		case .glassChat: return "bubble.left.and.bubble.right"
		case .gitPanel: return "chevron.left.forwardslash.chevron.right"
		case .snippets: return "text.quote"
		case .reports: return "chart.bar.fill"
		}
	}

	public var index: Int {
		Self.allCases.firstIndex(of: self) ?? 0
	}

	public var title: String {
		rawValue
	}
}

public enum Plane: String, CaseIterable, Identifiable {
	public var id: String { rawValue }
	case board = "Board"
	case browser = "Browser"
	case emulator = "Emulator"

	public var icon: String {
		switch self {
		case .board: return "square.grid.3x3.fill"
		case .browser: return "globe"
		case .emulator: return "iphone"
		}
	}

	public var title: String {
		rawValue
	}
}

public enum BoardView: String, CaseIterable, Identifiable {
	public var id: String { rawValue }
	case grid = "Grid"
	case flow = "Flow"

	public var title: String {
		rawValue
	}
}
