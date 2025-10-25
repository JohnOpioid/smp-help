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
                class="absolute -top-2 -left-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-xl z-100 min-w-80 backdrop-blur-sm"
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
          <div class="flex content-center relative flex-1 rounded-lg overflow-hidden hover:shadow-sm focus:shadow-sm ">
            <div class="pr-2 pl-4 flex items-center" :class="{ 'pointer-events-none': !isSearchActive }">
              <!-- Иконка лупы или стрелка назад -->
              <svg v-if="!isSearchActive" class="h-6 w-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
              <!-- Иконка стрелки назад (активна при поиске) -->
              <button v-else @click="hideSearch" 
                class="h-6 w-6 text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors duration-200 cursor-pointer"
                aria-label="Скрыть поиск">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </button>
            </div>
            <UInput ref="searchInput" v-model="searchQuery" type="text" placeholder="Начните поиск"
              :class="[
                'block w-full pr-11 py-4 outline-none focus:outline-none focus:ring-0 focus:border-slate-300 dark:focus:border-slate-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-700 ease-in-out'
              ]" @input="onSearchInput" @focus="onSearchFocus" @blur="onSearchBlur"
              @keydown.enter.prevent="onSearchEnter" @keyup="onSearchKeyup" @keydown="onSearchKeydown"
              @change="onSearchChange" @paste="onSearchPaste" @compositionstart="onSearchCompositionStart"
              @compositionend="onSearchCompositionEnd" @touchstart="onSearchTouchStart" @touchend="onSearchTouchEnd" />

            <!-- Кнопка очистки внутри инпута -->
            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
              <!-- Кнопка очистки (показывается только при заполненном инпуте) -->
              <button v-if="searchQuery && searchQuery.length > 0" @click="clearSearchInput"
                class="inline-flex items-center justify-center h-8 w-8 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-200 cursor-pointer"
                aria-label="Очистить поиск">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </button>
            </div>
          </div>
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
                    class="flex items-center justify-between px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    @click="menuOpen = false">
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

const props = withDefaults(defineProps<{ title?: string }>(), { title: 'Справочник СМП' })
const route = useRoute()
const { user, logout, clearAuth } = useAuth()
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
  
  const { data: meData, error: meError } = useFetch('/api/auth/me', opts)
  
  watch(meData, (val) => {
    if (val && typeof val === 'object' && 'user' in val && val.user) {
      user.value = val.user as any
    }
  }, { immediate: true })
  
  // Обрабатываем ошибки авторизации
  watch(meError, (error) => {
    if (error && process.client) {
      console.error('Auth error:', error)
      // Если ошибка авторизации, очищаем данные и перенаправляем
      if (error.statusCode === 401) {
        clearAuth()
        navigateTo('/auth/login')
      }
    }
  }, { immediate: true })
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
  // Очищаем таймаут поиска
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
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
  searchQuery,
  searchResults,
  isSearching,
  groupedResults,
  orderedSections,
  activateSearch,
  deactivateSearch,
  hideSearch: globalHideSearch,
  hideSearchOnly,
  updateSearchResults,
  updateSearching,
  updateCacheStatus,
  updateSearchQuery,
  performServerSearch,
  clearSearchTimeout
} = useGlobalSearch()

// Импортируем историю поисков
const { addToHistory } = useSearchHistory()

// Синхронизируем локальный searchQuery с глобальным состоянием
watch(searchQuery, (newValue) => {
  // Не вызываем updateSearchQuery при инициализации с пустым значением
  if (newValue !== '') {
    updateSearchQuery(newValue)
  }
}, { immediate: false })
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
  // При переходе на новую страницу сбрасываем только состояние поиска, но НЕ очищаем запрос
  isSearchExpanded.value = false
  // НЕ очищаем searchQuery.value - оставляем текст в инпуте
  hideSearchOnly()
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

