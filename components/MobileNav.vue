<template>
  <nav class="sticky bottom-2 left-2 right-2 z-40 md:hidden bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-2xl shadow-lg">
    <ul class="grid grid-cols-5 text-[10px] text-slate-500 dark:text-slate-300">
      <!-- Основные пункты -->
      <li v-for="item in primaryItems" :key="item.to">
        <NuxtLink :to="item.to" class="flex flex-col items-center justify-center py-3 cursor-pointer"
          :class="{ 'text-indigo-600 dark:text-indigo-400': isActive(item.to) }">
          <UIcon :name="item.icon" class="w-5 h-5" 
            :class="isActive(item.to) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'" />
          <span class="text-[10px] mt-0.5 leading-tight" 
            :class="isActive(item.to) ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-300'">{{ item.label }}</span>
        </NuxtLink>
      </li>
      
      <!-- Выпадающий блок -->
      <li class="relative" ref="moreRef">
        <button @click.stop="moreOpen = !moreOpen" class="flex flex-col items-center justify-center py-3 cursor-pointer w-full"
          :class="{ 'text-indigo-600 dark:text-indigo-400': moreActive }">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"
            :class="moreActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500'">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"></path>
          </svg>
          <span class="text-[10px] mt-0.5 leading-tight" 
            :class="moreActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-500 dark:text-slate-300'">Ещё</span>
        </button>
        
        <!-- Выпадающее меню -->
        <div v-if="moreOpen" class="absolute bottom-full right-0 mb-2 w-64 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl z-100">
          <nav class="py-1">
            <NuxtLink v-for="item in moreItems" :key="item.to" :to="item.to"
              class="flex items-start gap-3 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
              :class="{ 'bg-slate-100 dark:bg-slate-700': isActive(item.to) }"
              @click="moreOpen = false">
              <UIcon :name="item.icon" class="ms-0.5 mt-0.5 w-4 h-4 text-slate-500" />
              <div class="min-w-0">
                <div class="truncate font-medium text-slate-900 dark:text-white">{{ item.label }}</div>
                <div v-if="item.description" class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ item.description }}</div>
              </div>
            </NuxtLink>
          </nav>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'

const route = useRoute()

const IconHome = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
    ])
  }
}
const IconAlg = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ])
  }
}
const IconCod = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' })
    ])
  }
}
const IconLocal = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 11c1.657 0 3-1.343 3-3S13.657 5 12 5 9 6.343 9 8s1.343 3 3 3zm0 2c-2.761 0-5 2.239-5 5h10c0-2.761-2.239-5-5-5z' })
    ])
  }
}
const IconCalc = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' })
    ])
  }
}
const IconDrug = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' })
    ])
  }
}
const IconApp = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' })
    ])
  }
}
const IconInstr = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' })
    ])
  }
}

const IconFav = {
  render() {
    return h('svg', { class: 'w-5 h-5', fill: 'none', stroke: 'currentColor', viewBox: '0 0 24 24' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' })
    ])
  }
}

// Основные пункты (видимые) — используем имена иконок как в шапке
const primaryItems = [
  { to: '/', icon: 'i-lucide-home', label: 'Главная' },
  { to: '/algorithms', icon: 'i-lucide-list-tree', label: 'Алгоритмы' },
  { to: '/codifier', icon: 'i-lucide-box', label: 'Кодификатор' },
  { to: '/favorites', icon: 'i-lucide-heart', label: 'Избранное' }
]

// Дополнительные пункты (в выпадающем меню) — те же иконки, что в шапке
const moreItemsBase = [
  { to: '/calculators', icon: 'i-lucide-calculator', label: 'Калькуляторы' },
  { to: '/drugs', icon: 'i-lucide-pill', label: 'Лекарства' },
  { to: '/apps', icon: 'i-lucide-smartphone', label: 'Приложения' },
  { to: '/instructions', icon: 'i-lucide-file-text', label: 'Инструкции' },
  { to: '/substations', icon: 'i-lucide-building-2', label: 'Подстанции' },
  { to: '/local-statuses', icon: 'i-lucide-list-checks', label: 'Локальные статусы' }
]

const infoMap: Record<string, { description: string }> = {
  '/local-statuses': { description: 'Локальные статусы по категориям' },
  '/drugs': { description: 'Справочник препаратов' },
  '/apps': { description: 'Полезные приложения' },
  '/instructions': { description: 'Инструкции и памятки' },
  '/substations': { description: 'Подстанции на карте' },
  '/calculators': { description: 'Медицинские калькуляторы' }
}

const { user } = useAuth()
const moreItems = computed(() =>
  moreItemsBase
    .filter(i => i.to !== '/admin' ? true : (user.value?.role === 'admin'))
    .map(i => ({ ...i, description: infoMap[i.to]?.description }))
)

const isActive = (to: string) => route.path === to

// Управление выпадающим меню
const moreOpen = ref(false)
const moreRef = ref<HTMLElement | null>(null)
const moreActive = computed(() => moreItems.value.some(item => isActive(item.to)))

const onDocClickMore = (e: MouseEvent) => {
  if (!moreOpen.value) return
  const el = moreRef.value
  if (el && !el.contains(e.target as Node)) moreOpen.value = false
}

onMounted(() => document.addEventListener('click', onDocClickMore))
onBeforeUnmount(() => document.removeEventListener('click', onDocClickMore))
</script>


