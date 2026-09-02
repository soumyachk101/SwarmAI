import SwiftUI
import AppKit

// MARK: - DevTools Tab

public struct DevToolsTab: View {
    @State private var selectedTool: DevTool = .regex

    public init() {}

    public var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Tool selector
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 4) {
                    ForEach(DevTool.allCases) { tool in
                        Button {
                            withAnimation(.swarmQuick) {
                                selectedTool = tool
                            }
                        } label: {
                            HStack(spacing: 4) {
                                Image(systemName: tool.icon)
                                    .font(.swarm(.micro))
                                Text(tool.displayName)
                                    .font(.swarm(.xs, weight: .medium))
                            }
                            .foregroundStyle(selectedTool == tool ? .swarmCanvas : .swarmTextSecondary)
                            .padding(.horizontal, 10)
                            .padding(.vertical, 5)
                            .background {
                                RoundedRectangle(cornerRadius: 6)
                                    .fill(selectedTool == tool ? .swarmGold : .swarmSurface)
                            }
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 12)
            }
            .padding(.vertical, 8)

            Divider()
                .background(.swarmBorderSubtle)

            // Tool content
            ScrollView {
                VStack(spacing: 12) {
                    switch selectedTool {
                    case .regex:
                        RegexToolView()
                    case .jsonFormatter:
                        JsonFormatterTool()
                    case .base64:
                        Base64ToolView()
                    case .epoch:
                        EpochToolView()
                    case .scripts:
                        ScriptsToolView()
                    }
                }
                .padding(.horizontal, 12)
                .padding(.top, 12)
                .padding(.bottom, 20)
            }
            .background(.swarmCanvas)
        }
    }
}

public enum DevTool: String, CaseIterable, Identifiable {
    case regex = "Regex"
    case jsonFormatter = "JSON"
    case base64 = "Base64"
    case epoch = "Epoch"
    case scripts = "Scripts"

    public var id: String { rawValue }

    public var displayName: String { rawValue }

    public var icon: String {
        switch self {
        case .regex: return "magnifyingglass.circle.fill"
        case .jsonFormatter: return "curlybraces"
        case .base64: return "number.square.fill"
        case .epoch: return "clock.fill"
        case .scripts: return "terminal.fill"
        }
    }
}

// MARK: - 1. Regex Tester

public struct RegexToolView: View {
    @State private var pattern: String = #"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"#
    @State private var text: String = "Contact team leads: alice@example.com, bob.smith@company.org, or dev-null@swarm.ai for support."
    @State private var replacementPattern: String = "[REDACTED_EMAIL]"
    @State private var caseInsensitive: Bool = true
    @State private var dotMatchesAll: Bool = false
    @State private var multiline: Bool = true
    @State private var showSubstitution: Bool = false
    @State private var selectedSampleIndex: Int = 0

