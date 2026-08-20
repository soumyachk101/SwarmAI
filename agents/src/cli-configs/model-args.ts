/**
 * Turn "open Claude Code with Opus 5 on medium effort" into the flags that CLI
 * actually takes. Every mapping below was read off the installed CLI's --help,
 * not guessed; a CLI with no published flag simply ignores the request rather
 * than being handed something it will reject.
 */

/** Reasoning/effort levels, in the vocabulary Lead speaks. */
export type EffortLevel = "low" | "medium" | "high" | "xhigh" | "max";

export const EFFORT_LEVELS: EffortLevel[] = ["low", "medium", "high", "xhigh", "max"];

/** Loose spoken model names → the alias the CLI expects. */
function normaliseModel(cli: string, model: string): string {
  const m = model.trim().toLowerCase();
  if (cli === "claude") {
    if (m === "sonnet 1m" || m === "sonnet-1m" || m === "sonnet5[1m]" || m === "sonnet-5[1m]" || m === "sonnet 5 (1m context)" || m === "sonnet 5 (1m)") return "sonnet[1m]";
    if (m === "opus 1m" || m === "opus-1m" || m === "opus5[1m]" || m === "opus-5[1m]" || m === "opus 5 (1m context)" || m === "opus 5 (1m)") return "opus[1m]";
    if (m === "fable 1m" || m === "fable-1m" || m === "fable5[1m]" || m === "fable-5[1m]" || m === "fable 5 (1m context)" || m === "fable 5 (1m)") return "fable[1m]";
    // Preserve 1M context tags like opus[1m], sonnet[1m], claude-fable-5[1m]
    if (m.includes("[1m]")) return m;
    const alias = m.replace(/\s+/g, "-");
    if (/^(opus|sonnet|haiku|fable)(-\d+(\.\d+)?)?$/.test(alias)) {
      return alias.split("-")[0];
    }
    return model.trim();
  }
  if (cli === "opencode") {
    if (m.startsWith("opencode/")) return "";
    if (m.includes("/")) return m;
    return "";
  }
  return model.trim();
}

/**
 * Flags that select a model and/or an effort level for one CLI.
 * Unknown CLI, or a CLI without the concept, yields nothing.
 */
export function modelArgs(
  cli: string,
  model?: string,
  effort?: string,
): string[] {
  const args: string[] = [];
  const m = model?.trim() ? normaliseModel(cli, model) : undefined;
  const e = effort?.trim().toLowerCase();
  const validEffort = e && (EFFORT_LEVELS as string[]).includes(e) ? e : undefined;

  switch (cli) {
    case "claude":
      // --model <alias|full-name>, --effort <low|medium|high|xhigh|max>
      if (m) args.push("--model", m);
      if (validEffort) args.push("--effort", validEffort);
      break;

    case "codex":
      // -m/--model, and effort rides on a config override.
      if (m) args.push("--model", m);
      if (validEffort) {
        // Codex tops out at "high"; anything beyond clamps to it.
        const level = validEffort === "xhigh" || validEffort === "max" ? "high" : validEffort;
        args.push("-c", `model_reasoning_effort="${level}"`);
      }
      break;

    case "opencode":
      if (m && m.includes("/")) args.push("-m", m);
      break;

    case "aider":
      if (m) args.push("--model", m);
      break;

    default:
      // kimi / cursor / kiro / kilo / agy / cline: no stable public flag.
      break;
  }
  return args;
}

/** True when this CLI can be told which model to use. */
export function supportsModel(cli: string): boolean {
  return ["claude", "codex", "opencode", "aider"].includes(cli);
}

/** True when this CLI can be told how hard to think. */
export function supportsEffort(cli: string): boolean {
  return ["claude", "codex"].includes(cli);
}
