<template>
  <div class="max-w-5xl mx-auto px-4 py-8">
    <h1 class="text-2xl font-bold mb-4">Промо-ивенты</h1>
    <div v-if="!items.length" class="text-sm text-slate-500">Сейчас нет активных ивентов.</div>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
      <NuxtLink v-for="e in items" :key="e._id" :to="`/promo/${e.slug}`" class="bg-white dark:bg-slate-800 rounded-lg p-4 hover:bg-accented/50 transition">
        <div class="flex items-start gap-3">
          <UIcon :name="e.spriteIcon" class="w-6 h-6" />
          <div>
            <div class="text-base font-semibold">{{ e.title }}</div>
            <div class="text-xs text-slate-500">{{ formatRange(e.startAt, e.endAt) }}</div>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch('/api/promo')
const items = computed<any[]>(() => (data.value as any)?.items || [])
function formatRange(a: any, b: any) { try { const da=new Date(a), db=new Date(b); return `${da.toLocaleDateString()} — ${db.toLocaleDateString()}` } catch { return '' } }
</script>


