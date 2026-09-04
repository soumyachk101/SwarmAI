import SwiftUI

// MARK: - Verification Result

public struct ProviderVerificationResult: Sendable {
	public let isValid: Bool
	public let message: String

	public init(isValid: Bool, message: String) {
		self.isValid = isValid
		self.message = message
	}
}

// MARK: - Settings View

struct SettingsView: View {
	@Environment(\.dismiss) var dismiss
	@Environment(\.settingsStore) private var settingsStore
	@Environment(\.appState) private var appState
	@State private var selectedSection: SettingsSection = .general
	@State private var isPresented = false

	// Provider verification state
	@State private var verificationResults: [String: ProviderVerificationResult] = [:]
	@State private var verifyingProviders: Set<String> = []

	var body: some View {
		@Bindable var store = settingsStore

		ZStack {
			// Backdrop
			Color.swarmBackground.opacity(isPresented ? 0.5 : 0)
				.ignoresSafeArea()
				.allowsHitTesting(isPresented)
				.onTapGesture {
					dismissSettings()
				}
				.animation(.spring(response: 0.4, dampingFraction: 0.85), value: isPresented)

			// Hidden Escape Button for macOS keyboard shortcut routing
			Button("") {
				dismissSettings()
			}
			.keyboardShortcut(.cancelAction)
			.keyboardShortcut(.escape, modifiers: [])
			.opacity(0)
			.frame(width: 0, height: 0)

			VStack(spacing: 0) {
				// Title bar
				HStack {
					HStack(spacing: 8) {
						Image(systemName: "gearshape.fill")
							.foregroundStyle(Color.swarmGold)
						Text("Settings")
							.font(.swarm(.lg, weight: .semibold))
							.foregroundStyle(Color.swarmTextPrimary)
					}

					Spacer()

					Button {
						dismissSettings()
					} label: {
						Image(systemName: "xmark.circle.fill")
							.font(.system(size: 18))
							.foregroundStyle(Color.swarmTextTertiary)
					}
					.buttonStyle(.plain)
				}
				.padding(.horizontal, 20)
				.padding(.vertical, 14)

				Divider()
					.background(Color.swarmBorderSubtle)

				HStack(spacing: 0) {
					// Sidebar nav
					VStack(alignment: .leading, spacing: 2) {
						ForEach(SettingsSection.allCases) { section in
							SettingsNavButton(
								section: section,
								isSelected: selectedSection == section,
								onSelect: {
									selectedSection = section
								}
							)
						}
						Spacer()
					}
					.padding(12)
					.frame(width: 170)
					.background(Color.swarmSurface)

					Divider()
						.background(Color.swarmBorderSubtle)

					// Content
					ScrollView {
						VStack(alignment: .leading, spacing: 16) {
							switch selectedSection {
							case .general:
								generalSection(store: store)
							case .models:
								modelsSection(store: store)
							case .providers:
								providersSection(store: store)
							case .appearance:
								appearanceSection(store: store)
							case .terminal:
								terminalSection(store: store)
							case .updates:
								updatesSection()
							}
						}
						.padding(24)
					}
				}
			}
			.frame(width: 680, height: 540)
			.background(Color.swarmSurface)
			.cornerRadius(16)
			.overlay(
				RoundedRectangle(cornerRadius: 16)
					.stroke(Color.swarmBorderSubtle, lineWidth: 1)
			)
			.shadow(color: Color.swarmCanvas.opacity(0.4), radius: 30, x: 0, y: 10)
			.scaleEffect(isPresented ? 1.0 : 0.85)
			.opacity(isPresented ? 1 : 0)
			.animation(.spring(response: 0.4, dampingFraction: 0.85), value: isPresented)
		}
		.onKeyPress(.escape) {
			dismissSettings()
			return .handled
		}
		.onAppear {
			withAnimation(.spring(response: 0.4, dampingFraction: 0.85)) {
				isPresented = true
			}
			ensureDefaultProviders()
		}
	}

