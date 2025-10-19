<template>
  <div class="md:px-4 max-w-5xl mx-auto py-8">
    <!-- Список алгоритмов категории (как список категорий) -->
    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <NuxtLink :to="`/algorithms/${section}`" title="Назад к разделу"
            class="inline-flex items-center px-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
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
const categoryId = computed(() => route.params.id as string)
const { data: listData, pending: pendingAlgos } = await useFetch('/api/algorithms', {
  query: computed(() => ({ 
    page: 1, 
    limit: 100, 
    category: categoryId.value, 
    section: section.value === 'adults'
      ? 'Взрослые'
      : section.value === 'pediatrics'
        ? 'Детские'
        : section.value === 'onmp'
          ? 'ОНМП'
          : 'Детские',
    sortBy: 'createdAt', 
    sortOrder: 'asc' 
  })),
  server: false
})
const algos = computed(() => listData.value?.items || [])
function openAlgo(id: string) { navigateTo(`/algorithms/${section.value}/${categoryId.value}/${id}`) }

// Название категории
const { data: catsData } = await useFetch('/api/algorithms/categories', { server: false })
const cats = computed(() => catsData.value?.items || [])
const categoryName = computed(() => {
  // сперва пробуем из первого алгоритма
  const first = (algos.value as any[])[0]
  if (first?.category?.name) return first.category.name as string
  // иначе из списка категорий по id
  const found = (cats.value as any[]).find((c: any) => String(c?._id) === String(categoryId.value))
  return found?.name || 'Категория'
})

// Группировка МКБ-кодов в диапазоны по базовым категориям (A00–A02)
function groupMkbCodes(src: string[]): string[] {
  if (!Array.isArray(src) || src.length === 0) return []
  const items = src.map(s => String(s).trim().toUpperCase()).filter(Boolean)
  const explicitRanges: string[] = []
  const baseSet = new Set<string>()
  for (const s of items) {
    if (/[\-–]/.test(s)) { explicitRanges.push(s); continue }
    const m = s.match(/^([A-Z])(\d{2})/)
    if (m) baseSet.add(m[1] + m[2])
  }
  const byLetter: Record<string, number[]> = {}
  for (const base of Array.from(baseSet)) {
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
  return [...categoryRanges, ...explicitRanges]
}
</script>


