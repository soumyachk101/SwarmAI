import SwiftUI
import AppKit

// MARK: - Toast Model

public enum ToastType: Sendable {
 case info
 case success
 case warning
 case error

 public var icon: String {
 switch self {
 case .info: return "info.circle.fill"
 case .success: return "checkmark.circle.fill"
 case .warning: return "exclamationmark.triangle.fill"
 case .error: return "xmark.circle.fill"
 }
 }

 public var color: Color {
 switch self {
 case .info: return .swarmInfo
 case .success: return .swarmSuccess
 case .warning: return .swarmWarning
 case .error: return .swarmError
 }
 }
}

public struct Toast: Identifiable, Sendable {
 public let id: UUID
 public var message: String
 public var type: ToastType
 public var duration: TimeInterval

 public init(
 id: UUID = UUID(),
 message: String,
 type: ToastType = .info,
 duration: TimeInterval = 3.0
 ) {
 self.id = id
 self.message = message
 self.type = type
 self.duration = duration
 }
}

// MARK: - Toast Store

@Observable
public final class ToastStore: @unchecked Sendable {
 public static let shared = ToastStore()

 public var toasts: [Toast] = []
 private var timer: _Concurrency.Task<Void, Never>?

 private init() {}

 public func show(_ message: String, type: ToastType = .info, duration: TimeInterval = 3.0) {
 let toast = Toast(message: message, type: type, duration: duration)
 toasts.append(toast)

 timer?.cancel()
 timer = _Concurrency.Task {
 try? await _Concurrency.Task.sleep(nanoseconds: UInt64(duration * 1_000_000_000))
 await MainActor.run {
 if let index = toasts.firstIndex(where: { $0.id == toast.id }) {
 withAnimation(.swarmQuick) {
 toasts.remove(at: index)
 }
 }
 }
 }
 }

 public func success(_ message: String) {
 show(message, type: .success)
 }

 public func error(_ message: String) {
 show(message, type: .error)
 }

 public func warning(_ message: String) {
 show(message, type: .warning)
 }

 public func info(_ message: String) {
 show(message, type: .info)
 }
}

// MARK: - Toast View

public struct ToastView: View {
 let toast: Toast

 public init(_ toast: Toast) {
 self.toast = toast
 }

 public var body: some View {
 HStack(spacing: 8) {
 Image(systemName: toast.type.icon)
 .font(.swarm(.xs))
 .foregroundStyle(toast.type.color)

 Text(toast.message)
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextPrimary)
 .lineLimit(2)

 Spacer(minLength: 8)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background {
 RoundedRectangle(cornerRadius: 8, style: .continuous)
 .fill(.ultraThinMaterial)
 .overlay(
 RoundedRectangle(cornerRadius: 8, style: .continuous)
 .stroke(toast.type.color.opacity(0.3), lineWidth: 1)
 )
 }
 .shadow(color: .black.opacity(0.15), radius: 8, x: 0, y: 4)
 .padding(.trailing, 16)
 }
}

// MARK: - Toast Container

public struct ToastContainer: View {
 @Environment(ToastStore.self) private var toastStore

 public init() {}

 public var body: some View {
 VStack(alignment: .trailing, spacing: 8) {
 ForEach(toastStore.toasts) { toast in
 ToastView(toast)
 .transition(.move(edge: .top).combined(with: .opacity))
 }
 }
 .padding(.top, 60)
 .padding(.trailing, 8)
 .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topTrailing)
 .allowsHitTesting(false)
 }
}

// MARK: - View Extension

public extension View {
 func toastContainer() -> some View {
 self.environment(ToastStore.shared)
 .overlay(ToastContainer().environment(ToastStore.shared))
 }

 func showToast(_ message: String, type: ToastType = .info) {
 ToastStore.shared.show(message, type: type)
 }
}
