import SwiftUI

@Observable
final class PlaneStore {
 var activePlane: Plane = .board
 var boardView: BoardView = .grid
 var isFullscreen: Bool = false

 init() {
 if let saved = UserDefaults.standard.string(forKey: "activePlane"),
 let plane = Plane(rawValue: saved) {
 activePlane = plane
 }
 if let saved = UserDefaults.standard.string(forKey: "boardView"),
 let view = BoardView(rawValue: saved) {
 boardView = view
 }
 isFullscreen = UserDefaults.standard.object(forKey: "isFullscreen") as? Bool ?? false
 }

 func setPlane(_ plane: Plane) {
 withAnimation(.swarmTabSwitch) {
 activePlane = plane
 UserDefaults.standard.set(plane.rawValue, forKey: "activePlane")
 }
 }

 func setBoardView(_ view: BoardView) {
 withAnimation(.swarmTabSwitch) {
 boardView = view
 UserDefaults.standard.set(view.rawValue, forKey: "boardView")
 }
 }

 func toggleFullscreen() {
 withAnimation(.spring(duration: 0.3)) {
 isFullscreen.toggle()
 UserDefaults.standard.set(isFullscreen, forKey: "isFullscreen")
 }
 }
}
