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
            <span class="text-slate-900 dark:text-white">Проходимость дыхательных путей</span>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Редактор: Проходимость дыхательных путей</h1>
        </div>

        <!-- Контекстное меню заменяет верхнюю панель действий -->

        <div class="flex-1 flex flex-col min-h-0">
          <ClientOnly>
            <UContextMenu :items="cmItems" :ui="{ content: 'w-64' }">
              <div ref="canvasWrap"
                class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex-1 flex flex-col min-h-0"
                style="border-width: 1px;"
                @contextmenu.capture="prepareMenu">
                <FlowEditor v-if="loaded" v-model:graph="workingGraph" 
                  @update:graph="(g: any) => { 
                    // ВАЖНО: Проверяем существование объекта g
                    if (!g) {
                      return
                    }
                    
                    // ВАЖНО: Не перезаписываем workingGraph если идет сохранение
                    if (isSaving) {
                      return
                    }
                    
                    const newEdgesCount = (g?.edges || []).length
                    const currentEdgesCount = (workingGraph.value?.edges || []).length
                    
                    // ВАЖНО: Сохраняем существующие edges, если новые пустые, но старые есть
                    // Это предотвращает потерю edges при промежуточных обновлениях
                    if (newEdgesCount === 0 && currentEdgesCount > 0) {
                      // Не перезаписываем, если новые edges пустые, а старые есть
                      // Вместо этого обновляем только nodes и viewport, сохраняя edges
                      if (g.nodes && g.viewport) {
                        workingGraph.value = {
                          ...workingGraph.value,
                          nodes: g.nodes,
                          viewport: g.viewport
                          // edges остаются без изменений
                        }
                      }
                      return
                    }
                    
                    // Обновляем полностью только если есть edges или их количество изменилось
                    workingGraph.value = g 
                  }"
                  @select="onSelectNodeLeft"
                  @select-edge="onSelectEdgeLeft" 
                  @context-select-node="onSelectNodeCtx"
                  @context-select-edge="onSelectEdgeCtx" 
                  ref="flowRef" />
                <div v-else
                  class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300">
                  Загрузка...</div>
              </div>
            </UContextMenu>
          </ClientOnly>
        </div>

        <!-- Кнопки управления внизу -->
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mt-4 pb-8 flex-shrink-0">
          <div class="flex items-center gap-2">
            <USelect v-model="currentTab" :items="tabs" size="sm" class="w-40" />
          </div>
          <div class="flex items-center gap-2">
            <UButton variant="soft" class="cursor-pointer" @click="autoLayout">Авторасстановка</UButton>
            <UButton color="primary" variant="solid" class="cursor-pointer" @click="save">Сохранить</UButton>
          </div>
        </div>

        <USlideover v-if="panelOpen" v-model:open="panelOpen" side="right"
          :title="selectedNodeId ? (isNewNode ? 'Новый блок' : 'Свойства узла') : 'Свойства связи'"
          description="Панель редактирования элемента диаграммы" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <div class="p-0 flex flex-col gap-3">
              <template v-if="selectedNodeId">
                <UInput v-model="nodeTitle" placeholder="Заголовок" size="lg" />
                <UTextarea v-model="nodeBody" :rows="10" placeholder="Markdown контент" size="lg" />
                <div class="flex flex-col gap-2">
                  <div class="text-sm text-slate-600 dark:text-slate-300">Цвет блока</div>
                  <div class="flex items-center gap-3">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="neutral" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'neutral' 
                          ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      ]"></span>
                      <span class="text-sm">Обычный</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="blue" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'blue' 
                          ? 'border-blue-400 dark:border-blue-500 bg-blue-100 dark:bg-blue-700' 
                          : 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/30'
                      ]"></span>
                      <span class="text-sm">Синий</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="pink" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'pink' 
                          ? 'border-pink-400 dark:border-pink-500 bg-pink-100 dark:bg-pink-700' 
                          : 'border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-900/30'
                      ]"></span>
                      <span class="text-sm">Розовый</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="green" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'green' 
                          ? 'border-green-400 dark:border-green-500 bg-green-100 dark:bg-green-700' 
                          : 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/30'
                      ]"></span>
                      <span class="text-sm">Зелёный</span>
                    </label>
                  </div>
                </div>
              </template>
              <template v-else>
                <UInput v-model="edgeLabel" placeholder="Подпись на стрелке" size="lg" />
                <div class="flex items-center gap-2 text-sm">
                  <UCheckbox v-model="edgeDashed" />
                  <span>Пунктирная линия</span>
                </div>
              </template>
            </div>
          </template>
          <template #footer>
            <UButton color="primary" class="cursor-pointer" @click="applyAndClose">Сохранить</UButton>
            <UButton variant="soft" class="cursor-pointer" @click="panelOpen = false">Отмена</UButton>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Учебный класс' })
