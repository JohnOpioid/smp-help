<template>
  <!-- Мобильный лейаут для Capacitor -->
  <MobileLayout v-if="isMobileApp" :show-back-button="showBackButton">
    <slot />
  </MobileLayout>
  
  <!-- Обычный лейаут для веб-браузера -->
  <div v-else :class="containerClass" :style="{ paddingBottom: isMobileApp ? '80px' : '0' }">
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <header v-else class="transition-colors duration-300 relative z-50">
      <div class="w-full max-w-5xl mx-auto px-2 md:px-4 py-6">
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
      
      <!-- Скелетон контента при первичной загрузке (только для других страниц) -->
      <div v-if="isInitialLoading && route.path !== '/'" class="max-w-5xl mx-auto px-4 py-8 space-y-4">
        <USkeleton class="h-6 w-1/3 bg-slate-200 dark:bg-slate-700" />
        <USkeleton class="h-4 w-2/3 bg-slate-200 dark:bg-slate-700" />
        <div class="space-y-2">
          <USkeleton class="h-20 w-full bg-slate-200 dark:bg-slate-700" />
          <USkeleton class="h-20 w-full bg-slate-200 dark:bg-slate-700" />
          <USkeleton class="h-20 w-full bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>

      <!-- Скелетон контента при навигации -->
      <div v-else-if="isContentLoading" class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-4">
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
        <!-- Панель поиска вместо контента -->
        <div v-if="isSearchActive" class="flex-1 flex flex-col min-h-0">
          <div class="flex-1 overflow-y-auto">
            <div class="max-w-5xl mx-auto px-4 py-8">
              <!-- Скелетон загрузки -->
              <div v-if="isSearching" class="space-y-4">
                <div class="space-y-3">
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div class="flex-1">
                      <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div class="flex-1">
                      <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2"></div>
                    </div>
                  </div>
                  <div class="flex items-center space-x-3">
                    <div class="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                    <div class="flex-1">
                      <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                      <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-3/4"></div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Заглушка при отсутствии результатов -->
              <div v-else-if="!isSearching && searchResults.length === 0" class="text-center py-16">
                <div class="flex flex-col items-center space-y-4">
                  <!-- Иконка -->
                  <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                  </div>
                  <!-- Текст -->
                  <div>
                    <p class="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                      Ничего не найдено
                    </p>
                    <p class="text-xs text-slate-500 dark:text-slate-400">
                      Попробуйте изменить запрос
                    </p>
                  </div>
                </div>
              </div>

              <!-- Результаты поиска -->
              <div v-else-if="!isSearching && searchResults.length > 0" class="space-y-6">
                <!-- Диагнозы МКБ -->
                <template v-if="groupedResults.mkb && groupedResults.mkb.length > 0">
                  <div>
                    <div class="flex items-center mb-4">
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                      <div class="px-3 text-sm font-medium text-slate-500 dark:text-slate-400">Диагнозы МКБ</div>
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="result in groupedResults.mkb.slice(0, 5)"
                        :key="`mkb-${result._id}`"
                        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        @click="selectSearchResult(result)"
                      >
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ result.title || result.name }}
                        </div>
                        <div v-if="result.mkbCode || result.stationCode" class="text-xs mb-1 mt-1 flex gap-2 flex-wrap">
                          <span v-if="result.mkbCode" class="bg-slate-100 dark:bg-slate-600 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300 font-mono">
                            МКБ: {{ result.mkbCode }}
                          </span>
                          <span v-if="result.stationCode" class="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded text-xs font-mono text-green-700 dark:text-green-300">
                            Станция: {{ result.stationCode }}
                          </span>
                        </div>
                        <div v-if="result.description || result.note" class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                          {{ result.description || result.note }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Локальные статусы -->
                <template v-if="groupedResults.ls && groupedResults.ls.length > 0">
                  <div>
                    <div class="flex items-center mb-4">
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                      <div class="px-3 text-sm font-medium text-slate-500 dark:text-slate-400">Локальные статусы</div>
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="result in groupedResults.ls.slice(0, 5)"
                        :key="`ls-${result._id}`"
                        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        @click="selectSearchResult(result)"
                      >
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ result.title || result.name }}
                        </div>
                        <div v-if="result.description || result.data?.description || result.data?.note" class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                          {{ result.description || result.data?.description || result.data?.note }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Алгоритмы -->
                <template v-if="groupedResults.algorithm && groupedResults.algorithm.length > 0">
                  <div>
                    <div class="flex items-center mb-4">
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                      <div class="px-3 text-sm font-medium text-slate-500 dark:text-slate-400">Алгоритмы</div>
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="result in groupedResults.algorithm.slice(0, 5)"
                        :key="`algo-${result._id}`"
                        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        @click="selectSearchResult(result)"
                      >
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ result.title || result.name }}
                        </div>
                        <div v-if="result.description" class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                          {{ result.description }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Препараты -->
                <template v-if="groupedResults.drug && groupedResults.drug.length > 0">
                  <div>
                    <div class="flex items-center mb-4">
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                      <div class="px-3 text-sm font-medium text-slate-500 dark:text-slate-400">Препараты</div>
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="result in groupedResults.drug.slice(0, 5)"
                        :key="`drug-${result._id}`"
                        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        @click="selectSearchResult(result)"
                      >
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ result.title || result.name }}
                        </div>
                        <div v-if="result.data?.latinName" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {{ result.data.latinName }}
                        </div>
                        <div v-if="result.data?.synonyms && result.data.synonyms.length > 0" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          <span class="font-medium">Синонимы:</span> {{ result.data.synonyms.join(', ') }}
                        </div>
                        <div v-if="result.data?.analogs && result.data.analogs.length > 0" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          <span class="font-medium">Аналоги:</span> {{ result.data.analogs.join(', ') }}
                        </div>
                        <div v-if="result.data?.groups && result.data.groups.length > 0" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          <span class="font-medium">Группы:</span> {{ result.data.groups.join(', ') }}
                        </div>
                        <div v-if="result.description && result.description !== result.data?.latinName" class="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mt-1">
                          {{ result.description }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>

                <!-- Подстанции -->
                <template v-if="groupedResults.substation && groupedResults.substation.length > 0">
                  <div>
                    <div class="flex items-center mb-4">
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                      <div class="px-3 text-sm font-medium text-slate-500 dark:text-slate-400">Подстанции</div>
                      <div class="flex-1 border-t border-slate-200 dark:border-slate-600"></div>
                    </div>
                    <div class="space-y-2">
                      <div
                        v-for="result in groupedResults.substation.slice(0, 5)"
                        :key="`substation-${result._id}`"
                        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                        @click="selectSearchResult(result)"
                      >
                        <div class="font-medium text-slate-900 dark:text-slate-100">
                          {{ result.title || result.name }}
                        </div>
                        <div v-if="result.data?.address" class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                          {{ result.data.address }}
                        </div>
                        <div v-if="result.data?.phones && result.data.phones.length > 0" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          <span class="font-medium">Телефоны:</span> {{ result.data.phones.join(', ') }}
                        </div>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Обычный контент -->
        <Suspense v-else>
          <template #default>
            <slot />
          </template>
          <template #fallback>
            <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-4">
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
    
    <!-- Футер сайта -->
    <AppFooter v-if="!isInitialLoading && route.path !== '/substations'" />
    <AppFooterSkeleton v-else-if="isInitialLoading && route.path !== '/substations'" />

    <!-- Мобильная навигация -->
    <MobileNav v-if="!isInitialLoading" />
    
    <!-- Панель поиска с чат-ботом -->
    <BottomSearchPanel :is-open="isBottomSearchOpen" @close="closeBottomSearch" />
    
    <!-- Глобальный индикатор предзагрузки -->
    <PreloadIndicator />
  </div>
</template>

<script setup lang="ts">
import PreloadIndicator from '~/components/PreloadIndicator.vue'
import { Capacitor } from '@capacitor/core'

// Реактивное состояние размера экрана
const screenWidth = ref(0)

// Определяем, находимся ли в мобильном приложении или мобильном браузере
const isMobileApp = computed(() => {
  if (!process.client) return false
  
  // Для Capacitor приложений используем веб-интерфейс
  if (Capacitor.isNativePlatform()) return false
  
  // Проверяем мобильный браузер
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobileBrowser = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent)
  
  // Проверяем размер экрана
  const isSmallScreen = screenWidth.value <= 768
  
  return isMobileBrowser || isSmallScreen
})

