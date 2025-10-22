// composables/useLocalData.ts
export function useLocalData() {
  const { $localDB } = useNuxtApp()
  const { isOnline } = useNetworkStatus()
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

  // Чтение данных с кэшированием
  async function getData<T = any>(
    collection: string, 
    query: any = {},
    options: { useCache?: boolean } = {}
  ): Promise<T[]> {
    const { useCache = true } = options

    // Если онлайн - загружаем с сервера и кэшируем
    if (isOnline.value) {
      try {
        const apiUrl = getApiUrl()
        const response = await $fetch(`${apiUrl}/api/${collection}`, {
          query
        })
        
        if (useCache && Array.isArray(response)) {
          // Кэшируем каждый документ
          for (const doc of response) {
            await $localDB.cacheDocument(collection, doc)
          }
        }
        
        return response
      } catch (error) {
        console.error(`Ошибка загрузки ${collection}:`, error)
        // При ошибке возвращаем кэш
        if (useCache) {
          return await $localDB.getCachedDocuments(collection)
        }
        throw error
      }
    }
    
    // Офлайн - возвращаем кэш
    if (useCache) {
      return await $localDB.getCachedDocuments(collection)
    }
    
    throw new Error('Нет подключения к интернету и кэш недоступен')
  }

  // Запись данных с офлайн-поддержкой
  async function saveData(
    collection: string, 
    data: any, 
    operation: 'insert' | 'update' | 'delete' = 'insert'
  ) {
    if (isOnline.value) {
      try {
        const method = operation === 'insert' ? 'POST' : 
                     operation === 'update' ? 'PUT' : 'DELETE'
        
        const apiUrl = getApiUrl()
        const response = await $fetch(`${apiUrl}/api/${collection}`, {
          method,
          body: data
        })
        
        // Обновляем кэш
        if (operation === 'insert' || operation === 'update') {
          await $localDB.cacheDocument(collection, response)
        }
        
        return { success: true, data: response }
      } catch (error) {
        console.error(`Ошибка сохранения в ${collection}:`, error)
        // При ошибке добавляем в очередь
        await $localDB.queueMutation(collection, operation, data)
        return { success: false, queued: true, error }
      }
    }
    
    // Офлайн - добавляем в очередь
    await $localDB.queueMutation(collection, operation, data)
    return { success: false, queued: true }
  }

  // Поиск в кэшированных данных
  async function searchInCache<T = any>(
    collection: string, 
    searchQuery: string, 
    fields: string[] = ['name', 'title', 'description']
  ): Promise<T[]> {
    const cachedDocs = await $localDB.getCachedDocuments(collection)
    
    return cachedDocs.filter(doc => {
      return fields.some(field => {
        const value = doc[field]
        return value && value.toString().toLowerCase().includes(searchQuery.toLowerCase())
      })
    })
  }

  // Очистка кэша
  async function clearCache(collection?: string) {
    if (collection) {
      await localDB.documents.where('collection').equals(collection).delete()
    } else {
      await localDB.documents.clear()
    }
  }

  // Получение статистики кэша
  async function getCacheStats() {
    const totalDocs = await localDB.documents.count()
    const collections = await localDB.documents
      .orderBy('collection')
      .uniqueKeys()
    
    const stats = {}
    for (const collection of collections) {
      stats[collection] = await localDB.documents
        .where('collection')
        .equals(collection)
        .count()
    }
    
    return {
      totalDocs,
      collections: stats
    }
  }

  return {
    getData,
    saveData,
    searchInCache,
    clearCache,
    getCacheStats
  }
}