import { ref, computed, watch, onMounted, nextTick, defineAsyncComponent } from 'vue'
import type { ContextMenuItem } from '@nuxt/ui'
import { MarkerType } from '@vue-flow/core'

const tabs = [{ label: 'Дети', value: 'children' }, { label: 'Взрослые', value: 'adults' }]
const currentTab = ref<'children' | 'adults'>('children')

const { data, refresh } = await useFetch<any>('/api/classroom/section/airway', { method: 'GET' })
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const item = computed<any>(() => (data as any)?.value?.item || null)
const loaded = computed(() => Boolean(item.value))

const workingGraph = ref<any>({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } })
let isSaving = false // Флаг для предотвращения перезаписи при сохранении
watch([item, currentTab], () => {
  // Не перезаписываем workingGraph если идет процесс сохранения
  if (isSaving) {
    return
  }
  
  const g = item.value?.data?.[currentTab.value]
  if (g) {
    // ВАЖНО: Убеждаемся, что edges всегда присутствуют и правильно структурированы
    const graph = JSON.parse(JSON.stringify(g))
    if (!graph.edges) graph.edges = []
    if (!graph.nodes) graph.nodes = []
    if (!graph.viewport) graph.viewport = { x: 0, y: 0, zoom: 1 }
    
    // ВАЖНО: Создаем Set с ID всех nodes для быстрой проверки
    const nodeIds = new Set((graph.nodes || []).map((n: any) => n.id))
    
    // Нормализуем edges - убеждаемся, что все необходимые поля присутствуют
    // И фильтруем edges, которые ссылаются на несуществующие nodes
    const normalizedEdges = (graph.edges || [])
      .filter((e: any) => {
        // Фильтруем только те edges, у которых source и target существуют в nodes
        return e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target)
      })
      .map((e: any) => {
        // ВАЖНО: markerEnd может быть строкой из БД ("arrowclosed") или константой
        let markerEnd = e.markerEnd || MarkerType.ArrowClosed
        if (typeof markerEnd === 'string') {
          // Преобразуем строку в константу MarkerType
          if (markerEnd === 'arrowclosed' || markerEnd === 'arrow-closed') {
            markerEnd = MarkerType.ArrowClosed
          } else if (markerEnd === 'arrow') {
            markerEnd = MarkerType.Arrow
          }
        }
        
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle, // ВАЖНО: Сохраняем sourceHandle для правильного соединения
          targetHandle: e.targetHandle, // ВАЖНО: Сохраняем targetHandle для правильного соединения
          type: e.type || 'step',
          markerEnd: markerEnd,
          label: e.label !== undefined ? e.label : '',
          data: e.data || {},
          style: e.style || {},
          pathOptions: e.pathOptions || { borderRadius: 8 }
        }
      })
    
    // ВАЖНО: Проверяем, не идентичны ли данные уже существующим в workingGraph
    // Если текущие edges есть, а новые пустые - не перезаписываем
    const currentEdgesCount = (workingGraph.value?.edges || []).length
    if (normalizedEdges.length === 0 && currentEdgesCount > 0) {
      return
    }
    
    const currentEdgesIds = new Set((workingGraph.value?.edges || []).map((e: any) => e.id))
    const newEdgesIds = new Set(normalizedEdges.map((e: any) => e.id))
    const edgesChanged = normalizedEdges.length !== currentEdgesCount ||
      !normalizedEdges.every(e => currentEdgesIds.has(e.id)) ||
      !(workingGraph.value?.edges || []).every((e: any) => newEdgesIds.has(e.id))
    
    // Проверяем изменения в nodes (только по ID, чтобы не перезаписывать при каждом изменении)
    const currentNodeIds = new Set((workingGraph.value?.nodes || []).map((n: any) => n.id))
    const newNodeIds = new Set((graph.nodes || []).map((n: any) => n.id))
    const nodesChanged = (graph.nodes || []).length !== (workingGraph.value?.nodes || []).length ||
      !(graph.nodes || []).every((n: any) => currentNodeIds.has(n.id)) ||
      !(workingGraph.value?.nodes || []).every((n: any) => newNodeIds.has(n.id))
    
    if (edgesChanged || nodesChanged) {
      workingGraph.value = {
        nodes: graph.nodes || [],
        edges: normalizedEdges,
        viewport: graph.viewport || { x: 0, y: 0, zoom: 1 }
      }
    }
  } else {
    workingGraph.value = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
  }
}, { immediate: true })

