<template>
  <div class="h-full">
    <VueFlow
      v-if="editable"
      v-model:nodes="localNodes"
      v-model:edges="localEdges"
      :node-types="nodeTypes as any"
      :min-zoom="0.25"
      :max-zoom="2"
      :snap-to-grid="true"
      :snap-grid="snapGrid"
      :default-edge-options="defaultEdgeOptions"
      :connect-on-click="false"
      fit-view-on-init
      @node-click="onNodeClick"
      @edge-click="onEdgeClick"
      @node-context-menu="onNodeCtxMenu"
      @edge-context-menu="onEdgeCtxMenu"
      @connect="onConnect"
      @move="onMove"
      @nodes-change="onNodesChange"
      @edges-change="onEdgesChange"
    >
      <!-- Background компонент из Vue Flow -->
      <Background 
        variant="dots"
        :gap="20"
        :size="1"
        :pattern-color="isDark ? '#64748b' : '#94a3b8'"
      />
      
      <!-- Helper lines для выравнивания - как в официальном примере Vue Flow -->
      <HelperLines 
        :horizontal="helperLineHorizontal" 
        :vertical="helperLineVertical"
        :horizontal-distance="helperLineHorizontalDistance"
        :vertical-distance="helperLineVerticalDistance"
      />
    </VueFlow>

    <ReadOnlyFlow
      v-else
      ref="readOnlyFlowRef"
      :nodes="viewNodes"
      :edges="viewEdges"
      :default-viewport="graph.viewport || { x: 0, y: 0, zoom: 1 }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed, defineAsyncComponent, markRaw, nextTick, onMounted, onUnmounted } from 'vue'
import '@vue-flow/core/dist/style.css'
import type { NodeChange, EdgeChange, GraphNode, NodeDimensionChange } from '@vue-flow/core'

// Проверка темной темы
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Async client-safe imports per Vue Flow guide
const VueFlow = markRaw(defineAsyncComponent(async () => (await import('@vue-flow/core')).VueFlow))
const Background = markRaw(defineAsyncComponent(async () => {
  try {
    const module = await import('@vue-flow/background')
    // Background экспортируется как named export: export { default as Background }
    return (module as any).Background || module.default
  } catch (e) {
    console.error('Failed to load Background component:', e)
    // Fallback: возвращаем пустой компонент
    return { template: '<div></div>' }
  }
}))
const { MarkerType, useVueFlow } = await import('@vue-flow/core')
// EdgeChange уже импортирован выше

import NodeBlock from '~/components/airway/NodeBlock.vue'
import HelperLines from '~/components/airway/HelperLines.vue'
import { getHelperLines, getHelperLinesForResize } from '~/components/airway/helperLinesUtils'
const ReadOnlyFlow = markRaw(defineAsyncComponent(() => import('~/components/airway/ReadOnlyFlow.vue')))

const props = defineProps<{ graph: any; editable?: boolean; snapGrid?: [number, number] }>()
const emit = defineEmits(['update:graph', 'select', 'select-edge', 'context-select-node', 'context-select-edge'])

const editable = computed(() => {
  // Явно проверяем, что editable передан и равен true
  return Boolean(props.editable)
})
const snapGrid = computed<[number, number]>(() => props.snapGrid || [5, 5])
// Настройки связей с возможностью ломаться под 90 градусов
const defaultEdgeOptions = {
  type: 'step',
  markerEnd: MarkerType.ArrowClosed,
  pathOptions: {
    borderRadius: 8 // Сглаженные углы
  },
  style: {
    strokeWidth: 2, // Увеличиваем толщину стрелок
    stroke: '#94a3b8' // slate-400
  }
} as any

const nodeTypes = { block: markRaw(NodeBlock) } as any
const { updateNodeInternals, getNodes, getViewport, applyNodeChanges } = useVueFlow()

// Ref для ReadOnlyFlow компонента
const readOnlyFlowRef = ref<any>(null)

// Helper lines state - как в официальном примере
const helperLineHorizontal = ref<number | undefined>(undefined)
const helperLineVertical = ref<number | undefined>(undefined)
const helperLineHorizontalDistance = ref<number | undefined>(undefined)
const helperLineVerticalDistance = ref<number | undefined>(undefined)
const viewport = ref({ x: 0, y: 0, zoom: 1 })