    private let samplePatterns: [(name: String, pattern: String, sample: String)] = [
        ("Email", #"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"#, "alice@example.com, bob.smith@company.org, dev-null@swarm.ai"),
        ("URL", #"https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)"#, "Check https://github.com/apple/swift and https://news.ycombinator.com"),
        ("IPv4", #"\b(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\b"#, "DNS: 1.1.1.1, Gateway: 192.168.1.1, Local: 127.0.0.1"),
        ("UUID", #"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"#, "Task IDs: 550e8400-e29b-41d4-a716-446655440000, 6ba7b810-9dad-11d1-80b4-00c04fd430c8"),
        ("ISO Date", #"\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?"#, "2026-09-02T10:15:30Z and 2026-12-31"),
        ("Hex Color", #"#(?:[0-9a-fA-F]{3}){1,2}\b"#, "Colors: #FF5733, #FFF, #00B4D8, #2a2a2a")
    ]

    private struct RegexMatchItem: Identifiable {
        let id = UUID()
        let index: Int
        let range: NSRange
        let matchedString: String
        let groups: [String]
    }

    private var regexResult: (matches: [RegexMatchItem], error: String?) {
        guard !pattern.isEmpty else { return ([], nil) }
        var options: NSRegularExpression.Options = []
        if caseInsensitive { options.insert(.caseInsensitive) }
        if dotMatchesAll { options.insert(.dotMatchesLineSeparators) }
        if multiline { options.insert(.anchorsMatchLines) }

        do {
            let regex = try NSRegularExpression(pattern: pattern, options: options)
            let nsString = text as NSString
            let results = regex.matches(in: text, options: [], range: NSRange(location: 0, length: nsString.length))

            let items: [RegexMatchItem] = results.enumerated().map { idx, match in
                let matchedStr = nsString.substring(with: match.range)
                var groups: [String] = []
                if match.numberOfRanges > 1 {
                    for g in 1..<match.numberOfRanges {
                        let groupRange = match.range(at: g)
                        if groupRange.location != NSNotFound {
                            groups.append(nsString.substring(with: groupRange))
                        }
                    }
                }
                return RegexMatchItem(index: idx + 1, range: match.range, matchedString: matchedStr, groups: groups)
            }
            return (items, nil)
        } catch {
            return ([], error.localizedDescription)
        }
    }

    private var substitutedText: String {
        guard !pattern.isEmpty else { return text }
        var options: NSRegularExpression.Options = []
        if caseInsensitive { options.insert(.caseInsensitive) }
        if dotMatchesAll { options.insert(.dotMatchesLineSeparators) }
        if multiline { options.insert(.anchorsMatchLines) }

        guard let regex = try? NSRegularExpression(pattern: pattern, options: options) else { return text }
        let nsString = text as NSString
        return regex.stringByReplacingMatches(in: text, options: [], range: NSRange(location: 0, length: nsString.length), withTemplate: replacementPattern)
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            // Header & Quick Presets
            HStack {
                Text("Regex Tester")
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                Spacer()
                Menu {
                    ForEach(Array(samplePatterns.enumerated()), id: \.offset) { index, sample in
                        Button(sample.name) {
                            pattern = sample.pattern
                            text = sample.sample
                        }
                    }
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: "sparkles")
                        Text("Presets")
                    }
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmGold)
                }
                .menuStyle(.borderlessButton)
            }

            // Pattern Field
            VStack(alignment: .leading, spacing: 4) {
                Text("Regular Expression")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)

                HStack {
                    TextField("Pattern (e.g. [0-9]+)...", text: $pattern)
                        .font(.swarmMono(.xs))
                        .textFieldStyle(.plain)

                    if !pattern.isEmpty {
                        Button {
                            pattern = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.swarm(.micro))
                                .foregroundStyle(.swarmTextTertiary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(8)
                .background(.swarmSurface)
                .cornerRadius(6)
                .overlay {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(regexResult.error != nil ? .swarmError : .swarmBorderSubtle, lineWidth: 1)
                }
            }

            // Flags
            HStack(spacing: 12) {
                Toggle("Case Insensitive (i)", isOn: $caseInsensitive)
                    .font(.swarm(.micro))
                    .toggleStyle(.checkbox)
                Toggle("Dot All (s)", isOn: $dotMatchesAll)
                    .font(.swarm(.micro))
                    .toggleStyle(.checkbox)
                Toggle("Multiline (m)", isOn: $multiline)
                    .font(.swarm(.micro))
                    .toggleStyle(.checkbox)
            }
            .foregroundStyle(.swarmTextSecondary)

            // Test String Field
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Test Text")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    Spacer()
                    Text("\(text.count) chars")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }

                TextEditor(text: $text)
                    .font(.swarmMono(.xs))
                    .frame(minHeight: 90, maxHeight: 120)
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .background(.swarmSurface)
                    .cornerRadius(6)
                    .overlay {
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(.swarmBorderSubtle, lineWidth: 1)
                    }
            }

            // Status Banner / Match Count
            if let err = regexResult.error {
                HStack(spacing: 6) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmError)
                    Text("Invalid Regex: \(err)")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmError)
                }
                .padding(8)
                .frame(maxWidth: .infinity, alignment: .leading)
                .background(.swarmError.opacity(0.1))
                .cornerRadius(6)
            } else {
                HStack {
                    Image(systemName: regexResult.matches.isEmpty ? "info.circle" : "checkmark.circle.fill")
                        .font(.swarm(.xs))
                        .foregroundStyle(regexResult.matches.isEmpty ? .swarmTextTertiary : .swarmSuccess)

                    Text("\(regexResult.matches.count) match\(regexResult.matches.count == 1 ? "" : "es") found")
                        .font(.swarm(.xs, weight: .medium))
                        .foregroundStyle(regexResult.matches.isEmpty ? .swarmTextTertiary : .swarmSuccess)

                    Spacer()

                    Button {
                        showSubstitution.toggle()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: "arrow.2.squarepath")
                            Text(showSubstitution ? "Hide Replace" : "Replace Mode")
                        }
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmGold)
                    }
                    .buttonStyle(.plain)
                }
                .padding(.horizontal, 4)
            }

            // Substitution Drawer
            if showSubstitution {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Replacement Template")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    TextField("Replacement string ($1 for group 1)...", text: $replacementPattern)
                        .font(.swarmMono(.xs))
                        .textFieldStyle(.plain)
                        .padding(6)
                        .background(.swarmSurface)
                        .cornerRadius(6)

                    Text("Result Preview")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    HStack {
                        Text(substitutedText)
                            .font(.swarmMono(.xs))
                            .foregroundStyle(.swarmTextPrimary)
                            .lineLimit(4)
                        Spacer()
                        Button {
                            NSPasteboard.general.clearContents()
                            NSPasteboard.general.setString(substitutedText, forType: .string)
                        } label: {
                            Image(systemName: "doc.on.doc")
                                .font(.swarm(.xs))
                                .foregroundStyle(.swarmGold)
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(8)
                    .background(.swarmCanvas)
                    .cornerRadius(6)
                }
                .padding(8)
                .background(.swarmSurface.opacity(0.5))
                .cornerRadius(8)
            }

            // Matches List
            if !regexResult.matches.isEmpty {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Match Details")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    VStack(spacing: 4) {
                        ForEach(regexResult.matches.prefix(20)) { item in
                            HStack(alignment: .top, spacing: 8) {
                                Text("#\(item.index)")
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmGold)
                                    .frame(width: 24, alignment: .leading)

                                VStack(alignment: .leading, spacing: 2) {
                                    Text(item.matchedString)
                                        .font(.swarmMono(.xs))
                                        .foregroundStyle(.swarmTextPrimary)

                                    HStack(spacing: 8) {
                                        Text("loc: \(item.range.location), len: \(item.range.length)")
                                            .font(.swarmMono(.micro))
                                            .foregroundStyle(.swarmTextTertiary)

                                        if !item.groups.isEmpty {
                                            Text("groups: [\(item.groups.joined(separator: ", "))]")
                                                .font(.swarmMono(.micro))
                                                .foregroundStyle(.swarmInfo)
                                        }
                                    }
                                }
                                Spacer()
                                Button {
                                    NSPasteboard.general.clearContents()
                                    NSPasteboard.general.setString(item.matchedString, forType: .string)
                                } label: {
                                    Image(systemName: "doc.on.doc")
                                        .font(.swarm(.micro))
                                        .foregroundStyle(.swarmTextTertiary)
                                }
                                .buttonStyle(.plain)
                            }
                            .padding(6)
                            .background(.swarmSurface)
                            .cornerRadius(4)
                        }
                    }
                }
            }
        }
    }
}

