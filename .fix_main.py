with open('/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/desktop/src/main.tsx', 'r') as f:
 content = f.read()

# Find the block using line numbers
lines = content.split('\n')
start_idx = None
end_idx = None
for i, line in enumerate(lines):
 if 'Global Window.open Interceptor' in line:
 start_idx = i
 if start_idx and 'registerHosts();' in line and i > start_idx + 5:
 end_idx = i + 1
 break

if start_idx is not None and end_idx is not None:
 new_block = [
 '// Global Window.open Interceptor for Tauri Desktop App:',
 '// Embedded widgets (like GlassChat) call window.open() for browser sign-in/OAuth.',
 '// Only whitelisted auth origins are rewritten; everything else falls through',
 '// to the system browser via Tauri shell.',
 'const ALLOWED_OPEN_ORIGINS = [',
 ' "https://glasschat.app",',
 ' "https://accounts.google.com",',
 ' "https://github.com",',
 ' "https://login.microsoftonline.com",',
 ' "https://openidprovider.net",',
 '];',
 '',
 'function isAllowedAuthUrl(urlStr: string): boolean {',
 ' try {',
 ' const url = new URL(urlStr);',
 ' return ALLOWED_OPEN_ORIGINS.some((origin) => url.origin === origin || urlStr.startsWith(origin));',
 ' } catch {',
 ' return false;',
 ' }',
 '}',
 '',
 'if (typeof window !== \'undefined\') {',
 ' const originalOpen = window.open;',
 ' window.open = function (url?: string | URL, target?: string, features?: string) {',
 ' if (url) {',
 ' let urlStr = typeof url === \'string\' ? url : url.toString();',
 '',
 ' // Only rewrite known auth widget URLs',
 ' if (isAllowedAuthUrl(urlStr)) {',
 ' urlStr = urlStr.replace(/^http://localhost:\\d+/, "https://glasschat.app");',
 ' if (urlStr.startsWith("/")) {',
 ' urlStr = `https://glasschat.app${urlStr}`;',
 ' }',
 ' }',
 '',
 ' if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {',
 ' import(\'@tauri-apps/plugin-shell\')',
 ' .then(({ open: openShellUrl }) => openShellUrl(urlStr))',
 ' .catch(() => originalOpen.call(window, urlStr, target, features));',
 ' return null;',
 ' }',
 ' }',
 ' return originalOpen.call(window, url, target, features);',
 ' };',
 '}',
 '',
 ]
 new_lines = lines[:start_idx] + new_block + lines[end_idx:]
 with open('/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/desktop/src/main.tsx', 'w') as f:
 f.write('\n'.join(new_lines))
 print(f'SUCCESS: Replaced lines {start_idx+1}-{end_idx} with whitelisted window.open block')
else:
 print(f'ERROR: Could not find block. start={start_idx}, end={end_idx}')
