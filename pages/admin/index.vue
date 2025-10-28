<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">


        <!-- Таблица пользователей перенесена на /admin/users -->

        <div class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-6">
          <div v-for="card in dashboardCards as any[]" :key="card.key" class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg">
            <div class="px-2 py-4 sm:px-4 h-full flex flex-col">
              <div class="flex flex-col sm:flex-row items-center sm:items-start mb-2">
                <div class="flex-shrink-0 mb-3 sm:mb-0">
                  <div :class="[card.iconBg, 'w-12 h-12 rounded-lg flex items-center justify-center']">
                    <UIcon :name="card.icon" :class="[card.iconColor, 'w-6 h-6 sm:w-8 sm:h-8']" />
                  </div>
                </div>
                <div class="text-center sm:text-left sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white line-clamp-1">{{ card.title }}</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">{{ card.subtitle }}</p>
                </div>
              </div>

              <div v-if="card.type === 'single'" class="flex items-center gap-6 justify-center sm:justify-start text-base text-slate-600 dark:text-slate-300">
                <div>
                  <p class="text-xs text-slate-500">{{ card.singleLabel }}</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ card.get() }}</span>
                  </p>
                </div>
              </div>

              <div v-else-if="card.type === 'dual'" class="flex items-center gap-6 justify-center sm:justify-start text-base text-slate-600 dark:text-slate-300">
                <div>
                  <p class="text-xs text-slate-500">{{ card.dual?.leftLabel }}</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ card.dual?.left() }}</span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-slate-500">{{ card.dual?.rightLabel }}</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ card.dual?.right() }}</span>
                  </p>
                </div>
              </div>

              <div v-else-if="card.type === 'users'" class="flex items-center gap-6 justify-center sm:justify-start text-base text-slate-600 dark:text-slate-300">
                <div>
                  <p class="text-xs text-slate-500">Всего</p>
                  <p class="text-xl font-semibold">
                    <USkeleton v-if="pendingStats" class="h-6 w-16" />
                    <span v-else>{{ stats.users.total }}</span>
                  </p>
                </div>
                <template v-if="!pendingStats && Array.isArray(stats.users.byRole) && stats.users.byRole.length">
                  <div v-for="r in stats.users.byRole" :key="r.role">
                    <p class="text-xs text-slate-500">{{ r.role }}</p>
                    <p class="text-xl font-semibold"><span>{{ r.count }}</span></p>
                  </div>
                </template>
              </div>
            </div>
          </div>
        </div>

        <!-- Карта подстанций с количеством пользователей -->
        <div class="mt-6 bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Пользователи по подстанциям</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Число пользователей на метках</p>
          </div>
          <div class="h-[420px]">
            <YMap v-if="mapCenter" :center="mapCenter" :zoom="10" :placemarks="mapPlacemarks" />
            <div v-if="subsUsers && subsUsers.length" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700">
              <div class="text-sm text-slate-600 dark:text-slate-300 mb-2">Примеры пользователей (до 5):</div>
              <div class="flex flex-wrap gap-4">
                <div v-for="s in subsUsers.slice(0,3)" :key="s.id" class="flex items-center gap-2">
                  <div class="text-xs text-slate-500 dark:text-slate-400 w-44 truncate">{{ s.name }}</div>
                  <UAvatarGroup size="xl" :max="5">
                    <UAvatar v-for="(u, idx) in s.avatars || []" :key="idx" :alt="u.initials" :src="u.avatar" :ui="{ fallback: 'text-xs' }">{{ u.initials }}</UAvatar>
                  </UAvatarGroup>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </main>
  </div>

</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

type AdminStats = {
  users: { total: number; byRole: any[]; bySubstation: any[]; topSubstations: any[] }
  substations: { total: number }
  codifier: { categories: number; mkb: number }
  localStatuses: { categories: number; items: number }
  instructions: { total: number }
  calculators?: { total: number }
  algorithms?: { total: number }
  drugs?: { total: number }
  apps?: { total: number }
}

const { data: statsRes, pending: pendingStats } = await useFetch<{ success: boolean; stats: AdminStats }>('/api/admin/stats')
const stats = computed<AdminStats>(() => (statsRes.value?.stats as AdminStats) || {
  users: { total: 0, byRole: [], bySubstation: [], topSubstations: [] },
  substations: { total: 0 },
  codifier: { categories: 0, mkb: 0 },
  localStatuses: { categories: 0, items: 0 },
  instructions: { total: 0 },
  calculators: { total: 0 },
  algorithms: { total: 0 },
  drugs: { total: 0 },
  apps: { total: 0 }
})