// MARK: - 2. JSON Formatter & Validator

public struct JsonFormatterTool: View {
    @State private var jsonInput: String = "{\n  \"swarm\": \"SwarmAI\",\n  \"version\": 1.0,\n  \"enabled\": true,\n  \"agents\": [\"lead-claude\", \"worker-codex\"],\n  \"metadata\": {\n    \"cluster\": \"us-east-1\",\n    \"max_workers\": 8\n  }\n}"
    @State private var formattedOutput: String = ""
    @State private var statusMessage: String?
    @State private var isValid: Bool = true
    @State private var isCopied: Bool = false
    @State private var sortKeys: Bool = false

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("JSON Formatter & Validator")
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                Spacer()
                Button("Load Sample") {
                    loadSample()
                }
                .font(.swarm(.micro))
                .foregroundStyle(.swarmGold)
                .buttonStyle(.plain)
            }

            // Actions bar
            HStack(spacing: 6) {
                Button("Format 2-Spaces") {
                    formatJSON(spaces: 2)
                }
                .buttonStyle(DevToolPillStyle(isPrimary: true))

                Button("Format 4-Spaces") {
                    formatJSON(spaces: 4)
                }
                .buttonStyle(DevToolPillStyle(isPrimary: false))

                Button("Minify") {
                    minifyJSON()
                }
                .buttonStyle(DevToolPillStyle(isPrimary: false))

                Button("Validate") {
                    validateJSON()
                }
                .buttonStyle(DevToolPillStyle(isPrimary: false))

                Spacer()

                Button {
                    jsonInput = ""
                    statusMessage = nil
                } label: {
                    Image(systemName: "trash")
                        .font(.swarm(.xs))
                        .foregroundStyle(.swarmTextTertiary)
                }
                .buttonStyle(.plain)
            }

            // Options
            Toggle("Sort Dictionary Keys", isOn: $sortKeys)
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextSecondary)
                .toggleStyle(.checkbox)

            // Input / Output Editor
            TextEditor(text: $jsonInput)
                .font(.swarmMono(.xs))
                .frame(minHeight: 160, maxHeight: 220)
                .scrollContentBackground(.hidden)
                .padding(8)
                .background(.swarmSurface)
                .cornerRadius(6)
                .overlay {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(isValid ? .swarmBorderSubtle : .swarmError, lineWidth: 1)
                }

            // Status message & Copy Output
            HStack {
                if let msg = statusMessage {
                    HStack(spacing: 4) {
                        Image(systemName: isValid ? "checkmark.circle.fill" : "exclamationmark.octagon.fill")
                            .font(.swarm(.micro))
                            .foregroundStyle(isValid ? .swarmSuccess : .swarmError)
                        Text(msg)
                            .font(.swarmMono(.micro))
                            .foregroundStyle(isValid ? .swarmSuccess : .swarmError)
                    }
                } else {
                    Text("\(jsonInput.utf8.count) bytes • \(jsonInput.components(separatedBy: .newlines).count) lines")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextTertiary)
                }

                Spacer()

                Button {
                    copyToClipboard()
                } label: {
                    HStack(spacing: 4) {
                        Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                        Text(isCopied ? "Copied!" : "Copy JSON")
                    }
                    .font(.swarm(.xs))
                    .foregroundStyle(isCopied ? .swarmSuccess : .swarmGold)
                }
                .buttonStyle(.plain)
            }
        }
        .onAppear {
            validateJSON(silentSuccess: true)
        }
    }

    private func formatJSON(spaces: Int) {
        guard let data = jsonInput.data(using: .utf8) else {
            isValid = false
            statusMessage = "Encoding error: invalid UTF-8 string"
            return
        }

        do {
            let jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
            var writingOptions: JSONSerialization.WritingOptions = [.prettyPrinted]
            if #available(macOS 10.15, *), sortKeys {
                writingOptions.insert(.sortedKeys)
            }
            if #available(macOS 10.15, *), spaces == 2 {
                writingOptions.insert(.withoutEscapingSlashes)
            }

            let formattedData = try JSONSerialization.data(withJSONObject: jsonObject, options: writingOptions)
            if let str = String(data: formattedData, encoding: .utf8) {
                jsonInput = str
                isValid = true
                statusMessage = "Valid JSON formatted (\(spaces) spaces)"
            }
        } catch {
            isValid = false
            statusMessage = "Syntax Error: \(error.localizedDescription)"
        }
    }

    private func minifyJSON() {
        guard let data = jsonInput.data(using: .utf8) else { return }
        do {
            let jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
            var writingOptions: JSONSerialization.WritingOptions = []
            if sortKeys { writingOptions.insert(.sortedKeys) }
            let minData = try JSONSerialization.data(withJSONObject: jsonObject, options: writingOptions)
            if let str = String(data: minData, encoding: .utf8) {
                jsonInput = str
                isValid = true
                statusMessage = "Minified JSON (\(minData.count) bytes)"
            }
        } catch {
            isValid = false
            statusMessage = "Syntax Error: \(error.localizedDescription)"
        }
    }

    private func validateJSON(silentSuccess: Bool = false) {
        guard !jsonInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            statusMessage = nil
            isValid = true
            return
        }

        guard let data = jsonInput.data(using: .utf8) else {
            isValid = false
            statusMessage = "Invalid character encoding"
            return
        }

        do {
            _ = try JSONSerialization.jsonObject(with: data, options: [])
            isValid = true
            if !silentSuccess {
                statusMessage = "✓ Valid JSON structure"
            }
        } catch {
            isValid = false
            statusMessage = "Syntax Error: \(error.localizedDescription)"
        }
    }

    private func loadSample() {
        jsonInput = """
        {
          "agent": "Lead-Claude",
          "model": "claude-3-7-sonnet",
          "temperature": 0.2,
          "swarm_cluster": {
            "node_count": 4,
            "region": "us-west-2",
            "active_tasks": [
              { "id": "t-101", "name": "Build Swift Engine", "status": "running" },
              { "id": "t-102", "name": "Android ADB Daemon", "status": "ready" }
            ]
          },
          "token_budget": 128000
        }
        """
        validateJSON()
    }

    private func copyToClipboard() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(jsonInput, forType: .string)
        isCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isCopied = false
        }
    }
}

