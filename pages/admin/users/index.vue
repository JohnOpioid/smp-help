<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
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
        <div class="relative overflow-auto">
          <table class="min-w-full overflow-clip">
            <thead class="relative">
              <tr class="data-[selected=true]:bg-elevated/50">
                <th scope="col" class="px-4 py-3.5 text-sm text-highlighted text-left font-semibold">Аватар</th>
                <th scope="col" class="px-4 py-3.5 text-sm text-highlighted text-left font-semibold">ФИО</th>
                <th scope="col" class="px-4 py-3.5 text-sm text-highlighted text-left font-semibold">E‑mail</th>
                <th scope="col" class="px-4 py-3.5 text-sm text-highlighted text-left font-semibold">Роль</th>
                <th scope="col" class="px-4 py-3.5 text-sm text-highlighted text-left font-semibold">Статус</th>
                <th scope="col" class="px-4 py-3.5 text-sm text-highlighted text-right font-semibold">Действия</th>
              </tr>
              <tr class="absolute z-[1] left-0 w-full h-px bg-(--ui-border-accented)"></tr>
            </thead>
            <tbody class="divide-y divide-default">
              <tr v-if="loading && users.length === 0">
                <td colspan="6" class="py-6 text-center text-sm text-muted">Загрузка…</td>
              </tr>
              <tr v-else v-for="u in users" :key="u._id">
                <td class="px-4 py-3 text-sm">
                  <UAvatar :src="u.displayAvatar || u.avatarUrl || u.telegram?.photo_url" :alt="(u.firstName + ' ' + u.lastName).trim()" size="md" :ui="{ root: 'rounded-full', image: 'object-cover', fallback: 'rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300' }">
                    <span class="font-semibold">{{ ((u.firstName||'').trim()[0] || '') + ((u.lastName||'').trim()[0] || '') }}</span>
                  </UAvatar>
                </td>
                <td class="px-4 py-3 text-sm text-slate-800 dark:text-slate-200 whitespace-nowrap">
                  {{ u.firstName }} {{ u.lastName }}
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 dark:text-slate-300">
                  {{ u.email || (u.telegram?.username ? '@' + u.telegram.username : '—') }}
                </td>
                <td class="px-4 py-3 text-sm">
                  <UPopover :popper="{ placement: 'bottom-start', offsetDistance: 6 }">
                    <UButton size="xs" variant="soft" color="neutral" class="cursor-pointer">
                      {{ u.role || 'user' }}
                    </UButton>
                    <template #panel>
                      <div class="p-2 w-40">
                        <button v-for="r in roleItems" :key="r" type="button"
                          class="w-full text-left px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-sm"
                          @click="onChangeRole(u, r)">
                          {{ r }}
                        </button>
                      </div>
                    </template>
                  </UPopover>
                </td>
                <td class="px-4 py-3 text-sm">
                  <span :class="u.blocked ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'">
                    {{ u.blocked ? 'Заблокирован' : 'Активен' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-sm">
                  <div class="flex items-center justify-end gap-2">
                    <UButton size="xs" variant="soft" :color="u.blocked ? 'primary' : 'warning'" class="cursor-pointer" @click="onToggleBlock(u)">
                      {{ u.blocked ? 'Разблокировать' : 'Заблокировать' }}
                    </UButton>
                    <UButton size="xs" variant="soft" color="error" class="cursor-pointer" @click="onDelete(u)">Удалить</UButton>
                  </div>
                </td>
              </tr>
              <tr v-if="!loading && users.length === 0">
                <td colspan="6" class="py-6 text-center text-sm text-muted">Нет данных</td>
              </tr>
            </tbody>
          </table>
          <div class="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
            <UButton v-if="hasMore" :loading="loadingMore" color="neutral" variant="soft" size="sm" class="cursor-pointer" @click="loadMore">
              Загрузить ещё
            </UButton>
            <span v-else class="text-xs text-slate-500 dark:text-slate-400">Все пользователи загружены</span>
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

async function fetchPage(p: number) {
  const res: any = await $fetch(`/api/admin/users?page=${p}&limit=${limit}`, { method: 'GET' })
  total.value = Number(res?.total || 0)
  return Array.isArray(res?.items) ? res.items : []
}

const users = computed<any[]>(() => items.value)
const hasMore = computed(() => users.value.length < total.value)

onMounted(async () => {
  loading.value = true
  try {
    items.value = await fetchPage(page.value)
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
 