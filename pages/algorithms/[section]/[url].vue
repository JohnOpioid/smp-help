<template>
  <div class="px-2 md:px-4 max-w-5xl mx-auto py-8">

    <!-- Список алгоритмов категории (как список категорий) -->
    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <NuxtLink :to="`/algorithms/${section}`" title="Назад к разделу"
            class="inline-flex items-center justify-center w-7 h-7 rounded-md border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer">
            <UIcon name="i-heroicons-arrow-left-20-solid" class="w-4 h-4" />
          </NuxtLink>
          <p class="text-sm text-slate-600 dark:text-slate-300">{{ categoryName }}</p>
        </div>
      </div>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
        <li v-for="(a, idx) in algos" :key="(a as any)._id"
            class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
            :class="{ 
              'md:border-r md:border-slate-100 dark:md:border-slate-700': (idx % 2 === 0 && idx < algos.length - 1) || (idx === algos.length - 1 && algos.length % 2 === 1),
              'md:border-b-0': idx >= algos.length - 2 && algos.length % 2 === 0,
              'border-b-0': idx === algos.length - 1
            }"
            @click="openAlgo((a as any)._id)">
          <div class="flex items-start justify-between gap-2">
            <p class="text-slate-900 dark:text-white font-medium flex-1">{{ (a as any).title }}</p>
            <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
            <span v-for="chip in groupMkbCodes((a as any).mkbCodes || [])" :key="chip" class="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-2">{{ chip }}</span>
          </p>
        </li>
        <li v-if="pendingAlgos" class="p-6 border-b-0"><p class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</p></li>
        <li v-else-if="!pendingAlgos && algos.length === 0" class="p-6 border-b-0"><p class="text-sm text-slate-600 dark:text-slate-300">Пока нет алгоритмов</p></li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const section = computed(() => route.params.section as string)
const categoryUrl = computed(() => route.params.url as string)

// Получаем категорию по URL
const { data: categoryData } = await useFetch<any>(`/api/algorithms/categories/by-url/${categoryUrl.value}`)
const category = computed(() => (categoryData.value as any)?.item)

// Получаем алгоритмы по ID категории в нужном порядке
const { data: listData, pending: pendingAlgos } = await useFetch('/api/algorithms', {
  query: computed(() => {
    if (!category.value?._id) return { page: 1, limit: 100 }
    return { 
      page: 1, 
      limit: 100, 
      category: category.value._id,
      section: section.value === 'adults'
        ? 'adults'
        : section.value === 'pediatrics'
          ? 'pediatrics'
          : section.value === 'onmp-children'
            ? 'onmp-children'
            : 'onmp',
      sortBy: 'order',
      sortOrder: 'asc'
    }
  }),
  server: false
})
const algos = computed(() => listData.value?.items || [])

function openAlgo(id: string) {
  navigateTo(`/algorithms/${section.value}/${categoryUrl.value}/${id}`)
}

// Название категории
const categoryName = computed(() => {
  return category.value?.name || 'Категория'
})

// Группировка МКБ-кодов в диапазоны по базовым категориям (A00–A02)
function groupMkbCodes(src: string[]): string[] {
  if (!Array.isArray(src) || src.length === 0) return []
  const items = src.map(s => String(s).trim().toUpperCase()).filter(Boolean)
  const explicitRanges: string[] = []
  const baseOnly: string[] = []
  const subcodes: string[] = []
  for (const s of items) {
    if (/[\-–]/.test(s)) { explicitRanges.push(s); continue }
    if (/^[A-Z]\d{2}$/.test(s)) baseOnly.push(s)
    else subcodes.push(s)
  }
  const byLetter: Record<string, number[]> = {}
  for (const base of baseOnly) {
    const letter = base[0]
    const num = parseInt(base.slice(1), 10)
    ;(byLetter[letter] ||= []).push(num)
  }
  const categoryRanges: string[] = []
  for (const letter of Object.keys(byLetter).sort()) {
    const nums = Array.from(new Set(byLetter[letter])).sort((a, b) => a - b)
    let start = nums[0]
    let prev = nums[0]
    for (let i = 1; i <= nums.length; i++) {
      const cur = nums[i]
      const isContiguous = cur === prev + 1
      if (!isContiguous) {
        if (start === prev) categoryRanges.push(`${letter}${String(start).padStart(2, '0')}`)
        else categoryRanges.push(`${letter}${String(start).padStart(2, '0')}-${letter}${String(prev).padStart(2, '0')}`)
        start = cur
      }
      prev = cur
    }
  }
  return [...categoryRanges, ...explicitRanges, ...subcodes]
}
</script>