// Панель свойств
const selectedNodeId = ref<string | null>(null)
const flowRef = ref<any>(null)
const selectedEdgeId = ref<string | null>(null)
const panelOpen = ref(false)
const isNewNode = ref(false)
const addMode = ref<'none' | 'edge'>('none')
const pendingSourceId = ref<string | null>(null)
const nodeTitle = ref('')
const nodeBody = ref('')
const nodeTone = ref<'neutral' | 'blue' | 'pink' | 'green'>('neutral')
const edgeLabel = ref('')
const edgeDashed = ref(false)
const toneOptions = [
  { label: 'Обычный', value: 'neutral' },
  { label: 'Синий', value: 'blue' },
  { label: 'Розовый', value: 'pink' },
]

function syncPanel() {
  if (!selectedNodeId.value) {
    nodeTitle.value = ''
    nodeBody.value = ''
    nodeTone.value = 'neutral'
    return
  }
  const n = (workingGraph.value.nodes || []).find((x: any) => x.id === selectedNodeId.value)
  if (!n) {
    nodeTitle.value = ''
    nodeBody.value = ''
    nodeTone.value = 'neutral'
    return
  }
  // Синхронизируем поля формы с данными узла
  nodeTitle.value = n.data?.title || ''
  nodeBody.value = n.data?.bodyMd || ''
  nodeTone.value = n.data?.tone || 'neutral'
}

