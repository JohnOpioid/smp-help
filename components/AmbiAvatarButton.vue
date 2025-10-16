<template>
  <button
    type="button"
    :title="title"
    :aria-label="title"
    class="inline-flex items-center justify-center rounded-full border border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 cursor-pointer transition-colors"
    :class="sizeClass"
    @click="$emit('click')"
  >
    <img src="/assets/img/AI-avatar.png" alt="Амби" class="rounded-full object-cover" :class="imgSizeClass" />
  </button>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  size?: 'sm' | 'md' | 'lg'
  title?: string
}>(), {
  size: 'md',
  title: 'Найти с Амби'
})

defineEmits<{ 'click': [] }>()

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'w-10 h-10'
  if (props.size === 'lg') return 'w-14 h-14'
  return 'w-12 h-12'
})
const imgSizeClass = computed(() => {
  if (props.size === 'sm') return 'w-8 h-8'
  if (props.size === 'lg') return 'w-12 h-12'
  return 'w-10 h-10'
})
</script>


