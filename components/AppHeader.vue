<template>
  <header class="transition-colors duration-300 relative z-50">
    <div class="w-full max-w-5xl mx-auto px-2 md:px-4 py-4 mdpy-6">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0 transition-all duration-700 ease-in-out"
          :class="{ 'hidden md:flex': isSearchExpanded || isSearchActive }">
          <div class="relative">
            <!-- Логотип (крутится при реактивной навигации) -->
            <UTooltip 
              text="Для открытия меню" 
              :kbds="['ПКМ']" 
              arrow 
              :delay-duration="0"
              v-model:open="logoTooltipOpen"
              :ui="{ content: 'tooltip-logo' }"
            >
              <img ref="logoRef" :src="logoUrl" alt="Логотип"
                class="h-9 w-9 cursor-pointer transition-all duration-700 ease-in-out" :class="{
                  'scale-110': dropdownMenuOpen,
                  'animate-spin': isContentLoading
                }" @click="navigateToHome" @contextmenu.prevent="openDropdownMenu" />
            </UTooltip>

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
                      class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
                      class="flex items-center gap-3 px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer w-full text-left">
                      <UIcon name="i-heroicons-arrow-left" class="w-5 h-5" />
                      <span>Назад</span>
                    </button>

                    <!-- Элементы подменю -->
                    <div v-for="item in currentSubmenuItems" :key="item.to"
                      class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
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
        <div class="flex-1 flex items-center gap-2">
          <div class="relative flex-1">
            <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg class="h-6 w-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
            <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Введите запрос для поиска..."
              :class="[
                'block w-full pl-11 pr-11 py-4 outline-none focus:outline-none focus:ring-0 focus:border-slate-300 dark:focus:border-slate-500 hover:shadow-sm focus:shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-700 ease-in-out rounded-lg'
              ]" @input="onSearchInput" @focus="onSearchFocus" @blur="onSearchBlur"
              @keydown.enter.prevent="onSearchEnter" @keyup="onSearchKeyup" @keydown="onSearchKeydown"
              @change="onSearchChange" @paste="onSearchPaste" @compositionstart="onSearchCompositionStart"
              @compositionend="onSearchCompositionEnd" @touchstart="onSearchTouchStart" @touchend="onSearchTouchEnd">

            <!-- Кнопка очистки внутри инпута -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
              <button v-if="searchQuery || isSearchActive" @click="clearSearch"
                class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-200 cursor-pointer"
                aria-label="Очистить поиск">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>

          <!-- Кнопка поиска на мобильных - за пределами инпута -->
          <button v-if="isMobile && (isSearchExpanded || isSearchActive)" @click="performSearch"
            class="inline-flex items-center justify-center px-4 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Выполнить поиск">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </button>
        </div>

        <div class="flex items-center space-x-3 sm:space-x-4 relative transition-all duration-700 ease-in-out"
          :class="{ 'hidden md:flex': isSearchExpanded || isSearchActive }">

          <!-- Профиль: выпадающее меню (мобайл + десктоп) -->
          <ClientOnly>
            <div class="relative flex items-center" ref="profileRef">
              <button @click="toggleMenu"
                class="shrink-0 h-10 w-10 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer transition-all duration-700 ease-in-out">
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
                  <NuxtLink to="/profile"
                    class="flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    @click="menuOpen = false">
                    <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 text-slate-500" />
                    <span>Смены</span>
                  </NuxtLink>
                  <NuxtLink to="/profile/bookmarks"
                    class="flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    @click="menuOpen = false">
                    <UIcon name="i-heroicons-bookmark" class="w-4 h-4 text-slate-500" />
                    <span>Закладки</span>
                  </NuxtLink>
                  <NuxtLink to="/profile/settings"
                    class="flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    @click="menuOpen = false">
                    <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-slate-500" />
                    <span>Настройки</span>
                  </NuxtLink>
                  <div
                    class="flex items-center justify-between px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                    <span>Тёмная тема</span>
                    <USwitch :model-value="isDark" @update:model-value="onToggleTheme" size="sm" color="neutral" />
                  </div>
                  <NuxtLink v-if="user?.role === 'admin'" to="/admin"
                    class="block px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    @click="menuOpen = false">Админка</NuxtLink>
                  <button @click="menuOpen = false; logout()"
                    class="w-full text-left px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer">Выйти</button>
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
import { watch, onMounted, onUnmounted, computed } from 'vue'
import { useSearchCache } from '~/composables/useSearchCache'

