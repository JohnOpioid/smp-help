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

      <!-- Всегда видимая верхняя область (с поиском и вкладками) -->
      <div v-if="showTopArea" class="max-w-5xl w-full mx-auto px-4 pt-8">

        <!-- Поиск: заменяем старый на локальный реактивный -->
        <div class="mb-6 w-full relative" v-if="showLayoutSearch">
          <template v-if="!isInitialLoading && !isContentLoading">
            <ReactiveSearch v-model="searchText" placeholder="Введите запрос для поиска..." @clear="clearSearch" @enter="performSearch" :ai-enabled="true" />
          </template>
          <template v-else>
            <USkeleton class="h-12 sm:h-14 w-full rounded-lg" />
          </template>
        </div>

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
            <template v-if="!showSearchResults">
              <slot />
            </template>
            <template v-else>
              <div class="md:px-4 max-w-5xl mx-auto py-8">
                <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg">
                  <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <p class="text-sm text-slate-600 dark:text-slate-300">Найдено: {{ totalFound }}</p>
                    <div class="text-xs text-slate-500 dark:text-slate-400">
                      Категория: {{ hasCategoryContext ? (currentCategoryName || 'Категории') : 'Категории' }}
                    </div>
                  </div>
                  <div v-if="searching" class="p-4 space-y-2">
                    <USkeleton class="h-4 w-2/3" />
                    <USkeleton class="h-4 w-3/4" />
                    <USkeleton class="h-4 w-1/2" />
                  </div>
                  <div v-else>
                    <!-- Контекст категории: сперва показываем группу текущей категории, затем другие категории -->
                    <template v-if="hasCategoryContext">
                      <div>
                        <div class="relative my-4" v-if="categoryResults.length > 0">
                          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-600"></div></div>
                          <div class="relative flex justify-center text-sm">
                            <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В категории {{ currentCategoryName || 'Категория' }}</span>
                          </div>
                        </div>
                        <ul v-if="categoryResults.length > 0" class="divide-y divide-slate-100 dark:divide-slate-700">
                          <li
                            v-for="item in categoryResults"
                            :key="item._id"
                            class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                            @click="openResult(item)"
                          >
                            <div class="flex items-start justify-between gap-2">
                              <p class="text-slate-900 dark:text-white font-medium flex-1">{{ item.title }}</p>
                              <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" v-if="item.mkbCodes && item.mkbCodes.length">
                              <span v-for="code in (item.mkbCodes as any[])" :key="code" class="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-2">{{ code }}</span>
                            </p>
                          </li>
                        </ul>
                        <ul v-else class="divide-y divide-slate-100 dark:divide-slate-700">
                          <li class="p-8 text-center text-sm text-slate-600 dark:text-slate-300">
                            <div class="flex flex-col items-center gap-2">
                              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                              </svg>
                              <span>В категории ничего не найдено</span>
                            </div>
                          </li>
                        </ul>

                        <div v-for="group in groupedSectionResults" :key="group.categoryId">
                          <div class="relative my-4">
                            <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-600"></div></div>
                            <div class="relative flex justify-center text-sm">
                              <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В категории {{ group.categoryName || 'Категория' }}</span>
                            </div>
                          </div>
                          <ul class="divide-y divide-slate-100 dark:divide-slate-700">
                            <li
                              v-for="item in group.items"
                              :key="item._id"
                              class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                              @click="openResult(item)"
                            >
                              <div class="flex items-start justify-between gap-2">
                                <p class="text-slate-900 dark:text-white font-medium flex-1">{{ item.title }}</p>
                                <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                              </div>
                              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" v-if="item.mkbCodes && item.mkbCodes.length">
                                <span v-for="code in (item.mkbCodes as any[])" :key="code" class="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-2">{{ code }}</span>
                              </p>
                            </li>
                          </ul>
                        </div>
                      </div>
                      <div v-if="categoryResults.length === 0 && groupedSectionResults.length === 0" class="p-6 text-center text-sm text-slate-600 dark:text-slate-300">Ничего не найдено</div>
                    </template>

                    <!-- Без контекста категории: результаты сгруппированы по категориям -->
                    <template v-else>
                      <div v-for="group in groupedResults" :key="group.categoryId">
                        <div class="relative my-4">
                          <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-600"></div></div>
                          <div class="relative flex justify-center text-sm">
                            <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В категории {{ group.categoryName || 'Категория' }}</span>
                          </div>
                        </div>
                        <ul class="divide-y divide-slate-100 dark:divide-slate-700">
                          <li
                            v-for="item in group.items"
                            :key="item._id"
                            class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                            @click="openResult(item)"
                          >
                            <div class="flex items-start justify-between gap-2">
                              <p class="text-slate-900 dark:text-white font-medium flex-1">{{ item.title }}</p>
                              <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                            </div>
                            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1" v-if="item.mkbCodes && item.mkbCodes.length">
                              <span v-for="code in (item.mkbCodes as any[])" :key="code" class="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-2">{{ code }}</span>
                            </p>
                          </li>
                        </ul>
                      </div>
                      <div v-if="!searching && groupedResults.length === 0" class="p-6 text-center text-sm text-slate-600 dark:text-slate-300">Ничего не найдено</div>
                    </template>
                  </div>
                </div>
              </div>
            </template>
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
    <AppFooterSkeleton v-else-if="route.path !== '/substations'" />

    <MobileNav v-if="!isInitialLoading" />

    <!-- Панель поиска с чат-ботом -->
    <BottomSearchPanel :is-open="isBottomSearchOpen" @close="closeBottomSearch" />
    
    <!-- Глобальный индикатор предзагрузки -->
    <PreloadIndicator />
  </div>
</template>

<script setup lang="ts">
import PreloadIndicator from '~/components/PreloadIndicator.vue'

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