function addNode() {
  const id = 'n_' + Math.random().toString(36).slice(2, 8)
  const node = { id, type: 'block', position: { x: 100, y: 100 }, data: { title: 'Новый блок', bodyMd: '', tone: 'neutral' } }
  workingGraph.value.nodes = [...(workingGraph.value.nodes || []), node]
  selectedNodeId.value = id
  syncPanel()
}
function onAddClicked() {
  isNewNode.value = true
  addNode()
  panelOpen.value = true
}
function onSelectNodeLeft(id: string) {
  // Режим добавления связи: первый клик — источник, второй — цель
  if (addMode.value === 'edge') {
    if (!pendingSourceId.value) {
      pendingSourceId.value = id
      contextMode.value = 'canvas'
      return
    }
    if (pendingSourceId.value && pendingSourceId.value !== id) {
      const eid = 'e_' + Math.random().toString(36).slice(2, 8)
      // Используем straight для всех связей - они будут прямыми
      const newEdge: any = { 
        id: eid, 
        source: pendingSourceId.value, 
        target: id,
        // ВАЖНО: sourceHandle и targetHandle будут автоматически определены Vue Flow
        // при создании связи через перетаскивание, но для связи через клики используем центры
        sourceHandle: undefined, // Vue Flow автоматически определит при перетаскивании
        targetHandle: undefined, // Vue Flow автоматически определит при перетаскивании
        type: 'step',
        markerEnd: MarkerType.ArrowClosed,
        label: '', // Пустой label по умолчанию
        data: { dashed: false }, // По умолчанию не пунктирная
        pathOptions: {
          borderRadius: 8 // Сглаженные углы
        }
      }
      
      // ВАЖНО: Создаем новый массив для реактивности и обновляем workingGraph
      workingGraph.value = {
        ...workingGraph.value,
        edges: [...(workingGraph.value.edges || []), newEdge]
      }
    }
    // Выходим из режима добавления связи
    addMode.value = 'none'
    pendingSourceId.value = null
    return
  }
  // Обычное поведение: ЛКМ по узлу не открывает панель редактирования
  // Панель можно открыть только через контекстное меню
  return
}
function onSelectNodeCtx(id: string) {
  selectedNodeId.value = id
  selectedEdgeId.value = null
  contextMode.value = id ? 'node' : 'canvas'
}
function onSelectEdgeLeft(id: string) {
  selectedEdgeId.value = id
  selectedNodeId.value = null
  // Синхронизация происходит через watch(selectedEdgeId)
  panelOpen.value = true
}
function onSelectEdgeCtx(id: string) {
  selectedEdgeId.value = id
  selectedNodeId.value = null
  contextMode.value = id ? 'edge' : 'canvas'
}
function removeNode() {
  if (!selectedNodeId.value) return
  // ВАЖНО: Создаем новый объект для реактивности
  workingGraph.value = {
    ...workingGraph.value,
    nodes: (workingGraph.value.nodes || []).filter((x: any) => x.id !== selectedNodeId.value),
    edges: (workingGraph.value.edges || []).filter((e: any) => e.source !== selectedNodeId.value && e.target !== selectedNodeId.value)
  }
  selectedNodeId.value = null
  syncPanel()
}
function removeEdge() {
  if (!selectedEdgeId.value) return
  
  // ВАЖНО: Создаем новый массив edges для реактивности
  const newEdges = (workingGraph.value.edges || []).filter((e: any) => e.id !== selectedEdgeId.value)
  
  // ВАЖНО: Всегда обновляем workingGraph, даже если это последняя связь
  workingGraph.value = {
    ...workingGraph.value,
    edges: newEdges
  }
  
  selectedEdgeId.value = null
}
function applyToNode() {
  const idx = (workingGraph.value.nodes || []).findIndex((x: any) => x.id === selectedNodeId.value)
  if (idx === -1) return
  const currentNode = workingGraph.value.nodes[idx]
  const existingData = currentNode.data || {}
  
  // ВАЖНО: Сохраняем значения из формы напрямую, даже если они пустые
  // Это позволяет очищать поля (например, bodyMd)
  const title = nodeTitle.value.trim()
  const bodyMd = nodeBody.value // Сохраняем как есть, даже если пустая строка
  const tone = nodeTone.value || existingData.tone || 'neutral'
  
  const nodeData = { 
    ...existingData, // Сохраняем все остальные данные узла
    title: title,
    bodyMd: bodyMd,
    tone: tone
  }
  const n = { ...currentNode, data: nodeData }
  workingGraph.value.nodes.splice(idx, 1, n)
}
// мгновенно обновляем тон узла при выборе
watch(nodeTone, (val) => {
  if (!selectedNodeId.value) return
  const idx = (workingGraph.value.nodes || []).findIndex((x: any) => x.id === selectedNodeId.value)
  if (idx === -1) return
  const current = workingGraph.value.nodes[idx]
  // Важно: сохраняем ВСЕ существующие данные узла, только меняем tone
  const updated = { 
    ...current, 
    data: { 
      ...(current.data || {}), // Сохраняем все существующие данные (title, bodyMd и т.д.)
      tone: val // Меняем только tone
    } 
  }
  // Важно: обновляем через splice, не пересоздавая весь граф
  workingGraph.value.nodes.splice(idx, 1, updated)
  // Мгновенно отражаем изменение в отрисованном узле без пересоздания графа
  try { (flowRef as any)?.value?.setNodeTone?.(selectedNodeId.value, val) } catch {}
})

