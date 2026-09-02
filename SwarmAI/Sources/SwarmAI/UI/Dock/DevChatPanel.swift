import SwiftUI

// MARK: - DevChat Panel

public struct DevChatPanel: View {
  @Environment(\.settingsStore) private var settingsStore
  @State private var messages: [LLMChatMessage] = [
    LLMChatMessage(
      role: .assistant,
      content: "Hello! I'm SwarmAI GlassChat, your intelligent coding copilot. How can I assist you with your project today?"
    )
  ]
  @State private var inputText: String = ""
  @State private var contentAppeared = false
  @State private var isStreaming = false
  @State private var activeStreamTask: _Concurrency.Task<Void, Never>?
  @State private var currentReasoning: String = ""
  @State private var currentStreamingContent: String = ""
  @State private var selectedProvider: Provider = Provider.anthropicPreset
  @State private var selectedModel: String = "claude-3-7-sonnet-20250219"
  @State private var availableModels: [String] = []
  @State private var localProviders: [LocalProviderInfo] = []
  @State private var showConfigPopover: Bool = false
  @State private var promptTokens: Int = 0
  @State private var completionTokens: Int = 0
  @State private var errorMessage: String? = nil

  public init() {}

  public var body: some View {
    VStack(alignment: .leading, spacing: 0) {
      // Header with Provider & Model Selection
      headerView
        .opacity(contentAppeared ? 1 : 0)
        .animation(.easeOut(duration: 0.4).delay(0.05), value: contentAppeared)

      Divider()
        .background(.swarmBorderSubtle)

      // Active Error Banner
      if let error = errorMessage {
        HStack(spacing: 8) {
          Image(systemName: "exclamationmark.triangle.fill")
            .foregroundStyle(.swarmError)
          Text(error)
            .font(.swarm(.xs))
            .foregroundStyle(.swarmTextPrimary)
            .lineLimit(2)
          Spacer()
          Button {
            errorMessage = nil
          } label: {
            Image(systemName: "xmark")
              .font(.system(size: 10))
              .foregroundStyle(.swarmTextTertiary)
          }
          .buttonStyle(.plain)
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 6)
        .background(.swarmError.opacity(0.15))
      }

      // Messages ScrollView
      ScrollViewReader { proxy in
        ScrollView {
          VStack(spacing: 12) {
            ForEach(messages) { message in
              DevChatMessageBubble(message: message)
            }

            // Live streaming bubble if currently generating
            if isStreaming && (!currentStreamingContent.isEmpty || !currentReasoning.isEmpty) {
              DevChatMessageBubble(
                message: LLMChatMessage(
                  role: .assistant,
                  content: currentStreamingContent,
                  reasoningContent: currentReasoning.isEmpty ? nil : currentReasoning
                ),
                isCurrentlyStreaming: true
              )
            }

            Color.clear
              .frame(height: 1)
              .id("chatBottom")
          }
          .padding(.horizontal, 12)
          .padding(.top, 10)
          .padding(.bottom, 10)
        }
        .background(.swarmCanvas)
        .onChange(of: messages.count) { _, _ in
          withAnimation(.easeOut(duration: 0.2)) {
            proxy.scrollTo("chatBottom", anchor: .bottom)
          }
        }
        .onChange(of: currentStreamingContent) { _, _ in
          proxy.scrollTo("chatBottom", anchor: .bottom)
        }
      }

      // Input Bar
      inputBarView
        .opacity(contentAppeared ? 1 : 0)
        .offset(y: contentAppeared ? 0 : 8)
        .animation(.easeOut(duration: 0.4).delay(0.3), value: contentAppeared)
    }
    .modifier(PanelEntryModifier(appeared: $contentAppeared))
    .onAppear {
      contentAppeared = false
      setupInitialProvider()
      _Concurrency.Task {
        await refreshLocalDiscovery()
      }
      DispatchQueue.main.asyncAfter(deadline: .now() + 0.02) {
        contentAppeared = true
      }
    }
  }

  // MARK: - Header View

