# SwarmAI — SwiftUI Edition

> Swarm AI Desktop App rebuilt in native Swift + SwiftUI for macOS

## Overview

SwarmAI is a **local-first, AI-native development environment** that lets you run multiple AI coding agents (Claude Code, Codex CLI, Aider, Cursor, etc.) in live terminal panes. A Lead orchestrator agent coordinates a swarm of workers through the **SwarmMind** orchestration engine, with all agents sharing context through **Pheromone** — a project-scoped SQLite memory store.

## Tech Stack

- **Language:** Swift 6
- **UI Framework:** SwiftUI (macOS 14.0+)
- **State Management:** Observation framework (`@Observable`)
- **Persistence:** UserDefaults + Keychain
- **Terminal:** Native macOS terminal integration
- **Orchestration:** SwarmMind core (Swift implementation)

## Project Structure

```
SwarmAI/
 ├── Package.swift
 └── Sources/SwarmAI/
 ├── main.swift # App entry point
 ├── Core/
 │ ├── AppState.swift # Global app state
 │ └── Tabs.swift # Tab enums (Sidebar, Dock, Plane)
 ├── Theme/
 │ ├── Theme.swift # 9 themes with RGB channel tokens
 │ ├── ThemeTokens.swift # Color token computed properties
 │ ├── GlassElevation.swift # Glass effect system (6 levels)
 │ ├── CustomFonts.swift # Font scale (8 sizes)
 │ ├── ThemeColors.swift # Semantic color helpers
 │ └── Animations.swift # Custom animations
 ├── Models/
 │ ├── Agent.swift # Agent model (reference semantic)
 │ ├── AgentStatus.swift # Status, type, role enums
 │ ├── Workspace.swift # Workspace model
 │ ├── Worktree.swift # Git worktree model
 │ ├── Task.swift # Kanban task model
 │ ├── Memory.swift # Pheromone memory model
 │ ├── Message.swift # Inter-agent messages
 │ ├── Handoff.swift # Handoff messages
 │ ├── TerminalSession.swift # Terminal session model
 │ ├── GitState.swift # Git state model
 │ ├── Provider.swift # AI provider config
 │ ├── Extension.swift # VS Code extension model
 │ ├── GridLayout.swift # Grid layout types
 │ └── PanePosition.swift # Pane positioning
 ├── Stores/
 │ ├── AgentsStore.swift # Agent state management
 │ ├── WorkspaceStore.swift # Workspace state
 │ ├── TaskStore.swift # Task/kanban state
 │ ├── SettingsStore.swift # Settings state
 │ ├── UiStore.swift # UI state (sidebars, tabs)
 │ ├── PlaneStore.swift # Board/browser/emulator state
 │ ├── CanvasStore.swift # Flow canvas state
 │ ├── BrowserStore.swift # Browser pane state
 │ ├── ExtensionStore.swift # Extensions state
 │ ├── DispatchStore.swift # SwarmMind dispatch state
 │ └── ProjectStore.swift # Open files state
 ├── SwarmMind/
 │ └── SwarmMind.swift # Orchestration core
 ├── Pheromone/
 │ └── PheromoneService.swift # Shared memory + file locks + MCP
 ├── Services/
 │ └── Services.swift # Worktree management + spawner + MCP
 ├── UI/
 │ ├── Environment.swift # Environment values
 │ ├── Components/ # Reusable components
 │ ├── Sidebar/ # Left sidebar (7 tabs)
 │ ├── Dock/ # Right dock (5 tabs)
 │ ├── Board/ # Board views (Grid + Flow)
 │ └── Modals/ # Command palette, Settings, etc.
 └── App/
 ├── MainWindow.swift # Main app window
 ├── AppCommands.swift # Menu bar commands
 ├── TitleBar.swift # Custom title bar
 ├── StatusBar.swift # Bottom status bar
 └── VerticalTabBar.swift # Reusable tab bar
```

## Features

### Agent Management
- Spawn 15+ CLI coding agents (Claude Code, Codex, Aider, Cursor, etc.)
- Plain terminal shells (zsh, bash, fish)
- Model + effort selection per agent
- Ring-buffer terminal output (10K lines)
- Token usage tracking

### Lead Orchestrator
- Crown a Lead agent
- 3 modes: Steward, Forager, Stinger
- Mission directive dispatch
- Parallel swarm dispatch via SwarmMind

### Shared Memory (Pheromone)
- SQLite-based project memory
- MCP server for agent access
- Session history, plans, search
- File ownership locks

### Board / Grid System
- 8 grid presets (Auto, 2x2, 3x3, 4x4, etc.)
- Flow canvas with pan/zoom
- Connection edges between agents
- Drag-and-drop positioning

### 9 Themes
- Obsidian Charcoal (default), Midnight Cyberpunk, Matrix Phosphor, Nordic Polar Frost, Crimson Eclipse, Swarm Dark, Obsidian OLED, Graphite, Honey Amber
- RGB channel tokens for opacity support
- Glass elevation system (6 levels)

### Additional Features
- Git integration sidebar
- DevTools (Regex, JSON, Base64, Epoch, Scripts)
- Search with ripgrep-style results
- DevChat AI copilot
- Reports panel with metrics
- Snippets scratchpad
- Command palette (Cmd+K)
- Global keyboard shortcuts

## Building

```bash
cd SwarmAI
swift build
swift run SwarmAI
```

Or open in Xcode 15+:
```bash
open SwarmAI.xcodeproj
```

## Requirements

- macOS 14.0 (Sonoma) or later
- Xcode 15.0 or later
- Swift 6.0

## License

Licensed Personal Non-Commercial. Built by Soumya Chakraborty.
