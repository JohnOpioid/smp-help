<template>
  <div>
    <main class="flex-1">
      <!-- Поиск (реактивный, глобально по кодификатору) -->
      <div class="max-w-5xl w-full mx-auto px-4 pt-8">
        <ReactiveSearch v-model="searchText" placeholder="Поиск по кодификатору..." @clear="clearSearch" :ai-enabled="true" />
      </div>

      <!-- Основной контент или результаты поиска -->
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <template v-if="showSearchResults">
          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg">
            <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <p class="text-sm text-slate-600 dark:text-slate-300">Найдено: {{ filteredResults.length }}</p>
              <div class="text-xs text-slate-500 dark:text-slate-400">Категории</div>
            </div>
            <ul class="divide-y divide-slate-100 dark:divide-slate-700">
              <li v-for="it in filteredResults" :key="it._id"
                  class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                  @click="openDiagnosis(it)">
                <div class="flex items-center justify-between">
                  <div class="min-w-0">
                    <p class="text-slate-900 dark:text-white font-medium truncate">{{ it.name }}</p>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ it.mkbCode }}</span>
                      <span v-if="it.stationCode" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ it.stationCode }}</span>
                    </div>
                    <p v-if="it.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ it.note }}</p>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                </div>
              </li>
              <li v-if="!searching && filteredResults.length === 0" class="p-8 text-center text-sm text-slate-600 dark:text-slate-300">
                <div class="flex flex-col items-center gap-2">
                  <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                  <span>Ничего не найдено</span>
                </div>
              </li>
            </ul>
          </div>
        </template>
        <template v-else>
        <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Список категорий МКБ-10</p>
          </div>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <li v-for="(category, index) in categories" :key="category._id"
              class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
              :class="{ 
                'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < categories.length - 1) || (index === categories.length - 1 && categories.length % 2 === 1),
                'md:border-b-0': index >= categories.length - 2 && categories.length % 2 === 0,
                'border-b-0': index === categories.length - 1
              }"
              @click="navigateToCategory(category.url)">
              <div class="flex items-start justify-between gap-2">
                <p class="text-slate-900 dark:text-white font-medium flex-1">{{ category.name }}</p>
                <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
                <span v-if="category.codeRange" class="font-mono text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded mr-2">{{ category.codeRange }}</span>
                {{ category.mkbCount || 0 }} {{ getDiseaseText(category.mkbCount || 0) }}
              </p>
            </li>

            <li v-if="!pending && categories.length === 0" class="p-6 border-b-0">
              <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных. Добавьте их в админке.</p>
            </li>
            <li v-if="pending" class="p-6 border-b-0">
              <p class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</p>
            </li>
          </ul>
        </div>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Кодификатор' })

// Импортируем глобальную предзагрузку
const { preloadPage } = usePreloader()

const { data, pending, error } = await useFetch<{ success: boolean; items: any[] }>('/api/categories')
const categories = computed(() => data.value?.items || [])

function getDiseaseText(count: number): string {
  if (count === 0) return 'заболеваний'
  if (count === 1) return 'заболевание'
  if (count >= 2 && count <= 4) return 'заболевания'
  return 'заболеваний'
}

function navigateToCategory(url: string) {
  navigateTo(`/codifier/${url}`)
}

// Реактивный поиск по всем диагнозам кодификатора
const searchText = ref('')
const searching = ref(false)
const allDiagnoses = ref<any[]>([])
const showSearchResults = computed(() => Boolean(searchText.value.trim()))
let t: any = null

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/mkb/all')
    allDiagnoses.value = res?.items || []
  } catch {}
})

function onSearchInput() {
  if (t) clearTimeout(t)
  t = setTimeout(() => { searching.value = false }, 200)
  searching.value = true
}

const filteredResults = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return []
  return (allDiagnoses.value as any[]).filter((it) => {
    const text = [it.name, it.mkbCode, it.stationCode, it.note].filter(Boolean).join(' ').toLowerCase()
    return text.includes(q)
  }).slice(0, 200)
})

function openDiagnosis(it: any) {
  // Открываем модалку диагноза в его категории через query
  const url = String(it.category?.url || '')
  if (url) {
    searchText.value = ''
    // Используем глобальную предзагрузку
    preloadPage.codifier(url, it._id)
  }
}

function clearSearch() {
  searchText.value = ''
  searching.value = false
}
</script>



