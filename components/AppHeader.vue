<template>
  <header class="transition-colors duration-300 relative z-50">
    <div class="w-full max-w-5xl mx-auto px-4 py-6">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <div class="relative">
            <!-- Логотип (крутится при реактивной навигации) -->
            <img ref="logoRef" :src="logoUrl" alt="Логотип"
              class="h-9 w-9 cursor-pointer transition-transform duration-200"
              :class="{ 
                'scale-110': dropdownMenuOpen,
                'animate-spin': isContentLoading
              }" 
              @click="navigateToHome"
              @contextmenu.prevent="openDropdownMenu" />

            <!-- Выпадающее меню из логотипа-кнопки -->
            <Transition enter-active-class="transition-all duration-200 ease-out"
              enter-from-class="opacity-0 scale-95 translate-y-[-10px]"
              enter-to-class="opacity-100 scale-100 translate-y-0"
              leave-active-class="transition-all duration-150 ease-in"
              leave-from-class="opacity-100 scale-100 translate-y-0"
              leave-to-class="opacity-0 scale-95 translate-y-[-10px]">
              <div v-if="dropdownMenuOpen" ref="menuRef"
                class="absolute -top-2 -left-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-50 min-w-80 backdrop-blur-sm"
                @click.stop>
                <!-- Заголовок меню с логотипом и названием -->
                <div
                  class="px-3 py-2 bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-slate-700 dark:to-slate-600 rounded-t-lg">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <!-- Логотип в заголовке меню (точно того же размера что в шапке) -->
                      <img :src="logoUrl" alt="Логотип" class="h-9 w-9" />
                      <h3 class="text-sm font-semibold text-slate-900 dark:text-white">
                        {{ currentMenuTitle }}
                      </h3>
                    </div>
                    <button @click="closeDropdownMenu"
                      class="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-pointer"
                      aria-label="Закрыть меню">
                      <UIcon name="i-heroicons-x-mark" class="w-4 h-4" />
          </button>
                  </div>
        </div>

                <!-- Контент меню -->
                <div class="py-2 max-h-96 overflow-y-auto">
                  <!-- Основное меню -->
                  <div v-if="currentView === 'main'" class="space-y-1">
                    <div v-for="item in mainMenuItems" :key="item.to"
                      class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                      :class="{ 'bg-slate-100 dark:bg-slate-700': isActive(item.to) }"
                      @click="item.hasChildren ? handleMenuItemClick(item) : navigateToItem(item)">
                      <UIcon :name="item.icon" class="w-5 h-5 text-slate-500" />
                      <div class="flex-1">
                        <div class="font-medium">{{ item.label }}</div>
                        <div v-if="item.description" class="text-xs text-slate-500 dark:text-slate-400">{{
                          item.description }}</div>
                      </div>
                      <UIcon v-if="item.hasChildren" name="i-heroicons-chevron-right" class="w-4 h-4 text-slate-400" />
                    </div>
          </div>

                  <!-- Подменю -->
                  <div v-else class="space-y-1">
                    <!-- Кнопка "Назад" -->
                    <button @click="goBackToMainMenu"
                      class="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer w-full text-left">
                      <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
                      <span>Назад</span>
          </button>

                    <!-- Элементы подменю -->
                    <div v-for="item in currentSubmenuItems" :key="item.to"
                      class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                      :class="{ 'bg-slate-100 dark:bg-slate-700': isActive(item.to) }" @click="navigateToItem(item)">
                      <UIcon :name="item.icon" class="w-5 h-5 text-slate-500" />
                      <div class="flex-1">
                        <div class="font-medium">{{ item.label }}</div>
                        <div v-if="item.description" class="text-xs text-slate-500 dark:text-slate-400">{{
                          item.description }}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>
        </div>

        <!-- Поиск между логотипом и аватаром -->
        <div class="relative flex-1">
          <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg class="h-6 w-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input 
            ref="searchInput"
            v-model="searchQuery"
            type="text" 
            placeholder="Введите запрос для поиска..."
            class="block w-full pl-11 pr-11 py-4 outline-none focus:outline-none focus:ring-0 focus:border-slate-300 dark:focus:border-slate-500 hover:shadow-sm focus:shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 rounded-lg"
            @input="onSearchInput"
            @focus="onSearchFocus"
            @blur="onSearchBlur"
            @keydown.enter.prevent="onSearchEnter">
          
          <!-- Панель поиска теперь отображается в основной области контента -->
          
          <div class="absolute inset-y-0 right-0 flex items-center pr-2">
            <button v-if="searchQuery"
              @click="clearSearch"
              class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-200 cursor-pointer"
              aria-label="Очистить поиск">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
        </div>

        <div class="flex items-center space-x-3 sm:space-x-4 relative">

          <!-- Профиль: выпадающее меню (мобайл + десктоп) -->
          <ClientOnly>
            <div class="relative flex items-center" ref="profileRef">
              <button @click="toggleMenu"
                class="shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
              {{ initials }}
            </button>

              <div v-if="menuOpen"
                class="absolute right-0 top-full mt-2 w-56 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl z-100">
              <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                  <p class="text-sm font-medium text-slate-900 dark:text-white">{{ user?.firstName }} {{ user?.lastName
                    }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ user?.email }}</p>
              </div>
              <nav class="py-1">
                  <NuxtLink to="/profile/bookmarks"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    @click="menuOpen = false">
                  <UIcon name="i-heroicons-bookmark" class="w-4 h-4 text-slate-500" />
                  <span>Закладки</span>
                </NuxtLink>
                  <NuxtLink to="/profile/settings"
                    class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    @click="menuOpen = false">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-slate-500" />
                  <span>Настройки</span>
                </NuxtLink>
                  <div
                    class="flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <span>Тёмная тема</span>
                  <USwitch :model-value="isDark" @update:model-value="onToggleTheme" size="sm" color="neutral" />
                </div>
                  <NuxtLink v-if="user?.role === 'admin'" to="/admin"
                    class="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    @click="menuOpen = false">Админка</NuxtLink>
                  <button @click="menuOpen = false; logout()"
                    class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40">Выйти</button>
              </nav>
            </div>
            </div>
          </ClientOnly>

          
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { watch } from 'vue'

