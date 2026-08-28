import { CliConfigAction, McpServerSpec, pheromoneCommand } from './types.js';

export function kiloCodeConfig(spec: McpServerSpec): CliConfigAction {
 const command = pheromoneCommand(spec);
 const configFile = spec.projectPath + '/kilo.jsonc';

 return {
 kind: 'writeFile',
 path: configFile,
 merge: (existingRaw) => {
 let config: Record<string, unknown> = {};
 if (existingRaw) {
 try { config = JSON.parse(existingRaw); } catch { config = {}; }
 }
 const mcp = (config.mcp as Record<string, Record<string, unknown>> | null) || {};
 mcp.pheromone = { type: 'local', command, enabled: true };
 if (!(config as any).$schema) (config as any).$schema = 'https://app.kilo.ai/config.json' as any;
 return JSON.stringify(config, null, 2);
 },
 };
}