const props = withDefaults(defineProps<{ title?: string }>(), { title: 'Справочник СМП' })
const route = useRoute()
const { user, logout } = useAuth()
const { isDark, toggleTheme } = useTheme()
const title = computed(() => props.title || 'Справочник СМП')

// Получаем состояние загрузки контента для крутящегося логотипа
const isContentLoading = inject('isContentLoading', ref(false))

// Состояние tooltip логотипа с кешированием
const logoTooltipOpen = ref(false)

// Проверяем кеш при загрузке компонента
onMounted(() => {
  if (process.client) {
    const cachedState = localStorage.getItem('logo-tooltip-closed')
    // Показываем tooltip только если он еще не был закрыт
    logoTooltipOpen.value = cachedState !== 'true'
    
    // Автоматически закрываем через 5 секунд, если пользователь не закрыл вручную
    if (logoTooltipOpen.value) {
      setTimeout(() => {
        if (logoTooltipOpen.value) {
          closeLogoTooltip()
        }
      }, 5000)
    }
  }
})

// Функция закрытия tooltip с сохранением в кеш
const closeLogoTooltip = () => {
  logoTooltipOpen.value = false
  if (process.client) {
    localStorage.setItem('logo-tooltip-closed', 'true')
  }
}

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
  updateSearching,
  updateCacheStatus
} = useGlobalSearch()

// Импортируем кеш поиска
const { getSearchData, getCacheInfo } = useSearchCache()

// Импортируем историю поисков
const { addToHistory } = useSearchHistory()

// Локальная переменная для поля ввода
const searchQuery = ref('')
const lastSearchValue = ref('')
const isComposing = ref(false)
const isSearchExpanded = ref(false)
const isMobile = ref(false)
const isDataFromCache = ref(false)

// Обновляем состояние мобильного устройства
const updateMobileState = () => {
  isMobile.value = window.innerWidth <= 768
}

// Инициализируем состояние мобильного устройства
onMounted(() => {
  updateMobileState()
  window.addEventListener('resize', updateMobileState)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateMobileState)
})

// Следим за изменениями маршрута и сбрасываем состояние поиска
watch(() => route.path, () => {
  // При переходе на новую страницу сбрасываем состояние поиска
  isSearchExpanded.value = false
  searchQuery.value = ''
  deactivateSearch()
})

// Следим за состоянием активности поиска и управляем внешним видом поля
watch(isSearchActive, (newValue) => {
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    // Если поиск стал неактивным, сворачиваем поле
    if (!newValue) {
      isSearchExpanded.value = false
    }
  }
})

// Синхронизируем глобальное состояние поиска с локальным инпутом
watch(globalSearchQuery, (newQuery) => {
  if (newQuery !== searchQuery.value) {
    searchQuery.value = newQuery
  }
})

// Отдельный watcher для выполнения поиска после заполнения инпута
watch(searchQuery, (newQuery) => {
  // Выполняем поиск только если это изменение пришло из истории поиска
  if (newQuery && newQuery.trim().length >= 2 && isSearchActive.value) {
    // Небольшая задержка, чтобы инпут успел отрендериться
    setTimeout(() => {
      performSearch()
    }, 10)
  }
})

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

  // На странице подстанций не активируем глобальный поиск
  if (isSubstationsPage.value) {
    return
  }

  // На мобильных устройствах расширяем строку поиска
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    isSearchExpanded.value = true
  }

  // Активируем поиск при фокусе
  if (!isSearchActive.value) {
    activateSearch(q)
  }

  // На мобильных устройствах выполняем поиск сразу при фокусе, если есть запрос
  if (isMobile && q && q.length >= 2) {
    performSearch()
  }
}

const onSearchBlur = () => {
  // На странице подстанций не деактивируем поиск
  if (isSubstationsPage.value) {
    return
  }

  // На мобильных устройствах управляем состоянием поля поиска
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    // Если поиск не активен, сворачиваем поле
    if (!isSearchActive.value) {
      isSearchExpanded.value = false
    }
  }

  // Убираем логику автоматического закрытия поиска при потере фокуса
  // Поиск теперь закрывается только при нажатии на кнопку очистки
}

