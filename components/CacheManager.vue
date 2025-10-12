<template>
  <div class="fixed bottom-4 left-4 z-50 space-y-2">
    <!-- Кнопка сохранения приложения -->
    <UButton
      v-if="!isCaching && !isCached && !updateAvailable"
      @click="precacheSite"
      color="blue"
      size="xl"
      class="shadow-lg border-2 border-blue-300 dark:border-blue-600"
      :loading="isCaching"
    >
      <Icon name="heroicons:device-phone-mobile" class="w-5 h-5 mr-2" />
      Сохранить приложение
    </UButton>

    <!-- Индикатор сохранения -->
    <div v-if="isCaching" class="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
        <span>Сохранение приложения...</span>
      </div>
    </div>

    <!-- Индикатор успешного сохранения -->
    <div v-if="isCached && !isCaching && !updateAvailable" class="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:check-circle" class="w-4 h-4" />
        <span>Приложение сохранено</span>
      </div>
    </div>

    <!-- Кнопка обновления -->
    <UButton
      v-if="updateAvailable"
      @click="updateApp"
      color="orange"
      size="xl"
      class="shadow-lg animate-pulse border-2 border-orange-300 dark:border-orange-600"
    >
      <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
      Обновить приложение
    </UButton>
  </div>
</template>

<script setup lang="ts">
const isCaching = ref(false)
const isCached = ref(false)
const updateAvailable = ref(false)

// Отладочная информация
watch([isCaching, isCached, updateAvailable], ([caching, cached, update]) => {
  console.log('🔄 Состояния:', { isCaching: caching, isCached: cached, updateAvailable: update })
  console.log('🔘 Показать кнопку сохранения:', !caching && !cached && !update)
})

// Список страниц для кеширования
const pagesToCache = [
  '/',
  '/algorithms',
  '/algorithms/adults',
  '/algorithms/pediatrics',
  '/calculators',
  '/calculators/gcs',
  '/calculators/apgar',
  '/calculators/four',
  '/calculators/rass',
  '/calculators/pain-vas',
  '/calculators/pediatric-norms',
  '/calculators/pregnancy-due-date',
  '/calculators/geneva-pe',
  '/calculators/lams',
  '/calculators/news',
  '/calculators/shoks',
  '/calculators/gcs-pediatric',
  '/calculators/gcs-pediatric/1-4-years',
  '/drugs',
  '/local-statuses',
  '/instructions',
  '/codifier',
  '/contacts',
  '/about',
  '/help',
  '/privacy',
  '/auth/login',
  '/auth/register',
  '/profile',
  '/profile/bookmarks',
  '/profile/settings',
  '/favorites'
]

// Функция предварительного кеширования
async function precacheSite() {
  if (isCaching.value) return
  
  isCaching.value = true
  
  try {
    for (const page of pagesToCache) {
      try {
        // Кешируем страницу
        await fetch(page, { 
          method: 'GET',
          cache: 'force-cache'
        })
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Не удалось кешировать страницу ${page}:`, error)
      }
    }
    
    isCached.value = true
    
    // Сохраняем статус кеширования в localStorage
    localStorage.setItem('site-cached', 'true')
    
    console.log('✅ Приложение сохранено, isCached:', isCached.value)
    
  } catch (error) {
    console.error('Ошибка кеширования:', error)
  } finally {
    isCaching.value = false
  }
}

// Функция обновления приложения
async function updateApp() {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration && registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' })
    }
  }
  
  // Сбрасываем флаг обновления
  updateAvailable.value = false
  
  // Перезагружаем страницу
  window.location.reload()
}

// Проверка статуса кеширования при загрузке
onMounted(() => {
  // Проверяем, был ли сайт уже кеширован
  const cached = localStorage.getItem('site-cached')
  
  if (cached === 'true') {
    isCached.value = true
    console.log('📱 Статус сохранения загружен из localStorage, isCached:', isCached.value)
  }
  
  // Слушаем события обновления PWA
  window.addEventListener('pwa-update-available', () => {
    updateAvailable.value = true
  })
})
</script>
