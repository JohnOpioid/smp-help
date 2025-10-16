<template>
  <header class="bg-white dark:bg-slate-800 transition-colors duration-300 relative z-50 border-b border-slate-100 dark:border-slate-700">
    <div class="w-full px-4 sm:px-6 lg:px-8 py-4 md:py-2">
      <div class="flex items-center justify-between gap-3">
        <div class="flex items-center gap-2 min-w-0">
          <button
            v-if="showBack"
            @click="goBack"
            class="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 cursor-pointer"
            aria-label="Назад"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <NuxtLink to="/" class="shrink-0 flex items-center gap-2 cursor-pointer" aria-label="На главную">
            <img :src="logoUrl" alt="Логотип" class="h-7 w-7" />
          </NuxtLink>
          <h1 class="truncate text-base font-semibold uppercase tracking-wide text-slate-600 dark:text-white leading-tight">{{ currentTitle }}</h1>
        </div>

        <div class="flex items-center space-x-3 sm:space-x-4 relative">
          <!-- Навигационное меню (Nuxt UI) -->
          <div class="hidden md:flex items-center">
            <ClientOnly>
              <UNavigationMenu
                :items="menuItems"
                orientation="horizontal"
                class="z-50"
                :ui="{
                  linkLeadingIcon: 'relative top-px size-5',
                  // Дочерние пункты: иконка крупнее, выравнивание по верхнему краю
                  childLink: 'flex items-start ps-2 pe-2 py-1.5',
                  childLinkIcon: 'ms-2 me-2 mt-0.5 size-5 shrink-0 opacity-100',
                  childLinkDescription: 'text-sm'
                }"
              />
            </ClientOnly>
          </div>

          <!-- Кнопка поиска -->
          <button
            @click="openSearchPanel"
            class="shrink-0 h-8 w-8 rounded-md flex items-center justify-center text-slate-600 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            aria-label="Открыть поиск"
            title="Поиск (/ или Ctrl/⌘+K)"
          >
            <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z" />
            </svg>
          </button>

          <!-- Профиль: выпадающее меню (мобайл + десктоп) -->
          <ClientOnly>
            <div class="relative flex items-center" ref="profileRef">
            <button @click="toggleMenu" class="shrink-0 h-8 w-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-xs font-semibold hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
              {{ initials }}
            </button>

            <div v-if="menuOpen" class="absolute right-0 top-full mt-2 w-56 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl z-100">
              <div class="px-3 py-2 border-b border-slate-100 dark:border-slate-700">
                <p class="text-sm font-medium text-slate-900 dark:text-white">{{ user?.firstName }} {{ user?.lastName }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ user?.email }}</p>
              </div>
              <nav class="py-1">
                <NuxtLink to="/profile/bookmarks" class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" @click="menuOpen = false">
                  <UIcon name="i-heroicons-bookmark" class="w-4 h-4 text-slate-500" />
                  <span>Закладки</span>
                </NuxtLink>
                <NuxtLink to="/profile/settings" class="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" @click="menuOpen = false">
                  <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-slate-500" />
                  <span>Настройки</span>
                </NuxtLink>
                <div class="flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">
                  <span>Тёмная тема</span>
                  <USwitch :model-value="isDark" @update:model-value="onToggleTheme" size="sm" color="neutral" />
                </div>
                <NuxtLink v-if="user?.role === 'admin'" to="/admin" class="block px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700" @click="menuOpen = false">Админка</NuxtLink>
                <button @click="menuOpen = false; logout()" class="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40">Выйти</button>
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
  } catch {}
}

const menuOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const toggleMenu = () => { menuOpen.value = !menuOpen.value }
const onDocClick = (e: MouseEvent) => {
  if (!menuOpen.value) return
  const el = profileRef.value
  if (el && !el.contains(e.target as Node)) menuOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
const initials = computed(() => {
  const f = (user.value?.firstName || '').trim()[0] || ''
  const l = (user.value?.lastName || '').trim()[0] || ''
  return (f + l).toUpperCase() || 'U'
})

const navItems = [
  { to: '/', label: 'Главная' },
  { to: '/algorithms', label: 'Алгоритмы' },
  { to: '/codifier', label: 'Кодификатор' },
  { to: '/local-statuses', label: 'Локальные статусы' },
  { to: '/calculators', label: 'Калькуляторы' },
  { to: '/drugs', label: 'Лекарства' },
  { to: '/apps', label: 'Приложения' },
  { to: '/instructions', label: 'Инструкции' },
  { to: '/substations', label: 'Подстанции' }
]

const primaryNav = navItems.filter(i => ['/', '/algorithms', '/codifier', '/calculators'].includes(i.to))
const moreNav = computed(() => {
  const base = navItems.filter(i => ['/local-statuses', '/drugs', '/apps', '/instructions', '/substations', '/admin'].includes(i.to))
  return base.filter(i => i.to !== '/admin' ? true : (user.value?.role === 'admin'))
})

// Данные для меню NavigationMenu (не блокируем рендеринг)
const { data: categoriesData } = useFetch('/api/categories', { server: false })
const { data: algorithmCategoriesData } = useFetch('/api/algorithms/categories', { server: false })

function pluralizeDiagnosis(count: number) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return 'диагнозов'
  if (n1 === 1) return 'диагноз'
  if (n1 >= 2 && n1 <= 4) return 'диагноза'
  return 'диагнозов'
}

function pluralizeAlgorithm(count: number) {
  const n = Math.abs(count) % 100
  const n1 = n % 10
  if (n > 10 && n < 20) return 'алгоритмов'
  if (n1 === 1) return 'алгоритм'
  if (n1 >= 2 && n1 <= 4) return 'алгоритма'
  return 'алгоритмов'
}

const codifierChildren = computed(() => (categoriesData.value?.items || []).map((c: any) => ({
  label: c.name,
  to: `/codifier/${c.url}`,
  icon: 'i-lucide-book-text',
  // Показываем диапазон кодов как на странице кодификатора; если нет, то количество
  description: c.codeRange ? `${c.codeRange}` : `${c.mkbCount || 0} ${pluralizeDiagnosis(c.mkbCount || 0)}`
})))

const menuItems = computed(() => {
  const algorithmChildren = [
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

  // Алгоритмы должны идти сразу после Главная
  const base: any[] = [
    { label: 'Главная', to: '/', icon: 'i-lucide-home' },
    { label: 'Алгоритмы', to: '/algorithms', icon: 'i-lucide-list-tree', children: algorithmChildren },
    { label: 'Кодификатор', to: '/codifier', icon: 'i-heroicons-document-text', children: codifierChildren.value },
    { label: 'Калькуляторы', to: '/calculators', icon: 'i-lucide-calculator' }
  ]
  const infoMap: Record<string, { icon: string; description: string }> = {
    '/local-statuses': { icon: 'i-lucide-list-checks', description: 'Локальные статусы по категориям' },
    '/drugs': { icon: 'i-lucide-pill', description: 'Справочник препаратов' },
    '/apps': { icon: 'i-lucide-smartphone', description: 'Полезные приложения' },
    '/instructions': { icon: 'i-lucide-file-text', description: 'Инструкции и памятки' },
    '/substations': { icon: 'i-lucide-building-2', description: 'Подстанции на карте' },
    '/profile': { icon: 'i-heroicons-user', description: 'Профиль и смены' },
    '/admin': { icon: 'i-lucide-shield', description: 'Управление данными' }
  }
  const moreChildren = moreNav.value.map(i => ({
    label: i.label,
    to: i.to,
    icon: infoMap[i.to]?.icon || 'i-lucide-link',
    description: infoMap[i.to]?.description
  }))
  base.push({ label: 'Ещё', icon: 'i-heroicons-ellipsis-horizontal', children: moreChildren })
  return base
})

// Разделяем элементы меню: «Алгоритмы» отдельно (вертикальный контент), остальные — как есть
const menuItemsAlgorithms = computed(() => menuItems.value.filter(i => i.label === 'Алгоритмы'))
const menuItemsRest = computed(() => menuItems.value.filter(i => i.label !== 'Алгоритмы'))

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

const isActive = (to: string) => route.path === to
const currentTitle = computed(() => mapTitle[route.path] || title.value)
const showBack = computed(() => route.path !== '/')
const goBack = () => history.length > 1 ? history.back() : navigateTo('/')

// Открыть нижнюю панель поиска
function openSearchPanel() {
  if (process.client) {
    window.dispatchEvent(new Event('openBottomSearch'))
  }
}
</script>