const onSearchEnter = () => {
  if (searchResults.value.length > 0) {
    selectSearchResult(searchResults.value[0])
  }
}

const onSearchInput = () => {
  lastSearchValue.value = searchQuery.value

  // На мобильных устройствах выполняем поиск сразу
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    handleSearchInput()
    return
  }

  // На десктопе проверяем композицию
  if (!isComposing.value) {
    handleSearchInput()
  }
}

const onSearchKeyup = () => {
  // На мобильных устройствах выполняем поиск сразу
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    handleSearchInput()
    return
  }

  // На десктопе обычная логика
  handleSearchInput()
}

const onSearchChange = () => {
  const currentValue = searchQuery.value

  // Проверяем, действительно ли изменилось значение
  if (currentValue !== lastSearchValue.value) {
    lastSearchValue.value = currentValue

    // На мобильных устройствах выполняем поиск сразу
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      handleSearchInput()
      return
    }

    // На десктопе обычная логика
    handleSearchInput()
  }
}

const onSearchPaste = () => {

  // При вставке текста делаем поиск сразу
  setTimeout(() => {
    lastSearchValue.value = searchQuery.value

    // На мобильных устройствах выполняем поиск сразу
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      handleSearchInput()
      return
    }

    // На десктопе обычная логика
    handleSearchInput()
  }, 10)
}

const onSearchCompositionStart = () => {
  // Начало ввода с помощью IME (для мобильных устройств)
  isComposing.value = true
}

const onSearchCompositionEnd = () => {
  // Конец ввода с помощью IME
  isComposing.value = false
  lastSearchValue.value = searchQuery.value

  // На мобильных устройствах выполняем поиск сразу
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    handleSearchInput()
    return
  }

  // На десктопе обычная логика
  handleSearchInput()
}

const handleSearchInput = () => {
  // Если мы на странице подстанций, отправляем событие для локального поиска
  if (isSubstationsPage.value) {
    // Отправляем событие на страницу подстанций для фильтрации
    window.dispatchEvent(new CustomEvent('substations-search', {
      detail: { query: searchQuery.value }
    }))
    return
  }

  const query = searchQuery.value.trim()
  const isMobile = window.innerWidth <= 768


  // Если запрос слишком короткий
  if (query.length < 2) {
    searchResults.value = []
    groupedResults.value = {
      mkb: [],
      ls: [],
      algorithm: [],
      drug: [],
      substation: []
    }
    return
  }

  // На мобильных устройствах - мгновенный поиск без задержек
  if (isMobile) {
    activateSearch(query)
    performSearch()
    return
  }

  // На десктопе - debounce
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    activateSearch(query)
    performSearch()
  }, 300)
}

// Простой реактивный поиск
const performSimpleSearch = (allItems: any[], query: string) => {
  const queryLower = query.toLowerCase().trim()
  const queryWords = queryLower.split(/\s+/).filter(word => word.length >= 2)


  const results: any[] = []

  for (const item of allItems) {
    const title = (item.title || item.name || '').toLowerCase()
    const description = (item.description || item.note || '').toLowerCase()
    const latinName = (item.latinName || '').toLowerCase()
    const synonyms = (item.synonyms || []).join(' ').toLowerCase()
    const content = (item.content || '').toLowerCase()


    // Проверяем точное совпадение в названии
    if (title.includes(queryLower)) {
      results.push({ ...item, score: 0.1, searchType: 'exact-title' })
      continue
    }

    // Проверяем совпадение в латинском названии
    if (latinName.includes(queryLower)) {
      results.push({ ...item, score: 0.2, searchType: 'latin-name' })
      continue
    }

    // Проверяем совпадение в синонимах
    if (synonyms.includes(queryLower)) {
      results.push({ ...item, score: 0.3, searchType: 'synonyms' })
      continue
    }

    // Проверяем совпадение всех слов запроса
    const allWordsMatch = queryWords.every(word =>
      title.includes(word) ||
      description.includes(word) ||
      latinName.includes(word) ||
      synonyms.includes(word) ||
      content.includes(word)
    )

    if (allWordsMatch) {
      // Подсчитываем количество совпавших слов
      const matchedWords = queryWords.filter(word =>
        title.includes(word) ||
        description.includes(word) ||
        latinName.includes(word) ||
        synonyms.includes(word) ||
        content.includes(word)
      )

      const score = 0.4 + (matchedWords.length / queryWords.length) * 0.3
      results.push({ ...item, score, searchType: 'word-match' })
    } else {
      // Для препаратов проверяем частичные совпадения
      if (item.type === 'drug') {
        const hasPartialMatch = queryWords.some(word =>
          title.includes(word) ||
          description.includes(word) ||
          latinName.includes(word) ||
          synonyms.includes(word)
        )

        if (hasPartialMatch) {
          const matchedWords = queryWords.filter(word =>
            title.includes(word) ||
            description.includes(word) ||
            latinName.includes(word) ||
            synonyms.includes(word)
          )

          const score = 0.6 + (matchedWords.length / queryWords.length) * 0.2
          results.push({ ...item, score, searchType: 'partial-match' })
        }
      }
    }
  }

  // Сортируем по score
  results.sort((a, b) => a.score - b.score)

  return results
}

