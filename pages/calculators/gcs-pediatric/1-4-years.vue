<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Детская шкала комы Глазго</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Шкала комы Глазго для детей от 1 года до 4 лет. Используется для оценки степени нарушения сознания у детей раннего возраста.
      </p>
      
      <!-- Навигация между возрастными группами -->
      <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left mt-6">
        <NuxtLink 
          to="/calculators/gcs-pediatric" 
          class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          До года
        </NuxtLink>
        <NuxtLink 
          to="/calculators/gcs-pediatric/1-4-years" 
          class="router-link-active bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
        >
          1-4 года
        </NuxtLink>
      </nav>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">


      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
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
                  selectedEye === opt.value ? [eyeButtonBgClass, eyeButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedEye = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="selectedEye === opt.value ? eyeTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedEye === opt.value ? eyeTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
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
                  selectedVerbal === opt.value ? [verbalButtonBgClass, verbalButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedVerbal = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="selectedVerbal === opt.value ? verbalTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedVerbal === opt.value ? verbalTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
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
                  selectedMotor === opt.value ? [motorButtonBgClass, motorButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedMotor = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="selectedMotor === opt.value ? motorTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedMotor === opt.value ? motorTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
          <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Результат</div>
        </div>
        <div class="p-4 h-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="text-3xl font-bold">
              <span :class="resultTextClass">{{ totalScore }}</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400">
                (Г <span :class="eyeTextClass">{{ selectedEye }}</span>
                + Р <span :class="verbalTextClass">{{ selectedVerbal }}</span>
                + Д <span :class="motorTextClass">{{ selectedMotor }}</span>)
              </span>
            </div>
          </div>
          <span :class="resultPillClass" class="font-medium inline-flex items-center text-sm px-2 py-1 gap-1.5 rounded-md">{{ getScoreInterpretation() }}</span>
        </div>
        
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
          <p class="text-slate-700 dark:text-slate-300">
            Интерпретация:
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">15</span> — ясное сознание;
            <span class="font-semibold text-amber-300 dark:text-amber-300">13–14</span> — умеренное оглушение;
            <span class="font-semibold text-amber-400 dark:text-amber-400">11–12</span> — глубокое оглушение;
            <span class="font-semibold text-amber-500 dark:text-amber-500">9–10</span> — сопор;
            <span class="font-semibold text-orange-500 dark:text-orange-400">7–8</span> — умеренная кома;
            <span class="font-semibold text-red-500 dark:text-red-400">4–6</span> — глубокая кома;
            <span class="font-semibold text-red-600 dark:text-red-400">3</span> — терминальная кома.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Детская шкала комы Глазго' })

const selectedEye = ref(4)
const selectedVerbal = ref(5)
const selectedMotor = ref(6)

// Критерии для детей 1-4 лет
const eyeOptions = [
  { value: 4, text: 'Произвольное открывание глаз' },
  { value: 3, text: 'Как реакция на голос' },
  { value: 2, text: 'Как реакция на боль' },
  { value: 1, text: 'Отсутствует' }
]

const verbalOptions = [
  { value: 5, text: 'Ребёнок улыбается, ориентируется на звук, следит за объектами, интерактивен' },
  { value: 4, text: 'Ребёнка при плаче можно успокоить, интерактивность неполноценная' },
  { value: 3, text: 'При плаче успокаивается, но ненадолго, стонет' },
  { value: 2, text: 'Не успокаивается при плаче, беспокоен' },
  { value: 1, text: 'Плач и интерактивность отсутствуют' }
]

const motorOptions = [
  { value: 6, text: 'Выполнение движений по команде' },
  { value: 5, text: 'Целенаправленное движение в ответ на болевое раздражение (отталкивание)' },
  { value: 4, text: 'Отдёргивание конечности в ответ на болевое раздражение' },
  { value: 3, text: 'Патологическое сгибание в ответ на болевое раздражение (декортикация)' },
  { value: 2, text: 'Патологическое разгибание в ответ на болевое раздражение (децеребрация)' },
  { value: 1, text: 'Отсутствие движений' }
]

const totalScore = computed(() => {
  return selectedEye.value + selectedVerbal.value + selectedMotor.value
})

// Цветовые классы для результата
const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score === 15) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 13) return 'text-amber-300 dark:text-amber-200' // умеренное оглушение
  if (score >= 11) return 'text-amber-400 dark:text-amber-300' // глубокое оглушение
  if (score >= 9) return 'text-amber-500 dark:text-amber-500' // сопор
  if (score >= 7) return 'text-orange-500 dark:text-orange-400' // умеренная кома
  if (score >= 4) return 'text-red-500 dark:text-red-400' // глубокая кома
  return 'text-red-600 dark:text-red-400' // терминальная кома
})

// Пилл результата: делаем цвета согласованными с выбранными опциями
const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score === 15) return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900'
  if (score >= 13) return 'bg-amber-200 text-amber-900 dark:bg-amber-300 dark:text-amber-900' // умеренное оглушение
  if (score >= 11) return 'bg-amber-300 text-amber-900 dark:bg-amber-400 dark:text-amber-900' // глубокое оглушение
  if (score >= 9) return 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white' // сопор
  if (score >= 7) return 'bg-orange-500 text-white dark:bg-orange-600 dark:text-white' // умеренная кома
  if (score >= 4) return 'bg-red-500 text-white dark:bg-red-600 dark:text-white' // глубокая кома
  return 'bg-red-600 text-white dark:bg-red-700 dark:text-white' // терминальная кома
})

// Фон для выбранной кнопки — отдельные для каждой группы
const eyeButtonBgClass = computed(() => {
  const v = selectedEye.value
  if (v === 4) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 3) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const eyeButtonHoverClass = computed(() => {
  const v = selectedEye.value
  if (v === 4) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 3) return 'hover:!bg-amber-100 dark:hover:!bg-emerald-900/30'
  if (v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const verbalButtonBgClass = computed(() => {
  const v = selectedVerbal.value
  if (v === 5) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 4) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 3 || v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const verbalButtonHoverClass = computed(() => {
  const v = selectedVerbal.value
  if (v === 5) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 4) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 3 || v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const motorButtonBgClass = computed(() => {
  const v = selectedMotor.value
  if (v === 6) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 5) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 4 || v === 3 || v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const motorButtonHoverClass = computed(() => {
  const v = selectedMotor.value
  if (v === 6) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 5) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 4 || v === 3 || v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

// Цвет текста для каждой группы отдельно, по её баллу
const eyeTextClass = computed(() => {
  const v = selectedEye.value
  if (v === 4) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 3) return 'text-amber-500 dark:text-amber-300'
  if (v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const verbalTextClass = computed(() => {
  const v = selectedVerbal.value
  if (v === 5) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 4) return 'text-amber-300 dark:text-amber-300'
  if (v === 3 || v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const motorTextClass = computed(() => {
  const v = selectedMotor.value
  if (v === 6) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 5) return 'text-amber-500 dark:text-amber-300'
  if (v === 4 || v === 3 || v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

function getScoreInterpretation() {
  if (totalScore.value === 15) return 'Ясное сознание'
  if (totalScore.value >= 13) return 'Умеренное оглушение'
  if (totalScore.value >= 11) return 'Глубокое оглушение'
  if (totalScore.value >= 9) return 'Сопор'
  if (totalScore.value >= 7) return 'Умеренная кома'
  if (totalScore.value >= 4) return 'Глубокая кома'
  return 'Терминальная кома'
}

function resetAll() {
  selectedEye.value = 4
  selectedVerbal.value = 5
  selectedMotor.value = 6
}
</script>
