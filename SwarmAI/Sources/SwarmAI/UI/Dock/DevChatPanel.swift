import SwiftUI

// MARK: - DevChat Panel

struct DevChatPanel: View {
 @State private var messages: [ChatMessage] = [
 ChatMessage(role: .assistant, content: "Hello! I'm GlassChat, your AI copilot. How can I help you today?")
 ]
 @State private var inputText: String = ""

 var body: some View {
 VStack(alignment: .leading, spacing: 0) {
 // Header
 HStack {
 Text("DevChat")
 .font(.swarm(.sm, weight: .semibold))
 .foregroundStyle(.swarmTextPrimary)

 Spacer()

 Button { } label: {
 Image(systemName: "gearshape.fill")
 .font(.swarm(.xs))
 .foregroundStyle(.swarmTextTertiary)
 }
 .buttonStyle(.plain)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)

 Divider()
 .background(.swarmBorderSubtle)

 // Messages
 ScrollView {
 ScrollViewReader { proxy in
 VStack(spacing: 8) {
 ForEach(messages) { message in
 ChatMessageBubble(message: message)
 }
 .padding(.horizontal, 12)
 .padding(.top, 8)

 Color.clear
 .frame(height: 1)
 .id("bottom")
 }
 .onChange(of: messages.count) { _, _ in
 withAnimation {
 proxy.scrollTo("bottom", anchor: .bottom)
 }
 }
 }
 }
 .background(.swarmCanvas)

 // Input bar
 HStack(spacing: 8) {
 TextField("Ask GlassChat...", text: $inputText, axis: .vertical)
 .font(.swarm(.sm))
 .textFieldStyle(.plain)
 .onSubmit {
 sendMessage()
 }

 Button {
 sendMessage()
 } label: {
 Image(systemName: "arrow.up.circle.fill")
 .font(.system(size: 22))
 .foregroundStyle(inputText.isEmpty ? .swarmTextTertiary : .swarmGold)
 }
 .buttonStyle(.plain)
 .disabled(inputText.isEmpty)
 }
 .padding(.horizontal, 12)
 .padding(.vertical, 10)
 .background(.swarmSurface)
 .overlay(alignment: .top) {
 Divider()
 .background(.swarmBorderSubtle)
 }
 }
}

struct ChatMessage: Identifiable {
 let id = UUID()
 let role: MessageRole
 let content: String
 let timestamp: Date = Date()

 enum MessageRole { case user, assistant, system }
}

struct ChatMessageBubble: View {
 let message: ChatMessage

 var body: some View {
 HStack(alignment: .top, spacing: 8) {
 if message.role == .user { Spacer() }

 VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
 Text(message.content)
 .font(.swarm(.sm))
 .foregroundStyle(message.role == .user ? .swarmCanvas : .swarmTextPrimary)
 .padding(.horizontal, 12)
 .padding(.vertical, 8)
 .background {
 RoundedRectangle(cornerRadius: 12)
 .fill(message.role == .user ? .swarmGold : .swarmSurface)
 }
 .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)

 Text(message.timestamp, style: .time)
 .font(.swarm(.micro))
 .foregroundStyle(.swarmTextTertiary)
 }
 .frame(maxWidth: .infinity, alignment: message.role == .user ? .trailing : .leading)

 if message.role == .assistant { Spacer() }
 }
 }
}

private func sendMessage() {
 guard !inputText.isEmpty else { return }
 messages.append(ChatMessage(role: .user, content: inputText))
 inputText = ""

 // Simulate AI response
 DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
 messages.append(ChatMessage(role: .assistant, content: "I understand. Let me help you with that. Here's what I suggest..."))
 }
 }
}
