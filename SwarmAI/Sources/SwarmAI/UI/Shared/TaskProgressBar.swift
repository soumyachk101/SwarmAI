import SwiftUI

// MARK: - Task Progress Bar

public struct TaskProgressBar: View {
 public let progress: Double
 public var label: String?
 public var color: Color = .swarmGold
 public var showLabel: Bool = true
 public var height: CGFloat = 8

 @State private var animatedProgress: Double = 0

 public init(
 progress: Double,
 label: String? = nil,
 color: Color = .swarmGold,
 showLabel: Bool = true,
 height: CGFloat = 8
 ) {
 self.progress = max(0, min(1, progress))
 self.label = label
 self.color = color
 self.showLabel = showLabel
 self.height = height
 }

 public var body: some View {
 VStack(alignment: .leading, spacing: 4) {
 if showLabel, let label = label {
 HStack {
 Text(label)
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextSecondary)
 Spacer()
 Text("\(Int(progress * 100))%")
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 }
 }

 			GeometryReader { geo in
				ZStack(alignment: .leading) {
					// Background track
					RoundedRectangle(cornerRadius: height / 2, style: .continuous)
						.fill(Color.swarmSurface)
						.overlay(
							RoundedRectangle(cornerRadius: height / 2, style: .continuous)
								.stroke(Color.swarmBorderSubtle.opacity(0.5), lineWidth: 0.5)
						)

					// Animated fill
					RoundedRectangle(cornerRadius: height / 2, style: .continuous)
						.fill(
							LinearGradient(
								colors: [color.opacity(0.8), color],
								startPoint: .leading,
								endPoint: .trailing
							)
						)
						.frame(width: max(0, CGFloat(progress) * geo.size.width), height: height)
						.animation(.easeInOut(duration: 0.5), value: progress)
				}
			}
			.frame(height: height)
 }
 }
}

// MARK: - Circular Progress

public struct CircularProgressBar: View {
 public let value: Double
 public let max: Double
 public var size: CGFloat = 40
 public var strokeWidth: CGFloat = 3
 public var color: Color = .swarmGold

 @State private var animatedValue: Double = 0

 public init(
 value: Double,
 max: Double = 100,
 size: CGFloat = 40,
 strokeWidth: CGFloat = 3,
 color: Color = .swarmGold
 ) {
 self.value = value
 self.max = max
 self.size = size
 self.strokeWidth = strokeWidth
 self.color = color
 }

 public var body: some View {
 let pct = max > 0 ? min(value / max, 1.0) : 0
 let radius = (size - strokeWidth) / 2
 let circumference = 2 * .pi * radius
 let offset = circumference * (1 - pct)

 return ZStack {
 // Background circle
 Circle()
 .stroke(Color.swarmBorderSubtle.opacity(0.3), lineWidth: strokeWidth)

 // Progress arc
 Circle()
 .trim(from: 0, to: pct)
 .stroke(
 LinearGradient(
 colors: [color.opacity(0.7), color],
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 ),
 style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round)
 )
 .rotationEffect(.degrees(-90))
 .animation(.easeInOut(duration: 0.8), value: pct)

 // Center text
 Text("\(Int(pct * 100))%")
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextSecondary)
 }
 .frame(width: size, height: size)
 }
}

