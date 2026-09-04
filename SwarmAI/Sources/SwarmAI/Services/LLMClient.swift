import Foundation

// MARK: - LLM Provider Types & Definitions

/// Supported AI provider categories.
@frozen
public enum LLMProviderType: String, Codable, Sendable, CaseIterable, Identifiable {
  case anthropic = "Anthropic"
  case openai = "OpenAI"
  case google = "Google Gemini"
  case openrouter = "OpenRouter"
  case ollama = "Ollama (Local)"
  case lmstudio = "LM Studio (Local)"
  case custom = "Custom (OpenAI-compatible)"

  public var id: String { rawValue }

  public var icon: String {
    switch self {
    case .anthropic: return "brain.head.profile"
    case .openai: return "sparkle"
    case .google: return "sparkles"
    case .openrouter: return "network"
    case .ollama: return "desktopcomputer"
    case .lmstudio: return "macmini"
    case .custom: return "server.rack"
    }
  }

  public var defaultBaseURL: String {
    switch self {
    case .anthropic: return "https://api.anthropic.com"
    case .openai: return "https://api.openai.com"
    case .google: return "https://generativelanguage.googleapis.com"
    case .openrouter: return "https://openrouter.ai/api"
    case .ollama: return "http://localhost:11434"
    case .lmstudio: return "http://localhost:1234"
    case .custom: return "http://localhost:8000"
    }
  }
}

// MARK: - Provider Extensions

extension Provider {
  /// Inferred provider type from name or endpoint.
  public var resolvedType: LLMProviderType {
    let lowerName = name.lowercased()
    let lowerEndpoint = endpoint.lowercased()
    let lowerBase = (baseURL ?? "").lowercased()

    if lowerName.contains("anthropic") || lowerName.contains("claude") || lowerEndpoint.contains("anthropic.com") {
      return .anthropic
    } else if lowerName.contains("openrouter") || lowerEndpoint.contains("openrouter.ai") {
      return .openrouter
    } else if lowerName.contains("google") || lowerName.contains("gemini") || lowerEndpoint.contains("googleapis.com") {
      return .google
    } else if lowerName.contains("ollama") || lowerEndpoint.contains("11434") || lowerBase.contains("11434") {
      return .ollama
    } else if lowerName.contains("lm studio") || lowerName.contains("lmstudio") || lowerEndpoint.contains("1234") || lowerBase.contains("1234") {
      return .lmstudio
    } else if lowerName.contains("openai") || lowerEndpoint.contains("openai.com") {
      return .openai
    }
    return .custom
  }

  /// Resolved base URL for this provider.
  public var resolvedBaseURL: String {
    if let base = baseURL, !base.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return base.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
    }
    return resolvedType.defaultBaseURL
  }

  /// Resolved chat completion endpoint URL.
  public var resolvedEndpoint: String {
    if !endpoint.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      return endpoint
    }
    switch resolvedType {
    case .anthropic:
      return "\(resolvedBaseURL)/v1/messages"
    case .openai, .openrouter, .ollama, .lmstudio, .custom:
      return "\(resolvedBaseURL)/v1/chat/completions"
    case .google:
      return "\(resolvedBaseURL)/v1beta/models"
    }
  }

  // MARK: - Built-in Presets

  public static let anthropicPreset = Provider(
    name: "Anthropic",
    apiKey: "",
    models: [
 "claude-sonnet-4-20250514",
 "claude-opus-4-20250514",
 "claude-haiku-4-20250501",
 "claude-3-7-sonnet-20250219"
    ],
 defaultModel: "claude-sonnet-4-20250514",
    endpoint: "https://api.anthropic.com/v1/messages",
    baseURL: "https://api.anthropic.com",
    isActive: true
  )

  public static let openAIPreset = Provider(
    name: "OpenAI",
    apiKey: "",
    models: [
 "gpt-4.1",
 "gpt-4.1-mini",
 "gpt-4o",
 "o3",
 "o4-mini"
    ],
 defaultModel: "gpt-4.1",
    endpoint: "https://api.openai.com/v1/chat/completions",
    baseURL: "https://api.openai.com",
    isActive: true
  )

  public static let geminiPreset = Provider(
    name: "Google Gemini",
    apiKey: "",
    models: [
 "gemini-2.5-pro",
 "gemini-2.5-flash",
 "gemini-2.5-flash-lite",
 "gemini-2.0-flash",
 "gemini-1.5-pro"
    ],
 defaultModel: "gemini-2.5-pro",
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models",
    baseURL: "https://generativelanguage.googleapis.com",
    isActive: true
  )

  public static let openRouterPreset = Provider(
    name: "OpenRouter",
    apiKey: "",
    models: [
 "anthropic/claude-sonnet-4-20250514",
 "openai/gpt-4.1",
 "meta-llama/llama-4-maverick",
 "deepseek/deepseek-r1",
 "google/gemini-2.5-pro"
      "google/gemini-2.5-flash"
    ],
 defaultModel: "anthropic/claude-sonnet-4-20250514",
    endpoint: "https://openrouter.ai/api/v1/chat/completions",
    baseURL: "https://openrouter.ai/api",
    isActive: true
  )

  public static let ollamaPreset = Provider(
    name: "Ollama (Local)",
    apiKey: "ollama",
    models: ["llama3", "llama3.2", "deepseek-r1", "codellama", "mistral", "qwen2.5-coder"],
    defaultModel: "llama3",
    endpoint: "http://localhost:11434/v1/chat/completions",
    baseURL: "http://localhost:11434",
    isActive: true
  )

  public static let lmStudioPreset = Provider(
    name: "LM Studio (Local)",
    apiKey: "lm-studio",
    models: ["local-model"],
    defaultModel: "local-model",
    endpoint: "http://localhost:1234/v1/chat/completions",
    baseURL: "http://localhost:1234",
    isActive: true
  )

  public static let defaultPresets: [Provider] = [
    anthropicPreset,
    openAIPreset,
    geminiPreset,
    openRouterPreset,
    ollamaPreset,
    lmStudioPreset
  ]
}