// Ограничение движения по Shift - запоминаем начальную позицию и направление
const shiftDragState = ref<Map<string, { startX: number, startY: number, lockDirection: 'horizontal' | 'vertical' | null }>>(new Map())
const isShiftPressed = ref(false)

// Отслеживаем нажатие Shift глобально
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Shift' || e.shiftKey) {
    isShiftPressed.value = true
  }
}
const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key === 'Shift' || !e.shiftKey) {
    isShiftPressed.value = false
    // Очищаем состояние при отпускании Shift
    shiftDragState.value.clear()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
})

// Editable state
const localNodes = ref<any[]>([])
const localEdges = ref<any[]>([])
let isSyncing = false

// Отслеживаем изменения узлов с глубоким отслеживанием, но защитой от циклов
let lastNodesHash = ''
watch(() => props.graph?.nodes, async (newNodes, oldNodes) => {
  // Проверяем, что editable включен
  if (!editable.value || isSyncing || !newNodes) {
    return
  }
  // Создаем хеш для проверки реальных изменений (включая tone и другие свойства data)
  const nodesHash = JSON.stringify(newNodes.map((n: any) => ({ 
    id: n.id, 
    tone: n.data?.tone,
    title: n.data?.title,
    bodyMd: n.data?.bodyMd
  })))
  if (nodesHash === lastNodesHash) return
  lastNodesHash = nodesHash
  
  isSyncing = true
  // Создаём полностью новые объекты узлов для правильной реактивности
  localNodes.value = newNodes.map((n:any) => {
    const nodeConfig: any = {
      draggable: true,
      selectable: true,
      resizable: editable.value, // Включаем resize
      ...n,
      data: { ...n.data }, // Создаём новый объект data для реактивности
      style: {
        ...(n.style || {}),
        ...(n.data?.width ? { width: `${n.data.width}px` } : {}),
        ...(n.data?.height ? { height: `${n.data.height}px` } : {})
      }
    }
    // Устанавливаем размеры для Vue Flow
    if (n.data?.width) nodeConfig.width = n.data.width
    if (n.data?.height) nodeConfig.height = n.data.height
    return nodeConfig
  })
  await nextTick()
  // Принудительно обновляем все узлы для применения изменений
  try { 
    const nodeIds = localNodes.value.map(n => n.id)
    if (nodeIds.length > 0) {
      updateNodeInternals?.(nodeIds) 
    }
  } catch {}
  isSyncing = false
}, { immediate: true, deep: true })

