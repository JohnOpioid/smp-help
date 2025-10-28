<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала комы Глазго (GCS)</h1>
        <div class="flex items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark"
            class="cursor-pointer h-9 w-9 flex items-center justify-center"
            :title="isBookmarked ? 'В избранном' : 'В закладки'"
          />
          <UButton 
            color="neutral" 
            variant="soft" 
            @click="resetAll"
            class="cursor-pointer h-9 px-3 flex items-center justify-center"
            title="Сбросить"
          >
            Сбросить
          </UButton>
        </div>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Шкала комы Глазго (Glasgow Coma Scale, GCS) используется для оценки степени нарушения сознания у взрослых.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Открывание глаз</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in eyeOptions"
                :key="'e-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  eyeOpening === opt.value ? [eyeButtonBgClass, eyeButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="eyeOpening = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="eyeOpening === opt.value ? eyeTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="eyeOpening === opt.value ? eyeTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Речевая реакция</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in verbalOptions"
                :key="'v-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  verbalResponse === opt.value ? [verbalButtonBgClass, verbalButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="verbalResponse = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="verbalResponse === opt.value ? verbalTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="verbalResponse === opt.value ? verbalTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Двигательная реакция</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in motorOptions"
                :key="'m-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  motorResponse === opt.value ? [motorButtonBgClass, motorButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="motorResponse = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="motorResponse === opt.value ? motorTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="motorResponse === opt.value ? motorTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="flex items-start gap-3">
        <!-- Маскот слева -->
        <div class="flex-shrink-0">
          <Mascot :is-active="true" size="lg" />
        </div>

        <!-- Блок с результатом справа -->
        <div class="w-fit max-w-full bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="p-4 h-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div class="space-y-1">
              <div class="text-3xl font-bold">
                <span :class="resultTextClass">{{ totalScore }}</span>
                <span class="text-base font-medium text-slate-500 dark:text-slate-400">
                  (Г <span :class="eyeTextClass">{{ eyeOpening }}</span>
                  + Р <span :class="verbalTextClass">{{ verbalResponse }}</span>
                  + Д <span :class="motorTextClass">{{ motorResponse }}</span>)
                </span>
              </div>
              <div class="text-sm font-medium" :class="resultTextClass">{{ interpretation }}</div>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
            <div class="text-sm text-slate-700 dark:text-slate-300 mb-1">Интерпретация:</div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span><span class="font-semibold text-emerald-600 dark:text-emerald-400">15</span> — ясное сознание</span>
              <span><span class="font-semibold text-amber-300 dark:text-amber-300">13–14</span> — оглушение</span>
              <span><span class="font-semibold text-amber-500 dark:text-amber-500">9–12</span> — сопор</span>
              <span><span class="font-semibold text-red-600 dark:text-red-400">3–8</span> — кома</span>
            </div>
          </div>
        </div>
      </div>

      
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Шкала Глазго' })
import Mascot from '~/components/Mascot.vue'

const eyeOptions = [
  { value: 4, label: 'Произвольное' },
  { value: 3, label: 'На речевую команду' },
  { value: 2, label: 'На болевое раздражение' },
  { value: 1, label: 'Отсутствует' }
]

const verbalOptions = [
  { value: 5, label: 'Ориентирован и контактен' },
  { value: 4, label: 'Бессвязная речевая спутанность' },
  { value: 3, label: 'Отдельные слова в ответ или спонтанно' },
  { value: 2, label: 'Нечленораздельные звуки при раздражении или спонтанно' },
  { value: 1, label: 'Отсутствует' }
]

const motorOptions = [
  { value: 6, label: 'Выполняет команды' },
  { value: 5, label: 'Целенаправлена на болевой раздражитель' },
  { value: 4, label: 'Отдёргивание конечности на боль' },
  { value: 3, label: 'Патологическое сгибание' },
  { value: 2, label: 'Патологическое разгибание' },
  { value: 1, label: 'Отсутствует' }
]

const eyeOpening = ref<number>(4)
const verbalResponse = ref<number>(5)
const motorResponse = ref<number>(6)

// Логика закладок
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])

const totalScore = computed(() => eyeOpening.value + verbalResponse.value + motorResponse.value)

const interpretation = computed(() => {
  const score = totalScore.value
  if (score === 15) return 'Ясное сознание'
  if (score >= 13 && score <= 14) return 'Оглушение'
  if (score >= 9 && score <= 12) return 'Сопор'
  return 'Кома' // 3–8
})

const badgeColor = computed(() => {
  const score = totalScore.value
  if (score === 15) return 'success'
  if (score >= 13) return 'info'
  if (score >= 9) return 'warning'
  return 'error'
})

const note = computed(() =>
  'Интерпретация: 15 — ясное сознание; 13–14 — оглушение; 9–12 — сопор; 3–8 — кома.'
)