// Обновляем размер экрана при изменении
if (process.client) {
  const updateScreenWidth = () => {
    screenWidth.value = window.innerWidth
  }
  
  updateScreenWidth()
  window.addEventListener('resize', updateScreenWidth)
  
  onUnmounted(() => {
    window.removeEventListener('resize', updateScreenWidth)
  })
}

// Показывать ли кнопку "Назад" в мобильном приложении
const showBackButton = computed(() => {
  const route = useRoute()
  return route.path !== '/' && route.path !== '/auth/login'
})

// Глобальное состояние поиска
const {
  isSearchActive,
  searchResults,
  isSearching,
  groupedResults,
  selectSearchResult
} = useGlobalSearch()

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
  
  // Настраиваем автоматическую предзагрузку
  const { setupAutoPreload } = useAutoPreload()
  setupAutoPreload()
  
  onUnmounted(() => {
    window.removeEventListener('openBottomSearch', handleOpenBottomSearch)
    window.removeEventListener('keydown', handleGlobalHotkey as any)
  })
})


// Динамический класс контейнера - h-screen только для страницы substations
const containerClass = computed(() => {
  const baseClasses = 'transition-colors duration-300 flex flex-col'
  const heightClass = route.path === '/substations' ? 'h-screen' : 'min-h-screen'
  return `${heightClass} ${baseClasses}`
})

const showBreadcrumbs = computed(() => route.path !== '/' && route.path !== '/substations')
</script>