// MARK: - 3. Base64 Encoder / Decoder

public struct Base64ToolView: View {
    @State private var input: String = "SwarmAI Native macOS Engine"
    @State private var output: String = ""
    @State private var isUrlSafe: Bool = false
    @State private var isCopied: Bool = false
    @State private var errorMessage: String?

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Base64 Encoder / Decoder")
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                Spacer()
                Toggle("URL-Safe Base64", isOn: $isUrlSafe)
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmTextSecondary)
                    .toggleStyle(.checkbox)
            }

            // Input
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Input")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    Spacer()
                    Button("Swap ⇄") {
                        let temp = input
                        input = output
                        output = temp
                    }
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmGold)
                    .buttonStyle(.plain)
                }

                TextEditor(text: $input)
                    .font(.swarmMono(.xs))
                    .frame(height: 80)
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .background(.swarmSurface)
                    .cornerRadius(6)
                    .overlay {
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(.swarmBorderSubtle, lineWidth: 1)
                    }
            }

            // Action buttons
            HStack(spacing: 8) {
                Button("Encode →") {
                    encodeBase64()
                }
                .buttonStyle(DevToolPillStyle(isPrimary: true))

                Button("← Decode") {
                    decodeBase64()
                }
                .buttonStyle(DevToolPillStyle(isPrimary: false))

                Spacer()

                Button("Clear") {
                    input = ""
                    output = ""
                    errorMessage = nil
                }
                .font(.swarm(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .buttonStyle(.plain)
            }

            // Error banner
            if let err = errorMessage {
                HStack(spacing: 4) {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmError)
                    Text(err)
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmError)
                }
                .padding(6)
                .background(.swarmError.opacity(0.1))
                .cornerRadius(4)
            }

            // Output
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Output")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)
                    Spacer()
                    Button {
                        copyOutput()
                    } label: {
                        HStack(spacing: 4) {
                            Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                            Text(isCopied ? "Copied!" : "Copy")
                        }
                        .font(.swarm(.micro))
                        .foregroundStyle(isCopied ? .swarmSuccess : .swarmGold)
                    }
                    .buttonStyle(.plain)
                }

                TextEditor(text: $output)
                    .font(.swarmMono(.xs))
                    .frame(height: 80)
                    .scrollContentBackground(.hidden)
                    .padding(8)
                    .background(.swarmSurface)
                    .cornerRadius(6)
                    .overlay {
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(.swarmBorderSubtle, lineWidth: 1)
                    }
            }
        }
        .onAppear {
            encodeBase64()
        }
    }

    private func encodeBase64() {
        errorMessage = nil
        let utf8Data = input.data(using: .utf8) ?? Data()
        var base64 = utf8Data.base64EncodedString()
        if isUrlSafe {
            base64 = base64.replacingOccurrences(of: "+", with: "-")
                .replacingOccurrences(of: "/", with: "_")
                .replacingOccurrences(of: "=", with: "")
        }
        output = base64
    }

    private func decodeBase64() {
        errorMessage = nil
        var base64 = input.trimmingCharacters(in: .whitespacesAndNewlines)
        if isUrlSafe {
            base64 = base64.replacingOccurrences(of: "-", with: "+")
                .replacingOccurrences(of: "_", with: "/")
            while base64.count % 4 != 0 {
                base64.append("=")
            }
        }

        guard let data = Data(base64Encoded: base64) else {
            errorMessage = "Invalid Base64 string"
            return
        }

        if let decodedStr = String(data: data, encoding: .utf8) {
            output = decodedStr
        } else {
            output = "<Binary Data: \(data.count) bytes>"
            errorMessage = "Decoded data is binary (not UTF-8 text)"
        }
    }

    private func copyOutput() {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(output, forType: .string)
        isCopied = true
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            isCopied = false
        }
    }
}

