import SwiftUI

// MARK: - Onboarding Modal

public struct OnboardingModal: View {
 @Environment(\.dismiss) private var dismiss
 @Environment(AppState.self) private var appState
 @State private var currentStep: Int = 0
 @State private var isPresented: Bool = false
 @State private var particlesOpacity: Double = 0

 public let steps: [OnboardingStep] = [
 OnboardingStep(
 icon: "cpu.fill",
 title: "Spawn AI Agents",
 description: "Deploy Claude Code, Codex, Gemini, and more. Each agent runs in its own isolated worktree.",
 color: .swarmGold
 ),
 OnboardingStep(
 icon: "folder.fill",
 title: "Connect Workspace",
 description: "Open your project folder. SwarmAI maps your codebase for intelligent agent coordination.",
 color: .swarmInfo
 ),
 OnboardingStep(
 icon: "play.circle.fill",
 title: "Launch Swarm",
 description: "Start concurrent AI agents. Distribute tasks, review code, and ship faster together.",
 color: .swarmSuccess
 )
 ]

 public init() {}

 public var body: some View {
 ZStack {
 // Backdrop
 Color.black.opacity(isPresented ? 0.5 : 0)
 .ignoresSafeArea()
 .allowsHitTesting(isPresented)
 .onTapGesture {
 dismissOnboarding()
 }
 .animation(.spring(response: 0.4, dampingFraction: 0.85), value: isPresented)

 // Modal content
 VStack(spacing: 0) {
 // Header with logo
 headerView
 .padding(.top, 40)
 .padding(.horizontal, 32)

 // Step content
 stepContentView
 .padding(.horizontal, 32)
 .padding(.vertical, 24)

 // Step indicators
 stepIndicators
 .padding(.bottom, 8)

 // Action buttons
 actionButtons
 .padding(.horizontal, 32)
 .padding(.bottom, 32)
 }
 .frame(width: 520, height: 480)
 .background {
 ZStack {
 Color.swarmCanvas.opacity(0.95)

 // Subtle gradient
 LinearGradient(
 colors: [
 Color.swarmGold.opacity(0.03),
 Color.clear,
 Color.swarmInfo.opacity(0.02)
 ],
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 }
 }
 .overlay(
 RoundedRectangle(cornerRadius: 16, style: .continuous)
 .stroke(Color.swarmBorderSubtle.opacity(0.5), lineWidth: 1)
 )
 .shadow(color: .black.opacity(0.3), radius: 24, x: 0, y: 12)
 .scaleEffect(isPresented ? 1.0 : 0.9)
 .opacity(isPresented ? 1 : 0)
 }
 .onAppear {
 isPresented = true
 }
 }

 // MARK: - Header

 private var headerView: some View {
 VStack(spacing: 12) {
 // Logo
 Image(systemName: "ant.fill")
 .font(.system(size: 48))
 .foregroundStyle(Color.swarmGold)
 .shadow(color: Color.swarmGold.opacity(0.4), radius: 12, x: 0, y: 4)

 Text("Welcome to SwarmAI")
 .font(.swarm(.xxl, weight: .bold))
 .foregroundStyle(Color.swarmTextPrimary)

 Text("Your AI Agent Swarm Platform")
 .font(.swarm(.base))
 .foregroundStyle(Color.swarmTextSecondary)
 }
 }

 // MARK: - Step Content

 private var stepContentView: some View {
 let step = steps[currentStep]

 return VStack(spacing: 20) {
 // Step icon
 Image(systemName: step.icon)
 .font(.system(size: 40))
 .foregroundStyle(step.color)
 .padding(20)
 .background(
 Circle()
 .fill(step.color.opacity(0.1))
 )
 .shadow(color: step.color.opacity(0.2), radius: 8, x: 0, y: 4)

 // Step title
 Text(step.title)
 .font(.swarm(.xl, weight: .semibold))
 .foregroundStyle(Color.swarmTextPrimary)

 // Step description
 Text(step.description)
 .font(.swarm(.sm))
 .foregroundStyle(Color.swarmTextSecondary)
 .multilineTextAlignment(.center)
 .frame(maxWidth: 360)
 }
 .transition(.opacity.combined(with: .move(edge: .trailing)))
 }

 // MARK: - Step Indicators

 private var stepIndicators: some View {
 HStack(spacing: 8) {
 ForEach(0..<steps.count, id: \.self) { index in
 Capsule()
 .fill(index == currentStep ? Color.swarmGold : Color.swarmBorderSubtle)
 .frame(width: index == currentStep ? 24 : 8, height: 8)
 .animation(.swarmQuick, value: currentStep)
 }
 }
 }

 // MARK: - Action Buttons

 private var actionButtons: some View {
 HStack(spacing: 12) {
 // Skip button
 Button("Skip") {
 dismissOnboarding()
 }
 .font(.swarm(.sm))
 .foregroundStyle(Color.swarmTextTertiary)
 .buttonStyle(.plain)

 Spacer()

 // Back button
 if currentStep > 0 {
 Button("Back") {
 withAnimation(.swarmTabSwitch) {
 currentStep -= 1
 }
 }
 .font(.swarm(.sm, weight: .medium))
 .foregroundStyle(Color.swarmTextSecondary)
 .padding(.horizontal, 16)
 .padding(.vertical, 8)
 .background(
 Capsule()
 .fill(Color.swarmSurface)
 .overlay(
 Capsule()
 .stroke(Color.swarmBorderSubtle, lineWidth: 1)
 )
 )
 .buttonStyle(.plain)
 }

 // Next / Get Started button
 Button {
 if currentStep < steps.count - 1 {
 withAnimation(.swarmTabSwitch) {
 currentStep += 1
 }
 } else {
 dismissOnboarding()
 }
 } label: {
 HStack(spacing: 6) {
 Text(currentStep < steps.count - 1 ? "Next" : "Get Started")
 .font(.swarm(.sm, weight: .semibold))
 Image(systemName: currentStep < steps.count - 1 ? "arrow.right" : "checkmark")
 .font(.swarm(.xs))
 }
 .foregroundStyle(Color.swarmCanvas)
 .padding(.horizontal, 20)
 .padding(.vertical, 10)
 .background(
 Capsule()
 .fill(Color.swarmGold)
 )
 }
 .buttonStyle(.plain)
 .shadow(color: Color.swarmGold.opacity(0.3), radius: 8, x: 0, y: 4)
 }
 }

 private func dismissOnboarding() {
 withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
 isPresented = false
 }

 DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
 appState.isOnboardingSeen = true
 dismiss()
 }
 }
}

// MARK: - Onboarding Step Model

public struct OnboardingStep: Sendable, Identifiable {
 public let id = UUID()
 public let icon: String
 public let title: String
 public let description: String
 public let color: Color
}
