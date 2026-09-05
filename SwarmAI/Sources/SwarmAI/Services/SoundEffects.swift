import AppKit

// MARK: - Sound Effect Types

public enum SoundEffectType: String, CaseIterable, Sendable {
	case click = "click"
	case success = "success"
	case error = "error"
	case notification = "notification"
	case launch = "launch"
	case dismiss = "dismiss"
	case hover = "hover"

	public var systemName: String {
		switch self {
		case .click: return "Frog"
		case .success: return "Glass"
		case .error: return "Basso"
		case .notification: return "Ping"
		case .launch: return "Hero"
		case .dismiss: return "Pop"
		case .hover: return "Tink"
		}
	}

	public var defaultVolume: Float {
		switch self {
		case .click: return 0.15
		case .success: return 0.25
		case .error: return 0.3
		case .notification: return 0.2
		case .launch: return 0.35
		case .dismiss: return 0.15
		case .hover: return 0.1
		}
	}
}

// MARK: - Sound Effects Service

/// Singleton service for playing UI sound effects.
/// Uses NSSound with system sound names for native macOS audio feedback.
public final class SoundEffects: @unchecked Sendable {
	public static let shared = SoundEffects()

	private var enabled: Bool = true
	private var isMuted: Bool = false
	private var volume: Float = 0.3
	private var lastPlayTime: [SoundEffectType: Date] = [:]
	private let minimumInterval: TimeInterval = 0.05

	private init() {}

	/// Play a sound effect by type.
	/// Respects mute state, volume setting, and throttles rapid repeats.
	public func play(_ type: SoundEffectType) {
		guard enabled, !isMuted else { return }

		let now = Date()
		if let last = lastPlayTime[type], now.timeIntervalSince(last) < minimumInterval {
			return
		}
		lastPlayTime[type] = now

		let sound = NSSound(named: NSSound.Name(type.systemName))
		sound?.volume = type.defaultVolume * volume
		sound?.play()
	}

	/// Play a custom sound by system sound name.
	public func play(named soundName: String, volume: Float = 0.3) {
		guard enabled, !isMuted else { return }
		let sound = NSSound(named: NSSound.Name(soundName))
		sound?.volume = volume * self.volume
		sound?.play()
	}

	/// Toggle mute state. Returns the new mute state.
	@discardableResult
	public func toggleMute() -> Bool {
		isMuted.toggle()
		if !isMuted {
			play(.click)
		}
		return isMuted
	}

	/// Set whether sound effects are enabled.
	public func setEnabled(_ enabled: Bool) {
		self.enabled = enabled
		if enabled {
			play(.click)
		}
	}

	/// Set global volume (0.0 to 1.0).
	public func setVolume(_ volume: Float) {
		self.volume = max(0.0, min(1.0, volume))
	}

	/// Whether sounds are currently muted.
	public var muted: Bool { isMuted }

	/// Whether sound effects are enabled.
	public var soundEnabled: Bool { enabled }
}
