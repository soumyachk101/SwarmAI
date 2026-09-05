import SwiftUI
import AppKit

// MARK: - Native Terminal View (High Performance AppKit Terminal Canvas)

/// A high-performance native AppKit terminal output viewer that handles large scrollbacks,
/// ANSI color parsing, multi-line drag selection, and smooth 120fps scrolling with zero SwiftUI layout jank.
public struct NativeTerminalView: NSViewRepresentable {
    public let lines: [String]
    public let ansiStandard: [Color]
    public let ansiBright: [Color]
    public var autoScroll: Bool = true
    public var fontSize: CGFloat = 12

    public init(
        lines: [String],
        ansiStandard: [Color],
        ansiBright: [Color],
        autoScroll: Bool = true,
        fontSize: CGFloat = 12
    ) {
        self.lines = lines
        self.ansiStandard = ansiStandard
        self.ansiBright = ansiBright
        self.autoScroll = autoScroll
        self.fontSize = fontSize
    }

    public func makeCoordinator() -> Coordinator {
        Coordinator()
    }

    public func makeNSView(context: Context) -> NSScrollView {
        let scrollView = NSScrollView()
        scrollView.hasVerticalScroller = true
        scrollView.hasHorizontalScroller = false
        scrollView.autohidesScrollers = true
        scrollView.borderType = .noBorder
        scrollView.backgroundColor = NSColor(red: 8/255, green: 9/255, blue: 13/255, alpha: 1.0)
        scrollView.drawsBackground = true

        let contentSize = scrollView.contentSize
        let textStorage = NSTextStorage()
        let layoutManager = NSLayoutManager()
        textStorage.addLayoutManager(layoutManager)

        let textContainer = NSTextContainer(containerSize: NSSize(width: contentSize.width, height: CGFloat.greatestFiniteMagnitude))
        textContainer.widthTracksTextView = true
        layoutManager.addTextContainer(textContainer)

        let textView = NSTextView(frame: NSRect(origin: .zero, size: contentSize), textContainer: textContainer)
        textView.isEditable = false
        textView.isSelectable = true
        textView.backgroundColor = NSColor(red: 8/255, green: 9/255, blue: 13/255, alpha: 1.0)
        textView.drawsBackground = true
        textView.textColor = NSColor(red: 220/255, green: 225/255, blue: 235/255, alpha: 1.0)
        textView.font = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)
        textView.textContainerInset = NSSize(width: 10, height: 8)
        textView.autoresizingMask = [.width]
        textView.isRichText = true

        scrollView.documentView = textView
        context.coordinator.textView = textView
        context.coordinator.scrollView = scrollView

        updateTextView(textView, coordinator: context.coordinator)
        return scrollView
    }

    public func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = context.coordinator.textView else { return }
        updateTextView(textView, coordinator: context.coordinator)
    }

    private func updateTextView(_ textView: NSTextView, coordinator: Coordinator) {
        guard coordinator.lastRenderedLineCount != lines.count || coordinator.lastRenderedContentHash != lines.last?.hashValue else {
            return
        }
        coordinator.lastRenderedLineCount = lines.count
        coordinator.lastRenderedContentHash = lines.last?.hashValue

        let fullAttributedString = NSMutableAttributedString()
        let defaultFont = NSFont.monospacedSystemFont(ofSize: fontSize, weight: .regular)
        let defaultTextColor = NSColor(red: 215/255, green: 220/255, blue: 230/255, alpha: 1.0)

        for (idx, rawLine) in lines.enumerated() {
            let swiftUIAttributedString = ANSIParser.parseToAttributedString(
                rawLine,
                standardColors: ansiStandard,
                brightColors: ansiBright
            )
            let nsAttr = NSMutableAttributedString(swiftUIAttributedString)
            
            // Ensure proper font and fallback text color
            let range = NSRange(location: 0, length: nsAttr.length)
            nsAttr.addAttribute(.font, value: defaultFont, range: range)
            
            fullAttributedString.append(nsAttr)
            if idx < lines.count - 1 {
                fullAttributedString.append(NSAttributedString(string: "\n", attributes: [
                    .font: defaultFont,
                    .foregroundColor: defaultTextColor
                ]))
            }
        }

        textView.textStorage?.setAttributedString(fullAttributedString)

        if autoScroll {
            DispatchQueue.main.async {
                textView.scrollRangeToVisible(NSRange(location: textView.string.count, length: 0))
            }
        }
    }

    public final class Coordinator {
        weak var textView: NSTextView?
        weak var scrollView: NSScrollView?
        var lastRenderedLineCount: Int = -1
        var lastRenderedContentHash: Int? = nil
    }
}