const props = withDefaults(defineProps<{ title?: string }>(), { title: 'Справочник СМП' })
const route = useRoute()
const { user, logout } = useAuth()
const { isDark, toggleTheme } = useTheme()
const title = computed(() => props.title || 'Справочник СМП')

// Получаем состояние загрузки контента для крутящегося логотипа
const isContentLoading = inject('isContentLoading', ref(false))

// Импорт логотипа из assets (обрабатывается Vite)
// Используем импорт, чтобы гарантировать корректный путь в проде и деве
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import logoSrc from '~/assets/svg/logo.svg'
const logoUrl = computed(() => logoSrc)

const onToggleTheme = () => {
  if (process.client) toggleTheme()
}

// Гарантируем наличие данных пользователя после перезагрузки (SSR/CSR)
if (!user.value) {
  const opts: any = { credentials: 'include' }
  if (process.server) {
    const headers = useRequestHeaders(['cookie'])
    opts.headers = { cookie: headers.cookie as string }
  }
  try {
    const { data: meData } = useFetch('/api/auth/me', opts)
    watch(meData, (val) => {
      if (val?.user) user.value = val.user as any
    }, { immediate: true })
  } catch { }
}

const menuOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const toggleMenu = () => { menuOpen.value = !menuOpen.value }

// Состояние выпадающего меню
const dropdownMenuOpen = ref(false)
const logoRef = ref<HTMLElement | null>(null)

const openDropdownMenu = (event: MouseEvent) => {
  // Меню теперь позиционируется через CSS относительно логотипа
  // Не нужно вычислять координаты
  dropdownMenuOpen.value = true
}

const closeDropdownMenu = () => {
  dropdownMenuOpen.value = false
}

const navigateToHome = () => {
  navigateTo('/')
}

// Переменные для меню
const menuRef = ref<HTMLElement | null>(null)
const currentView = ref<'main' | 'submenu'>('main')
const currentSubmenuItems = ref<any[]>([])
const currentMenuTitle = ref('Меню')

// Интерфейс для элементов меню
interface MenuItem {
  label: string
  to: string
  icon: string
  description?: string
  children?: MenuItem[]
  hasChildren?: boolean
}

