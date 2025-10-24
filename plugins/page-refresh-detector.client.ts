export default defineNuxtPlugin(() => {
  if (process.client) {
    // Проверяем, является ли это принудительным обновлением
    const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
    let isPageRefresh = false
    
    if (navigationEntries.length > 0) {
      const navEntry = navigationEntries[0]
      isPageRefresh = navEntry.type === 'reload'
    }
    
    // Дополнительная проверка через sessionStorage
    const wasRefreshed = sessionStorage.getItem('page-refreshed')
    if (wasRefreshed) {
      isPageRefresh = true
      sessionStorage.removeItem('page-refreshed')
    }
    
    // Если это принудительное обновление, показываем скелетон сразу
    if (isPageRefresh) {
      console.log('Page refresh detected, showing skeleton immediately')
      // Устанавливаем состояние загрузки в true сразу
      const isInitialLoading = inject('isInitialLoading', ref(true))
      isInitialLoading.value = true
    }
    
    // Отслеживаем принудительное обновление для следующего раза
    window.addEventListener('beforeunload', () => {
      sessionStorage.setItem('page-refreshed', 'true')
    })
  }
})
