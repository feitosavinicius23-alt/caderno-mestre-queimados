import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'node:path';

export default defineConfig({
  plugins: [
    react(),
    // PWA (requisito 43): instalável, com cache do app shell e do conteúdo.
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['robots.txt', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'],
      manifest: {
        name: 'Caderno Mestre — Agente Fiscal Queimados/RJ 2026',
        short_name: 'Caderno Mestre',
        description:
          'Plataforma de estudos para o concurso de Agente Fiscal de Queimados/RJ 2026.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f6f7f9',
        theme_color: '#10284a',
        categories: ['education'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html',
        // As aulas são chunks JS gerados pelo build; ficam em cache junto do app.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  server: {
    host: '0.0.0.0',
    port: 5173,
    // O preview roda atrás de um proxy com hostname dinâmico.
    allowedHosts: true,
  },

  preview: { host: '0.0.0.0', port: 4173 },

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Separa o runtime do React do código da aplicação para melhorar o cache.
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-router')) return 'router';
            if (id.includes('react')) return 'react';
            return 'vendor';
          }
          return undefined;
        },
      },
    },
  },
});