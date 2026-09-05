import SwiftUI

// MARK: - Skeleton Views

public struct SkeletonCard: View {
 @State private var shimmerPhase: CGFloat = 0
 @Environment(\.accessibilityReduceMotion) private var reduceMotion

 public var cornerRadius: CGFloat = 10
 public var height: CGFloat = 120

 public init(cornerRadius: CGFloat = 10, height: CGFloat = 120) {
 self.cornerRadius = cornerRadius
 self.height = height
 }

 public var body: some View {
 RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
 .fill(Color.swarmSurface)
 .overlay(
 LinearGradient(
 gradient: Gradient(colors: [
 Color.clear,
 Color.swarmBorderSubtle.opacity(0.3),
 Color.clear
 ]),
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 .mask(
 RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
 )
 .offset(x: shimmerOffset, y: 0)
 )
 .frame(height: height)
 .onAppear {
 guard !reduceMotion else { return }
 withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
 shimmerPhase = 1
 }
 }
 }

 private var shimmerOffset: CGFloat {
 return reduceMotion ? 0 : (shimmerPhase - 0.5) * 300
 }
}

public struct SkeletonText: View {
 @State private var shimmerPhase: CGFloat = 0
 @Environment(\.accessibilityReduceMotion) private var reduceMotion

 public var width: CGFloat = 160
 public var height: CGFloat = 14
 public var cornerRadius: CGFloat = 4

 public init(width: CGFloat = 160, height: CGFloat = 14, cornerRadius: CGFloat = 4) {
 self.width = width
 self.height = height
 self.cornerRadius = cornerRadius
 }

 public var body: some View {
 RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
 .fill(Color.swarmSurface)
 .overlay(
 LinearGradient(
 gradient: Gradient(colors: [
 Color.clear,
 Color.swarmBorderSubtle.opacity(0.3),
 Color.clear
 ]),
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 .mask(
 RoundedRectangle(cornerRadius: cornerRadius, style: .continuous)
 )
 .offset(x: shimmerOffset, y: 0)
 )
 .frame(width: width, height: height)
 .onAppear {
 guard !reduceMotion else { return }
 withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
 shimmerPhase = 1
 }
 }
 }

 private var shimmerOffset: CGFloat {
 return reduceMotion ? 0 : (shimmerPhase - 0.5) * 300
 }
}

public struct SkeletonCircle: View {
 @State private var shimmerPhase: CGFloat = 0
 @Environment(\.accessibilityReduceMotion) private var reduceMotion

 public var diameter: CGFloat = 40

 public init(diameter: CGFloat = 40) {
 self.diameter = diameter
 }

 public var body: some View {
 Circle()
 .fill(Color.swarmSurface)
 .overlay(
 LinearGradient(
 gradient: Gradient(colors: [
 Color.clear,
 Color.swarmBorderSubtle.opacity(0.3),
 Color.clear
 ]),
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 .mask(Circle())
 .offset(x: shimmerOffset, y: 0)
 )
 .frame(width: diameter, height: diameter)
 .onAppear {
 guard !reduceMotion else { return }
 withAnimation(.linear(duration: 1.5).repeatForever(autoreverses: false)) {
 shimmerPhase = 1
 }
 }
 }

 private var shimmerOffset: CGFloat {
 return reduceMotion ? 0 : (shimmerPhase - 0.5) * 300
 }
}

public struct SkeletonList: View {
 public let count: Int

 public init(count: Int = 5) {
 self.count = count
 }

 public var body: some View {
 VStack(spacing: 12) {
 ForEach(0..<count, id: \.self) { _ in
 HStack(spacing: 12) {
 SkeletonCircle(diameter: 32)
 VStack(alignment: .leading, spacing: 6) {
 SkeletonText(width: 120, height: 12)
 SkeletonText(width: 80, height: 10)
 }
 Spacer()
 }
 }
 }
 }
}

