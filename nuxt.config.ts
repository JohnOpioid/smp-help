// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  devServer: { port: 3000, host: 'localhost' },
  modules: ['@nuxt/ui', '@vite-pwa/nuxt'],
  nitro: {
    preset: 'node-server'
  },
  app: {
    head: {
      title: 'Справочник СМП',
      titleTemplate: '%s — Справочник СМП',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.' },
        { name: 'theme-color', content: '#3b82f6' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'default' },
        { name: 'apple-mobile-web-app-title', content: 'СМП Справочник' },
        { name: 'msapplication-TileColor', content: '#3b82f6' },
        { name: 'msapplication-config', content: '/browserconfig.xml' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icons/icon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/icons/icon-192x192.png' },
        { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/icons/icon-512x512.png' },
        { rel: 'manifest', href: '/manifest.webmanifest' }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help',
    adminSetupToken: process.env.ADMIN_SETUP_TOKEN || 'setup-token',
    public: {
      apiBase: '/api',
      yamapsApiKey: process.env.YAMAPS_API_KEY || '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c'
    }
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {}
    }
  },
  pwa: {
    registerType: 'autoUpdate',
    workbox: {
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,png,svg,ico}'],
      globIgnores: [
        '**/adults/**',
        '**/pediatrics/**',
        '**/onmp/**',
        '**/*.html'
      ],
      cleanupOutdatedCaches: true,
      skipWaiting: true,
      clientsClaim: true,
      maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      mode: 'production',
      runtimeCaching: [
        {
          urlPattern: /^\/api\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 100,
              maxAgeSeconds: 60 * 60 * 24
            },
            networkTimeoutSeconds: 10
          }
        },
        {
          urlPattern: /^\/.*/i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'pages-cache',
            expiration: {
              maxEntries: 200,
              maxAgeSeconds: 60 * 60 * 24 * 7
            },
            networkTimeoutSeconds: 5
          }
        }
      ]
    },
    client: {
      installPrompt: false,
      periodicSyncForUpdates: 20
    },
    devOptions: {
      enabled: false,
      suppressWarnings: true
    },
    strategies: 'generateSW',
    filename: 'sw.js'
  }
})