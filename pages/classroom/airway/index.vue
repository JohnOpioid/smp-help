<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 pt-8">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2 text-sm">
              <NuxtLink to="/classroom" class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline">
                Учебный класс
              </NuxtLink>
              <span class="text-slate-400 dark:text-slate-500">/</span>
              <span class="text-slate-900 dark:text-white">Проходимость дыхательных путей</span>
            </div>
            <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Проходимость дыхательных путей</h1>
          </div>
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

        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <USelect v-model="currentTab" :items="tabs" size="lg" class="w-40" />
            <button
              type="button"
              title="Вернуть схему в исходное положение"
              class="rounded-md font-medium transition-colors text-sm gap-1.5 text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 focus:outline-none focus-visible:bg-accented/75 p-1 cursor-pointer h-8 w-8 flex items-center justify-center"
              @click="resetViewport"
            >
              <UIcon name="i-heroicons:arrows-pointing-in" class="size-6" />
            </button>
          </div>
          <ClientOnly>
            <div class="h-[70vh]">
              <FlowViewer ref="flowViewerRef" :graph="graphToShow" />
            </div>
          </ClientOnly>
        </div>

        <div v-if="!pending && !item" class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300 mt-4">Пока нет данных. Добавьте их в админке.</div>
        <div v-if="pending" class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300 mt-4">Загрузка...</div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Проходимость ДП' })
import { ref, computed, watchEffect, onMounted } from 'vue'
const route = useRoute()

const tabs = [
  { label: 'Дети', value: 'children' },
  { label: 'Взрослые', value: 'adults' }
]
const currentTab = ref<'children' | 'adults'>('children')

const pending = ref(true)
const { data } = await useFetch<{ success: boolean; item?: any; message?: string }>('/api/classroom/section/airway', { method: 'GET' })
// @ts-ignore - API может возвращать либо {success, item}, либо {success, message}
const item = computed<any>(() => {
  if (!data.value) return null
  return (data.value as any)?.item ?? null
})
watchEffect(() => { pending.value = !data.value })

const graphToShow = computed(() => {
  const g = item.value?.data?.[currentTab.value]
  return g || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
})

// Компонент просмотра (ленивая загрузка vue-flow)
// @ts-ignore - динамический импорт компонента
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
const FlowViewer = defineAsyncComponent(() => import('~/components/airway/FlowViewer.vue') as Promise<any>)
const flowViewerRef = ref<any>(null)

// Функция для сброса viewport в исходное положение
function resetViewport() {
  if (flowViewerRef.value && typeof flowViewerRef.value.resetViewport === 'function') {
    flowViewerRef.value.resetViewport()
  }
}

// Закладки
const userBookmarks = ref<any[]>([])
const isBookmarked = ref(false)
async function loadBookmarks() { try { const r:any = await $fetch('/api/bookmarks'); if (r?.success) userBookmarks.value = r.items||[] } catch {} }
function buildUrl() { return route.path || '/classroom/airway' }
async function updateIsBookmarked() { if (userBookmarks.value.length===0) await loadBookmarks(); isBookmarked.value = userBookmarks.value.some((b:any)=> b.url===buildUrl()) }
async function addBookmark() {
  const res:any = await $fetch('/api/bookmarks', { method: 'POST', body: { type: 'classroom', title: 'Проходимость дыхательных путей', category: 'Учебный класс', url: buildUrl() } }).catch((e:any)=> e?.data || { success:false })
  if (res?.success || res?.message==='Закладка уже существует') { isBookmarked.value = true; await loadBookmarks(); const toast = (useToast as any)?.(); toast?.add?.({ title: res?.success?'Добавлено в закладки':'Уже в закладках', color: 'primary' }); if (process.client) window.dispatchEvent(new CustomEvent('bookmarks-updated')) } else { const toast=(useToast as any)?.(); toast?.add?.({ title: res?.message || 'Не удалось добавить в закладки', color:'error' }) }
}
async function removeBookmark() { const t = buildUrl(); if (userBookmarks.value.length===0) await loadBookmarks(); const bm = userBookmarks.value.find((b:any)=> b.url===t); if (!bm?._id) return; await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' }); isBookmarked.value=false; userBookmarks.value = userBookmarks.value.filter((b:any)=> b._id!==bm._id); const toast=(useToast as any)?.(); toast?.add?.({ title: 'Удалено из закладок', color:'neutral' }); if (process.client) window.dispatchEvent(new CustomEvent('bookmarks-updated')) }
async function toggleBookmark() { if (isBookmarked.value) await removeBookmark(); else await addBookmark() }
onMounted(() => updateIsBookmarked())
</script>


