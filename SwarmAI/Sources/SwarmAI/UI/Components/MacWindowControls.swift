import SwiftUI
import AppKit

// MARK: - Mac Window Controls
/// Custom macOS traffic lights matching Tauri MacWindowControls.tsx
public struct MacWindowControls: View {
	@State private var isHovered: Bool = false

	public init() {}

	public var body: some View {
		HStack(spacing: 8) {
			// Close (Red)
			Button {
				if let window = NSApp.keyWindow ?? NSApp.windows.first {
					window.performClose(nil)
				}
			} label: {
				ZStack {
					Circle()
						.fill(Color(red: 255/255, green: 95/255, blue: 86/255))
						.frame(width: 12, height: 12)
						.overlay(
							Circle()
								.stroke(Color(red: 224/255, green: 68/255, blue: 62/255), lineWidth: 0.5)
						)

					Image(systemName: "xmark")
						.font(.system(size: 6, weight: .black))
						.foregroundStyle(Color(red: 77/255, green: 0, blue: 0))
						.opacity(isHovered ? 0.85 : 0)
				}
			}
			.buttonStyle(.plain)
			.help("Close")

			// Minimize (Yellow)
			Button {
				if let window = NSApp.keyWindow ?? NSApp.windows.first {
					window.miniaturize(nil)
				}
			} label: {
				ZStack {
					Circle()
						.fill(Color(red: 255/255, green: 189/255, blue: 46/255))
						.frame(width: 12, height: 12)
						.overlay(
							Circle()
								.stroke(Color(red: 222/255, green: 161/255, blue: 35/255), lineWidth: 0.5)
						)

					Image(systemName: "minus")
						.font(.system(size: 6, weight: .black))
						.foregroundStyle(Color(red: 92/255, green: 65/255, blue: 0))
						.opacity(isHovered ? 0.85 : 0)
				}
			}
			.buttonStyle(.plain)
			.help("Minimize")

			// Maximize (Green)
			Button {
				if let window = NSApp.keyWindow ?? NSApp.windows.first {
					window.zoom(nil)
				}
			} label: {
				ZStack {
					Circle()
						.fill(Color(red: 39/255, green: 201/255, blue: 63/255))
						.frame(width: 12, height: 12)
						.overlay(
							Circle()
								.stroke(Color(red: 26/255, green: 171/255, blue: 41/255), lineWidth: 0.5)
						)

					Image(systemName: "plus")
						.font(.system(size: 6, weight: .black))
						.foregroundStyle(Color(red: 0, green: 69/255, blue: 0))
						.opacity(isHovered ? 0.85 : 0)
				}
			}
			.buttonStyle(.plain)
			.help("Maximize")
		}
		.padding(.horizontal, 2)
		.onHover { hovering in
			withAnimation(.easeInOut(duration: 0.12)) {
				isHovered = hovering
			}
		}
	}
}
