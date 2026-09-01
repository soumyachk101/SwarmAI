import re

with open('/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/desktop/src/main.tsx', 'r') as f:
	content = f.read()

# Find and replace the window.open block using regex
old_pattern = r'// Global Window\.open Interceptor for Tauri Desktop App:.*?^\}$;'

new_block = '''// Global Window.open Interceptor for Tauri Desktop App:
// Embedded widgets (like GlassChat) call window.open() for browser sign-in/OAuth.
// Only whitelisted auth origins are rewritten; everything else falls through
// to the system browser via Tauri shell.
const ALLOWED_OPEN_ORIGINS = [
	"https://glasschat.app",
	"https://accounts.google.com",
	"https://github.com",
	"https://login.microsoftonline.com",
	"https://openidprovider.net",
];

function isAllowedAuthUrl(urlStr: string): boolean {
	try {
		const url = new URL(urlStr);
		return ALLOWED_OPEN_ORIGINS.some((origin) => url.origin === origin || urlStr.startsWith(origin));
	} catch {
		return false;
	}
}

if (typeof window !== 'undefined') {
	const originalOpen = window.open;
	window.open = function (url?: string | URL, target?: string, features?: string) {
		if (url) {
			let urlStr = typeof url === 'string' ? url : url.toString();

			// Only rewrite known auth widget URLs
			if (isAllowedAuthUrl(urlStr)) {
				urlStr = urlStr.replace(/^http:\\/\\/localhost:\\d+/, "https://glasschat.app");
				if (urlStr.startsWith("/")) {
					urlStr = `https://glasschat.app${urlStr}`;
				}
			}

			if (urlStr.startsWith("http://") || urlStr.startsWith("https://")) {
				import('@tauri-apps/plugin-shell')
					.then(({ open: openShellUrl }) => openShellUrl(urlStr))
					.catch(() => originalOpen.call(window, urlStr, target, features));
				return null;
			}
		}
		return originalOpen.call(window, url, target, features);
	};
}'''

# Use multiline regex with DOTALL to match across lines
result = re.sub(old_pattern, new_block, content, count=1, flags=re.MULTILINE | re.DOTALL)

if result != content:
	with open('/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/desktop/src/main.tsx', 'w') as f:
		f.write(result)
	print('SUCCESS: Fixed window.open block with whitelist')
else:
	print('ERROR: Pattern not found, showing what we have...')
	# Debug: show the area
	idx = content.find('Window.open Interceptor')
	if idx >= 0:
		print('Found Window.open at index', idx)
		print(repr(content[idx:idx+200]))