watch(() => props.graph?.edges, (newEdges, oldEdges) => {
  if (!editable.value || isSyncing) return
  
  // Если новые edges null или undefined, очищаем localEdges
  if (!newEdges) {
    // Проверяем, есть ли удаленные edges - сравниваем ID
    const oldEdgeIds = new Set((oldEdges || []).map((e: any) => e.id))
    const currentEdgeIds = new Set(localEdges.value.map((e: any) => e.id))
    
    // Если в localEdges есть edges, которых нет в oldEdges, значит это не очистка
    const hasUnexpectedEdges = localEdges.value.some((e: any) => !oldEdgeIds.has(e.id))
    
    if (hasUnexpectedEdges) {
      // Это не очистка, а обновление - очищаем
      localEdges.value = []
    } else if (localEdges.value.length > 0 && oldEdges && oldEdges.length > 0) {
      // Старые edges были, но новые null - это может быть очистка после удаления
      // Проверяем, все ли edges из oldEdges удалены
      const allRemoved = oldEdges.every((e: any) => !currentEdgeIds.has(e.id))
      if (allRemoved) {
        // Все edges удалены - очищаем
        localEdges.value = []
      }
    } else {
      localEdges.value = []
    }
    return
  }
  
  // ВАЖНО: Если новые edges пустые, но старые были непустые - это удаление всех edges
  const currentEdgesCount = localEdges.value.length
  if (newEdges.length === 0 && currentEdgesCount > 0) {
    // Если oldEdges были непустые, а newEdges пустые - это удаление всех edges
    // Всегда синхронизируем с пустым массивом
    if (oldEdges && oldEdges.length > 0) {
      isSyncing = true
      localEdges.value = []
      isSyncing = false
      return
    }
    
    // Если oldEdges тоже были пустые, это может быть промежуточное обновление - пропускаем
    return
  }
  
  // Проверяем изменения: если нет oldEdges или изменилась длина или порядок
  const edgesChanged = !oldEdges || 
    newEdges.length !== oldEdges.length ||
    newEdges.some((e: any, i: number) => e.id !== oldEdges[i]?.id) ||
    newEdges.some((e: any) => {
      const old = oldEdges.find((oe: any) => oe.id === e.id)
      if (!old) return true
      // Проверяем изменения в основных свойствах
      return old.source !== e.source || 
             old.target !== e.target ||
             old.label !== e.label ||
             old.data?.dashed !== e.data?.dashed ||
             old.style?.strokeDasharray !== e.style?.strokeDasharray
    })
  
  // Проверяем, есть ли новые edges в props.graph, которых нет в localEdges
  // Это важно для синхронизации при загрузке данных
  const localEdgeIds = new Set(localEdges.value.map((e: any) => e.id))
  const newEdgeIds = new Set(newEdges.map((e: any) => e.id))
  const hasNewEdges = newEdges.some((e: any) => !localEdgeIds.has(e.id))
  const hasRemovedEdges = localEdges.value.some((e: any) => !newEdgeIds.has(e.id))
  
  // ВАЖНО: Всегда синхронизируем при первой загрузке или при изменении
  // Это гарантирует, что связи из БД правильно загружаются
  // При первой загрузке (oldEdges === undefined) всегда синхронизируем
  if (!oldEdges || edgesChanged || hasNewEdges || hasRemovedEdges) {
    isSyncing = true
    
    // ВАЖНО: Создаем Set с ID всех nodes для проверки существования
    const nodeIds = new Set((props.graph?.nodes || []).map((n: any) => n.id))
    
    // Создаем новый массив для реактивности
    // Фильтруем edges, которые ссылаются на несуществующие nodes
    localEdges.value = newEdges
      .filter((e: any) => {
        // Фильтруем только те edges, у которых source и target существуют в nodes
        return e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target)
      })
      .map((e:any) => {
      const edgeType = e.type || 'step'
      
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
      
      const edgeConfig: any = {
        ...e,
        type: edgeType,
        markerEnd: markerEnd,
        label: e.label !== undefined ? e.label : '' // Сохраняем label, даже если пустой
      }
      
      // ВАЖНО: Всегда создаем объект data, даже если его нет в исходных данных
      if (!edgeConfig.data) {
        edgeConfig.data = {}
      }
      
      // Добавляем pathOptions для step типа (ломанные линии под 90 градусов)
      if (edgeType === 'step') {
        edgeConfig.pathOptions = e.pathOptions || {
          borderRadius: 8 // Сглаженные углы
        }
      }
      
      // Всегда создаем объект style
      edgeConfig.style = {
        strokeWidth: 3, // Увеличиваем толщину стрелок
        ...(e.style || {})
      }
      
      // Если есть dashed в data или strokeDasharray в style, добавляем пунктир
      const isDashed = Boolean(e?.data?.dashed) || Boolean(e?.style?.strokeDasharray)
      if (isDashed) {
        edgeConfig.style.strokeDasharray = '6 6'
        // Убеждаемся, что data.dashed установлен для сохранения
        edgeConfig.data = {
          ...edgeConfig.data,
          dashed: true
        }
      } else {
        // Если пунктир отключен, убираем strokeDasharray
        if (edgeConfig.style.strokeDasharray) {
          delete edgeConfig.style.strokeDasharray
        }
        edgeConfig.data = {
          ...edgeConfig.data,
          dashed: false
        }
      }
      
      return edgeConfig
    })
    isSyncing = false
  }
}, { immediate: true, deep: true })

