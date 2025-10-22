// plugins/fetch.client.ts
export default defineNuxtPlugin(() => {
  const runtimeConfig = useRuntimeConfig()
  
  // Определяем базовый URL для API
  const getApiUrl = () => {
    if (process.client) {
      // Проверяем через Capacitor API
      try {
        // @ts-ignore
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          // В Android приложении всегда используем HTTPS API
          return 'https://helpsmp.ru'
        }
      } catch (e) {
        // Capacitor API не доступен
      }
      
      // Fallback: проверяем hostname для определения среды
      const hostname = window.location.hostname
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
      const isLocalNetwork = hostname.startsWith('192.168.') || hostname.startsWith('10.0.') || hostname.startsWith('172.')
      
      if (isLocalhost || isLocalNetwork) {
        // Локальная сеть - используем локальный API
        return `http://${hostname}:3000`
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

