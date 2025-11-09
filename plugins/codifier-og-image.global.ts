export default defineNuxtPlugin({
  name: 'codifier-og-image',
  enforce: 'post', // Выполняется после всех других плагинов
  setup() {
    const route = useRoute()
    
    // Получаем абсолютный URL
    const getBaseUrl = () => {
      if (process.server) {
        const headers = useRequestHeaders()
        const host = headers.host || 'localhost:3000'
        const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
        return `${protocol}://${host}`
      }
      if (process.client) {
        return `${window.location.protocol}//${window.location.host}`
      }
      return process.env.NODE_ENV === 'production' ? 'https://smp-help.ru' : 'http://localhost:3000'
    }
    
    const baseUrl = getBaseUrl()
    let ogImageUrl: string
    
    // Проверяем, что мы на странице кодификатора с id
    if (route.path.startsWith('/codifier') && route.query.id) {
      const itemId = route.query.id as string
      ogImageUrl = `${baseUrl}/api/codifier/og-image/${itemId}?v=${itemId}`
    } else {
      // Для всех остальных страниц используем общий endpoint
      const path = route.path || '/'
      const v = path.replace(/\//g, '_') || 'home'
      ogImageUrl = `${baseUrl}/api/og-image/page?path=${encodeURIComponent(path)}&v=${v}`
    }
    
    // Устанавливаем явный meta тег для og:image (один вариант для всех страниц)
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

