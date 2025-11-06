<template>
  <div class="rounded-lg overflow-hidden h-full">
    <FlowCanvas
      :graph="props.graph"
      :editable="true"
      :snap-grid="snapGrid"
      @update:graph="onUpdateGraph"
      @select="onSelect"
      @select-edge="onSelectEdge"
      @context-select-node="onContextSelectNode"
      @context-select-edge="onContextSelectEdge"
      ref="flowCanvasRef"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, defineAsyncComponent } from 'vue'
const FlowCanvas = defineAsyncComponent(() => import('~/components/airway/FlowCanvas.vue'))

const props = defineProps<{ graph: any }>()
const emit = defineEmits(['update:graph', 'select', 'select-edge', 'context-select-node', 'context-select-edge'])

const snapGrid = [5, 5] as [number, number]
const flowCanvasRef = ref<any>(null)
function onUpdateGraph(g:any) { 
  // ВАЖНО: Проверяем, что g существует и является объектом
  if (!g || typeof g !== 'object') {
    console.warn('onUpdateGraph: g is not a valid object', g)
    return
  }
  
  // ВАЖНО: Обновляем workingGraph в родительском компоненте
  // Это гарантирует, что все изменения (включая новые связи) сохраняются
  emit('update:graph', g) 
}
function onSelect(id:string) { emit('select', id) }
function onSelectEdge(id:string) { emit('select-edge', id) }
function onContextSelectNode(id:string) { emit('context-select-node', id) }
function onContextSelectEdge(id:string) { emit('context-select-edge', id) }

// Пробрасываем наружу метод для мгновенной смены тона узла
function setNodeTone(id: string, tone: 'neutral' | 'blue' | 'pink' | 'green') {
  (flowCanvasRef as any)?.value?.setNodeTone?.(id, tone)
}
defineExpose({ setNodeTone })
</script>


