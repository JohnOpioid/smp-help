<template>
  <div>
    <main class="flex-1">

      <!-- Основной контент -->
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div v-if="error" class="text-center py-8">
          <p class="text-red-600 dark:text-red-400">Ошибка загрузки данных</p>
        </div>

        <div v-else class="bg-white dark:bg-slate-800 rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Заболевания категории "{{ category?.name }}"</p>
          </div>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <li v-for="(item, index) in filteredItems" :key="item._id"
              class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
              :class="{ 
                'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < filteredItems.length - 1) || (index === filteredItems.length - 1 && filteredItems.length % 2 === 1),
                'md:border-b-0': index >= filteredItems.length - 2 && filteredItems.length % 2 === 0,
                'border-b-0': index === filteredItems.length - 1
              }"
              @click="openModal(item)">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="text-slate-900 dark:text-white font-medium truncate">{{ item.name }}</p>
                  <div class="flex items-center gap-2 mt-1 flex-wrap">
                    <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ item.mkbCode }}</span>
                    <span class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ item.stationCode }}</span>
                  </div>
                  <p v-if="item.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ item.note }}</p>
                </div>
                <svg class="w-4 h-4 text-slate-400 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>

            <!-- Индикатор загрузки -->
            <li v-if="isLoading" class="col-span-1 md:col-span-2 p-6">
              <div class="flex items-center justify-center space-x-2">
                <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <span class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</span>
              </div>
            </li>

            <!-- Триггер для ленивой загрузки -->
            <div ref="loadMoreTrigger" class="h-1 col-span-1 md:col-span-2"></div>

            <li v-if="!isLoading && filteredItems.length === 0 && otherCategoryGroups.length === 0" class="col-span-1 md:col-span-2 p-6">
              <div class="flex flex-col items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span>В категории ничего не найдено</span>
              </div>
            </li>
          </ul>

          <!-- Если в категории не найдено, показать результаты из других категорий -->
          <div v-if="!isLoading && searchText.trim() && filteredItems.length === 0 && otherCategoryGroups.length > 0" class="pb-4">
            <div v-for="group in otherCategoryGroups" :key="group.categoryUrl">
              <div class="relative my-4">
                <div class="absolute inset-0 flex items-center"><div class="w-full border-t border-slate-200 dark:border-slate-600"></div></div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В категории {{ group.categoryName }}</span>
                </div>
              </div>
              <ul class="divide-y divide-slate-100 dark:divide-slate-700">
                <li v-for="it in group.items" :key="it._id"
                    class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                    @click="openDiagnosis(it)">
                  <div class="flex items-center justify-between">
                    <div class="min-w-0">
                      <p class="text-slate-900 dark:text-white font-medium truncate">{{ it.name }}</p>
                      <div class="flex items-center gap-2 mt-1 flex-wrap">
                        <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ it.mkbCode }}</span>
                        <span v-if="it.stationCode" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ it.stationCode }}</span>
                      </div>
                      <p v-if="it.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ it.note }}</p>
                    </div>
                    <svg class="w-4 h-4 text-slate-400 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </div>

    <!-- Модалка с информацией о заболевании -->
    <template v-if="!isMobile">
      <UModal 
        v-model:open="modalOpen" 
        :title="selectedItem?.name || ''" 
        description="Информация о заболевании" 
        :ui="{ 
          overlay: 'bg-slate-700/50',
          wrapper: 'sm:max-w-lg',
          content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
          body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
          close: 'cursor-pointer'
        }"
        modal
        overlay
        transition
      >
        <template #body>
          <div v-if="selectedItem" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код МКБ-10</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.mkbCode }}</p>
              </div>
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}</p>
              </div>
            </div>
            
            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Нозологическая форма</label>
              <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedItem.name }}</p>
            </div>

            <div v-if="selectedItem.note">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
              <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.note }}</p>
            </div>

            <div>
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</label>
              <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.category?.name }}</p>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-3 w-full">
            <UButton
              :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
              color="secondary"
              variant="soft"
              @click="toggleBookmark()"
              :disabled="!selectedItem"
              size="xl"
              :title="isBookmarked ? 'В избранном' : 'В закладки'"
              class="cursor-pointer flex-1 justify-center items-center custom-secondary-button"
            >
              {{ isBookmarked ? 'В избранном' : 'В закладки' }}
            </UButton>
            <UButton
              icon="i-heroicons-share"
              color="secondary"
              variant="soft"
              size="xl"
              @click="shareItem"
              :disabled="!selectedItem"
              class="cursor-pointer flex-1 justify-center items-center custom-secondary-button"
            >
              Поделиться
            </UButton>
          </div>
        </template>
      </UModal>
    </template>

    <!-- Bottom Sheet для мобильных -->
    <template v-else>
      <ClientOnly>
        <BottomSheet 
          v-model="modalOpen"
          :title="selectedItem?.name"
          @close="modalOpen = false"
        >
          <div class="p-4 pb-6">
            <div v-if="selectedItem" class="space-y-4">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код МКБ-10</label>
                  <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.mkbCode }}</p>
                </div>
                <div>
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                  <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}</p>
                </div>
              </div>
              
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Нозологическая форма</label>
                <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedItem.name }}</p>
              </div>

              <div v-if="selectedItem.note">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
                <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.note }}</p>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категория</label>
                <p class="text-slate-600 dark:text-slate-300">{{ selectedItem.category?.name }}</p>
              </div>
            </div>
            
            <!-- Кнопки действий -->
            <div class="mt-6">
              <div class="flex gap-3 w-full">
                <UButton
                  :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
                  color="secondary"
                  variant="soft"
                  @click="toggleBookmark()"
                  :disabled="!selectedItem"
                  size="xl"
                  :title="isBookmarked ? 'В избранном' : 'В закладки'"
                  class="cursor-pointer flex-1 justify-center items-center custom-secondary-button"
                >
                  {{ isBookmarked ? 'В избранном' : 'В закладки' }}
                </UButton>
                <UButton
                  icon="i-heroicons-share"
                  color="secondary"
                  variant="soft"
                  size="xl"
                  @click="shareItem"
                  :disabled="!selectedItem"
                  class="cursor-pointer flex-1 justify-center items-center custom-secondary-button"
                >
                  Поделиться
                </UButton>
              </div>
            </div>
          </div>
        </BottomSheet>
      </ClientOnly>
    </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Кодификатор' })

