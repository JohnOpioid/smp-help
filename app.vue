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

// Предоставляем состояния загрузки для дочерних компонентов
provide('isInitialLoading', isInitialLoading)
provide('isContentLoading', isContentLoading)

// Скрываем скелетоны сразу после первой отрисовки без искусственной задержки
onMounted(() => {
  isMounted.value = true
  requestAnimationFrame(() => {
    isInitialLoading.value = false
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
