<template>
  <div :class="containerClass">
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="showBreadcrumbs" class="pt-6">
        <Breadcrumbs v-if="!isInitialLoading" />
        <BreadcrumbsSkeleton v-else />
      </div>

      <!-- Всегда видимая верхняя область (не перерисовывается при навигации) -->
      <div v-if="showTopArea" class="max-w-5xl w-full mx-auto px-0 md:px-4 pt-8">

        <div class="mb-6 w-full relative" v-if="showLayoutSearch">
          <SearchBar />
        </div>

        <nav v-if="showGlobalTabs" class="flex space-x-1 bg-slate-100 dark:bg-slate-800 md:rounded-lg p-1 w-full justify-start items-start text-left overflow-x-auto hide-scrollbar">
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
                      :class="activeSection==='ОНМП Дети' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'">
              <UIcon name="i-heroicons-bolt" class="w-4 h-4 mr-2" /> ОНМП Дети
            </NuxtLink>
        </nav>
      </div>

      <!-- Скелетон контента при навигации (только для нижнего блока) -->
      <div v-if="isContentLoading" class="max-w-5xl mx-auto px-0 md:px-4 pb-8 space-y-4">
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
const closeBottomSearch = () => { isBottomSearchOpen.value = false }
onMounted(() => {
  const handleOpenBottomSearch = () => { isBottomSearchOpen.value = true }
  window.addEventListener('openBottomSearch', handleOpenBottomSearch)
  onUnmounted(() => { window.removeEventListener('openBottomSearch', handleOpenBottomSearch) })
})

// Динамический класс контейнера - h-screen только для страницы substations
const containerClass = computed(() => {
  const baseClasses = 'bg-slate-50/25 dark:bg-slate-900 transition-colors duration-300 flex flex-col'
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


