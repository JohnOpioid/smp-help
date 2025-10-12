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

// Функция проверки подключения к интернету
async function checkOnlineStatus() {
  // Простая проверка через navigator.onLine
  isOnline.value = navigator.onLine
  
  // Дополнительная проверка только если navigator.onLine говорит что онлайн
  if (navigator.onLine) {
    try {
      // Быстрая проверка через fetch с коротким таймаутом
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 2000)
      
      await fetch('/favicon.ico', { 
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      isOnline.value = true
    } catch (error) {
      // Если fetch не удался, но navigator.onLine = true, 
      // возможно это временная проблема сети, не показываем офлайн
      console.log('Проверка сети не удалась, но navigator.onLine = true')
    }
  }
}

// Обработчики событий
let updateOnlineStatus: (() => Promise<void>) | null = null

onMounted(async () => {
  isMounted.value = true
  
  // Устанавливаем начальное состояние
  isOnline.value = navigator.onLine
  
  // Простая функция обновления статуса
  updateOnlineStatus = () => {
    isOnline.value = navigator.onLine
  }

  // Слушаем события изменения статуса сети
  window.addEventListener('online', updateOnlineStatus)
  window.addEventListener('offline', updateOnlineStatus)
})

onUnmounted(() => {
  if (updateOnlineStatus) {
    window.removeEventListener('online', updateOnlineStatus)
    window.removeEventListener('offline', updateOnlineStatus)
  }
})
</script>
