import SwiftUI
import AppKit
import CoreGraphics

// MARK: - Launch Splash Screen

struct SplashScreenView: View {
	@Environment(ThemeStore.self) private var themeStore
	@Environment(\.accessibilityReduceMotion) private var reduceMotion
	@Binding var isLaunching: Bool

	@State private var glowPulse = false
	@State private var particlesActive = false
	@State private var splashStartTime: CFAbsoluteTime = 0
	@State private var textRevealOffset: CGFloat = 80
	@State private var taglineOpacity: Double = 0
	@State private var taglineOffset: CGFloat = 8
	@State private var loadingDotsOpacity: Double = 0
	@State private var dotOpacities: [Double] = [1, 0.3, 0.3]
	@State private var hasStartedExit = false
	@State private var backgroundHueShift: CGFloat = 0
	@State private var isBursting = false
	@State private var burstOpacity: Double = 0
	@State private var burstScale: CGFloat = 1.0

	var body: some View {
		if isLaunching {
			ZStack {
				// Animated deep canvas background with subtle gradient shift
				ZStack {
					Color.swarmCanvas
						.ignoresSafeArea()

					LinearGradient(
						colors: [
							themeStore.currentTheme.color(for: .gold).opacity(0.03),
							Color.clear,
							themeStore.currentTheme.color(for: .info).opacity(0.02),
							Color.clear
						],
						startPoint: .topLeading,
						endPoint: .bottomTrailing
					)
					.ignoresSafeArea()
					.offset(x: backgroundHueShift, y: backgroundHueShift * 0.5)
					.onAppear {
						guard !reduceMotion else { return }
						withAnimation(.easeInOut(duration: 6.0).repeatForever(autoreverses: true)) {
							backgroundHueShift = 30
						}
					}
				}

				// Pulsing radial gradient glow with central aura
				RadialGradient(
					colors: [
						themeStore.currentTheme.color(for: .gold).opacity(glowPulse ? 0.18 : 0.06),
						.clear
					],
					center: .center,
					startRadius: 40,
					endRadius: 300
				)
				.ignoresSafeArea()
				.onAppear {
					guard !reduceMotion else { return }
					withAnimation(.easeInOut(duration: 2.0).repeatForever(autoreverses: true)) {
						glowPulse.toggle()
					}
				}

				// Particle system with trails and gold glow
				Canvas { context, size in
					guard !reduceMotion else { return }
					let center = CGPoint(x: size.width / 2, y: size.height / 2 - 20)
					let goldColor = themeStore.currentTheme.color(for: .gold)
					let goldRgb = themeStore.currentTheme.rgb(for: .gold)
					let nsColor = NSColor(goldColor).usingColorSpace(.deviceRGB) ?? NSColor(red: CGFloat(goldRgb[0])/255, green: CGFloat(goldRgb[1])/255, blue: CGFloat(goldRgb[2])/255, alpha: 1)
					let r = Double(nsColor.redComponent)
					let g = Double(nsColor.greenComponent)
					let b = Double(nsColor.blueComponent)
					let elapsed = CFAbsoluteTimeGetCurrent() - splashStartTime

					// Extended particle data: 48 particles (was 16)
					let particleData: [(angle: Double, distance: CGFloat, delay: Double)] = [
						// Ring 1 — inner circle
						(.pi * 0.00, 110, 0.00),
						(.pi * 0.17, 100, 0.03),
						(.pi * 0.33, 120, 0.06),
						(.pi * 0.50, 105, 0.09),
						(.pi * 0.67, 115, 0.12),
						(.pi * 0.83, 108, 0.15),
						(.pi * 1.00, 118, 0.18),
						(.pi * 1.17, 102, 0.21),
						(.pi * 1.33, 112, 0.24),
						(.pi * 1.50, 106, 0.27),
						(.pi * 1.67, 114, 0.30),
						(.pi * 1.83, 104, 0.33),
						// Ring 2 — outer circle
						(.pi * 0.08, 160, 0.05),
						(.pi * 0.25, 155, 0.10),
						(.pi * 0.42, 165, 0.15),
						(.pi * 0.58, 150, 0.20),
						(.pi * 0.75, 170, 0.25),
						(.pi * 0.92, 158, 0.30),
						(.pi * 1.08, 162, 0.35),
						(.pi * 1.25, 152, 0.40),
						(.pi * 1.42, 168, 0.45),
						(.pi * 1.58, 156, 0.50),
						(.pi * 1.75, 164, 0.55),
						(.pi * 1.92, 148, 0.60),
						// Ring 3 — widest scatter
						(.pi * 0.04, 195, 0.10),
						(.pi * 0.21, 200, 0.20),
						(.pi * 0.38, 190, 0.30),
						(.pi * 0.54, 205, 0.40),
						(.pi * 0.71, 185, 0.50),
						(.pi * 0.88, 198, 0.60),
						(.pi * 1.04, 192, 0.70),
						(.pi * 1.21, 202, 0.80),
						(.pi * 1.38, 188, 0.90),
						(.pi * 1.54, 196, 1.00),
						(.pi * 1.71, 182, 1.10),
						(.pi * 1.88, 200, 1.20),
						// Scattered accents
						(.pi * 0.12, 130, 0.07),
						(.pi * 0.29, 145, 0.14),
						(.pi * 0.46, 125, 0.21),
						(.pi * 0.63, 138, 0.28),
						(.pi * 0.79, 128, 0.35),
						(.pi * 0.96, 142, 0.42),
						(.pi * 1.13, 132, 0.49),
						(.pi * 1.29, 146, 0.56),
						(.pi * 1.46, 122, 0.63),
						(.pi * 1.62, 136, 0.70),
						(.pi * 1.79, 144, 0.77),
						(.pi * 1.96, 126, 0.84),
					]

					for (angle, distance, delay) in particleData {
						let t: CGFloat
						if isBursting {
							// Burst phase: particles explode outward
							let burstElapsed = min(1.0, max(0, (elapsed - (0.55 + delay * 0.5)) / 0.4))
							t = burstElapsed
						} else {
							let rawT = (elapsed - delay) / 0.8
							t = min(1.0, max(0, rawT))
						}

						let eased: CGFloat
						if isBursting {
							eased = t
						} else {
							eased = t < 0.4 ? CGFloat(t / 0.4) * 0.6 : 0.6 + CGFloat((t - 0.4) / 0.6) * 0.4
						}

						let currentDistance: CGFloat
						if isBursting {
							currentDistance = distance * (1.0 + eased * 1.5)
						} else {
							currentDistance = distance * eased
						}

						let x = center.x + CGFloat(cos(angle)) * currentDistance
						let y = center.y + CGFloat(sin(angle)) * currentDistance
						let baseAlpha: Double
						if isBursting {
							baseAlpha = particlesActive ? (1.0 - t) * 0.9 : 0
						} else {
							baseAlpha = particlesActive ? (1.0 - t) * 0.7 : 0
						}
						let particleSize: CGFloat = (3.0 * (0.6 + 0.4 * eased)).withMinimum(0.5)

						var color = Color(red: r, green: g, blue: b, opacity: baseAlpha)
						if t > 0.6 && !isBursting {
							color = color.opacity((1.0 - t) / 0.4 * 0.7)
						}

						// Gold glow for each particle — soft halo
						if particlesActive && !isBursting {
							let glowSize = particleSize * 2.5
							context.fill(
								Circle().path(in: CGRect(x: x - glowSize / 2, y: y - glowSize / 2, width: glowSize, height: glowSize)),
								with: .color(Color(red: r, green: g, blue: b, opacity: baseAlpha * 0.15))
							)
						}

						// Particle core
						context.fill(
							Circle().path(in: CGRect(x: x - particleSize / 2, y: y - particleSize / 2, width: particleSize, height: particleSize)),
							with: .color(color)
						)

						// Particle trail with gold glow
						if particlesActive && !isBursting && t > 0.2 && t < 0.85 {
							let trailAlpha = baseAlpha * 0.4 * (1.0 - (t - 0.2) / 0.65)
							let trailLength: CGFloat = 16 * eased
							let trailStart = CGPoint(x: x - CGFloat(cos(angle)) * trailLength / 2, y: y - CGFloat(sin(angle)) * trailLength / 2)
							let trailEnd = CGPoint(x: x + CGFloat(cos(angle)) * trailLength / 2, y: y + CGFloat(sin(angle)) * trailLength / 2)

							// Trail glow (wider, more transparent)
							context.stroke(
								Path { path in
									path.move(to: trailStart)
									path.addLine(to: trailEnd)
								},
								with: .color(color.opacity(trailAlpha * 0.3)),
								lineWidth: 3.0
							)
							// Trail core
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

					// Central glow aura with pulse
					if particlesActive {
						let pulseScale: CGFloat = 1.0 + 0.15 * sin(elapsed * 2.0)
						let auraRadius: CGFloat = 100 * pulseScale
						context.fill(
							Ellipse().path(in: CGRect(x: center.x - auraRadius, y: center.y - auraRadius, width: auraRadius * 2, height: auraRadius * 2)),
							with: .radialGradient(
								Gradient(colors: [
									Color(red: r, green: g, blue: b, opacity: 0.25),
									Color(red: r, green: g, blue: b, opacity: 0.08),
									.clear
								]),
								center: center,
								startRadius: 5,
								endRadius: auraRadius
							)
						)
					}

					// Burst flash overlay
					if isBursting && burstOpacity > 0 {
						let burstRadius: CGFloat = 200 * burstScale
						context.fill(
							Ellipse().path(in: CGRect(x: center.x - burstRadius, y: center.y - burstRadius, width: burstRadius * 2, height: burstRadius * 2)),
							with: .radialGradient(
								Gradient(colors: [
									Color(red: r, green: g, blue: b, opacity: 0.6 * burstOpacity),
									Color(red: r, green: g, blue: b, opacity: 0.15 * burstOpacity),
									.clear
								]),
								center: center,
								startRadius: 0,
								endRadius: burstRadius
							)
						)
					}
				}
				.ignoresSafeArea()
				.onAppear {
					splashStartTime = CFAbsoluteTimeGetCurrent()
					if reduceMotion {
						particlesActive = false
					} else {
						DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
							particlesActive = true
						}
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
					if !reduceMotion {
						Rectangle()
							.fill(Color.swarmCanvas)
							.frame(height: 80)
							.offset(y: textRevealOffset)
					}
				}
				.clipped()
				.frame(height: 80)
				.onAppear {
					if reduceMotion {
						textRevealOffset = -100
					} else {
						// Enhanced timing: slightly slower reveal for dramatic effect
						withAnimation(.spring(response: 0.7, dampingFraction: 0.75, blendDuration: 0).delay(0.15)) {
							textRevealOffset = -100
						}
					}
				}

				// Tagline — fades in after text reveal with proper delay
				Text("Intelligent Agent Swarms")
					.font(.system(size: 13, weight: .regular, design: .rounded))
					.foregroundStyle(themeStore.currentTheme.color(for: .textTertiary))
					.tracking(1.5)
					.opacity(taglineOpacity)
					.offset(y: taglineOffset)
					.onAppear {
						if reduceMotion {
							taglineOpacity = 0.7
							taglineOffset = 0
						} else {
							// Enhanced delay to sync with logo reveal completion
							withAnimation(.easeOut(duration: 0.7).delay(0.55)) {
								taglineOpacity = 0.7
								taglineOffset = 0
							}
						}
					}

				// Loading indicator — three pulsing dots with proper stagger
				HStack(spacing: 8) {
					ForEach(0..<3, id: \.self) { index in
						Circle()
							.fill(themeStore.currentTheme.color(for: .gold).opacity(dotOpacities[index]))
							.frame(width: 5, height: 5)
							.shadow(color: themeStore.currentTheme.color(for: .gold).opacity(0.4), radius: 2, x: 0, y: 0)
					}
				}
				.offset(y: 50)
				.opacity(loadingDotsOpacity)
				.onAppear {
					if reduceMotion {
						loadingDotsOpacity = 1
					} else {
						for i in 0..<3 {
							withAnimation(.easeInOut(duration: 0.55).delay(0.4 + Double(i) * 0.12).repeatForever(autoreverses: true)) {
								dotOpacities[i] = 0.15
							}
						}
						withAnimation(.easeIn(duration: 0.4).delay(0.35)) {
							loadingDotsOpacity = 1
						}
					}
				}

				// Burst flash overlay view
				Circle()
					.fill(themeStore.currentTheme.color(for: .gold).opacity(0.3 * burstOpacity))
					.frame(width: 400 * burstScale, height: 400 * burstScale)
					.blur(radius: 40)
					.opacity(burstOpacity)
					.allowsHitTesting(false)
			}
			.contentShape(Rectangle())
			.onTapGesture {
				dismissWithBurst()
			}
			.transition(.opacity)
			.onAppear {
				if reduceMotion {
					dismissImmediately()
				} else {
					// Standard duration: 0.9s for full particle animation
					DispatchQueue.main.asyncAfter(deadline: .now() + 0.9) {
						dismissWithBurst()
					}
					// Hard safety fallback timer at 1.2s
					DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
						if isLaunching {
							dismissImmediately()
						}
					}
				}
			}
		} else {
			EmptyView()
		}
	}

	private func dismissWithBurst() {
		guard !hasStartedExit else { return }
		hasStartedExit = true
		isBursting = true

		// Trigger burst flash
		withAnimation(.easeOut(duration: 0.35)) {
			burstOpacity = 1
			burstScale = 1.3
		}

		// Then fade out
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
			withAnimation(.easeIn(duration: 0.25)) {
				isLaunching = false
			}
		}
	}

	private func dismissImmediately() {
		guard !hasStartedExit else { return }
		hasStartedExit = true
		withAnimation(.easeInOut(duration: 0.25)) {
			isLaunching = false
		}
	}
}

// MARK: - CGFloat Minimum Helper

extension CGFloat {
	fileprivate func withMinimum(_ value: CGFloat) -> CGFloat {
		return Swift.max(self, value)
	}
}
