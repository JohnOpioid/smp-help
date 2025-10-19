<template>
  <UApp>
    <!-- Результаты поиска -->
    <SearchResults />
    
    <!-- Основной контент -->
    <div v-if="!isSearchActive" class="absolute inset-0 overflow-hidden">
      <!-- Карта на весь экран -->
            <div class="absolute inset-0 w-full h-full z-0">
              <ClientOnly>
                <YMap ref="mapRef" v-if="placemarks.length" :center="mapCenter" :zoom="10" :placemarks="placemarks" @balloon-close="handleBalloonClose" @balloon-close-button-click="handleBalloonCloseButtonClick" @placemark-click="selectSubstationFromMap" />
              </ClientOnly>
            </div>
      
      <!-- Контентная область с сайдбаром -->
      <div class="relative z-10 max-w-5xl mx-auto px-4 h-full pointer-events-none">
        <!-- Сайдбар слева (только на десктопе) -->
        <div v-if="!isMobile" class="absolute left-4 right-4 sm:right-auto sm:w-80 top-1/2 -translate-y-1/2 h-[calc(100vh-200px)] bg-white dark:bg-slate-800 rounded-lg shadow-lg pointer-events-auto">
          <!-- Список подстанций -->
          <div ref="sidebarRef" class="h-full p-4 space-y-4 overflow-y-auto custom-scroll">
            <div v-for="(group, groupIndex) in groupedItems" :key="groupIndex">
              <!-- Заголовок группы -->
              <div class="bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg mb-2 sticky top-0 z-10">
                <div class="flex items-start justify-between">
                  <div class="flex flex-col">
                    <h3 class="font-semibold text-slate-900 dark:text-white text-sm">
                      Региональное объединение №{{ group.regionName }}
                    </h3>
                    <p v-if="group.regionData?.district" class="text-xs text-slate-400 dark:text-slate-300 mt-1">
                      <span class="font-bold">{{ group.regionData.district }}</span>
                    </p>
                    <p v-else class="text-xs text-slate-600 dark:text-slate-300 mt-1">
                      <span class="font-bold italic">не указан</span>
                    </p>
                  </div>
                  <UPopover>
                    <UButton variant="ghost" size="xs" icon="i-heroicons-ellipsis-horizontal" class="cursor-pointer" />
                    <template #content>
                      <div class="p-3 min-w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                        <div class="text-sm font-medium text-slate-600 dark:text-slate-300">
                          Руководитель
                        </div>
                        <div v-if="group.regionData?.manager" class="text-sm text-slate-600 dark:text-slate-300 mb-2">
                          {{ group.regionData.manager }}
                        </div>
                        <div v-if="group.regionData?.manager && group.regionData?.phones?.length" class="border-t border-slate-200 dark:border-slate-600 my-2"></div>
                        <div v-if="group.regionData?.phones?.length" class="space-y-1">
                          <div v-for="phone in group.regionData.phones" :key="phone.number" class="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                            <UIcon name="i-heroicons-phone" class="size-4 text-dimmed" />
                            <div class="flex flex-col text-left">
                              <span class="text-sm font-medium">{{ phone.number }}</span>
                              <span class="text-xs text-dimmed">{{ phone.name }}</span>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-sm text-slate-500">
                          Телефоны не указаны
                        </div>
                      </div>
                    </template>
                  </UPopover>
                </div>
              </div>
              
              <!-- Подстанции в группе -->
              <div class="space-y-1">
                <div
                  v-for="item in group.items"
                  :key="item._id"
                  :data-substation-id="item._id"
                  class="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg transition-colors"
                  :class="{ 'bg-slate-50 dark:bg-slate-700/40': selectedId === item._id }"
                  @click="toggleSelect(item)"
                >
                  <p class="font-medium text-slate-900 dark:text-white text-sm">{{ item.name }}</p>
                  <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">{{ item.address }}</p>
                  <p v-if="item.phones?.length" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.phones.join(', ') }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Кнопка для открытия bottom sheet на мобильных -->
        <div v-if="isMobile" class="absolute bottom-4 left-4 right-4 pointer-events-auto">
          <UButton 
            @click="isBottomSheetOpen = true"
            size="lg"
            color="primary"
            class="w-full shadow-lg"
            icon="i-heroicons-list-bullet"
          >
            Список подстанций
          </UButton>
        </div>
      </div>
    </div>
    
    <!-- Bottom Sheet для мобильных устройств -->
    <USlideover v-model="isBottomSheetOpen" side="bottom">
      <UCard class="h-[80vh] flex flex-col">
        <template #header>
          <div class="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Подстанции</h3>
            <UButton 
              @click="isBottomSheetOpen = false"
              variant="ghost" 
              size="sm" 
              icon="i-heroicons-x-mark"
            />
          </div>
        </template>
        
        <!-- Список подстанций в bottom sheet -->
        <div class="flex-1 overflow-y-auto p-4 space-y-4">
          <div v-for="(group, groupIndex) in groupedItems" :key="groupIndex">
            <!-- Заголовок группы -->
            <div class="bg-slate-100 dark:bg-slate-700 px-3 py-2 rounded-lg mb-2 sticky top-0 z-10">
              <div class="flex items-start justify-between">
                <div class="flex flex-col">
                  <h3 class="font-semibold text-slate-900 dark:text-white text-sm">
                    Региональное объединение №{{ group.regionName }}
                  </h3>
                  <p v-if="group.regionData?.district" class="text-xs text-slate-400 dark:text-slate-300 mt-1">
                    <span class="font-bold">{{ group.regionData.district }}</span>
                  </p>
                  <p v-else class="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    <span class="font-bold italic">не указан</span>
                  </p>
                </div>
                <UPopover>
                  <UButton variant="ghost" size="xs" icon="i-heroicons-ellipsis-horizontal" class="cursor-pointer" />
                  <template #content>
                    <div class="p-3 min-w-64 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg">
                      <div class="text-sm font-medium text-slate-600 dark:text-slate-300">
                        Руководитель
                      </div>
                      <div v-if="group.regionData?.manager" class="text-sm text-slate-600 dark:text-slate-300 mb-2">
                        {{ group.regionData.manager }}
                      </div>
                      <div v-if="group.regionData?.manager && group.regionData?.phones?.length" class="border-t border-slate-200 dark:border-slate-600 my-2"></div>
                      <div v-if="group.regionData?.phones?.length" class="space-y-1">
                        <div v-for="phone in group.regionData.phones" :key="phone.number" class="flex items-center gap-2 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded cursor-pointer">
                          <UIcon name="i-heroicons-phone" class="size-4 text-dimmed" />
                          <div class="flex flex-col text-left">
                            <span class="text-sm font-medium">{{ phone.number }}</span>
                            <span class="text-xs text-dimmed">{{ phone.name }}</span>
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-sm text-slate-500">
                        Телефоны не указаны
                      </div>
                    </div>
                  </template>
                </UPopover>
              </div>
            </div>
            
            <!-- Подстанции в группе -->
            <div class="space-y-1">
              <div
                v-for="item in group.items"
                :key="item._id"
                :data-substation-id="item._id"
                class="p-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 rounded-lg transition-colors"
                :class="{ 'bg-slate-50 dark:bg-slate-700/40': selectedId === item._id }"
                @click="toggleSelect(item); isBottomSheetOpen = false"
              >
                <p class="font-medium text-slate-900 dark:text-white text-sm">{{ item.name }}</p>
                <p class="text-xs text-slate-600 dark:text-slate-300 mt-1">{{ item.address }}</p>
                <p v-if="item.phones?.length" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.phones.join(', ') }}</p>
              </div>
            </div>
          </div>
        </div>
      </UCard>
    </USlideover>
    
    <!-- Глобальный индикатор предзагрузки -->
    <PreloadIndicator />
  </UApp>
