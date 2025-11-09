<template>

  <main class="flex-1">
    <!-- Контентная область отдельно от поиска -->
    <div class="px-2 md:px-2 md:px-4 max-w-5xl mx-auto py-8">
      <div v-if="error" class="text-center py-8">
        <p class="text-red-600 dark:text-red-400">Ошибка загрузки данных</p>
      </div>

      <div v-else class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <p class="text-sm text-slate-600 dark:text-slate-300">Локальные статусы категории "{{ category?.name }}"</p>
        </div>

        <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
          <li v-for="(item, index) in filteredItems" :key="item._id"
            class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
            :class="{
              'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < filteredItems.length - 1) || (index === filteredItems.length - 1 && filteredItems.length % 2 === 1),
              'md:border-b-0': index >= filteredItems.length - 2 && filteredItems.length % 2 === 0,
              'border-b-0': index === filteredItems.length - 1
            }" @click="openModal(item)">
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-slate-900 dark:text-white font-medium">{{ item.name }}</p>
                <div v-if="item.code || item.stationCode" class="flex items-center gap-2 mt-1">
                  <span v-if="item.code"
                    class="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">{{
                    item.code }}</span>
                  <span v-if="item.stationCode"
                    class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono text-blue-700 dark:text-blue-300">{{
                    item.stationCode }}</span>
                </div>
                <p v-if="item.note" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ item.note }}</p>
              </div>
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </li>

          <li v-if="initialLoading" class="p-6 border-b-0">
            <div class="space-y-3">
              <div class="flex items-center gap-3">
                <USkeleton class="h-6 w-1/3" />
                <USkeleton class="h-5 w-14" />
                <USkeleton class="h-5 w-16" />
              </div>
              <USkeleton class="h-4 w-2/3" />
            </div>
          </li>
          <li v-if="!initialLoading && filteredItems.length === 0 && otherGroups.length === 0" class="p-6 border-b-0">
            <p class="text-sm text-slate-600 dark:text-slate-300">Статусы не найдены</p>
          </li>
          <div v-show="items.length < total" ref="sentinel" class="h-1 md:col-span-2"></div>
        </ul>

        <!-- Блоки результатов из других категорий -->
      <div v-if="searchText.trim() && filteredItems.length === 0 && otherGroups.length > 0" class="pb-4">
          <div v-for="group in otherGroups" :key="group.url">
            <div class="relative my-4">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-200 dark:border-slate-600"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В категории
                  {{ group.name }}</span>
              </div>
            </div>
            <ul class="divide-y divide-slate-100 dark:divide-slate-700">
              <li v-for="it in group.items" :key="it._id"
                class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                @click="openStatus(it)">
                <div class="flex items-center justify-between">
                  <div class="flex-1">
                    <p class="text-slate-900 dark:text-white font-medium">{{ it.name }}</p>
                    <div v-if="it.code || it.stationCode" class="flex items-center gap-2 mt-1">
                      <span v-if="it.code"
                        class="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">{{
                        it.code }}</span>
                      <span v-if="it.stationCode"
                        class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono text-blue-700 dark:text-blue-300">{{
                        it.stationCode }}</span>
                    </div>
                    <p v-if="it.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">{{ it.note }}</p>
                  </div>
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <template v-if="!isMobile">
      <UModal v-model:open="modalOpen" :title="selectedItem?.name || ''" description="Информация о статусе" :ui="{
        overlay: 'bg-slate-700/50',
        wrapper: 'sm:max-w-lg',
        content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
        body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
        close: 'cursor-pointer'
      }" modal overlay transition>
        <template #body>
          <div v-if="selectedItem" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код статуса</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{
                  formatStatusCode(selectedItem.code) }}</p>
              </div>
              <div v-if="selectedItem.stationCode && selectedItem.stationCode !== '-'">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}
                </p>
              </div>
            </div>
            <div v-if="selectedItem.complaints">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Жалобы</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none"
                v-html="renderMarkdown(selectedItem.complaints)"></div>
            </div>
            <div v-if="selectedItem.anamnesis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Анамнез</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none"
                v-html="renderMarkdown(selectedItem.anamnesis)"></div>
            </div>
            <div v-if="selectedItem.localis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status localis</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none"
                v-html="renderMarkdown(selectedItem.localis)"></div>
            </div>
            <div v-if="selectedItem.note">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
              <p class="text-slate-600 dark:text-slate-300 whitespace-pre-line">{{ selectedItem.note }}</p>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex gap-3 w-full">
            <button 
              type="button" 
              :title="isBookmarked ? 'В избранном' : 'В закладки'" 
              :disabled="!selectedItem"
              @click="toggleBookmark()"
              class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer flex-1 justify-center items-center h-[2.5rem]"
            >
              <UIcon :name="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
              {{ isBookmarked ? 'В избранном' : 'В закладки' }}
            </button>
            <div class="flex-1">
              <ShareButton
                :title="selectedItem?.name ? `${selectedItem.name} — Локальные статусы` : 'Локальные статусы'"
                :description="selectedItem?.description || selectedItem?.name || ''"
                :image-id="selectedItem?._id"
                image-type="page"
                section-name="Локальные статусы"
              />
            </div>
            <button 
              type="button" 
              title="Копировать"
              :disabled="!selectedItem"
              @click="copyDescription"
              class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer aspect-square w-[2.5rem] h-[2.5rem] flex items-center justify-center"
            >
              <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
            </button>
          </div>
        </template>
      </UModal>
    </template>

    <template v-else>
      <ClientOnly>
        <BottomSheet 
          v-model="modalOpen" 
          :title="selectedItem?.name" 
          @close="modalOpen = false"
        >
          <div class="p-4 pb-6">
            <div v-if="selectedItem" class="space-y-5">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код статуса</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{
                  formatStatusCode(selectedItem.code) }}</p>
              </div>
              <div v-if="selectedItem.stationCode && selectedItem.stationCode !== '-'">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}
                </p>
              </div>
            </div>
            <div v-if="selectedItem.complaints">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Жалобы</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none"
                v-html="renderMarkdown(selectedItem.complaints)"></div>
            </div>
            <div v-if="selectedItem.anamnesis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Анамнез</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none"
                v-html="renderMarkdown(selectedItem.anamnesis)"></div>
            </div>
            <div v-if="selectedItem.localis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status localis</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none"
                v-html="renderMarkdown(selectedItem.localis)"></div>
            </div>
            <div v-if="selectedItem.note">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
              <p class="text-slate-600 dark:text-slate-300 whitespace-pre-line">{{ selectedItem.note }}</p>
            </div>

            <!-- Кнопки действий -->
            <div class="mt-6">
              <!-- Копировать: отдельной строкой на всю ширину -->
              <div class="mb-3">
                <button 
                  type="button" 
                  title="Копировать"
                  :disabled="!selectedItem"
                  @click="copyDescription"
                  class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer w-full justify-center items-center"
                >
                  <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
                  Копировать
                </button>
              </div>
              <!-- Остальные две кнопки в строку -->
              <div class="flex gap-3 w-full">
                <button 
                  type="button" 
                  :title="isBookmarked ? 'В избранном' : 'В закладки'" 
                  :disabled="!selectedItem"
                  @click="toggleBookmark()"
                  class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer flex-1 justify-center items-center"
                >
                  <UIcon :name="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                  {{ isBookmarked ? 'В избранном' : 'В закладки' }}
                </button>
                <div class="flex-1">
                  <ShareButton
                    :title="selectedItem?.name ? `${selectedItem.name} — Локальные статусы` : 'Локальные статусы'"
                    :description="selectedItem?.description || selectedItem?.name || ''"
                    :image-id="selectedItem?._id"
                    image-type="page"
                    section-name="Локальные статусы"
                  />
                </div>
              </div>
            </div>
            </div>
          </div>
        </BottomSheet>
      </ClientOnly>
    </template>

  </main>