const topSubstationsCols = [
  { accessorKey: 'substation', header: 'Подстанция' },
  { accessorKey: 'count', header: 'Пользователей' }
]
const topSubstationsRows = computed(() => stats.value.users.topSubstations || [])
// Данные для карты (подстанции и количество пользователей)
const { data: subsUsersRes } = await useFetch('/api/admin/substations-users', { server: false })
const subsUsers = computed<any[]>(() => Array.isArray(subsUsersRes.value?.items) ? subsUsersRes.value.items : [])
const mapCenter = computed<[number, number] | null>(() => subsUsers.value[0]?.coords || [55.751244, 37.618423])
const mapPlacemarks = computed(() => subsUsers.value.map(s => {
  const avatars = Array.isArray(s.avatars) ? s.avatars.slice(0, 8) : []
  const avatarsHtml = avatars.map((a: any) => {
    // Используем аватар, если есть, иначе fallback на initials или дефолтный аватар
    const src = a?.avatar || a?.telegram?.photo_url || ''
    const name = [a?.firstName, a?.lastName].filter(Boolean).join(' ') || a?.fullName || a?.name || a?.initials || 'Пользователь'
    const username = a?.telegram?.username || a?.username
    const title = username ? `${name}, @${username}` : name
    // Если нет аватара, показываем span с initials, иначе img
    if (src) {
      return `<span title="${title}" aria-label="${title}" style=\"display:inline-block;margin-left:-6px;\"><img src="${src}" alt="" class=\"inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-slate-700 object-cover\" /></span>`
    } else {
      return `<span title="${title}" aria-label="${title}" style=\"display:inline-block;margin-left:-6px;\"><span class=\"inline-flex items-center justify-center shrink-0 select-none align-middle bg-slate-200 dark:bg-slate-700 size-10 text-xs rounded-full ring-2 ring-white dark:ring-slate-700\"><span class=\"font-semibold text-slate-600 dark:text-slate-300\">${a?.initials || 'U'}</span></span></span>`
    }
  }).join('')

  return {
    id: s.id,
    coords: s.coords,
    hint: `${s.name}: ${s.count}`,
    balloon: `
      <div class="balloon-header">
        <div class="balloon-title">${s.name}</div>
        <div class="balloon-subtitle">Пользователей: <b>${s.count}</b></div>
      </div>
      <div class="balloon-body">
        <div class="flex items-center" style="display:flex;align-items:center;">
          <div class="-space-x-2" style="display:flex;">
            ${avatarsHtml}
          </div>
        </div>
      </div>
    `
  }
}))

// Карточки дашборда (иконка, цвета, данные)
function toNum(value: any) {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}

const dashboardCards = computed(() => [
  {
    key: 'users',
    title: 'Пользователи',
    subtitle: 'Роли и доступ',
    icon: 'i-heroicons-users',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    type: 'users'
  },
  {
    key: 'substations',
    title: 'Подстанции',
    subtitle: 'Карта подстанций',
    icon: 'i-lucide-building-2',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    type: 'single',
    singleLabel: 'Всего',
    get: () => toNum((stats.value as any)?.substations?.total)
  },
  {
    key: 'codifier',
    title: 'Кодификатор',
    subtitle: 'МКБ и коды',
    icon: 'i-heroicons-document-text',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    type: 'dual',
    dual: {
      leftLabel: 'Категории',
      rightLabel: 'Диагнозы (МКБ)',
      left: () => toNum((stats.value as any)?.codifier?.categories),
      right: () => toNum((stats.value as any)?.codifier?.mkb)
    }
  },
  {
    key: 'localStatuses',
    title: 'Локальные статусы',
    subtitle: 'Готовые описания',
    icon: 'i-lucide-list-checks',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    type: 'dual',
    dual: {
      leftLabel: 'Категории',
      rightLabel: 'Статусы',
      left: () => toNum((stats.value as any)?.localStatuses?.categories),
      right: () => toNum((stats.value as any)?.localStatuses?.items)
    }
  },
  {
    key: 'instructions',
    title: 'Инструкции',
    subtitle: 'База документов',
    icon: 'i-lucide-file-text',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    type: 'single',
    singleLabel: 'Всего',
    get: () => toNum((stats.value as any)?.instructions?.total)
  },
  {
    key: 'algorithms',
    title: 'Алгоритмы',
    subtitle: 'Оказания помощи',
    icon: 'i-lucide-list-tree',
    iconBg: 'bg-slate-100 dark:bg-slate-900',
    iconColor: 'text-slate-600 dark:text-slate-300',
    type: 'single',
    singleLabel: 'Всего',
    get: () => toNum((stats.value as any)?.algorithms?.total)
  },
  {
    key: 'calculators',
    title: 'Калькуляторы',
    subtitle: 'Медицинские расчеты',
    icon: 'i-lucide-calculator',
    iconBg: 'bg-orange-100 dark:bg-orange-900',
    iconColor: 'text-orange-600 dark:text-orange-400',
    type: 'single',
    singleLabel: 'Всего',
    get: () => toNum((stats.value as any)?.calculators?.total)
  },
  {
    key: 'drugs',
    title: 'Лекарства',
    subtitle: 'Справочник препаратов',
    icon: 'i-lucide-pill',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
    type: 'single',
    singleLabel: 'Всего',
    get: () => toNum((stats.value as any)?.drugs?.total)
  },
  {
    key: 'apps',
    title: 'Приложения',
    subtitle: 'Полезные приложения',
    icon: 'i-lucide-smartphone',
    iconBg: 'bg-teal-100 dark:bg-teal-900',
    iconColor: 'text-teal-600 dark:text-teal-400',
    type: 'single',
    singleLabel: 'Всего',
    get: () => toNum((stats.value as any)?.apps?.total)
  }
])

// Таблица пользователей вынесена на /admin/users
</script>
