<template>
  <div :class="containerClass">
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="showBreadcrumbs" class="pt-6">
        <Breadcrumbs v-if="!isInitialLoading" />
        <BreadcrumbsSkeleton v-else />
      </div>
      
      <!-- Скелетон контента при навигации -->
      <div v-if="isContentLoading" class="max-w-5xl mx-auto px-0 md:px-4 py-8 space-y-4">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-2/3" />
        <div class="space-y-2">
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
        </div>
      </div>
      
      <!-- Основной контент -->
      <div v-else>
        <Suspense>
          <template #default>
            <slot />
          </template>
          <template #fallback>
            <div class="max-w-5xl mx-auto px-0 md:px-4 py-8 space-y-4">
              <USkeleton class="h-6 w-1/3" />
              <USkeleton class="h-4 w-2/3" />
              <div class="space-y-2">
                <USkeleton class="h-20 w-full" />
                <USkeleton class="h-20 w-full" />
                <USkeleton class="h-20 w-full" />
              </div>
            </div>
          </template>
        </Suspense>
      </div>
    </div>
    
    <!-- Футер сайта -->
    <AppFooter v-if="!isInitialLoading && route.path !== '/substations'" />
    <AppFooterSkeleton v-else-if="!isInitialLoading && route.path !== '/substations'" />

    <MobileNav v-if="!isInitialLoading" />
    
    <!-- Панель поиска с чат-ботом -->
    <BottomSearchPanel :is-open="isBottomSearchOpen" @close="closeBottomSearch" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const headerTitle = computed(() => (route.meta as any)?.headerTitle || 'Справочник СМП')

// Получаем состояния загрузки из app.vue через provide/inject
const isInitialLoading = inject('isInitialLoading', ref(false))
const isContentLoading = inject('isContentLoading', ref(false))

// Состояние панели поиска с чат-ботом
const isBottomSearchOpen = ref(false)

const closeBottomSearch = () => {
  isBottomSearchOpen.value = false
}

// Слушаем события от SearchBar для открытия панели поиска
onMounted(() => {
  const handleOpenBottomSearch = () => {
    isBottomSearchOpen.value = true
  }
  
  window.addEventListener('openBottomSearch', handleOpenBottomSearch)
  
  onUnmounted(() => {
    window.removeEventListener('openBottomSearch', handleOpenBottomSearch)
  })
})

// Динамический класс контейнера - h-screen только для страницы substations
const containerClass = computed(() => {
  const baseClasses = 'bg-slate-50/25 dark:bg-slate-900 transition-colors duration-300 flex flex-col'
  const heightClass = route.path === '/substations' ? 'h-screen' : 'min-h-screen'
  return `${heightClass} ${baseClasses}`
})

const showBreadcrumbs = computed(() => route.path !== '/' && route.path !== '/substations')
</script>
