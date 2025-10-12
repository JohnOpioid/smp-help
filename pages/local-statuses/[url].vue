<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <SearchBar />

    <div v-if="error" class="text-center py-8">
      <p class="text-red-600 dark:text-red-400">Ошибка загрузки данных</p>
    </div>

    <div v-else class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Локальные статусы категории "{{ category?.name }}"</p>
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
            <div class="flex-1">
              <p class="text-slate-900 dark:text-white font-medium">{{ item.name }}</p>
              <div class="flex items-center gap-2 mt-1">
                <span class="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">{{ item.code }}</span>
                <span class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono text-blue-700 dark:text-blue-300">{{ item.stationCode }}</span>
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
        <li v-if="!initialLoading && items.length === 0" class="p-6 border-b-0">
          <p class="text-sm text-slate-600 dark:text-slate-300">Статусы не найдены</p>
        </li>
        <div ref="sentinel" class="h-1 md:col-span-2"></div>
      </ul>
    </div>

    <template v-if="!isMobile">
      <UModal 
        v-model:open="modalOpen" 
        :title="selectedItem?.name || ''" 
        description="Информация о статусе" 
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
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код статуса</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ formatStatusCode(selectedItem.code) }}</p>
              </div>
              <div v-if="selectedItem.stationCode && selectedItem.stationCode !== '-'">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}</p>
              </div>
            </div>
            <div v-if="selectedItem.complaints">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Жалобы</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none" v-html="renderMarkdown(selectedItem.complaints)"></div>
            </div>
            <div v-if="selectedItem.anamnesis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Анамнез</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none" v-html="renderMarkdown(selectedItem.anamnesis)"></div>
            </div>
            <div v-if="selectedItem.localis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status localis</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none" v-html="renderMarkdown(selectedItem.localis)"></div>
            </div>
            <div v-if="selectedItem.note">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
              <p class="text-slate-600 dark:text-slate-300 whitespace-pre-line">{{ selectedItem.note }}</p>
            </div>
          </div>
        </template>
        <template #footer>
          <div class="flex items-center justify-between gap-2 w-full">
            <div class="flex items-center gap-2">
              <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-clipboard" class="cursor-pointer" @click="copyDescription">Копировать</UButton>
              <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-share" class="cursor-pointer" aria-label="Поделиться" @click="shareItem" />
            </div>
            <UButton color="neutral" variant="ghost" type="button" @click="closeModal" class="cursor-pointer">Закрыть</UButton>
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
          <div v-if="selectedItem" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код статуса</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ formatStatusCode(selectedItem.code) }}</p>
              </div>
              <div v-if="selectedItem.stationCode && selectedItem.stationCode !== '-'">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
                <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedItem.stationCode }}</p>
              </div>
            </div>
            <div v-if="selectedItem.complaints">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Жалобы</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none" v-html="renderMarkdown(selectedItem.complaints)"></div>
            </div>
            <div v-if="selectedItem.anamnesis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Анамнез</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none" v-html="renderMarkdown(selectedItem.anamnesis)"></div>
            </div>
            <div v-if="selectedItem.localis">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Status localis</label>
              <div class="text-slate-900 dark:text-white prose prose-sm max-w-none" v-html="renderMarkdown(selectedItem.localis)"></div>
            </div>
            <div v-if="selectedItem.note">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
              <p class="text-slate-600 dark:text-slate-300 whitespace-pre-line">{{ selectedItem.note }}</p>
            </div>
          </div>
          
          <!-- Футер с кнопками -->
          <template #footer>
            <div class="flex items-center justify-between gap-2 w-full">
              <div class="flex items-center gap-2">
                <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-clipboard" class="cursor-pointer" @click="copyDescription">Копировать</UButton>
                <UButton size="sm" variant="outline" color="neutral" icon="i-heroicons-share" class="cursor-pointer" aria-label="Поделиться" @click="shareItem" />
              </div>
              <UButton color="neutral" variant="ghost" type="button" @click="closeModalMobile" class="cursor-pointer">
                Закрыть
              </UButton>
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
import { ref, computed, nextTick } from 'vue'

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
}

// Авто-открытие по query ?open=<id>
const routeQuery = useRoute()
function closeModal() {
  modalOpen.value = false
  const q: Record<string, any> = { ...route.query }
  if ('open' in q) delete q.open
  navigateTo({ path: route.path, query: q }, { replace: true })
}

function closeModalMobile() {
  closeModal()
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
  const openId = routeQuery.query.open as string | undefined
  if (openId) {
    const found = items.value.find((i: any) => String(i._id) === String(openId))
    if (found) openModal(found)
  }
})

// Не трогаем общий скролл страницы — полагаемся на UModal/BottomSheet

// Реакция на изменение query на текущей странице (открыть/закрыть модалку)
watch(() => route.query.open, (val) => {
  const id = val as string | undefined
  if (id) {
    const found = items.value.find((i: any) => String(i._id) === String(id))
    if (found) openModal(found)
  } else if (modalOpen.value) {
    closeModal()
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
    } catch {}
  } catch (e) {
    console.error('copy failed', e)
    try {
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Не удалось скопировать', color: 'error' })
    } catch {}
  }
}

function formatStatusCode(code?: string): string {
  const c = (code || '').toString()
  if (!c) return ''
  const spaced = c.replace(/-/g, ' ')
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

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



