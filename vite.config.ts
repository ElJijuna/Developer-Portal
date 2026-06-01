import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { resolve } from 'node:path'

export default defineConfig(({ command }) => {
  const base = command === 'build' ? (process.env.VITE_BASE_URL ?? '/') : '/'
  return {
    base,
    resolve: {
      alias: { '@': resolve(__dirname, 'src') },
    },
    plugins: [
      tanstackRouter({ routesDirectory: './src/routes', generatedRouteTree: './src/routeTree.gen.ts' }),
      react(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'mask-icon.svg', 'icons/icon.svg'],
        manifest: {
          id: base,
          name: 'Developer Portal',
          short_name: 'Dev Portal',
          description: 'A portal for developers',
          theme_color: '#303030',
          background_color: '#ebebeb',
          display: 'standalone',
          display_override: ['window-controls-overlay', 'standalone'],
          scope: base,
          start_url: base,
          launch_handler: {
            client_mode: 'navigate-existing',
          },
          categories: ['developer-tools', 'utilities'],
          shortcuts: [
            {
              name: 'Dashboard',
              short_name: 'Dashboard',
              description: 'Go to the main dashboard',
              url: base,
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
            },
            {
              name: 'Repositories',
              short_name: 'Repos',
              description: 'Open tracked repositories',
              url: `${base.replace(/\/$/, '')}/repositories`,
              icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
            },
          ],
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/registry\.npmjs\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'npm-registry-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.npmjs\.org\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'npm-downloads-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              },
            },
            {
              urlPattern: /^https:\/\/bundlephobia\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'bundlephobia-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              },
            },
            {
              urlPattern: /^https:\/\/api\.github\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'github-api-cache',
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 },
              },
            },
          ],
        },
      }),
    ],
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
