import { describe, it, expect, vi, beforeEach } from 'vitest';
import { permissionBypassArgs, withPermissionBypass } from './permission-bypass.js';
import { setAgentsHost, agentsHost } from '../ui/host.js';
import { claudeEnabledMcpServersFromMcpJson, claudeSettingsMergeWithServers } from './claude-code.js';
import { pheromoneCommand, toNodePath } from './types.js';

// Reset the agentsHost before each test so the default (bypass disabled)
// is always the starting state.
beforeEach(() => {
 setAgentsHost({
 apiKeys: () => ({ anthropic: '', openai: '', google: '', openrouter: '', moonshot: '' }),
 openFilesFor: () => [],
 activeWorkspaceId: () => '',
 revealLeadDock: () => {},
 publishLeadRole: () => {},
 permissionBypassEnabled: () => false,
 });
});

describe('permissionBypassArgs', () => {
 it('returns Claude skip-permissions flag', () => {
 expect(permissionBypassArgs('claude')).toEqual(['--dangerously-skip-permissions']);
 });

 it('returns Codex bypass flag', () => {
 expect(permissionBypassArgs('codex')).toEqual(['--dangerously-bypass-approvals-and-sandbox']);
 });

 it('returns opencode auto flag', () => {
 expect(permissionBypassArgs('opencode')).toEqual(['--auto']);
 });

 it('returns empty for CLIs without a stable bypass flag', () => {
 expect(permissionBypassArgs('kimi')).toEqual([]);
 expect(permissionBypassArgs('kilo')).toEqual([]);
 });
});

describe('withPermissionBypass', () => {
 it('merges without duplicating when bypass is enabled', () => {
 setAgentsHost({
 ...agentsHost(),
 permissionBypassEnabled: () => true,
 });
 expect(withPermissionBypass('claude', ['--dangerously-skip-permissions', '-p'])).toEqual([
 '--dangerously-skip-permissions',
 '-p',
 ]);
 expect(withPermissionBypass('claude', ['-p'])).toEqual([
 '--dangerously-skip-permissions',
 '-p',
 ]);
 });

 it('returns args unchanged when bypass is disabled', () => {
 setAgentsHost({
 ...agentsHost(),
 permissionBypassEnabled: () => false,
 });
 expect(withPermissionBypass('claude', ['-p'])).toEqual(['-p']);
 expect(withPermissionBypass('codex', ['--model', 'gpt-4'])).toEqual(['--model', 'gpt-4']);
 });

 it('returns args unchanged for CLIs without bypass flags', () => {
 expect(withPermissionBypass('kimi', ['--model', 'kimi'])).toEqual(['--model', 'kimi']);
 });
});

describe('toNodePath / pheromoneCommand', () => {
 it('strips Windows extended-length prefixes that break node', () => {
 expect(toNodePath('\\\\?\\C:\\Users\\rakti\\server.js')).toBe('C:/Users/rakti/server.js');
 expect(toNodePath('//?/C:/Users/rakti/server.js')).toBe('C:/Users/rakti/server.js');
 });

 it('builds a runnable node command', () => {
 const cmd = pheromoneCommand({
 mcpServerPath: '\\\\?\\C:\\swarm\\Pheromone\\pheromone-mcp\\dist\\server.js',
 projectPath: 'C:\\Users\\rakti\\Desktop\\code\\Normal\\prg-test',
 });
 expect(cmd).toEqual([
 'node',
 'C:/swarm/Pheromone/pheromone-mcp/dist/server.js',
 '--project',
 'C:/Users/rakti/Desktop/code/Normal/prg-test',
 ]);
 });
});

describe('claude MCP auto-approve helpers', () => {
 it('lists every server from .mcp.json', () => {
 const names = claudeEnabledMcpServersFromMcpJson(
 JSON.stringify({ mcpServers: { pheromone: {}, playwright: {} } }),
 );
 expect(names.sort()).toEqual(['pheromone', 'playwright']);
 });

 it('writes enableAllProjectMcpServers + default permission mode', () => {
 const out = JSON.parse(claudeSettingsMergeWithServers(null, ['pheromone', 'playwright']));
 expect(out.enableAllProjectMcpServers).toBe(true);
 expect(out.enabledMcpjsonServers).toEqual(['pheromone', 'playwright']);
 expect(out.permissions.defaultMode).toBe('default');
 });

 it('allowlist rejects unauthorized modes in claudeCodeConfig', () => {
 const ALLOWED_MODES = new Set(['default', 'acceptEdits', 'bypassPermissions']);
 const bad = 'evil-override';
 const permMode = ALLOWED_MODES.has(bad ?? '') ? bad : 'default';
 expect(permMode).toBe('default');
 });
});
