export default defineNuxtPlugin({
  name: 'drugs-og-image',
  enforce: 'post', // Выполняется после всех других плагинов
  setup() {
    const route = useRoute()
    
    // Получаем абсолютный URL
    let baseUrl: string
    if (process.server) {
      const headers = useRequestHeaders()
      const host = headers.host || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      baseUrl = `${protocol}://${host}`
    } else {
      baseUrl = `${window.location.protocol}//${window.location.host}`
    }
    
    // Функция для получения правильного URL изображения для препаратов
    const getOgImageUrl = () => {
      const path = route.path || '/'
      const queryId = route.query.id as string | undefined
      
      // Только для страниц препаратов
      if (!path.startsWith('/drugs')) {
        return null
      }
      
      // Для страниц препаратов с id используем индивидуальный endpoint
      if (queryId && queryId.trim().length > 0) {
        const itemId = queryId.trim()
        // Проверяем, что id выглядит как валидный MongoDB ObjectId (24 символа hex)
        if (itemId.length >= 20) {
          // Используем параметр v для версионирования (как в API)
          return `${baseUrl}/api/og-image/page?path=${encodeURIComponent('/drugs')}&v=${itemId}&w=900&h=600`
        }
      }
      
      // Для страниц препаратов без id используем общий endpoint
      return `${baseUrl}/api/og-image/page?path=${encodeURIComponent('/drugs')}&w=900&h=600`
    }
    
    // Вычисляем URL реактивно (без вызова composables внутри)
    const ogImageUrl = computed(() => getOgImageUrl())
    const path = computed(() => route.path || '/')
    
    // Устанавливаем мета-теги только для страниц препаратов
    // Используем watch для установки мета-тегов только когда URL готов
    watch([ogImageUrl, path], ([url, currentPath]) => {
      // Устанавливаем мета-теги только для страниц препаратов и когда URL готов
      if (!currentPath.startsWith('/drugs') || !url) {
        return
      }
      
      // Устанавливаем мета-теги с стандартными hid для перезаписи автоматически установленных
      useHead({
        meta: [
          { 
            property: 'og:image', 
            content: url,
            hid: 'og:image', // Стандартный hid для перезаписи
            key: 'og:image-drugs'
          },
          { 
            property: 'og:image:secure_url', 
            content: url,
            hid: 'og:image:secure_url', // Стандартный hid для перезаписи
            key: 'og:image:secure_url-drugs'
          },
          { 
            property: 'og:image:width',
            content: '900',
            hid: 'og:image:width',
            key: 'og:image:width-drugs'
          },
          { 
            property: 'og:image:height',
            content: '600',
            hid: 'og:image:height',
            key: 'og:image:height-drugs'
          },
          { 
            property: 'og:image:type',
            content: 'image/png',
            hid: 'og:image:type',
            key: 'og:image:type-drugs'
          },
          { 
            name: 'twitter:image', 
            content: url,
            hid: 'twitter:image', // Стандартный hid для перезаписи
            key: 'twitter:image-drugs'
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
            hid: 'twitter:card',
            key: 'twitter:card-drugs'
          }
        ],
        link: [
          { rel: 'image_src', href: url, key: 'image_src', hid: 'image_src' } // Стандартный key и hid для перезаписи
        ]
      })
    }, { immediate: true })
  }
})