// MARK: - Chat & Tool Models

/// Role for chat messages.
@frozen
public enum LLMRole: String, Codable, Sendable {
  case system
  case user
  case assistant
  case tool
}

/// A structured chat message exchanged with an LLM.
public struct LLMChatMessage: Identifiable, Codable, Sendable, Hashable {
  public let id: UUID
  public var role: LLMRole
  public var content: String
  public var reasoningContent: String?
  public var toolCalls: [ToolCall]?
  public var toolCallId: String?
  public var name: String?
  public var timestamp: Date

  public init(
    id: UUID = UUID(),
    role: LLMRole,
    content: String,
    reasoningContent: String? = nil,
    toolCalls: [ToolCall]? = nil,
    toolCallId: String? = nil,
    name: String? = nil,
    timestamp: Date = Date()
  ) {
    self.id = id
    self.role = role
    self.content = content
    self.reasoningContent = reasoningContent
    self.toolCalls = toolCalls
    self.toolCallId = toolCallId
    self.name = name
    self.timestamp = timestamp
  }
}

public typealias ChatMessage = LLMChatMessage

/// Tool definition parameter for function calling.
public struct ToolDefinition: Codable, Sendable, Hashable {
  public var name: String
  public var description: String
  public var parameters: [String: AnyCodableSendable]

  public init(name: String, description: String, parameters: [String: AnyCodableSendable] = [:]) {
    self.name = name
    self.description = description
    self.parameters = parameters
  }
}

/// A tool/function call invocation emitted by an AI model.
public struct ToolCall: Identifiable, Codable, Sendable, Hashable {
  public var id: String
  public var name: String
  public var arguments: String

  public init(id: String = UUID().uuidString, name: String, arguments: String = "{}") {
    self.id = id
    self.name = name
    self.arguments = arguments
  }
}

/// Streaming event emitted during an LLM completion.
@frozen
public enum StreamEvent: Sendable {
  /// Incoming incremental text token.
  case textDelta(String)
  /// Incoming incremental reasoning / thinking token (e.g. Claude 3.7 / DeepSeek R1).
  case reasoningDelta(String)
  /// Incremental tool call chunk.
  case toolCallDelta(index: Int, id: String?, name: String?, argumentsDelta: String)
  /// Complete tool call emitted.
  case toolCallComplete(ToolCall)
  /// Token usage statistics.
  case usage(promptTokens: Int, completionTokens: Int, totalTokens: Int)
  /// Completion finished with a stop reason (e.g. "stop", "end_turn", "tool_use").
  case finish(reason: String)
  /// Streaming error encountered.
  case error(String)
}

/// Local AI Provider Discovery Result.
public struct LocalProviderInfo: Identifiable, Sendable {
  public var id: String { baseURL }
  public var name: String
  public var type: LLMProviderType
  public var baseURL: String
  public var endpoint: String
  public var models: [String]
  public var isAvailable: Bool

  public init(
    name: String,
    type: LLMProviderType,
    baseURL: String,
    endpoint: String,
    models: [String],
    isAvailable: Bool
  ) {
    self.name = name
    self.type = type
    self.baseURL = baseURL
    self.endpoint = endpoint
    self.models = models
    self.isAvailable = isAvailable
  }
}

/// Type-erased sendable JSON codable container for tool parameters.
public struct AnyCodableSendable: Codable, Sendable, Hashable {
  public let value: String