// Отдельный watcher для выполнения поиска после заполнения инпута
watch(searchQuery, (newQuery, oldQuery) => {
  // Проверяем, что значение действительно изменилось
  if (newQuery === oldQuery) return
  
  // Очищаем предыдущий таймаут
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // Определяем мобильное устройство
  const isMobile = process.client && (
    window.innerWidth <= 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
  
  // На странице подстанций поиск начинается с 1 символа
  if (isSubstationsPage.value) {
    if (!newQuery || newQuery.trim().length === 0) {
      // Очищаем локальный поиск
      window.dispatchEvent(new CustomEvent('substations-search', {
        detail: { query: '' }
      }))
      return
    } else {
      // Выполняем локальный поиск с любым количеством символов
      window.dispatchEvent(new CustomEvent('substations-search', {
        detail: { query: newQuery.trim() }
      }))
      return
    }
  }
  
  // Для остальных страниц поиск начинается с 3 символов
  if (!newQuery || newQuery.trim().length < 3) {
    
    // Очищаем результаты, но НЕ закрываем панель поиска
    if (isSearchActive.value) {
      // Очищаем только результаты, панель остается открытой
      searchResults.value = []
      groupedResults.value = {
        mkb: [],
        ls: [],
        algorithm: [],
        drug: [],
        substation: []
      }
    }
    return
  }
  
  // Активируем поиск если он еще не активен
  if (!isSearchActive.value) {
    activateSearch(newQuery)
  }
  
  // Устанавливаем дебаунс - поиск запустится только после паузы в вводе
  searchTimeout = setTimeout(() => {
    performServerSearch(newQuery.trim(), 0) // Без дополнительной задержки
  }, 500) // 500ms дебаунс
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
  // Проверяем, что searchQuery.value является строкой
  const queryValue = searchQuery.value
  if (typeof queryValue !== 'string') {
    console.error('🔍 onSearchFocus: searchQuery.value is not a string:', queryValue, typeof queryValue)
    return
  }
  
  const q = queryValue.trim()

  // На странице подстанций не активируем глобальный поиск
  if (isSubstationsPage.value) {
    // На странице подстанций просто расширяем строку поиска на мобильных
    const isMobile = window.innerWidth <= 768
    if (isMobile) {
      isSearchExpanded.value = true
    }
    return
  }

  // На мобильных устройствах расширяем строку поиска
  const isMobile = window.innerWidth <= 768
  if (isMobile) {
    isSearchExpanded.value = true
  }

  // Активируем поиск при фокусе если инпут пустой ИЛИ если есть текст но поиск неактивен
  if (!isSearchActive.value) {
    // Активируем поиск только если есть текст в инпуте
    if (q && q.length > 0) {
      activateSearch(q)
      
      // Если есть текст в инпуте, выполняем поиск
      if (q.length >= 3) {
        performServerSearch(q, 0)
      }
    } else {
      // Если инпут пустой, просто активируем панель поиска
      activateSearch('')
    }
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
  // Обновляем значение
  lastSearchValue.value = searchQuery.value
  
  // Убираем прямой вызов поиска - watcher сам обработает с дебаунсом
}

const onSearchInputMobile = () => {
  // Просто обновляем значение, watcher сам обработает поиск
  lastSearchValue.value = searchQuery.value
}

const onSearchKeyup = () => {
  // Обновляем значение
  lastSearchValue.value = searchQuery.value
  
  // Убираем прямой вызов поиска - watcher сам обработает с дебаунсом
}

const onSearchChange = () => {
  const currentValue = searchQuery.value

  // Проверяем, действительно ли изменилось значение
  if (currentValue !== lastSearchValue.value) {
    lastSearchValue.value = currentValue
  }
}

const onSearchPaste = () => {
  // При вставке текста обновляем значение
  setTimeout(() => {
    lastSearchValue.value = searchQuery.value
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
  // Определяем мобильное устройство более надежным способом
  const isMobile = process.client && (
    window.innerWidth <= 768 || 
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )

  // Если запрос слишком короткий
  if (query.length < 3) {
    // Очищаем результаты для коротких запросов
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

  // Активируем поиск
  if (!isSearchActive.value) {
    activateSearch(query)
  }

  // Убираем прямой вызов поиска - watcher сам обработает с дебаунсом
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

// Очищаем только инпут и результаты поиска (не закрываем панель)
const clearSearchInput = () => {
  searchQuery.value = ''

  // Очищаем таймер поиска
  clearSearchTimeout()
  
  // Очищаем кэш localStorage
  if (process.client) {
    try {
      localStorage.removeItem('searchCache')
      localStorage.removeItem('searchQuery')
    } catch (error) {
      // Игнорируем ошибки localStorage
    }
  }
  
  // Очищаем результаты поиска, но НЕ деактивируем поиск
  const emptyGrouped = {
    mkb: [],
    ls: [],
    algorithm: [],
    drug: [],
    substation: []
  }
  updateSearchResults([], emptyGrouped, [])
  updateSearching(false)
  updateCacheStatus(false)
  
  // Очищаем группированные результаты
  groupedResults.value = emptyGrouped
  orderedSections.value = []
  
  // Если мы на странице подстанций, отправляем событие для очистки локального поиска
  if (isSubstationsPage.value) {
    window.dispatchEvent(new CustomEvent('substations-search', {
      detail: { query: '' }
    }))
  }
}

// Очищаем поиск полностью (закрываем панель)
const clearSearch = () => {
  searchQuery.value = ''

  // Очищаем таймер поиска
  clearSearchTimeout()
  
  // Очищаем результаты поиска
  deactivateSearch()

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

// Скрываем поиск (не очищаем инпут)
const hideSearch = () => {
  // Используем глобальную функцию hideSearch
  globalHideSearch()

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
}

// Дополнительные обработчики для мобильных устройств
const onSearchKeydown = () => {
  // Логика поиска теперь обрабатывается в watcher для searchQuery
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
  clearSearchInput,
  hideSearch,
  onSearchFocus,
  onSearchBlur,
  onSearchEnter,
  onSearchInput,
  onSearchInputMobile,
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

/* Стили для инпута поиска в шапке - убираем обводку и border */
.flex-1.rounded-lg.overflow-hidden :deep(.ui-input input),
.flex-1.rounded-lg.overflow-hidden :deep(input[type="text"]) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  ring: none !important;
  border-width: 0 !important;
  border-style: none !important;
  border-color: transparent !important;
}

.flex-1.rounded-lg.overflow-hidden :deep(.ui-input input:focus),
.flex-1.rounded-lg.overflow-hidden :deep(input[type="text"]:focus) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  ring: none !important;
  --tw-ring-width: 0 !important;
  --tw-ring-color: transparent !important;
}

.flex-1.rounded-lg.overflow-hidden :deep(.ui-input input:hover),
.flex-1.rounded-lg.overflow-hidden :deep(input[type="text"]:hover) {
  border: none !important;
  box-shadow: none !important;
  outline: none !important;
  ring: none !important;
}

/* Убираем padding у UInput */
:deep(.ui-input input),
:deep(input[type="text"]) {
  padding: 0 !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  padding-left: 0 !important;
  padding-right: 0 !important;
}

/* Убеждаемся, что иконка поиска видна */
.relative .absolute {
  z-index: 10 !important;
}

/* Дополнительные стили для иконки поиска */
.relative .absolute svg {
  z-index: 11 !important;
  position: relative !important;
}

/* Убеждаемся, что иконка поиска всегда видна */
.absolute.inset-y-0.left-0 {
  z-index: 20 !important;
}

.absolute.inset-y-0.left-0 svg {
  z-index: 21 !important;
  position: relative !important;
  display: block !important;
  visibility: visible !important;
}

/* Центрируем только плейсхолдер, текст ввода - слева */
:deep(.ui-input input),
:deep(input[type="text"]) {
  text-align: left !important;
  font-size: 16px !important; /* Увеличиваем размер текста */
  border-radius: 0 !important; /* Прямые углы у инпута */
  background-color: transparent !important; /* Прозрачный фон */
}

:deep(.ui-input input::placeholder),
:deep(input[type="text"]::placeholder) {
  text-align: center !important;
  font-size: 16px !important; /* Увеличиваем размер плейсхолдера */
}

/* При фокусе скрываем плейсхолдер */
:deep(.ui-input input:focus::placeholder),
:deep(input[type="text"]:focus::placeholder) {
  opacity: 0 !important;
  visibility: hidden !important;
}

/* Стили для родительского контейнера поиска */
.relative.flex-1.rounded-lg {
  background-color: white;
  transition: box-shadow 0.2s ease-in-out;
}

.relative.flex-1.rounded-lg:hover,
.relative.flex-1.rounded-lg:focus-within {
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
}

.dark .relative.flex-1.rounded-lg {
  background-color: #1e293b; /* slate-800 */
}
</style>
