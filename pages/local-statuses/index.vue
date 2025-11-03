<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div class="bg-white dark:bg-slate-800 rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Список категорий локальных статусов</p>
          </div>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <li v-for="(category, index) in categories" :key="category._id"
              class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
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
                <svg class="w-4 h-4 text-slate-400 self-start flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
</script>



