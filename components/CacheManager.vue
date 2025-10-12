<template>
  <div v-if="isMounted" class="fixed bottom-20 left-4 right-4 md:bottom-4 md:left-auto md:right-auto md:w-auto z-50 space-y-2">
    <!-- Кнопка сохранения приложения (только на мобильных) -->
    <button
      v-if="!isCaching && !isCached && !updateAvailable && !showSuccessMessage"
      @click="precacheSite"
      :disabled="isCaching"
      class="w-full md:hidden inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 disabled:opacity-75 disabled:cursor-not-allowed cursor-pointer shadow-lg"
      role="button"
    >
      <Icon name="heroicons:device-phone-mobile" class="w-5 h-5 mr-2" />
      <span>Сохранить приложение</span>
    </button>

    <!-- Индикатор сохранения с прогрессом -->
    <div v-if="isCaching" class="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm w-full md:w-auto">
      <div class="flex items-center gap-2 mb-2">
        <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
        <span>Сохранение приложения... {{ cachedPages }}/{{ totalPages }}</span>
      </div>
      <div class="w-full bg-blue-400 rounded-full h-2">
        <div 
          class="bg-white h-2 rounded-full transition-all duration-300" 
          :style="{ width: `${progressPercentage}%` }"
        ></div>
      </div>
    </div>

    <!-- Индикатор успешного сохранения -->
    <div v-if="showSuccessMessage" class="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm w-full md:w-auto">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:check-circle" class="w-4 h-4" />
        <span>Приложение сохранено</span>
      </div>
    </div>

    <!-- Кнопка обновления -->
    <button
      v-if="updateAvailable && !isCaching && !showSuccessMessage"
      @click="updateApp"
      class="w-full md:hidden inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-orange-200 dark:border-orange-500 text-base font-medium rounded-md text-orange-700 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-colors duration-200 animate-pulse cursor-pointer shadow-lg"
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
const isMounted = ref(false)
const cachedPages = ref(0)
const totalPages = ref(0)
const showSuccessMessage = ref(false)

// Вычисляемое свойство для процента прогресса
const progressPercentage = computed(() => {
  if (totalPages.value === 0) return 0
  return Math.round((cachedPages.value / totalPages.value) * 100)
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
  cachedPages.value = 0
  totalPages.value = pagesToCache.length
  showSuccessMessage.value = false
  
  try {
    for (let i = 0; i < pagesToCache.length; i++) {
      const page = pagesToCache[i]
      try {
        // Кешируем страницу
        await fetch(page, { 
          method: 'GET',
          cache: 'force-cache'
        })
        
        cachedPages.value = i + 1
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Не удалось кешировать страницу ${page}:`, error)
        cachedPages.value = i + 1
      }
    }
    
    isCached.value = true
    showSuccessMessage.value = true
    
    // Сохраняем статус кеширования в localStorage
    localStorage.setItem('site-cached', 'true')
    
    // Скрываем сообщение об успехе через 3 секунды
    setTimeout(() => {
      showSuccessMessage.value = false
    }, 3000)
    
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
  isMounted.value = true
  
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
