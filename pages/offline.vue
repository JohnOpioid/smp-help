<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center px-4">
    <div class="max-w-md w-full text-center space-y-6">
      <!-- Иконка офлайн -->
      <div class="mx-auto w-24 h-24 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
        <Icon name="heroicons:wifi" class="w-12 h-12 text-orange-500" />
      </div>
      
      <!-- Заголовок -->
      <div class="space-y-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100">
          Нет подключения к интернету
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          Проверьте подключение к интернету и попробуйте снова
        </p>
      </div>
      
      <!-- Кнопка повтора -->
      <button
        @click="retryConnection"
        class="w-full bg-blue-500 hover:bg-blue-600 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
      >
        <Icon name="heroicons:arrow-path" class="w-5 h-5" />
        Попробовать снова
      </button>
      
      <!-- Информация о кешированном контенте -->
      <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div class="flex items-center gap-2 mb-2">
          <Icon name="heroicons:information-circle" class="w-5 h-5 text-blue-500" />
          <span class="font-medium text-blue-900 dark:text-blue-100">Офлайн режим</span>
        </div>
        <p class="text-sm text-blue-700 dark:text-blue-300">
          Некоторые функции могут быть недоступны без подключения к интернету
        </p>
      </div>
      
      <!-- Навигация по кешированным страницам -->
      <div class="space-y-3">
        <h3 class="font-medium text-slate-900 dark:text-slate-100">
          Доступные разделы:
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <NuxtLink
            to="/"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm"
          >
            <Icon name="heroicons:home" class="w-4 h-4 mx-auto mb-1" />
            Главная
          </NuxtLink>
          <NuxtLink
            to="/algorithms"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm"
          >
            <Icon name="heroicons:document-text" class="w-4 h-4 mx-auto mb-1" />
            Алгоритмы
          </NuxtLink>
          <NuxtLink
            to="/calculators"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm"
          >
            <Icon name="heroicons:calculator" class="w-4 h-4 mx-auto mb-1" />
            Калькуляторы
          </NuxtLink>
          <NuxtLink
            to="/drugs"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm"
          >
            <Icon name="heroicons:beaker" class="w-4 h-4 mx-auto mb-1" />
            Препараты
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-данные страницы
useHead({
  title: 'Офлайн режим',
  meta: [
    { name: 'description', content: 'Страница офлайн режима - нет подключения к интернету' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

// Функция повтора подключения
function retryConnection() {
  if (navigator.onLine) {
    // Если интернет появился, очищаем офлайн токен и переходим на главную
    localStorage.removeItem('offline-auth-token')
    navigateTo('/')
  } else {
    // Если интернета нет, перезагружаем страницу
    window.location.reload()
  }
}

// Слушаем события изменения статуса сети
onMounted(() => {
  const handleOnline = () => {
    // Очищаем офлайн токен при восстановлении соединения
    localStorage.removeItem('offline-auth-token')
    navigateTo('/')
  }
  
  window.addEventListener('online', handleOnline)
  
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
  })
})
</script>