</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Локальные статусы' })

const route = useRoute()
const url = (route.params.url as string) || ''

const PAGE_SIZE = 10
const category = ref<any>(null)
const items = ref<any[]>([])
const total = ref(0)
const skip = ref(0)
const initialLoading = ref(true)
const loadingMore = ref(false)
const sentinel = ref<HTMLElement | null>(null)
const error = ref<string | null>(null)
const searchText = ref('')
const filteredItems = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return items.value
  return (items.value as any[]).filter((it) => {
    const text = [it.name, it.code, it.stationCode, it.description, it.note].filter(Boolean).join(' ').toLowerCase()
    return text.includes(q)
  })
})
function clearSearch() { searchText.value = '' }

// Загрузка всех статусов для поиска в других категориях
const allStatuses = ref<any[]>([])
async function loadAllStatuses() {
  try {
    const pageSize = 500
    let pageNum = 1
    const acc: any[] = []
    for (;;) {
      const res: any = await $fetch('/api/local-statuses/all', { query: { page: pageNum, limit: pageSize } })
      const items = Array.isArray(res?.items) ? res.items : []
      acc.push(...items)
      const total = Number(res?.total || acc.length)
      if (acc.length >= total) break
      if (pageNum > 20) break
      pageNum++
    }
    allStatuses.value = acc
  } catch { allStatuses.value = [] }
}
onMounted(async () => { await loadAllStatuses() })

