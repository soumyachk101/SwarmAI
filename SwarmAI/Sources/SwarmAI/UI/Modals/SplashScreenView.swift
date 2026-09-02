import SwiftUI

// MARK: - Launch Splash Screen

struct SplashScreenView: View {
	@Environment(ThemeStore.self) private var themeStore
	@Binding var isLaunching: Bool

	@State private var glowPulse = false
	@State private var particlesActive = false
	@State private var splashStartTime: CFAbsoluteTime = 0
	@State private var textRevealOffset: CGFloat = 80
	@State private var taglineOpacity: Double = 0
	@State private var taglineOffset: CGFloat = 8
	@State private var loadingDotsOpacity: Double = 0
	@State private var dotOpacities: [Double] = [1, 0.3, 0.3]

	var body: some View {
		if isLaunching {
			ZStack {
				// Deep canvas background
				Color.swarmCanvas
					.ignoresSafeArea()

				// Pulsing radial gradient glow
				RadialGradient(
					colors: [
						themeStore.currentTheme.color(for: .gold).opacity(glowPulse ? 0.15 : 0.06),
						.clear
					],
					center: .center,
					startRadius: 40,
					endRadius: 280
				)
				.ignoresSafeArea()
				.onAppear {
					withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
						glowPulse.toggle()
					}
				}

				// Particle glow burst behind the logo
				Canvas { context, size in
					let center = CGPoint(x: size.width / 2, y: size.height / 2 - 20)
					let goldComponents = themeStore.currentTheme.color(for: .gold)
					let c = goldComponents.cgColor?.components ?? [212/255, 175/255, 55/255, 1]
					let elapsed = CFAbsoluteTimeGetCurrent() - splashStartTime

					let particleData: [(angle: Double, distance: CGFloat, delay: Double)] = [
						(.pi * 0.0, 140, 0.0),
						(.pi * 0.25, 130, 0.08),
						(.pi * 0.5, 150, 0.16),
						(.pi * 0.75, 125, 0.24),
						(.pi * 1.0, 145, 0.32),
						(.pi * 1.25, 135, 0.40),
						(.pi * 1.5, 155, 0.48),
						(.pi * 1.75, 128, 0.56),
						(.pi * 0.125, 160, 0.12),
						(.pi * 0.375, 120, 0.20),
						(.pi * 0.625, 148, 0.28),
						(.pi * 0.875, 132, 0.36),
						(.pi * 1.125, 138, 0.44),
						(.pi * 1.375, 142, 0.52),
						(.pi * 1.625, 118, 0.60),
						(.pi * 1.875, 152, 0.68),
					]

					for (angle, distance, delay) in particleData {
						let t = min(1.0, max(0, (elapsed - delay) / 0.8))
						let eased: CGFloat = t < 0.4 ? CGFloat(t / 0.4) * 0.6 : 0.6 + CGFloat((t - 0.4) / 0.6) * 0.4
						let currentDistance = distance * eased
						let x = center.x + CGFloat(cos(angle)) * currentDistance
						let y = center.y + CGFloat(sin(angle)) * currentDistance
						let baseAlpha = particlesActive ? (1.0 - t) * 0.7 : 0
						let particleSize: CGFloat = 3.0 * (0.6 + 0.4 * eased)

						var color = Color(red: c[0], green: c[1], blue: c[2], opacity: baseAlpha)
						if t > 0.6 {
							color = color.opacity((1.0 - t) / 0.4 * 0.7)
						}

						context.fill(
							Circle().path(in: CGRect(x: x - particleSize / 2, y: y - particleSize / 2, width: particleSize, height: particleSize)),
							with: .color(color)
						)

						if t > 0.3 && t < 0.8 {
							let trailAlpha = baseAlpha * 0.3 * (1.0 - (t - 0.3) / 0.5)
							let trailLength: CGFloat = 12 * eased
							let trailStart = CGPoint(x: x - CGFloat(cos(angle)) * trailLength / 2, y: y - CGFloat(sin(angle)) * trailLength / 2)
							let trailEnd = CGPoint(x: x + CGFloat(cos(angle)) * trailLength / 2, y: y + CGFloat(sin(angle)) * trailLength / 2)

							context.stroke(
								Path { path in
									path.move(to: trailStart)
									path.addLine(to: trailEnd)
								},
								with: .color(color.opacity(trailAlpha)),
								lineWidth: 1.0
							)
						}
					}

					// Central glow aura
					if particlesActive {
						context.fill(
							Ellipse().path(in: CGRect(x: center.x - 90, y: center.y - 90, width: 180, height: 180)),
							with: .radialGradient(
								Gradient(colors: [
									Color(red: c[0], green: c[1], blue: c[2], opacity: 0.2),
									Color(red: c[0], green: c[1], blue: c[2], opacity: 0.05),
									.clear
								]),
								center: center,
								startRadius: 5,
								endRadius: 90
							)
						)
					}
				}
				.ignoresSafeArea()
				.onAppear {
					splashStartTime = CFAbsoluteTimeGetCurrent()
					DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
						particlesActive = true
					}
				}

				// Logo text with clip-mask reveal
				ZStack {
					Text("SwarmAI")
						.font(.system(size: 52, weight: .light, design: .default))
						.foregroundStyle(themeStore.currentTheme.color(for: .textPrimary))
						.tracking(4)
						.kerning(6)
						.shadow(color: themeStore.currentTheme.color(for: .gold).opacity(0.2), radius: 20, x: 0, y: 4)

					// Mask — slides up to reveal text behind it
					Rectangle()
						.fill(Color.swarmCanvas)
						.frame(height: 80)
						.offset(y: textRevealOffset)
				}
				.clipped()
				.frame(height: 80)
				.onAppear {
					withAnimation(.spring(response: 0.6, dampingFraction: 0.8, blendDuration: 0)) {
						textRevealOffset = -100
					}
				}

				// Tagline — fades in after text reveal
				Text("Intelligent Agent Swarms")
					.font(.system(size: 13, weight: .regular, design: .rounded))
					.foregroundStyle(themeStore.currentTheme.color(for: .textTertiary))
					.tracking(1.5)
					.opacity(taglineOpacity)
					.offset(y: taglineOffset)
					.onAppear {
						withAnimation(.easeIn(duration: 0.8).delay(0.6)) {
							taglineOpacity = 0.7
							taglineOffset = 0
						}
					}

				// Loading indicator — three pulsing dots
				HStack(spacing: 8) {
					ForEach(0..<3, id: \.self) { index in
						Circle()
							.fill(themeStore.currentTheme.color(for: .gold).opacity(dotOpacities[index]))
							.frame(width: 5, height: 5)
					}
				}
				.offset(y: 50)
				.opacity(loadingDotsOpacity)
				.onAppear {
					for i in 0..<3 {
						withAnimation(.easeInOut(duration: 0.6).delay(0.8 + Double(i) * 0.15).repeatForever(autoreverses: true)) {
							dotOpacities[i] = 0.2
						}
					}
					withAnimation(.easeIn(duration: 0.5).delay(0.7)) {
						loadingDotsOpacity = 1
					}
				}
			}
			.transition(.scale(scale: 1.05).combined(with: .opacity))
			.onAppear {
				// Trigger exit after 2.3s delay
				DispatchQueue.main.asyncAfter(deadline: .now() + 2.3) {
					withAnimation(.easeInOut(duration: 0.6)) {
						isLaunching = false
					}
				}
			}
		} else {
			EmptyView()
		}
	}
}
