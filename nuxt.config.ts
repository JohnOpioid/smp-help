// https://nuxt.com/docs/api/configuration/nuxt-config

// Отключаем fontshare чтобы избежать таймаутов при сборке
process.env.NUXT_PUBLIC_UNFONT_PROVIDER_DISABLED = 'true'
process.env.UNFONT_PROVIDER_DISABLED = 'true'

// Принудительно блокируем использование 0.0.0.0
if (typeof process !== 'undefined' && process.argv) {
  const hostIndex = process.argv.indexOf('--host')
  if (hostIndex !== -1 && process.argv[hostIndex + 1] === '0.0.0.0') {
    process.argv[hostIndex + 1] = 'localhost'
  }
  // Удаляем все упоминания 0.0.0.0
  process.argv = process.argv.filter(arg => arg !== '0.0.0.0')
}

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  devServer: { 
    port: 3000,
    host: 'localhost'
    // Убираем SSL для простоты в dev режиме
  },
  modules: ['@nuxt/ui', 'nuxt-og-image', '@nuxtjs/seo'],
  ogImage: {
    provider: 'satori',
    defaults: {
      width: 900,
      height: 600
    }
  },
  seo: {
    siteName: 'Справочник СМП',
    language: 'ru',
    trailingSlash: false,
    robots: process.env.NODE_ENV === 'production' ? true : undefined
  },
  schemaOrg: {
    host: process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru',
    inLanguage: 'ru-RU',
    defaults: {
      name: 'Справочник СМП'
    }
  },
  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://helpsmp.ru',
    name: 'Справочник СМП'
  },
  ui: {
    global: true,
    icons: ['heroicons', 'lucide'],
    safelistColors: ['primary','slate','gray','zinc','neutral','stone','red','orange','amber','yellow','lime','green','emerald','teal','cyan','sky','blue','indigo','violet','purple','fuchsia','pink','rose'],
    safelistOptions: {
      timeout: 1000
    }
  },
  icon: {
    serverBundle: {
      collections: ['heroicons', 'lucide']
    }
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
    },
    // Перехватываем запросы к внешним API
    hooks: {
      'ready': (nitro) => {
        console.log('Nitro hooks loaded')
      }
    },
    // Настройка статических файлов для аватарок
    publicAssets: [
      {
        baseURL: '/uploads/',
        // Абсолютный путь, чтобы избежать проблем с резолвом на Windows
        // В продакшене файлы сохраняются в process.cwd() + '/uploads/avatars/'
        dir: process.env.NODE_ENV === 'production'
          ? require('node:path').join(process.cwd(), 'uploads')
          : require('node:path').join(process.cwd(), 'public', 'uploads'),
        maxAge: 60 * 60 * 24 * 365 // 1 year
      }
    ]
  },
  ssr: true, // Включаем SSR для всех режимов (необходимо для OG мета-тегов)
  app: {
    head: {
      title: 'Справочник СМП',
      titleTemplate: '%s',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы.' },
        { name: 'theme-color', content: '#3b82f6' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'shortcut icon', href: '/favicon.svg', type: 'image/svg+xml' }
      ],
      script: []
    }
  },
  runtimeConfig: {
    jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
    mongodbUri: process.env.MONGODB_URI || 'mongodb://help-smp-user:vTLJP0L5QFJIJ5Ya@185.185.68.107:27017/',
    adminSetupToken: process.env.ADMIN_SETUP_TOKEN || 'setup-token',
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN || '',
    appUrl: process.env.NUXT_PUBLIC_APP_URL || process.env.NUXT_PUBLIC_SITE_URL || (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : ''),
    public: {
      apiBase: '/api',
      yamapsApiKey: process.env.YAMAPS_API_KEY || '0cf3bb2c-e67f-4006-8a3e-c5df09b9da6c',
      realmAppId: process.env.REALM_APP_ID || '', // Отключаем Realm для локальной работы
      // Для мобильного приложения используем IP адрес вместо localhost
      apiUrl: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://10.0.2.2:3000',
      telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME || 'helpssmp_bot',
      // Отключаем Fontshare provider
      UNFONT_PROVIDER_DISABLED: true,
      'seo-utils': {
        canonicalQueryWhitelist: ['page','sort','filter','search','q','category','tag'],
        canonicalLowercase: true
      }
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
    '~/plugins/telegram.client.ts',
    '~/plugins/fetch.client.ts',
    '~/plugins/promo.client.ts',
    '~/plugins/version.client.ts',
    '~/plugins/seo-titles.global'
  ]
})