</template>

<script setup lang="ts">
import SearchResults from '~/components/SearchResults.vue'
import PreloadIndicator from '~/components/PreloadIndicator.vue'

definePageMeta({
  middleware: 'auth'
})

// Глобальное состояние поиска
const { isSearchActive } = useGlobalSearch()

// Состояние bottom sheet для мобильных устройств
const isBottomSheetOpen = ref(false)
const isMobile = ref(false)

// Проверяем размер экрана
const checkScreenSize = () => {
  isMobile.value = window.innerWidth <= 768
}

// Объединяем все onMounted хуки
onMounted(() => {
  // Проверяем размер экрана
  checkScreenSize()
  window.addEventListener('resize', checkScreenSize)
  
  // Автоматический выбор подстанции по параметрам URL
  const route = useRoute()
  const urlLat = route.query.lat as string
  const urlLon = route.query.lon as string
  const urlName = route.query.name as string
  
  if (urlLat && urlLon && urlName) {
    const lat = parseFloat(urlLat)
    const lon = parseFloat(urlLon)
    
    if (!isNaN(lat) && !isNaN(lon)) {
      // Находим подстанцию по координатам
      const substation = items.value.find((s: any) => {
        const coords = s.location?.coordinates
        if (!coords || coords.length !== 2) return false
        
        const [lon, lat] = coords
        const distance = Math.sqrt(Math.pow(lon - parseFloat(urlLon), 2) + Math.pow(lat - parseFloat(urlLat), 2))
        return distance < 0.001 // Примерно 100 метров
      })
      
      if (substation) {
        selectedId.value = substation._id
        mapRef.value?.setCenter([substation.location.coordinates[0], substation.location.coordinates[1]], 18)
      }
    }
  }
  
  // Настраиваем автоматическую предзагрузку
  const { setupAutoPreload } = useAutoPreload()
  setupAutoPreload()
  
  // Добавляем обработчик поиска из шапки
  window.addEventListener('substations-search', handleHeaderSearch as EventListener)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize)
  window.removeEventListener('substations-search', handleHeaderSearch as EventListener)
})

