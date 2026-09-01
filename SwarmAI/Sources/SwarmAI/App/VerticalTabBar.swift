import SwiftUI

// MARK: - Vertical Tab Bar

struct VerticalTabBar: View {
 let tabs: [(icon: String, label: String)]
 @Binding var selection: Int
 var onSelect: (Int) -> Void

 init(tabs: [(icon: String, label: String)], selection: Binding<Int>, onSelect: @escaping (Int) -> Void) {
 self.tabs = tabs
 self._selection = selection
 self.onSelect = onSelect
 }

 var body: some View {
 VStack(spacing: 2) {
 ForEach(Array(tabs.enumerated()), id: \.offset) { index, tab in
 Button {
 withAnimation(.swarmTabSwitch) {
 selection = index
 onSelect(index)
 }
 } label: {
 VStack(spacing: 4) {
 Image(systemName: tab.icon)
 .font(.system(size: 16))
 .symbolEffect(.bounce, value: selection == index)

 if selection == index {
 Text(tab.label)
 .font(.swarm(.micro))
 } else {
 Text(tab.label)
 .font(.swarm(.micro))
 .opacity(0)
 }
 }
 .frame(width: 56, height: 48)
 .foregroundStyle(selection == index ? .swarmGold : .swarmTextTertiary)
 .background {
 if selection == index {
 RoundedRectangle(cornerRadius: 8)
 .fill(.swarmGold.opacity(0.15))
 .padding(.horizontal, 4)
 }
 }
 }
 .buttonStyle(.plain)
 }
 }
 .padding(.vertical, 8)
 .padding(.horizontal, 4)
 }
}