	private func dismissSettings() {
		withAnimation(.spring(response: 0.25, dampingFraction: 0.85)) {
			isPresented = false
		}
		DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
			appState.isSettingsOpen = false
			dismiss()
		}
	}

	// MARK: - Sections

	@ViewBuilder
	private func generalSection(store: SettingsStore) -> some View {
		@Bindable var bStore = store
		SettingsSectionHeader(title: "General Configuration")

		VStack(alignment: .leading, spacing: 12) {
			Picker("Default Agent", selection: $bStore.defaultAgent) {
				ForEach(AgentType.allCases) { type in
					Text(type.displayName).tag(type)
				}
			}
			.pickerStyle(.menu)
			.frame(maxWidth: 320)

			Toggle("Enable Notifications", isOn: $bStore.enableNotifications)
				.font(.swarm(.sm))

			HStack {
				Text("Auto-Save Interval (seconds):")
					.font(.swarm(.sm))
					.foregroundStyle(Color.swarmTextSecondary)
				TextField("Seconds", value: $bStore.autoSaveInterval, format: .number)
					.textFieldStyle(.roundedBorder)
					.frame(width: 80)
			}
		}
	}

	@ViewBuilder
	private func modelsSection(store: SettingsStore) -> some View {
		SettingsSectionHeader(title: "Default Model & Agents")

		LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 10) {
			ForEach(AgentType.allCases.filter { $0 != .plainTerminal }, id: \.self) { type in
				VStack(spacing: 6) {
					Text(type.icon)
						.font(.system(size: 26))

					Text(type.displayName)
						.font(.swarm(.xs, weight: .semibold))
						.foregroundStyle(Color.swarmTextPrimary)
				}
				.frame(maxWidth: .infinity)
				.padding(.vertical, 14)
				.background(
					RoundedRectangle(cornerRadius: 10)
						.fill(store.defaultAgent == type ? Color.swarmGold.opacity(0.15) : Color.swarmSurface)
						.overlay(
							RoundedRectangle(cornerRadius: 10)
								.stroke(store.defaultAgent == type ? Color.swarmGold : Color.swarmBorderSubtle, lineWidth: 1)
						)
				)
				.onTapGesture {
					store.setDefaultAgent(type)
				}
			}
		}
	}

	@ViewBuilder
	private func providersSection(store: SettingsStore) -> some View {
		SettingsSectionHeader(title: "Model Providers & API Keys")

		VStack(spacing: 16) {
			ForEach(store.apiKeys) { provider in
				ProviderRowView(
					provider: provider,
					verificationResult: verificationResults[provider.name],
					isVerifying: verifyingProviders.contains(provider.name),
					onVerify: {
						testProvider(provider)
					},
					onUpdateKey: { newKey in
						store.setApiKey(provider.name, key: newKey)
					},
					onUpdateBaseURL: { newURL in
						if let idx = store.apiKeys.firstIndex(where: { $0.name == provider.name }) {
							store.apiKeys[idx].baseURL = newURL.isEmpty ? nil : newURL
						}
					}
				)
			}
		}
	}

	@ViewBuilder
	private func appearanceSection(store: SettingsStore) -> some View {
		@Bindable var bStore = store
		SettingsSectionHeader(title: "Appearance & Theme")

		VStack(alignment: .leading, spacing: 12) {
			Picker("Theme Mode", selection: $bStore.themeMode) {
				ForEach(ThemeMode.allCases, id: \.self) { mode in
					Text(mode.title).tag(mode)
				}
			}
			.pickerStyle(.segmented)
			.frame(width: 240)
		}
	}

	@ViewBuilder
	private func terminalSection(store: SettingsStore) -> some View {
		@Bindable var bStore = store
		SettingsSectionHeader(title: "Terminal Preferences")

		VStack(alignment: .leading, spacing: 12) {
			Picker("Shell", selection: $bStore.terminalShell) {
				Text("zsh (/bin/zsh)").tag("zsh")
				Text("bash (/bin/bash)").tag("bash")
				Text("fish (/opt/homebrew/bin/fish)").tag("fish")
			}
			.pickerStyle(.menu)
			.frame(width: 240)
		}
	}

	@ViewBuilder
	private func updatesSection() -> some View {
		SettingsSectionHeader(title: "Software Updates")

		VStack(alignment: .leading, spacing: 12) {
			Text("SwarmAI macOS Native v1.0.0")
				.font(.swarm(.sm, weight: .medium))
				.foregroundStyle(Color.swarmTextPrimary)

			Text("You are on the latest production build.")
				.font(.swarm(.xs))
				.foregroundStyle(Color.swarmTextSecondary)

			Button {
				// Check for updates
			} label: {
				Text("Check for Updates")
					.font(.swarm(.sm, weight: .medium))
					.padding(.horizontal, 14)
					.padding(.vertical, 6)
					.background(Color.swarmGold.opacity(0.2))
					.foregroundStyle(Color.swarmGold)
					.cornerRadius(6)
			}
			.buttonStyle(.plain)
		}
	}

	private func ensureDefaultProviders() {
		let defaults = ["Anthropic (Claude)", "OpenAI", "Google Gemini", "Ollama (Local)", "DeepSeek", "Groq", "OpenRouter"]
		for name in defaults {
			if !settingsStore.apiKeys.contains(where: { $0.name == name }) {
				settingsStore.apiKeys.append(Provider(name: name, apiKey: ""))
			}
		}
	}

	private func testProvider(_ provider: Provider) {
		verifyingProviders.insert(provider.name)
		_Concurrency.Task {
			do {
				let isValid = try await LLMClient.shared.verifyProvider(provider: provider)
				await MainActor.run {
					verificationResults[provider.name] = ProviderVerificationResult(isValid: isValid, message: isValid ? "Verified" : "Failed")
					verifyingProviders.remove(provider.name)
				}
			} catch {
				await MainActor.run {
					verificationResults[provider.name] = ProviderVerificationResult(isValid: false, message: error.localizedDescription)
					verifyingProviders.remove(provider.name)
				}
			}
		}
	}
}

// MARK: - Provider Row Subview