// Группы из других категорий при пустом результате
const otherGroups = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return []
  const currentUrl = String((category.value?.url || url || '')).toLowerCase()
  const matched = (allStatuses.value as any[]).filter((it) => {
    const text = [it.name, it.code, it.stationCode, it.description, it.note].filter(Boolean).join(' ').toLowerCase()
    const cu = String(it.category?.url || '').toLowerCase()
    return text.includes(q) && cu && cu !== currentUrl
  }).slice(0, 200)
  const groups: Record<string, any[]> = {}
  for (const it of matched) {
    const cu = String(it.category?.url || '')
    ;(groups[cu] ||= []).push(it)
  }
  return Object.keys(groups).map((cu) => ({
    url: cu,
    name: String((groups[cu][0]?.category?.name) || 'Категория'),
    items: groups[cu]
  }))
})
function openStatus(it: any) {
  const cu = String(it.category?.url || '')
  if (cu) navigateTo(`/local-statuses/${cu}?id=${it._id}`)
}

async function loadPage(first = false) {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    const res: any = await $fetch(`/api/local-statuses/${encodeURIComponent(url)}`, {
      params: { limit: PAGE_SIZE, skip: skip.value }
    })
    if (Array.isArray(res.items)) {
      items.value.push(...res.items)
      total.value = Number(res.total || 0)
      skip.value += PAGE_SIZE
      category.value = res.category
      error.value = null
    } else {
      error.value = res.message || 'Ошибка загрузки данных'
    }
  } catch (err: any) {
    error.value = err.message || 'Ошибка загрузки данных'
  } finally {
    loadingMore.value = false
    if (first) initialLoading.value = false
  }
}

const { isMobile } = useIsMobile()
const modalOpen = ref(false)
const selectedItem = ref<any>(null)
// Убираем промежуточную загрузку для стабильной высоты, как у препаратов/кодификатора

// Состояние закладок
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])

async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

function buildStatusUrl(item: any) {
  return `/local-statuses/${url}?id=${item?._id}`
}

async function updateIsBookmarked() {
  if (!selectedItem.value) { isBookmarked.value = false; return }
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const targetUrl = buildStatusUrl(selectedItem.value)
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
}

async function addBookmark() {
  if (!selectedItem.value) return
  try {
    await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'local-status',
        title: selectedItem.value.name,
        description: selectedItem.value.note || selectedItem.value.description || '',
        category: selectedItem.value.category?.name,
        url: buildStatusUrl(selectedItem.value),
        code: selectedItem.value.code,
        stationCode: selectedItem.value.stationCode,
        complaints: selectedItem.value.complaints || '',
        anamnesis: selectedItem.value.anamnesis || '',
        localis: selectedItem.value.localis || ''
      }
    })
    isBookmarked.value = true
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Добавлено в закладки', color: 'primary' })
  } catch {}
}

async function removeBookmark() {
  if (!selectedItem.value) return
  try {
    const targetUrl = buildStatusUrl(selectedItem.value)
    if (userBookmarks.value.length === 0) await loadBookmarks()
    const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
    if (!bm?._id) return
    await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
    isBookmarked.value = false
    userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
  } catch {}
}

async function toggleBookmark() {
  if (isBookmarked.value) await removeBookmark(); else await addBookmark()
}

async function shareItem() {
  try {
    const title = selectedItem.value?.name || 'Локальный статус'
    const text = selectedItem.value?.description || selectedItem.value?.name || ''
    const urlToShare = window.location.href
    if (navigator.share) {
      await navigator.share({ title, text, url: urlToShare })
    } else {
      await navigator.clipboard?.writeText(`${title}\n\n${text}\n\n${urlToShare}`)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Ссылка скопирована', color: 'neutral' })
    }
  } catch (e) {
    console.error('share failed', e)
  }
}


function openModal(item: any) {
  selectedItem.value = item
  modalOpen.value = true
  updateIsBookmarked()
  
  // Обновляем URL с ID элемента через query параметр только если его еще нет
  if (!routeQuery.query.id || routeQuery.query.id !== item._id) {
    // Используем прямое изменение истории браузера для избежания моргания
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('id', item._id)
    window.history.replaceState({}, '', newUrl.toString())
  }
}

// Авто-открытие по query ?id=<id>
const routeQuery = useRoute()
function closeModal() {
  modalOpen.value = false

  // Очищаем query параметры используя прямое изменение истории браузера
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.delete('id')
  newUrl.searchParams.delete('open')
  window.history.replaceState({}, '', newUrl.toString())
}