// Упрощенный watcher для синхронизации localEdges с родительским компонентом
// Обновляем только при реальных изменениях (добавление/удаление)
watch(() => localEdges.value.length, (newLength, oldLength) => {
  if (isSyncing || oldLength === undefined) return
  if (newLength !== oldLength) {
    // Изменилось количество edges - обновляем родительский компонент
    nextTick(() => {
      if (!isSyncing) {
        update()
      }
    })
  }
})

// Явно реагируем на изменения массива узлов/рёбер (например, смена data.tone)
// removed deep nodes/edges watcher to prevent feedback loops that may freeze the app

// Read-only computed
const viewNodes = computed(() => (props.graph?.nodes || []).map((n:any) => ({ ...n, draggable: false, selectable: false })))
const viewEdges = computed(() => {
  return (props.graph?.edges || []).map((e:any) => {
    const edgeType = e.type || 'step'
    const edgeConfig: any = {
      ...e,
      type: edgeType,
      markerEnd: e.markerEnd || MarkerType.ArrowClosed,
      selectable: false,
      label: e.label !== undefined ? e.label : '' // Сохраняем label, даже если пустой
    }
    
    // Добавляем pathOptions для step типа (ломанные линии под 90 градусов)
    if (edgeType === 'step') {
      edgeConfig.pathOptions = {
        borderRadius: 8 // Сглаженные углы
      }
    }
    
    // Всегда создаем объект style
    edgeConfig.style = {
      strokeWidth: 3, // Увеличиваем толщину стрелок
      ...(e.style || {})
    }
    
    // Если есть dashed в data или strokeDasharray в style, добавляем пунктир
    const isDashed = Boolean(e?.data?.dashed) || Boolean(e?.style?.strokeDasharray)
    if (isDashed) {
      edgeConfig.style.strokeDasharray = '6 6'
    } else {
      // Убираем пунктир, если он был установлен
      if (edgeConfig.style.strokeDasharray) {
        delete edgeConfig.style.strokeDasharray
      }
    }
    
    return edgeConfig
  })
})

function update(vp?: any) {
  if (isSyncing) return // Предотвращаем циклы при синхронизации
  
  // ВАЖНО: Проверяем, что localEdges существует
  if (!localEdges.value || !Array.isArray(localEdges.value)) {
    console.warn('localEdges.value is not an array, skipping update')
    return
  }
  
  // ВАЖНО: Если localEdges пустые, но в props.graph.edges есть edges - сохраняем их
  // Это предотвращает потерю edges при обновлении viewport (например, при onMove)
  let edgesToUse = localEdges.value
  if (edgesToUse.length === 0 && props.graph?.edges && props.graph.edges.length > 0) {
    // Используем edges из props, но нормализуем их
    edgesToUse = props.graph.edges.map((e: any) => {
      let markerEnd = e.markerEnd || MarkerType.ArrowClosed
      if (typeof markerEnd === 'string') {
        if (markerEnd === 'arrowclosed' || markerEnd === 'arrow-closed') {
          markerEnd = MarkerType.ArrowClosed
        } else if (markerEnd === 'arrow') {
          markerEnd = MarkerType.Arrow
        }
      }
      return {
        ...e,
        sourceHandle: e.sourceHandle, // ВАЖНО: Сохраняем sourceHandle
        targetHandle: e.targetHandle, // ВАЖНО: Сохраняем targetHandle
        markerEnd: markerEnd,
        data: e.data || {},
        style: e.style || {},
        pathOptions: e.pathOptions || { borderRadius: 8 }
      }
    })
  }
  
  // ВАЖНО: Создаем чистые объекты для edges, убирая все Vue Flow специфичные свойства
  const cleanEdges = edgesToUse.map((e: any) => {
    // Преобразуем markerEnd в строку для правильной сериализации
    let markerEnd = e.markerEnd || MarkerType.ArrowClosed
    if (markerEnd === MarkerType.ArrowClosed || markerEnd === 'arrowclosed') {
      markerEnd = 'arrowclosed'
    } else if (markerEnd === MarkerType.Arrow || markerEnd === 'arrow') {
      markerEnd = 'arrow'
    } else if (typeof markerEnd !== 'string') {
      markerEnd = 'arrowclosed'
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
      style: {
        strokeWidth: 2, // Увеличиваем толщину стрелок
        stroke: '#94a3b8', // slate-400
        ...(e.style || {})
      },
      pathOptions: e.pathOptions || { borderRadius: 8 }
    }
  })
  
  // ВАЖНО: Проверяем, что localNodes существует
  if (!localNodes.value || !Array.isArray(localNodes.value)) {
    console.warn('localNodes.value is not an array, skipping update')
    return
  }
  
  // ВАЖНО: Не отправляем обновление с пустыми edges только при обновлении viewport
  // При явном удалении edges (через onEdgesChange) всегда отправляем обновление
  if (cleanEdges.length === 0 && props.graph?.edges && props.graph.edges.length > 0 && vp) {
    // Если это обновление viewport (vp передан), обновляем только viewport без edges
    emit('update:graph', {
      nodes: localNodes.value,
      edges: props.graph.edges, // Сохраняем edges из props
      viewport: vp
    })
    return
  }
  
  const graphUpdate = {
    nodes: localNodes.value,
    edges: cleanEdges,
    viewport: vp ?? props.graph?.viewport ?? { x: 0, y: 0, zoom: 1 }
  }
  
  emit('update:graph', graphUpdate)
}

