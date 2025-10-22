<template>
  <div>
    <main class="flex-1">

      <!-- Основной контент или результаты поиска -->
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div v-if="showSearchResults" class="bg-white dark:bg-slate-800 rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <p class="text-sm text-slate-600 dark:text-slate-300">Найдено: {{ filtered.length }}</p>
            <div class="text-xs text-slate-500 dark:text-slate-400">Инструкции</div>
          </div>
          <ul class="divide-y divide-slate-100 dark:divide-slate-700">
            <li v-for="it in filtered" :key="it._id"
                class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
                @click="openInstruction(it)">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="text-slate-900 dark:text-white font-medium truncate">{{ it.title }}</p>
                  <p v-if="it.description" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" v-html="renderPreview(it.description)"></p>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path></svg>
              </div>
            </li>
            <li v-if="!pending && filtered.length === 0" class="p-8 text-center text-sm text-slate-600 dark:text-slate-300">
              <div class="flex flex-col items-center gap-2">
                <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <span>Ничего не найдено</span>
              </div>
            </li>
          </ul>
        </div>
        <div v-else class="bg-white dark:bg-slate-800 rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Список доступных инструкций</p>
          </div>

          <ul class="divide-y divide-slate-100 dark:divide-slate-700">
            <li v-for="item in itemsSorted" :key="item._id"
              class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer" @click="openInstruction(item)">
              <div class="flex items-center justify-between">
                <p class="text-slate-900 dark:text-white font-medium">{{ item.title }}</p>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              <div v-if="item.description"
                class="md-content md-preview text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2"
                v-html="renderPreview(item.description)"></div>
            </li>

            <li v-if="!pending && itemsSorted.length === 0" class="p-6">
              <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных. Добавьте их в админке.</p>
            </li>
            <li v-if="pending" class="p-6">
              <p class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</p>
            </li>
          </ul>
        </div>
      </div>
    </main>

    <!-- Модальное окно с инструкцией -->
    <template v-if="!isMobile">
      <UModal 
        v-model:open="isOpen" 
        :title="selected?.title || ''" 
        description="Инструкция"
        :ui="{ 
          overlay: 'bg-slate-700/50',
          wrapper: 'sm:max-w-lg',
          content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
          body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
          close: 'cursor-pointer'
        }"
      >
        <template #body>
          <div v-if="selected" class="md-content leading-6 text-slate-700 dark:text-slate-300" v-html="descriptionHtml"></div>
        </template>
        
        <template #footer>
          <div class="flex items-center justify-end gap-2 w-full">
            <UButton color="neutral" variant="ghost" type="button" @click="closeInstruction" class="cursor-pointer">Закрыть</UButton>
          </div>
        </template>
      </UModal>
    </template>

    <!-- Bottom Sheet для мобильных -->
    <template v-else>
      <ClientOnly>
        <BottomSheet 
          v-model="isOpen"
          :title="selected?.title"
          @close="closeInstruction"
        >
          <div class="p-4 pb-6">
            <div v-if="selected" class="md-content leading-6 text-slate-700 dark:text-slate-300 text-sm" v-html="descriptionHtml"></div>
          </div>
          
          <!-- Футер с кнопкой закрытия -->
          <template #footer>
            <div class="flex justify-end">
              <UButton color="neutral" variant="ghost" type="button" @click="closeInstruction" class="cursor-pointer">
                Закрыть
              </UButton>
            </div>
          </template>
        </BottomSheet>
      </ClientOnly>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { ref, computed, watchEffect, nextTick, watch, onBeforeUnmount } from 'vue'

const pending = ref(true)
const { data, refresh } = await useFetch('/api/instructions', { method: 'GET' })
const itemsSorted = computed(() => {
  const arr = (data.value?.items || []) as any[]
  // Сортируем по возрастанию: старые сверху, новые внизу
  return arr.slice().sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
})
watchEffect(() => { pending.value = !data.value })

const { isMobile } = useIsMobile()
const isOpen = ref(false)
const selected = ref<any | null>(null)

// Поиск
const searchText = ref('')
const showSearchResults = computed(() => Boolean(searchText.value.trim()))
const filtered = computed(() => {
  const q = searchText.value.trim().toLowerCase()
  if (!q) return []
  return (itemsSorted.value as any[]).filter((it: any) => {
    const text = [it.title, it.description].filter(Boolean).join(' ').toLowerCase()
    return text.includes(q)
  })
})
function clearSearch() { searchText.value = '' }



const openInstruction = (item: any) => {
  selected.value = item
  isOpen.value = true
}


const closeInstruction = () => {
  isOpen.value = false
  selected.value = null
  
}


// Удалено ручное управление overflow: полагаемся на UModal

const formattedDescription = computed(() => {
  const text = selected.value?.description || ''
  return text
    .replace(/\n\s*\n/g, '\n')
    .trim()
})

import { marked } from 'marked'

// Включаем переносы строк как <br> и GFM, чтобы одинарные \n сохранялись визуально
marked.setOptions({ gfm: true, breaks: true })

let sanitizeHtml: (html: string) => string = (h) => h
if (process.client) {
  const mod = await import('dompurify')
  const createDOMPurify = (mod as any).default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}

const descriptionHtml = computed(() => {
  let raw = selected.value?.description || ''
  if (!raw) return ''
  // Нормализуем перевод строк для корректного парсинга
  raw = raw.replace(/\r\n?/g, '\n')
  const html = marked.parse(raw) as string
  return sanitizeHtml(html)
})

function renderPreview(input: string) {
  if (!input) return ''
  const raw = input.replace(/\r\n?/g, '\n')
  const html = marked.parse(raw, { breaks: false }) as string
  const safe = sanitizeHtml(html)
  // Убираем параграфы и <br> в превью, оставляя списки и прочий синтаксис
  const noParas = safe
    .replace(/<\/?p>/gi, '')
    .replace(/<br\s*\/?>(\n)?/gi, ' ')
  return noParas.replace(/\s{2,}/g, ' ').trim()
}
</script>

<style>
.md-content p {
  margin: 0.75rem 0;
}

.md-content ul,
.md-content ol {
  margin: 0.5rem 0 0.75rem;
  padding-left: 1.25rem;
}

.md-content ul {
  list-style: disc;
}

.md-content ol {
  list-style: decimal;
}

.md-content li {
  list-style-position: outside;
}

.md-content li {
  margin: 0.25rem 0;
}

/* Компактная превью-верстка внутри списка на главном экране */
.md-preview p {
  margin: 0;
}

.md-preview ul,
.md-preview ol {
  margin: 0;
  padding-left: 1.1rem;
}

.md-preview li {
  margin: 0;
}
</style>