  public init(_ stringValue: String) {
    self.value = stringValue
  }

  public init(from decoder: Decoder) throws {
    let container = try decoder.singleValueContainer()
    if let str = try? container.decode(String.self) {
      self.value = str
    } else if let intVal = try? container.decode(Int.self) {
      self.value = String(intVal)
    } else if let boolVal = try? container.decode(Bool.self) {
      self.value = String(boolVal)
    } else if let doubleVal = try? container.decode(Double.self) {
      self.value = String(doubleVal)
    } else {
      self.value = "{}"
    }
  }

  public func encode(to encoder: Encoder) throws {
    var container = encoder.singleValueContainer()
    try container.encode(value)
  }
}

// MARK: - LLM Client Error

public enum LLMClientError: LocalizedError, Sendable {
  case invalidURL(String)
  case invalidResponse(statusCode: Int, message: String)
  case authenticationFailed(String)
  case noData
  case decodingError(String)
  case networkError(String)
  case providerUnavailable(String)

  public var errorDescription: String? {
    switch self {
    case .invalidURL(let url):
      return "Invalid endpoint URL: \(url)"
    case .invalidResponse(let statusCode, let message):
      return "Provider returned HTTP \(statusCode): \(message)"
    case .authenticationFailed(let message):
      return "Authentication failed: \(message). Check your API key."
    case .noData:
      return "No data received from AI provider."
    case .decodingError(let message):
      return "Failed to decode response: \(message)"
    case .networkError(let message):
      return "Network connection error: \(message)"
    case .providerUnavailable(let name):
      return "\(name) is not currently reachable."
    }
  }
}

// MARK: - LLMClient Engine

/// Production-ready Swift 6 async/await streaming AI engine supporting Anthropic,
/// OpenAI, Google Gemini, OpenRouter, and Local AI servers (Ollama, LM Studio).
public final class LLMClient: @unchecked Sendable {
  public static let shared = LLMClient()

  private let session: URLSession

  public init(session: URLSession = .shared) {
    self.session = session
  }

  // MARK: - 1. Stream Chat

  /// Stream chat completions from any configured AI provider.
  public func streamChat(
    provider: Provider,
    model: String,
    messages: [LLMChatMessage],
    tools: [ToolDefinition]? = nil,
    temperature: Double = 0.7,
    maxTokens: Int = 4096,
    systemPrompt: String? = nil
  ) -> AsyncThrowingStream<StreamEvent, Error> {
    AsyncThrowingStream(StreamEvent.self) { continuation in
      let streamTask = _Concurrency.Task {
        do {
          switch provider.resolvedType {
          case .anthropic:
            try await self.streamAnthropic(
              provider: provider,
              model: model,
              messages: messages,
              tools: tools,
              temperature: temperature,
              maxTokens: maxTokens,
              systemPrompt: systemPrompt,
              continuation: continuation
            )
          case .openai, .openrouter, .custom, .ollama, .lmstudio:
            try await self.streamOpenAICompatible(
              provider: provider,
              model: model,
              messages: messages,
              tools: tools,
              temperature: temperature,
              maxTokens: maxTokens,
              systemPrompt: systemPrompt,
              continuation: continuation
            )
          case .google:
            try await self.streamGemini(
              provider: provider,
              model: model,
              messages: messages,
              tools: tools,
              temperature: temperature,
              maxTokens: maxTokens,
              systemPrompt: systemPrompt,
              continuation: continuation
            )
          }
          continuation.finish()
        } catch {
          continuation.yield(.error(error.localizedDescription))
          continuation.finish(throwing: error)
        }
      }

      continuation.onTermination = { @Sendable _ in
        streamTask.cancel()
      }
    }
  }

  // MARK: - 2. Provider Verification

