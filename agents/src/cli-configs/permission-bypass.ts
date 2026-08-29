import { agentsHost } from '../ui/host.js';

/**
 * Default CLI flags so Agents don't re-prompt for tool/MCP approval every
 * turn. Caller merges these ahead of any user-supplied args (without duplicating).
 *
 * These flags are only applied when the host enables permission bypass
 * (controlled by a user preference in the app shell). Safe by default.
 */
export function permissionBypassArgs(cli: string): string[] {
 switch (cli) {
 case 'claude':
 return ['--dangerously-skip-permissions'];
 case 'codex':
 return ['--dangerously-bypass-approvals-and-sandbox'];
 case 'opencode':
 // Official auto-approve flag (docs); --yolo is an alias on some builds.
 return ['--auto'];
 case 'aider':
 return ['--yes'];
 case 'cline':
 return ['--yolo'];
 default:
 // kimi / cursor / kiro / kilo / agy: no stable public skip flag yet.
 return [];
 }
}

/** Merge bypass flags into existing args without duplicating.
 * Only applies flags when agentsHost().permissionBypassEnabled() returns true. */
export function withPermissionBypass(cli: string, args: string[] = []): string[] {
 if (!agentsHost().permissionBypassEnabled()) return args;
 const bypass = permissionBypassArgs(cli);
 if (bypass.length === 0) return args;
 const have = new Set(args);
 const missing = bypass.filter((a) => !have.has(a));
 return missing.length ? [...missing, ...args] : args;
}