function isRightClick(ev: any) { return ev && (ev.button === 2 || ev.which === 3) }
function onNodeClick(event: any) { 
  const node = event?.node || event
  if (isRightClick(event)) return
  // Отправляем событие select, но панель редактирования не откроется автоматически
  // (логика открытия панели убрана из onSelectNodeLeft в index.vue)
  if (node?.id) emit('select', node.id) 
}
function onEdgeClick(event: any) {
  if (isRightClick(event)) return
  const edge = event?.edge || event
  if (edge?.id) emit('select-edge', edge.id)
}
function onNodeCtxMenu(event: any) {
  // Не останавливаем всплытие: наружное UContextMenu само откроется
  const node = event?.node || event
  if (node?.id) emit('context-select-node', node.id)
}
function onEdgeCtxMenu(event: any) {
  // Не останавливаем всплытие: наружное UContextMenu само откроется
  const edge = event?.edge || event
  if (edge?.id) emit('context-select-edge', edge.id)
}
function onConnect(params: any) {
  if (!params.source || !params.target) {
    return
  }
  
  // ВАЖНО: Vue Flow определяет source и target на основе направления перетаскивания
  // Если стрелка указывает в неправильную сторону, нужно поменять местами source и target
  // Простая логика: всегда меняем местами, так как Vue Flow определяет их наоборот
  
  const id = 'e_' + Math.random().toString(36).slice(2, 8)
  const edgeConfig: any = {
    id,
    source: params.target, // Меняем местами: то что было target становится source
    target: params.source,  // Меняем местами: то что было source становится target
    sourceHandle: params.targetHandle, // Меняем местами handles
    targetHandle: params.sourceHandle, // Меняем местами handles
    type: 'step',
    markerEnd: MarkerType.ArrowClosed, // Стрелка указывает на target (теперь это бывший source)
    pathOptions: {
      borderRadius: 8
    },
    label: '',
    data: { dashed: false },
    style: {
      strokeWidth: 3 // Увеличиваем толщину стрелок
    }
  }
  
  // Добавляем связь в локальный массив
  localEdges.value = [...localEdges.value, edgeConfig]
  
  // ВАЖНО: Обновляем родительский компонент сразу после добавления связи
  // Используем прямое обновление через emit, минуя функцию update для гарантии
  nextTick(() => {
    // Создаем чистые копии edges для отправки
    const cleanEdges = localEdges.value.map((e: any) => {
      // Преобразуем markerEnd в строку для правильной сериализации
      let markerEnd = e.markerEnd || MarkerType.ArrowClosed
      if (markerEnd === MarkerType.ArrowClosed || markerEnd === 'arrowclosed') {
        markerEnd = 'arrowclosed'
      } else if (markerEnd === MarkerType.Arrow || markerEnd === 'arrow') {
        markerEnd = 'arrow'
      } else if (typeof markerEnd !== 'string') {
        markerEnd = 'arrowclosed'
      }
      
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        sourceHandle: e.sourceHandle, // ВАЖНО: Сохраняем sourceHandle
        targetHandle: e.targetHandle, // ВАЖНО: Сохраняем targetHandle
        type: e.type || 'step',
        markerEnd: markerEnd,
        label: e.label !== undefined ? e.label : '',
        data: e.data || {},
      style: {
        strokeWidth: 2, // Увеличиваем толщину стрелок
        stroke: '#94a3b8', // slate-400
        ...(e.style || {})
      },
        pathOptions: e.pathOptions || { borderRadius: 8 }
      }
    })
    // Обновляем workingGraph напрямую
    emit('update:graph', { 
      nodes: localNodes.value, 
      edges: cleanEdges, 
      viewport: props.graph?.viewport || { x: 0, y: 0, zoom: 1 } 
    })
  })
}
function onMove(t: any) { 
  const vp = { x: t?.x ?? 0, y: t?.y ?? 0, zoom: t?.zoom ?? 1 }
  viewport.value = vp
  // ВАЖНО: Обновляем только viewport, если edges пустые - не отправляем обновление
  // Это предотвращает потерю edges при перемещении/зуме
  if (localEdges.value.length === 0 && props.graph?.edges && props.graph.edges.length > 0) {
    // Если edges пустые, но в props есть - не обновляем, чтобы не потерять edges
    return
  }
  update(vp) 
}

