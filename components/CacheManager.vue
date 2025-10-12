<template>
  <div class="fixed bottom-4 left-4 z-50 space-y-2">
    <!-- Кнопка сохранения приложения -->
    <button
      v-if="!isCaching && !isCached && !updateAvailable"
      @click="precacheSite"
      :disabled="isCaching"
      class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer"
      role="button"
    >
      <Icon name="heroicons:device-phone-mobile" class="w-5 h-5 mr-2" />
      <span v-if="isCaching">Сохранение...</span>
      <span v-else>Сохранить приложение</span>
    </button>

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
    <button
      v-if="updateAvailable"
      @click="updateApp"
      class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-orange-200 dark:border-orange-500 text-base font-medium rounded-md text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 animate-pulse cursor-pointer"
      role="button"
    >
      <Icon name="heroicons:arrow-path" class="w-5 h-5 mr-2" />
      Обновить приложение
    </button>
  </div>
</template>

<script setup lang="ts">
const isCaching = ref(false)
const isCached = ref(false)
const updateAvailable = ref(false)


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
  }
  
  // Слушаем события обновления PWA
  window.addEventListener('pwa-update-available', () => {
    updateAvailable.value = true
  })
})
</script>
