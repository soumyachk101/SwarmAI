// Web Browser Polyfill for Tauri Internals (allows running as a website on Vercel)
if (typeof window !== 'undefined' && !('__TAURI_INTERNALS__' in window)) {
  (window as any).__TAURI_INTERNALS__ = {
    transformCallback: (callback?: any) => (typeof callback === 'function' ? callback : () => {}),
    invoke: async (cmd: string, args: any) => {
      console.debug(`[Web Mock IPC] ${cmd}`, args);
      if (cmd === 'list_directory' || cmd === 'pheromone_list_memory_files') return { files: [] };
      if (cmd === 'pheromone_ensure_structure') return { success: true, created_files: [] };
      if (cmd === 'pheromone_list_sessions') return { sessions: [] };
      if (cmd === 'read_file' || cmd === 'pheromone_read_memory_file') return '';
      return { success: true };
    },
    convertFileSrc: (src: string) => src,
    metadata: { currentWindow: { label: 'main' } },
  };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import HomePage from './app/HomePage';
import { registerHosts } from './host/registerHosts';
import { initTheme } from './shared/themeStore';
import { ToastProvider } from "./shared/ToastProvider";
import 'xterm/css/xterm.css';
import './app/globals.css';

// Apply persisted theme before first paint so the default Swarm look (or the
// user's last choice) is ready when React mounts.
initTheme();

// Global Window.open Interceptor for Tauri Desktop App:
// Embedded widgets (like GlassChat) call window.open() for browser sign-in/OAuth.
// If the widget builds a relative URL on localhost (e.g. http://localhost:5173/signin?...),
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
        urlStr = urlStr.replace(/^http:\/\/localhost:\d+/, "https://glasschat.app");
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
}

// Every feature lives in its own package; this hands each one the app-side
// capabilities it declared. Must run before the first render.
registerHosts();

import ErrorBoundary from './shared/ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ToastProvider>
        <HomePage />
      </ToastProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