// MARK: - 4. Epoch Timestamp Converter

public struct EpochToolView: View {
    @State private var epochInput: String = "\(Int(Date().timeIntervalSince1970))"
    @State private var selectedDate: Date = Date()
    @State private var liveNow: Date = Date()
    @State private var timerActive = true

    private let timer = Timer.publish(every: 1.0, on: .main, in: .common).autoconnect()

    private var parsedEpochDate: Date? {
        let clean = epochInput.trimmingCharacters(in: .whitespacesAndNewlines)
        guard let num = Double(clean) else { return nil }
        // Detect millis (13 digits) vs seconds (10 digits) vs nanos
        if num > 1_000_000_000_000_000 { // microseconds / nanos
            return Date(timeIntervalSince1970: num / 1_000_000_000)
        } else if num > 1_000_000_000_000 { // milliseconds
            return Date(timeIntervalSince1970: num / 1000)
        } else {
            return Date(timeIntervalSince1970: num)
        }
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Unix Epoch Converter")
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                Spacer()
                Button("Set to Now") {
                    epochInput = "\(Int(Date().timeIntervalSince1970))"
                    selectedDate = Date()
                }
                .font(.swarm(.micro))
                .foregroundStyle(.swarmGold)
                .buttonStyle(.plain)
            }

            // Live Time Indicator
            HStack(spacing: 8) {
                Circle()
                    .fill(.swarmSuccess)
                    .frame(width: 6, height: 6)
                Text("Live Epoch: \(Int(liveNow.timeIntervalSince1970))")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextPrimary)
                Spacer()
                Text(utcFormatter.string(from: liveNow))
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextTertiary)
            }
            .padding(6)
            .background(.swarmSurface)
            .cornerRadius(6)
            .onReceive(timer) { _ in
                liveNow = Date()
            }

            // Input
            VStack(alignment: .leading, spacing: 4) {
                Text("Timestamp (Seconds / Millis)")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)

                HStack {
                    TextField("e.g. 1772582400...", text: $epochInput)
                        .font(.swarmMono(.xs))
                        .textFieldStyle(.plain)

                    if !epochInput.isEmpty {
                        Button {
                            epochInput = ""
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .font(.swarm(.micro))
                                .foregroundStyle(.swarmTextTertiary)
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(8)
                .background(.swarmSurface)
                .cornerRadius(6)
            }

            // Quick Offsets
            HStack(spacing: 6) {
                Button("-1 Hour") { adjustEpoch(by: -3600) }
                    .buttonStyle(DevToolPillStyle(isPrimary: false))
                Button("+1 Hour") { adjustEpoch(by: 3600) }
                    .buttonStyle(DevToolPillStyle(isPrimary: false))
                Button("+1 Day") { adjustEpoch(by: 86400) }
                    .buttonStyle(DevToolPillStyle(isPrimary: false))
                Button("+1 Week") { adjustEpoch(by: 604800) }
                    .buttonStyle(DevToolPillStyle(isPrimary: false))
            }

            // Converted Results
            if let date = parsedEpochDate {
                VStack(alignment: .leading, spacing: 6) {
                    Text("Converted Date Formats")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    VStack(spacing: 4) {
                        EpochResultRow(label: "UTC", value: utcFormatter.string(from: date))
                        EpochResultRow(label: "Local", value: localFormatter.string(from: date))
                        EpochResultRow(label: "ISO 8601", value: isoFormatter.string(from: date))
                        EpochResultRow(label: "Relative", value: relativeFormatter.localizedString(for: date, relativeTo: Date()))
                    }
                }
            } else if !epochInput.isEmpty {
                Text("Invalid timestamp number")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmError)
            }

            Divider()
                .background(.swarmBorderSubtle)

            // Date to Timestamp Picker
            VStack(alignment: .leading, spacing: 6) {
                Text("Date to Timestamp Picker")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)

                DatePicker("", selection: $selectedDate)
                    .datePickerStyle(.graphical)
                    .labelsHidden()
                    .padding(6)
                    .background(.swarmSurface)
                    .cornerRadius(8)

                HStack {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("Epoch Seconds: \(Int(selectedDate.timeIntervalSince1970))")
                            .font(.swarmMono(.xs))
                            .foregroundStyle(.swarmTextPrimary)
                        Text("Millis: \(Int(selectedDate.timeIntervalSince1970 * 1000))")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextTertiary)
                    }
                    Spacer()
                    Button("Copy Seconds") {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString("\(Int(selectedDate.timeIntervalSince1970))", forType: .string)
                    }
                    .font(.swarm(.micro))
                    .foregroundStyle(.swarmGold)
                    .buttonStyle(.plain)
                }
                .padding(8)
                .background(.swarmSurface)
                .cornerRadius(6)
            }
        }
    }

    private func adjustEpoch(by seconds: TimeInterval) {
        if let current = Double(epochInput) {
            epochInput = "\(Int(current + seconds))"
        }
    }

    private var utcFormatter: DateFormatter {
        let f = DateFormatter()
        f.timeZone = TimeZone(abbreviation: "UTC")
        f.dateFormat = "yyyy-MM-dd HH:mm:ss 'UTC'"
        return f
    }

    private var localFormatter: DateFormatter {
        let f = DateFormatter()
        f.timeZone = TimeZone.current
        f.dateFormat = "yyyy-MM-dd HH:mm:ss (zzz)"
        return f
    }

    private var isoFormatter: ISO8601DateFormatter {
        let f = ISO8601DateFormatter()
        f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return f
    }

    private var relativeFormatter: RelativeDateTimeFormatter {
        let f = RelativeDateTimeFormatter()
        f.unitsStyle = .full
        return f
    }
}

