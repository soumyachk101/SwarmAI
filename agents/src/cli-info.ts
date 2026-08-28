export type CLISlug =
  | 'claude-code'
  | 'codex-cli'
  | 'aider'
  | 'antigravity-cli'
  | 'opencode'
  | 'kimi-code'
  | 'cline'
  | 'cursor'
  | 'gemini-cli'
  | 'droid'
  | 'deepseek-harness'
  | 'grok-build'
  | 'kiro'
  | 'kilo'
  | 'goose';

export interface CLIInfo {
  id: CLISlug;
  name: string;
  description: string;
  command: string;
  installCmd: string;
  docsUrl: string;
}

// Single source of truth for all CLI agent metadata — used by CLIPicker,
// AgentPane, and any other consumer that needs CLI info.
// This replaces the duplicated CLI_COMMANDS, CLI_OPTIONS, and CLI_INSTALL_INFO
// that previously lived in Swarm/src/components/agents/.
export const CLI_METADATA: CLIInfo[] = [
  { id: 'claude-code',      name: 'Claude Code',      description: 'Anthropic Claude CLI',         command: 'claude',   installCmd: 'npm install -g @anthropic-ai/claude-code',     docsUrl: 'https://docs.anthropic.com/en/docs/claude-code' },
  { id: 'codex-cli',        name: 'Codex',            description: 'OpenAI Codex CLI',             command: 'codex',    installCmd: 'npm install -g @openai/codex',                docsUrl: 'https://github.com/openai/codex' },
  { id: 'cursor',           name: 'Cursor Agent',     description: 'Cursor editor AI CLI',          command: 'cursor',   installCmd: '# Install Cursor IDE — CLI ships with the app\ncursor --version', docsUrl: 'https://cursor.com/downloads' },
  { id: 'gemini-cli',       name: 'Gemini CLI',       description: 'Google Gemini CLI assistant',   command: 'gemini',   installCmd: 'npm install -g @google/gemini-cli',           docsUrl: 'https://ai.google.dev' },
  { id: 'droid',            name: 'Droid',            description: 'Factory Droid autonomous agent',command: 'droid',    installCmd: 'npm install -g factory-droid',                docsUrl: 'https://factory.ai' },
  { id: 'opencode',         name: 'OpenCode',         description: 'Open-source coding assistant',  command: 'opencode', installCmd: 'npm install -g opencode-ai',                  docsUrl: 'https://opencode.ai' },
  { id: 'deepseek-harness', name: 'DeepSeek Harness', description: 'DeepSeek R1/V3 coding agent',  command: 'deepseek', installCmd: 'npm install -g deepseek-cli',                 docsUrl: 'https://deepseek.com' },
  { id: 'grok-build',       name: 'Grok Build',       description: 'xAI Grok coding engine',        command: 'grok',     installCmd: 'npm install -g grok-cli',                     docsUrl: 'https://x.ai' },
  { id: 'antigravity-cli',  name: 'Antigravity',      description: 'Google Antigravity CLI',        command: 'agy',      installCmd: 'npm install -g @google/antigravity-cli',     docsUrl: 'https://antigravity.google' },
  { id: 'aider',            name: 'Aider',            description: 'AI pair programming tool',      command: 'aider',    installCmd: 'pip install aider-chat',                      docsUrl: 'https://aider.chat/docs/install.html' },
  { id: 'kimi-code',        name: 'Kimi Code',        description: 'Moonshot AI coding assistant',  command: 'kimi',     installCmd: 'pip install kimi-code',                       docsUrl: 'https://kimi.moonshot.cn' },
  { id: 'cline',            name: 'Cline',            description: 'Claude-powered coding agent',   command: 'cline',    installCmd: 'npm install -g cline',                        docsUrl: 'https://github.com/cline/cline' },
  { id: 'kiro',             name: 'Kiro CLI',         description: 'Kiro AI coding helper',         command: 'kiro',     installCmd: 'npm install -g kiro-cli',                     docsUrl: 'https://kiro.dev' },
  { id: 'kilo',             name: 'Kilo',             description: 'Kilo AI coding agent',        command: 'kilo',     installCmd: 'npm install -g @kilocodeai/cli',                      docsUrl: 'https://kilo.ai' },
  { id: 'goose',            name: 'Goose',            description: 'Block open-source Rust agent',  command: 'goose',    installCmd: 'cargo install goose-cli',                     docsUrl: 'https://goose-docs.ai' },
];

export const CLI_BY_COMMAND: Record<string, CLIInfo> = Object.fromEntries(
  CLI_METADATA.map((c) => [c.command, c])
);

const byId = Object.fromEntries(CLI_METADATA.map((c) => [c.id, c]));
export const CLI_BY_ID: Record<string, CLIInfo> = byId;