// Синхронизируем панель при её открытии
watch(panelOpen, async (isOpen) => {
  if (isOpen && selectedNodeId.value) {
    await nextTick()
    syncPanel()
  } else if (isOpen && selectedEdgeId.value) {
    await nextTick()
    syncEdgePanel()
  }
})

// Синхронизируем свойства связи при изменении selectedEdgeId
watch(selectedEdgeId, (newId) => {
  if (newId) {
    syncEdgePanel()
  } else {
    // Очищаем поля при сбросе выбора
    edgeLabel.value = ''
    edgeDashed.value = false
  }
})

function syncEdgePanel() {
  if (!selectedEdgeId.value) {
    edgeLabel.value = ''
    edgeDashed.value = false
    return
  }
  const e = (workingGraph.value.edges || []).find((x: any) => x.id === selectedEdgeId.value)
  if (!e) {
    edgeLabel.value = ''
    edgeDashed.value = false
    return
  }
  // Читаем label и dashed из разных источников для совместимости
  edgeLabel.value = e?.label || e?.data?.label || ''
  edgeDashed.value = Boolean(e?.data?.dashed || e?.style?.strokeDasharray)
}

function applyToEdge() {
  const idx = (workingGraph.value.edges || []).findIndex((x: any) => x.id === selectedEdgeId.value)
  if (idx === -1) return
  const oldEdge = workingGraph.value.edges[idx]
  const e: any = { 
    ...oldEdge,
    label: edgeLabel.value || '', // Обновляем label
    data: { 
      ...(oldEdge.data || {}), 
      dashed: edgeDashed.value 
    },
    style: { 
      ...(oldEdge.style || {}),
      ...(edgeDashed.value ? { strokeDasharray: '6 6' } : {})
    }
  }
  
  // Убираем strokeDasharray, если пунктир отключен
  if (!edgeDashed.value && e.style.strokeDasharray) {
    delete e.style.strokeDasharray
  }
  
  // ВАЖНО: Обновляем массив, создавая новый объект для реактивности
  workingGraph.value = {
    ...workingGraph.value,
    edges: workingGraph.value.edges.map((edge: any) => 
      edge.id === selectedEdgeId.value ? e : edge
    )
  }
}
function applyAndClose() { if (selectedNodeId.value) applyToNode(); if (selectedEdgeId.value) applyToEdge(); panelOpen.value = false }

