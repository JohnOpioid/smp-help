<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала RASS</h1>
        <div class="flex md:items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('rass')"
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
        Шкала RASS (шкала возбуждения-седации Ричмонда, Richmond Agitation–Sedation Scale) используется в реанимации и ИТ для оценки возбуждения или глубины седации.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <!-- Список значений RASS -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
          <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Оценка RASS</div>
        </div>
        <div class="h-full flex flex-col">
          <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <UButton
              v-for="opt in rassOptions"
              :key="'rass-'+opt.value"
              :class="[
                'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                score === opt.value ? [selectedButtonBgClass, selectedButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
              ]"
              :color="'neutral'"
              variant="ghost"
              @click="score = opt.value"
            >
              <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                <span class="text-left" :class="score === opt.value ? selectedTextClass : ''">{{ opt.label }}</span>
                <span class="inline-block min-w-8 text-right font-semibold" :class="score === opt.value ? selectedTextClass : ''">{{ opt.value }}</span>
              </span>
            </UButton>
          </div>
        </div>
      </div>

      <!-- Результат -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
          <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Результат</div>
        </div>
        <div class="p-4 h-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="text-3xl font-bold">
              <span :class="resultTextClass">{{ score }}</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400">
                — <span :class="resultTextClass">{{ currentLabel }}</span>
              </span>
            </div>
          </div>
          <span :class="resultPillClass" class="font-medium inline-flex items-center text-sm px-2 py-1 gap-1.5 rounded-md">RASS: {{ score }}</span>
        </div>
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
          <p class="text-slate-700 dark:text-slate-300">
            Диапазоны: <span class="font-semibold text-red-700 dark:text-red-500">+4…+3</span> — выраженное возбуждение; <span class="font-semibold text-amber-500 dark:text-amber-500">+2…+1</span> — умеренное возбуждение; <span class="font-semibold text-emerald-600 dark:text-emerald-400">0</span> — спокойствие; <span class="font-semibold text-amber-300 dark:text-amber-300">−1…−2</span> — лёгкая–средняя седация; <span class="font-semibold text-red-600 dark:text-red-400">−3…−4</span> — глубокая седация; <span class="font-semibold text-red-700 dark:text-red-500">−5</span> — не пробуждается.
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Источник: <a class="underline hover:no-underline" href="https://medsoftpro.ru/kalkulyatory/rass-scale.html" target="_blank" rel="noopener noreferrer">Шкала RASS</a>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Шкала RASS' })

type Opt = { value: number, label: string }

const rassOptions: Opt[] = [
  { value: 4, label: 'Больной агрессивен, воинственен, представляет непосредственную опасность для персонала' },
  { value: 3, label: 'Тянет/удаляет трубки и катетеры или агрессивен к персоналу' },
  { value: 2, label: 'Частые нецеленаправленные движения и/или десинхронизация с ИВЛ' },
  { value: 1, label: 'Взволнован, движения не энергичные и не агрессивные' },
  { value: 0, label: 'Бодрствует, спокоен, внимателен' },
  { value: -1, label: 'Потеря внимательности, но при вербальном контакте не закрывает глаза >10 с' },
  { value: -2, label: 'При вербальном контакте закрывает глаза <10 с' },
  { value: -3, label: 'Любое движение (но не зрительный контакт) в ответ на голос' },
  { value: -4, label: 'Нет реакции на голос, есть движения на физическую стимуляцию' },
  { value: -5, label: 'Нет реакции на голос и физическую стимуляцию' }
]

const score = ref<number>(0)
const currentLabel = computed(() => rassOptions.find(o => o.value === score.value)?.label || '')

// Цвет текста/бейджа по категориям
const resultTextClass = computed(() => {
  const s = score.value
  if (s >= 3) return 'text-red-700 dark:text-red-500'
  if (s >= 1) return 'text-amber-500 dark:text-amber-500'
  if (s === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (s >= -2) return 'text-amber-300 dark:text-amber-300'
  if (s >= -4) return 'text-red-600 dark:text-red-400'
  return 'text-red-700 dark:text-red-500'
})

const resultPillClass = computed(() => {
  const s = score.value
  if (s >= 3) return 'bg-red-700 text-white dark:bg-red-600'
  if (s >= 1) return 'bg-amber-500 text-white dark:bg-amber-600'
  if (s === 0) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (s >= -2) return 'bg-amber-200 text-amber-900 dark:bg-amber-300 dark:text-amber-900'
  if (s >= -4) return 'bg-red-600 text-white dark:bg-red-500'
  return 'bg-red-700 text-white dark:bg-red-600'
})

// Цвет выбранной строки (фон/hover) и текста
const selectedTextClass = resultTextClass
const selectedButtonBgClass = computed(() => {
  const s = score.value
  if (s >= 3) return 'bg-red-50 dark:bg-red-900/30'
  if (s >= 1) return 'bg-amber-200/40 dark:bg-amber-900/40'
  if (s === 0) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (s >= -2) return 'bg-amber-100 dark:bg-amber-900/30'
  if (s >= -4) return 'bg-red-50 dark:bg-red-900/30'
  return 'bg-red-100 dark:bg-red-900/40'
})
const selectedButtonHoverClass = computed(() => {
  const s = score.value
  if (s >= 3) return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
  if (s >= 1) return 'hover:!bg-amber-200/40 dark:hover:!bg-amber-900/40'
  if (s === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (s >= -2) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (s >= -4) return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
  return 'hover:!bg-red-100 dark:hover:!bg-red-900/40'
})

function resetAll() {
  score.value = 0
}

// Функции для работы с закладками
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()

onMounted(() => {
  updateIsBookmarked('rass')
})
</script>

<style scoped>
</style>


