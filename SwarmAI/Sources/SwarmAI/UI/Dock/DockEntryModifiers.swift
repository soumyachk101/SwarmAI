import SwiftUI

// MARK: - Shared Dock Entry Modifiers

struct PanelEntryModifier: ViewModifier {
  let appeared: Bool

  init(appeared: Bool) {
    self.appeared = appeared
  }

  init(appeared: Binding<Bool>) {
    self.appeared = appeared.wrappedValue
  }

  func body(content: Content) -> some View {
    content
      .opacity(appeared ? 1 : 0)
      .offset(x: appeared ? 0 : 40)
      .animation(.easeOut(duration: 0.4), value: appeared)
  }
}

struct RowEntryModifier: ViewModifier {
  let appeared: Bool
  let delay: Double

  init(appeared: Bool, delay: Double = 0) {
    self.appeared = appeared
    self.delay = delay
  }

  init(appeared: Binding<Bool>, delay: Double = 0) {
    self.appeared = appeared.wrappedValue
    self.delay = delay
  }

  func body(content: Content) -> some View {
    content
      .opacity(appeared ? 1 : 0)
      .offset(y: appeared ? 0 : 8)
      .animation(.easeOut(duration: 0.35).delay(delay), value: appeared)
  }
}
