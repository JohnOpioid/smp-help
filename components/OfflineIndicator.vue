<template>
  <div v-if="!isOnline" class="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50 offline-indicator">
    <div class="flex items-center justify-center gap-2">
      <Icon name="heroicons:wifi" class="w-4 h-4" />
      <span class="text-sm font-medium">Работа в офлайн режиме</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const isOnline = ref(true)

// Функция проверки реального подключения к интернету
async function checkOnlineStatus() {
  try {
    // Пробуем загрузить небольшой ресурс
    const response = await fetch('/favicon.ico', { 
      method: 'HEAD',
      cache: 'no-cache',
      mode: 'no-cors'
    })
    isOnline.value = true
  } catch (error) {
    // Если не удалось загрузить, проверяем navigator.onLine
    isOnline.value = navigator.onLine
  }
}

// Обработчики событий
let updateOnlineStatus: (() => Promise<void>) | null = null

onMounted(async () => {
  // Сначала проверяем navigator.onLine
  isOnline.value = navigator.onLine
  
  // Затем проверяем реальное подключение
  await checkOnlineStatus()
  
  updateOnlineStatus = async () => {
    await checkOnlineStatus()
  }

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
