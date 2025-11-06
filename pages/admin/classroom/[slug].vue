<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <div class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data } = await useFetch('/api/classroom/pages', { server: true })
const items = computed<any[]>(() => data.value?.items || [])

watchEffect(async () => {
  if (!slug.value) return
  const found = items.value.find((x: any) => x.slug === slug.value)
  if (found) {
    if (found.type === 'table') return navigateTo(`/admin/classroom/cpr/${found.slug}`)
    if (found.type === 'scheme') return navigateTo(`/admin/classroom/airway/${found.slug}`)
    return navigateTo(`/admin/classroom/instructions/${found.slug}`)
  }
})
</script>


