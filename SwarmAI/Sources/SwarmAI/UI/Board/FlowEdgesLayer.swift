import SwiftUI

// MARK: - Flow Edges Layer (with animated particles)

public struct FlowEdgesLayer: View {
 let nodes: [CanvasNode]
 let edges: [CanvasEdge]
 var camera: CGPoint = .zero
 var scale: CGFloat = 1.0
 var selectedNodeId: UUID? = nil
 var particlePhase: CGFloat = 0

 public var body: some View {
 Canvas { context, size in
 for edge in edges {
 guard let fromNode = nodes.first(where: { $0.id == edge.from }),
 let toNode = nodes.first(where: { $0.id == edge.to }) else { continue }

 let isEdgeHighlighted = (selectedNodeId == edge.from || selectedNodeId == edge.to)

 let fromX = (fromNode.position.x + fromNode.width / 2 + camera.x) * scale
 let fromY = (fromNode.position.y + fromNode.height / 2 + camera.y) * scale
 let toX = (toNode.position.x + toNode.width / 2 + camera.x) * scale
 let toY = (toNode.position.y + toNode.height / 2 + camera.y) * scale

 let dx = toX - fromX
 let controlOffset = max(40, abs(dx) * 0.4)

 let path = Path { p in
 p.move(to: CGPoint(x: fromX, y: fromY))
 p.addCurve(
 to: CGPoint(x: toX, y: toY),
 control1: CGPoint(x: fromX + (dx > 0 ? controlOffset : -controlOffset), y: fromY),
 control2: CGPoint(x: toX - (dx > 0 ? controlOffset : -controlOffset), y: toY)
 )
 }

 let strokeColor = isEdgeHighlighted
 ? Color.swarmGold
 : Color.swarmGold.opacity(0.35)
 let strokeWidth: CGFloat = isEdgeHighlighted ? 2.5 : 1.5

 // Draw the edge line
 context.stroke(
 path,
 with: .color(strokeColor),
 style: StrokeStyle(lineWidth: strokeWidth, lineCap: .round, dash: isEdgeHighlighted ? [] : [4, 4])
 )

 // Arrowhead at destination
 let arrowSize: CGFloat = 6.0 * scale
 let arrowPath = Path { p in
 p.move(to: CGPoint(x: toX, y: toY))
 p.addLine(to: CGPoint(x: toX - arrowSize * 1.5, y: toY - arrowSize))
 p.addLine(to: CGPoint(x: toX - arrowSize * 1.5, y: toY + arrowSize))
 p.closeSubpath()
 }
 context.fill(arrowPath, with: .color(strokeColor))

 // Animated flow particles (Issue #10)
 let particleCount = 3
 for i in 0..<particleCount {
 let t = (Double(i) / Double(particleCount) + Double(particlePhase)).truncatingRemainder(dividingBy: 1.0)
 let particlePoint = pointOnCurve(
 from: CGPoint(x: fromX, y: fromY),
 to: CGPoint(x: toX, y: toY),
 control1: CGPoint(x: fromX + (dx > 0 ? controlOffset : -controlOffset), y: fromY),
 control2: CGPoint(x: toX - (dx > 0 ? controlOffset : -controlOffset), y: toY),
 t: CGFloat(t)
 )

 let particleAlpha: Double
 if t < 0.1 {
 particleAlpha = t / 0.1
 } else if t > 0.8 {
 particleAlpha = (1.0 - t) / 0.2
 } else {
 particleAlpha = 1.0
 }

 let particleRect = CGRect(
 x: particlePoint.x - 2.5 * scale,
 y: particlePoint.y - 2.5 * scale,
 width: 5 * scale,
 height: 5 * scale
 )

 context.fill(Path(ellipseIn: particleRect), with: .color(Color.swarmGold.opacity(particleAlpha * (isEdgeHighlighted ? 0.9 : 0.5))))
 }

 // Edge label (if present)
 if let label = edge.label {
 let labelX = (fromX + toX) / 2
 let labelY = (fromY + toY) / 2
 context.draw(Text(label), at: CGPoint(x: labelX, y: labelY), anchor: .center)
 }
 }
 }
 }

 // MARK: - Cubic Bezier point evaluation

 private func pointOnCurve(
 from: CGPoint,
 to: CGPoint,
 control1: CGPoint,
 control2: CGPoint,
 t: CGFloat
 ) -> CGPoint {
 let oneMinusT = 1 - t
 let x = oneMinusT * oneMinusT * oneMinusT * from.x
 + 3 * oneMinusT * oneMinusT * t * control1.x
 + 3 * oneMinusT * t * t * control2.x
 + t * t * t * to.x
 let y = oneMinusT * oneMinusT * oneMinusT * from.y
 + 3 * oneMinusT * oneMinusT * t * control1.y
 + 3 * oneMinusT * t * t * control2.y
 + t * t * t * to.y
 return CGPoint(x: x, y: y)
 }
}

// MARK: - Flow Particles Background Animation (ambient)

public struct FlowParticlesBackground: View {
 let edges: [CanvasEdge]
 let nodes: [CanvasNode]
 let camera: CGPoint
 let scale: CGFloat

 public var body: some View {
 TimelineView(.animation) { timeline in
 Canvas { context, size in
 let now = timeline.date.timeIntervalSinceReferenceDate

 for edge in edges {
 guard let fromNode = nodes.first(where: { $0.id == edge.from }),
 let toNode = nodes.first(where: { $0.id == edge.to }) else { continue }

 let fromX = (fromNode.position.x + fromNode.width / 2 + camera.x) * scale
 let fromY = (fromNode.position.y + fromNode.height / 2 + camera.y) * scale
 let toX = (toNode.position.x + toNode.width / 2 + camera.x) * scale
 let toY = (toNode.position.y + toNode.height / 2 + camera.y) * scale

 let dx = toX - fromX
 let controlOffset = max(40, abs(dx) * 0.4)
 let control1 = CGPoint(x: fromX + (dx > 0 ? controlOffset : -controlOffset), y: fromY)
 let control2 = CGPoint(x: toX - (dx > 0 ? controlOffset : -controlOffset), y: toY)

 for i in 0..<5 {
 let period = 3.0
 let offset = Double(i) / 5.0
 var t = fmod(now / period + offset, 1.0)
 if t < 0 { t += 1.0 }

 let pt = bezierPoint(from: CGPoint(x: fromX, y: fromY), to: CGPoint(x: toX, y: toY), c1: control1, c2: control2, t: CGFloat(t))
 let alpha = sin(t * .pi) * 0.3
 let dotSize: CGFloat = 2.5 * scale

 context.fill(
 Path(ellipseIn: CGRect(x: pt.x - dotSize / 2, y: pt.y - dotSize / 2, width: dotSize, height: dotSize)),
 with: .color(Color.white.opacity(alpha))
 )
 }
 }
 }
 }
 }

 private func bezierPoint(from: CGPoint, to: CGPoint, c1: CGPoint, c2: CGPoint, t: CGFloat) -> CGPoint {
 let mt = 1 - t
 return CGPoint(
 x: mt*mt*mt*from.x + 3*mt*mt*t*c1.x + 3*mt*t*t*c2.x + t*t*t*to.x,
 y: mt*mt*mt*from.y + 3*mt*mt*t*c1.y + 3*mt*t*t*c2.y + t*t*t*to.y
 )
 }
}
