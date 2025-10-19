<template>
  <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Тест футера</h1>
    
    <div class="bg-white dark:bg-slate-800 rounded-lg p-6">
      <p class="text-slate-600 dark:text-slate-300 mb-4">
        Эта страница создана для тестирования отображения футера.
      </p>
      
      <div class="space-y-4">
        <div class="h-32 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <p class="text-slate-500 dark:text-slate-400">Блок контента 1</p>
        </div>
        <div class="h-32 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <p class="text-slate-500 dark:text-slate-400">Блок контента 2</p>
        </div>
        <div class="h-32 bg-slate-100 dark:bg-slate-700 rounded-lg flex items-center justify-center">
          <p class="text-slate-500 dark:text-slate-400">Блок контента 3</p>
        </div>
      </div>
      
      <div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <p class="text-blue-700 dark:text-blue-300 text-sm">
          <strong>Инструкция:</strong> Прокрутите страницу вниз, чтобы увидеть футер внизу страницы.
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-информация для страницы
useHead({
  title: 'Тест футера - Справочник СМП',
  meta: [
    { name: 'description', content: 'Тестовая страница для проверки отображения футера' }
  ]
})

// Заголовок для хедера
definePageMeta({
  headerTitle: 'Тест футера',
  middleware: 'auth'
})
</script>