const route = useRoute()
const url = route.params.url as string

// Состояние для ленивой загрузки
const allItems = ref<any[]>([])
const currentPage = ref(1)
const isLoading = ref(false)
const hasMore = ref(true)
const error = ref<string | null>(null)
const category = ref<any>(null)

// Загрузка данных
async function loadItems(page: number = 1, append: boolean = false) {
  if (isLoading.value) return
  
  isLoading.value = true
  error.value = null
  
  try {
    const response = await $fetch<{ 
      success: boolean; 
      category: any; 
      items: any[];
      pagination: {
        page: number;
        limit: number;
        totalItems: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      }
    }>(`/api/codifier/${url}`, {
      query: { page, limit: 10 }
    })
    
    if (response.success) {
      if (page === 1) {
        category.value = response.category
        allItems.value = response.items
      } else {
        allItems.value.push(...response.items)
      }
      
      hasMore.value = response.pagination.hasNextPage
      currentPage.value = page
      
      console.log('📊 Загружена страница:', page, 'элементов:', response.items.length, 'всего:', allItems.value.length, 'hasMore:', hasMore.value)
    } else {
      error.value = 'Ошибка загрузки данных'
    }
  } catch (err) {
    error.value = 'Ошибка загрузки данных'
    console.error('Ошибка загрузки:', err)
  } finally {
    isLoading.value = false
  }
}