function updateHelperLines(changes: NodeChange[], nodes: GraphNode[]) {
  helperLineHorizontal.value = undefined
  helperLineVertical.value = undefined
  helperLineHorizontalDistance.value = undefined
  helperLineVerticalDistance.value = undefined
  
  // Обработка перемещения узла
  const positionChange = changes.find(c => c.type === 'position' && c.dragging && c.position)
  if (positionChange && positionChange.type === 'position') {
    // Если Shift зажат, ограничиваем движение
    if (isShiftPressed.value && positionChange.position) {
      const nodeId = positionChange.id
      const node = nodes.find(n => n.id === nodeId)
      
      if (node) {
        const currentState = shiftDragState.value.get(nodeId)
        
        // Если это начало перетаскивания, запоминаем начальную позицию
        if (!currentState) {
          // Используем позицию из узла как начальную
          shiftDragState.value.set(nodeId, {
            startX: node.position.x,
            startY: node.position.y,
            lockDirection: null
          })
        } else {
          // Вычисляем смещение от начальной позиции
          const dx = Math.abs(positionChange.position.x - currentState.startX)
          const dy = Math.abs(positionChange.position.y - currentState.startY)
          
          // Определяем направление блокировки на основе большего смещения
          let lockDirection = currentState.lockDirection
          if (!lockDirection) {
            // Определяем направление при первом движении (порог 3px для определения направления)
            const threshold = 3
            if (dx > threshold && dx > dy) {
              lockDirection = 'horizontal'
            } else if (dy > threshold && dy > dx) {
              lockDirection = 'vertical'
            } else {
              // Если смещения недостаточны, определяем по большему смещению без порога
              if (dx > dy) {
                lockDirection = 'horizontal'
              } else if (dy > dx) {
                lockDirection = 'vertical'
              }
            }
            
            if (lockDirection) {
              shiftDragState.value.set(nodeId, { ...currentState, lockDirection })
            }
          }
          
          // Ограничиваем движение только выбранным направлением
          if (lockDirection === 'horizontal') {
            // Движение только по горизонтали - фиксируем Y
            positionChange.position.y = currentState.startY
          } else if (lockDirection === 'vertical') {
            // Движение только по вертикали - фиксируем X
            positionChange.position.x = currentState.startX
          }
        }
      }
    } else {
      // Если Shift не зажат, очищаем состояние
      const positionChanges = changes.filter(c => c.type === 'position')
      positionChanges.forEach(change => {
        if (change.type === 'position' && !change.dragging) {
          shiftDragState.value.delete(change.id)
        }
      })
    }
    
    const helperLines = getHelperLines(positionChange, nodes)
    
    // Если есть вспомогательная линия, прилипаем узел к позиции линии
    positionChange.position.x = helperLines.snapPosition.x ?? positionChange.position.x
    positionChange.position.y = helperLines.snapPosition.y ?? positionChange.position.y
    
    // Если есть вспомогательные линии, устанавливаем их для отображения
    helperLineHorizontal.value = helperLines.horizontal
    helperLineVertical.value = helperLines.vertical
    helperLineHorizontalDistance.value = helperLines.horizontalDistance
    helperLineVerticalDistance.value = helperLines.verticalDistance
  }
  
  // Очищаем состояние для узлов, которые больше не перетаскиваются
  changes.forEach(change => {
    if (change.type === 'position' && !change.dragging) {
      shiftDragState.value.delete(change.id)
    }
  })
  
  // Обработка изменения размера узла (при resize)
  const dimensionChange = changes.find(c => c.type === 'dimensions' && c.dimensions)
  if (dimensionChange && dimensionChange.type === 'dimensions' && dimensionChange.dimensions) {
    const node = nodes.find(n => n.id === dimensionChange.id)
    if (node) {
      // Показываем вспомогательные линии при изменении размера
      // Проверяем, что узел уже был измерен ранее (не первая загрузка)
      const previousWidth = node.data?.width
      const previousHeight = node.data?.height
      const newWidth = dimensionChange.dimensions.width
      const newHeight = dimensionChange.dimensions.height
      
      // Если размеры изменились относительно сохраненных более чем на 1px, это изменение размера
      const isResize = previousWidth && previousHeight && (
        Math.abs(previousWidth - newWidth) > 1 ||
        Math.abs(previousHeight - newHeight) > 1
      )
      
      // Показываем вспомогательные линии всегда при изменении размера (даже при первой установке)
      const helperLines = getHelperLinesForResize(dimensionChange, nodes)
      
      // Устанавливаем вспомогательные линии для отображения
      if (helperLines.horizontal !== undefined) {
        helperLineHorizontal.value = helperLines.horizontal
        helperLineHorizontalDistance.value = helperLines.horizontalDistance
      } else {
        helperLineHorizontal.value = undefined
        helperLineHorizontalDistance.value = undefined
      }
      if (helperLines.vertical !== undefined) {
        helperLineVertical.value = helperLines.vertical
        helperLineVerticalDistance.value = helperLines.verticalDistance
      } else {
        helperLineVertical.value = undefined
        helperLineVerticalDistance.value = undefined
      }
    }
  }
  
  return changes
}

