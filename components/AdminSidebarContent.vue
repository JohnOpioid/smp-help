<template>
  <div class="w-64 h-screen flex flex-col bg-white dark:bg-slate-800">
    <div class="px-4 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
      <h2 class="text-base font-semibold text-slate-900 dark:text-white">Админка</h2>
      <NuxtLink to="/" class="h-8 w-8 rounded-md flex items-center justify-center cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
        title="Перейти на сайт" @click="onNavigate">
        <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-5 h-5" />
      </NuxtLink>
    </div>

    <div class="p-2 flex-1 overflow-y-auto">
      <nav class="space-y-1">
        <NuxtLink v-for="item in navLinks" :key="item.to" :to="item.to" @click="onNavigate"
          class="group flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors"
          :class="isActive(item)
            ? 'bg-slate-100 text-slate-900 dark:bg-slate-700 dark:text-white'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-700'">
          <UIcon :name="item.icon" class="w-4 h-4" />
          <span class="whitespace-nowrap">{{ item.label }}</span>
        </NuxtLink>
      </nav>
    </div>

    <div class="px-3 py-3 border-t border-slate-100 dark:border-slate-700">
      <div class="relative" ref="profileRef">
        <button type="button" @click="profileOpen = !profileOpen" class="w-full flex items-center gap-3 rounded-md px-2 py-2 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer">
          <div class="h-9 w-9 rounded-md bg-slate-600 text-white flex items-center justify-center text-sm font-semibold">
            {{ initials }}
          </div>
          <div class="min-w-0 text-left">
            <div class="text-sm font-medium text-slate-900 dark:text-white truncate">{{ userName }}</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ userEmail }}</div>
          </div>
        </button>
        <div v-if="profileOpen" class="absolute right-0 bottom-full mb-2 w-56 rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl z-50">
          <nav class="py-1">
            <NuxtLink to="/profile" class="flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" @click="closeProfileAndNavigate">
              <UIcon name="i-heroicons-user" class="w-4 h-4 text-slate-500" />
              <span>Профиль</span>
            </NuxtLink>
            <NuxtLink to="/profile/bookmarks" class="flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" @click="closeProfileAndNavigate">
              <UIcon name="i-heroicons-bookmark" class="w-4 h-4 text-slate-500" />
              <span>Закладки</span>
            </NuxtLink>
            <NuxtLink to="/profile/settings" class="flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700" @click="closeProfileAndNavigate">
              <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 text-slate-500" />
              <span>Настройки</span>
            </NuxtLink>
            <button type="button" @click="onLogout" class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40">
              <UIcon name="i-heroicons-arrow-right-on-rectangle" class="w-4 h-4" />
              <span>Выйти</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from '#app'
import { useAuth } from '~/composables/useAuth'

const emit = defineEmits<{ (e: 'navigate'): void }>()

const onNavigate = () => emit('navigate')

const navLinks = [
  { label: 'Главная', icon: 'i-lucide-home', to: '/admin' },
      { label: 'Пользователи', icon: 'i-heroicons-users', to: '/admin/users' },
  { label: 'Инструкции', icon: 'i-lucide-file-text', to: '/admin/instructions' },
  { label: 'Подстанции', icon: 'i-lucide-building-2', to: '/admin/substations' },
  { label: 'Алгоритмы', icon: 'i-lucide-list-tree', to: '/admin/algorithms' },
  { label: 'Кодификатор', icon: 'i-heroicons-document-text', to: '/admin/codifier' },
  { label: 'Локальные статусы', icon: 'i-lucide-list-checks', to: '/admin/local-statuses' },
  { label: 'Калькуляторы', icon: 'i-lucide-calculator', to: '/admin/calculators' },
  { label: 'Тесты', icon: 'i-lucide-check-circle-2', to: '/admin/tests', activeMatch: '/admin/tests' },
  { label: 'Лекарства', icon: 'i-lucide-pill', to: '/admin/drugs' },
  { label: 'Приложения', icon: 'i-lucide-smartphone', to: '/admin/apps' }
]

const route = useRoute()
const isActive = (item: any) => {
  const to = item.to
  if (route.path === to) return true
  if (item.activeMatch && (route.path === item.activeMatch || route.path.startsWith(item.activeMatch + '/'))) return true
  return false
}

const { user, logout } = useAuth()
const initials = computed(() => {
  const f = (user.value?.firstName || '').trim()[0] || ''
  const l = (user.value?.lastName || '').trim()[0] || ''
  return (f + l).toUpperCase() || 'U'
})
const userName = computed(() => `${user.value?.firstName || ''} ${user.value?.lastName || ''}`.trim() || 'Профиль')
const userEmail = computed(() => user.value?.email || (user.value?.telegram?.username ? `@${user.value.telegram.username}` : '—'))

// Локальное управление попапом профиля (как в шапке)
const profileOpen = ref(false)
const profileRef = ref<HTMLElement | null>(null)
const onDocClick = (e: MouseEvent) => {
  const el = profileRef.value
  if (profileOpen.value && el && !el.contains(e.target as Node)) profileOpen.value = false
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))
const closeProfileAndNavigate = () => { profileOpen.value = false; onNavigate() }
const onLogout = () => { profileOpen.value = false; logout() }
</script>

<style scoped>
</style>


