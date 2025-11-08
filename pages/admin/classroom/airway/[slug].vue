<template>
  <div class="flex flex-col h-full">
    <main class="flex-1 flex flex-col overflow-hidden">
      <div class="max-w-5xl mx-auto px-2 md:px-4 pt-8 flex flex-col flex-1 w-full">
        <div class="mb-4 flex-shrink-0">
          <div class="flex items-center gap-2 mb-2 text-sm">
            <NuxtLink to="/admin/classroom" class="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors underline">
              Учебный класс
            </NuxtLink>
            <span class="text-slate-400 dark:text-slate-500">/</span>
            <span class="text-slate-900 dark:text-white">Схема</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Редактор схемы</h1>
        </div>

        <div class="flex-1 flex flex-col min-h-0">
          <ClientOnly>
            <UContextMenu :items="cmItems" :ui="{ content: 'w-64' }">
              <div ref="canvasWrap"
                class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex-1 flex flex-col min-h-0"
                style="border-width: 1px;"
                @contextmenu.capture="prepareMenu">
                <FlowEditor v-if="loaded" v-model:graph="workingGraph" />
                <div v-else class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
              </div>
            </UContextMenu>
          </ClientOnly>
        </div>

        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pb-8 flex-shrink-0">
          <div class="flex items-center gap-2">
            <USelect v-if="tabItems.length > 0" v-model="currentTab" :items="tabItems" size="sm" class="w-40" />
            <UButton size="xs" variant="soft" class="cursor-pointer" @click="addTab">Добавить вкладку</UButton>
          </div>
          <div class="flex items-center gap-2">
            <UButton color="error" variant="soft" @click="onDelete" class="cursor-pointer">Удалить</UButton>
            <UButton v-if="currentTab" color="primary" variant="solid" class="cursor-pointer" @click="save">Сохранить</UButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })
import { ref, computed, watch, defineAsyncComponent } from 'vue'
import type { ContextMenuItem } from '@nuxt/ui'
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))
const currentTab = ref<string | undefined>(undefined)
const tabItems = computed(() => Object.keys(item.value?.data || {}).map(k => ({ label: k === 'children' ? 'Дети' : (k === 'adults' ? 'Взрослые' : k), value: k })))

const data = ref<any>(null)
const refresh = async () => {
  if (!slug.value) return
  data.value = await $fetch<any>(`/api/classroom/airway/${slug.value}`)
}
if (slug.value) {
  await refresh()
}
const item = computed<any>(() => data.value?.item || null)
const loaded = computed(() => Boolean(item.value))

const workingGraph = ref<any>({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } })
const canvasWrap = ref<HTMLElement | null>(null)
const cmItems = computed<ContextMenuItem[][]>(() => [[
  { label: 'Добавить блок', icon: 'i-lucide-square-plus', onSelect: () => addNode() }
]])
watch(item, () => {
  if (item.value?.data && Object.keys(item.value.data).length > 0 && !currentTab.value) {
    currentTab.value = Object.keys(item.value.data)[0]
  }
}, { immediate: true })

watch(currentTab, () => {
  if (!currentTab.value) {
    workingGraph.value = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
    return
  }
  const g = item.value?.data?.[currentTab.value]
  workingGraph.value = g ? JSON.parse(JSON.stringify(g)) : { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
}, { immediate: true })

async function save() {
  if (!currentTab.value) return
  const clean = {
    nodes: (workingGraph.value.nodes || []).map((n: any) => ({ id: n.id, position: n.position, data: n.data, type: n.type || 'block' })),
    edges: (workingGraph.value.edges || []).map((e: any) => ({ id: e.id, source: e.source, target: e.target, sourceHandle: e.sourceHandle, targetHandle: e.targetHandle, type: e.type || 'step', markerEnd: typeof e.markerEnd === 'string' ? e.markerEnd : 'arrowclosed', label: e.label || '', data: e.data || {}, style: e.style || {}, pathOptions: e.pathOptions || { borderRadius: 8 } })),
    viewport: workingGraph.value.viewport || { x: 0, y: 0, zoom: 1 }
  }
  const payload = { data: { ...(item.value?.data || {}), [currentTab.value]: clean } }
  await $fetch(`/api/classroom/airway/${slug.value}`, { method: 'PATCH', body: payload })
  await refresh()
}

// @ts-ignore
const FlowEditor = defineAsyncComponent(() => import('~/components/airway/FlowEditor.vue'))

function addNode() {
  const id = 'n_' + Math.random().toString(36).slice(2, 8)
  const node = { id, type: 'block', position: { x: 100, y: 100 }, data: { title: 'Новый блок', bodyMd: '', tone: 'neutral' } }
  workingGraph.value.nodes = [...(workingGraph.value.nodes || []), node]
}
function prepareMenu(_e: MouseEvent) { /* canvas context only */ }
function addTab() {
  const name = prompt('Название вкладки:')
  if (!name) return
  const existing = { ...(item.value?.data || {}) }
  if (existing[name]) return
  existing[name] = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
  // optimistic update
  ;(item as any).value = { ...(item as any).value, data: existing }
  currentTab.value = name
}
async function onDelete() {
  if (!confirm('Удалить эту страницу?')) return
  await $fetch(`/api/classroom/airway/${slug.value}`, { method: 'DELETE' })
  const pagesVersion = useState<number>('classroomPagesVersion')
  if (pagesVersion) pagesVersion.value = (pagesVersion.value || 0) + 1
  await navigateTo('/admin/classroom')
}
</script>