  private var headerView: some View {
    HStack(spacing: 8) {
      Menu {
        Section("Configured Providers") {
          ForEach(settingsStore.apiKeys) { provider in
            Button {
              selectProvider(provider)
            } label: {
              HStack {
                Text(provider.name)
                if selectedProvider.name == provider.name {
                  Image(systemName: "checkmark")
                }
              }
            }
          }
        }

        if !localProviders.isEmpty {
          Section("Discovered Local AI") {
            ForEach(localProviders) { local in
              Button {
                selectLocalProvider(local)
              } label: {
                HStack {
                  Text("\(local.name) (\(local.models.count) models)")
                  if selectedProvider.name == local.name {
                    Image(systemName: "checkmark")
                  }
                }
              }
            }
          }
        }

        Section("Preset Providers") {
          ForEach(Provider.defaultPresets) { preset in
            Button {
              selectProvider(preset)
            } label: {
              HStack {
                Text(preset.name)
                if selectedProvider.name == preset.name {
                  Image(systemName: "checkmark")
                }
              }
            }
          }
        }
      } label: {
        HStack(spacing: 4) {
          Circle()
            .fill(selectedProvider.apiKey.isEmpty && selectedProvider.resolvedType != .ollama && selectedProvider.resolvedType != .lmstudio ? .swarmWarning : .swarmSuccess)
            .frame(width: 6, height: 6)

          Text(selectedProvider.name)
            .font(.swarm(.xs, weight: .semibold))
            .foregroundStyle(.swarmTextPrimary)

          Image(systemName: "chevron.down")
            .font(.system(size: 8))
            .foregroundStyle(.swarmTextTertiary)
        }
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(.swarmSurface)
        .cornerRadius(6)
      }
      .menuStyle(.borderlessButton)

      // Model Selector
      Menu {
        ForEach(availableModels, id: \.self) { model in
          Button {
            selectedModel = model
          } label: {
            HStack {
              Text(model)
              if selectedModel == model {
                Image(systemName: "checkmark")
              }
            }
          }
        }
      } label: {
        HStack(spacing: 4) {
          Text(selectedModel.isEmpty ? "Select Model" : selectedModel)
            .font(.swarmMono(.micro))
            .foregroundStyle(.swarmTextSecondary)
            .lineLimit(1)
            .truncationMode(.middle)

          Image(systemName: "chevron.down")
            .font(.system(size: 8))
            .foregroundStyle(.swarmTextTertiary)
        }
        .frame(maxWidth: 140, alignment: .leading)
        .padding(.horizontal, 6)
        .padding(.vertical, 4)
        .background(.swarmSurface)
        .cornerRadius(6)
      }
      .menuStyle(.borderlessButton)

      Spacer()

      // Clear Chat
      Button {
        clearChat()
      } label: {
        Image(systemName: "trash")
          .font(.swarm(.xs))
          .foregroundStyle(.swarmTextTertiary)
      }
      .buttonStyle(.plain)
      .help("Clear Conversation")
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
  }

  // MARK: - Input Bar View

  private var inputBarView: some View {
    HStack(spacing: 8) {
      TextField("Ask DevChat or request code...", text: $inputText, axis: .vertical)
        .font(.swarm(.sm))
        .textFieldStyle(.plain)
        .lineLimit(1...5)
        .onSubmit {
          if !NSEvent.modifierFlags.contains(.shift) {
            sendUserMessage()
          }
        }

      if isStreaming {
        Button {
          stopStreaming()
        } label: {
          Image(systemName: "stop.circle.fill")
            .font(.system(size: 22))
            .foregroundStyle(.swarmError)
        }
        .buttonStyle(.plain)
        .help("Stop Generation")
      } else {
        Button {
          sendUserMessage()
        } label: {
          Image(systemName: "arrow.up.circle.fill")
            .font(.system(size: 22))
            .foregroundStyle(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? .swarmTextTertiary : .swarmGold)
        }
        .buttonStyle(.plain)
        .disabled(inputText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
        .help("Send Message (Enter)")
      }
    }
    .padding(.horizontal, 12)
    .padding(.vertical, 8)
    .background(.swarmSurface)
    .overlay(alignment: .top) {
      Divider()
        .background(.swarmBorderSubtle)
    }
  }

  // MARK: - Actions & Streaming

  private func setupInitialProvider() {
    if let firstConfigured = settingsStore.apiKeys.first(where: { !$0.apiKey.isEmpty }) {
      selectProvider(firstConfigured)
    } else {
      selectProvider(Provider.anthropicPreset)
    }
  }

  private func selectProvider(_ provider: Provider) {
    var effective = provider
    if let savedKey = settingsStore.apiKey(for: provider.name), !savedKey.isEmpty {
      effective.apiKey = savedKey
    }
    selectedProvider = effective
    availableModels = effective.models.isEmpty ? [effective.defaultModel] : effective.models
    selectedModel = effective.defaultModel.isEmpty ? (availableModels.first ?? "") : effective.defaultModel

    _Concurrency.Task {
      if let fetched = try? await LLMClient.shared.fetchAvailableModels(provider: effective), !fetched.isEmpty {
        await MainActor.run {
          self.availableModels = fetched
          if !fetched.contains(self.selectedModel) {
            self.selectedModel = fetched.first ?? self.selectedModel
          }
        }
      }
    }
  }

  private func selectLocalProvider(_ local: LocalProviderInfo) {
    let p = Provider(
      name: local.name,
      apiKey: "local",
      models: local.models,
      defaultModel: local.models.first ?? "",
      endpoint: local.endpoint,
      baseURL: local.baseURL,
      isActive: true
    )
    selectedProvider = p
    availableModels = local.models
    selectedModel = local.models.first ?? ""
  }

  private func refreshLocalDiscovery() async {
    let discovered = await LLMClient.shared.discoverLocalProviders()
    await MainActor.run {
      self.localProviders = discovered
    }
  }

  private func sendUserMessage() {
    let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
    guard !text.isEmpty, !isStreaming else { return }

    let userMsg = LLMChatMessage(role: .user, content: text)
    messages.append(userMsg)
    inputText = ""
    errorMessage = nil

    currentStreamingContent = ""
    currentReasoning = ""
    isStreaming = true

    let provider = selectedProvider
    let model = selectedModel
    let chatHistory = messages

    activeStreamTask = _Concurrency.Task {
      do {
        let stream = LLMClient.shared.streamChat(
          provider: provider,
          model: model,
          messages: chatHistory,
          systemPrompt: "You are SwarmAI GlassChat, a high-performance, expert software architect and coding copilot for macOS. Provide concise, clean, production-ready code with clear explanations."
        )

        for try await event in stream {
          if _Concurrency.Task.isCancelled { break }
          await MainActor.run {
            switch event {
            case .textDelta(let delta):
              self.currentStreamingContent += delta
            case .reasoningDelta(let delta):
              self.currentReasoning += delta
            case .usage(let prompt, let completion, _):
              self.promptTokens = prompt
              self.completionTokens = completion
            case .finish:
              break
            case .error(let err):
              self.errorMessage = err
            case .toolCallDelta, .toolCallComplete:
              break
            }
          }
        }

        await MainActor.run {
          if !self.currentStreamingContent.isEmpty || !self.currentReasoning.isEmpty {
            self.messages.append(
              LLMChatMessage(
                role: .assistant,
                content: self.currentStreamingContent,
                reasoningContent: self.currentReasoning.isEmpty ? nil : self.currentReasoning
              )
            )
          }
          self.currentStreamingContent = ""
          self.currentReasoning = ""
          self.isStreaming = false
        }
      } catch {
        await MainActor.run {
          self.errorMessage = error.localizedDescription
          self.isStreaming = false
        }
      }
    }
  }

  private func stopStreaming() {
    activeStreamTask?.cancel()
    activeStreamTask = nil
    if !currentStreamingContent.isEmpty || !currentReasoning.isEmpty {
      messages.append(
        LLMChatMessage(
          role: .assistant,
          content: currentStreamingContent,
          reasoningContent: currentReasoning.isEmpty ? nil : currentReasoning
        )
      )
    }
    currentStreamingContent = ""
    currentReasoning = ""
    isStreaming = false
  }

  private func clearChat() {
    stopStreaming()
    messages = [
      LLMChatMessage(
        role: .assistant,
        content: "Conversation cleared. Ready for your next query!"
      )
    ]
  }
}

// MARK: - Message Bubble Component

public struct DevChatMessageBubble: View {
  public let message: LLMChatMessage
  public var isCurrentlyStreaming: Bool = false
  @State private var isReasoningExpanded: Bool = false

  public init(message: LLMChatMessage, isCurrentlyStreaming: Bool = false) {
    self.message = message
    self.isCurrentlyStreaming = isCurrentlyStreaming
  }

  public var body: some View {
    HStack(alignment: .top, spacing: 8) {
      if message.role == .user { Spacer(minLength: 40) }

      VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 6) {
        // Thinking / Reasoning disclosure block
        if let reasoning = message.reasoningContent, !reasoning.isEmpty {
          VStack(alignment: .leading, spacing: 4) {
            Button {
              withAnimation(.spring(response: 0.3, dampingFraction: 0.8)) {
                isReasoningExpanded.toggle()
              }
            } label: {
              HStack(spacing: 4) {
                Image(systemName: isReasoningExpanded ? "chevron.down" : "chevron.right")
                  .font(.system(size: 8, weight: .bold))
                Text("Thought Process")
                  .font(.swarm(.xs, weight: .medium))
                if isCurrentlyStreaming {
                  ProgressView()
                    .controlSize(.mini)
                }
              }
              .foregroundStyle(.swarmGold)
            }
            .buttonStyle(.plain)

            if isReasoningExpanded {
              Text(reasoning)
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .padding(8)
                .background(.swarmCanvas.opacity(0.6))
                .cornerRadius(6)
                .transition(.opacity.combined(with: .move(edge: .top)))
            }
          }
          .padding(8)
          .background(.swarmSurface.opacity(0.8))
          .cornerRadius(8)
          .overlay {
            RoundedRectangle(cornerRadius: 8)
              .stroke(.swarmGold.opacity(0.2), lineWidth: 1)
          }
        }

        // Main Text Bubble
        if !message.content.isEmpty || isCurrentlyStreaming {
          HStack(alignment: .bottom, spacing: 4) {
            Text(message.content.isEmpty && isCurrentlyStreaming ? "Thinking..." : message.content)
              .font(.swarm(.sm))
              .foregroundStyle(message.role == .user ? .swarmCanvas : .swarmTextPrimary)
              .textSelection(.enabled)

            if isCurrentlyStreaming {
              Circle()
                .fill(.swarmGold)
                .frame(width: 6, height: 6)
                .opacity(0.8)
            }
          }
          .padding(.horizontal, 12)
          .padding(.vertical, 8)
          .background {
            RoundedRectangle(cornerRadius: 12)
              .fill(message.role == .user ? .swarmGold : .swarmSurface)
          }
        }

        // Timestamp
        Text(message.timestamp, style: .time)
          .font(.swarm(.micro))
          .foregroundStyle(.swarmTextTertiary)
      }

      if message.role == .assistant { Spacer(minLength: 40) }
    }
  }
}
