<template>
  <div class="text-center space-y-6">
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
    
    <!-- Навигация по кешированным страницам -->
    <ClientOnly>
      <div class="space-y-3">
        <h3 class="text-slate-900 dark:text-slate-100">
          Некоторые функции могут быть недоступны без подключения к интернету
        </h3>
        <div class="grid grid-cols-2 gap-2">
          <button
            @click="navigateToPage('/codifier')"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm flex flex-col items-center"
          >
            <Icon name="i-lucide-box" class="w-4 h-4 mb-1" />
            Кодификатор
          </button>
          <button
            @click="navigateToPage('/algorithms')"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm flex flex-col items-center"
          >
            <Icon name="i-lucide-list-tree" class="w-4 h-4 mb-1" />
            Алгоритмы
          </button>
          <button
            @click="navigateToPage('/calculators')"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm flex flex-col items-center"
          >
            <Icon name="i-lucide-calculator" class="w-4 h-4 mb-1" />
            Калькуляторы
          </button>
          <button
            @click="navigateToPage('/drugs')"
            class="p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors duration-200 text-sm flex flex-col items-center"
          >
            <Icon name="i-lucide-pill" class="w-4 h-4 mb-1" />
            Препараты
          </button>
        </div>
      </div>
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
// Используем специальный лайаут без шапки и футера
definePageMeta({
  layout: 'offline'
})

// Мета-данные страницы
useHead({
  title: 'Офлайн режим',
  meta: [
    { name: 'description', content: 'Страница офлайн режима - нет подключения к интернету' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})

const { isOnline, checkConnection } = useNetworkStatus()

// Функция повтора подключения
async function retryConnection() {
  // Проверяем соединение
  const connected = await checkConnection()
  
  if (connected) {
    // Если интернет появился, очищаем офлайн токен и переходим на главную
    localStorage.removeItem('offline-auth-token')
    navigateTo('/')
  } else {
    // Если интернета нет, перезагружаем страницу
    window.location.reload()
  }
}

// Функция навигации по кешированным страницам
function navigateToPage(path: string) {
  try {
    // Используем window.location для навигации в офлайн режиме
    window.location.href = path
  } catch (error) {
    console.error('Ошибка навигации:', error)
    // Fallback - перезагружаем страницу
    window.location.reload()
  }
}

// Слушаем события изменения статуса сети
onMounted(() => {
  const handleOnline = async () => {
    // Проверяем соединение при событии online
    const connected = await checkConnection()
    
    if (connected) {
      // Очищаем офлайн токен при восстановлении соединения
      localStorage.removeItem('offline-auth-token')
      navigateTo('/')
    }
  }
  
  window.addEventListener('online', handleOnline)
  
  onUnmounted(() => {
    window.removeEventListener('online', handleOnline)
  })
})
</script>