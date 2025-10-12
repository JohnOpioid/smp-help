<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала LAMS</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Шкала LAMS (Los Angeles Motor Scale - лосанджелесская шкала моторного дефицита) используется для догоспитальной диагностики инсульта. Шкала LAMS достаточно проста для клинического использования, поскольку включает всего три клинических критерия - оценка асимметрии лица, наличие двигательных нарушений и оценка мышечной силы.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-0 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Оценка лицевой мускулатуры -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Оценка лицевой мускулатуры</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in faceOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                faceScore === option.value ? [faceSelectedTextClass, faceSelectedBgClass, faceSelectedHoverClass] : ''
              ]"
              @click="faceScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Оценка двигательных нарушений -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Оценка двигательных нарушений</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in motorOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                motorScore === option.value ? [motorSelectedTextClass, motorSelectedBgClass, motorSelectedHoverClass] : ''
              ]"
              @click="motorScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Оценка мышечной силы -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Оценка мышечной силы</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in strengthOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                strengthScore === option.value ? [strengthSelectedTextClass, strengthSelectedBgClass, strengthSelectedHoverClass] : ''
              ]"
              @click="strengthScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Результат -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Результат</div>
          </div>
          <div class="px-4 py-3 space-y-2">
            <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div class="text-3xl font-bold">
                <span :class="resultTextClass">{{ totalScore }}</span>
                <span class="text-base font-medium text-slate-500 dark:text-slate-400"> — <span :class="resultTextClass">{{ resultLabel }}</span></span>
              </div>
              <span :class="resultPillClass" class="font-medium inline-flex items-center text-sm px-2 py-1 gap-1.5 rounded-md">{{ resultLabel }}</span>
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Сумма баллов:</span> Лицо <span :class="faceScoreTextClass">{{ faceScore }}</span> + Движения <span :class="motorScoreTextClass">{{ motorScore }}</span> + Сила <span :class="strengthScoreTextClass">{{ strengthScore }}</span>
            </div>
          </div>
          <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
            <div class="space-y-2">
              <div v-for="(item, i) in interpretationItems" :key="i" class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала LAMS' })

const faceScore = ref<number>(0)
const motorScore = ref<number>(0)
const strengthScore = ref<number>(0)

const faceOptions = [
  { value: 0, text: 'Нет асимметрии мимической мускулатуры (болевая гримаса на болевой стимул симметрична)' },
  { value: 1, text: 'Отсутствие движений мимической мускулатуры в нижних отделах (или в верхних и нижних отделах) лица с одной стороны (несимметричная гримаса на болевой стимул)' }
]

const motorOptions = [
  { value: 0, text: 'Руки удерживает без опускания' },
  { value: 1, text: 'Одна рука медленно опускается, но производит сопротивление силе тяжести' },
  { value: 2, text: 'Одна рука быстро падает без сопротивления силе тяжести' }
]

const strengthOptions = [
  { value: 0, text: 'Сжимает симметрично, сила не снижена' },
  { value: 1, text: 'С одной стороны сжимает слабее' },
  { value: 2, text: 'С одной стороны не сжимает, движения в кисти отсутствуют' }
]

const totalScore = computed(() => faceScore.value + motorScore.value + strengthScore.value)

const resultLabel = computed(() => {
  const score = totalScore.value
  if (score >= 0 && score <= 3) return 'Низкая вероятность окклюзии'
  return 'Высокая вероятность окклюзии'
})

const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score >= 0 && score <= 3) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
})

const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score >= 0 && score <= 3) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const interpretationItems = computed(() => {
  const score = totalScore.value
  if (score >= 0 && score <= 3) {
    return [
      'Вероятность окклюзии крупных сосудов низкая',
      'Инсульт малой или средней степени тяжести',
      'Требуется медицинская эвакуация в стационар для лечения пациентов с ОНМК'
    ]
  }
  return [
    'Высокая вероятность окклюзии крупных сосудов',
    'Инсульт является тяжелым',
    'Требуется медицинская эвакуация в специализированный стационар для лечения пациентов с ОНМК с эндоваскулярными возможностями'
  ]
})

// Цвета для отдельных критериев
const faceScoreTextClass = computed(() => {
  if (faceScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-amber-500 dark:text-amber-500'
})

const motorScoreTextClass = computed(() => {
  if (motorScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (motorScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const strengthScoreTextClass = computed(() => {
  if (strengthScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (strengthScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

// Цвета для выбранных элементов
const faceSelectedTextClass = computed(() => {
  if (faceScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-amber-500 dark:text-amber-500'
})

const faceSelectedBgClass = computed(() => {
  if (faceScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-amber-200/70 dark:bg-amber-900/50'
})

const faceSelectedHoverClass = computed(() => {
  if (faceScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
})

const motorSelectedTextClass = computed(() => {
  if (motorScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (motorScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const motorSelectedBgClass = computed(() => {
  if (motorScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (motorScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const motorSelectedHoverClass = computed(() => {
  if (motorScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (motorScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const strengthSelectedTextClass = computed(() => {
  if (strengthScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (strengthScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const strengthSelectedBgClass = computed(() => {
  if (strengthScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (strengthScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const strengthSelectedHoverClass = computed(() => {
  if (strengthScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (strengthScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

function resetAll() {
  faceScore.value = 0
  motorScore.value = 0
  strengthScore.value = 0
}
</script>
