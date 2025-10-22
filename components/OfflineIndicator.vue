<template>
  <div v-if="isMounted && !isOnline" class="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50 offline-indicator">
    <div class="flex items-center justify-center gap-2">
      <Icon name="heroicons:wifi" class="w-4 h-4" />
      <span class="text-sm font-medium">Работа в офлайн режиме</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const isOnline = ref(true)
const isMounted = ref(false)

// Функция проверки реального подключения
const checkRealConnection = async (): Promise<boolean> => {
  try {
    // Простая проверка через fetch с коротким таймаутом
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)
    
    await fetch('/', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: controller.signal
    })
    
    clearTimeout(timeoutId)
    return true
  } catch (error) {
    return false
  }
}

// Обработчики объявляем на верхнем уровне setup
const handleOnline = async () => {
  const realConnection = await checkRealConnection()
  isOnline.value = realConnection
}

const handleOffline = () => {
  isOnline.value = false
}

onMounted(async () => {
  isMounted.value = true
  // Проверяем реальное подключение
  const realConnection = await checkRealConnection()
  isOnline.value = realConnection
  // Подписываемся на события
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>
