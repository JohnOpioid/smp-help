<template>
  <div class="mb-4">
    <h2 v-if="title" class="text-2xl font-bold text-slate-900 dark:text-white mb-3">{{ title }}</h2>
    <nav ref="navScroll" @wheel.prevent="onAdminNavWheel" class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left overflow-x-auto hide-scrollbar">
      <NuxtLink
        v-for="item in adminNav"
        :key="item.to"
        :to="item.to"
        class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap"
        :class="currentPath === item.to ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
      >
        <UIcon v-if="item.icon" :name="item.icon" class="w-4 h-4 mr-2" />
        {{ item.label }}
      </NuxtLink>
    </nav>
  </div>
  
  <slot />
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = withDefaults(defineProps<{ title?: string }>(), { title: '' })
const route = useRoute()
const router = useRouter()
const navScroll = ref<HTMLElement | null>(null)
const isMounted = ref(false)

// Используем computed для более надежного определения активного маршрута
const currentPath = computed(() => isMounted.value ? route.path : '')

onMounted(() => {
  isMounted.value = true
})

function onAdminNavWheel(e: WheelEvent) {
  const el = navScroll.value
  if (!el) return
  // горизонтальная прокрутка колесом мыши
  el.scrollLeft += e.deltaY
}

const adminNav = [
  { to: '/admin', label: 'Главная', icon: 'i-lucide-home' },
  { to: '/admin/instructions', label: 'Инструкции', icon: 'i-lucide-file-text' },
  { to: '/admin/substations', label: 'Подстанции', icon: 'i-lucide-building-2' },
  { to: '/admin/algorithms', label: 'Алгоритмы', icon: 'i-lucide-list-tree' },
  { to: '/admin/codifier', label: 'Кодификатор', icon: 'i-heroicons-document-text' },
  { to: '/admin/local-statuses', label: 'Локальные статусы', icon: 'i-lucide-list-checks' },
  { to: '/admin/calculators', label: 'Калькуляторы', icon: 'i-lucide-calculator' },
  { to: '/admin/drugs', label: 'Лекарства', icon: 'i-lucide-pill' },
  { to: '/admin/apps', label: 'Приложения', icon: 'i-lucide-smartphone' }
]
</script>


