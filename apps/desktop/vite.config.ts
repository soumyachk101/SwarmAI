/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
 plugins: [react()],
 resolve: {
 alias: {
 '@': path.resolve(__dirname, './src'),
 '@swarm/plugins': path.resolve(__dirname, '../../packages/plugins/src'),
 '@swarm/reports/ui': path.resolve(__dirname, '../../packages/reports/src/ui'),
 '@swarm/reports': path.resolve(__dirname, '../../packages/reports/src'),
 '@swarm/voice': path.resolve(__dirname, '../../packages/voice/src'),
 '@swarm/extension': path.resolve(__dirname, '../../packages/extension/src'),
 '@swarm/mind/core': path.resolve(__dirname, '../../packages/mind/src/core.ts'),
 '@swarm/mind/tauri': path.resolve(__dirname, '../../packages/mind/src/tauri'),
 '@swarm/mind': path.resolve(__dirname, '../../packages/mind/src'),
 '@swarm/board': path.resolve(__dirname, '../../packages/board/src'),
 '@swarm/flow': path.resolve(__dirname, '../../packages/flow/src'),
 '@swarm/pheromone/tauri': path.resolve(__dirname, '../../packages/pheromone/src/tauri'),
 '@swarm/pheromone/ui': path.resolve(__dirname, '../../packages/pheromone/src/ui'),
 '@swarm/pheromone': path.resolve(__dirname, '../../packages/pheromone/src'),
 '@swarm/pheromone-mcp': path.resolve(__dirname, '../../packages/pheromone-mcp/src'),
 '@swarm/lead': path.resolve(__dirname, '../../packages/lead/src'),
 '@swarm/tasks': path.resolve(__dirname, '../../packages/tasks/src'),
 '@swarm/agents/storage': path.resolve(__dirname, '../../packages/agents/src/ui/persistStorage.ts'),
 '@swarm/agents/cli-configs': path.resolve(__dirname, '../../packages/agents/src/cli-configs'),
 '@swarm/agents/ui': path.resolve(__dirname, '../../packages/agents/src/ui'),
 '@swarm/agents': path.resolve(__dirname, '../../packages/agents/src'),
 '@swarm/workspace/ui': path.resolve(__dirname, '../../packages/workspace/src/ui'),
 '@swarm/workspace': path.resolve(__dirname, '../../packages/workspace/src'),
 },
 },
 test: {
 environment: 'jsdom',
 globals: true,
 },
  build: {
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('zustand')) {
              return 'vendor-react';
            }
            if (id.includes('@tauri-apps')) {
              return 'vendor-tauri';
            }
            if (id.includes('xterm')) {
              return 'vendor-xterm';
            }
            if (id.includes('lucide-react') || id.includes('simple-icons')) {
              return 'vendor-icons';
            }
          }
        },
      },
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      ignored: [
        '**/dist/**',
        '**/.pheromone/**',
        '**/.git/**',
        '**/node_modules/**',
        '**/*.tsbuildinfo',
        '**/.agents/**',
        '**/sessions/**',
      ],
    },
  },
});
