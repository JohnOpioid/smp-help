import { ref, computed } from 'vue'

const SEARCH_HISTORY_KEY = 'smp-help-search-history'
const MAX_HISTORY_ITEMS = 10

// Реактивное состояние истории поисков
const searchHistory = ref<string[]>([])

// Загружаем историю из localStorage при инициализации
if (process.client) {
  try {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY)
    if (saved) {
      searchHistory.value = JSON.parse(saved)
    }
  } catch (error) {
    console.warn('Не удалось загрузить историю поисков:', error)
    searchHistory.value = []
  }
}

export const useSearchHistory = () => {
  // Добавляем запрос в историю
  const addToHistory = (query: string) => {
    if (!query || query.trim().length === 0) return
    
    const trimmedQuery = query.trim()
    
    // Удаляем дубликаты
    const filteredHistory = searchHistory.value.filter(item => item !== trimmedQuery)
    
    // Добавляем в начало
    filteredHistory.unshift(trimmedQuery)
    
    // Ограничиваем количество элементов
    searchHistory.value = filteredHistory.slice(0, MAX_HISTORY_ITEMS)
    
    // Сохраняем в localStorage
    if (process.client) {
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
      } catch (error) {
        console.warn('Не удалось сохранить историю поисков:', error)
      }
    }
  }
  
  // Очищаем историю
  const clearHistory = () => {
    searchHistory.value = []
    if (process.client) {
      try {
        localStorage.removeItem(SEARCH_HISTORY_KEY)
      } catch (error) {
        console.warn('Не удалось очистить историю поисков:', error)
      }
    }
  }
  
  // Удаляем конкретный элемент из истории
  const removeFromHistory = (query: string) => {
    searchHistory.value = searchHistory.value.filter(item => item !== query)
    if (process.client) {
      try {
        localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory.value))
      } catch (error) {
        console.warn('Не удалось обновить историю поисков:', error)
      }
    }
  }
  
  // Получаем историю (только для чтения)
  const getHistory = computed(() => searchHistory.value)
  
  return {
    searchHistory: getHistory,
    addToHistory,
    clearHistory,
    removeFromHistory
  }
}