private struct EpochResultRow: View {
    let label: String
    let value: String
    @State private var isCopied = false

    var body: some View {
        HStack {
            Text(label)
                .font(.swarmMono(.micro))
                .foregroundStyle(.swarmTextTertiary)
                .frame(width: 60, alignment: .leading)

            Text(value)
                .font(.swarmMono(.xs))
                .foregroundStyle(.swarmTextPrimary)

            Spacer()

            Button {
                NSPasteboard.general.clearContents()
                NSPasteboard.general.setString(value, forType: .string)
                isCopied = true
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.2) {
                    isCopied = false
                }
            } label: {
                Image(systemName: isCopied ? "checkmark" : "doc.on.doc")
                    .font(.swarm(.micro))
                    .foregroundStyle(isCopied ? .swarmSuccess : .swarmTextTertiary)
            }
            .buttonStyle(.plain)
        }
        .padding(6)
        .background(.swarmSurface)
        .cornerRadius(4)
    }
}

// MARK: - 5. Quick Script Runner

public struct ScriptsToolView: View {
    @State private var customCommand: String = "git status -s"
    @State private var scriptOutput: String = ""
    @State private var isRunning: Bool = false
    @State private var exitCode: Int?
    @State private var executionDurationMs: Int?
    @State private var runningProcess: Process?

