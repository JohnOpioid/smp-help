<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-4">
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ title }}</h1>

    <template v-if="type === 'list'">
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <p class="text-sm text-slate-600 dark:text-slate-300">Список доступных инструкций</p>
        </div>
        <ul class="divide-y divide-slate-100 dark:divide-slate-700">
          <li v-for="(it, i) in listItems" :key="i" class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer" @click="openItem(i)">
            <div class="flex items-center justify-between">
              <p class="text-slate-900 dark:text-white font-medium">{{ it.title }}</p>
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div class="md-content md-preview text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ itemPreview(it) }}</div>
          </li>
        </ul>
      </div>

      <template v-if="!isMobile">
        <UModal 
          v-model:open="open"
          :title="currentItem?.title || ''"
          description="Инструкция"
          :ui="{
            overlay: 'bg-slate-700/50',
            wrapper: 'sm:max-w-lg',
            content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
            body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
            close: 'cursor-pointer'
          }"
        >
          <template #body>
            <div class="space-y-3">
              <div v-for="(f, fi) in (currentItem?.fields || [])" :key="fi" class="space-y-1">
                <div v-if="f.label" class="text-sm text-slate-500 dark:text-slate-400">{{ f.label }}</div>
                <div v-if="f.type === 'input'" class="text-slate-900 dark:text-white">{{ f.value }}</div>
                <div v-else class="md-content leading-6 text-slate-700 dark:text-slate-300" v-html="md(f.value)"></div>
              </div>
            </div>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="close" class="cursor-pointer">Закрыть</UButton>
            </div>
          </template>
        </UModal>
      </template>

      <template v-else>
        <ClientOnly>
          <BottomSheet v-model="open" :title="currentItem?.title" @close="close">
            <div class="p-4 pb-6">
              <div class="space-y-3">
                <div v-for="(f, fi) in (currentItem?.fields || [])" :key="fi" class="space-y-1">
                  <div v-if="f.label" class="text-sm text-slate-500 dark:text-slate-400">{{ f.label }}</div>
                  <div v-if="f.type === 'input'" class="text-slate-900 dark:text-white">{{ f.value }}</div>
                  <div v-else class="md-content leading-6 text-slate-700 dark:text-slate-300 text-sm" v-html="md(f.value)"></div>
                </div>
              </div>
            </div>
            <template #footer>
              <div class="flex justify-end">
                <UButton color="neutral" variant="ghost" type="button" @click="close" class="cursor-pointer">Закрыть</UButton>
              </div>
            </template>
          </BottomSheet>
        </ClientOnly>
      </template>
    </template>

    <template v-else-if="type === 'table'">
      <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
        <div v-if="tableData?.item?.title" class="p-4 border-b border-slate-100 dark:border-slate-700">
          <h2 class="text-lg font-semibold text-slate-900 dark:text-white">{{ tableData.item.title }}</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border-collapse" style="border: none !important;">
            <tbody>
              <tr 
                v-for="(row, r) in tableGrid" 
                :key="r"
                :class="(tableData?.item?.rowStyles && tableData.item.rowStyles[r]?.rowClass) ? tableData.item.rowStyles[r].rowClass : ''"
              >
                <template v-for="(cell, c) in row" :key="c">
                  <td 
                    v-if="!cell.hidden"
                    :colspan="cell.colspan || 1" 
                    :rowspan="cell.rowspan || 1"
                    :class="[
                      'p-2 min-w-[100px] min-h-[40px] border border-slate-200 dark:border-slate-700',
                      cell.verticalAlign === 'middle' ? 'align-middle' : cell.verticalAlign === 'bottom' ? 'align-bottom' : 'align-top',
                      (tableData?.item?.columnStyles && tableData.item.columnStyles[c]?.columnClass) ? tableData.item.columnStyles[c].columnClass : '',
                      cell.cellClass || ''
                    ]"
                    :style="{
                      textAlign: cell.textAlign || 'left',
                      width: tableData?.item?.columnStyles?.[c]?.width || undefined,
                      verticalAlign: cell.verticalAlign || 'top'
                    }"
                  >
                    <div 
                      class="w-full h-full flex"
                      :class="{
                        'items-start': cell.verticalAlign === 'top' || !cell.verticalAlign,
                        'items-center': cell.verticalAlign === 'middle',
                        'items-end': cell.verticalAlign === 'bottom'
                      }"
                    >
                      <div v-if="!cell.value || cell.value.trim() === ''" style="min-height: 36px; width: 100%;"></div>
                      <div v-else class="md-content" v-html="fmt(cell.value)"></div>
                    </div>
                  </td>
                </template>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="tableNotes.length" class="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60">
          <p class="text-xs text-slate-600 dark:text-slate-300 font-medium mb-2">Примечания</p>
          <div class="space-y-1 text-sm text-slate-600 dark:text-slate-300">
            <div v-for="(n, i) in tableNotes" :key="i" v-html="fmt(n)"></div>
          </div>
        </div>
      </div>
    </template>

    <template v-else-if="type === 'scheme'">
      <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-end">
          <button
            type="button"
            title="Вернуть схему в исходное положение"
            class="rounded-md font-medium transition-colors text-sm gap-1.5 text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 focus-visible:bg-accented/75 p-1 cursor-pointer h-8 w-8 flex items-center justify-center"
            @click="resetViewport"
          >
            <UIcon name="i-heroicons:arrows-pointing-in" class="size-6" />
          </button>
        </div>
        <ClientOnly>
          <div class="h-[70vh]">
            <FlowViewer v-if="schemeGraph" ref="flowViewerRef" :graph="schemeGraph" />
            <div v-else class="flex items-center justify-center h-full text-sm text-slate-500 dark:text-slate-400">
              Загрузка схемы...
            </div>
          </div>
        </ClientOnly>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Учебная комната' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data: pagesData } = await useFetch('/api/classroom/pages', { server: true })
