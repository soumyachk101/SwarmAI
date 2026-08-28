import { useAgentsStore, type Agent, type GridLayout } from "@swarm/agents/ui";
import { useWorkspaceStore } from "@swarm/workspace";
import { CLI_METADATA } from "@swarm/agents";

export type PresetType = "solo" | "pair" | "workbench" | "swarm";

export interface LaunchSessionParams {
  preset: PresetType;
  selectedCliId: string; // e.g. "claude-code", "gemini-cli", "terminal"
  sessionCount: number; // 1 to 6
  taskPrompt?: string;
  workingDir?: string | null;
}

export function launchPresetSession({
  preset,
  selectedCliId,
  sessionCount = 1,
  taskPrompt,
  workingDir,
}: LaunchSessionParams) {
  const store = useAgentsStore.getState();
  const workspaceStore = useWorkspaceStore.getState();
  const activeWorkspaceId = workspaceStore.activeWorkspaceId || "";

  const isTerminal = selectedCliId === "terminal";
  const cliMeta = CLI_METADATA.find((c) => c.id === selectedCliId);
  const cliCommand = isTerminal ? "shell" : cliMeta?.command || "claude";
  const cliName = isTerminal ? "Terminal" : cliMeta?.name || "Agent";

  const timestamp = Date.now();
  const basePrompt = taskPrompt?.trim() || "";

  // For each session multiplier (1..sessionCount)
  for (let s = 0; s < sessionCount; s++) {
    const sessionPrefix = sessionCount > 1 ? `[S${s + 1}] ` : "";

    if (preset === "solo") {
      const agent: Agent = {
        id: `agent-solo-${timestamp}-${s}`,
        cli: cliCommand,
        cliName: isTerminal ? "Terminal" : cliName,
        customName: isTerminal ? `${sessionPrefix}Terminal` : `${sessionPrefix}${cliName}`,
        kind: isTerminal ? "shell" : "agent",
        plane: "board",
        workspaceId: activeWorkspaceId,
        initialPrompt: basePrompt || undefined,
      };
      store.addAgent(agent);
      store.setGridLayout(sessionCount > 1 ? "cols2" : "auto");
    } else if (preset === "pair") {
      // 1 Builder + 1 Reviewer
      const builderPrompt = basePrompt
        ? `${basePrompt}\n\n[Role: Builder Agent — focus on generating implementation and writing clean code]`
        : undefined;
      const reviewerPrompt = basePrompt
        ? `Review the code and test coverage for: ${basePrompt}\n\n[Role: Reviewer Agent — inspect diffs, test correctness, and suggest improvements]`
        : undefined;

      const builder: Agent = {
        id: `agent-pair-builder-${timestamp}-${s}`,
        cli: cliCommand,
        cliName: isTerminal ? "Terminal" : `${cliName} (Builder)`,
        customName: `${sessionPrefix}${cliName} (Builder)`,
        kind: isTerminal ? "shell" : "agent",
        plane: "board",
        workspaceId: activeWorkspaceId,
        initialPrompt: builderPrompt,
      };

      const reviewer: Agent = {
        id: `agent-pair-reviewer-${timestamp}-${s}`,
        cli: cliCommand,
        cliName: isTerminal ? "Terminal" : `${cliName} (Reviewer)`,
        customName: `${sessionPrefix}${cliName} (Reviewer)`,
        kind: isTerminal ? "shell" : "agent",
        plane: "board",
        workspaceId: activeWorkspaceId,
        initialPrompt: reviewerPrompt,
      };

      store.addAgent(builder);
      store.addAgent(reviewer);
      store.setGridLayout("cols2");
    } else if (preset === "workbench") {
      // 1 Agent + 1 Shell for git & tests
      const agent: Agent = {
        id: `agent-wb-${timestamp}-${s}`,
        cli: cliCommand,
        cliName: isTerminal ? "Terminal" : cliName,
        customName: `${sessionPrefix}${cliName}`,
        kind: isTerminal ? "shell" : "agent",
        plane: "board",
        workspaceId: activeWorkspaceId,
        initialPrompt: basePrompt || undefined,
      };

      const shell: Agent = {
        id: `shell-wb-${timestamp}-${s}`,
        cli: "shell",
        cliName: "Terminal",
        customName: `${sessionPrefix}Shell (Git & Tests)`,
        kind: "shell",
        plane: "board",
        workspaceId: activeWorkspaceId,
      };

      store.addAgent(agent);
      store.addAgent(shell);
      store.setGridLayout("cols2");
    } else if (preset === "swarm") {
      // 4 agents in parallel
      const roles = [
        { role: "Architect", promptSuffix: "Architecture & Planning" },
        { role: "Core Engineer", promptSuffix: "Core Business Logic" },
        { role: "UI Engineer", promptSuffix: "UI/UX & Frontend Integration" },
        { role: "QA & Reviewer", promptSuffix: "Testing, Linting, & Code Review" },
      ];

      for (let i = 0; i < 4; i++) {
        const r = roles[i];
        const swarmPrompt = basePrompt
          ? `${basePrompt}\n\n[Assigned Swarm Role: ${r.role} - Subtask: ${r.promptSuffix}]`
          : undefined;

        const agent: Agent = {
          id: `agent-swarm-${timestamp}-${s}-${i}`,
          cli: cliCommand,
          cliName: isTerminal ? "Terminal" : `${cliName} (${r.role})`,
          customName: `${sessionPrefix}${cliName} (${r.role})`,
          kind: isTerminal ? "shell" : "agent",
          plane: "board",
          workspaceId: activeWorkspaceId,
          initialPrompt: swarmPrompt,
        };
        store.addAgent(agent);
      }
      store.setGridLayout("grid2x2");
    }
  }

  // Refit terminals after mounting
  setTimeout(() => {
    store.refitTerminals();
  }, 100);
}