async function save() {
  isSaving = true // Устанавливаем флаг сохранения
  
  try {
    // Очищаем workingGraph от циклических ссылок и Vue Flow специфичных свойств
    // Создаем чистый объект только с необходимыми данными для сохранения
    // ВАЖНО: Берем актуальные данные из workingGraph, включая все edges
    // ВАЖНО: Создаем Set с ID всех nodes для проверки существования
    const nodeIds = new Set((workingGraph.value.nodes || []).map((n: any) => n.id))
    
    const edgesToSave = (workingGraph.value.edges || []).filter((e: any) => {
      // Проверяем, что edge имеет все необходимые поля И ссылается на существующие nodes
      return e && e.id && e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target)
    })
    
    
    const cleanGraph = {
      nodes: (workingGraph.value.nodes || []).map((n: any) => ({
        id: n.id,
        position: n.position || { x: 0, y: 0 },
        data: n.data || {},
        type: n.type || 'block'
      })),
      edges: edgesToSave.map((e: any) => {
        // Преобразуем markerEnd в строку для сохранения в БД
        let markerEnd = e.markerEnd || MarkerType.ArrowClosed
        // Если это константа MarkerType, преобразуем в строку
        if (markerEnd === MarkerType.ArrowClosed || markerEnd === 'arrowclosed') {
          markerEnd = 'arrowclosed'
        } else if (markerEnd === MarkerType.Arrow || markerEnd === 'arrow') {
          markerEnd = 'arrow'
        } else if (typeof markerEnd !== 'string') {
          markerEnd = 'arrowclosed' // По умолчанию
        }
        
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle, // ВАЖНО: Сохраняем sourceHandle для правильного соединения
          targetHandle: e.targetHandle, // ВАЖНО: Сохраняем targetHandle для правильного соединения
          type: e.type || 'step',
          markerEnd: markerEnd,
          label: e.label !== undefined ? e.label : '',
          data: e.data || {},
          style: e.style || {},
          pathOptions: e.pathOptions || { borderRadius: 8 }
        }
      }),
      viewport: workingGraph.value.viewport || { x: 0, y: 0, zoom: 1 }
    }
    
    const payload = { 
      data: { ...(item.value?.data || {}), [currentTab.value]: cleanGraph }, 
      title: item.value?.title || 'Проходимость дыхательных путей' 
    }
    
    const result = await $fetch('/api/classroom/section/airway', { method: 'PATCH', body: payload })
    
    // @ts-ignore
    const toast = useToast?.(); toast?.add?.({ title: 'Сохранено', color: 'primary' })
    
    // ВАЖНО: Обновляем workingGraph напрямую из сохраненных данных перед refresh
    // Это предотвращает перезапись данных из БД, которые могут быть еще не обновлены
    if (result?.item?.data?.[currentTab.value]) {
      const savedGraph = result.item.data[currentTab.value]
      
      // ВАЖНО: Создаем Set с ID всех nodes для проверки существования
      const nodeIds = new Set((savedGraph.nodes || []).map((n: any) => n.id))
      
      // Нормализуем edges из сохраненных данных
      // Фильтруем edges, которые ссылаются на несуществующие nodes
      const normalizedEdges = (savedGraph.edges || [])
        .filter((e: any) => {
          // Фильтруем только те edges, у которых source и target существуют в nodes
          return e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target)
        })
        .map((e: any) => {
        let markerEnd = e.markerEnd || MarkerType.ArrowClosed
        if (typeof markerEnd === 'string') {
          if (markerEnd === 'arrowclosed' || markerEnd === 'arrow-closed') {
            markerEnd = MarkerType.ArrowClosed
          } else if (markerEnd === 'arrow') {
            markerEnd = MarkerType.Arrow
          }
        }
        
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          sourceHandle: e.sourceHandle, // ВАЖНО: Сохраняем sourceHandle для правильного соединения
          targetHandle: e.targetHandle, // ВАЖНО: Сохраняем targetHandle для правильного соединения
          type: e.type || 'step',
          markerEnd: markerEnd,
          label: e.label !== undefined ? e.label : '',
          data: e.data || {},
          style: e.style || {},
          pathOptions: e.pathOptions || { borderRadius: 8 }
        }
      })
      
      
      // ВАЖНО: Обновляем workingGraph напрямую, минуя все watchers
      workingGraph.value = {
        nodes: savedGraph.nodes || [],
        edges: normalizedEdges,
        viewport: savedGraph.viewport || { x: 0, y: 0, zoom: 1 }
      }
    }
    
    // ВАЖНО: Не вызываем refresh() сразу, чтобы не перезаписать данные из результата сохранения
    // Вместо этого обновляем данные асинхронно после задержки
    setTimeout(async () => {
      // Обновляем данные после сохранения
      await refresh()
      
      // Даем еще немного времени перед снятием флага
      await nextTick()
      setTimeout(() => {
        isSaving = false
      }, 500)
    }, 500) // Даем 500ms на то, чтобы все обновления завершились
  } catch (error) {
    console.error('Ошибка при сохранении:', error)
    isSaving = false
    throw error
  }
}

// Редактор
// @ts-ignore
const FlowEditor = defineAsyncComponent(() => import('~/components/airway/FlowEditor.vue'))

// Авторасстановка (ELK layered)
let ELK: any
async function autoLayout() {
  try {
    // Используем бандл без web-worker, совместимый с Vite
    ELK = ELK || (await import('elkjs/lib/elk.bundled.js')).default
    const elk = new ELK()
    const graph = {
      id: 'root',
      layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT' },
      children: (workingGraph.value.nodes || []).map((n: any) => ({ id: n.id, width: 280, height: 120 })),
      edges: (workingGraph.value.edges || []).map((e: any) => ({ id: e.id, sources: [e.source], targets: [e.target] }))
    }
    const res = await elk.layout(graph)
    const posById: Record<string, { x: number, y: number }> = {}
    for (const c of res.children || []) posById[c.id] = { x: c.x || 0, y: c.y || 0 }
    workingGraph.value.nodes = (workingGraph.value.nodes || []).map((n: any) => ({ ...n, position: posById[n.id] || n.position }))
  } catch (e) {
    // @ts-ignore
    const toast = useToast?.(); toast?.add?.({ title: 'Не удалось выполнить авторасстановку', color: 'error' })
  }
}

