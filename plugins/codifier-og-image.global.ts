export default defineNuxtPlugin({
  name: 'codifier-og-image',
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
    
    // Функция для получения правильного URL изображения
    const getOgImageUrl = () => {
      const path = route.path || '/'
      const queryId = route.query.id as string | undefined
      
      // Для страниц кодификатора с id используем индивидуальный endpoint
      // Проверяем более строго: путь должен начинаться с /codifier и должен быть query.id
      if (path.startsWith('/codifier') && queryId && queryId.trim().length > 0) {
        // Проверяем, что id выглядит как валидный MongoDB ObjectId (24 символа hex)
        const itemId = queryId.trim()
        if (itemId.length >= 20) { // Минимальная длина для ObjectId
          return `${baseUrl}/api/codifier/og-image/${itemId}?v=${itemId}`
        }
      }
      
      // Для всех остальных страниц используем общий endpoint
      const v = path.replace(/\//g, '_') || 'home'
      return `${baseUrl}/api/og-image/page?path=${encodeURIComponent(path)}&v=${v}`
    }
    
    // Вычисляем URL реактивно (без вызова composables внутри)
    const ogImageUrl = computed(() => getOgImageUrl())
    const path = computed(() => route.path || '/')
    
    // Устанавливаем мета-теги только для страниц кодификатора
    // Используем стандартные hid для перезаписи автоматически установленных мета-тегов
    watch([ogImageUrl, path], ([url, currentPath]) => {
      // Устанавливаем мета-теги только для страниц кодификатора и когда URL готов
      if (!currentPath.startsWith('/codifier') || !url) {
        return
      }
      
      // Устанавливаем мета-теги с стандартными hid для перезаписи
      useHead({
        meta: [
          { 
            property: 'og:image', 
            content: url,
            hid: 'og:image', // Стандартный hid для перезаписи
            key: 'og:image-codifier'
          },
          { 
            property: 'og:image:secure_url', 
            content: url,
            hid: 'og:image:secure_url', // Стандартный hid для перезаписи
            key: 'og:image:secure_url-codifier'
          },
          { 
            property: 'og:image:width',
            content: '900',
            hid: 'og:image:width',
            key: 'og:image:width-codifier'
          },
          { 
            property: 'og:image:height',
            content: '600',
            hid: 'og:image:height',
            key: 'og:image:height-codifier'
          },
          { 
            property: 'og:image:type',
            content: 'image/png',
            hid: 'og:image:type',
            key: 'og:image:type-codifier'
          },
          { 
            name: 'twitter:image', 
            content: url,
            hid: 'twitter:image', // Стандартный hid для перезаписи
            key: 'twitter:image-codifier'
          },
          {
            name: 'twitter:card',
            content: 'summary_large_image',
            hid: 'twitter:card',
            key: 'twitter:card-codifier'
          }
        ],
        link: [
          { rel: 'image_src', href: url, key: 'image_src', hid: 'image_src' } // Стандартный key и hid для перезаписи
        ]
      })
    }, { immediate: true })
  }
})