// ----------------------
// Поиск по алгоритмам (в лейауте)
// ----------------------
const searchText = ref('')
const results = ref<any[]>([])
const categoryResults = ref<any[]>([])
const sectionResults = ref<any[]>([])
const totalFound = ref(0)
const searching = ref(false)
const showSearchResults = computed(() => Boolean(searchText.value.trim()))
const hasCategoryContext = computed(() => {
  // Ожидаемый путь категории: /algorithms/:section/:category
  const segs = route.path.split('/').filter(Boolean)
  return segs.length >= 3 && segs[0] === 'algorithms' && segs[2] && segs[2] !== 'view'
})
const currentCategoryUrl = computed(() => {
  const segs = route.path.split('/').filter(Boolean)
  return hasCategoryContext.value ? segs[2] : ''
})
const currentCategoryName = computed(() => {
  const url = currentCategoryUrl.value
  if (!url) return ''
  const items = (catsData.value as any)?.items || []
  const found = items.find((c: any) => String(c.url) === String(url))
  return found?.name || ''
})
let searchTimer: any = null

function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => { performSearch() }, 300)
}

// Запускаем поиск при изменении текста (реактивно)
watch(searchText, () => {
  onSearchInput()
})

async function performSearch() {
  const q = searchText.value.trim()
  if (!q) { results.value = []; categoryResults.value = []; sectionResults.value = []; totalFound.value = 0; searching.value = false; return }
  searching.value = true
  try {
    if (hasCategoryContext.value && currentCategoryUrl.value) {
      // 1) Поиск внутри категории (по URL категории — сервер поддерживает url в поле category)
      const catRes: any = await $fetch('/api/algorithms', {
        query: {
          page: 1,
          limit: 100,
          search: q,
          section: activeSection.value,
          category: currentCategoryUrl.value
        }
      })
      categoryResults.value = catRes?.items || []

      // 2) Если в категории нет — подсказки из всего раздела
      const secRes: any = await $fetch('/api/algorithms', {
        query: {
          page: 1,
          limit: 50,
          search: q,
          section: activeSection.value
        }
      })
      sectionResults.value = (secRes?.items || []).filter((it: any) => {
        // исключаем те, что уже в categoryResults
        const catIds = new Set((categoryResults.value as any[]).map((c: any) => String(c._id)))
        return !catIds.has(String(it._id))
      })
      totalFound.value = (catRes?.total || categoryResults.value.length || 0) + (sectionResults.value.length)
      buildGroupedResults()
    } else {
      // Без контекста категории — обычный поиск по разделу
      const res: any = await $fetch('/api/algorithms', {
        query: {
          page: 1,
          limit: 100,
          search: q,
          section: activeSection.value
        }
      })
      results.value = res?.items || []
      totalFound.value = Number(res?.total || results.value.length || 0)
      buildGroupedResults()
    }
  } finally {
    searching.value = false
  }
}

async function openResult(item: any) {
  const categoryIdOrObj = (item as any).category
  const categoryId = typeof categoryIdOrObj === 'object' ? (categoryIdOrObj?._id as string) : (categoryIdOrObj as string)
  if (!categoryId) return
  const url = idToCategoryUrl.value[categoryId]
  if (url) {
    clearSearch()
    await navigateTo(`/algorithms/${sectionSlug.value}/${url}/${(item as any)._id}`)
  } else {
    // Фолбэк: если нет URL категории, открываем список категории по id
    clearSearch()
    await navigateTo(`/algorithms/${sectionSlug.value}/${categoryId}`)
  }
}

function clearSearch() {
  searchText.value = ''
  results.value = []
  categoryResults.value = []
  sectionResults.value = []
  totalFound.value = 0
  groupedResults.value = []
  groupedSectionResults.value = []
}

// Карта соответствия categoryId -> categoryUrl (для корректной навигации к алгоритму)
const { data: catsData } = await useFetch('/api/algorithms/categories', { server: false })
const idToCategoryUrl = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  const items = (catsData.value as any)?.items || []
  for (const c of items) {
    if (c?._id && c?.url) map[String(c._id)] = String(c.url)
  }
  return map
})
const idToCategoryName = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  const items = (catsData.value as any)?.items || []
  for (const c of items) {
    if (c?._id && c?.name) map[String(c._id)] = String(c.name)
  }
  return map
})

// Группировка результатов по категориям
const groupedResults = ref<{ categoryId: string; categoryName: string; items: any[] }[]>([])
const groupedSectionResults = ref<{ categoryId: string; categoryName: string; items: any[] }[]>([])

function groupByCategory(list: any[]): { categoryId: string; categoryName: string; items: any[] }[] {
  const groups: Record<string, any[]> = {}
  for (const it of list) {
    const cat = (it as any).category
    const catId = typeof cat === 'object' ? String(cat?._id || '') : String(cat || '')
    if (!catId) continue
    ;(groups[catId] ||= []).push(it)
  }
  return Object.keys(groups).map(catId => ({
    categoryId: catId,
    categoryName: idToCategoryName.value[catId] || 'Категория',
    items: groups[catId]
  }))
}

function buildGroupedResults() {
  groupedResults.value = groupByCategory(results.value)
  // Для секционных подсказок исключаем текущую категорию
  const currentCatId = Object.entries(idToCategoryUrl.value).find(([, url]) => url === currentCategoryUrl.value)?.[0]
  const filteredSection = currentCatId
    ? (sectionResults.value as any[]).filter((it: any) => {
        const cat = it.category
        const catId = typeof cat === 'object' ? String(cat?._id || '') : String(cat || '')
        return catId && catId !== currentCatId
      })
    : sectionResults.value
  groupedSectionResults.value = groupByCategory(filteredSection as any[])
}
</script>