// Основные пункты меню
const mainMenuItems = computed<MenuItem[]>(() => [
  {
    label: 'Главная',
    to: '/',
    icon: 'i-lucide-home',
    description: 'На главную страницу'
  },
  {
    label: 'Алгоритмы',
    to: '/algorithms',
    icon: 'i-lucide-list-tree',
    description: 'Медицинские алгоритмы',
    hasChildren: true,
    children: [
    {
      label: 'Взрослые',
      to: '/algorithms/adults',
      icon: 'i-heroicons-user',
      description: 'Алгоритмы для взрослых пациентов'
    },
    {
      label: 'Детские',
      to: '/algorithms/pediatrics',
      icon: 'i-heroicons-user-group',
      description: 'Алгоритмы для детских пациентов'
    },
    {
      label: 'ОНМП',
      to: '/algorithms/onmp',
      icon: 'i-heroicons-bolt',
      description: 'Алгоритмы неотложной помощи'
    },
    {
      label: 'ОНМП Дети',
      to: '/algorithms/onmp-children',
      icon: 'i-heroicons-bolt',
      description: 'Алгоритмы детской неотложной помощи'
    }
  ]
  },
  {
    label: 'Кодификатор',
    to: '/codifier',
    icon: 'i-heroicons-document-text',
    description: 'МКБ кодификатор',
    hasChildren: true,
    children: []
  },
  {
    label: 'Калькуляторы',
    to: '/calculators',
    icon: 'i-lucide-calculator',
    description: 'Медицинские калькуляторы'
  },
  {
    label: 'Локальные статусы',
    to: '/local-statuses',
    icon: 'i-lucide-list-checks',
    description: 'Локальные статусы по категориям'
  },
  {
    label: 'Лекарства',
    to: '/drugs',
    icon: 'i-lucide-pill',
    description: 'Справочник препаратов'
  },
  {
    label: 'Приложения',
    to: '/apps',
    icon: 'i-lucide-smartphone',
    description: 'Полезные приложения'
  },
  {
    label: 'Инструкции',
    to: '/instructions',
    icon: 'i-lucide-file-text',
    description: 'Инструкции и памятки'
  },
  {
    label: 'Подстанции',
    to: '/substations',
    icon: 'i-lucide-building-2',
    description: 'Подстанции на карте'
  }
])

// Получаем данные для кодификатора
const { data: categoriesData } = useFetch('/api/categories', { server: false })

const codifierChildren = computed(() => (categoriesData.value?.items || []).map((c: any) => ({
  label: c.name,
  to: `/codifier/${c.url}`,
  icon: 'i-lucide-book-text',
  description: c.codeRange ? `${c.codeRange}` : `${c.mkbCount || 0} диагнозов`
})))

// Обновляем children для кодификатора
watch(codifierChildren, (children) => {
  const codifierItem = mainMenuItems.value.find(item => item.label === 'Кодификатор')
  if (codifierItem) {
    codifierItem.children = children
  }
}, { immediate: true })

const isActive = (to: string) => route.path === to

const goBackToMainMenu = () => {
  currentView.value = 'main'
  currentMenuTitle.value = 'Меню'
}

const navigateToItem = (item: MenuItem) => {
  navigateTo(item.to)
  closeDropdownMenu()
}

const handleMenuItemClick = (item: MenuItem) => {
  if (item.children && item.children.length > 0) {
    currentView.value = 'submenu'
    currentSubmenuItems.value = item.children
    currentMenuTitle.value = item.label
  }
}

// Добавляем обработчики кликов для пунктов с дочерними элементами
watch(() => dropdownMenuOpen.value, (isOpen) => {
  if (isOpen) {
    currentView.value = 'main'
    currentMenuTitle.value = 'Меню'
  }
})
const onDocClick = (e: MouseEvent) => {
  if (!menuOpen.value) return
  const el = profileRef.value
  if (el && !el.contains(e.target as Node)) menuOpen.value = false
}
// Обработчик клика вне меню
const onDocClickMenu = (e: MouseEvent) => {
  if (!dropdownMenuOpen.value) return
  const el = menuRef.value
  if (el && !el.contains(e.target as Node)) dropdownMenuOpen.value = false
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('click', onDocClickMenu)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('click', onDocClickMenu)
})
const initials = computed(() => {
  const f = (user.value?.firstName || '').trim()[0] || ''
  const l = (user.value?.lastName || '').trim()[0] || ''
  return (f + l).toUpperCase() || 'U'
})


const mapTitle: Record<string, string> = {
  '/': 'Справочник СМП',
  '/algorithms': 'Алгоритмы',
  '/codifier': 'Кодификатор',
  '/local-statuses': 'Локальные статусы',
  '/calculators': 'Калькуляторы',
  '/drugs': 'Лекарства',
  '/apps': 'Приложения',
  '/instructions': 'Инструкции',
  '/substations': 'Подстанции'
}

const currentTitle = computed(() => mapTitle[route.path] || title.value)

// Открыть нижнюю панель поиска
function openSearchPanel() {
  if (process.client) {
    window.dispatchEvent(new Event('openBottomSearch'))
  }
}

// ===== РЕАКТИВНЫЙ ПОИСК В ШАПКЕ =====

