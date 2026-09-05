import SwiftUI

// MARK: - Focus Trap

public struct FocusTrapModifier: ViewModifier {
	@State private var focusableElements: [String] = []
	@State private var currentFocusIndex: Int = 0
	@FocusState private var focusedField: String?

	private let onEscape: (() -> Void)?

	public init(onEscape: (() -> Void)? = nil) {
		self.onEscape = onEscape
	}

	public func body(content: Content) -> some View {
		content
			.onAppear {
				// Focus first element after a brief delay
				DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
					if let first = focusableElements.first {
						focusedField = first
					}
				}
			}
			.onChange(of: focusedField) { _, newValue in
				if let newValue, let index = focusableElements.firstIndex(of: newValue) {
					currentFocusIndex = index
				}
			}
			.onKeyPress(.tab, phases: .down) { _ in
				// Handle Tab key cycling
				withAnimation(.swarmQuick) {
					if focusableElements.count > 0 {
						currentFocusIndex = (currentFocusIndex + 1) % focusableElements.count
						focusedField = focusableElements[currentFocusIndex]
					}
				}
				return .handled
			}
			.onKeyPress(.escape, phases: .down) { _ in
				onEscape?()
				return .handled
			}
	}
}

public extension View {
	func focusTrap(onEscape: (() -> Void)? = nil) -> some View {
		self.modifier(FocusTrapModifier(onEscape: onEscape))
	}
}

// MARK: - Focusable Field Modifier

public struct FocusableFieldModifier: ViewModifier {
	let id: String
	let focusState: FocusState<String?>.Binding
	let value: String

	public init(id: String, focusState: FocusState<String?>.Binding, value: String) {
		self.id = id
		self.focusState = focusState
		self.value = value
	}

	public func body(content: Content) -> some View {
		content
			.focused(focusState, equals: value)
	}
}

public extension View {
	func focusable(id: String, focusState: FocusState<String?>.Binding, value: String) -> some View {
		self.modifier(FocusableFieldModifier(id: id, focusState: focusState, value: value))
	}
}
