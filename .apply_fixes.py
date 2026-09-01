import re

files = {
 '/Users/soumyachakraborty/Documents/01-Projects/Projects-939/AI-Agents/swarm-ai/desktop/src/main.tsx': {
 'old': '''// Global Window.open Interceptor for Tauri Desktop App:
// Embedded widgets (like GlassChat) call window.open() for browser sign-in/OAuth.
// If the widget builds a relative URL on localhost (e.g. http://localhost:5173/signin?),
// we rewrite the origin to https://glasschat.app and delegate to system default browser.
if (typeof window !== 'undefined') {
 const originalOpen = window.open;
 window.open = function (url?: string | URL, target?: string, features?: string) {
 if (url) {
 let urlStr = typeof url === 'string' ? url : url.toString();

 // Rewrite GlassChat auth URLs to official https://glasschat.app origin
 if (
 urlStr.includes("desktopAuth=") ||
 urlStr.includes("/signin") ||
 urlStr.includes("provider=") ||
 urlStr.includes("glasschat")
 ) {
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
}''',
 'new': '''// Global Window.open Interceptor for Tauri Desktop App:
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
 }
}

for path, fixes in files.items():
 with open(path, 'r') as f:
 content = f.read()

 if fixes['old'] in content:
 content = content.replace(fixes['old'], fixes['new'])
 with open(path, 'w') as f:
 f.write(content)
 print(f'SUCCESS: Applied fixes to {path}')
 else:
 print(f'ERROR: Pattern not found in {path}')