  /// Verify API key and connectivity with a provider.
  public func verifyProvider(provider: Provider) async throws -> Bool {
    switch provider.resolvedType {
    case .anthropic:
      guard !provider.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        throw LLMClientError.authenticationFailed("Anthropic API key is empty")
      }
      guard let url = URL(string: provider.resolvedEndpoint) else {
        throw LLMClientError.invalidURL(provider.resolvedEndpoint)
      }
      var request = URLRequest(url: url)
      request.httpMethod = "POST"
      request.setValue("application/json", forHTTPHeaderField: "Content-Type")
      request.setValue(provider.apiKey, forHTTPHeaderField: "x-api-key")
      request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
      request.timeoutInterval = 10

      let testModel = provider.defaultModel.isEmpty ? "claude-haiku-4-5" : provider.defaultModel
      let body: [String: Any] = [
        "model": testModel,
        "max_tokens": 1,
        "messages": [["role": "user", "content": "ping"]]
      ]
      request.httpBody = try JSONSerialization.data(withJSONObject: body)

      let (data, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw LLMClientError.noData
      }
      if httpResponse.statusCode == 200 || httpResponse.statusCode == 400 {
        return true
      } else {
        let msg = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
        throw LLMClientError.invalidResponse(statusCode: httpResponse.statusCode, message: msg)
      }

    case .openai, .openrouter, .custom:
      let base = provider.resolvedBaseURL
      guard let url = URL(string: "\(base)/v1/models") else {
        throw LLMClientError.invalidURL("\(base)/v1/models")
      }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      if !provider.apiKey.isEmpty {
        request.setValue("Bearer \(provider.apiKey)", forHTTPHeaderField: "Authorization")
      }
      request.timeoutInterval = 10

      let (data, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw LLMClientError.noData
      }
      if (200...299).contains(httpResponse.statusCode) {
        return true
      }
      let msg = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
      throw LLMClientError.invalidResponse(statusCode: httpResponse.statusCode, message: msg)

    case .google:
      guard !provider.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        throw LLMClientError.authenticationFailed("Gemini API key is empty")
      }
      let urlStr = "https://generativelanguage.googleapis.com/v1beta/models?key=\(provider.apiKey)"
      guard let url = URL(string: urlStr) else {
        throw LLMClientError.invalidURL(urlStr)
      }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.timeoutInterval = 10