onMounted(() => { /* noop */ })

// Контекстное меню
const canvasWrap = ref<HTMLElement | null>(null)
const contextMode = ref<'canvas' | 'node' | 'edge'>('canvas')
const cmItems = computed<ContextMenuItem[][]>(() => {
  if (contextMode.value === 'canvas') {
    return [[
      {
        label: 'Добавить', icon: 'i-lucide-plus', children: [
          { label: 'Блок', icon: 'i-lucide-square-plus', onSelect: () => onAddAtCenter() },
          { label: 'Связь', icon: 'i-lucide-link', onSelect: () => { addMode.value = 'edge'; pendingSourceId.value = null } }
        ]
      },
      { label: 'Авторасстановка', icon: 'i-lucide-sparkles', onSelect: () => autoLayout() }
    ]]
  }
  if (contextMode.value === 'node') {
    return [[
      { label: 'Свойства', icon: 'i-lucide-edit', onSelect: () => { syncPanel(); panelOpen.value = true } },
      { label: 'Удалить узел', icon: 'i-lucide-trash', color: 'error', onSelect: () => removeNode() }
    ]]
  }
  return [[
    { label: 'Свойства', icon: 'i-lucide-edit', onSelect: () => { panelOpen.value = true } },
    { label: 'Удалить связь', icon: 'i-lucide-trash', color: 'error', onSelect: () => removeEdge() }
  ]]
})

function onAddAtCenter() {
  // Добавляем новый узел в центр видимой области
  const vp = workingGraph.value?.viewport || { x: 0, y: 0, zoom: 1 }
  const wrap = canvasWrap.value
  const rect = wrap ? wrap.getBoundingClientRect() : { width: 800, height: 500 }
  const graphX = (rect.width / 2 - vp.x) / (vp.zoom || 1)
  const graphY = (rect.height / 2 - vp.y) / (vp.zoom || 1)
  const id = 'n_' + Math.random().toString(36).slice(2, 8)
  const node = { id, type: 'block', position: { x: graphX - 140, y: graphY - 60 }, data: { title: 'Новый блок', bodyMd: '', tone: 'neutral' } }
  workingGraph.value.nodes = [...(workingGraph.value.nodes || []), node]
  selectedNodeId.value = id
  panelOpen.value = true
  isNewNode.value = true
  syncPanel()
}

let ignoreNextSynthetic = false
function prepareMenu(e: MouseEvent) {
  if (ignoreNextSynthetic) { ignoreNextSynthetic = false; return }
  // Определяем, по чему кликнули: узел / связь / пусто
  const target = e.target as HTMLElement | null
  if (!target) { contextMode.value = 'canvas'; return }
  const nodeEl = target.closest('.vue-flow__node') as HTMLElement | null
  if (nodeEl && nodeEl.dataset?.id) {
    selectedNodeId.value = nodeEl.dataset.id
    selectedEdgeId.value = null
    contextMode.value = 'node'
    return
  }
  const edgeEl = target.closest('.vue-flow__edge') as HTMLElement | null
  if (edgeEl && edgeEl.dataset?.id) {
    selectedEdgeId.value = edgeEl.dataset.id
    selectedNodeId.value = null
    contextMode.value = 'edge'
    return
  }
  // Пустая область: форсируем открытие меню на обёртке, т.к. VueFlow может гасить событие
  contextMode.value = 'canvas'
  selectedNodeId.value = null
  selectedEdgeId.value = null
  const wrap = canvasWrap.value
  if (wrap) {
    ignoreNextSynthetic = true
    const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY })
    wrap.dispatchEvent(evt)
  }
}
</script>
