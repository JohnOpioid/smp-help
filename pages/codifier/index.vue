<template>
  <div>
    <main class="flex-1">
      <!-- Блок поиска отдельно -->
      <div class="max-w-5xl w-full mx-auto px-4 pt-8">
        <SearchBar />
      </div>

      <!-- Основной контент -->
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
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
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Кодификатор' })

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
</script>



