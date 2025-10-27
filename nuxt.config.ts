// https://nuxt.com/docs/api/configuration/nuxt-config

// Отключаем fontshare чтобы избежать таймаутов при сборке
process.env.NUXT_PUBLIC_UNFONT_PROVIDER_DISABLED = 'true'
process.env.UNFONT_PROVIDER_DISABLED = 'true'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  devServer: { 
    port: 3000, 
    host: '0.0.0.0',
    https: {
      key: './cert/localhost-key.pem',
      cert: './cert/localhost.pem'
    }
  },
  modules: ['@nuxt/ui'],
  ui: {
    global: true,
    icons: ['heroicons']
  },
  nitro: {
    preset: process.env.NODE_ENV === 'production' ? 'node-server' : 'static',
    prerender: false, // Временно отключаем prerender
    experimental: {
      emitRouteRules: true
    },
    // Отключаем внешние запросы при сборке
    compressPublicAssets: {
      gzip: true,
      brotli: true
    }
  },
  ssr: process.env.NODE_ENV === 'production', // Включаем SSR для продакшна
  app: {
    head: {
      title: 'Справочник СМП',
      titleTemplate: '%s — Справочник СМП',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.' },
        { name: 'theme-color', content: '#3b82f6' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.svg', type: 'image/svg+xml' }
      ],
      script: [
        { src: 'https://telegram.org/js/telegram-web-app.js', async: true }
      ]
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@185.185.68.107:27017/',
    adminSetupToken: process.env.ADMIN_SETUP_TOKEN || 'setup-token',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    public: {
      apiBase: '/api',
      yamapsApiKey: process.env.YAMAPS_API_KEY || '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c',
      realmAppId: process.env.REALM_APP_ID || '', // Отключаем Realm для локальной работы
      // Для мобильного приложения используем IP адрес вместо localhost
      apiUrl: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://10.0.2.2:3000',
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || 'helpssmp_bot',
      // Отключаем Fontshare provider
      UNFONT_PROVIDER_DISABLED: true
    }
  },
  css: ['~/assets/css/main.css'],
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
      autoprefixer: {}
    }
  },
  plugins: [
    // Условная загрузка плагинов для локальной работы
    ...(process.env.REALM_APP_ID ? ['~/plugins/realm.client.ts'] : ['~/plugins/mongodb-local.client.ts']),
    '~/plugins/capacitor.client.ts',
    '~/plugins/mobile-ui.client.ts',
    '~/plugins/fetch.client.ts'
  ]
})