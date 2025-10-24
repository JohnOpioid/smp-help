/**
 * Composable для кеширования данных поиска
 * Сохраняет загруженные данные в localStorage для ускорения последующих поисков
 */

export interface CachedSearchData {
  data: any[]
  timestamp: number
  version: string
  totalItems: number
}

export interface CacheStats {
  hits: number
  misses: number
  lastUpdated: number
  cacheSize: number
}

const CACHE_KEY = 'smp_search_cache'
const CACHE_VERSION = '1.1.0' // Увеличиваем версию для принудительного обновления
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000 // 7 дней в миллисекундах (увеличиваем время жизни кеша)
const STATS_KEY = 'smp_search_cache_stats'

export const useSearchCache = () => {
  // Получаем статистику кеша
  const getCacheStats = (): CacheStats => {
    if (!process.client) {
      return { hits: 0, misses: 0, lastUpdated: 0, cacheSize: 0 }
    }
    
    try {
      const stats = localStorage.getItem(STATS_KEY)
      return stats ? JSON.parse(stats) : { hits: 0, misses: 0, lastUpdated: 0, cacheSize: 0 }
    } catch {
      return { hits: 0, misses: 0, lastUpdated: 0, cacheSize: 0 }
    }
  }

  // Обновляем статистику кеша
  const updateCacheStats = (isHit: boolean) => {
    if (!process.client) return
    
    try {
      const stats = getCacheStats()
      if (isHit) {
        stats.hits++
      } else {
        stats.misses++
      }
      stats.lastUpdated = Date.now()
      
      localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    } catch (error) {
      console.warn('Не удалось обновить статистику кеша:', error)
    }
  }

  // Проверяем, действителен ли кеш
  const isCacheValid = (cachedData: CachedSearchData): boolean => {
    if (!cachedData) return false
    
    // Проверяем версию кеша
    if (cachedData.version !== CACHE_VERSION) {
      return false
    }
    
    // Проверяем время истечения
    const now = Date.now()
    const cacheAge = now - cachedData.timestamp
    
    if (cacheAge > CACHE_EXPIRY) {
      return false
    }
    
    return true
  }

  // Получаем данные из кеша
  const getCachedData = (): CachedSearchData | null => {
    if (!process.client) return null
    
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) {
        updateCacheStats(false)
        return null
      }
      
      const cachedData: CachedSearchData = JSON.parse(cached)
      
      if (!isCacheValid(cachedData)) {
        clearCache()
        updateCacheStats(false)
        return null
      }
      
      updateCacheStats(true)
      return cachedData
    } catch (error) {
      console.warn('Ошибка при чтении кеша:', error)
      updateCacheStats(false)
      return null
    }
  }

  // Сохраняем данные в кеш
  const setCachedData = (data: any[], totalItems: number) => {
    if (!process.client) return
    
    try {
      const cachedData: CachedSearchData = {
        data,
        timestamp: Date.now(),
        version: CACHE_VERSION,
        totalItems
      }
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cachedData))
      
      // Обновляем размер кеша в статистике
      const stats = getCacheStats()
      stats.cacheSize = JSON.stringify(cachedData).length
      localStorage.setItem(STATS_KEY, JSON.stringify(stats))
    } catch (error) {
      console.warn('Ошибка при сохранении в кеш:', error)
    }
  }

  // Очищаем кеш
  const clearCache = () => {
    if (!process.client) return
    
    try {
      localStorage.removeItem(CACHE_KEY)
    } catch (error) {
      console.warn('Ошибка при очистке кеша:', error)
    }
  }

  // Получаем информацию о кеше
  const getCacheInfo = () => {
    if (!process.client) {
      return {
        isAvailable: false,
        stats: getCacheStats(),
        cachedData: null
      }
    }
    
    const cachedData = getCachedData()
    const stats = getCacheStats()
    
    return {
      isAvailable: true,
      stats,
      cachedData,
      hitRate: stats.hits + stats.misses > 0 ? (stats.hits / (stats.hits + stats.misses) * 100).toFixed(1) : '0.0'
    }
  }

  // Принудительно обновляем кеш
  const refreshCache = async () => {
    if (!process.client) return null
    
    // Принудительное обновление кеша
    
    try {
      const response = await $fetch('/api/search/all-data')
      
      if (response.success && response.data) {
        // Преобразуем данные из API в плоский массив
        const allItems = []
        
        if (response.data.localStatuses?.items) {
          allItems.push(...response.data.localStatuses.items.map((item: any) => ({ ...item, type: 'ls' })))
        }
        if (response.data.mkbCodes?.items) {
          allItems.push(...response.data.mkbCodes.items.map((item: any) => ({ ...item, type: 'mkb' })))
        }
        if (response.data.algorithms?.items) {
          allItems.push(...response.data.algorithms.items.map((item: any) => ({ ...item, type: 'algorithm' })))
        }
        if (response.data.drugs?.items) {
          allItems.push(...response.data.drugs.items.map((item: any) => ({ ...item, type: 'drug' })))
        }
        if (response.data.substations?.items) {
          allItems.push(...response.data.substations.items.map((item: any) => ({ ...item, type: 'substation' })))
        }
        
        setCachedData(allItems, response.totalItems || allItems.length)
        return allItems
      }
      
      return null
    } catch (error) {
      console.error('Ошибка при обновлении кеша:', error)
      return null
    }
  }

  // Получаем данные с автоматическим кешированием
  const getSearchData = async (forceRefresh = false) => {
    if (!process.client) return null
    
    // Если принудительное обновление, сразу загружаем из API
    if (forceRefresh) {
      return await refreshCache()
    }
    
    // Сначала пытаемся получить из кеша
    const cachedData = getCachedData()
    if (cachedData) {
      return cachedData.data
    }
    
    // Если кеш пуст или недействителен, загружаем из API
    try {
      // Упрощенная проверка (без Capacitor)
      const isAndroidApp = false // Временно отключено для производительности
      
      const response = await $fetch('/api/search/all-data')
      
      if (response.success && response.data) {
        // Преобразуем данные из API в плоский массив
        const allItems = []
        
        if (response.data.localStatuses?.items) {
          allItems.push(...response.data.localStatuses.items.map((item: any) => ({ ...item, type: 'ls' })))
        }
        if (response.data.mkbCodes?.items) {
          allItems.push(...response.data.mkbCodes.items.map((item: any) => ({ ...item, type: 'mkb' })))
        }
        if (response.data.algorithms?.items) {
          allItems.push(...response.data.algorithms.items.map((item: any) => ({ ...item, type: 'algorithm' })))
        }
        if (response.data.drugs?.items) {
          allItems.push(...response.data.drugs.items.map((item: any) => ({ ...item, type: 'drug' })))
        }
        if (response.data.substations?.items) {
          allItems.push(...response.data.substations.items.map((item: any) => ({ ...item, type: 'substation' })))
        }
        
        setCachedData(allItems, response.totalItems || allItems.length)
        return allItems
      }
      
      return null
    } catch (error) {
      console.error('❌ Ошибка при загрузке данных:', error)
      
      // Fallback убран для производительности
      
      return null
    }
  }

  // Функция для принудительной предзагрузки данных
  const preloadData = async () => {
    if (!process.client) return null
    
    // Принудительная предзагрузка данных поиска
    
    try {
      // Проверяем, есть ли уже данные в кеше
      const cachedData = getCachedData()
      if (cachedData && cachedData.data && cachedData.data.length > 0) {
        return cachedData.data
      }
      
      // Загружаем данные
      const data = await getSearchData(true) // Принудительное обновление
      
      if (data && Array.isArray(data) && data.length > 0) {
        return data
      } else {
        console.warn('⚠️ Предзагрузка не удалась - данные пусты')
        return null
      }
    } catch (error) {
      console.error('❌ Ошибка при предзагрузке данных:', error)
      return null
    }
  }

  return {
    getCachedData,
    setCachedData,
    clearCache,
    getCacheInfo,
    refreshCache,
    getSearchData,
    getCacheStats,
    updateCacheStats,
    preloadData
  }
}

