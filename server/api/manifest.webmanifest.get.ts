export default defineEventHandler(async (event) => {
  setHeader(event, 'Content-Type', 'application/manifest+json')
  setHeader(event, 'Cache-Control', 'public, max-age=86400') // 1 день
  
  return {
    name: 'Справочник СМП',
    short_name: 'СМП Справочник',
    description: 'Справочник СМП: алгоритмы, инструкции, кодификаторы и медицинские калькуляторы',
    theme_color: '#3b82f6',
    background_color: '#ffffff',
    display: 'standalone',
    orientation: 'portrait-primary',
    scope: '/',
    start_url: '/',
    lang: 'ru',
    categories: ['medical', 'health', 'reference'],
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-96x96.png',
        sizes: '96x96',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-128x128.png',
        sizes: '128x128',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-144x144.png',
        sizes: '144x144',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-152x152.png',
        sizes: '152x152',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-384x384.png',
        sizes: '384x384',
        type: 'image/png',
        purpose: 'maskable any'
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable any'
      }
    ],
    shortcuts: [
      {
        name: 'Алгоритмы',
        short_name: 'Алгоритмы',
        description: 'Открыть раздел алгоритмов',
        url: '/algorithms',
        icons: [
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96'
          }
        ]
      },
      {
        name: 'Калькуляторы',
        short_name: 'Калькуляторы',
        description: 'Открыть медицинские калькуляторы',
        url: '/calculators',
        icons: [
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96'
          }
        ]
      },
      {
        name: 'Препараты',
        short_name: 'Препараты',
        description: 'Открыть справочник препаратов',
        url: '/drugs',
        icons: [
          {
            src: '/icons/icon-96x96.png',
            sizes: '96x96'
          }
        ]
      }
    ]
  }
})