// Цвет текста выбранных пунктов по интерпретации: 
// 15 — зелёный; 13–14 (оглушение) — светло-оранжевый; 9–12 (сопор) — более насыщенный оранжевый; 3–8 — красный
const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score === 15) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 13) return 'text-amber-300 dark:text-amber-200' // оглушение — amber-200
  if (score >= 9) return 'text-amber-500 dark:text-amber-500' // сопор — менее насыщенный в светлой теме
  return 'text-red-600 dark:text-red-400'
})

// Пилл результата: делаем цвета согласованными с выбранными опциями
const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score === 15) return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900'
  if (score >= 13) return 'bg-amber-200 text-amber-900 dark:bg-amber-300 dark:text-amber-900' // светлее
  if (score >= 9) return 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white' // насыщеннее
  return 'bg-red-600 text-white dark:bg-red-500 dark:text-white'
})

// Фон для выбранной кнопки — отдельные для каждой группы
const eyeButtonBgClass = computed(() => {
  const v = eyeOpening.value
  if (v === 4) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 3) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const eyeButtonHoverClass = computed(() => {
  const v = eyeOpening.value
  if (v === 4) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 3) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const verbalButtonBgClass = computed(() => {
  const v = verbalResponse.value
  if (v === 5) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 4) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 3 || v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const verbalButtonHoverClass = computed(() => {
  const v = verbalResponse.value
  if (v === 5) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 4) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 3 || v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const motorButtonBgClass = computed(() => {
  const v = motorResponse.value
  if (v === 6) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 5) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 4 || v === 3 || v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const motorButtonHoverClass = computed(() => {
  const v = motorResponse.value
  if (v === 6) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 5) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 4 || v === 3 || v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

// Цвет текста для каждой группы отдельно, по её баллу
const eyeTextClass = computed(() => {
  const v = eyeOpening.value
  if (v === 4) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 3) return 'text-amber-500 dark:text-amber-300'
  if (v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const verbalTextClass = computed(() => {
  const v = verbalResponse.value
  if (v === 5) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 4) return 'text-amber-300 dark:text-amber-300'
  if (v === 3 || v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const motorTextClass = computed(() => {
  const v = motorResponse.value
  if (v === 6) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 5) return 'text-amber-500 dark:text-amber-300'
  if (v === 4 || v === 3 || v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

function resetAll() {
  eyeOpening.value = 4
  verbalResponse.value = 5
  motorResponse.value = 6
}

// Функции для работы с закладками
async function loadBookmarks() {
  try {
    console.log('🔍 Loading bookmarks from API...')
    const res: any = await $fetch('/api/bookmarks')
    console.log('🔍 Bookmarks API response:', res)
    if (res?.success) {
      userBookmarks.value = res.items || []
      console.log('🔍 Loaded bookmarks:', userBookmarks.value)
    } else {
      console.error('🔍 Failed to load bookmarks:', res?.message)
    }
  } catch (error) {
    console.error('🔍 Error loading bookmarks:', error)
  }
}

function buildCalculatorUrl() {
  return '/calculators/gcs'
}

async function updateIsBookmarked() {
  console.log('🔍 Checking if GCS calculator is bookmarked')
  if (userBookmarks.value.length === 0) {
    console.log('🔍 Loading bookmarks...')
    await loadBookmarks()
  }
  const targetUrl = buildCalculatorUrl()
  console.log('🔍 Target URL:', targetUrl)
  console.log('🔍 User bookmarks:', userBookmarks.value)
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
  console.log('🔍 Is bookmarked:', isBookmarked.value)
}

async function addBookmark() {
  try {
    console.log('🔍 Adding bookmark for GCS calculator')
    const response = await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'calculator',
        title: 'Шкала комы Глазго (GCS)',
        description: 'Шкала комы Глазго (Glasgow Coma Scale, GCS) используется для оценки степени нарушения сознания у взрослых.',
        category: 'Калькуляторы',
        url: buildCalculatorUrl()
      }
    })
    console.log('🔍 Bookmark response:', response)
    
    if (response.success) {
      isBookmarked.value = true
      // Обновляем локальный список закладок
      await loadBookmarks()
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Добавлено в закладки', color: 'primary' })
      
      // Уведомляем другие компоненты об обновлении закладок
      window.dispatchEvent(new CustomEvent('bookmarks-updated'))
    } else {
      console.error('🔍 Failed to add bookmark:', response.message)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: response.message || 'Не удалось добавить в закладки', color: 'error' })
    }
  } catch (e) {
    console.error('🔍 Error adding bookmark:', e)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось добавить в закладки', color: 'error' })
  }
}

async function removeBookmark() {
  try {
    const targetUrl = buildCalculatorUrl()
    if (userBookmarks.value.length === 0) await loadBookmarks()
    const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
    if (!bm?._id) return
    await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
    isBookmarked.value = false
    userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
    
    // Уведомляем другие компоненты об обновлении закладок
    window.dispatchEvent(new CustomEvent('bookmarks-updated'))
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

// Загружаем закладки при монтировании компонента
onMounted(() => {
  updateIsBookmarked()
})
</script>

<style scoped>
</style>


