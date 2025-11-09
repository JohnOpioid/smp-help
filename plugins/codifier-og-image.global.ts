export default defineNuxtPlugin({
  name: 'codifier-og-image',
  enforce: 'post', // Выполняется после всех других плагинов
  setup() {
    const route = useRoute()
    
    // Получаем абсолютный URL (вызываем composables в правильном контексте)
    let baseUrl: string
    if (process.server) {
      const headers = useRequestHeaders()
      const host = headers.host || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      baseUrl = `${protocol}://${host}`
    } else if (process.client) {
      baseUrl = `${window.location.protocol}//${window.location.host}`
    } else {
      baseUrl = process.env.NODE_ENV === 'production' ? 'https://smp-help.ru' : 'http://localhost:3000'
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
    
    // Устанавливаем явный meta тег для og:image (реактивно обновляется)
    // useHead в Nuxt 3 автоматически отслеживает реактивные значения
    useHead({
      meta: [
        { 
          property: 'og:image', 
          content: ogImageUrl,
          hid: 'og:image',
          key: 'og:image'
        },
        { 
          property: 'og:image:secure_url', 
          content: ogImageUrl,
          hid: 'og:image:secure_url',
          key: 'og:image:secure_url'
        },
        { 
          name: 'twitter:image', 
          content: ogImageUrl,
          hid: 'twitter:image',
          key: 'twitter:image'
        }
      ],
      link: [
        { rel: 'image_src', href: ogImageUrl, key: 'image_src' }
      ]
    })
  }
})