const { data } = await useFetch<{ success: boolean; items: any[] }>(
  '/api/substations',
  { method: 'GET' }
)
const items = computed(() => data.value?.items || [])
const search = ref('')
const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  
  if (!q) {
    return items.value
  }
  
  const filtered = (items.value as any[]).filter((s: any) => {
    // Нормализуем название подстанции для поиска
    const normalizedName = s.name?.toLowerCase()
      .replace(/№/g, '') // убираем символ №
      .replace(/\s+/g, ' ') // заменяем множественные пробелы на одинарные
      .trim() || ''
    
    // Нормализуем адрес
    const normalizedAddress = s.address?.toLowerCase() || ''
    
    // Нормализуем телефоны
    const normalizedPhones = (s.phones || []).map((p: string) => p.toLowerCase())
    
    // Нормализуем поисковый запрос
    const normalizedQuery = q
      .replace(/№/g, '') // убираем символ №
      .replace(/\s+/g, ' ') // заменяем множественные пробелы на одинарные
      .trim()
    
    // Проверяем различные варианты поиска
    const nameMatch = normalizedName.includes(normalizedQuery)
    const addressMatch = normalizedAddress.includes(normalizedQuery)
    const phoneMatch = normalizedPhones.some((p: string) => p.includes(normalizedQuery))
    
    // Дополнительная проверка для номеров подстанций
    const numberMatch = normalizedName.match(/\d+/) && normalizedQuery.match(/\d+/) && 
                       normalizedName.match(/\d+/)?.[0] === normalizedQuery.match(/\d+/)?.[0]
    
    return nameMatch || addressMatch || phoneMatch || numberMatch
  })
  
  return filtered
})

// Группировка подстанций по регионам
const groupedItems = computed(() => {
  const groups: { [key: string]: any[] } = {}
  
  // Группируем подстанции по регионам
  filteredItems.value.forEach((item: any) => {
    const regionId = item.region?._id || 'no-region'
    const regionName = item.region?.name || 'Без региона'
    
    console.log('Item region data:', item.region)
    
    if (!groups[regionId]) {
      groups[regionId] = []
    }
    groups[regionId].push({ ...item, regionName })
  })
  
  // Преобразуем в массив групп с дополнительной информацией
  const groupsArray = Object.entries(groups).map(([regionId, items]) => {
    const regionName = items[0]?.regionName || 'Без региона'
    const regionData = items[0]?.region
    
    console.log('Region data for group:', regionName, regionData)
    console.log('District:', regionData?.district)
    
    return {
      regionId,
      regionName,
      regionData,
      items
    }
  })
  
  // Сортируем группы по возрастанию номеров регионов
  return groupsArray.sort((a, b) => {
    const numA = parseInt(a.regionName) || 999
    const numB = parseInt(b.regionName) || 999
    return numA - numB
  })
})

const selectedId = ref<string | null>(null)
const mapRef = ref<any>(null)
const sidebarRef = ref<HTMLDivElement | null>(null)
const balloonClosedByUser = ref(false)
const placemarks = computed(() => (items.value || []).map((s: any) => ({
  id: s._id,
  coords: [s.location.coordinates[1], s.location.coordinates[0]] as [number, number],
  hint: s.name,
  balloon: `
    <div class="balloon-header">
      <div class="balloon-title">${s.name}</div>
      <div class="balloon-subtitle">${s.address}</div>
    </div>
    <div class="balloon-body">
      ${(s.phones && s.phones.length) ? 
        s.phones.map((phone: string) => `
          <div class="phone-item" onclick="window.open('tel:${phone}', '_self')">
            <svg class="phone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
            </svg>
            <span class="phone-text">${phone}</span>
          </div>
        `).join('') : 
        '<div style="text-align: center; color: #64748b; font-size: 12px; padding: 8px;">Телефоны не указаны</div>'
      }
    </div>`
})))

