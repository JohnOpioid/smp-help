// Глобальное состояние поиска
const globalState = {
  isSearchActive: ref(false),
  searchQuery: ref(''),
  searchResults: ref<any[]>([]),
  isSearching: ref(false),
  isDataFromCache: ref(false),
  groupedResults: ref<Record<string, any[]>>({
    mkb: [],
    ls: [],
    algorithm: [],
    drug: [],
    substation: []
  }),
  orderedSections: ref<string[]>([]),
  currentPageContext: ref<string>(''),
  searchTimeout: ref<NodeJS.Timeout | null>(null)
}

// Composable для управления глобальным состоянием поиска
export const useGlobalSearch = () => {
  // Определяем контекст текущей страницы
  const updatePageContext = () => {
    const route = useRoute()
    const path = route.path
    
    if (path.startsWith('/algorithms')) {
      globalState.currentPageContext.value = 'algorithm'
    } else if (path.startsWith('/codifier')) {
      globalState.currentPageContext.value = 'mkb'
    } else if (path.startsWith('/local-statuses')) {
      globalState.currentPageContext.value = 'ls'
    } else if (path.startsWith('/drugs')) {
      globalState.currentPageContext.value = 'drug'
    } else if (path.startsWith('/substations')) {
      globalState.currentPageContext.value = 'substation'
    } else if (path.startsWith('/calculators')) {
      globalState.currentPageContext.value = 'algorithm' // Калькуляторы связаны с алгоритмами
    } else {
      globalState.currentPageContext.value = 'general' // Общий поиск
    }
  }

  // Приоритизируем результаты в зависимости от контекста страницы
  const prioritizeResults = (grouped: Record<string, any[]>) => {
    // Проверяем, что grouped существует и является объектом
    if (!grouped || typeof grouped !== 'object') {
      return {
        mkb: [],
        ls: [],
        algorithm: [],
        drug: [],
        substation: []
      }
    }
    
    const context = globalState.currentPageContext.value
    const prioritized: Record<string, any[]> = {}
    
    // Определяем порядок групп в зависимости от контекста
    let groupOrder: string[] = []
    
    switch (context) {
      case 'algorithm':
        groupOrder = ['algorithm', 'mkb', 'ls', 'drug', 'substation']
        break
      case 'mkb':
        groupOrder = ['mkb', 'algorithm', 'ls', 'drug', 'substation']
        break
      case 'ls':
        groupOrder = ['ls', 'mkb', 'algorithm', 'drug', 'substation']
        break
      case 'drug':
        groupOrder = ['drug', 'algorithm', 'mkb', 'ls', 'substation']
        break
      case 'substation':
        groupOrder = ['substation', 'mkb', 'ls', 'algorithm', 'drug']
        break
      default:
        groupOrder = ['mkb', 'algorithm', 'ls', 'drug', 'substation']
    }
    
    // Переупорядочиваем группы согласно приоритету
    groupOrder.forEach(groupName => {
      if (grouped[groupName] && grouped[groupName].length > 0) {
        prioritized[groupName] = grouped[groupName]
      }
    })
    
    return prioritized
  }

  const activateSearch = (query: string = '') => {
    // Проверяем, что мы на клиенте
    if (!process.client) return
    
    updatePageContext() // Обновляем контекст при активации поиска
    globalState.isSearchActive.value = true
    globalState.searchQuery.value = query
    
    // Если есть запрос, пытаемся загрузить результаты из кэша
    if (query && query.length >= 3) {
      const cachedData = loadSearchCache(query)
      if (cachedData) {
        // Загружаем данные из кэша
        globalState.searchResults.value = cachedData.results
        globalState.groupedResults.value = cachedData.grouped
        globalState.orderedSections.value = cachedData.orderedSections
        globalState.isDataFromCache.value = true
        globalState.isSearching.value = false
        return // Не выполняем новый поиск, используем кэш
      }
    }
    
    // Если кэша нет или запрос короткий, сбрасываем флаг кэша
    globalState.isDataFromCache.value = false
  }

  const deactivateSearch = () => {
    // Проверяем, что мы на клиенте
    if (!process.client) return
    
    globalState.isSearchActive.value = false
    globalState.searchQuery.value = ''
    globalState.searchResults.value = []
    globalState.isSearching.value = false
    globalState.groupedResults.value = {
      mkb: [],
      ls: [],
      algorithm: [],
      drug: [],
      substation: []
    }
    globalState.orderedSections.value = []
  }

  // Сохраняем результаты поиска в localStorage
  const saveSearchCache = (query: string, results: any[], grouped: Record<string, any[]>, orderedSections: string[]) => {
    if (!process.client) return
    
    try {
      const cacheData = {
        query,
        results,
        grouped,
        orderedSections,
        timestamp: Date.now()
      }
      localStorage.setItem('searchCache', JSON.stringify(cacheData))
    } catch (error) {
      // Игнорируем ошибки localStorage
    }
  }

  // Загружаем результаты поиска из localStorage
  const loadSearchCache = (query: string) => {
    if (!process.client) return null
    
    try {
      const cached = localStorage.getItem('searchCache')
      if (!cached) return null
      
      const cacheData = JSON.parse(cached)
      
      // Проверяем, что кэш соответствует текущему запросу
      if (cacheData.query !== query) return null
      
      // Проверяем, что кэш не старше 3 часов
      const maxAge = 3 * 60 * 60 * 1000 // 3 часа
      if (Date.now() - cacheData.timestamp > maxAge) return null
      
      return cacheData
    } catch (error) {
      return null
    }
  }

  const hideSearch = () => {
    // Проверяем, что мы на клиенте
    if (!process.client) return
    
    // Сохраняем текущие результаты в кэш перед скрытием
    if (globalState.searchQuery.value && globalState.searchResults.value.length > 0) {
      saveSearchCache(
        globalState.searchQuery.value,
        globalState.searchResults.value,
        globalState.groupedResults.value,
        globalState.orderedSections.value
      )
    }
    
    // Скрываем поиск, но НЕ очищаем инпут
    globalState.isSearchActive.value = false
    globalState.searchResults.value = []
    globalState.isSearching.value = false
    globalState.groupedResults.value = {
      mkb: [],
      ls: [],
      algorithm: [],
      drug: [],
      substation: []
    }
    globalState.orderedSections.value = []
    // НЕ очищаем globalState.searchQuery.value - оставляем текст в инпуте
  }

  const updateSearchResults = (results: any[], grouped: Record<string, any[]>, orderedSections?: string[]) => {
    // Проверяем, что мы на клиенте
    if (!process.client) return
    
    globalState.searchResults.value = results
    // Применяем приоритизацию к сгруппированным результатам
    globalState.groupedResults.value = prioritizeResults(grouped)
    
    // Сохраняем порядок разделов с сервера
    if (orderedSections) {
      globalState.orderedSections.value = orderedSections
      // Логирование отключено для производительности
      // console.log('🔍 Обновлен порядок разделов с сервера:', orderedSections)
    } else {
      // console.log('⚠️ orderedSections не получен с сервера')
    }
  }

  const updateSearching = (searching: boolean) => {
    globalState.isSearching.value = searching
  }

  const updateCacheStatus = (fromCache: boolean) => {
    globalState.isDataFromCache.value = fromCache
  }

  const updateSearchQuery = (query: string) => {
    globalState.searchQuery.value = query
  }

  // Серверный поиск с дебаунсом
  const performServerSearch = async (query: string, debounceMs: number = 300) => {
    // Проверяем, что мы на клиенте
    if (!process.client) return

    // Очищаем предыдущий таймер
    if (globalState.searchTimeout.value) {
      clearTimeout(globalState.searchTimeout.value)
    }

    // Если запрос слишком короткий, очищаем результаты и сбрасываем флаг поиска
    if (!query || query.trim().length < 3) {
      globalState.searchResults.value = []
      globalState.groupedResults.value = {
        mkb: [],
        ls: [],
        algorithm: [],
        drug: [],
        substation: []
      }
      globalState.isSearching.value = false
      return
    }

    // Устанавливаем флаг поиска
    globalState.isSearching.value = true

    // Если дебаунс равен 0, выполняем поиск сразу
    if (debounceMs === 0) {
      await executeSearch(query)
      return
    }

    // Создаем новый таймер с дебаунсом
    globalState.searchTimeout.value = setTimeout(async () => {
      await executeSearch(query)
    }, debounceMs)
  }

  // Выполнение поиска
  const executeSearch = async (query: string) => {
    // Логирование отключено для производительности
    // console.log('🔍 executeSearch started with query:', query)
    try {
      // console.log('🔍 Sending request to /api/search/query')
      const response = await $fetch('/api/search/query', {
        method: 'POST',
        body: {
          query: query.trim(),
          limit: 50
        }
      })
      
      // console.log('🔍 Response received:', response)

      if (response.success) {
        // Используем функцию updateSearchResults для правильной обработки данных
        updateSearchResults(
          response.results || [], 
          response.groupedResults || {
            mkb: [],
            ls: [],
            algorithm: [],
            drug: [],
            substation: []
          },
          response.orderedSections || []
        )
        globalState.isDataFromCache.value = false // Серверный поиск не использует кеш
        
        // Добавляем в историю поиска только если есть результаты
        if (response.results && response.results.length > 0) {
          const searchHistoryModule = await import('./useSearchHistory')
          const { addToHistory } = searchHistoryModule.useSearchHistory()
          addToHistory(query.trim())
        }
      } else {
        console.error('Ошибка серверного поиска:', response.error)
        updateSearchResults([], {
          mkb: [],
          ls: [],
          algorithm: [],
          drug: [],
          substation: []
        }, [])
      }
    } catch (error) {
      console.error('🔍 Ошибка при выполнении серверного поиска:', error)
      updateSearchResults([], {
        mkb: [],
        ls: [],
        algorithm: [],
        drug: [],
        substation: []
      }, [])
    } finally {
      globalState.isSearching.value = false
    }
  }

  // Очистка таймера поиска
  const clearSearchTimeout = () => {
    if (globalState.searchTimeout.value) {
      clearTimeout(globalState.searchTimeout.value)
      globalState.searchTimeout.value = null
    }
  }

  const selectSearchResult = (result: any) => {
    let url = ''
    
    switch (result.type) {
      case 'algorithm':
        url = `/algorithms/${result.section?.url || result.section}/${result.category?.url || result.category}/${result._id}`
        break
      case 'mkb':
        url = `/codifier/${result.url || result._id}`
        break
      case 'ls':
        url = `/local-statuses/${result.url || result._id}`
        break
      case 'drug':
        url = `/drugs?id=${result._id}`
        break
      case 'substation':
        url = `/substations?select=${encodeURIComponent(result.name)}`
        break
    }
    
    if (url) {
      deactivateSearch()
      navigateTo(url)
    }
  }

  return {
    isSearchActive: globalState.isSearchActive,
    searchQuery: globalState.searchQuery,
    searchResults: globalState.searchResults,
    isSearching: globalState.isSearching,
    isDataFromCache: globalState.isDataFromCache,
    groupedResults: globalState.groupedResults,
    orderedSections: globalState.orderedSections,
    currentPageContext: globalState.currentPageContext,
    activateSearch,
    deactivateSearch,
    hideSearch,
    saveSearchCache,
    loadSearchCache,
    updateSearchResults,
    updateSearching,
    updateCacheStatus,
    updateSearchQuery,
    selectSearchResult,
    updatePageContext,
    prioritizeResults,
    performServerSearch,
    clearSearchTimeout
  }
}