function closeModalMobile() {
  closeModal()
}
// Загрузка конкретного элемента по ID
async function loadSpecificItem(itemId: string) {
  try {
    
    // Загружаем элемент напрямую из API
    const response = await $fetch<{ success: boolean; items: any[] }>('/api/local-statuses/all')
    
    if (response.success && response.items) {
      const found = response.items.find((item: any) => String(item._id) === String(itemId))
      
      if (found) {
        
        // Проверяем, что элемент принадлежит текущей категории
        if (found.category?.url === url) {
          // Добавляем элемент в список, если его там еще нет
          const exists = items.value.find((item: any) => String(item._id) === String(itemId))
          if (!exists) {
            items.value.push(found)
          }
          
          // Открываем модалку
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
        }
      } else {
      }
    }
  } catch (err) {
    console.error('❌ Ошибка загрузки конкретного локального статуса:', err)
  } finally {
    // nothing
  }
}

onMounted(async () => {
  await loadPage(true)
  const io = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry && entry.isIntersecting) {
      if (items.value.length < total.value) loadPage()
    }
  })
  if (sentinel.value) io.observe(sentinel.value)
  
  const itemId = routeQuery.query.id as string | undefined
  if (itemId) {
    // Сначала ищем в уже загруженных данных
    const checkAndOpenItem = () => {
      if (items.value.length > 0) {
        const found = items.value.find((i: any) => String(i._id) === String(itemId))
        if (found) {
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
          loadSpecificItem(itemId)
        }
      } else {
        console.log('⏳ Данные еще загружаются, повторяем через 100мс')
        setTimeout(checkAndOpenItem, 100)
      }
    }
    checkAndOpenItem()
  }
})

// Не трогаем общий скролл страницы — полагаемся на UModal/BottomSheet

// Реакция на изменение query на текущей странице (открыть/закрыть модалку)
watch(() => routeQuery.query.id, (newId, oldId) => {
  // Пропускаем срабатывание при первоначальной загрузке страницы с параметром id
  if (newId && !oldId) {
    return
  }
  
  // Если есть новый ID и он отличается от старого
  if (newId && newId !== oldId) {
    // Ждем загрузки данных и открываем нужный элемент
    const checkAndOpenItem = () => {
      if (items.value.length > 0) {
        const found = items.value.find((i: any) => String(i._id) === String(newId))
        if (found) {
          // Открываем модалку без изменения URL (URL уже обновлен)
          selectedItem.value = found
          modalOpen.value = true
          updateIsBookmarked()
        } else {
          loadSpecificItem(String(newId))
        }
      } else {
        setTimeout(checkAndOpenItem, 100)
      }
    }
    checkAndOpenItem()
  } else if (!newId && modalOpen.value) {
    // Если id убран, закрываем модалку
    closeModal()
  }
})

// Открытие/закрытие модалки при изменении query параметра ?open=<id>
watch(() => routeQuery.query.open, (openVal) => {
  const openId = openVal as string | undefined
  
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) {
      openModal(found)
    } else {
      loadSpecificItem(openId)
    }
  } else if (modalOpen.value && !routeQuery.query.id) {
    closeModal()
  }
})

// Watcher для modalOpen - очищаем URL при закрытии модалки
watch(modalOpen, (newValue, oldValue) => {
  // Если модалка закрылась (была открыта, стала закрыта)
  if (oldValue === true && newValue === false) {
    // Очищаем query параметры используя прямое изменение истории браузера
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('id')
    window.history.replaceState({}, '', newUrl.toString())
  }
})

async function copyDescription() {
  const text = selectedItem.value?.description || selectedItem.value?.name || ''
  try {
    if (!text) return
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    // Тост успеха
    try {
      // @ts-ignore - Nuxt UI Toast
      const toast = useToast?.()
      toast?.add?.({ title: 'Скопировано', description: 'Текст описания добавлен в буфер обмена', color: 'neutral' })
    } catch { }
  } catch (e) {
    console.error('copy failed', e)
    try {
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Не удалось скопировать', color: 'error' })
    } catch { }
  }
}

function formatStatusCode(code?: string): string {
  const c = (code || '').toString()
  if (!c) return ''
  const spaced = c.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

// Удалён дубликат (см. выше объявление allStatuses, otherGroups, openStatus)

function renderMarkdown(text?: string): string {
  if (!text) return ''
  // Простой markdown рендеринг для основных элементов
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm">$1</code>')
    .replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
    .replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-4 mb-2">$1</h2>')
    .replace(/^# (.*$)/gm, '<h1 class="text-2xl font-semibold mt-4 mb-2">$1</h1>')
    .replace(/^- (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4">$1</li>')
    .replace(/\n\n/g, '</p><p class="mb-2">')
    .replace(/^(?!<[h|l])/gm, '<p class="mb-2">')
    .replace(/<\/li>\n<li/g, '</li><li')
    .replace(/<li class="ml-4">(.*?)<\/li>/g, '<ul class="list-disc ml-6 mb-2"><li>$1</li></ul>')
}
</script>