// Загрузка конкретного элемента по ID
async function loadSpecificItem(itemId: string) {
  try {
    console.log('🔍 Загружаем конкретный элемент:', itemId)
    
    // Загружаем элемент напрямую из API MKB
    const response = await $fetch<{ success: boolean; items: any[] }>('/api/mkb/all')
    
    if (response.success && response.items) {
      const found = response.items.find((item: any) => String(item._id) === String(itemId))
      
      if (found) {
        console.log('✅ Элемент найден и загружен:', found.name)
        
        // Проверяем, что элемент принадлежит текущей категории
        if (found.category?.url === url) {
          // Добавляем элемент в список, если его там еще нет
          const exists = allItems.value.find((item: any) => String(item._id) === String(itemId))
          if (!exists) {
            allItems.value.push(found)
          }
          
          // Открываем модалку
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
          console.log('❌ Элемент не принадлежит текущей категории')
        }
      } else {
        console.log('❌ Элемент не найден в базе данных')
      }
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки конкретного элемента:', err)
  }
}

// Intersection Observer для ленивой загрузки
const loadMoreTrigger = ref<HTMLElement>()
let io: IntersectionObserver | null = null

onMounted(async () => {
  // Загружаем первую страницу
  await loadItems(1)
  
  // Настраиваем Intersection Observer после следующего тика
  await nextTick()
  
  // IntersectionObserver для догрузки
  io = new IntersectionObserver((entries) => {
    const entry = entries[0]
    console.log('👁️ Intersection Observer сработал:', entry.isIntersecting, 'hasMore:', hasMore.value, 'isLoading:', isLoading.value, 'currentPage:', currentPage.value)
    if (entry && entry.isIntersecting) {
      if (hasMore.value && !isLoading.value) {
        console.log('📥 Загружаем следующую страницу:', currentPage.value + 1)
        loadItems(currentPage.value + 1, true)
      } else {
        console.log('❌ Не загружаем:', 'hasMore:', hasMore.value, 'isLoading:', isLoading.value)
      }
    }
  })
  if (loadMoreTrigger.value && io) {
    console.log('🔍 Настраиваем observer для элемента:', loadMoreTrigger.value)
    io.observe(loadMoreTrigger.value)
  } else {
    console.log('❌ Не можем настроить observer:', 'loadMoreTrigger:', !!loadMoreTrigger.value, 'io:', !!io)
  }

  // Авто-открытие по query параметрам
  const itemId = routeQuery.query.id as string | undefined
  const openId = routeQuery.query.open as string | undefined
  const mkbCode = routeQuery.query.mkb as string | undefined
  
  console.log('🔍 Авто-открытие кодификатора:', { itemId, openId, mkbCode, itemsCount: items.value.length })
  
  // Обрабатываем только openId и mkbCode здесь, itemId обрабатывается в watcher
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) openModal(found)
  } else if (mkbCode) {
    const found = items.value.find((i: any) => i.mkbCode === mkbCode)
    if (found) openModal(found)
  } else if (itemId) {
    // Если есть itemId при загрузке страницы, обрабатываем его здесь
    console.log('🔍 Обрабатываем itemId при загрузке страницы:', itemId)
    const checkAndOpenItem = () => {
      console.log('🔍 Проверка авто-открытия при загрузке:', { itemsCount: items.value.length, itemId })
      if (items.value.length > 0) {
        const found = items.value.find((i: any) => String(i._id) === String(itemId))
        console.log('🔍 Поиск элемента при загрузке:', { found: !!found, foundId: found?._id, searchId: itemId })
        if (found) {
          console.log('✅ Открываем модалку кодификатора при загрузке')
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
          console.log('❌ Элемент не найден в загруженных данных при загрузке, загружаем напрямую')
          loadSpecificItem(itemId)
        }
      } else {
        console.log('⏳ Данные еще загружаются при загрузке, повторяем через 100мс')
        setTimeout(checkAndOpenItem, 100)
      }
    }
    checkAndOpenItem()
  }
})

onUnmounted(() => {
  try { 
    io?.disconnect() 
  } catch { }
})

// Computed для отображения элементов
const items = computed(() => allItems.value)
const searchText = ref('')
const filteredItems = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return items.value
  return (items.value as any[]).filter((it) => {
    const text = [it.name, it.mkbCode, it.stationCode, it.note].filter(Boolean).join(' ').toLowerCase()
    return text.includes(q)
  })
})

function clearSearch() { searchText.value = '' }

// Поиск по всем категориям при пустой выдаче в текущей
const allDiagnoses = ref<any[]>([])
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/mkb/all')
    allDiagnoses.value = res?.items || []
  } catch {}
})

const otherCategoryGroups = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return []
  const currentUrl = route.params.url as string
  const matched = (allDiagnoses.value as any[]).filter((it) => {
    const text = [it.name, it.mkbCode, it.stationCode, it.note].filter(Boolean).join(' ').toLowerCase()
    const catUrl = String(it.category?.url || '')
    return text.includes(q) && catUrl && catUrl !== currentUrl
  }).slice(0, 200)
  const groups: Record<string, any[]> = {}
  for (const it of matched) {
    const cu = String(it.category?.url)
    ;(groups[cu] ||= []).push(it)
  }
  return Object.keys(groups).map((cu) => ({
    categoryUrl: cu,
    categoryName: String((groups[cu][0]?.category?.name) || 'Категория'),
    items: groups[cu]
  }))
})

function openDiagnosis(it: any) {
  const url = String(it.category?.url || '')
  if (url) navigateTo(`/codifier/${url}?open=${it._id}`)
}

const { isMobile } = useIsMobile()
const modalOpen = ref(false)
const selectedItem = ref<any>(null)
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])



// Функция для обработки открытия BottomSheet

function openModal(item: any) {
  selectedItem.value = item
  modalOpen.value = true
  
  // Обновляем URL с ID диагноза через query параметр только если его еще нет
  if (!route.query.id || route.query.id !== item._id) {
    // Используем прямое изменение истории браузера для избежания моргания
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('id', item._id)
    window.history.replaceState({}, '', newUrl.toString())
  }
  
  // обновляем статус избранного
  updateIsBookmarked()
}

function closeModal() {
  modalOpen.value = false
  // Очищаем query параметры используя прямое изменение истории браузера
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.delete('id')
  newUrl.searchParams.delete('open')
  newUrl.searchParams.delete('mkb')
  window.history.replaceState({}, '', newUrl.toString())
}

async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

