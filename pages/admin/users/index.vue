<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
      <!-- Графики статистики -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <!-- График регистраций -->
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 h-full flex flex-col">
          <div class="mb-4 flex-shrink-0">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Новые пользователи</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Регистрации по дням</p>
              </div>
              <div v-if="!loadingRegistrations && registrationsData.length > 0" class="text-right">
                <div class="text-sm text-slate-600 dark:text-slate-400">Всего сегодня</div>
                <div class="text-2xl font-bold text-slate-900 dark:text-white">
                  {{ todayRegistrations }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 flex flex-col justify-end">
            <div v-if="loadingRegistrations" class="flex items-center justify-center min-h-[300px]">
              <USkeleton class="h-full w-full" />
            </div>
            <ClientOnly v-else>
              <AdminChart :data="registrationsData" color="#3b82f6" height="auto" />
              <template #fallback>
                <USkeleton class="h-[300px] w-full" />
              </template>
            </ClientOnly>
          </div>
        </div>
        
        <!-- График посещений -->
        <div class="bg-white dark:bg-slate-800 rounded-lg p-4 h-full flex flex-col">
          <div class="mb-4 flex-shrink-0">
            <div class="flex items-center justify-between mb-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Посещения сайта</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Активные пользователи по дням</p>
              </div>
              <div v-if="!loadingVisits && visitsData.length > 0" class="text-right">
                <div class="text-sm text-slate-600 dark:text-slate-400">Всего сегодня</div>
                <div class="text-2xl font-bold text-slate-900 dark:text-white">
                  {{ todayTotalVisits }}
                </div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <span class="text-blue-600 dark:text-blue-400">{{ todayLoggedIn }}</span> / 
                  <span class="text-green-600 dark:text-green-400">{{ todayGuests }}</span>
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 flex flex-col justify-end">
            <div v-if="loadingVisits" class="flex items-center justify-center min-h-[300px]">
              <USkeleton class="h-full w-full" />
            </div>
            <ClientOnly v-else>
              <AdminChart 
                :data="visitsData" 
                height="auto" 
                :multiple-series="true"
                :series-colors="['#3b82f6', '#10b981', '#8b5cf6']"
                :series-names="['Залогиненные', 'Гости', 'Всего']"
              />
              <template #fallback>
                <USkeleton class="h-[300px] w-full" />
              </template>
            </ClientOnly>
          </div>
        </div>
      </div>
      
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Пользователи</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление ролями, блокировками и удалением</p>
          </div>
          <UButton color="primary" variant="soft" size="sm" class="cursor-pointer" @click="onFillAvatars">
            Подтянуть аватары из Telegram
          </UButton>
        </div>

        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <UInput 
            v-model="searchQuery" 
            placeholder="Поиск по имени, email или username..." 
            size="lg"
            class="w-full"
          >
            <template #leading>
              <UIcon name="i-heroicons-magnifying-glass" />
            </template>
          </UInput>
        </div>

        <div class="relative">
          <div class="overflow-x-auto">
            <table class="w-full table-fixed min-w-[800px]">
              <colgroup>
                <col style="width: 60px;">
                <col style="width: auto;">
                <col style="width: auto;">
                <col style="width: 100px;">
                <col style="width: 120px;">
                <col style="width: 80px;">
              </colgroup>
              <thead>
                <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                  <th class="text-left p-3 font-medium">Аватар</th>
                  <th class="text-left p-3 font-medium">ФИО</th>
                  <th class="text-left p-3 font-medium">E‑mail</th>
                  <th class="text-left p-3 font-medium">Роль</th>
                  <th class="text-left p-3 font-medium">Статус</th>
                  <th class="text-center p-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="loading && usersTableData.length === 0">
                  <td colspan="6" class="py-6 text-center text-sm text-muted">Загрузка…</td>
                </tr>
                <tr v-else v-for="u in usersTableData" :key="u._id" class="border-t border-slate-100 dark:border-slate-700/60">
                  <td class="p-3">
                    <UAvatar :src="u.displayAvatar || u.avatarUrl || u.telegram?.photo_url" :alt="(u.firstName + ' ' + u.lastName).trim()" size="sm" :ui="{ root: 'rounded-full', image: 'object-cover', fallback: 'rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' }">
                      <span class="font-semibold text-xs">{{ ((u.firstName||'').trim()[0] || '') + ((u.lastName||'').trim()[0] || '') }}</span>
                    </UAvatar>
                  </td>
                  <td class="p-3">
                    <div class="text-sm text-muted whitespace-nowrap truncate" :title="`${u.firstName} ${u.lastName}`.trim()">{{ u.firstName }} {{ u.lastName }}</div>
                    <div v-if="u.telegram?.username" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" :title="`@${u.telegram.username}`">@{{ u.telegram.username }}</div>
                  </td>
                  <td class="p-3">
                    <div class="text-sm text-muted truncate" :title="u.email || (u.telegram?.username ? '@' + u.telegram.username : '—')">{{ u.email || (u.telegram?.username ? '@' + u.telegram.username : '—') }}</div>
                  </td>
                  <td class="p-3">
                    <UPopover :content="{ side: 'bottom', align: 'start', sideOffset: 8 }">
                      <UButton size="xs" variant="soft" color="neutral" class="cursor-pointer">
                        {{ u.role || 'user' }}
                      </UButton>
                      <template #content>
                        <div class="w-40">
                          <button v-for="r in roleItems" :key="r" type="button"
                            class="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm cursor-pointer"
                            @click="onChangeRole(u, r)">
                            {{ r }}
                          </button>
                        </div>
                      </template>
                    </UPopover>
                  </td>
                  <td class="p-3">
                    <div class="text-sm text-muted whitespace-nowrap">
                      <span :class="u.blocked ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                        {{ u.blocked ? 'Заблокирован' : 'Активен' }}
                      </span>
                    </div>
                  </td>
                  <td class="p-3 text-center whitespace-nowrap">
                    <UPopover :content="{ side: 'bottom', align: 'end', sideOffset: 8 }">
                      <button
                        type="button"
                        class="rounded-md p-2 size-9 inline-flex items-center justify-center text-default text-slate-500 dark:text-slate-400 hover:bg-elevated focus:outline-none cursor-pointer"
                        title="Действия"
                      >
                        <UIcon name="i-heroicons-ellipsis-vertical" class="w-5 h-5" />
                      </button>
                      <template #content>
                        <div class="w-56">
                          <nav class="py-1">
                            <button
                              type="button"
                              class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                              @click="onToggleBlock(u)"
                            >
                              <UIcon :name="u.blocked ? 'i-heroicons-lock-open' : 'i-heroicons-lock-closed'" class="w-4 h-4 text-slate-500" />
                              <span>{{ u.blocked ? 'Разблокировать' : 'Заблокировать' }}</span>
                            </button>
                            <button
                              type="button"
                              class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                              @click="onDelete(u)"
                            >
                              <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                              <span>Удалить</span>
                            </button>
                          </nav>
                        </div>
                      </template>
                    </UPopover>
                  </td>
                </tr>
                <tr v-if="!loading && usersTableData.length === 0">
                  <td colspan="6" class="py-6 text-center text-sm text-muted">Нет данных</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div v-if="!loading && hasMoreUsers" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
            <UButton :loading="loadingMore" variant="soft" color="neutral" size="sm" class="cursor-pointer" @click="loadMore">
              <UIcon name="i-heroicons-chevron-down" class="me-1" />
              Загрузить ещё
            </UButton>
          </div>
          <div v-if="!loading && !hasMoreUsers && users.length > 0" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
            <span class="text-xs text-slate-500 dark:text-slate-400">Все пользователи загружены</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Пользователи' })

const roleItems = ['user', 'editor', 'admin']
const page = ref(1)
const limit = 15
const loading = ref(false)
const loadingMore = ref(false)
const total = ref(0)
const items = ref<any[]>([])
const searchQuery = ref('')

// Данные для графиков
const loadingRegistrations = ref(false)
const loadingVisits = ref(false)
const registrationsData = ref<Array<{ date: string; count: number }>>([])
const visitsData = ref<Array<{ date: string; loggedIn: number; guests: number; total?: number }>>([])

const filteredUsers = computed(() => {
  if (!searchQuery.value.trim()) {
    return users.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return users.value.filter((u: any) => {
    const searchableText = [
      u.firstName,
      u.lastName,
      u.email,
      u.telegram?.username
    ].filter(Boolean).join(' ').toLowerCase()
    
    return searchableText.includes(query)
  })
})

const usersTableData = computed(() => {
  return filteredUsers.value
})

const hasMoreUsers = computed(() => {
  return users.value.length < total.value
})

async function fetchPage(p: number) {
  const res: any = await $fetch(`/api/admin/users?page=${p}&limit=${limit}`, { method: 'GET' })
  total.value = Number(res?.total || 0)
  return Array.isArray(res?.items) ? res.items : []
}

const users = computed<any[]>(() => items.value)
const hasMore = computed(() => users.value.length < total.value)

async function loadCharts() {
  loadingRegistrations.value = true
  loadingVisits.value = true
  try {
    const [registrationsRes, visitsRes] = await Promise.all([
      $fetch('/api/admin/users/registrations-stats?days=30'),
      $fetch('/api/admin/users/visits-stats?days=30')
    ])
    registrationsData.value = registrationsRes?.data || []
    // Добавляем поле total (сумма залогиненных и гостей) для каждой записи
    visitsData.value = (visitsRes?.data || []).map(item => ({
      ...item,
      total: (item.loggedIn || 0) + (item.guests || 0)
    }))
  } catch (error) {
    console.error('Ошибка загрузки графиков:', error)
  } finally {
    loadingRegistrations.value = false
    loadingVisits.value = false
  }
}

// Вычисляем статистику за сегодня
const todayRegistrations = computed(() => {
  if (!registrationsData.value || registrationsData.value.length === 0) return 0
  const today = new Date().toISOString().split('T')[0]
  const todayData = registrationsData.value.find(item => item.date === today)
  return todayData?.count || 0
})

const todayTotalVisits = computed(() => {
  if (!visitsData.value || visitsData.value.length === 0) return 0
  const today = new Date().toISOString().split('T')[0]
  const todayData = visitsData.value.find(item => item.date === today)
  return todayData ? (todayData.loggedIn || 0) + (todayData.guests || 0) : 0
})

const todayLoggedIn = computed(() => {
  if (!visitsData.value || visitsData.value.length === 0) return 0
  const today = new Date().toISOString().split('T')[0]
  const todayData = visitsData.value.find(item => item.date === today)
  return todayData?.loggedIn || 0
})

const todayGuests = computed(() => {
  if (!visitsData.value || visitsData.value.length === 0) return 0
  const today = new Date().toISOString().split('T')[0]
  const todayData = visitsData.value.find(item => item.date === today)
  return todayData?.guests || 0
})

onMounted(async () => {
  loading.value = true
  try {
    items.value = await fetchPage(page.value)
    await loadCharts()
  } finally {
    loading.value = false
  }
})

async function loadMore() {
  if (!hasMore.value || loadingMore.value) return
  loadingMore.value = true
  try {
    page.value += 1
    const next = await fetchPage(page.value)
    items.value = items.value.concat(next)
  } finally {
    loadingMore.value = false
  }
}

async function onChangeRole(user: any, role: string) {
  try {
    await $fetch(`/api/admin/users/${user._id}/role`, { method: 'PATCH', body: { role } })
    // Обновляем конкретный элемент
    items.value = items.value.map(u => u._id === user._id ? { ...u, role } : u)
    useToast()?.add?.({ title: 'Роль обновлена', color: 'success' })
  } catch {
    useToast()?.add?.({ title: 'Не удалось обновить роль', color: 'error' })
  }
}

async function onToggleBlock(user: any) {
  try {
    await $fetch(`/api/admin/users/${user._id}/block`, { method: 'PATCH', body: { blocked: !user.blocked } })
    items.value = items.value.map(u => u._id === user._id ? { ...u, blocked: !user.blocked } : u)
    useToast()?.add?.({ title: user.blocked ? 'Разблокирован' : 'Заблокирован', color: 'success' })
  } catch {
    useToast()?.add?.({ title: 'Не удалось изменить статус', color: 'error' })
  }
}

async function onDelete(user: any) {
  try {
    await $fetch(`/api/admin/users/${user._id}`, { method: 'DELETE' })
    items.value = items.value.filter(u => u._id !== user._id)
    total.value = Math.max(0, total.value - 1)
    useToast()?.add?.({ title: 'Пользователь удалён', color: 'success' })
  } catch {
    useToast()?.add?.({ title: 'Не удалось удалить', color: 'error' })
  }
}

async function onFillAvatars() {
  try {
    const res: any = await $fetch('/api/admin/users/fill-avatars', { method: 'POST' })
    useToast()?.add?.({ title: `Обновлено аватаров: ${Number(res?.updated || 0)}`, color: 'success' })
    // Перезагружаем текущие страницы и доподтягиваем уже загруженных пользователей
    const pagesToRefetch = Math.max(1, Math.ceil(users.value.length / limit))
    page.value = 1
    items.value = await fetchPage(1)
    for (let p = 2; p <= pagesToRefetch; p++) {
      const next = await fetchPage(p)
      items.value = items.value.concat(next)
      page.value = p
    }
  } catch {
    useToast()?.add?.({ title: 'Не удалось подтянуть аватары', color: 'error' })
  }
}
</script>
 