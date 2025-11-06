<template>
  <div class="h-full">
    <ReadOnlyFlow 
      ref="readOnlyFlowRef"
      :nodes="graphNodes"
      :edges="graphEdges"
      :default-viewport="graphViewport"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, defineAsyncComponent, nextTick } from 'vue'
const props = defineProps<{ graph: any }>()

const ReadOnlyFlow = defineAsyncComponent(() => import('~/components/airway/ReadOnlyFlow.vue'))
const readOnlyFlowRef = ref<any>(null)

// Вычисляем nodes, edges и viewport из graph
const graphNodes = computed(() => props.graph?.nodes || [])
const graphEdges = computed(() => props.graph?.edges || [])
const graphViewport = computed(() => props.graph?.viewport || { x: 0, y: 0, zoom: 1 })

// Метод для сброса viewport в исходное положение
function resetViewport() {
  // Используем несколько nextTick для гарантии, что async компонент полностью загружен
  nextTick(() => {
    nextTick(() => {
      const component = readOnlyFlowRef.value
      
      if (!component) {
        return
      }
      
      // Для async компонентов в Vue 3 нужно использовать специальный доступ
      // Попробуем несколько способов
      
      // Способ 1: через exposed (правильный способ для async компонентов)
      const exposed = component.$?.exposed
      if (exposed && typeof exposed.fitView === 'function') {
        exposed.fitView()
        return
      }
      
      // Способ 2: через setupState (альтернативный способ)
      const setupState = component.$?.setupState
      if (setupState && typeof setupState.fitView === 'function') {
        setupState.fitView()
        return
      }
      
      // Способ 3: напрямую (может работать для синхронных компонентов)
      if (typeof component.fitView === 'function') {
        component.fitView()
        return
      }
      
      // Способ 4: через refs (для доступа к внутренним refs)
      if (component.$?.refs?.vueFlowRef) {
        const vueFlow = component.$.refs.vueFlowRef
        if (vueFlow && typeof vueFlow.fitView === 'function') {
          vueFlow.fitView({ padding: 0.2, duration: 300 })
          return
        }
      }
    })
  })
}

// Экспортируем метод для использования в родительском компоненте
defineExpose({
  resetViewport
})
</script>

<style scoped>
</style>


