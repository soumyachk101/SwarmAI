// Which provider key each CLI agent expects in its environment. This is CLI
// knowledge, so it lives with the rest of the per-CLI config rather than in the
// app's settings store — the store just supplies the key values.
export interface ApiKeys {
  anthropic: string;
  openai: string;
  google: string;
  openrouter: string;
  moonshot: string;
}

// Maps a CLI's real executable name to the env vars it needs to authenticate.
// Aider supports both Anthropic and OpenAI models, so it gets both keys.
export function envForCli(command: string, apiKeys: ApiKeys): Record<string, string> {
  const env: Record<string, string> = {};
  switch (command) {
    case "claude":
      if (apiKeys.anthropic && apiKeys.anthropic.trim().length > 0) {
        env.ANTHROPIC_API_KEY = apiKeys.anthropic.trim();
      }
      break;
    case "codex":
      if (apiKeys.openai && apiKeys.openai.trim().length > 0) {
        env.OPENAI_API_KEY = apiKeys.openai.trim();
      }
      break;
    case "agy":
      if (apiKeys.google && apiKeys.google.trim().length > 0) {
        env.GEMINI_API_KEY = apiKeys.google.trim();
        env.GOOGLE_API_KEY = apiKeys.google.trim();
      }
      break;
    case "aider":
      if (apiKeys.anthropic && apiKeys.anthropic.trim().length > 0) {
        env.ANTHROPIC_API_KEY = apiKeys.anthropic.trim();
      }
      if (apiKeys.openai && apiKeys.openai.trim().length > 0) {
        env.OPENAI_API_KEY = apiKeys.openai.trim();
      }
      break;
    case "opencode":
      if (apiKeys.openrouter && apiKeys.openrouter.trim().length > 0) {
        env.OPENROUTER_API_KEY = apiKeys.openrouter.trim();
      }
      if (apiKeys.anthropic && apiKeys.anthropic.trim().length > 0) {
        env.ANTHROPIC_API_KEY = apiKeys.anthropic.trim();
      }
      break;
    case "kimi":
      if (apiKeys.moonshot && apiKeys.moonshot.trim().length > 0) {
        env.MOONSHOT_API_KEY = apiKeys.moonshot.trim();
      }
      break;
    case "cline":
      if (apiKeys.anthropic && apiKeys.anthropic.trim().length > 0) {
        env.ANTHROPIC_API_KEY = apiKeys.anthropic.trim();
      }
      if (apiKeys.openrouter && apiKeys.openrouter.trim().length > 0) {
        env.OPENROUTER_API_KEY = apiKeys.openrouter.trim();
      }
      break;
    case "cursor":
    case "kiro":
    case "kilo":
      if (apiKeys.openai && apiKeys.openai.trim().length > 0) {
        env.OPENAI_API_KEY = apiKeys.openai.trim();
      }
      if (apiKeys.anthropic && apiKeys.anthropic.trim().length > 0) {
        env.ANTHROPIC_API_KEY = apiKeys.anthropic.trim();
      }
      if (apiKeys.openrouter && apiKeys.openrouter.trim().length > 0) {
        env.OPENROUTER_API_KEY = apiKeys.openrouter.trim();
      }
      break;
  }
  return env;
}

/**
 * Reads the OAuth access token Claude Code stores at ~/.claude/.credentials.json
 * and returns it for forwarding into the spawn env. Claude Code reads this
 * env var on startup and skips the interactive OAuth login flow.
 */
export async function loadClaudeCodeOAuthToken(): Promise<string | null> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<{ has_token: boolean; token: string | null }>("read_claude_credentials");
    if (result.has_token && result.token) {
      return result.token;
    }
    return null;
  } catch {
    return null;
  }
}

