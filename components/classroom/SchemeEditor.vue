<template>
  <div class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden min-h-[420px] flex flex-col" style="border-width:1px;">
    <ClientOnly>
      <FlowEditor v-model:graph="mutable" />
    </ClientOnly>
    <div class="flex items-center justify-end gap-2 p-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Универсальный редактор схем (обёртка над components/airway/FlowEditor.vue)
// v-model:graph
const props = defineProps<{ graph: any }>()
const emit = defineEmits<{ 'update:graph': [any] }>()

const mutable = computed({
  get: () => props.graph,
  set: (v) => emit('update:graph', v)
})

// @ts-ignore
const FlowEditor = defineAsyncComponent(() => import('~/components/airway/FlowEditor.vue'))
</script>