// Импортируем глобальное состояние поиска
const {
  isSearchActive,
  searchQuery: globalSearchQuery,
  searchResults,
  isSearching,
  groupedResults,
  activateSearch,
  deactivateSearch,
  updateSearchResults,
  updateSearching
} = useGlobalSearch()

// Локальная переменная для поля ввода
const searchQuery = ref('')

// Проверяем, находимся ли на странице подстанций
const isSubstationsPage = computed(() => route.path === '/substations')

// Локальные переменные для управления отображением
const searchInput = ref<HTMLInputElement | null>(null)
let searchTimeout: NodeJS.Timeout | null = null

// Определяем текущую категорию на основе маршрута
const getCurrentCategory = () => {
  const path = route.path
  
  if (path.includes('/algorithms/')) {
    return 'algorithm'
  } else if (path.includes('/codifier/')) {
    return 'mkb'
  } else if (path.includes('/local-statuses/')) {
    return 'ls'
  } else if (path.includes('/drugs')) {
    return 'drug'
  } else if (path.includes('/substations')) {
    return 'substation'
  }
  
  return null
}

// Получаем название текущей категории
const getCurrentCategoryName = () => {
  const category = getCurrentCategory()
  const categoryNames: Record<string, string> = {
    'algorithm': 'Алгоритмы',
    'mkb': 'МКБ коды',
    'ls': 'Локальные статусы',
    'drug': 'Препараты',
    'substation': 'Подстанции'
  }
  return categoryNames[category || ''] || 'Результаты'
}

// Получаем метку типа для результатов
const getTypeLabel = (type: string) => {
  const typeLabels: Record<string, string> = {
    'algorithm': 'Алгоритм',
    'mkb': 'МКБ код',
    'ls': 'Локальный статус',
    'drug': 'Препарат',
    'substation': 'Подстанция'
  }
  return typeLabels[type] || 'Элемент'
}

// Обработчики поиска
const onSearchFocus = () => {
  const q = searchQuery.value.trim()
  // Если уже активен поиск и результаты есть, не запускаем поиск повторно по клику
  if (!q) return
  const totalResults = groupedResults.value.mkb.length + groupedResults.value.ls.length + groupedResults.value.algorithm.length + groupedResults.value.drug.length + groupedResults.value.substation.length
  if (!isSearchActive.value || totalResults === 0) {
    activateSearch(q)
    performSearch()
  } else {
    activateSearch(q) // только показать уже найденное
  }
}

const onSearchBlur = () => {
  // Не закрываем поиск при потере фокуса, чтобы пользователь мог кликать по результатам
}

const onSearchEnter = () => {
  if (searchResults.value.length > 0) {
    selectSearchResult(searchResults.value[0])
  }
}

const onSearchInput = () => {
  // Если мы на странице подстанций, отправляем событие для локального поиска
  if (isSubstationsPage.value) {
    // Отправляем событие на страницу подстанций для фильтрации
    window.dispatchEvent(new CustomEvent('substations-search', { 
      detail: { query: searchQuery.value } 
    }))
    return
  }
  
  // Обычная логика глобального поиска для других страниц
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.trim().length < 2) {
    deactivateSearch()
    return
  }
  
  searchTimeout = setTimeout(() => {
    activateSearch(searchQuery.value)
    performSearch()
  }, 300)
}