const mapCenter = computed<[number, number]>(() => {
  // Если есть параметры из URL, используем их для центрирования карты
  const route = useRoute()
  const urlLat = route.query.lat as string
  const urlLon = route.query.lon as string
  
  if (urlLat && urlLon) {
    const lat = parseFloat(urlLat)
    const lon = parseFloat(urlLon)
    if (!isNaN(lat) && !isNaN(lon)) {
      return [lat, lon]
    }
  }
  
  // Иначе используем первую подстанцию или Москву по умолчанию
  const first = items.value?.[0]
  return first ? [first.location.coordinates[1], first.location.coordinates[0]] : [55.751244, 37.618423]
})

function handleBalloonCloseButtonClick() {
  // Устанавливаем флаг, что балун был закрыт пользователем
  balloonClosedByUser.value = true
  
  // Сбрасываем выделение
  clearSelection()
}

function handleBalloonClose() {
  // Не сбрасываем выделение автоматически при закрытии балуна
  // Выделение сбрасывается только при явном клике на уже выделенную подстанцию
}

function toggleSelect(item: any) {
  // Если кликаем на уже выделенную подстанцию - сбрасываем выделение
  if (selectedId.value === item._id) {
    selectedId.value = null
    // Возвращаем карту в изначальное положение
    if (process.client && mapRef.value) {
      const route = useRoute()
      const urlLat = route.query.lat as string
      const urlLon = route.query.lon as string
      
      if (urlLat && urlLon) {
        const lat = parseFloat(urlLat)
        const lon = parseFloat(urlLon)
        if (!isNaN(lat) && !isNaN(lon)) {
          mapRef.value.setCenter([lat, lon], 10)
        }
      } else {
        // Если нет URL параметров, центрируем на первой подстанции
        const first = items.value?.[0]
        if (first) {
          mapRef.value.setCenter([first.location.coordinates[1], first.location.coordinates[0]], 10)
        }
      }
    }
  } else {
    // Выделяем новую подстанцию
    selectedId.value = item._id
    if (process.client) {
      const coords: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]]
      setTimeout(() => {
        mapRef.value?.focusTo?.(coords, 18)
        mapRef.value?.openBalloon?.(item._id)
      }, 50)
    }
  }
}

function select(item: any) {
  selectedId.value = item._id
  // Фокусируемся на метке
  if (process.client) {
    const coords: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]]
    // небольшая задержка, чтобы карта успела смонтироваться
    setTimeout(() => {
      mapRef.value?.focusTo?.(coords, 14)
      mapRef.value?.openBalloon?.(item._id)
    }, 50)
  }
}

function scrollToSelectedSubstation() {
  if (process.client && sidebarRef.value && selectedId.value) {
    // Находим элемент выбранной подстанции
    const selectedElement = sidebarRef.value.querySelector(`[data-substation-id="${selectedId.value}"]`)
    if (selectedElement) {
      // Прокручиваем к элементу с небольшим отступом сверху
      selectedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      })
    }
  }
}

function selectSubstationFromMap(substationId: string) {
  selectedId.value = substationId
  
  // Приближаем карту к выбранной подстанции
  if (process.client && mapRef.value) {
    const substation = items.value?.find((s: any) => s._id === substationId)
    if (substation && substation.location?.coordinates) {
      mapRef.value.setCenter([substation.location.coordinates[1], substation.location.coordinates[0]], 18)
    }
  }
  
  // Прокручиваем сайдбар к выбранной подстанции
  setTimeout(() => {
    scrollToSelectedSubstation()
  }, 100)
}

function clearSelection() {
  // Сбрасываем выделение только если балун был закрыт пользователем
  if (balloonClosedByUser.value) {
    selectedId.value = null
    balloonClosedByUser.value = false
  }
  // Если балун был закрыт программно (при переключении между подстанциями), не сбрасываем выделение
}

const selectedItem = computed<any>(() => (items.value || []).find((s: any) => s._id === selectedId.value))

// Обработчик поиска из шапки
const handleHeaderSearch = (event: CustomEvent) => {
  search.value = event.detail.query
}
</script>


