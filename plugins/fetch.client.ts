// plugins/fetch.client.ts
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  
  // Определяем базовый URL для API
  const getApiUrl = () => {
    if (process.client) {
      // Проверяем hostname для определения среды
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      
      if (isLocalhost) {
        // Localhost (Capacitor) - используем IP хоста с HTTP
        return 'http://192.168.1.40:3000'
      } else {
        // Продакшен - используем helpsmp.ru
        return 'https://helpsmp.ru'
      }
    }
    return runtimeConfig.public.apiUrl || '/api'
  }

  const apiUrl = getApiUrl()
  
  console.log('🔧 Fetch plugin: API URL =', apiUrl)
  
  // Простой кэш для GET запросов
  const cache = new Map<string, { data: any, timestamp: number }>()
  const CACHE_DURATION = 5 * 60 * 1000 // 5 минут
  
  // Настраиваем глобальные опции для $fetch
  const globalThis = typeof window !== 'undefined' ? window : global
  const originalFetch = (globalThis as any).$fetch || $fetch
  
  // Переопределяем $fetch, чтобы добавить базовый URL и кэширование
  ;(globalThis as any).$fetch = (url: string, options?: any) => {
    // Если URL начинается с /api, добавляем базовый URL
    if (typeof url === 'string' && url.startsWith('/api')) {
      const fullUrl = `${apiUrl}${url}`
      
      // Кэширование для GET запросов
      if (!options || options.method === 'GET' || !options.method) {
        const cacheKey = `${fullUrl}${options?.query ? JSON.stringify(options.query) : ''}`
        const cached = cache.get(cacheKey)
        
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
          console.log(`💾 Cache hit: ${url}`)
          return Promise.resolve(cached.data)
        }
        
        console.log(`📡 Fetch: ${url} -> ${fullUrl}`)
        
        return originalFetch(fullUrl, options).then((data: any) => {
          // Сохраняем в кэш
          cache.set(cacheKey, { data, timestamp: Date.now() })
          return data
        })
      }
      
      console.log(`📡 Fetch: ${url} -> ${fullUrl}`)
      return originalFetch(fullUrl, options)
    }
    return originalFetch(url, options)
  }
  
  // Очистка кэша при изменении страницы
  if (process.client) {
    const clearCache = () => {
      cache.clear()
      console.log('🧹 Cache cleared')
    }
    
    // Очищаем кэш каждые 10 минут
    setInterval(clearCache, 10 * 60 * 1000)
  }
})

