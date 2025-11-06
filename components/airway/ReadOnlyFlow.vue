<template>
  <VueFlow
    ref="vueFlowRef"
    :nodes="nodes"
    :edges="edges"
    :node-types="nodeTypes"
    :min-zoom="0.25"
    :max-zoom="2"
    :nodes-draggable="false"
    :nodes-connectable="false"
    :elements-selectable="false"
    :default-viewport="defaultViewport"
    :default-edge-options="defaultEdgeOptions"
    fit-view-on-init
    @move="onMove"
    @pane-ready="onPaneReady"
  >
    <Background 
      variant="dots"
      :gap="20"
      :size="1"
      :pattern-color="isDark ? '#64748b' : '#94a3b8'"
    />
  </VueFlow>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, markRaw, nextTick } from 'vue'
import '@vue-flow/core/dist/style.css'
import type { GraphNode, Edge } from '@vue-flow/core'

// Проверка темной темы
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')

// Async client-safe imports
const VueFlow = markRaw(defineAsyncComponent(async () => (await import('@vue-flow/core')).VueFlow))
const Background = markRaw(defineAsyncComponent(async () => {
  try {
    const module = await import('@vue-flow/background')
    return (module as any).Background || module.default
  } catch (e) {
    return { template: '<div></div>' }
  }
}))
const { MarkerType, useVueFlow } = await import('@vue-flow/core')

import NodeBlock from '~/components/airway/NodeBlock.vue'

const props = defineProps<{
  nodes: GraphNode[]
  edges: Edge[]
  defaultViewport?: { x: number; y: number; zoom: number }
}>()

// Используем useVueFlow для получения методов Vue Flow
// По документации Vue Flow: https://vueflow.dev/guide/utils/instance.html
const vueFlowComposable = useVueFlow()
const { onPaneReady: onPaneReadyHook } = vueFlowComposable

// Ref для VueFlow компонента
const vueFlowRef = ref<any>(null)

// Сохраняем экземпляр Vue Flow из события @pane-ready (используем ref для реактивности)
const vueFlowInstance = ref<any>(null)

// Используем hook onPaneReady из composable (первый способ по документации)
onPaneReadyHook((instance) => {
  vueFlowInstance.value = instance
})

const nodeTypes = { block: markRaw(NodeBlock) } as any

const defaultEdgeOptions = {
  type: 'step',
  markerEnd: MarkerType.ArrowClosed,
  pathOptions: {
    borderRadius: 8
  },
  style: {
    strokeWidth: 2,
    stroke: '#94a3b8'
  }
} as any

const viewport = ref({ x: 0, y: 0, zoom: 1 })

function onMove(t: any) {
  viewport.value = { x: t?.x ?? 0, y: t?.y ?? 0, zoom: t?.zoom ?? 1 }
}

// Обработчик события @pane-ready (второй способ по документации)
// Это альтернативный способ, если hook не сработал
function onPaneReady(instance: any) {
  // Сохраняем экземпляр для использования в fitView
  if (!vueFlowInstance.value) {
    vueFlowInstance.value = instance
  }
}

// Метод для сброса viewport в исходное положение
// По документации: https://vueflow.dev/guide/utils/instance.html
function fitViewHandler() {
  // Проверяем, что есть узлы для отображения
  if (!props.nodes || props.nodes.length === 0) {
    return
  }
  
  // Используем nextTick для гарантии, что компонент полностью смонтирован
  nextTick(() => {
    try {
      // По документации Vue Flow: используем экземпляр из @pane-ready
      // Это самый надежный способ согласно официальной документации
      if (vueFlowInstance.value && typeof vueFlowInstance.value.fitView === 'function') {
        vueFlowInstance.value.fitView({ padding: 0.2, duration: 300 })
        return
      }
      
      // Fallback: используем composable напрямую
      if (vueFlowComposable && typeof vueFlowComposable.fitView === 'function') {
        vueFlowComposable.fitView({ padding: 0.2, duration: 300 })
        return
      }
      
      // Последний fallback: используем setViewport для сброса viewport
      if (vueFlowInstance.value && typeof vueFlowInstance.value.setViewport === 'function') {
        vueFlowInstance.value.setViewport({ x: 0, y: 0, zoom: 1 })
      } else if (vueFlowComposable && typeof vueFlowComposable.setViewport === 'function') {
        vueFlowComposable.setViewport({ x: 0, y: 0, zoom: 1 })
      }
    } catch (error) {
      // Игнорируем ошибки
    }
  })
}

defineExpose({
  fitView: fitViewHandler
})
</script>

<style scoped>
</style>

