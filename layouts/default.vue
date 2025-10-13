<template>
  <div :class="containerClass">
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <div v-else class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <USkeleton class="h-8 w-8 rounded" />
          <USkeleton class="h-6 w-48" />
        </div>
        <USkeleton class="h-8 w-8 rounded-full" />
      </div>
    </div>
    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="showBreadcrumbs" class="pt-6">
        <Breadcrumbs v-if="!isInitialLoading && !isContentLoading" />
        <BreadcrumbsSkeleton v-else />
      </div>
      
      <!-- Скелетон контента при первичной загрузке -->
      <div v-if="isInitialLoading" class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <!-- Главная страница: заголовок, описание и поиск -->
        <div v-if="route.path === '/'" class="px-4 md:px-0">
          <div class="text-center mb-8 sm:mb-12">
            <div class="flex flex-col items-center gap-2 sm:gap-3">
              <USkeleton class="h-7 sm:h-9 w-64 sm:w-96" />
              <USkeleton class="h-5 sm:h-6 w-72 sm:w-[28rem]" />
            </div>
          </div>
          <!-- Поисковая строка -->
          <div class="mb-8 sm:mb-12">
            <USkeleton class="h-12 sm:h-14 w-full rounded-md" />
          </div>
        </div>
        <!-- Главная страница: сетка карточек -->
        <div v-if="route.path === '/'" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div v-for="n in 6" :key="n" class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <USkeleton class="w-12 h-12 rounded-lg" />
                <div class="ml-4 sm:ml-6 flex-1">
                  <USkeleton class="h-5 w-32 mb-2" />
                  <USkeleton class="h-4 w-24" />
                </div>
              </div>
              <USkeleton class="h-4 w-full mb-2" />
              <USkeleton class="h-4 w-5/6 mb-4 sm:mb-6" />
              <USkeleton class="h-10 w-full mt-auto rounded-md" />
            </div>
          </div>
        </div>
        <!-- Другие страницы: универсальные блоки -->
        <div v-else class="space-y-4">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-4 w-2/3" />
          <div class="space-y-2">
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
          </div>
        </div>
      </div>

      <!-- Скелетон контента при навигации -->
      <div v-else-if="isContentLoading" class="max-w-5xl mx-auto px-0 md:px-4 py-8 space-y-4">
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
    <AppFooterSkeleton v-else-if="route.path !== '/substations'" />

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
  const handleGlobalHotkey = (e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null
    const tag = (target?.tagName || '').toUpperCase()
    const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (target as any)?.isContentEditable
    if (isEditable) return
    // Ctrl/Cmd + K
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault()
      isBottomSearchOpen.value = true
      // дублируем через глобальное событие для совместимости с другими слушателями
      window.dispatchEvent(new Event('openBottomSearch'))
      return
    }
    // '/' работает на любой раскладке (код клавиши 191)
    if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && e.keyCode === 191) {
      e.preventDefault()
      isBottomSearchOpen.value = true
      window.dispatchEvent(new Event('openBottomSearch'))
    }
  }
  // capture:true чтобы опередить обработчики браузера
  window.addEventListener('keydown', handleGlobalHotkey, { passive: false, capture: true })
  
  onUnmounted(() => {
    window.removeEventListener('openBottomSearch', handleOpenBottomSearch)
    window.removeEventListener('keydown', handleGlobalHotkey as any)
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
