import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// Vite 8 uses Rolldown which does not have a `jsx` input option.
// tsconfig's `jsx: "react-jsx"` leaks into Rolldown's input options, causing a warning.
// This plugin removes it before Rolldown validates the options.
const fixRolldownJsx = {
  name: 'fix-rolldown-jsx',
  options(opts: Record<string, unknown>) {
    delete opts.jsx;
    return null;
  },
};

export default defineConfig({
  plugins: [
    react(),
    fixRolldownJsx as never,
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.svg', 'icons/icon.svg'],
      manifest: {
        name: 'RAG Studio',
        short_name: 'RAG Studio',
        description: 'Create AI assistants with your own data',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg}'],
        buildPlugins: {
          vite: [fixRolldownJsx as never],
        },
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
