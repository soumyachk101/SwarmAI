import SwiftUI

// MARK: - Zoom Control Bar

public struct FlowZoomControl: View {
 @Binding var scale: CGFloat
 @Binding var cameraOffset: CGPoint
 var onReset: () -> Void = {}
 var onZoomToFit: () -> Void = {}

 public var body: some View {
 HStack(spacing: 4) {
 Button {
 withAnimation(.swarmQuick) {
 scale = max(0.25, scale - 0.2)
 }
 } label: {
 Image(systemName: "minus")
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextSecondary)
 .frame(width: 22, height: 22)
 }
 .buttonStyle(.plain)
 .help("Zoom Out")

 Text("\(Int(scale * 100))%")
 .font(.swarmMono(.micro))
 .foregroundStyle(Color.swarmTextPrimary)
 .frame(minWidth: 42)

 Button {
 withAnimation(.swarmQuick) {
 scale = min(2.5, scale + 0.2)
 }
 } label: {
 Image(systemName: "plus")
 .font(.swarm(.xs))
 .foregroundStyle(Color.swarmTextSecondary)
 .frame(width: 22, height: 22)
 }
 .buttonStyle(.plain)
 .help("Zoom In")

 Divider()
 .frame(height: 14)
 .background(Color.swarmBorderSubtle)

 // Zoom to Fit button (Issue #5)
 Button {
 onZoomToFit()
 } label: {
 Image(systemName: "arrow.up.left.and.arrow.down.right")
 .font(.swarm(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 .frame(width: 22, height: 22)
 }
 .buttonStyle(.plain)
 .help("Zoom to Fit Content")

 Button {
 onReset()
 } label: {
 Image(systemName: "arrow.counterclockwise")
 .font(.swarm(.micro))
 .foregroundStyle(Color.swarmTextTertiary)
 .frame(width: 22, height: 22)
 }
 .buttonStyle(.plain)
 .help("Reset Zoom & Center")
 }
 .padding(.horizontal, 8)
 .padding(.vertical, 5)
 .background(
 RoundedRectangle(cornerRadius: 8)
 .fill(Color.swarmSurface.opacity(0.94))
 .overlay(
 RoundedRectangle(cornerRadius: 8)
 .stroke(Color.swarmBorderSubtle, lineWidth: 1)
 )
 .shadow(color: .black.opacity(0.3), radius: 6, x: 0, y: 2)
 )
 }
}