// Выполняем поиск
const performSearch = async () => {
  const query = searchQuery.value.trim()
  if (!query) return
  
  console.log('🔍 Starting search for:', query)
  updateSearching(true)
  
  try {
    // Загружаем данные для поиска
    const response = await $fetch('/api/search/all-data')
    console.log('📡 API response:', response)
    
    if (!response.success) {
      console.error('❌ API returned error:', response)
      return
    }
    
    const { data } = response as any
    console.log('📊 API data:', data)
    const allItems: any[] = []
    
    // Добавляем алгоритмы
    if (data.algorithms?.items && Array.isArray(data.algorithms.items)) {
      allItems.push(...data.algorithms.items.map((item: any) => ({ ...item, type: 'algorithm' })))
    }
    
    // Добавляем МКБ коды
    if (data.mkbCodes?.items && Array.isArray(data.mkbCodes.items)) {
      allItems.push(...data.mkbCodes.items.map((item: any) => ({ ...item, type: 'mkb' })))
    }
    
    // Добавляем локальные статусы
    if (data.localStatuses?.items && Array.isArray(data.localStatuses.items)) {
      allItems.push(...data.localStatuses.items.map((item: any) => ({ ...item, type: 'ls' })))
    }
    
    // Добавляем препараты
    if (data.drugs?.items && Array.isArray(data.drugs.items)) {
      allItems.push(...data.drugs.items.map((item: any) => ({ ...item, type: 'drug' })))
    }
    
    // Добавляем подстанции
    if (data.substations?.items && Array.isArray(data.substations.items)) {
      allItems.push(...data.substations.items.map((item: any) => ({ ...item, type: 'substation' })))
    }
    
    console.log('📋 Total items for search:', allItems.length)
    
    // Используем Fuse.js для поиска
    const { search } = useFuseSearch()
    const fuseResults = search(allItems, query)
    console.log('🔍 Fuse results:', fuseResults.length)
    
    // Группируем результаты по типам
    const grouped: Record<string, any[]> = {
      mkb: [],
      ls: [],
      algorithm: [],
      drug: [],
      substation: []
    }
    
    fuseResults.forEach(result => {
      if (grouped[result.type]) {
        grouped[result.type].push(result)
      }
    })
    
    console.log('📊 Grouped results:', grouped)
    updateSearchResults(fuseResults, grouped)
    console.log('✅ Search completed, results updated')
    
  } catch (error) {
    console.error('❌ Ошибка поиска:', error)
  } finally {
    updateSearching(false)
  }
}

// Выбираем результат поиска
const selectSearchResult = (result: any) => {
  let url = ''
  
  switch (result.type) {
    case 'algorithm':
      url = `/algorithms/${result.section}/${result.category?.url}/${result._id}`
      break
    case 'mkb':
      url = `/codifier/${result.category?.url}?id=${result._id}`
      break
    case 'ls':
      url = `/local-statuses/${result.category?.url}?id=${result._id}`
      break
    case 'drug':
      url = `/drugs?id=${result._id}`
      break
    case 'substation':
      url = `/substations?select=${encodeURIComponent(result.name)}`
      break
  }
  
  if (url) {
    deactivateSearch()
    navigateTo(url)
  }
}

// Функция для обрезки текста до приблизительного количества строк
const truncateToApproximateLines = (text: string, maxLines: number = 3) => {
  if (!text) return ''
  
  // Примерно 60-70 символов на строку для текста размера text-sm
  const charsPerLine = 65
  const maxChars = maxLines * charsPerLine
  
  if (text.length <= maxChars) return text
  
  // Находим последний пробел перед лимитом, чтобы не обрезать слово
  let cutIndex = maxChars
  while (cutIndex > 0 && text[cutIndex] !== ' ' && text[cutIndex] !== '.' && text[cutIndex] !== ',') {
    cutIndex--
  }
  
  // Если не нашли подходящее место для обрезки, обрезаем по лимиту
  if (cutIndex < maxChars * 0.8) {
    cutIndex = maxChars
  }
  
  return text.slice(0, cutIndex) + '...'
}

// Получаем дополнительную информацию для результата
const getResultDetails = (result: any) => {
  switch (result.type) {
    case 'mkb':
      return {
        codes: result.codes?.mkbCode ? `МКБ: ${result.codes.mkbCode}` : null,
        description: result.description || result.data?.note || result.data?.description
      }
    case 'ls':
      return {
        description: result.description || result.data?.description || result.data?.note,
        localis: result.localis
      }
    case 'algorithm':
      return {
        description: result.description,
        category: result.category?.name
      }
    case 'drug':
      return {
        description: result.description,
        latinName: result.data?.latinName,
        synonyms: result.data?.synonyms,
        analogs: result.data?.analogs,
        groups: result.data?.groups
      }
    case 'substation':
      return {
        description: result.description,
        address: result.data?.address,
        phones: result.data?.phones
      }
    default:
      return {
        description: result.description
      }
  }
}

// Очищаем поиск
const clearSearch = () => {
  searchQuery.value = ''
  
  // Если мы на странице подстанций, отправляем событие для очистки поиска
  if (isSubstationsPage.value) {
    window.dispatchEvent(new CustomEvent('substations-search', { 
      detail: { query: '' } 
    }))
    return
  }
  
  // Обычная логика для других страниц
  deactivateSearch()
}

// Экспортируем переменные и функции для использования в template
defineExpose({
  searchQuery,
  isSearchActive,
  searchResults,
  groupedResults,
  getCurrentCategoryName,
  getTypeLabel,
  getResultDetails,
  truncateToApproximateLines,
  selectSearchResult,
  clearSearch,
  onSearchFocus,
  onSearchBlur,
  onSearchEnter,
  onSearchInput
})
</script>
