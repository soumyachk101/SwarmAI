import Foundation

/// An AI provider configuration (e.g., Anthropic, OpenAI, Google).
public struct Provider: Identifiable, Codable, Sendable, Hashable {
 /// Unique identifier for the provider.
 public let id: UUID

 /// Display name of the provider.
 public var name: String

 /// API key for authenticating with this provider (should be stored in Keychain).
 public var apiKey: String

 /// Available model identifiers for this provider.
 public var models: [String]

 /// The default model to use when none is specified.
 public var defaultModel: String

 /// Full API endpoint URL for chat completions.
 public var endpoint: String

 /// Optional base URL override (e.g., for proxies or self-hosted deployments).
 public var baseURL: String?

 /// Whether this provider is currently active/enabled.
 public var isActive: Bool

 public init(
 id: UUID = UUID(),
 name: String,
 apiKey: String,
 models: [String],
 defaultModel: String,
 endpoint: String,
 baseURL: String? = nil,
 isActive: Bool = true
 ) {
 self.id = id
 self.name = name
 self.apiKey = apiKey
 self.models = models
 self.defaultModel = defaultModel
 self.endpoint = endpoint
 self.baseURL = baseURL
 self.isActive = isActive
 }
}
