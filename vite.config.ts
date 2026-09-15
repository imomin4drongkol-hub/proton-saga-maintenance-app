import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['Gemini_Generated_Image_ws8bx2ws8bx2ws8b.png'],
      manifest: {
        name: 'Proton Saga VVT Maintenance',
        short_name: 'Saga VVT',
        description: 'Track your Proton Saga VVT fuel and service records',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/proton-saga-maintenance-app/',
        start_url: '/proton-saga-maintenance-app/',
        icons: [
          {
            src: '/proton-saga-maintenance-app/icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any',
          },
          {
            src: '/proton-saga-maintenance-app/maskable-icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  base: '/proton-saga-maintenance-app/',
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