      let (data, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse else {
        throw LLMClientError.noData
      }
      if (200...299).contains(httpResponse.statusCode) {
        return true
      }
      let msg = String(data: data, encoding: .utf8) ?? "HTTP \(httpResponse.statusCode)"
      throw LLMClientError.invalidResponse(statusCode: httpResponse.statusCode, message: msg)

    case .ollama:
      let base = provider.resolvedBaseURL
      guard let url = URL(string: "\(base)/api/tags") else {
        throw LLMClientError.invalidURL("\(base)/api/tags")
      }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.timeoutInterval = 5

      let (_, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
        throw LLMClientError.providerUnavailable("Ollama is not running at \(base)")
      }
      return true

    case .lmstudio:
      let base = provider.resolvedBaseURL
      guard let url = URL(string: "\(base)/v1/models") else {
        throw LLMClientError.invalidURL("\(base)/v1/models")
      }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.timeoutInterval = 5

      let (_, response) = try await session.data(for: request)
      guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
        throw LLMClientError.providerUnavailable("LM Studio is not running at \(base)")
      }
      return true
    }
  }

  // MARK: - 3. Fetch Available Models

  /// Fetch list of available model IDs from provider endpoint.
  public func fetchAvailableModels(provider: Provider) async throws -> [String] {
    switch provider.resolvedType {
    case .anthropic:
      return [
        "claude-3-7-sonnet-20250219",
        "claude-3-5-sonnet-20241022",
        "claude-3-5-haiku-20241022",
        "claude-3-opus-20240229"
      ]

    case .openai:
      let base = provider.resolvedBaseURL
      guard let url = URL(string: "\(base)/v1/models") else {
        throw LLMClientError.invalidURL("\(base)/v1/models")
      }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      if !provider.apiKey.isEmpty {
        request.setValue("Bearer \(provider.apiKey)", forHTTPHeaderField: "Authorization")
      }
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
        return provider.models.isEmpty ? ["gpt-4.1", "gpt-4o", "gpt-4o-mini", "o3", "o4-mini"] : provider.models
      }
      if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let dataArray = json["data"] as? [[String: Any]] {
        let modelIds = dataArray.compactMap { $0["id"] as? String }
        let chatModels = modelIds.filter { id in
          id.contains("gpt") || id.contains("o1") || id.contains("o3") || id.contains("chat") || id.contains("turbo")
        }.sorted()
        return chatModels.isEmpty ? modelIds : chatModels
      }
      return provider.models

    case .openrouter:
      guard let url = URL(string: "https://openrouter.ai/api/v1/models") else {
        return provider.models
      }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      if !provider.apiKey.isEmpty {
        request.setValue("Bearer \(provider.apiKey)", forHTTPHeaderField: "Authorization")
      }
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
        return provider.models
      }
      if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let dataArray = json["data"] as? [[String: Any]] {
        let modelIds = dataArray.compactMap { $0["id"] as? String }
        return modelIds.sorted()
      }
      return provider.models

    case .google:
      guard !provider.apiKey.isEmpty else { return provider.models }
      let urlStr = "https://generativelanguage.googleapis.com/v1beta/models?key=\(provider.apiKey)"
      guard let url = URL(string: urlStr) else { return provider.models }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
        return provider.models
      }
      if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let modelsArray = json["models"] as? [[String: Any]] {
        let modelNames = modelsArray.compactMap { item -> String? in
          guard let name = item["name"] as? String else { return nil }
          return name.replacingOccurrences(of: "models/", with: "")
        }.filter { $0.contains("gemini") }
        return modelNames.sorted()
      }
      return provider.models

    case .ollama:
      let base = provider.resolvedBaseURL
      guard let url = URL(string: "\(base)/api/tags") else { return [] }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.timeoutInterval = 4
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
        return []
      }
      if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let models = json["models"] as? [[String: Any]] {
        return models.compactMap { $0["name"] as? String }
      }
      return []

    case .lmstudio:
      let base = provider.resolvedBaseURL
      guard let url = URL(string: "\(base)/v1/models") else { return [] }
      var request = URLRequest(url: url)
      request.httpMethod = "GET"
      request.timeoutInterval = 4
      let (data, response) = try await session.data(for: request)
      guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
        return []
      }
      if let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let dataArray = json["data"] as? [[String: Any]] {
        return dataArray.compactMap { $0["id"] as? String }
      }
      return []

    case .custom:
      let base = provider.resolvedBaseURL
      if let url = URL(string: "\(base)/v1/models") {
        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        if !provider.apiKey.isEmpty {
          request.setValue("Bearer \(provider.apiKey)", forHTTPHeaderField: "Authorization")
        }
        if let (data, response) = try? await session.data(for: request),
           let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
           let dataArray = json["data"] as? [[String: Any]] {
          return dataArray.compactMap { $0["id"] as? String }
        }
      }
      return provider.models
    }
  }

  // MARK: - 4. Local AI Provider Discovery

  /// Discover running local AI backends (Ollama, LM Studio).
  public func discoverLocalProviders() async -> [LocalProviderInfo] {
    var results: [LocalProviderInfo] = []

    // 1. Check Ollama
    let ollamaBase = "http://localhost:11434"
    if let ollamaURL = URL(string: "\(ollamaBase)/api/tags") {
      var req = URLRequest(url: ollamaURL)
      req.timeoutInterval = 2
      if let (data, resp) = try? await session.data(for: req),
         let http = resp as? HTTPURLResponse, http.statusCode == 200,
         let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let models = json["models"] as? [[String: Any]] {
        let modelNames = models.compactMap { $0["name"] as? String }
        results.append(LocalProviderInfo(
          name: "Ollama (Local)",
          type: .ollama,
          baseURL: ollamaBase,
          endpoint: "\(ollamaBase)/v1/chat/completions",
          models: modelNames,
          isAvailable: true
        ))
      }
    }

    // 2. Check LM Studio
    let lmStudioBase = "http://localhost:1234"
    if let lmURL = URL(string: "\(lmStudioBase)/v1/models") {
      var req = URLRequest(url: lmURL)
      req.timeoutInterval = 2
      if let (data, resp) = try? await session.data(for: req),
         let http = resp as? HTTPURLResponse, http.statusCode == 200,
         let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
         let dataArray = json["data"] as? [[String: Any]] {
        let modelNames = dataArray.compactMap { $0["id"] as? String }
        results.append(LocalProviderInfo(
          name: "LM Studio (Local)",
          type: .lmstudio,
          baseURL: lmStudioBase,
          endpoint: "\(lmStudioBase)/v1/chat/completions",
          models: modelNames,
          isAvailable: true
        ))
      }
    }

    return results
  }

  // MARK: - 5. Provider-Specific Streaming Implementations

  // MARK: Anthropic Claude Stream
  private func streamAnthropic(
    provider: Provider,
    model: String,
    messages: [LLMChatMessage],
    tools: [ToolDefinition]?,
    temperature: Double,
    maxTokens: Int,
    systemPrompt: String?,
    continuation: AsyncThrowingStream<StreamEvent, Error>.Continuation
  ) async throws {
    guard let url = URL(string: provider.resolvedEndpoint) else {
      throw LLMClientError.invalidURL(provider.resolvedEndpoint)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")
    request.setValue(provider.apiKey, forHTTPHeaderField: "x-api-key")
    request.setValue("2023-06-01", forHTTPHeaderField: "anthropic-version")
    request.setValue("prompt-caching-2024-07-31,output-128k-2025-02-19", forHTTPHeaderField: "anthropic-beta")

    var effectiveSystem = systemPrompt ?? ""
    var anthropicMessages: [[String: Any]] = []

    for msg in messages {
      if msg.role == .system {
        if !effectiveSystem.isEmpty { effectiveSystem += "\n\n" }
        effectiveSystem += msg.content
      } else if msg.role == .user {
        if let toolCallId = msg.toolCallId {
          anthropicMessages.append([
            "role": "user",
            "content": [
              [
                "type": "tool_result",
                "tool_use_id": toolCallId,
                "content": msg.content
              ]
            ]
          ])
        } else {
          anthropicMessages.append([
            "role": "user",
            "content": msg.content
          ])
        }
      } else if msg.role == .assistant {
        if let toolCalls = msg.toolCalls, !toolCalls.isEmpty {
          var contentBlocks: [[String: Any]] = []
          if !msg.content.isEmpty {
            contentBlocks.append(["type": "text", "text": msg.content])
          }
          for call in toolCalls {
            let parsedArgs = (try? JSONSerialization.jsonObject(with: Data(call.arguments.utf8))) as? [String: Any] ?? [:]
            contentBlocks.append([
              "type": "tool_use",
              "id": call.id,
              "name": call.name,
              "input": parsedArgs
            ])
          }
          anthropicMessages.append([
            "role": "assistant",
            "content": contentBlocks
          ])
        } else {
          anthropicMessages.append([
            "role": "assistant",
            "content": msg.content
          ])
        }
      }
    }

    var payload: [String: Any] = [
      "model": model,
      "max_tokens": maxTokens,
      "messages": anthropicMessages,
      "stream": true,
      "temperature": temperature
    ]

    if !effectiveSystem.isEmpty {
      payload["system"] = effectiveSystem
    }

    if let tools = tools, !tools.isEmpty {
      let formattedTools = tools.map { tool -> [String: Any] in
        var schema: [String: Any] = ["type": "object", "properties": [:]]
        if let dict = try? JSONSerialization.jsonObject(with: Data(tool.parameters["schema"]?.value.utf8 ?? "{}".utf8)) as? [String: Any] {
          schema = dict
        }
        return [
          "name": tool.name,
          "description": tool.description,
          "input_schema": schema
        ]
      }
      payload["tools"] = formattedTools
    }

    request.httpBody = try JSONSerialization.data(withJSONObject: payload)

    let (bytes, response) = try await session.bytes(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw LLMClientError.noData
    }
    guard (200...299).contains(http.statusCode) else {
      var errorBody = ""
      for try await line in bytes.lines {
        errorBody += line
      }
      throw LLMClientError.invalidResponse(statusCode: http.statusCode, message: errorBody)
    }

    var currentToolId = ""
    var currentToolName = ""
    var currentToolArgs = ""
    var currentBlockIndex = 0

    for try await line in bytes.lines {
      let trimmed = line.trimmingCharacters(in: .whitespaces)
      guard trimmed.hasPrefix("data: ") else { continue }
      let jsonString = String(trimmed.dropFirst(6))
      guard jsonString != "[DONE]", let data = jsonString.data(using: .utf8) else { continue }

      guard let event = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
            let type = event["type"] as? String else {
        continue
      }

      switch type {
      case "content_block_start":
        if let block = event["content_block"] as? [String: Any],
           let blockType = block["type"] as? String {
          currentBlockIndex = event["index"] as? Int ?? 0
          if blockType == "tool_use" {
            currentToolId = block["id"] as? String ?? UUID().uuidString
            currentToolName = block["name"] as? String ?? ""
            currentToolArgs = ""
          }
        }

      case "content_block_delta":
        let idx = event["index"] as? Int ?? currentBlockIndex
        if let delta = event["delta"] as? [String: Any],
           let deltaType = delta["type"] as? String {
          if deltaType == "text_delta", let text = delta["text"] as? String {
            continuation.yield(.textDelta(text))
          } else if deltaType == "thinking_delta", let thinking = delta["thinking"] as? String {
            continuation.yield(.reasoningDelta(thinking))
          } else if deltaType == "input_json_delta", let partial = delta["partial_json"] as? String {
            currentToolArgs += partial
            continuation.yield(.toolCallDelta(index: idx, id: currentToolId, name: currentToolName, argumentsDelta: partial))
          }
        }

      case "content_block_stop":
        if !currentToolName.isEmpty {
          let call = ToolCall(id: currentToolId, name: currentToolName, arguments: currentToolArgs.isEmpty ? "{}" : currentToolArgs)
          continuation.yield(.toolCallComplete(call))
          currentToolId = ""
          currentToolName = ""
          currentToolArgs = ""
        }

      case "message_delta":
        if let usage = event["usage"] as? [String: Any] {
          let outputTokens = usage["output_tokens"] as? Int ?? 0
          continuation.yield(.usage(promptTokens: 0, completionTokens: outputTokens, totalTokens: outputTokens))
        }
        if let delta = event["delta"] as? [String: Any], let stopReason = delta["stop_reason"] as? String {
          continuation.yield(.finish(reason: stopReason))
        }

      case "message_start":
        if let msg = event["message"] as? [String: Any],
           let usage = msg["usage"] as? [String: Any] {
          let inputTokens = usage["input_tokens"] as? Int ?? 0
          continuation.yield(.usage(promptTokens: inputTokens, completionTokens: 0, totalTokens: inputTokens))
        }

      case "error":
        if let err = event["error"] as? [String: Any], let msg = err["message"] as? String {
          continuation.yield(.error(msg))
        }

      default:
        break
      }
    }
  }

  // MARK: OpenAI / OpenRouter / Ollama / LM Studio Stream
  private func streamOpenAICompatible(
    provider: Provider,
    model: String,
    messages: [LLMChatMessage],
    tools: [ToolDefinition]?,
    temperature: Double,
    maxTokens: Int,
    systemPrompt: String?,
    continuation: AsyncThrowingStream<StreamEvent, Error>.Continuation
  ) async throws {
    guard let url = URL(string: provider.resolvedEndpoint) else {
      throw LLMClientError.invalidURL(provider.resolvedEndpoint)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    if !provider.apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
      request.setValue("Bearer \(provider.apiKey)", forHTTPHeaderField: "Authorization")
    }

    if provider.resolvedType == .openrouter {
      request.setValue("https://github.com/soumyachk101/SwarmAI", forHTTPHeaderField: "HTTP-Referer")
      request.setValue("SwarmAI macOS", forHTTPHeaderField: "X-Title")
    }

    var formattedMessages: [[String: Any]] = []

    if let sys = systemPrompt, !sys.isEmpty {
      formattedMessages.append(["role": "system", "content": sys])
    }

    for msg in messages {
      var dict: [String: Any] = [
        "role": msg.role.rawValue,
        "content": msg.content
      ]
      if let toolCallId = msg.toolCallId {
        dict["tool_call_id"] = toolCallId
      }
      if let toolCalls = msg.toolCalls, !toolCalls.isEmpty {
        dict["tool_calls"] = toolCalls.map { call -> [String: Any] in
          [
            "id": call.id,
            "type": "function",
            "function": [
              "name": call.name,
              "arguments": call.arguments
            ]
          ]
        }
      }
      formattedMessages.append(dict)
    }

    var payload: [String: Any] = [
      "model": model,
      "messages": formattedMessages,
      "stream": true,
      "stream_options": ["include_usage": true],
      "temperature": temperature
    ]

    if maxTokens > 0 {
      payload["max_tokens"] = maxTokens
    }

    if let tools = tools, !tools.isEmpty {
      let formattedTools = tools.map { tool -> [String: Any] in
        var params: [String: Any] = ["type": "object", "properties": [:]]
        if let json = try? JSONSerialization.jsonObject(with: Data(tool.parameters["schema"]?.value.utf8 ?? "{}".utf8)) as? [String: Any] {
          params = json
        }
        return [
          "type": "function",
          "function": [
            "name": tool.name,
            "description": tool.description,
            "parameters": params
          ]
        ]
      }
      payload["tools"] = formattedTools
    }

    request.httpBody = try JSONSerialization.data(withJSONObject: payload)

    let (bytes, response) = try await session.bytes(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw LLMClientError.noData
    }
    guard (200...299).contains(http.statusCode) else {
      var err = ""
      for try await line in bytes.lines {
        err += line
      }
      throw LLMClientError.invalidResponse(statusCode: http.statusCode, message: err)
    }

    var toolCallBuffers: [Int: (id: String, name: String, args: String)] = [:]

    for try await line in bytes.lines {
      let trimmed = line.trimmingCharacters(in: .whitespaces)
      guard trimmed.hasPrefix("data: ") else { continue }
      let jsonString = String(trimmed.dropFirst(6))
      if jsonString == "[DONE]" {
        for (_, val) in toolCallBuffers {
          continuation.yield(.toolCallComplete(ToolCall(id: val.id, name: val.name, arguments: val.args)))
        }
        toolCallBuffers.removeAll()
        continuation.yield(.finish(reason: "stop"))
        break
      }

      guard let data = jsonString.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        continue
      }

      if let usage = json["usage"] as? [String: Any] {
        let pTokens = usage["prompt_tokens"] as? Int ?? 0
        let cTokens = usage["completion_tokens"] as? Int ?? 0
        let tTokens = usage["total_tokens"] as? Int ?? (pTokens + cTokens)
        continuation.yield(.usage(promptTokens: pTokens, completionTokens: cTokens, totalTokens: tTokens))
      }

      if let choices = json["choices"] as? [[String: Any]], let first = choices.first {
        if let finishReason = first["finish_reason"] as? String {
          if finishReason == "tool_calls" {
            for (_, val) in toolCallBuffers {
              continuation.yield(.toolCallComplete(ToolCall(id: val.id, name: val.name, arguments: val.args)))
            }
            toolCallBuffers.removeAll()
          }
          continuation.yield(.finish(reason: finishReason))
        }

        if let delta = first["delta"] as? [String: Any] {
          if let text = delta["content"] as? String {
            continuation.yield(.textDelta(text))
          }

          if let reasoning = delta["reasoning_content"] as? String ?? delta["reasoning"] as? String {
            continuation.yield(.reasoningDelta(reasoning))
          }

          if let toolCalls = delta["tool_calls"] as? [[String: Any]] {
            for tc in toolCalls {
              let index = tc["index"] as? Int ?? 0
              let id = tc["id"] as? String
              var name: String? = nil
              var argsDelta = ""

              if let fn = tc["function"] as? [String: Any] {
                name = fn["name"] as? String
                argsDelta = fn["arguments"] as? String ?? ""
              }

              let existing = toolCallBuffers[index] ?? (id: id ?? UUID().uuidString, name: name ?? "", args: "")
              let newId = id ?? existing.id
              let newName = (name != nil && !name!.isEmpty) ? name! : existing.name
              let newArgs = existing.args + argsDelta
              toolCallBuffers[index] = (id: newId, name: newName, args: newArgs)

              continuation.yield(.toolCallDelta(index: index, id: newId, name: newName, argumentsDelta: argsDelta))
            }
          }
        }
      }
    }
  }

  // MARK: Google Gemini Stream
  private func streamGemini(
    provider: Provider,
    model: String,
    messages: [LLMChatMessage],
    tools: [ToolDefinition]?,
    temperature: Double,
    maxTokens: Int,
    systemPrompt: String?,
    continuation: AsyncThrowingStream<StreamEvent, Error>.Continuation
  ) async throws {
    let cleanModel = model.replacingOccurrences(of: "models/", with: "")
    let endpointUrl = "https://generativelanguage.googleapis.com/v1beta/models/\(cleanModel):streamGenerateContent?key=\(provider.apiKey)&alt=sse"

    guard let url = URL(string: endpointUrl) else {
      throw LLMClientError.invalidURL(endpointUrl)
    }

    var request = URLRequest(url: url)
    request.httpMethod = "POST"
    request.setValue("application/json", forHTTPHeaderField: "Content-Type")

    var contents: [[String: Any]] = []

    for msg in messages {
      let role = (msg.role == .assistant) ? "model" : "user"
      contents.append([
        "role": role,
        "parts": [["text": msg.content]]
      ])
    }

    var payload: [String: Any] = [
      "contents": contents,
      "generationConfig": [
        "temperature": temperature,
        "maxOutputTokens": maxTokens
      ]
    ]

    if let sys = systemPrompt, !sys.isEmpty {
      payload["systemInstruction"] = [
        "parts": [["text": sys]]
      ]
    }

    request.httpBody = try JSONSerialization.data(withJSONObject: payload)

    let (bytes, response) = try await session.bytes(for: request)
    guard let http = response as? HTTPURLResponse else {
      throw LLMClientError.noData
    }
    guard (200...299).contains(http.statusCode) else {
      var err = ""
      for try await line in bytes.lines {
        err += line
      }
      throw LLMClientError.invalidResponse(statusCode: http.statusCode, message: err)
    }

    for try await line in bytes.lines {
      let trimmed = line.trimmingCharacters(in: .whitespaces)
      guard trimmed.hasPrefix("data: ") else { continue }
      let jsonString = String(trimmed.dropFirst(6))
      guard let data = jsonString.data(using: .utf8),
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
        continue
      }

      if let usage = json["usageMetadata"] as? [String: Any] {
        let pTokens = usage["promptTokenCount"] as? Int ?? 0
        let cTokens = usage["candidatesTokenCount"] as? Int ?? 0
        let tTokens = usage["totalTokenCount"] as? Int ?? (pTokens + cTokens)
        continuation.yield(.usage(promptTokens: pTokens, completionTokens: cTokens, totalTokens: tTokens))
      }

      if let candidates = json["candidates"] as? [[String: Any]], let first = candidates.first {
        if let finishReason = first["finishReason"] as? String {
          continuation.yield(.finish(reason: finishReason))
        }

        if let content = first["content"] as? [String: Any],
           let parts = content["parts"] as? [[String: Any]] {
          for part in parts {
            if let text = part["text"] as? String {
              continuation.yield(.textDelta(text))
            } else if let fnCall = part["functionCall"] as? [String: Any],
                      let fnName = fnCall["name"] as? String {
              let args = fnCall["args"] as? [String: Any] ?? [:]
              let argsData = (try? JSONSerialization.data(withJSONObject: args)) ?? Data()
              let argsStr = String(data: argsData, encoding: .utf8) ?? "{}"
              let call = ToolCall(id: UUID().uuidString, name: fnName, arguments: argsStr)
              continuation.yield(.toolCallComplete(call))
            }
          }
        }
      }
    }
  }
}
