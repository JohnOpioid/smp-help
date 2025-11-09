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
    } else if (process.client) {
      baseUrl = `${window.location.protocol}//${window.location.host}`
    } else {
      baseUrl = process.env.NODE_ENV === 'production' ? 'https://helpsmp.ru' : 'http://localhost:3000'
    }
    
    // Функция для получения правильного URL изображения для препаратов
    const getOgImageUrl = () => {
      const path = route.path || '/'
      const queryId = route.query.id as string | undefined
      
      // Для страниц препаратов с id используем индивидуальный endpoint
      if (path.startsWith('/drugs') && queryId && queryId.trim().length > 0) {
        const itemId = queryId.trim()
        // Проверяем, что id выглядит как валидный MongoDB ObjectId (24 символа hex)
        if (itemId.length >= 20) {
          // Используем параметр v для версионирования (как в API)
          return `${baseUrl}/api/og-image/page?path=${encodeURIComponent('/drugs')}&v=${itemId}&w=900&h=600`
        }
      }
      
      // Для страниц препаратов без id используем общий endpoint
      if (path.startsWith('/drugs')) {
        return `${baseUrl}/api/og-image/page?path=${encodeURIComponent('/drugs')}&w=900&h=600`
      }
      
      return null
    }
    
    // Вычисляем URL реактивно
    const ogImageUrl = computed(() => getOgImageUrl())
    
    // Устанавливаем мета-теги только для страниц препаратов
    // Используем useHead напрямую с реактивным значением
    const path = computed(() => route.path || '/')
    const queryId = computed(() => route.query.id as string | undefined)
    
    watch([ogImageUrl, path, queryId], ([url, currentPath]) => {
      if (!url || !currentPath.startsWith('/drugs')) return
      
      // Устанавливаем og:image через useHead
      useHead({
        meta: [
          {
            property: 'og:image',
            content: url,
            hid: 'og:image-drugs',
            key: 'og:image-drugs'
          },
          {
            property: 'og:image:secure_url',
            content: url,
            hid: 'og:image:secure_url-drugs',
            key: 'og:image:secure_url-drugs'
          },
          {
            property: 'og:image:width',
            content: '900',
            hid: 'og:image:width-drugs',
            key: 'og:image:width-drugs'
          },
          {
            property: 'og:image:height',
            content: '600',
            hid: 'og:image:height-drugs',
            key: 'og:image:height-drugs'
          },
          {
            property: 'og:image:type',
            content: 'image/png',
            hid: 'og:image:type-drugs',
            key: 'og:image:type-drugs'
          },
          {
            name: 'twitter:image',
            content: url,
            hid: 'twitter:image-drugs',
            key: 'twitter:image-drugs'
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
            hid: 'twitter:card-drugs',
            key: 'twitter:card-drugs'
          }
        ]
      })
    }, { immediate: true })
  }
})