// Выполняем поиск
const performSearch = async () => {
  // Проверяем, что мы на клиенте
  if (!process.client) return

  const query = searchQuery.value.trim()
  if (!query) return

  // Проверяем, находимся ли в Android приложении
  const isAndroidApp = process.client && window.Capacitor && window.Capacitor.isNativePlatform()
  console.log('🔍 Search: Android app detected:', isAndroidApp)
  console.log('🔍 Search: Query:', query)

  updateSearching(true)

  try {
    // Очищаем кэш предзагрузки для поиска
    if (process.client) {
      const { clearCache } = usePreloader()
      clearCache()
    }

    // Используем кеш для загрузки данных
    let allItems: any[] = []

    try {
      // Пытаемся получить данные из кеша или API
      console.log('🔍 Search: Загружаем данные для поиска...')
      const searchData = await getSearchData()

      if (!searchData) {
        console.error('❌ Не удалось загрузить данные для поиска')
        return
      }

      // Преобразуем данные в нужный формат
      if (Array.isArray(searchData)) {
        allItems = searchData.map((item: any) => ({
          ...item,
          type: item.type || 'unknown'
        }))
      } else {
        // Если данные в формате объекта, преобразуем их
        allItems = []
        const data = searchData as any
        if (data.algorithms?.items && Array.isArray(data.algorithms.items)) {
          allItems.push(...data.algorithms.items.map((item: any) => ({ ...item, type: 'algorithm' })))
        }
        if (data.mkbCodes?.items && Array.isArray(data.mkbCodes.items)) {
          allItems.push(...data.mkbCodes.items.map((item: any) => ({ ...item, type: 'mkb' })))
        }
        if (data.localStatuses?.items && Array.isArray(data.localStatuses.items)) {
          allItems.push(...data.localStatuses.items.map((item: any) => ({ ...item, type: 'ls' })))
        }
        if (data.drugs?.items && Array.isArray(data.drugs.items)) {
          allItems.push(...data.drugs.items.map((item: any) => ({ ...item, type: 'drug' })))
        }
        if (data.substations?.items && Array.isArray(data.substations.items)) {
          allItems.push(...data.substations.items.map((item: any) => ({ ...item, type: 'substation' })))
        }
      }

      // Проверяем, были ли данные загружены из кеша
      const cacheInfo = getCacheInfo()
      const fromCache = cacheInfo.cachedData !== null
      updateCacheStatus(fromCache)

      console.log('📋 Данные загружены из кеша/API:', allItems.length, 'элементов',
        fromCache ? '(из кеша)' : '(из API)')

    } catch (error) {
      console.error('❌ Ошибка при загрузке данных:', error)

      // Fallback: используем отдельные API endpoints
      console.log('🔄 Используем fallback API endpoints...')
      const [mkbData, lsResults, algoResults, drugResults, substationResults] = await Promise.all([
        $fetch('/api/mkb/all').catch(() => ({ success: true, items: [] })),
        $fetch('/api/local-statuses/all').catch(() => ({ success: true, items: [] })),
        $fetch('/api/algorithms/all').catch(() => ({ success: true, items: [] })),
        $fetch('/api/drugs/all').catch(() => ({ success: true, items: [] })),
        $fetch('/api/substations/all').catch(() => ({ success: true, items: [] }))
      ])

      // Собираем данные из fallback endpoints
      allItems = []

      if (mkbData?.success && 'items' in mkbData && Array.isArray((mkbData as any).items)) {
        allItems.push(...(mkbData as any).items.map((item: any) => ({ ...item, type: 'mkb' })))
      }
      if (lsResults?.success && 'items' in lsResults && Array.isArray((lsResults as any).items)) {
        allItems.push(...(lsResults as any).items.map((item: any) => ({ ...item, type: 'ls' })))
      }
      if (algoResults?.success && 'items' in algoResults && Array.isArray((algoResults as any).items)) {
        allItems.push(...(algoResults as any).items.map((item: any) => ({ ...item, type: 'algorithm' })))
      }
      if (drugResults?.success && 'items' in drugResults && Array.isArray((drugResults as any).items)) {
        allItems.push(...(drugResults as any).items.map((item: any) => ({ ...item, type: 'drug' })))
      }
      if (substationResults?.success && 'items' in substationResults && Array.isArray((substationResults as any).items)) {
        allItems.push(...(substationResults as any).items.map((item: any) => ({ ...item, type: 'substation' })))
      }

      console.log('📡 Fallback API загружен:', allItems.length, 'элементов')
    }

    // Отладочная информация о типах данных
    const typeCounts = allItems.reduce((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    console.log('📊 Items by type:', typeCounts)

    // Показываем примеры каждого типа
    Object.keys(typeCounts).forEach(type => {
      const sample = allItems.find(item => item.type === type)
      if (sample) {
        console.log(`📝 Sample ${type}:`, {
          title: sample.title || sample.name,
          description: sample.description || sample.note,
          _id: sample._id
        })
      }
    })

    // Всегда используем Fuse.js для более точного поиска
    const { search } = useFuseSearch()
    const fuseResults = search(allItems, query)

    let finalResults: any[] = fuseResults

    // Если Fuse.js ничего не нашел, пробуем простой поиск как fallback
    if (fuseResults.length === 0) {
      const simpleResults = performSimpleSearch(allItems, query)
      if (simpleResults.length > 0) {
        console.log('✅ Using simple search results:', simpleResults.length)
        finalResults = simpleResults
      }
    }

    // Группируем результаты по типам
    const grouped: Record<string, any[]> = {
      mkb: [],
      ls: [],
      algorithm: [],
      drug: [],
      substation: []
    }

    finalResults.forEach(result => {
      if (grouped[result.type]) {
        grouped[result.type].push(result)
      }
    })

    console.log('📊 Grouped results:', grouped)
    updateSearchResults(finalResults, grouped)
    
    // Добавляем запрос в историю поисков
    addToHistory(query)
    
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

  // На мобильных устройствах сворачиваем строку поиска
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    isSearchExpanded.value = false
  }

  // Если мы на странице подстанций, отправляем событие для очистки поиска
  if (isSubstationsPage.value) {
    window.dispatchEvent(new CustomEvent('substations-search', {
      detail: { query: '' }
    }))
  }

  // Всегда деактивируем поиск для скрытия панели результатов
  deactivateSearch()
}

// Дополнительные обработчики для мобильных устройств
const onSearchKeydown = () => {
  // Обрабатываем нажатия клавиш для мобильных устройств
  if (!isComposing.value) {
    handleSearchInput()
  }
}

const onSearchTouchStart = () => {
  // Активируем поиск при касании, если он еще не активен
  if (!isSearchActive.value && !isSubstationsPage.value) {
    activateSearch(searchQuery.value.trim())
  }
}

const onSearchTouchEnd = () => {
  // Небольшая задержка для обработки изменений
  setTimeout(() => {
    if (lastSearchValue.value !== searchQuery.value) {
      lastSearchValue.value = searchQuery.value
      handleSearchInput()
    }
  }, 50)
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
  onSearchInput,
  onSearchKeyup,
  onSearchKeydown,
  onSearchChange,
  onSearchPaste,
  onSearchCompositionStart,
  onSearchCompositionEnd,
  onSearchTouchStart,
  onSearchTouchEnd
})
</script>

<style scoped>
/* Увеличиваем размер текста в tooltip логотипа */
:deep(.tooltip-logo .tooltip-content) {
  font-size: 14px !important;
  line-height: 1.4 !important;
  padding: 8px 12px !important;
}

/* Увеличиваем размер клавиш в tooltip */
:deep(.tooltip-logo .tooltip-kbds) {
  font-size: 12px !important;
}
</style>
