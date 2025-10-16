<template>
  <div>
    <main class="flex-1">
      <!-- Поиск (реактивный по всем локальным статусам) -->
      <div class="max-w-5xl w-full mx-auto px-4 pt-8">
        <ReactiveSearch v-model="searchText" placeholder="Поиск локальных статусов..." @clear="clearSearch" :ai-enabled="true" />
      </div>

      <!-- Основной контент или результаты поиска -->
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <div v-if="showSearchResults" class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p class="text-sm text-slate-600 dark:text-slate-300">Найдено: {{ filteredResults.length }}</p>
            <div class="text-xs text-slate-500 dark:text-slate-400">Категории</div>
          </div>
          <ul class="divide-y divide-slate-100 dark:divide-slate-700">
            <li v-for="it in filteredResults" :key="it._id"
                class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                @click="openStatus(it)">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-slate-900 dark:text-white font-medium">{{ it.name }}</p>
                  <div class="flex items-center gap-2 mt-1">
                    <span class="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">{{ it.code }}</span>
                    <span v-if="it.stationCode" class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono text-blue-700 dark:text-blue-300">{{ it.stationCode }}</span>
                  </div>
                  <p v-if="it.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ it.note }}</p>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </li>
            <li v-if="filteredResults.length === 0" class="p-8 text-center text-sm text-slate-600 dark:text-slate-300">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span>Ничего не найдено</span>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Список категорий локальных статусов</p>
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
              <div class="flex items-start justify-between">
                <div class="min-w-0">
                  <p class="text-slate-900 dark:text-white font-medium truncate">{{ category.name }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">{{ category.count || 0 }} {{ getItemText(category.count || 0) }}</span>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>

            <li v-if="!pending && categories.length === 0" class="p-6">
              <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных. Добавьте их в админке.</p>
            </li>
            <li v-if="pending" class="p-6">
              <p class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</p>
            </li>
          </ul>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Локальные статусы' })

const { data, pending } = await useFetch<{ success: boolean; items: any[] }>("/api/local-statuses")
const categories = computed(() => data.value?.items || [])

function getItemText(count: number): string {
  if (count === 0) return 'статусов'
  if (count === 1) return 'статус'
  if (count >= 2 && count <= 4) return 'статуса'
  return 'статусов'
}

function navigateToCategory(url: string) {
  navigateTo(`/local-statuses/${url}`)
}

// Реактивный поиск по всем локальным статусам
const searchText = ref('')
const showSearchResults = computed(() => Boolean(searchText.value.trim()))
const allStatuses = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const limit = 200

async function loadAll(search = '') {
  try {
    const res: any = await $fetch('/api/local-statuses/all', { query: { page: page.value, limit, search } })
    allStatuses.value = res?.items || []
    total.value = Number(res?.total || 0)
  } catch { allStatuses.value = []; total.value = 0 }
}

onMounted(async () => { await loadAll('') })

watch(searchText, async (q) => { await loadAll(String(q || '').trim()) })

const localFiltered = computed(() => allStatuses.value)

const filteredResults = computed(() => localFiltered.value)

function clearSearch() { searchText.value = '' }
function openStatus(it: any) {
  const url = String(it.category?.url || '')
  if (url) navigateTo(`/local-statuses/${url}?id=${it._id}`)
}
</script>



