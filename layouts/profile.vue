<template>
  <div :class="containerClass">
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <header v-else class="transition-colors duration-300 relative z-50">
      <div class="w-full max-w-5xl mx-auto px-4 py-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <!-- Крутящийся логотип только при принудительном обновлении -->
            <img 
              src="/logo.svg" 
              alt="Логотип" 
              class="h-9 w-9 animate-spin"
            />
          </div>
          
          <!-- Поиск между логотипом и аватаром -->
          <div class="relative flex-1">
            <USkeleton class="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
          
          <div class="flex items-center space-x-3 sm:space-x-4 relative">
            <USkeleton class="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    </header>
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Результаты поиска -->
      <SearchResults v-if="!isInitialLoading" />
      
      <!-- Основной контент -->
      <div v-if="!isSearchActive">
        <div v-if="showBreadcrumbs">
          <Breadcrumbs v-if="!isInitialLoading && !isContentLoading" />
          <BreadcrumbsSkeleton v-else />
        </div>

      <!-- Навигация по профилю (вне всех блоков) -->
       <div v-if="!isInitialLoading" class="px-4 max-w-5xl mx-auto pt-8 w-full">
         <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left overflow-x-auto hide-scrollbar">
          <NuxtLink to="/profile" class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
            exact-active-class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
            inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 mr-2" />
            Смены
          </NuxtLink>
          <NuxtLink to="/profile/bookmarks"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
            exact-active-class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
            inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <UIcon name="i-heroicons-bookmark" class="w-4 h-4 mr-2" />
            Закладки
          </NuxtLink>
          <NuxtLink to="/profile/settings"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
            exact-active-class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
            inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-2" />
            Настройки
          </NuxtLink>
        </nav>
      </div>

      <!-- Скелетон контента при первичной загрузке -->
      <div v-if="isInitialLoading" class="px-4 max-w-5xl mx-auto py-8 space-y-4">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-2/3" />
        <div class="space-y-2">
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
        </div>
      </div>

      <!-- Скелетон контента при навигации -->
      <div v-else-if="isContentLoading" class="px-4 max-w-5xl mx-auto py-8 space-y-4">
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
        <div class="px-2 md:px-4 max-w-5xl mx-auto py-8">
          <!-- Контент страницы -->
          <Suspense>
            <template #default>
              <slot />
            </template>
            <template #fallback>
              <div class="space-y-4">
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
      </div>
    </div>

    <!-- Футер сайта -->
    <AppFooter v-if="!isInitialLoading" />
    <AppFooterSkeleton v-else-if="isInitialLoading" />

    <MobileNav v-if="!isInitialLoading" />

    <!-- Панель поиска с чат-ботом -->
    <BottomSearchPanel :is-open="isBottomSearchOpen" @close="closeBottomSearch" />
    
    <!-- Глобальный индикатор предзагрузки -->
    <PreloadIndicator />
  </div>
</template>

<script setup lang="ts">
import PreloadIndicator from '~/components/PreloadIndicator.vue'

// Глобальное состояние поиска
const { isSearchActive } = useGlobalSearch()

const route = useRoute()
const headerTitle = computed(() => (route.meta as any)?.headerTitle || 'Профиль')

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
    if ((e.ctrlKey || e.metaKey) && !e.shiftKey && !e.altKey && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); isBottomSearchOpen.value = true; window.dispatchEvent(new Event('openBottomSearch')); return }
    // '/' работает на любой раскладке (код клавиши 191)
    if (!e.ctrlKey && !e.shiftKey && !e.altKey && !e.metaKey && e.keyCode === 191) { e.preventDefault(); isBottomSearchOpen.value = true; window.dispatchEvent(new Event('openBottomSearch')) }
  }
  window.addEventListener('keydown', handleGlobalHotkey, { passive: false, capture: true })
  
  // Настраиваем автоматическую предзагрузку
  const { setupAutoPreload } = useAutoPreload()
  setupAutoPreload()

  onUnmounted(() => {
    window.removeEventListener('openBottomSearch', handleOpenBottomSearch)
    window.removeEventListener('keydown', handleGlobalHotkey as any)
  })
})

// Динамический класс контейнера
const containerClass = computed(() => {
  return 'transition-colors duration-300 flex flex-col min-h-screen'
})

const showBreadcrumbs = computed(() => true)
</script>
