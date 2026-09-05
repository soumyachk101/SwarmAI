import SwiftUI

// MARK: - Theme Picker

public struct ThemePicker: View {
 @Environment(ThemeStore.self) private var themeStore
 @State private var hoveredTheme: Theme?

 public init() {}

 public var body: some View {
 LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
 ForEach(Theme.allThemes) { theme in
 themeSwatch(theme)
 .onTapGesture {
 withAnimation(.swarmQuick) {
 themeStore.currentTheme = theme
 }
 }
 }
 }
 .padding(4)
 }

 private func themeSwatch(_ theme: Theme) -> some View {
 let isSelected = themeStore.currentTheme.id == theme.id
 let isHovered = hoveredTheme?.id == theme.id

 return VStack(spacing: 6) {
 // Color swatch
 Circle()
 .fill(
 LinearGradient(
 colors: [
 theme.color(for: .surface),
 theme.color(for: .background)
 ],
 startPoint: .topLeading,
 endPoint: .bottomTrailing
 )
 )
 .frame(width: 40, height: 40)
 .overlay(
 Circle()
 .strokeBorder(
 isSelected ? Color.swarmGold : Color.swarmBorderSubtle,
 lineWidth: isSelected ? 2.5 : 1
 )
 )
 .shadow(
 color: isSelected ? Color.swarmGold.opacity(0.3) : .clear,
 radius: isSelected ? 6 : 0,
 x: 0,
 y: 2
 )
 .scaleEffect(isHovered ? 1.1 : 1.0)
 .animation(.swarmQuick, value: isHovered)

 // Theme name
 Text(theme.displayName)
 .font(.swarm(.micro))
 .foregroundStyle(isSelected ? Color.swarmGold : Color.swarmTextSecondary)
 }
 .onHover { hovering in
 hoveredTheme = hovering ? theme : nil
 }
 }
}

// MARK: - Compact Theme Picker (for Settings)

public struct CompactThemePicker: View {
 @Environment(ThemeStore.self) private var themeStore

 public init() {}

 public var body: some View {
 HStack(spacing: 8) {
 ForEach(Theme.allThemes) { theme in
 Button {
 withAnimation(.swarmQuick) {
 themeStore.currentTheme = theme
 }
 } label: {
 Circle()
 .fill(theme.color(for: .primary))
 .frame(width: 20, height: 20)
 .overlay(
 Circle()
 .strokeBorder(
 themeStore.currentTheme.id == theme.id ? Color.swarmGold : Color.clear,
 lineWidth: 2
 )
 )
 }
 .buttonStyle(.plain)
 .help(theme.displayName)
 }
 }
 }
}

