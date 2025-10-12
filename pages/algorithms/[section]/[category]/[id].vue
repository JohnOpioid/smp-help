<template>
  <div class="max-w-5xl mx-auto px-4 pt-8">
    
    <NuxtLink to="/algorithms" class="md:hidden inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200">
      <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
      </svg>
      Назад к алгоритмам
    </NuxtLink>
    <template v-if="!algo">
      <USkeleton class="h-7 w-2/3 mb-2" />
      <USkeleton class="h-4 w-1/3 mb-4" />
    </template>
    <template v-else>
      <h1 class="text-2xl font-bold mb-2 text-slate-900 dark:text-white">{{ algo?.title }}</h1>
      <div class="text-sm text-slate-500 mb-4">{{ getSectionDisplayName(algo?.section) }} • {{ algo?.category?.name }}</div>
    </template>
    <!-- Основные коды МКБ -->
    <ClientOnly>
      <div v-if="(algo?.mkbCodes || []).length > 0" class="mb-4">
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">Коды МКБ:</div>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="chip in displayMkbChips" 
            :key="chip" 
            @click="openCodifierPage(chip)"
            class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-2 py-1 rounded font-mono hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors cursor-pointer"
          >
            {{ chip }}
          </button>
        </div>
      </div>
      <div v-else-if="!algo" class="mb-4">
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">Коды МКБ:</div>
        <div class="flex flex-wrap gap-2">
          <USkeleton class="h-6 w-16 rounded" />
          <USkeleton class="h-6 w-14 rounded" />
          <USkeleton class="h-6 w-20 rounded" />
        </div>
      </div>

      <!-- Исключения -->
      <div v-if="(algo?.mkbExclusions || []).length > 0" class="mb-4">
        <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">Исключения:</div>
        <div class="flex flex-wrap gap-2">
          <button 
            v-for="code in (algo?.mkbExclusions || [])" 
            :key="`exclusion-${code}`" 
            @click="openCodifierPage(code)"
            class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded font-mono hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors cursor-pointer"
          >
            {{ code }}
          </button>
        </div>
      </div>
      
      <template #fallback>
        <!-- Fallback для SSR -->
        <div v-if="(algo?.mkbCodes || []).length > 0" class="mb-4">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">Коды МКБ:</div>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="code in displayMkbChips" 
              :key="code" 
              class="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs px-2 py-1 rounded font-mono"
            >
              {{ code }}
            </span>
          </div>
        </div>
        <div v-if="(algo?.mkbExclusions || []).length > 0" class="mb-4">
          <div class="text-sm text-slate-500 dark:text-slate-400 mb-2">Исключения:</div>
          <div class="flex flex-wrap gap-2">
            <span 
              v-for="code in (algo?.mkbExclusions || [])" 
              :key="`exclusion-${code}`" 
              class="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs px-2 py-1 rounded font-mono"
            >
              {{ code }}
            </span>
          </div>
    </div>
      </template>
    </ClientOnly>
  </div>
  <div class="max-w-5xl mx-auto md:px-4 pb-8">
    <div class="prose dark:prose-invert max-w-none w-full" ref="contentRef" v-html="rendered"></div>
  </div>

  <!-- Модалка диагноза для десктопа -->
  <UModal 
    v-if="!isMobileDevice"
    v-model:open="diagModalOpen" 
    :title="selectedDiagnosis?.name || ''" 
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
      <div v-if="selectedDiagnosis" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код МКБ-10</label>
            <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedDiagnosis.mkbCode }}</p>
          </div>
          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
            <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedDiagnosis.stationCode }}</p>
          </div>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Нозологическая форма</label>
          <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedDiagnosis.name }}</p>
        </div>
        <div v-if="selectedDiagnosis.note">
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
          <p class="text-slate-600 dark:text-slate-300">{{ selectedDiagnosis.note }}</p>
        </div>
      </div>
      <div v-else class="text-sm text-slate-500">Не удалось загрузить данные диагноза</div>
    </template>
  </UModal>

  <!-- BottomSheet для мобильных устройств -->
  <BottomSheet 
    v-if="isMobileDevice"
    v-model="diagModalOpen"
    :title="selectedDiagnosis?.name || ''"
    :subtitle="selectedDiagnosis?.category?.name || ''"
    @close="diagModalOpen = false"
  >
    <div v-if="selectedDiagnosis" class="space-y-4 px-4 py-2">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код МКБ-10</label>
          <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedDiagnosis.mkbCode }}</p>
        </div>
        <div>
          <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Код станции</label>
          <p class="text-lg font-mono font-semibold text-slate-900 dark:text-white">{{ selectedDiagnosis.stationCode }}</p>
        </div>
      </div>
      <div>
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Нозологическая форма</label>
        <p class="text-lg font-semibold text-slate-900 dark:text-white">{{ selectedDiagnosis.name }}</p>
      </div>
      <div v-if="selectedDiagnosis.note">
        <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Примечание</label>
        <p class="text-slate-600 dark:text-slate-300">{{ selectedDiagnosis.note }}</p>
      </div>
    </div>
    <div v-else class="text-sm text-slate-500 px-4 py-2">Не удалось загрузить данные диагноза</div>

    <template #footer>
      <div class="flex justify-start">
        <UButton
          :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
          :class="isBookmarked
            ? 'text-amber-600 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-300'"
          variant="ghost"
          color="neutral"
          @click="toggleBookmark"
          :disabled="!selectedDiagnosis"
          size="lg"
          :title="isBookmarked ? 'В избранном' : 'В закладки'"
        />
      </div>
    </template>
  </BottomSheet>

  <!-- Блок локального статуса -->
  <ClientOnly>
    <div class="max-w-5xl mx-auto md:px-4">
      <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <p class="text-sm text-slate-600 dark:text-slate-300">Локальный статус</p>
        </div>
        
        <!-- Загрузка -->
        <div v-if="localStatusLoading" class="p-4">
          <div class="space-y-3">
            <USkeleton class="h-4 w-3/4" />
            <USkeleton class="h-4 w-1/2" />
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-4 w-5/6" />
          </div>
        </div>
        
        <!-- Найденные локальные статусы -->
        <div v-else-if="localStatuses.length > 0" class="space-y-0">
          <div v-for="(status, index) in localStatuses" :key="status._id" 
               class="p-4 border-b border-slate-100 dark:border-slate-700"
               :class="{ 'border-b-0': index === localStatuses.length - 1 }">
            
            <!-- Отображение полей локального статуса -->
            <div class="space-y-3 text-sm">
              <div v-if="status.complaints" class="text-slate-600 dark:text-slate-300">
                <span class="font-medium text-slate-700 dark:text-slate-200">Жалобы:</span>
                <p class="mt-1 leading-relaxed">{{ status.complaints }}</p>
              </div>
              
              <div v-if="status.anamnesis" class="text-slate-600 dark:text-slate-300">
                <span class="font-medium text-slate-700 dark:text-slate-200">Анамнез:</span>
                <p class="mt-1 leading-relaxed">{{ status.anamnesis }}</p>
              </div>
              
              <div v-if="status.localis" class="text-slate-600 dark:text-slate-300">
                <span class="font-medium text-slate-700 dark:text-slate-200">Status Localis:</span>
                <p class="mt-1 leading-relaxed">{{ status.localis }}</p>
              </div>
              
              <div v-if="status.description" class="text-slate-600 dark:text-slate-300">
                <span class="font-medium text-slate-700 dark:text-slate-200">Описание:</span>
                <p class="mt-1 leading-relaxed">{{ status.description }}</p>
              </div>
              
              <div v-if="status.note" class="text-slate-600 dark:text-slate-300">
                <span class="font-medium text-slate-700 dark:text-slate-200">Примечание:</span>
                <p class="mt-1 leading-relaxed">{{ status.note }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Заглушка при отсутствии локальных статусов -->
        <div v-else class="p-8 text-center">
          <div class="flex flex-col items-center space-y-4">
            <!-- Большая иконка -->
            <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
              <UIcon name="i-heroicons-document-text" class="w-8 h-8 text-slate-400 dark:text-slate-500" />
            </div>
            
            <!-- Текст -->
            <p class="text-sm text-slate-600 dark:text-slate-300">Локальные статусы не найдены</p>
            
            <!-- Кнопка -->
            <NuxtLink 
              to="/local-statuses"
              class="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 rounded-md transition-colors duration-200"
            >
              <UIcon name="i-heroicons-document-text" class="w-4 h-4 mr-2" />
              Локальные статусы
            </NuxtLink>
          </div>
        </div>
        
        <!-- Футер с ссылкой на локальный статус -->
        <div v-if="localStatuses.length > 0" class="p-4 border-t border-slate-100 dark:border-slate-700 dark:bg-slate-800">
          <div class="flex items-center justify-between">
            <div class="text-sm text-slate-600 dark:text-slate-300">
              Найдено локальных статусов: {{ localStatuses.length }}
            </div>
            <button 
              @click="openLocalStatusModal"
              class="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors cursor-pointer border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <UIcon name="i-heroicons-eye" class="w-4 h-4 mr-2" />
              {{ localStatuses.length === 1 ? 'Открыть' : 'Перейти к категории' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <template #fallback>
      <!-- Fallback для SSR - показываем только заголовок -->
      <div class="max-w-5xl mx-auto md:px-4 pb-8 mt-8">
        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <p class="text-sm text-slate-600 dark:text-slate-300">Локальный статус</p>
          </div>
          <div class="p-4">
            <div class="space-y-3">
              <USkeleton class="h-4 w-3/4" />
              <USkeleton class="h-4 w-1/2" />
              <USkeleton class="h-4 w-2/3" />
            </div>
          </div>
        </div>
      </div>
    </template>
  </ClientOnly>

  <!-- Модалка препаратов -->
  <SDrugsModal v-model:open="drugsOpen" :query-name="drugsQuery" />

</template>

<style scoped>
/* Обеспечиваем что шапка остается на месте */
thead th {
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: inherit;
}

/* Позиционирование шапки для индикаторов точек */
thead {
  position: relative;
}

/* Обрезка текста в шапке таблицы на мобильной версии */
@media (max-width: 767px) {
  thead th {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}

/* Стили для индикаторов точек в контейнере таблицы */
[data-mobile-dots-container] {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

[data-mobile-dots-container] span {
  transition: background-color 200ms ease-in-out;
}

/* Темная тема для индикаторов */
.dark [data-mobile-dots-container] {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Стили для ссылок старого формата внутри контента алгоритма */
:deep(a.algocclink) {
  color: #2563eb; /* tailwind blue-600 */
  background-color: #e0f2fe; /* tailwind blue-50 */
  padding: .1rem .2rem;
  border-radius: .2rem;
}
:deep(a.algocclink:hover) {
  color: #1d4ed8; /* tailwind blue-700 */
  background-color: #bfdbfe; /* tailwind blue-100 */
}
</style>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

import { marked } from 'marked'
import { nextTick, onMounted, onBeforeUnmount, watch, ref, computed } from 'vue'
const route = useRoute()
const id = route.params.id as string

// Определение мобильного устройства
const isMobileDevice = ref(false)

// Переменные для поиска препаратов
const drugsOpen = ref(false)
const drugsQuery = ref<string>('')

// Переменная для кэширования списка препаратов
const drugsList = ref<string[]>([])

const updateMobileStatus = () => {
  if (process.client) {
    isMobileDevice.value = window.innerWidth < 768
  }
}

onMounted(async () => {
  updateMobileStatus()
  window.addEventListener('resize', updateMobileStatus)
  
  // Загружаем список препаратов для выделения
  await loadDrugsList()
})

onBeforeUnmount(() => {
  if (process.client) {
    window.removeEventListener('resize', updateMobileStatus)
  }
})
type AlgorithmCategoryLite = { name: string; section?: string }
type AlgorithmItem = {
  _id: string
  title: string
  section?: string
  category?: AlgorithmCategoryLite
  content?: string
  mkbCodes?: string[]
  mkbExclusions?: string[]
}
type AlgorithmResponse = { success: true; item: AlgorithmItem } | { success: false; message: string }
const { data } = await useFetch<AlgorithmResponse>(`/api/algorithms/${id}`)
function isSuccess(resp: AlgorithmResponse | null | undefined): resp is { success: true; item: AlgorithmItem } {
  return !!resp && (resp as any).success === true && 'item' in (resp as any)
}
const algo = computed<AlgorithmItem | undefined>(() => isSuccess(data.value) ? data.value!.item : undefined)
// Принудительное обновление для перепарсинга при загрузке препаратов
const forceUpdate = ref(0)

const rendered = computed(() => {
  // Используем forceUpdate для принудительного пересчета
  forceUpdate.value
  
  const raw = (algo.value?.content || '') as string
  try { 
    const html = marked.parse(raw) as string
    return parseDrugsInContent(html)
  } catch { 
    return parseDrugsInContent(raw)
  }
})

// Отображение кодов МКБ:
// - Явные диапазоны (A00–A02) — как есть
// - Базовые категории без подкатегории (A00, E14) — склеиваем в диапазоны по последовательности
// - Подкоды (A00.1, E10.2) — всегда показываем отдельно
const displayMkbChips = computed(() => {
  const src = (algo.value?.mkbCodes || []) as string[]
  const items = (src || []).map(s => String(s).trim().toUpperCase()).filter(Boolean)

  const explicitRanges: string[] = []
  const baseOnly: string[] = []
  const subcodes: string[] = []
  for (const s of items) {
    if (/[\-–]/.test(s)) explicitRanges.push(s)
    else if (/^[A-Z]\d{2}$/.test(s)) baseOnly.push(s)
    else subcodes.push(s)
  }

  // Группируем только baseOnly по букве, склеиваем последовательные номера в диапазоны
  const byLetter: Record<string, number[]> = {}
  for (const base of baseOnly) {
    const letter = base[0]
    const num = parseInt(base.slice(1), 10)
    ;(byLetter[letter] ||= []).push(num)
  }
  const categoryRanges: string[] = []
  for (const letter of Object.keys(byLetter).sort()) {
    const nums = Array.from(new Set(byLetter[letter])).sort((a, b) => a - b)
    let start = nums[0]
    let prev = nums[0]
    for (let i = 1; i <= nums.length; i++) {
      const cur = nums[i]
      const isContiguous = cur === prev + 1
      if (!isContiguous) {
        if (start === prev) categoryRanges.push(`${letter}${String(start).padStart(2, '0')}`)
        else categoryRanges.push(`${letter}${String(start).padStart(2, '0')}-${letter}${String(prev).padStart(2, '0')}`)
        start = cur
      }
      prev = cur
    }
  }

  return [...categoryRanges, ...explicitRanges, ...subcodes]
})

// Если в query указан другой раздел, а текущий алгоритм из иного раздела —
// найдём аналог по категории и названию и перенаправим на корректный id
const mapSectionParamToRu = (s?: string): 'Взрослые' | 'Детские' | 'ОНМП' | 'ОНМП Дети' | undefined => {
  if (!s) return undefined
  const m: Record<string, 'Взрослые'|'Детские'|'ОНМП'|'ОНМП Дети'> = {
    adults: 'Взрослые', Adults: 'Взрослые', 'Взрослые': 'Взрослые',
    pediatrics: 'Детские', Pediatrics: 'Детские', 'Детские': 'Детские',
    onmp: 'ОНМП', ONMP: 'ОНМП', 'ОНМП': 'ОНМП',
    'onmp-children': 'ОНМП Дети', 'ОНМП Дети': 'ОНМП Дети'
  }
  return m[s] || undefined
}

// Функция для получения отображаемого названия раздела
const getSectionDisplayName = (section?: string): string => {
  if (!section) return ''
  
  // Если это уже читаемое название, возвращаем как есть
  if (['Взрослые', 'Детские', 'ОНМП', 'ОНМП Дети'].includes(section)) {
    return section
  }
  
  // Мапим ID или slug на читаемые названия
  const sectionMap: Record<string, string> = {
    '68e7e174e4dff2c63511df9b': 'Взрослые',
    '68e7e174e4dff2c63511df9c': 'Детские', 
    '68e7e174e4dff2c63511df9d': 'ОНМП',
    '68e7e174e4dff2c63511dfa3': 'ОНМП Дети',
    'adults': 'Взрослые',
    'pediatrics': 'Детские',
    'onmp': 'ОНМП',
    'onmp-children': 'ОНМП Дети'
  }
  
  return sectionMap[section] || section
}

function normalizeTitleForMatch(t: string): string {
  return t.replace(/\s*\(дети\)\s*$/i, '').trim()
}

watch(algo, async (val) => {
  const q = route.query?.section as string | undefined
  const desiredSection = mapSectionParamToRu(q)
  if (!val || !desiredSection) return
  if (val.section === desiredSection) return
  const categoryId = (val.category as any)?._id
  if (!categoryId) return
  try {
    const res: any = await $fetch('/api/algorithms', {
      query: { page: 1, limit: 200, category: categoryId, section: desiredSection, sortBy: 'createdAt', sortOrder: 'asc' },
      server: false
    })
    const list: any[] = res?.items || []
    const base = normalizeTitleForMatch(val.title || '')
    // Точное совпадение по базовому названию или начинается так же
    const candidate = list.find(a => normalizeTitleForMatch(a.title || '') === base) 
      || list.find(a => (a.title || '').toLowerCase().startsWith(base.toLowerCase()))
      || list[0]
    if (candidate && candidate._id && candidate._id !== val._id) {
      await navigateTo(`/algorithms/view/${candidate._id}`)
    }
  } catch (e) {
    console.warn('Не удалось переключить раздел просмотра алгоритма:', e)
  }
}, { immediate: true })

// Функция для открытия страницы кодификатора с проверкой кода МКБ
const diagModalOpen = ref(false)
const selectedDiagnosis = ref<any | null>(null)

// Функциональность закладок
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])

const loadBookmarks = async () => {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

const buildMkbUrl = (diagnosis: any) => {
  return `/codifier?open=${diagnosis.mkbCode}`
}

const updateIsBookmarked = async () => {
  if (!selectedDiagnosis.value) { 
    isBookmarked.value = false
    return 
  }
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const targetUrl = buildMkbUrl(selectedDiagnosis.value)
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
}

const toggleBookmark = async () => {
  if (!selectedDiagnosis.value) return
  
  try {
    if (isBookmarked.value) {
      // Удаляем из закладок
      const targetUrl = buildMkbUrl(selectedDiagnosis.value)
      if (userBookmarks.value.length === 0) await loadBookmarks()
      const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
      if (bm?._id) {
        await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
        userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
      }
      isBookmarked.value = false
    } else {
      // Добавляем в закладки
      await $fetch('/api/bookmarks', {
        method: 'POST',
        body: {
          type: 'mkb',
          title: selectedDiagnosis.value.name,
          description: selectedDiagnosis.value.mkbCode,
          category: 'МКБ-10',
          url: buildMkbUrl(selectedDiagnosis.value)
        }
      })
      isBookmarked.value = true
      await loadBookmarks() // Перезагружаем список
    }
  } catch (error) {
    console.error('Ошибка при работе с закладками:', error)
  }
}

// Проверяем статус закладки при выборе диагноза
watch(selectedDiagnosis, async (diagnosis) => {
  if (!diagnosis) {
    isBookmarked.value = false
    return
  }
  
  await updateIsBookmarked()
})

function normalizeMkbCode(raw: string): string {
  if (!raw) return ''
  const s = String(raw).trim()
  // Если есть скобки, пробуем взять содержимое последних скобок
  const inParens = s.match(/\(([^)]+)\)\s*$/)
  if (inParens && inParens[1]) return inParens[1].trim().toUpperCase()
  // Ищем шаблон кода МКБ вида A00 или A00.0
  const mk = s.match(/([A-Za-z][0-9]{2}(?:\.[0-9]+)?)/)
  if (mk && mk[1]) return mk[1].toUpperCase()
  return s.toUpperCase()
}

const openCodifierPage = async (code: string) => {
  try {
    // Диапазоны по-прежнему ведем на категорию кодификатора
    if (code.includes('–') || code.includes('-')) {
      const response: any = await $fetch(`/api/mkb/range/${encodeURIComponent(code)}`)
      if (response.success && response.category?.url) {
        await navigateTo(`/codifier/${response.category.url}`)
      }
      return
    }
    // Иначе — локальная модалка с данными диагноза по коду
    const mkb = normalizeMkbCode(code)
    const res: any = await $fetch(`/api/mkb/code/${encodeURIComponent(mkb)}`)
    if (res?.success && res.diagnosis) {
      selectedDiagnosis.value = res.diagnosis
      diagModalOpen.value = true
    } else {
      // Если конкретный диагноз не найден (например, базовая категория вроде E14),
      // открываем страницу кодификатора с правильной категорией
      try {
        const redir: any = await $fetch(`/api/mkb/redirect/${encodeURIComponent(mkb)}`)
        if (redir?.success && redir.redirectUrl) {
          await navigateTo(redir.redirectUrl)
          return
        }
        // Фолбэк: расширяем префикс как диапазон (E14-) и редиректим по первому найденному коду
        const exp: any = await $fetch('/api/mkb/expand', { query: { range: `${mkb}-` } })
        const first = (exp?.mkbCodes || [])[0]
        if (first) {
          const rd2: any = await $fetch(`/api/mkb/redirect/${encodeURIComponent(first)}`)
          if (rd2?.success && rd2.redirectUrl) {
            await navigateTo(rd2.redirectUrl)
            return
          }
        }
      } catch {}
      console.warn('Диагноз не найден по коду', mkb)
    }
  } catch (error) {
    console.error('Ошибка при открытии диагноза:', error)
  }
}

// Реактивные переменные для локального статуса
const localStatuses = ref<any[]>([])
const localStatusLoading = ref(false)

// Функция для открытия модального окна локального статуса
const openLocalStatusModal = () => {
  if (localStatuses.value.length > 0) {
    const firstStatus = localStatuses.value[0]
    
    // Если найден только один статус, открываем его в модалке
    if (localStatuses.value.length === 1) {
      if (firstStatus.category?.url) {
        navigateTo(`/local-statuses/${firstStatus.category.url}?open=${firstStatus._id}`)
      } else {
        navigateTo('/local-statuses')
      }
    } else {
      // Если найдено больше одного статуса, переходим на страницу категории
      if (firstStatus.category?.url) {
        navigateTo(`/local-statuses/${firstStatus.category.url}`)
      } else {
        navigateTo('/local-statuses')
      }
    }
  }
}

// Функция для расширения диапазонов кодов МКБ
const expandMkbRange = (code: string): string[] => {
  // Проверяем, является ли код диапазоном
  if (!code.includes('–') && !code.includes('-')) {
    return [code]
  }
  
  const separator = code.includes('–') ? '–' : '-'
  const [start, end] = code.split(separator).map(s => s.trim())
  
  if (!start || !end) {
    return [code]
  }
  
  // Извлекаем буквенную часть и числовую часть
  // Поддерживаем как полные коды (G30.0), так и базовые коды (G30)
  const startMatch = start.match(/^([A-Z])(\d+)(?:\.(\d+))?$/)
  
  // Для второй части диапазона может быть только число (например, "31" в "G30–31")
  // или полный код (например, "G31.0")
  let endMatch = end.match(/^([A-Z])(\d+)(?:\.(\d+))?$/)
  
  // Если вторая часть содержит только число, используем букву из первой части
  if (!endMatch && /^\d+$/.test(end)) {
    const [, startLetter] = startMatch!
    endMatch = [end, startLetter, end, undefined] as RegExpMatchArray
  }
  
  if (!startMatch || !endMatch) {
    return [code]
  }
  
  const [, startLetter, startNum, startSub] = startMatch
  const [, endLetter, endNum, endSub] = endMatch
  
  // Проверяем, что буквы совпадают
  if (startLetter !== endLetter) {
    return [code]
  }
  
  const expandedCodes: string[] = []
  const startNumber = parseInt(startNum)
  const endNumber = parseInt(endNum)
  
  for (let num = startNumber; num <= endNumber; num++) {
    const numStr = num.toString().padStart(2, '0')
    
    if (num === startNumber && num === endNumber) {
      // Одинаковый номер - добавляем все подкоды от startSub до endSub
      const startSubNum = startSub ? parseInt(startSub) : 0
      const endSubNum = endSub ? parseInt(endSub) : 9
      
      for (let sub = startSubNum; sub <= endSubNum; sub++) {
        expandedCodes.push(`${startLetter}${numStr}.${sub}`)
      }
    } else if (num === startNumber) {
      // Первый номер - добавляем все подкоды от startSub до 9
      const startSubNum = startSub ? parseInt(startSub) : 0
      
      for (let sub = startSubNum; sub <= 9; sub++) {
        expandedCodes.push(`${startLetter}${numStr}.${sub}`)
      }
    } else if (num === endNumber) {
      // Последний номер - добавляем все подкоды от 0 до endSub
      const endSubNum = endSub ? parseInt(endSub) : 9
      
      for (let sub = 0; sub <= endSubNum; sub++) {
        expandedCodes.push(`${startLetter}${numStr}.${sub}`)
      }
    } else {
      // Средние номера - добавляем все подкоды от 0 до 9
      for (let sub = 0; sub <= 9; sub++) {
        expandedCodes.push(`${startLetter}${numStr}.${sub}`)
      }
    }
  }
  
  return expandedCodes
}

// Функция для поиска локальных статусов по кодам МКБ
const searchLocalStatuses = async () => {
  if (!algo.value?.mkbCodes || algo.value.mkbCodes.length === 0) {
    localStatuses.value = []
    return
  }

  localStatusLoading.value = true
  
  try {
    // Расширяем все диапазоны кодов МКБ
    const expandedCodes: string[] = []
    for (const code of algo.value.mkbCodes) {
      expandedCodes.push(...expandMkbRange(code))
    }
    
    
    const response: any = await $fetch('/api/local-statuses/search-by-mkb', {
      method: 'POST',
      body: {
        mkbCodes: expandedCodes
      }
    })
    
    if (response.success) {
      localStatuses.value = response.localStatuses || []
    } else {
      console.error('Ошибка при поиске локальных статусов:', response.message)
      localStatuses.value = []
    }
  } catch (error) {
    console.error('Ошибка при поиске локальных статусов:', error)
    localStatuses.value = []
  } finally {
    localStatusLoading.value = false
  }
}

// Функция для открытия локального статуса
const openLocalStatus = (status: any) => {
  if (status.category?.url) {
    navigateTo(`/local-statuses/${status.category.url}`)
  } else {
    navigateTo('/local-statuses')
  }
}

// Стилизация таблиц в контенте под стиль Nuxt UI Table
const contentRef = ref<HTMLElement | null>(null)
function styleTables() {
  const root = contentRef.value
  if (!root) return
  const tables = Array.from(root.querySelectorAll('table')) as HTMLTableElement[]
  for (const table of tables) {
    // Обёртка для внешнего бордера и скруглений (идемпотентно)
    const alreadyWrapped = table.closest('[data-styled-table-wrapper]') as HTMLElement | null
    if (!alreadyWrapped) {
      const wrapper = document.createElement('div')
      wrapper.setAttribute('data-styled-table-wrapper', '')
      wrapper.classList.add('my-3', 'bg-white', 'dark:bg-slate-800', 'border', 'border-slate-100', 'dark:border-slate-700', 'rounded-none', 'md:rounded-lg', 'overflow-x-hidden', 'relative', 'sticky-container')
      table.parentElement?.insertBefore(wrapper, table)
      wrapper.appendChild(table)
    }
    // Стили только для содержимого таблицы, без внешнего бордера
    table.classList.remove('border', 'border-slate-100', 'dark:border-slate-700', 'rounded-lg', 'rounded-md', 'overflow-hidden')
    table.classList.add('w-full', 'table-fixed', 'my-0', 'border-0', 'bg-transparent')
    table.style.tableLayout = 'fixed'
    const thead = table.querySelector('thead')
    const tbody = table.querySelector('tbody')
    if (thead) thead.classList.add('bg-slate-100', 'dark:bg-slate-800', 'border-b', 'border-slate-100', 'dark:border-slate-700', 'sticky', 'top-0', 'z-20')
    if (tbody) tbody.classList.add('divide-y', 'divide-slate-100', 'dark:divide-slate-700')
    // Равномерное распределение 3 колонок + перенос текста
    table.querySelectorAll('colgroup col').forEach(col => (col as HTMLElement).style.width = '33.3333%')
    table.querySelectorAll('th').forEach(th => {
      th.classList.remove('text-left', 'align-top', 'h-[85px]')
      th.classList.add('px-4', 'py-3', 'text-sm', 'text-slate-600', 'dark:text-slate-300', 'text-center', 'font-medium', 'whitespace-normal', 'break-words', 'align-middle', 'sticky', 'top-0', 'z-20', 'bg-slate-50/25', 'dark:bg-slate-800')
    })
    table.querySelectorAll('td').forEach(td => td.classList.add('p-4', 'text-sm', 'text-slate-600', 'dark:text-slate-300', 'whitespace-normal', 'break-words', 'align-top', 'bg-white', 'dark:bg-slate-800'))
    table.querySelectorAll('tr').forEach(tr => tr.classList.add('hover:bg-slate-50/60', 'dark:hover:bg-slate-700/40'))
    // Бордеры: у первой колонки справа, у второй слева и справа на md+ экранах
    table.querySelectorAll('thead tr').forEach(tr => {
      const cells = Array.from(tr.children) as HTMLElement[]
      if (cells[0]) cells[0].classList.add('border-r', 'border-slate-100', 'dark:border-slate-700')
      if (cells[1]) {
        cells[1].classList.add('border-l', 'border-slate-100', 'dark:border-slate-700')
        cells[1].classList.add('md:border-r', 'md:border-slate-100', 'md:dark:border-slate-700')
      }
    })
    table.querySelectorAll('tbody tr').forEach(tr => {
      const cells = Array.from(tr.children) as HTMLElement[]
      if (cells[0]) cells[0].classList.add('border-r', 'border-slate-100', 'dark:border-slate-700')
      if (cells[1]) {
        cells[1].classList.add('border-l', 'border-slate-100', 'dark:border-slate-700')
        cells[1].classList.add('md:border-r', 'md:border-slate-100', 'md:dark:border-slate-700')
      }
    })

    // Мобильный режим: показывать 2 колонки, первая + переключаемая (2/3) свайпом
    setupMobileTwoColumn(table)
  }
  // После стилизации таблиц также усилим поведение ссылок внутри контента
  enhanceContentLinks()
}

onMounted(() => nextTick(styleTables))
watch(rendered, async () => { await nextTick(); styleTables() })

// ===== Мобильная логика двух колонок и свайпа =====
function isMobile() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 767px)').matches
}


function applyMobileTwoColumnView(wrapper: HTMLElement, table: HTMLTableElement) {
  const mobileTarget = wrapper.getAttribute('data-mobile-col') === '3' ? 3 : 2
  const rows = table.querySelectorAll('thead tr, tbody tr')
  const colgroup = table.querySelector('colgroup') as HTMLElement | null
  const cols = colgroup ? Array.from(colgroup.querySelectorAll('col')) as HTMLElement[] : []


  // Создаем индикаторы точек в шапке таблицы
  if (isMobile()) {
    const thead = table.querySelector('thead')
    if (thead) {
      let dotsContainer = thead.querySelector('[data-mobile-dots-container]') as HTMLElement | null
      if (!dotsContainer) {
        dotsContainer = document.createElement('div')
        dotsContainer.setAttribute('data-mobile-dots-container', '1')
        dotsContainer.classList.add('md:hidden', 'absolute', 'right-2', 'top-1/2', '-translate-y-1/2', 'flex', 'items-center', 'gap-1', 'z-30', 'pointer-events-none', 'bg-slate-100', 'dark:bg-slate-800', 'p-1', 'rounded-full')
        
        const dot2 = document.createElement('span')
        dot2.setAttribute('data-dot', '2')
        dot2.classList.add('inline-block', 'w-1.5', 'h-1.5', 'rounded-full')
        
        const dot3 = document.createElement('span')
        dot3.setAttribute('data-dot', '3')
        dot3.classList.add('inline-block', 'w-1.5', 'h-1.5', 'rounded-full')
        
        dotsContainer.appendChild(dot2)
        dotsContainer.appendChild(dot3)
        thead.appendChild(dotsContainer)
      }
    
      // Активируем соответствующую точку
      const dot2 = dotsContainer.querySelector('[data-dot="2"]') as HTMLElement | null
      const dot3 = dotsContainer.querySelector('[data-dot="3"]') as HTMLElement | null
      const activeCls = ['bg-slate-600', 'dark:bg-slate-200']
      const inactiveCls = ['bg-slate-300', 'dark:bg-slate-600']
      
      if (dot2 && dot3) {
        if (mobileTarget === 2) {
          dot2.classList.add(...activeCls)
          dot2.classList.remove(...inactiveCls)
          dot3.classList.add(...inactiveCls)
          dot3.classList.remove(...activeCls)
        } else {
          dot3.classList.add(...activeCls)
          dot3.classList.remove(...inactiveCls)
          dot2.classList.add(...inactiveCls)
          dot2.classList.remove(...activeCls)
        }
      }
    }
    // На мобильных: 2 колонки (первая 35% + выбранная 65%), фиксированная раскладка
    table.style.tableLayout = 'fixed'
    cols.forEach((c, idx) => {
      // ширины колонок на мобилках
      if (idx === 0) c.style.width = '35%'
      if (idx === 1) {
        c.style.width = '65%'
        c.style.display = mobileTarget === 2 ? '' : 'none'
      }
      if (idx === 2) {
        c.style.width = '65%'
        c.style.display = mobileTarget === 3 ? '' : 'none'
      }
    })

    rows.forEach((tr, rowIndex) => {
      const cells = Array.from(tr.children) as HTMLElement[]
      const isHead = !!(tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead')
      
      if (cells[0]) {
        cells[0].classList.remove('hidden', 'w-0', 'p-0')
        cells[0].style.width = '35%'
        cells[0].style.maxWidth = '35%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[0].tagName === 'TH') {
          cells[0].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      
      if (cells[1]) {
        const hide = mobileTarget !== 2
        cells[1].classList.toggle('hidden', hide)
        cells[1].classList.toggle('w-0', hide)
        cells[1].classList.toggle('p-0', hide)
        cells[1].style.width = hide ? '' : '65%'
        cells[1].style.maxWidth = hide ? '' : '65%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[1].tagName === 'TH') {
          cells[1].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      
      if (cells[2]) {
        const hide = mobileTarget !== 3
        cells[2].classList.toggle('hidden', hide)
        cells[2].classList.toggle('w-0', hide)
        cells[2].classList.toggle('p-0', hide)
        cells[2].style.width = hide ? '' : '65%'
        cells[2].style.maxWidth = hide ? '' : '65%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[2].tagName === 'TH') {
          cells[2].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
    })
  } else {
    // Десктоп: возвращаем 3 колонки и фиксированную ширину
    table.style.tableLayout = 'fixed'
    if (cols.length === 3) {
      cols.forEach((c, idx) => {
        c.style.display = ''
        // Первая колонка фикс 30%, остальные — авто
        if (idx === 0) c.style.width = '30%'
        else c.style.width = ''
      })
    }
    
    // Убираем индикаторы точек на десктопе
    const thead = table.querySelector('thead')
    if (thead) {
      const dotsContainer = thead.querySelector('[data-mobile-dots-container]') as HTMLElement | null
      if (dotsContainer) dotsContainer.remove()
    }
    rows.forEach((tr) => {
      const cells = Array.from(tr.children) as HTMLElement[]
      const isHead = !!(tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead')
      
      if (cells[0]) { 
        cells[0].classList.remove('hidden', 'w-0', 'p-0'); 
        // Фиксированная ширина первой колонки на десктопе
        cells[0].style.width = '30%'
        cells[0].style.maxWidth = '30%'
        // Убираем стили обрезки текста для десктопа
        if (isHead && cells[0].tagName === 'TH') {
          cells[0].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      if (cells[1]) {
        cells[1].classList.remove('hidden', 'w-0', 'p-0'); 
        cells[1].style.width = ''
        // Убираем стили обрезки текста и индикаторы для десктопа
        if (isHead && cells[1].tagName === 'TH') {
          cells[1].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis', 'relative')
          const dots = cells[1].querySelector('[data-mobile-dots]') as HTMLElement | null
          if (dots) dots.remove()
        }
      }
      if (cells[2]) {
        cells[2].classList.remove('hidden', 'w-0', 'p-0'); 
        cells[2].style.width = ''
        // Убираем стили обрезки текста для десктопа
        if (isHead && cells[2].tagName === 'TH') {
          cells[2].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
    })
  }
}

function setupMobileTwoColumn(table: HTMLTableElement) {
  const wrapper = table.closest('[data-styled-table-wrapper]') as HTMLElement | null
  if (!wrapper) return
  if (wrapper.getAttribute('data-mobile-init') === '1') {
    // Обновим отображение при повторном вызове (напр., при ререндере)
    applyMobileTwoColumnView(wrapper, table)
    return
  }
  wrapper.setAttribute('data-mobile-init', '1')
  // По умолчанию показываем 2-ю колонку на мобильных
  if (!wrapper.getAttribute('data-mobile-col')) wrapper.setAttribute('data-mobile-col', '2')

  // Обработчики свайпов
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTs = 0
  let isDragging = false
  let lastDx = 0
  const minDistance = 60 // пикселей
  wrapper.style.touchAction = 'pan-y'
  wrapper.addEventListener('touchstart', (e: TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    touchStartX = t.clientX
    touchStartY = t.clientY
    touchStartTs = Date.now()
    isDragging = true
    lastDx = 0
  }, { passive: true })
  wrapper.addEventListener('touchmove', (e: TouchEvent) => {
    if (!isMobile() || !isDragging) return
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    // Только горизонтальный доминирующий жест
    if (Math.abs(dx) <= Math.abs(dy) * 1.2) return
    lastDx = dx
  }, { passive: true })

  wrapper.addEventListener('touchend', (e: TouchEvent) => {
    if (!isMobile()) return
    if (!e.changedTouches || e.changedTouches.length === 0) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    const dt = Date.now() - touchStartTs
    // Условия для валидного горизонтального свайпа
    const maxDuration = 600 // мс
    const horizontalDominance = Math.abs(dx) > Math.abs(dy) * 1.5
    const shouldSwitch = Math.abs(dx) >= minDistance && horizontalDominance && dt <= maxDuration
    
    if (shouldSwitch) {
      if (dx < 0) wrapper.setAttribute('data-mobile-col', '3')
      else wrapper.setAttribute('data-mobile-col', '2')
      
      applyMobileTwoColumnView(wrapper, table)
    }
    isDragging = false
  }, { passive: true })

  // На ресайз восстанавливаем/применяем вид
  const onResize = () => applyMobileTwoColumnView(wrapper, table)
  window.addEventListener('resize', onResize)
  // Сохраняем слушатель, чтобы снять при размонтировании
  const existing = (contentRef.value as any)
  ;(existing.__mobileResizeHandlers ||= []).push(onResize)

  // Начальная отрисовка
  applyMobileTwoColumnView(wrapper, table)
}

// ===== Перехват внутренних ссылок вида /algorithms/adults/1.anesthesiology/2.successful-cpr =====
function stripNumberPrefix(s: string): string {
  return s.replace(/^\d+\./, '')
}
function mapSectionSlug(slug: string): 'Взрослые'|'Детские'|'ОНМП'|'ОНМП Дети'|undefined {
  if (slug === 'adults') return 'Взрослые'
  if (slug === 'pediatrics') return 'Детские'
  if (slug === 'onmp') return 'ОНМП'
  if (slug === 'onmp-children') return 'ОНМП Дети'
  return undefined
}
async function navigateOldAlgoLink(href: string, anchorText: string) {
  try {
    const url = new URL(href, window.location.origin)
    const parts = url.pathname.split('/').filter(Boolean)
    // Ожидаемый формат: /algorithms/:section/:categoryFolder[/ :algoFile]
    if (parts[0] !== 'algorithms') return
    const sectionSlug = parts[1]
    const sectionName = mapSectionSlug(sectionSlug)
    if (!sectionName) return
    const categoryUrl = stripNumberPrefix(parts[2] || '')
    if (!categoryUrl) return

    // Если указан файл алгоритма, попробуем найти по тексту ссылки (в скобках) внутри категории
    const hasAlgo = parts.length >= 4
    if (hasAlgo) {
      // Текст может быть в скобках — извлечём
      const m = anchorText.match(/\(([^)]+)\)/)
      const title = (m ? m[1] : anchorText).trim()
      // Сначала получим категорию
      const catRes: any = await $fetch(`/api/algorithms/categories/by-url/${categoryUrl}`)
      const catId = catRes?.item?._id
      if (catId) {
        const listRes: any = await $fetch('/api/algorithms', {
          query: { page: 1, limit: 200, category: catId, section: sectionName, sortBy: 'createdAt', sortOrder: 'asc' }
        })
        const list: any[] = listRes?.items || []
        const found = list.find(a => String(a.title || '').toLowerCase() === title.toLowerCase())
          || list.find(a => String(a.title || '').toLowerCase().includes(title.toLowerCase()))
        if (found && found._id) {
          await navigateTo(`/algorithms/${sectionSlug}/${categoryUrl}/view/${found._id}`)
          return
        }
      }
    }
    // Фолбэк — перейти на список категории
    await navigateTo(`/algorithms/${sectionSlug}/${categoryUrl}`)
  } catch (e) {
    console.warn('Не удалось обработать старую ссылку алгоритма:', href, e)
  }
}
function enhanceContentLinks() {
  const root = contentRef.value
  if (!root) return
  
  // Обработка ссылок на алгоритмы
  const anchors = Array.from(root.querySelectorAll('a[href^="/algorithms/"]')) as HTMLAnchorElement[]
  for (const a of anchors) {
    a.addEventListener('click', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      void navigateOldAlgoLink(a.getAttribute('href') || '', a.textContent || '')
    }, { passive: false })
  }
  
  // Обработка ссылок на препараты
  const drugLinks = Array.from(root.querySelectorAll('a.algocclink[data-drug-name]')) as HTMLAnchorElement[]
  for (const link of drugLinks) {
    link.addEventListener('click', (ev) => {
      ev.preventDefault()
      ev.stopPropagation()
      const drugName = link.getAttribute('data-drug-name')
      if (drugName) {
        drugsQuery.value = drugName
        drugsOpen.value = true
      }
    }, { passive: false })
  }
}

// Функция для загрузки списка препаратов из базы данных
async function loadDrugsList() {
  if (drugsList.value.length > 0) return // Уже загружено
  
  try {
  const response: any = await $fetch('/api/drugs', { 
    query: { page: 1, limit: 1000 } 
  })
    
    if (response?.items && Array.isArray(response.items)) {
      const drugNames: string[] = []
      
      // Собираем все возможные названия препаратов
      for (const drug of response.items) {
        // Основное название
        if (drug.name) drugNames.push(drug.name)
        
        // Латинское название
        if (drug.latinName) drugNames.push(drug.latinName)
        
        // Синонимы
        if (drug.synonyms && Array.isArray(drug.synonyms)) {
          drugNames.push(...drug.synonyms.filter(Boolean))
        }
        
        // Аналоги
        if (drug.analogs && Array.isArray(drug.analogs)) {
          drugNames.push(...drug.analogs.filter(Boolean))
        }
      }
      
      // Удаляем дубликаты и сортируем по длине
      drugsList.value = Array.from(new Set(drugNames))
        .filter(name => name && name.length > 2) // Исключаем слишком короткие названия
        .sort((a, b) => b.length - a.length) // Длинные названия первыми
      
    } else {
      console.warn('❌ Некорректный ответ API препаратов')
    }
  } catch (error) {
    console.warn('❌ Не удалось загрузить список препаратов:', error)
  }
}

// Функция для парсинга препаратов в контенте
function parseDrugsInContent(html: string): string {
  if (!html) return html
  
  // Если список препаратов еще не загружен, возвращаем исходный HTML
  if (!drugsList.value || drugsList.value.length === 0) {
    return html
  }
  
  let result = html
  
  // Заменяем названия препаратов на кликабельные ссылки (без границ слов для кириллицы)
  for (const drug of drugsList.value) {
    const regex = new RegExp(`${drug.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'gi')
    result = result.replace(regex, (match) => {
      return `<a href="#" class="algocclink cursor-pointer" data-drug-name="${drug}">${match}</a>`
    })
  }
  
  return result
}

// Реактивный поиск локальных статусов при изменении алгоритма
watch(() => algo.value?.mkbCodes, () => {
  if (algo.value?.mkbCodes) {
    searchLocalStatuses()
  }
}, { immediate: true })

// Перепарсинг контента при загрузке списка препаратов
watch(drugsList, () => {
  if (drugsList.value.length > 0 && algo.value?.content) {
    // Принудительно обновляем rendered computed
    forceUpdate.value++
    nextTick(() => {
      styleTables()
    })
  }
}, { immediate: true })

onBeforeUnmount(() => {
  const root = contentRef.value as any
  const handlers = root?.__mobileResizeHandlers as Array<() => void> | undefined
  if (handlers) {
    handlers.forEach((h) => window.removeEventListener('resize', h))
    root.__mobileResizeHandlers = []
  }
})
</script>


