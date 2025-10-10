<template>
    <NuxtLayout name="substations">
      <template #sidebar>
        <div>
          <div class="bg-slate-200 dark:bg-slate-700 sticky top-0 p-2 md:p-4 z-50">
            <div class="relative">
              <UInput v-model="search" placeholder="Поиск подстанции по названию, адресу или телефону" size="xl" class="w-full" :input-class="'px-4 py-6 pr-10'" />
              <button 
                v-if="search" 
                @click="search = ''" 
                class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                type="button"
              >
                <UIcon name="i-heroicons-x-mark" class="size-5" />
              </button>
            </div>
          </div>
          <div class="space-y-4">
            <div v-for="(group, groupIndex) in groupedItems" :key="groupIndex" class="overflow-hidden">
              <!-- Заголовок группы -->
                <div class="bg-slate-100 dark:bg-slate-700 px-4 py-3 flex items-start justify-between">
                <div class="flex flex-col">
                  <h3 class="font-semibold text-slate-900 dark:text-white">
                    Региональное объединение №{{ group.regionName }}
                  </h3>
                  <p v-if="group.regionData?.district" class="text-sm text-slate-400 dark:text-slate-300 mt-1">
                    <span class="font-bold">{{ group.regionData.district }}</span>
                  </p>
                  <p v-else class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                    <span class="font-bold italic">не указан</span>
                  </p>
                </div>
                <UPopover>
                  <UButton variant="ghost" size="sm" icon="i-heroicons-ellipsis-horizontal" class="cursor-pointer" />
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
              
              <!-- Подстанции в группе -->
              <ul class="divide-y divide-slate-100 dark:divide-slate-700">
                <li
                  v-for="item in group.items"
                  :key="item._id"
                  class="py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/40 px-4"
                  @click="select(item)"
                >
                  <p class="font-medium text-slate-900 dark:text-white">{{ item.name }}</p>
                  <p class="text-sm text-slate-600 dark:text-slate-300">{{ item.address }}</p>
                  <p v-if="item.phones?.length" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.phones.join(', ') }}</p>
                </li>
              </ul>
            </div>
          </div>

          <!-- Мобильная карта: bottom sheet -->
          <BottomSheet 
            v-model="showMobileMap"
            :title="selectedName"
            :subtitle="selectedItem?.address"
            @close="closeMobileMap"
          >
            <!-- Информация о подстанции -->
            <div v-if="selectedItem?.phones?.length" class="px-4 py-3 border-b border-slate-200 dark:border-slate-600">
              <h4 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Телефоны:</h4>
              <div class="space-y-2">
                <div v-for="phone in selectedItem.phones" :key="phone" class="flex items-center gap-2">
                  <UIcon name="i-heroicons-phone" class="size-4 text-slate-500 dark:text-slate-400" />
                  <a :href="`tel:${phone}`" class="text-sm text-slate-700 dark:text-slate-300 hover:text-primary">{{ phone }}</a>
                </div>
              </div>
            </div>
            
            <!-- Карта внутри BottomSheet -->
            <div class="flex-1 min-h-0" style="height: 400px;">
              <ClientOnly>
                <YMap v-if="mobileCenter" :center="mobileCenter!" :zoom="12" :placemarks="mobilePlacemarks as any" />
              </ClientOnly>
            </div>
          </BottomSheet>
        </div>
      </template>
      <div class="w-full h-full">
        <ClientOnly>
          <YMap ref="mapRef" v-if="placemarks.length" :center="mapCenter" :zoom="10" :placemarks="placemarks" />
        </ClientOnly>
      </div>
    </NuxtLayout>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { data } = await useFetch<{ success: boolean; items: any[] }>(
  '/api/substations',
  { method: 'GET' }
)
const items = computed(() => data.value?.items || [])
const search = ref('')
const filteredItems = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return items.value
  return (items.value as any[]).filter((s: any) =>
    s.name?.toLowerCase().includes(q) ||
    s.address?.toLowerCase().includes(q) ||
    (s.phones || []).some((p: string) => p.toLowerCase().includes(q))
  )
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
const placemarks = computed(() => (items.value || []).map((s: any) => ({
  id: s._id,
  coords: [s.location.coordinates[1], s.location.coordinates[0]] as [number, number],
  hint: s.name,
  balloon: `<strong>${s.name}</strong><br/>${s.address}${(s.phones && s.phones.length) ? `<br/>${s.phones.map((phone: string) => `<a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>`).join(', ')}` : ''}`
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

function select(item: any) {
  selectedId.value = item._id
  // На мобильных показываем карту после выбора
  showMobileMap.value = true
  // На больших экранах фокусируемся на метке
  if (process.client && window.innerWidth >= 640) {
    const coords: [number, number] = [item.location.coordinates[1], item.location.coordinates[0]]
    // небольшая задержка, чтобы карта успела смонтироваться
    setTimeout(() => {
      mapRef.value?.focusTo?.(coords, 14)
    }, 50)
  }
}

const showMobileMap = ref(false)
const selectedItem = computed<any>(() => (items.value || []).find((s: any) => s._id === selectedId.value))
const mobileCenter = computed<[number, number] | null>(() => {
  const s = selectedItem.value
  return s ? [s.location.coordinates[1], s.location.coordinates[0]] : null
})
const selectedName = computed(() => selectedItem.value?.name || '')
const mobilePlacemarks = computed(() => selectedItem.value ? [{
  id: selectedItem.value._id,
  coords: [selectedItem.value.location.coordinates[1], selectedItem.value.location.coordinates[0]] as [number, number],
  hint: selectedItem.value.name,
  balloon: `<strong>${selectedItem.value.name}</strong><br/>${selectedItem.value.address}${(selectedItem.value.phones && selectedItem.value.phones.length) ? `<br/>${selectedItem.value.phones.map((phone: string) => `<a href="tel:${phone}" style="color: #2563eb; text-decoration: none;">${phone}</a>`).join(', ')}` : ''}`
}] : [])

function closeMobileMap() {
  showMobileMap.value = false
}


// Автоматический выбор подстанции по параметрам URL
onMounted(() => {
  const route = useRoute()
  const urlLat = route.query.lat as string
  const urlLon = route.query.lon as string
  const urlName = route.query.name as string
  
  if (urlLat && urlLon && urlName) {
    const lat = parseFloat(urlLat)
    const lon = parseFloat(urlLon)
    
    if (!isNaN(lat) && !isNaN(lon)) {
      // Ищем подстанцию по координатам или названию
      const targetSubstation = items.value.find((item: any) => {
        // Сначала пробуем найти по близости координат (более точно)
        if (item.location?.coordinates) {
          const itemLat = item.location.coordinates[1]
          const itemLon = item.location.coordinates[0]
          const distance = Math.sqrt(Math.pow(lat - itemLat, 2) + Math.pow(lon - itemLon, 2))
          if (distance < 0.0001) { // примерно 10 метров - очень точное совпадение
            return true
          }
        }
        
        // Если точного совпадения по координатам нет, ищем по названию
        const decodedName = decodeURIComponent(urlName)
        if (item.name === decodedName) {
          return true
        }
        
        // Также проверяем частичное совпадение названия (убираем лишние символы)
        const cleanItemName = item.name.replace(/[^\w\s\d]/gi, '').toLowerCase()
        const cleanUrlName = decodedName.replace(/[^\w\s\d]/gi, '').toLowerCase()
        if (cleanItemName === cleanUrlName) {
          return true
        }
        
        return false
      })
      
      if (targetSubstation) {
        console.log('Автоматически выбрана подстанция:', targetSubstation.name)
        select(targetSubstation)
      }
    }
  }
})
</script>


