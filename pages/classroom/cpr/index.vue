<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 pt-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ item?.title || 'Параметры проведения СЛР' }}</h1>
          <div class="flex md:items-center gap-2">
            <button
              type="button"
              :title="isBookmarked ? 'В избранном' : 'В закладки'"
              :class="isBookmarked
                ? 'rounded-md font-medium transition-colors text-sm gap-1.5 text-inverted bg-primary hover:bg-primary/75 active:bg-primary/75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary p-1.5 cursor-pointer h-9 w-9 flex items-center justify-center'
                : 'rounded-md font-medium disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors text-sm gap-1.5 text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 focus:outline-none focus-visible:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated p-1.5 cursor-pointer h-9 w-9 flex items-center justify-center'"
              @click="toggleBookmark"
            >
              <UIcon :name="isBookmarked ? 'i-heroicons:bookmark-solid' : 'i-heroicons:bookmark'" class="size-5" />
            </button>
          </div>
        </div>
        <p class="text-slate-600 dark:text-slate-300 mb-4">Параметры кардиолёгочной реанимации для взрослых, детей и новорождённых.</p>
        <!-- Перенесенная карточка с таблицей СЛР -->
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden mb-6">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ item?.title || 'Параметры проведения сердечно-легочной реанимации' }}</h3>
            <span class="text-xs text-slate-500 dark:text-slate-400">Приложение 1</span>
          </div>
          <div class="overflow-x-auto">
            <table class="min-w-full md:w-full table-fixed text-sm text-slate-800 dark:text-slate-200 table-cpr" style="min-width: 800px;">
              <thead>
                <tr class="bg-slate-50 dark:bg-slate-700/60">
                  <th class="px-3 py-2 align-middle w-[22%] text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700">Этап</th>
                  <th class="px-3 py-2 align-middle w-[26%] text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700">У взрослых и детей старше 14 лет</th>
                  <th class="px-3 py-2 align-middle w-[26%] text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700">У детей</th>
                  <th class="px-3 py-2 align-middle w-[26%] text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700">У новорождённых при рождении</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                <tr v-for="(r, i) in (item?.data?.rows || [])" :key="i">
                  <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.stage)"></td>
                  <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.adults)"></td>
                  <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.children)"></td>
                  <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.newborns)"></td>
                </tr>
              </tbody>
            </table>
          </div>
          <div class="px-4 py-3 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700">
            <p class="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">Примечание</p>
          <ol class="list-decimal pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li v-for="(n, i) in (item?.data?.notes || [])" :key="i" v-html="format(n)"></li>
          </ol>
          </div>
        </div>
        <div v-if="!pending && !item" class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300">Пока нет данных. Добавьте их в админке.</div>
        <div v-if="pending" class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
      </div>
    </main>

    <UModal v-model:open="isOpen" :title="selected?.title || 'Параметры СЛР'" :ui="{ overlay: 'bg-slate-700/50', wrapper: 'sm:max-w-4xl' }">
      <template #body>
        <div v-if="selected" class="overflow-x-auto">
          <table class="min-w-full w-full table-fixed text-sm text-slate-800 dark:text-slate-200" style="min-width: 800px;">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-700/60">
                <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[22%]">Этап</th>
                <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[26%]">Взрослые / ≥14 лет</th>
                <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[26%]">Дети</th>
                <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[26%]">Новорождённые</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr v-for="(r, i) in selected.rows" :key="i">
                <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.stage)"></td>
                <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.adults)"></td>
                <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.children)"></td>
                <td class="align-top px-3 py-3 border-x border-slate-200 dark:border-slate-700" v-html="format(r.newborns)"></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="selected?.notes?.length" class="mt-4 px-1">
          <p class="text-xs text-slate-600 dark:text-slate-300 font-medium mb-1">Примечание</p>
          <ol class="list-decimal pl-5 space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <li v-for="(n, i) in selected.notes" :key="i" v-html="format(n)"></li>
          </ol>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" @click="isOpen = false" class="cursor-pointer">Закрыть</UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'СЛР' })

const pending = ref(true)
const { data, refresh } = await useFetch('/api/classroom/section/cpr', { method: 'GET' })
const item = computed(() => data.value?.item || null)
watchEffect(() => { pending.value = !data.value })

const isOpen = ref(false)
const selected = ref<any | null>(null)
const open = () => { if (item.value) { selected.value = { title: item.value.title, rows: (item.value.data?.rows||[]), notes: (item.value.data?.notes||[]) }; isOpen.value = true } }

import { marked } from 'marked'
const route = useRoute()
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod = await import('dompurify')
  const createDOMPurify = (mod as any).default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}
const format = (t: string) => sanitizeHtml(marked.parse((t || '').replace(/\r\n?/g, '\n')) as string)

// Закладки — как в calculators/gcs
const userBookmarks = ref<any[]>([])
const isBookmarked = ref(false)

async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

function buildUrl() { return route.path || '/classroom/cpr' }

async function updateIsBookmarked() {
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const targetUrl = buildUrl()
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
}

async function addBookmark() {
  const res: any = await $fetch('/api/bookmarks', {
    method: 'POST',
    body: {
      type: 'classroom',
      title: item.value?.title || 'Параметры проведения СЛР',
      category: 'Учебный класс',
      url: buildUrl()
    }
  }).catch((e: any) => e?.data || { success: false })
  if (res?.success || res?.message === 'Закладка уже существует') {
    isBookmarked.value = true
    await loadBookmarks()
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: res?.success ? 'Добавлено в закладки' : 'Уже в закладках', color: 'primary' })
    if (process.client) window.dispatchEvent(new CustomEvent('bookmarks-updated'))
  } else {
    // @ts-ignore
    const toast = useToast?.()
    const title = res?.message || 'Не удалось добавить в закладки'
    const description = (res?.message === 'Токен не найден' || res?.message === 'Ошибка авторизации') ? 'Войдите в аккаунт и попробуйте ещё раз' : undefined
    toast?.add?.({ title, description, color: 'error' })
  }
}

async function removeBookmark() {
  const targetUrl = buildUrl()
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
  if (!bm?._id) return
  await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
  isBookmarked.value = false
  userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
  // @ts-ignore
  const toast = useToast?.()
  toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
  if (process.client) window.dispatchEvent(new CustomEvent('bookmarks-updated'))
}

async function toggleBookmark() {
  if (isBookmarked.value) await removeBookmark()
  else await addBookmark()
}

onMounted(() => { updateIsBookmarked() })
</script>

<style scoped>
/* Убираем внешние вертикальные границы у первой и последней колонок */
.table-cpr :deep(thead th:first-child),
.table-cpr :deep(tbody td:first-child) {
  border-left-width: 0 !important;
}
.table-cpr :deep(thead th:last-child),
.table-cpr :deep(tbody td:last-child) {
  border-right-width: 0 !important;
}
</style>