function onEdgesChange(changes: EdgeChange[]) {
  if (isSyncing) return
  
  // Обработка изменений edges - включая удаление последней связи
  let hasChanges = false
  changes.forEach((change) => {
    if (change.type === 'remove') {
      // Удаляем edge из локального массива
      const beforeLength = localEdges.value.length
      localEdges.value = localEdges.value.filter((e: any) => e.id !== change.id)
      if (localEdges.value.length !== beforeLength) {
        hasChanges = true
      }
    }
  })
  
  // ВАЖНО: Всегда обновляем родительский компонент при удалении, даже если это последняя связь
  if (hasChanges) {
    nextTick(() => {
      update()
    })
  }
}

function onNodesChange(changes: NodeChange[]) {
  if (isSyncing) return
  
  // Обновляем вспомогательные линии и применяем изменения (включая resize)
  const updatedChanges = updateHelperLines(changes, localNodes.value as GraphNode[])
  
  // Обрабатываем изменения размеров узлов
  changes.forEach(change => {
    if (change.type === 'dimensions' && change.dimensions) {
      const node = localNodes.value.find(n => n.id === change.id)
      if (node) {
        // Сохраняем измеренные размеры в data для последующего использования
        // Это может быть как автоматическое измерение при первой загрузке, так и изменение размера при resize
        node.data = {
          ...(node.data || {}),
          width: change.dimensions.width,
          height: change.dimensions.height
        }
        node.style = {
          ...(node.style || {}),
          width: `${change.dimensions.width}px`,
          height: `${change.dimensions.height}px`
        }
        // Также обновляем dimensions для Vue Flow
        if (!node.dimensions) {
          node.dimensions = { width: 0, height: 0 }
        }
        node.dimensions.width = change.dimensions.width
        node.dimensions.height = change.dimensions.height
        // Обновляем width/height для Vue Flow
        node.width = change.dimensions.width
        node.height = change.dimensions.height
      }
    }
  })
  
  // Применяем изменения к узлам
  localNodes.value = applyNodeChanges(updatedChanges) as GraphNode[]
  
  // Обновляем родительский компонент
  update()
}

