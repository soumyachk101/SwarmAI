import Foundation
import SwiftUI

/// Preset grid layouts for arranging panes.
@frozen
public enum GridPreset: String, Codable, Sendable, CaseIterable {
 /// Auto-layout: agent-driven, dynamic positioning.
 case auto = "auto"

 /// 2x2 grid (4 panes).
 case twoByTwo = "2x2"

 /// 3x3 grid (9 panes).
 case threeByThree = "3x3"

 /// 4x4 grid (16 panes).
 case fourByFour = "4x4"

 /// Custom column count.
 case columns = "columns"

 /// Custom row count.
 case rows = "rows"

 /// Master-detail layout: one large pane + supporting panes.
 case master = "master"

 /// Focus layout: one pane taking full screen, others hidden.
 case focus = "focus"

 /// Human-readable display name.
 public var displayName: String {
 switch self {
 case .auto: "Auto"
 case .twoByTwo: "2×2"
 case .threeByThree: "3×3"
 case .fourByFour: "4×4"
 case .columns: "Columns"
 case .rows: "Rows"
 case .master: "Master"
 case .focus: "Focus"
 }
 }
}

/// Grid layout configuration for arranging terminal panes.
public struct GridLayout: Codable, Sendable, Hashable {
 /// Number of columns in the grid.
 public var columns: Int

 /// Number of rows in the grid.
 public var rows: Int

 /// Position information for each pane.
 public var panePositions: [PanePosition]

 /// Maximum width constraint for the grid, in points.
 public var maxWidth: CGFloat

 /// Maximum height constraint for the grid, in points.
 public var maxHeight: CGFloat

 /// The preset layout this configuration was derived from, if any.
 public var preset: GridPreset?

 public init(
 columns: Int = 2,
 rows: Int = 2,
 panePositions: [PanePosition] = [],
 maxWidth: CGFloat = .infinity,
 maxHeight: CGFloat = .infinity,
 preset: GridPreset? = nil
 ) {
 self.columns = columns
 self.rows = rows
 self.panePositions = panePositions
 self.maxWidth = maxWidth
 self.maxHeight = maxHeight
 self.preset = preset
 }

 /// Configure the layout from a preset.
 public mutating func applyPreset(_ gridPreset: GridPreset) {
 preset = gridPreset
 switch gridPreset {
 case .auto:
 columns = 2
 rows = 2
 case .twoByTwo:
 columns = 2
 rows = 2
 case .threeByThree:
 columns = 3
 rows = 3
 case .fourByFour:
 columns = 4
 rows = 4
 case .columns:
 columns = max(columns, 1)
 rows = 1
 case .rows:
 columns = 1
 rows = max(rows, 1)
 case .master:
 columns = 2
 rows = 2
 case .focus:
 columns = 1
 rows = 1
 }
 }
}