    private let presetScripts: [(name: String, command: String, icon: String)] = [
        ("Git Status", "git status -s", "arrow.triangle.branch"),
        ("Git Log (10)", "git log --oneline -n 10", "list.bullet"),
        ("Git Branch", "git branch -a", "point.topleft.down.curvedto.point.bottomright.filled"),
        ("Git Diff", "git diff", "doc.text.magnifyingglass"),
        ("System Info", "uname -a && sw_vers", "desktopcomputer"),
        ("Disk Usage", "df -h .", "internaldrive"),
        ("Network IP", "ifconfig | grep \"inet \"", "network"),
        ("Environment", "env | sort | head -n 25", "gearshape.2")
    ]

    public var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Text("Quick Script Runner")
                    .font(.swarm(.sm, weight: .semibold))
                    .foregroundStyle(.swarmTextPrimary)
                Spacer()
                if isRunning {
                    ProgressView()
                        .scaleEffect(0.6)
                        .tint(.swarmGold)
                }
            }

            // Presets grid
            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 6) {
                ForEach(presetScripts, id: \.name) { item in
                    Button {
                        customCommand = item.command
                        executeCommand(item.command)
                    } label: {
                        HStack(spacing: 6) {
                            Image(systemName: item.icon)
                                .font(.swarm(.micro))
                                .foregroundStyle(.swarmGold)

                            VStack(alignment: .leading, spacing: 1) {
                                Text(item.name)
                                    .font(.swarm(.xs, weight: .medium))
                                    .foregroundStyle(.swarmTextPrimary)
                                Text(item.command)
                                    .font(.swarmMono(.micro))
                                    .foregroundStyle(.swarmTextTertiary)
                                    .lineLimit(1)
                            }
                            Spacer()
                        }
                        .padding(6)
                        .background(.swarmSurface)
                        .cornerRadius(6)
                    }
                    .buttonStyle(.plain)
                }
            }

            // Custom Script Command Box
            VStack(alignment: .leading, spacing: 4) {
                Text("Custom Shell Command")
                    .font(.swarmMono(.micro))
                    .foregroundStyle(.swarmTextSecondary)

                HStack {
                    Image(systemName: "terminal")
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmGold)

                    TextField("Command to execute...", text: $customCommand)
                        .font(.swarmMono(.xs))
                        .textFieldStyle(.plain)
                        .onSubmit {
                            executeCommand(customCommand)
                        }

                    if isRunning {
                        Button("Stop") {
                            runningProcess?.terminate()
                            isRunning = false
                        }
                        .font(.swarm(.micro))
                        .foregroundStyle(.swarmError)
                        .buttonStyle(.plain)
                    } else {
                        Button("Run") {
                            executeCommand(customCommand)
                        }
                        .buttonStyle(DevToolPillStyle(isPrimary: true))
                    }
                }
                .padding(8)
                .background(.swarmSurface)
                .cornerRadius(6)
            }

            // Output Terminal
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text("Execution Output")
                        .font(.swarmMono(.micro))
                        .foregroundStyle(.swarmTextSecondary)

                    if let code = exitCode {
                        Text("exit: \(code)")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(code == 0 ? .swarmSuccess : .swarmError)
                            .padding(.horizontal, 4)
                            .padding(.vertical, 1)
                            .background((code == 0 ? Color.swarmSuccess : Color.swarmError).opacity(0.15))
                            .cornerRadius(3)
                    }

                    if let ms = executionDurationMs {
                        Text("\(ms) ms")
                            .font(.swarmMono(.micro))
                            .foregroundStyle(.swarmTextTertiary)
                    }

                    Spacer()

                    Button {
                        scriptOutput = ""
                        exitCode = nil
                        executionDurationMs = nil
                    } label: {
                        Image(systemName: "trash")
                            .font(.swarm(.micro))
                            .foregroundStyle(.swarmTextTertiary)
                    }
                    .buttonStyle(.plain)

                    Button {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(scriptOutput, forType: .string)
                    } label: {
                        Image(systemName: "doc.on.doc")
                            .font(.swarm(.micro))
                            .foregroundStyle(.swarmGold)
                    }
                    .buttonStyle(.plain)
                }

                ScrollView {
                    Text(scriptOutput.isEmpty ? "No output yet. Run a script above to view terminal output." : scriptOutput)
                        .font(.swarmMono(.xs))
                        .foregroundStyle(scriptOutput.isEmpty ? .swarmTextTertiary : .swarmTextPrimary)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding(8)
                }
                .frame(minHeight: 120, maxHeight: 180)
                .background(Color.black.opacity(0.4))
                .cornerRadius(6)
                .overlay {
                    RoundedRectangle(cornerRadius: 6)
                        .stroke(.swarmBorderSubtle, lineWidth: 1)
                }
            }
        }
    }

    private func executeCommand(_ cmd: String) {
        guard !cmd.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        isRunning = true
        scriptOutput = "Executing: \(cmd)...\n"
        exitCode = nil

        let startTime = Date()

        DispatchQueue.global(qos: .userInitiated).async {
            let process = Process()
            process.executableURL = URL(fileURLWithPath: "/bin/zsh")
            process.arguments = ["-c", cmd]

            let outPipe = Pipe()
            let errPipe = Pipe()
            process.standardOutput = outPipe
            process.standardError = errPipe

            DispatchQueue.main.async {
                self.runningProcess = process
            }

            do {
                try process.run()
                let outData = outPipe.fileHandleForReading.readDataToEndOfFile()
                let errData = errPipe.fileHandleForReading.readDataToEndOfFile()
                process.waitUntilExit()

                let stdoutStr = String(data: outData, encoding: .utf8) ?? ""
                let stderrStr = String(data: errData, encoding: .utf8) ?? ""
                let duration = Int(Date().timeIntervalSince(startTime) * 1000)

                DispatchQueue.main.async {
                    self.isRunning = false
                    self.exitCode = Int(process.terminationStatus)
                    self.executionDurationMs = duration
                    self.runningProcess = nil

                    var combined = ""
                    if !stdoutStr.isEmpty {
                        combined += stdoutStr
                    }
                    if !stderrStr.isEmpty {
                        combined += (combined.isEmpty ? "" : "\n") + "[stderr]\n" + stderrStr
                    }
                    if combined.isEmpty {
                        combined = "(Command completed with no output)"
                    }
                    self.scriptOutput = combined
                }
            } catch {
                DispatchQueue.main.async {
                    self.isRunning = false
                    self.exitCode = 1
                    self.scriptOutput = "Execution Error: \(error.localizedDescription)"
                    self.runningProcess = nil
                }
            }
        }
    }
}

// MARK: - Reusable Pill Button Style

private struct DevToolPillStyle: ButtonStyle {
    let isPrimary: Bool

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.swarm(.xs, weight: isPrimary ? .semibold : .medium))
            .foregroundStyle(isPrimary ? .swarmCanvas : .swarmTextPrimary)
            .padding(.horizontal, 10)
            .padding(.vertical, 5)
            .background {
                RoundedRectangle(cornerRadius: 6)
                    .fill(isPrimary ? Color.swarmGold : Color.swarmSurface)
            }
            .opacity(configuration.isPressed ? 0.8 : 1.0)
    }
}
