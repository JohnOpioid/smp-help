<template>
  <div class="fixed bottom-4 left-4 z-50 space-y-2">
    <!-- Кнопка предварительного кеширования -->
    <UButton
      v-if="!isCaching && !isCached"
      @click="precacheSite"
      color="blue"
      size="sm"
      class="shadow-lg"
      :loading="isCaching"
    >
      <Icon name="heroicons:cloud-arrow-down" class="w-4 h-4 mr-2" />
      Кешировать сайт
    </UButton>

    <!-- Индикатор кеширования -->
    <div v-if="isCaching" class="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:arrow-path" class="w-4 h-4 animate-spin" />
        <span>Кеширование: {{ cachedPages }}/{{ totalPages }} страниц</span>
      </div>
      <div class="w-full bg-blue-300 rounded-full h-2 mt-2">
        <div 
          class="bg-white h-2 rounded-full transition-all duration-300" 
          :style="{ width: `${(cachedPages / totalPages) * 100}%` }"
        ></div>
      </div>
    </div>

    <!-- Индикатор успешного кеширования -->
    <div v-if="isCached && !isCaching" class="bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg text-sm">
      <div class="flex items-center gap-2">
        <Icon name="heroicons:check-circle" class="w-4 h-4" />
        <span>Сайт кеширован ({{ cachedPages }} страниц)</span>
      </div>
    </div>

    <!-- Кнопка обновления -->
    <UButton
      v-if="updateAvailable"
      @click="updateApp"
      color="orange"
      size="sm"
      class="shadow-lg animate-pulse"
    >
      <Icon name="heroicons:arrow-path" class="w-4 h-4 mr-2" />
      Обновить приложение
    </UButton>
  </div>
</template>

<script setup lang="ts">
const isCaching = ref(false)
const isCached = ref(false)
const cachedPages = ref(0)
const totalPages = ref(0)
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
  cachedPages.value = 0
  totalPages.value = pagesToCache.length
  
  try {
    for (const page of pagesToCache) {
      try {
        // Кешируем страницу
        await fetch(page, { 
          method: 'GET',
          cache: 'force-cache'
        })
        
        cachedPages.value++
        
        // Небольшая задержка между запросами
        await new Promise(resolve => setTimeout(resolve, 100))
      } catch (error) {
        console.warn(`Не удалось кешировать страницу ${page}:`, error)
      }
    }
    
    isCached.value = true
    
    // Сохраняем статус кеширования в localStorage
    localStorage.setItem('site-cached', 'true')
    localStorage.setItem('cached-pages', cachedPages.value.toString())
    
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
  
  // Перезагружаем страницу
  window.location.reload()
}

// Проверка статуса кеширования при загрузке
onMounted(() => {
  // Проверяем, был ли сайт уже кеширован
  const cached = localStorage.getItem('site-cached')
  const pages = localStorage.getItem('cached-pages')
  
  if (cached === 'true' && pages) {
    isCached.value = true
    cachedPages.value = parseInt(pages)
  }
  
  // Слушаем события обновления PWA
  window.addEventListener('pwa-update-available', () => {
    updateAvailable.value = true
  })
})
</script>
