<template>
  <UApp>
    <NuxtRouteAnnouncer />
    
    <!-- Индикатор офлайн режима -->
    <ClientOnly>
      <OfflineIndicator />
    </ClientOnly>
    
    <!-- Менеджер кеша -->
    <ClientOnly>
      <CacheManager />
    </ClientOnly>
    
    <!-- Скелетон шапки (только при принудительном обновлении) -->
    <div v-if="isInitialLoading" class="fixed inset-0 bg-white dark:bg-slate-900 z-50 flex flex-col">
      <!-- Хедер скелетон -->
      <div class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <USkeleton class="h-8 w-8 rounded" />
            <USkeleton class="h-6 w-48" />
          </div>
          <div class="flex items-center space-x-4">
            <USkeleton class="h-8 w-8 rounded-full" />
          </div>
        </div>
      </div>
      
      <!-- Контент скелетон -->
      <div class="flex-1 p-4">
        <div class="max-w-5xl mx-auto space-y-6">
          <!-- Хлебные крошки -->
          <div class="flex items-center space-x-2">
            <USkeleton class="h-4 w-16" />
            <USkeleton class="h-4 w-4" />
            <USkeleton class="h-4 w-24" />
          </div>
          
          <!-- Основной контент -->
          <div class="space-y-4">
            <USkeleton class="h-8 w-1/3" />
            <USkeleton class="h-4 w-2/3" />
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <USkeleton class="h-32 w-full" />
              <USkeleton class="h-32 w-full" />
              <USkeleton class="h-32 w-full" />
            </div>
            <div class="space-y-2">
              <USkeleton class="h-20 w-full" />
              <USkeleton class="h-20 w-full" />
              <USkeleton class="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup lang="ts">
// Состояние загрузки при принудительном обновлении (только шапка)
const isInitialLoading = ref(true)

// Состояние загрузки контента при навигации
const isContentLoading = ref(false)

// Предоставляем состояния загрузки для дочерних компонентов
provide('isInitialLoading', isInitialLoading)
provide('isContentLoading', isContentLoading)

// Скрываем скелетон шапки после первоначальной загрузки
onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      isInitialLoading.value = false
    }, 500)
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
