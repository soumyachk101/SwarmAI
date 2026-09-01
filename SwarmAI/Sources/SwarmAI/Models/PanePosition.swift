import Foundation

/// The position and size of a pane within a grid layout.
public struct PanePosition: Codable, Identifiable, Sendable, Hashable {
 /// Unique identifier for this pane position entry.
 public let id: UUID

 /// The ID of the pane this position describes.
 public var paneId: String

 /// X-coordinate of the pane in the grid (column index).
 public var x: Int

 /// Y-coordinate of the pane in the grid (row index).
 public var y: Int

 /// Number of grid columns this pane spans.
 public var width: Int

 /// Number of grid rows this pane spans.
 public var height: Int

 /// The type of pane at this position.
 public var paneType: PaneType

 public init(
 id: UUID = UUID(),
 paneId: String,
 x: Int,
 y: Int,
 width: Int = 1,
 height: Int = 1,
 paneType: PaneType = .terminal
 ) {
 self.id = id
 self.paneId = paneId
 self.x = x
 self.y = y
 self.width = width
 self.height = height
 self.paneType = paneType
 }
}