// Удаляем старую функцию onNodeDrag, теперь используем onNodesChange

// Экспортируем метод для принудительного обновления тона нода без эмита в родителя
function setNodeTone(nodeId: string, tone: 'neutral' | 'blue' | 'pink' | 'green') {
  const idx = localNodes.value.findIndex((n:any) => n.id === nodeId)
  if (idx === -1) return
  const n = { ...localNodes.value[idx], data: { ...(localNodes.value[idx].data||{}), tone } }
  localNodes.value.splice(idx, 1, n)
  try { updateNodeInternals?.([nodeId]) } catch {}
}

// Метод для сброса viewport в исходное положение (fitView)
function fitView() {
  console.log('FlowCanvas.fitView: Called', { 
    editable: editable.value,
    hasReadOnlyFlowRef: !!readOnlyFlowRef.value,
    hasFitView: typeof readOnlyFlowRef.value?.fitView
  })
  
  // Если это read-only режим, используем ReadOnlyFlow
  if (!editable.value) {
    nextTick(() => {
      if (readOnlyFlowRef.value && typeof readOnlyFlowRef.value.fitView === 'function') {
        console.log('FlowCanvas.fitView: Calling readOnlyFlowRef.fitView')
        readOnlyFlowRef.value.fitView()
      } else {
        console.warn('FlowCanvas.fitView: readOnlyFlowRef.fitView not available', {
          readOnlyFlowRef: readOnlyFlowRef.value,
          fitViewType: typeof readOnlyFlowRef.value?.fitView
        })
      }
    })
  } else {
    // Для editable режима используем composable
    const { fitView: fitViewMethod } = useVueFlow()
    if (fitViewMethod && typeof fitViewMethod === 'function') {
      console.log('FlowCanvas.fitView: Using composable fitView for editable mode')
      fitViewMethod({ padding: 0.2, duration: 300 })
    }
  }
}

// Всегда экспортируем fitView, независимо от режима
defineExpose({ setNodeTone, fitView })
</script>

<style>
/* Hover эффекты для узлов и связей Vue Flow */
.vue-flow__node:hover {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05); /* shadow-sm */
}
.dark .vue-flow__node:hover {
  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.3); /* shadow-sm для тёмной темы */
}

/* Базовая толщина и цвет стрелок */
.vue-flow__edge-path {
  stroke-width: 2 !important;
  stroke: #94a3b8; /* slate-400 */
}

.dark .vue-flow__edge-path {
  stroke: #94a3b8; /* slate-400 */
}

.vue-flow__edge:hover .vue-flow__edge-path {
  stroke: #0ea5e9; /* sky-500 */
  stroke-width: 2;
}
.dark .vue-flow__edge:hover .vue-flow__edge-path {
  stroke: #3b82f6; /* blue-500 */
}

/* Вспомогательные линии для выравнивания */
.vue-flow__helper-lines-wrapper {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
  overflow: visible;
}

.vue-flow__helper-lines-svg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.vue-flow__helper-line {
  stroke: #0ea5e9;
  stroke-width: 3;
  stroke-dasharray: 5 5;
  opacity: 0.8;
}

.dark .vue-flow__helper-line {
  stroke: #3b82f6;
}

/* Стили для меток на стрелках */
.vue-flow__edge-label {
  font-size: 12px;
  font-weight: 500;
  fill: #334155;
  pointer-events: none;
}

.dark .vue-flow__edge-label {
  fill: #cbd5e1;
}

.vue-flow__edge-labelbg {
  fill: white;
  fill-opacity: 0.9;
}

.dark .vue-flow__edge-labelbg {
  fill: #1e293b;
  fill-opacity: 0.9;
}

/* Фон контейнера Vue Flow - как в официальной документации */
.vue-flow {
  background-color: #ffffff;
}

.dark .vue-flow {
  background-color: #0f172a;
}

/* Фон теперь управляется компонентом Background из @vue-flow/background */

</style>