function buildItemUrl(it: any) {
  return `/codifier/${url}?id=${it?._id}`
}

async function updateIsBookmarked() {
  if (!selectedItem.value) { isBookmarked.value = false; return }
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const targetUrl = buildItemUrl(selectedItem.value)
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
}

async function addBookmark() {
  if (!selectedItem.value) return
  try {
    await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'codifier',
        title: selectedItem.value.name,
        description: selectedItem.value.note,
        category: category.value?.name,
        url: `/codifier/${url}?id=${selectedItem.value._id}`,
        mkbCode: selectedItem.value.mkbCode,
        stationCode: selectedItem.value.stationCode
      }
    })
    isBookmarked.value = true
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Добавлено в закладки', color: 'primary' })
  } catch (e) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось добавить в закладки', color: 'error' })
  }
}

async function removeBookmark() {
  if (!selectedItem.value) return
  try {
    // находим id закладки по url
    const targetUrl = buildItemUrl(selectedItem.value)
    if (userBookmarks.value.length === 0) await loadBookmarks()
    const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
    if (!bm?._id) return
    await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
    isBookmarked.value = false
    userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
  } catch (e) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось удалить из закладок', color: 'error' })
  }
}

async function toggleBookmark() {
  if (isBookmarked.value) {
    await removeBookmark()
  } else {
    await addBookmark()
  }
}

// Функция для поделиться
async function shareItem() {
  if (!selectedItem.value) return
  
  const shareData = {
    title: selectedItem.value.name,
    text: `МКБ-10: ${selectedItem.value.mkbCode}${selectedItem.value.stationCode ? ` | Код станции: ${selectedItem.value.stationCode}` : ''}`,
    url: window.location.href
  }
  
  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData)
    } else {
      // Fallback - копируем URL в буфер обмена
      await navigator.clipboard.writeText(window.location.href)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Ссылка скопирована в буфер обмена', color: 'primary' })
    }
  } catch (error) {
    console.error('Ошибка при попытке поделиться:', error)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось поделиться', color: 'error' })
  }
}

// Авто-открытие по query ?open=<id> или ?mkb=<code>
const routeQuery = useRoute()


// Открытие/закрытие модалки при изменении query параметров
watch(() => [route.query.open, route.query.mkb], ([openVal, mkbVal]) => {
  const openId = openVal as string | undefined
  const mkbCode = mkbVal as string | undefined
  
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) openModal(found)
  } else if (mkbCode) {
    const found = items.value.find((i: any) => i.mkbCode === mkbCode)
    if (found) openModal(found)
  } else if (modalOpen.value) {
    closeModal()
  }
})

// Отдельный watcher для id параметра
watch(() => route.query.id, (newId, oldId) => {
  console.log('🔍 Watcher route.query.id:', { newId, oldId, itemsCount: items.value.length })
  
  // Пропускаем срабатывание при первоначальной загрузке страницы с параметром id
  if (newId && !oldId) {
    console.log('🔍 Пропускаем watcher при первоначальной загрузке с id')
    return
  }
  
  // Если есть новый ID и он отличается от старого
  if (newId && newId !== oldId) {
    // Ждем загрузки данных и открываем нужный элемент
    const checkAndOpenItem = () => {
      console.log('🔍 Проверка авто-открытия в watcher:', { itemsCount: items.value.length, itemId: newId })
      if (items.value.length > 0) {
        const found = items.value.find((i: any) => String(i._id) === String(newId))
        console.log('🔍 Watcher поиск элемента:', { found: !!found, foundId: found?._id, searchId: newId })
        if (found) {
          console.log('✅ Watcher открываем модалку кодификатора')
          // Открываем модалку без изменения URL
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
          console.log('❌ Watcher элемент не найден в загруженных данных, загружаем напрямую')
          // Если элемент не найден в загруженных данных, загружаем его напрямую
          loadSpecificItem(String(newId))
        }
      } else {
        console.log('⏳ Watcher данные еще загружаются, повторяем через 100мс')
        // Данные еще загружаются, повторяем через 100мс
        setTimeout(checkAndOpenItem, 100)
      }
    }
    checkAndOpenItem()
  } else if (!newId && modalOpen.value) {
    console.log('🔍 Watcher закрываем модалку')
    // Если id убран, закрываем модалку
    modalOpen.value = false
  }
})

// Watcher для modalOpen - очищаем URL при закрытии модалки
watch(modalOpen, (newValue, oldValue) => {
  // Если модалка закрылась (была открыта, стала закрыта)
  if (oldValue === true && newValue === false) {
    // Очищаем query параметры используя прямое изменение истории браузера
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('id')
    newUrl.searchParams.delete('open')
    newUrl.searchParams.delete('mkb')
    window.history.replaceState({}, '', newUrl.toString())
  }
})
</script>
