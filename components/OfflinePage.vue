<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
    <div class="max-w-md w-full text-center">
      <div class="mb-8">
        <Icon name="heroicons:wifi" class="w-24 h-24 text-slate-400 mx-auto mb-4" />
        <h1 class="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Нет подключения к интернету
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          Приложение работает в офлайн режиме. Некоторые функции могут быть недоступны.
        </p>
      </div>
      
      <div class="space-y-4">
        <UButton 
          @click="retryConnection" 
          color="primary" 
          size="lg" 
          block
          :loading="isRetrying"
        >
          <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
          Попробовать снова
        </UButton>
        
        <UButton 
          @click="goHome" 
          variant="outline" 
          size="lg" 
          block
        >
          <Icon name="heroicons:home" class="w-5 h-5 mr-2" />
          На главную
        </UButton>
      </div>
      
      <div class="mt-8 p-4 bg-slate-100 dark:bg-slate-800 rounded-lg">
        <h3 class="font-semibold text-slate-900 dark:text-slate-100 mb-2">
          Доступно в офлайн режиме:
        </h3>
        <ul class="text-sm text-slate-600 dark:text-slate-400 space-y-1">
          <li>• Просмотр алгоритмов</li>
          <li>• Медицинские калькуляторы</li>
          <li>• Справочник препаратов</li>
          <li>• Кодификаторы МКБ</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const isRetrying = ref(false)

const retryConnection = async () => {
  isRetrying.value = true
  
  try {
    // Проверяем подключение
    const response = await fetch('/', { 
      method: 'HEAD',
      cache: 'no-cache'
    })
    
    if (response.ok) {
      // Подключение восстановлено
      window.location.reload()
    } else {
      throw new Error('Нет подключения')
    }
  } catch (error) {
    // Подключение все еще отсутствует
    setTimeout(() => {
      isRetrying.value = false
    }, 2000)
  }
}

const goHome = () => {
  navigateTo('/')
}
</script>
