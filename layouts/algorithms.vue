<template>
  <div :class="containerClass">
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

      <!-- Всегда видимая верхняя область (с поиском и вкладками) -->
      <div v-if="showTopArea" class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">


        <!-- Вкладки разделов: скелетоны на загрузке -->
        <div v-if="showGlobalTabs">
          <template v-if="!isInitialLoading && !isContentLoading">
            <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left overflow-x-auto hide-scrollbar">
              <NuxtLink :to="'/algorithms/adults'"
                        class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                        :class="activeSection==='Взрослые' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'">
                <UIcon name="i-heroicons-user" class="w-4 h-4 mr-2" /> Взрослые
              </NuxtLink>
              <NuxtLink :to="'/algorithms/pediatrics'"
                        class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                        :class="activeSection==='Детские' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'">
                <UIcon name="i-heroicons-user-group" class="w-4 h-4 mr-2" /> Детские
              </NuxtLink>
              <NuxtLink :to="'/algorithms/onmp'"
                        class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                        :class="activeSection==='ОНМП' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'">
                <UIcon name="i-heroicons-bolt" class="w-4 h-4 mr-2" /> ОНМП
              </NuxtLink>
              <NuxtLink :to="'/algorithms/onmp-children'"
                        class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
                        :class="activeSection==='ОНМП Дети' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-сlate-900 dark:hover:text-white'">
                <UIcon name="i-heroicons-bolt" class="w-4 h-4 mr-2" /> ОНМП Дети
              </NuxtLink>
            </nav>
          </template>
          <template v-else>
            <div class="flex space-x-2 bg-slate-100 dark:bg-slate-800 rounded-lg p-2 w-full overflow-x-auto hide-scrollbar">
              <USkeleton class="h-8 w-24 rounded-md" />
              <USkeleton class="h-8 w-28 rounded-md" />
              <USkeleton class="h-8 w-24 rounded-md" />
              <USkeleton class="h-8 w-32 rounded-md" />
            </div>
          </template>
        </div>
      </div>

      <!-- Скелетон контента при первичной загрузке (только для нижнего блока) -->
      <div v-if="isInitialLoading" class="max-w-5xl mx-auto px-0 md:px-4 pb-8 space-y-4">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-2/3" />
        <div class="space-y-2">
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
        </div>
      </div>

      <!-- Скелетон контента при навигации (только для нижнего блока) -->
      <div v-else-if="isContentLoading" class="max-w-5xl mx-auto px-0 md:px-4 pb-8 space-y-4">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-2/3" />
        <div class="space-y-2">
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
        </div>
      </div>

      <!-- Основной контент или результаты поиска -->
      <div v-else>
        <Suspense>
          <template #default>
            <slot />
          </template>
          <template #fallback>
            <div class="max-w-5xl mx-auto px-0 md:px-4 pb-8 space-y-4">
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
const headerTitle = computed(() => (route.meta as any)?.headerTitle || 'Справочник СМП')

// Получаем состояния загрузки из app.vue через provide/inject
const isInitialLoading = inject('isInitialLoading', ref(false))
const isContentLoading = inject('isContentLoading', ref(false))

// Состояние панели поиска с чат-ботом
const isBottomSearchOpen = ref(false)
const closeBottomSearch = () => { isBottomSearchOpen.value = false }
onMounted(() => {
  const handleOpenBottomSearch = () => { isBottomSearchOpen.value = true }
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
  
  onUnmounted(() => { window.removeEventListener('openBottomSearch', handleOpenBottomSearch) })
  onUnmounted(() => { window.removeEventListener('keydown', handleGlobalHotkey as any) })
})

// Динамический класс контейнера - h-screen только для страницы substations
const containerClass = computed(() => {
  const baseClasses = 'transition-colors duration-300 flex flex-col'
  const heightClass = route.path === '/substations' ? 'h-screen' : 'min-h-screen'
  return `${heightClass} ${baseClasses}`
})

const showBreadcrumbs = computed(() => route.path !== '/' && route.path !== '/substations')

const sectionSlug = computed(() => route.params.section as string)
const activeSection = computed<'Взрослые'|'Детские'|'ОНМП'|'ОНМП Дети'>(() => {
  if (sectionSlug.value === 'adults') return 'Взрослые'
  if (sectionSlug.value === 'pediatrics') return 'Детские'
  if (sectionSlug.value === 'onmp') return 'ОНМП'
  if (sectionSlug.value === 'onmp-children') return 'ОНМП Дети'
  return 'Взрослые'
})

// Скрыть глобальный поиск на страницах, где уже есть локальный: список в категории (view/index) и просмотр алгоритма
// Поиск в лейауте скрываем на страницах списка внутри категории и просмотра алгоритма
const showLayoutSearch = computed(() => {
  const segs = route.path.split('/').filter(Boolean)
  // /algorithms/:section/:category/view → скрыть
  if (segs.length >= 4 && segs[0] === 'algorithms' && segs[3] === 'view') return false
  // /algorithms/:section/:category/:id → скрыть
  if (segs.length >= 4 && segs[0] === 'algorithms' && /^[a-f0-9]{24}$/i.test(segs[3] || '')) return false
  return true
})

// Скрыть вкладки разделов на страницах списка внутри категории и просмотра алгоритма
const showGlobalTabs = computed(() => {
  const segs = route.path.split('/').filter(Boolean)
  if (segs.length >= 4 && segs[0] === 'algorithms' && (segs[3] === 'view' || /^[a-f0-9]{24}$/i.test(segs[3] || ''))) return false
  return true
})

// Полностью скрыть верхнюю область на внутренних страницах категории и просмотра алгоритма
const showTopArea = computed(() => {
  const segs = route.path.split('/').filter(Boolean)
  if (segs.length >= 4 && segs[0] === 'algorithms' && (segs[3] === 'view' || /^[a-f0-9]{24}$/i.test(segs[3] || ''))) return false
  return true
})
</script>


