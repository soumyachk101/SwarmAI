import SwiftUI

// MARK: - Entry Phase

public enum EntryPhase: Int, Comparable, Sendable {
	case idle = 0
	case splashActive
	case splashExiting
	case frameIn
	case sidebarIn
	case dockIn
	case titlebarIn
	case boardStripIn
	case contentIn
	case statusBarIn
	case complete

	public static func < (lhs: EntryPhase, rhs: EntryPhase) -> Bool {
		lhs.rawValue < rhs.rawValue
	}
}
