<template>
  <div class="min-h-screen flex bg-slate-50 dark:bg-slate-900">
    <!-- Single sidebar instance: fixed off-canvas on mobile, static on desktop -->
    <div
      class="z-50 md:z-auto fixed md:fixed inset-y-0 left-0 w-64 transform transition-transform duration-200 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700"
      :class="[mobileOpen ? 'translate-x-0' : '-translate-x-full', 'md:translate-x-0']"
    >
      <div class="h-screen flex flex-col">
        <AdminSidebarContent class="flex-1 overflow-y-auto" @navigate="mobileOpen = false" />
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 min-w-0 md:pl-64">
      <!-- Mobile top bar with menu button -->
      <div class="md:hidden px-2 py-2 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-900 sticky top-0 z-10">
        <button type="button" class="h-9 w-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          @click="mobileOpen = true" aria-label="Открыть меню">
          <UIcon name="i-heroicons-bars-3" class="w-6 h-6" />
        </button>
        <h2 class="text-base font-semibold text-slate-900 dark:text-white">Админка</h2>
        <div class="flex-1" />
        <NuxtLink to="/" class="h-9 w-9 rounded-md flex items-center justify-center cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
          title="Перейти на сайт">
          <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-5 h-5" />
        </NuxtLink>
      </div>
      <slot />
    </div>
  </div>
  <!-- Mobile overlay -->
  <div v-if="mobileOpen" class="fixed inset-0 bg-slate-900/50 md:hidden z-40" @click="mobileOpen = false"></div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'
// Навигация админки (Nuxt UI: UVerticalNavigation)
const navLinks = [
  { label: 'Главная', icon: 'i-lucide-home', to: '/admin' },
  { label: 'Учебная комната', icon: 'i-lucide-book-open', to: '/admin/classroom' },
  { label: 'Подстанции', icon: 'i-lucide-building-2', to: '/admin/substations' },
  { label: 'Алгоритмы', icon: 'i-lucide-list-tree', to: '/admin/algorithms' },
  { label: 'Кодификатор', icon: 'i-heroicons-document-text', to: '/admin/codifier' },
  { label: 'Локальные статусы', icon: 'i-lucide-list-checks', to: '/admin/local-statuses' },
  { label: 'Калькуляторы', icon: 'i-lucide-calculator', to: '/admin/calculators' },
  { label: 'Лекарства', icon: 'i-lucide-pill', to: '/admin/drugs' },
  { label: 'Новости', icon: 'i-lucide-newspaper', to: '/admin/news' },
  { label: 'Промо', icon: 'i-lucide-gift', to: '/admin/promo' },
  { label: 'Приложения', icon: 'i-lucide-smartphone', to: '/admin/apps' }
]

const route = useRoute()
const isActive = (to: string) => route.path === to

// Профиль (из auth)
const { user, logout } = useAuth()
const mobileOpen = ref(false)
const initials = computed(() => {
  const f = (user.value?.firstName || '').trim()[0] || ''
  const l = (user.value?.lastName || '').trim()[0] || ''
  return (f + l).toUpperCase() || 'U'
})
const userName = computed(() => `${user.value?.firstName || ''} ${user.value?.lastName || ''}`.trim() || 'Профиль')
const userEmail = computed(() => user.value?.email || (user.value?.telegram?.username ? `@${user.value.telegram.username}` : '—'))

// Автоматически закрываем сайдбар на мобильных после навигации
watch(() => route.path, () => {
  if (process.client && window.innerWidth <= 768) {
    mobileOpen.value = false
  }
})
</script>

<style scoped>
</style>


