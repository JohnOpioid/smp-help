export default defineNuxtPlugin({
  name: 'codifier-og-image',
  enforce: 'post', // Выполняется после всех других плагинов
  setup() {
    // Плагин работает только на клиенте для динамического обновления мета-тегов
    // На сервере мета-теги устанавливаются в pages/codifier/[url].vue
    if (process.server) return
    
    const route = useRoute()
    
    // Получаем абсолютный URL
    const baseUrl = `${window.location.protocol}//${window.location.host}`
    
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
    
    // Устанавливаем явный meta тег для og:image (реактивно обновляется)
    // useHead в Nuxt 3 автоматически отслеживает реактивные значения
    useHead({
      meta: [
        { 
          property: 'og:image', 
          content: ogImageUrl,
          hid: 'og:image-codifier',
          key: 'og:image-codifier'
        },
        { 
          property: 'og:image:secure_url', 
          content: ogImageUrl,
          hid: 'og:image:secure_url-codifier',
          key: 'og:image:secure_url-codifier'
        },
        { 
          property: 'og:image:width',
          content: '900',
          hid: 'og:image:width-codifier',
          key: 'og:image:width-codifier'
        },
        { 
          property: 'og:image:height',
          content: '600',
          hid: 'og:image:height-codifier',
          key: 'og:image:height-codifier'
        },
        { 
          property: 'og:image:type',
          content: 'image/png',
          hid: 'og:image:type-codifier',
          key: 'og:image:type-codifier'
        },
        { 
          name: 'twitter:image', 
          content: ogImageUrl,
          hid: 'twitter:image-codifier',
          key: 'twitter:image-codifier'
        }
      ],
      link: [
        { rel: 'image_src', href: ogImageUrl, key: 'image_src' }
      ]
    })
  }
})

