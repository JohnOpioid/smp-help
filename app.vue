<template>
  <UApp>
    <NuxtRouteAnnouncer />
    
    <!-- Индикатор офлайн режима -->
    <ClientOnly>
      <OfflineIndicator />
      <template #fallback>
        <span></span>
      </template>
    </ClientOnly>
    
    <!-- Менеджер кеша -->
    <ClientOnly>
      <CacheManager />
      <template #fallback>
        <span></span>
      </template>
    </ClientOnly>
    
    <!-- Удален глобальный оверлей-скелетон: за загрузку отвечают лейауты -->
    
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Состояние загрузки при принудительном обновлении (только шапка)
const isInitialLoading = ref(true)
const isMounted = ref(false)

// Состояние загрузки контента при навигации
const isContentLoading = ref(false)

// Проверяем, является ли это принудительным обновлением
const isPageRefresh = ref(false)

// Предоставляем состояния загрузки для дочерних компонентов
provide('isInitialLoading', isInitialLoading)
provide('isContentLoading', isContentLoading)

// Проверяем принудительное обновление
if (process.client) {
  // Проверяем, была ли страница обновлена принудительно
  const navigationEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[]
  if (navigationEntries.length > 0) {
    const navEntry = navigationEntries[0]
    isPageRefresh.value = navEntry.type === 'reload'
    console.log('Page refresh detected:', isPageRefresh.value)
  }
  
  // Дополнительная проверка через sessionStorage
  const wasRefreshed = sessionStorage.getItem('page-refreshed')
  if (wasRefreshed) {
    isPageRefresh.value = true
    sessionStorage.removeItem('page-refreshed')
    console.log('Page refresh detected via sessionStorage')
  }
  
  // Отслеживаем принудительное обновление
  window.addEventListener('beforeunload', () => {
    sessionStorage.setItem('page-refreshed', 'true')
  })
}

// Скрываем скелетоны после загрузки данных
onMounted(() => {
  isMounted.value = true
  
  // Небольшая задержка для стабильности
  nextTick(() => {
    if (isPageRefresh.value) {
      // При принудительном обновлении показываем скелетон дольше
      console.log('Showing skeleton for page refresh')
      setTimeout(() => {
        isInitialLoading.value = false
      }, 1000) // 1000ms для принудительного обновления
    } else {
      // При обычной навигации скрываем быстрее
      setTimeout(() => {
        isInitialLoading.value = false
      }, 300) // 300ms для обычной навигации
    }
  })
})

// Следим за изменениями маршрута (только контент)
const router = useRouter()
router.beforeEach(() => {
  isContentLoading.value = true
})

router.afterEach(() => {
  nextTick(() => {
    setTimeout(() => {
      isContentLoading.value = false
    }, 200)
  })
})
</script>
