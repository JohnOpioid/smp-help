<template>
  <div />
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const route = useRoute()
const section = route.params.section as string
const category = route.params.category as string
const id = route.params.id as string

// Перенаправляем на существующий маршрут без сегмента "view" (replace, чтобы back вернул в список)
await navigateTo({
  path: `/algorithms/${section}/${category}/${id}`,
  query: route.query as Record<string, any>
}, { replace: true })
</script>