struct ProviderRowView: View {
	let provider: Provider
	let verificationResult: ProviderVerificationResult?
	let isVerifying: Bool
	let onVerify: () -> Void
	let onUpdateKey: (String) -> Void
	let onUpdateBaseURL: (String) -> Void

	@State private var apiKey: String = ""
	@State private var baseURL: String = ""

	var body: some View {
		VStack(alignment: .leading, spacing: 8) {
			HStack {
				Text(provider.name)
					.font(.swarm(.sm, weight: .semibold))
					.foregroundStyle(Color.swarmTextPrimary)

				Spacer()

				// Verification result pill
				if let result = verificationResult {
					HStack(spacing: 4) {
						Image(systemName: result.isValid ? "checkmark.circle.fill" : "exclamationmark.triangle.fill")
							.font(.system(size: 11))
						Text(result.message)
							.font(.swarm(.micro))
					}
					.foregroundStyle(result.isValid ? Color.swarmSuccess : Color.swarmError)
					.padding(.horizontal, 6)
					.padding(.vertical, 2)
					.background(result.isValid ? Color.swarmSuccess.opacity(0.1) : Color.swarmError.opacity(0.1))
					.cornerRadius(4)
				}

				// Test connection button
				Button {
					onVerify()
				} label: {
					HStack(spacing: 4) {
						if isVerifying {
							ProgressView()
								.controlSize(.mini)
						} else {
							Image(systemName: "bolt.fill")
								.font(.system(size: 10))
						}
						Text(isVerifying ? "Testing..." : "Verify")
							.font(.swarm(.micro, weight: .medium))
					}
					.padding(.horizontal, 8)
					.padding(.vertical, 4)
					.background(Color.swarmGold.opacity(0.15))
					.foregroundStyle(Color.swarmGold)
					.cornerRadius(5)
				}
				.buttonStyle(.plain)
				.disabled(isVerifying || apiKey.isEmpty)
			}

			// API Key field
			SecureField("API Key (e.g. sk-...)", text: $apiKey)
				.font(.swarmMono(.xs))
				.textFieldStyle(.plain)
				.padding(8)
				.background(Color.swarmCanvas)
				.cornerRadius(6)
				.overlay(
					RoundedRectangle(cornerRadius: 6)
						.stroke(Color.swarmBorderSubtle, lineWidth: 1)
				)
				.onChange(of: apiKey) { _, newValue in
					onUpdateKey(newValue)
				}

			// Custom Base URL
			HStack(spacing: 6) {
				Text("Base URL:")
					.font(.swarm(.micro))
					.foregroundStyle(Color.swarmTextTertiary)

				TextField("Optional Base URL override", text: $baseURL)
					.font(.swarmMono(.micro))
					.textFieldStyle(.plain)
					.padding(6)
					.background(Color.swarmCanvas)
					.cornerRadius(4)
					.overlay(
						RoundedRectangle(cornerRadius: 4)
							.stroke(Color.swarmBorderSubtle, lineWidth: 0.5)
					)
					.onChange(of: baseURL) { _, newValue in
						onUpdateBaseURL(newValue)
					}
			}
		}
		.padding(12)
		.background(Color.swarmCanvas.opacity(0.4))
		.cornerRadius(8)
		.onAppear {
			apiKey = provider.apiKey
			baseURL = provider.baseURL ?? ""
		}
	}
}

// MARK: - Subviews

struct SettingsSectionHeader: View {
	let title: String

	var body: some View {
		Text(title.uppercased())
			.font(.swarm(.xs, weight: .bold))
			.foregroundStyle(Color.swarmTextTertiary)
			.padding(.bottom, 4)
	}
}

enum SettingsSection: String, CaseIterable, Identifiable {
	case general = "General"
	case models = "Models"
	case providers = "Providers"
	case appearance = "Appearance"
	case terminal = "Terminal"
	case updates = "Updates"

	var icon: String {
		switch self {
		case .general: return "gearshape"
		case .models: return "cpu"
		case .providers: return "key.fill"
		case .appearance: return "paintbrush"
		case .terminal: return "terminal"
		case .updates: return "arrow.down.circle"
		}
	}

	var id: String { rawValue }
	var title: String { rawValue }
}

struct SettingsNavButton: View {
	let section: SettingsSection
	let isSelected: Bool
	let onSelect: () -> Void

	var body: some View {
		Button(action: onSelect) {
			HStack(spacing: 8) {
				Image(systemName: section.icon)
					.font(.swarm(.xs))

				Text(section.title)
					.font(.swarm(.sm, weight: isSelected ? .medium : .regular))
			}
			.foregroundStyle(isSelected ? Color.swarmGold : Color.swarmTextSecondary)
			.padding(.horizontal, 12)
			.padding(.vertical, 8)
			.frame(maxWidth: .infinity, alignment: .leading)
			.background(
				Group {
					if isSelected {
						RoundedRectangle(cornerRadius: 6)
							.fill(Color.swarmGold.opacity(0.12))
					}
				}
			)
		}
		.buttonStyle(.plain)
	}
}