const found = computed<any>(() => (pagesData.value?.items || []).find((x: any) => x.slug === slug.value))

const type = computed<'list'|'table'|'scheme'|null>(() => (found.value?.type || null))
const title = computed(() => found.value?.title || '')

const listItems = ref<any[]>([])
const open = ref(false)
const currentIndex = ref<number | null>(null)
const currentItem = computed<any | null>(() => (currentIndex.value != null ? listItems.value[currentIndex.value] : null))
const { isMobile } = useIsMobile()
const tableData = ref<any>(null)
const tableGrid = computed(() => {
  if (!tableData.value?.item?.grid || !Array.isArray(tableData.value.item.grid)) return []
  return tableData.value.item.grid
})
const tableNotes = computed(() => {
  if (!tableData.value?.item?.notes || !Array.isArray(tableData.value.item.notes)) return []
  return tableData.value.item.notes
})
const schemeData = ref<any>(null)
const schemeGraph = computed(() => {
  if (!schemeData.value?.item?.data) return null
  // Если data уже содержит nodes/edges напрямую, используем его
  if (schemeData.value.item.data.nodes) {
    return schemeData.value.item.data
  }
  // Если data - это объект с вкладками, берем первую вкладку
  if (typeof schemeData.value.item.data === 'object') {
    const firstKey = Object.keys(schemeData.value.item.data)[0]
    if (firstKey) {
      return schemeData.value.item.data[firstKey] || { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    }
  }
  return { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
})

// Компонент просмотра схемы
// @ts-ignore
const FlowViewer = defineAsyncComponent(() => import('~/components/airway/FlowViewer.vue') as Promise<any>)
const flowViewerRef = ref<any>(null)

// Функция для сброса viewport в исходное положение
function resetViewport() {
  if (flowViewerRef.value && typeof flowViewerRef.value.resetViewport === 'function') {
    flowViewerRef.value.resetViewport()
  }
}

watchEffect(async () => {
  if (!type.value || !slug.value) return
  if (type.value === 'list') {
    const res: any = await $fetch(`/api/classroom/list/${slug.value}`)
    listItems.value = (res?.item?.items || [])
  } else if (type.value === 'table') {
    const res: any = await $fetch(`/api/cpr/${slug.value}`)
    tableData.value = res
  } else if (type.value === 'scheme') {
    const res: any = await $fetch(`/api/classroom/airway/${slug.value}`)
    schemeData.value = res
  }
})

function close() { open.value = false }

function itemPreview(it: any) {
  const values = (it?.fields || []).map((f: any) => String(f?.value || ''))
  return values.join('\n').slice(0, 500)
}

function openItem(i: number) {
  currentIndex.value = i
  open.value = true
}

import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod = await import('dompurify')
  const createDOMPurify = (mod as any).default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}
const fmt = (t: string) => sanitizeHtml(marked.parse((t || '').replace(/\r\n?/g, '\n')) as string)
const md = (t: string) => fmt(t)
</script>

<style scoped>
/* Убираем внешние border у таблицы */
table {
  border: none !important;
}

table tbody tr:first-child td {
  border-top: none !important;
}

table tbody tr:last-child td {
  border-bottom: none !important;
}

table tbody tr td:first-child {
  border-left: none !important;
}

table tbody tr td:last-child {
  border-right: none !important;
}

/* Обеспечиваем минимальную высоту для пустых ячеек, как в админке */
table tbody tr td {
  min-height: 40px;
  height: auto;
  display: table-cell;
  vertical-align: top;
}

/* Для пустых ячеек устанавливаем минимальную высоту */
table tbody tr td > div:first-child:empty,
table tbody tr td > div:first-child:has(> :empty) {
  min-height: 36px;
  display: block;
}
</style>


