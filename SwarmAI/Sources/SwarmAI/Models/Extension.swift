import Foundation

/// A VS Code extension installed or available for installation.
public struct Extension: Identifiable, Codable, Sendable, Hashable {
 /// Unique identifier for the extension (typically "publisher.name").
 public let id: String

 /// Display name of the extension.
 public var name: String

 /// Publisher of the extension.
 public var publisher: String

 /// Current installed version, or "0.0.0" if not installed.
 public var version: String

 /// Brief description of the extension.
 public var description: String

 /// URL to the extension's icon image.
 public var iconUrl: URL?

 /// Whether the extension is currently installed.
 public var installed: Bool

 public init(
 id: String,
 name: String,
 publisher: String,
 version: String = "0.0.0",
 description: String = "",
 iconUrl: URL? = nil,
 installed: Bool = false
 ) {
 self.id = id
 self.name = name
 self.publisher = publisher
 self.version = version
 self.description = description
 self.iconUrl = iconUrl
 self.installed = installed
 }
}
