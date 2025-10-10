<template>
  <div class="container mx-auto px-4 py-8">
    <div class="max-w-4xl mx-auto">
      <!-- Заголовок -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-2">Избранное</h1>
        <p class="text-slate-600 dark:text-slate-300">Ваши сохраненные элементы</p>
      </div>

      <!-- Пустое состояние -->
      <div v-if="favorites.length === 0" class="text-center py-12">
        <div class="w-16 h-16 mx-auto mb-4 text-slate-400">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
          </svg>
        </div>
        <h3 class="text-lg font-medium text-slate-900 dark:text-white mb-2">Пока нет избранных элементов</h3>
        <p class="text-slate-600 dark:text-slate-300">Добавьте элементы в избранное, чтобы они появились здесь</p>
      </div>

      <!-- Список избранного -->
      <div v-else class="space-y-4">
        <div v-for="item in favorites" :key="item.id" 
          class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-4 hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-medium text-slate-900 dark:text-white mb-1">{{ item.title }}</h3>
              <p class="text-sm text-slate-600 dark:text-slate-300">{{ item.description }}</p>
              <div class="flex items-center gap-2 mt-2">
                <span class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">
                  {{ item.type }}
                </span>
                <span v-if="item.category" class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">
                  {{ item.category }}
                </span>
              </div>
            </div>
            <button @click="removeFromFavorites(item.id)" 
              class="ml-4 p-2 text-slate-400 hover:text-red-500 transition-colors">
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-данные страницы
definePageMeta({
  layout: 'default',
  headerTitle: 'Избранное',
  middleware: 'auth'
})

// Заголовок страницы
useHead({
  title: 'Избранное - Справочник СМП'
})

// Состояние избранного (пока заглушка)
const favorites = ref([
  // Здесь будут реальные данные избранного
])

// Функция удаления из избранного
const removeFromFavorites = (id: string) => {
  const index = favorites.value.findIndex(item => item.id === id)
  if (index > -1) {
    favorites.value.splice(index, 1)
  }
}
</script>
