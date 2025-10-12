<template>
  <div>
    <main class="flex-1">
      <!-- Блок поиска отдельно -->
      <div class="max-w-5xl w-full mx-auto px-4 pt-8">
        <SearchBar />
      </div>

      <!-- Основной контент -->
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <div v-if="error" class="text-center py-8">
          <p class="text-red-600 dark:text-red-400">Ошибка загрузки данных</p>
        </div>

        <div v-else class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Заболевания категории "{{ category?.name }}"</p>
          </div>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <li v-for="(item, index) in items" :key="item._id"
              class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
              :class="{ 
                'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < items.length - 1) || (index === items.length - 1 && items.length % 2 === 1),
                'md:border-b-0': index >= items.length - 2 && items.length % 2 === 0,
                'border-b-0': index === items.length - 1
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

            <li v-if="!isLoading && items.length === 0" class="col-span-1 md:col-span-2 p-6">
              <p class="text-sm text-slate-600 dark:text-slate-300">Заболевания не найдены</p>
            </li>
          </ul>
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
          <div class="flex items-center justify-between gap-2 w-full">
            <UButton
              :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
              :class="isBookmarked
                ? 'inline-flex items-center justify-center w-7 h-7 p-0 text-xs text-amber-600 dark:text-amber-400 cursor-pointer'
                : 'inline-flex items-center justify-center w-7 h-7 p-0 text-xs text-slate-600 dark:text-slate-300 cursor-pointer'"
              variant="ghost"
              color="neutral"
              @click="toggleBookmark()"
              :disabled="!selectedItem"
              size="xs"
              :title="isBookmarked ? 'В избранном' : 'В закладки'"
            />
            <UButton color="neutral" variant="ghost" type="button" @click="closeModal" class="cursor-pointer">Закрыть</UButton>
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
          </div>
          
          <!-- Футер с кнопкой закладок -->
          <template #footer>
            <div class="flex justify-start">
              <UButton
                :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
                :class="isBookmarked
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-600 dark:text-slate-300'"
                variant="ghost"
                color="neutral"
                @click="toggleBookmark()"
                :disabled="!selectedItem"
                size="lg"
                :title="isBookmarked ? 'В избранном' : 'В закладки'"
              />
            </div>
          </template>
        </BottomSheet>
      </ClientOnly>
    </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'

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

  // Авто-открытие по query ?open=<id> или ?mkb=<code>
  const openId = routeQuery.query.open as string | undefined
  const mkbCode = routeQuery.query.mkb as string | undefined
  
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) openModal(found)
  } else if (mkbCode) {
    const found = items.value.find((i: any) => i.mkbCode === mkbCode)
    if (found) openModal(found)
  }
})

onUnmounted(() => {
  try { 
    io?.disconnect() 
  } catch { }
})

// Computed для отображения элементов
const items = computed(() => allItems.value)

const { isMobile } = useIsMobile()
const modalOpen = ref(false)
const selectedItem = ref<any>(null)
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])



// Функция для обработки открытия BottomSheet

function openModal(item: any) {
  console.log('🚀 openModal вызвана для:', item.name)
  console.log('📱 isMobile:', isMobile.value)
  
  selectedItem.value = item
  modalOpen.value = true
  // обновляем статус избранного
  updateIsBookmarked()
}

function closeModal() {
  modalOpen.value = false
  const q = { ...route.query }
  if ('open' in q) delete q.open
  if ('mkb' in q) delete q.mkb
  navigateTo({ path: route.path, query: q }, { replace: true })
}

async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

function buildItemUrl(it: any) {
  return `/codifier/${url}?mkb=${it?.mkbCode}`
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
        url: `/codifier/${url}?mkb=${selectedItem.value.mkbCode}`
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

// Авто-открытие по query ?open=<id> или ?mkb=<code>
const routeQuery = useRoute()


// Открытие/закрытие модалки при изменении query на текущей странице
watch(() => [route.query.open, route.query.mkb], ([openVal, mkbVal]) => {
  const id = openVal as string | undefined
  const mkbCode = mkbVal as string | undefined
  
  if (id) {
    const found = items.value.find((i: any) => String(i._id) === String(id))
    if (found) openModal(found)
  } else if (mkbCode) {
    const found = items.value.find((i: any) => i.mkbCode === mkbCode)
    if (found) openModal(found)
  } else if (modalOpen.value) {
    closeModal()
  }
})
</script>
