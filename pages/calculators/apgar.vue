<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала Апгар</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Шкала Апгар для новорожденных – это стандартный медицинский метод, разработанный Вирджинией Апгар в 1952 году. Он используется для быстрой оценки состояния младенца в первые минуты жизни.
      </p>
      
      <!-- Навигация между временными точками -->
      <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left mt-6">
        <button 
          @click="currentMinute = 1"
          class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="currentMinute === 1 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          1-я минута
        </button>
        <button 
          @click="currentMinute = 5"
          class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="currentMinute === 5 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          5-я минута
        </button>
        <button 
          @click="currentMinute = 10"
          class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors"
          :class="currentMinute === 10 ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'"
        >
          10-я минута
        </button>
      </nav>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-0 md:px-4 py-8 space-y-6">


      <div class="grid grid-cols-1 gap-2">
        <!-- Окраска кожного покрова -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Окраска кожного покрова</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in skinColorOptions"
                :key="'skin-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  selectedSkinColor === opt.value ? [skinColorButtonBgClass, skinColorButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedSkinColor = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left text-sm" :class="selectedSkinColor === opt.value ? skinColorTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedSkinColor === opt.value ? skinColorTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- Частота сердечных сокращений -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Частота сердечных сокращений</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in heartRateOptions"
                :key="'hr-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  selectedHeartRate === opt.value ? [heartRateButtonBgClass, heartRateButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedHeartRate = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left text-sm" :class="selectedHeartRate === opt.value ? heartRateTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedHeartRate === opt.value ? heartRateTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- Рефлекторная возбудимость -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Рефлекторная возбудимость</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in reflexOptions"
                :key="'reflex-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  selectedReflex === opt.value ? [reflexButtonBgClass, reflexButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedReflex = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left text-sm" :class="selectedReflex === opt.value ? reflexTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedReflex === opt.value ? reflexTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- Мышечный тонус -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Мышечный тонус</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in muscleToneOptions"
                :key="'muscle-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  selectedMuscleTone === opt.value ? [muscleToneButtonBgClass, muscleToneButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedMuscleTone = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left text-sm" :class="selectedMuscleTone === opt.value ? muscleToneTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedMuscleTone === opt.value ? muscleToneTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- Дыхание -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Дыхание</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in breathingOptions"
                :key="'breath-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  selectedBreathing === opt.value ? [breathingButtonBgClass, breathingButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="selectedBreathing = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left text-sm" :class="selectedBreathing === opt.value ? breathingTextClass : ''">{{ opt.text }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="selectedBreathing === opt.value ? breathingTextClass : ''">{{ opt.value }}</span>
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
        <div v-if="minute1Score !== null || minute5Score !== null" class="grid grid-cols-1 md:grid-cols-2">
          <!-- 1-я минута -->
          <div v-if="minute1Score !== null" :class="getBlockBgClass(minute1Score)" class="px-4 py-3 border-r border-slate-200 dark:border-slate-600">
            <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">1-я минута</div>
            <div :class="getScoreTextClass(minute1Score)" class="text-3xl font-bold mb-2">{{ minute1Score }}</div>
            <div :class="getScoreTextClass(minute1Score)" class="text-sm font-medium">{{ getScoreInterpretation(minute1Score) }}</div>
          </div>
          
          <!-- 5-я минута -->
          <div v-if="minute5Score !== null" :class="getBlockBgClass(minute5Score)" class="px-4 py-3">
            <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">5-я минута</div>
            <div :class="getScoreTextClass(minute5Score)" class="text-3xl font-bold mb-2">{{ minute5Score }}</div>
            <div :class="getScoreTextClass(minute5Score)" class="text-sm font-medium">{{ getScoreInterpretation(minute5Score) }}</div>
          </div>
        </div>
        
        <div v-else class="px-4 py-3">
          <div class="text-sm text-slate-500 dark:text-slate-400 text-center">
            Выберите критерии для оценки состояния новорожденного
          </div>
        </div>
        
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
          <p class="text-slate-700 dark:text-slate-300">
            Интерпретация:
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">8–10</span> — удовлетворительное состояние;
            <span class="font-semibold text-amber-500 dark:text-amber-400">5–7</span> — состояние тяжелое, проводятся дополнительные лечебные мероприятия;
            <span class="font-semibold text-red-600 dark:text-red-400">0–4</span> — тяжелая асфиксия, проводятся реанимационные мероприятия.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала Апгар' })

const currentMinute = ref(1)

// Данные для 1-й минуты
const minute1Data = ref({
  skinColor: null,
  heartRate: null,
  reflex: null,
  muscleTone: null,
  breathing: null
})

// Данные для 5-й минуты
const minute5Data = ref({
  skinColor: null,
  heartRate: null,
  reflex: null,
  muscleTone: null,
  breathing: null
})

// Вычисляемые свойства для текущих значений
const selectedSkinColor = computed({
  get: () => currentMinute.value === 1 ? minute1Data.value.skinColor : minute5Data.value.skinColor,
  set: (value) => {
    if (currentMinute.value === 1) {
      minute1Data.value.skinColor = value
    } else {
      minute5Data.value.skinColor = value
    }
  }
})

const selectedHeartRate = computed({
  get: () => currentMinute.value === 1 ? minute1Data.value.heartRate : minute5Data.value.heartRate,
  set: (value) => {
    if (currentMinute.value === 1) {
      minute1Data.value.heartRate = value
    } else {
      minute5Data.value.heartRate = value
    }
  }
})

const selectedReflex = computed({
  get: () => currentMinute.value === 1 ? minute1Data.value.reflex : minute5Data.value.reflex,
  set: (value) => {
    if (currentMinute.value === 1) {
      minute1Data.value.reflex = value
    } else {
      minute5Data.value.reflex = value
    }
  }
})

const selectedMuscleTone = computed({
  get: () => currentMinute.value === 1 ? minute1Data.value.muscleTone : minute5Data.value.muscleTone,
  set: (value) => {
    if (currentMinute.value === 1) {
      minute1Data.value.muscleTone = value
    } else {
      minute5Data.value.muscleTone = value
    }
  }
})

const selectedBreathing = computed({
  get: () => currentMinute.value === 1 ? minute1Data.value.breathing : minute5Data.value.breathing,
  set: (value) => {
    if (currentMinute.value === 1) {
      minute1Data.value.breathing = value
    } else {
      minute5Data.value.breathing = value
    }
  }
})

// Критерии шкалы Апгар
const skinColorOptions = [
  { value: 0, text: 'Генерализованная бледность или цианоз' },
  { value: 1, text: 'Розовая окраска тела и синюшная конечностей' },
  { value: 2, text: 'Розовая окраска всего тела и конечностей' }
]

const heartRateOptions = [
  { value: 0, text: 'Отсутствует' },
  { value: 1, text: 'Менее 100 уд/мин' },
  { value: 2, text: 'Более 100 уд/мин' }
]

const reflexOptions = [
  { value: 0, text: 'Не реагирует' },
  { value: 1, text: 'Реакция слабо выражена' },
  { value: 2, text: 'Реакция в виде движения, кашля, крика' }
]

const muscleToneOptions = [
  { value: 0, text: 'Отсутствует, конечности свисают' },
  { value: 1, text: 'Снижен, некоторое сгибание' },
  { value: 2, text: 'Выражены активные движения' }
]

const breathingOptions = [
  { value: 0, text: 'Отсутствует' },
  { value: 1, text: 'Нерегулярное, крик слабый' },
  { value: 2, text: 'Нормальное, крик громкий' }
]

const totalScore = computed(() => {
  if (selectedSkinColor.value === null || selectedHeartRate.value === null || selectedReflex.value === null || selectedMuscleTone.value === null || selectedBreathing.value === null) {
    return null
  }
  return selectedSkinColor.value + selectedHeartRate.value + selectedReflex.value + selectedMuscleTone.value + selectedBreathing.value
})

const minute1Score = computed(() => {
  const { skinColor, heartRate, reflex, muscleTone, breathing } = minute1Data.value
  if (skinColor === null || heartRate === null || reflex === null || muscleTone === null || breathing === null) {
    return null
  }
  return skinColor + heartRate + reflex + muscleTone + breathing
})

const minute5Score = computed(() => {
  const { skinColor, heartRate, reflex, muscleTone, breathing } = minute5Data.value
  if (skinColor === null || heartRate === null || reflex === null || muscleTone === null || breathing === null) {
    return null
  }
  return skinColor + heartRate + reflex + muscleTone + breathing
})

// Цветовые классы для результата
const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score === null) return 'text-slate-500 dark:text-slate-400'
  if (score >= 8) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 5) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

// Пилл результата
const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score === null) return 'bg-slate-500 text-white dark:bg-slate-600 dark:text-white'
  if (score >= 8) return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900'
  if (score >= 5) return 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white'
  return 'bg-red-600 text-white dark:bg-red-500 dark:text-white'
})

// Цветовые классы для отдельных компонентов
const skinColorTextClass = computed(() => {
  const v = selectedSkinColor.value
  if (v === null) return 'text-slate-500 dark:text-slate-400'
  if (v === 2) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 1) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const heartRateTextClass = computed(() => {
  const v = selectedHeartRate.value
  if (v === null) return 'text-slate-500 dark:text-slate-400'
  if (v === 2) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 1) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const reflexTextClass = computed(() => {
  const v = selectedReflex.value
  if (v === null) return 'text-slate-500 dark:text-slate-400'
  if (v === 2) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 1) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const muscleToneTextClass = computed(() => {
  const v = selectedMuscleTone.value
  if (v === null) return 'text-slate-500 dark:text-slate-400'
  if (v === 2) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 1) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const breathingTextClass = computed(() => {
  const v = selectedBreathing.value
  if (v === null) return 'text-slate-500 dark:text-slate-400'
  if (v === 2) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 1) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

// Цветовые классы для кнопок
const skinColorButtonBgClass = computed(() => {
  const v = selectedSkinColor.value
  if (v === null) return 'bg-slate-50 dark:bg-slate-700/30'
  if (v === 2) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 1) return 'bg-amber-50 dark:bg-amber-900/30'
  return 'bg-red-50 dark:bg-red-900/30'
})

const skinColorButtonHoverClass = computed(() => {
  const v = selectedSkinColor.value
  if (v === null) return 'hover:!bg-slate-50 dark:hover:!bg-slate-700/30'
  if (v === 2) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 1) return 'hover:!bg-amber-50 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const heartRateButtonBgClass = computed(() => {
  const v = selectedHeartRate.value
  if (v === null) return 'bg-slate-50 dark:bg-slate-700/30'
  if (v === 2) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 1) return 'bg-amber-50 dark:bg-amber-900/30'
  return 'bg-red-50 dark:bg-red-900/30'
})

const heartRateButtonHoverClass = computed(() => {
  const v = selectedHeartRate.value
  if (v === null) return 'hover:!bg-slate-50 dark:hover:!bg-slate-700/30'
  if (v === 2) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 1) return 'hover:!bg-amber-50 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const reflexButtonBgClass = computed(() => {
  const v = selectedReflex.value
  if (v === null) return 'bg-slate-50 dark:bg-slate-700/30'
  if (v === 2) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 1) return 'bg-amber-50 dark:bg-amber-900/30'
  return 'bg-red-50 dark:bg-red-900/30'
})

const reflexButtonHoverClass = computed(() => {
  const v = selectedReflex.value
  if (v === null) return 'hover:!bg-slate-50 dark:hover:!bg-slate-700/30'
  if (v === 2) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 1) return 'hover:!bg-amber-50 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const muscleToneButtonBgClass = computed(() => {
  const v = selectedMuscleTone.value
  if (v === null) return 'bg-slate-50 dark:bg-slate-700/30'
  if (v === 2) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 1) return 'bg-amber-50 dark:bg-amber-900/30'
  return 'bg-red-50 dark:bg-red-900/30'
})

const muscleToneButtonHoverClass = computed(() => {
  const v = selectedMuscleTone.value
  if (v === null) return 'hover:!bg-slate-50 dark:hover:!bg-slate-700/30'
  if (v === 2) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 1) return 'hover:!bg-amber-50 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const breathingButtonBgClass = computed(() => {
  const v = selectedBreathing.value
  if (v === null) return 'bg-slate-50 dark:bg-slate-700/30'
  if (v === 2) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 1) return 'bg-amber-50 dark:bg-amber-900/30'
  return 'bg-red-50 dark:bg-red-900/30'
})

const breathingButtonHoverClass = computed(() => {
  const v = selectedBreathing.value
  if (v === null) return 'hover:!bg-slate-50 dark:hover:!bg-slate-700/30'
  if (v === 2) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 1) return 'hover:!bg-amber-50 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

function getScoreInterpretation(score: number | null) {
  if (score === null) return 'Не выбрано'
  if (score >= 8) return 'Удовлетворительное состояние'
  if (score >= 5) return 'Состояние тяжелое, проводятся дополнительные лечебные мероприятия'
  return 'Тяжелая асфиксия, проводятся реанимационные мероприятия'
}

function getScoreTextClass(score: number | null) {
  if (score === null) return 'text-slate-500 dark:text-slate-400'
  if (score >= 8) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 5) return 'text-amber-500 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

function getScorePillClass(score: number | null) {
  if (score === null) return 'bg-slate-500 text-white dark:bg-slate-600 dark:text-white'
  if (score >= 8) return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900'
  if (score >= 5) return 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white'
  return 'bg-red-600 text-white dark:bg-red-500 dark:text-white'
}

function getBlockBgClass(score: number | null) {
  if (score === null) return 'bg-slate-50 dark:bg-slate-700/20'
  if (score >= 8) return 'bg-emerald-50 dark:bg-emerald-900/20'
  if (score >= 5) return 'bg-amber-50 dark:bg-amber-900/20'
  return 'bg-red-50 dark:bg-red-900/20'
}

function resetAll() {
  minute1Data.value = {
    skinColor: null,
    heartRate: null,
    reflex: null,
    muscleTone: null,
    breathing: null
  }
  minute5Data.value = {
    skinColor: null,
    heartRate: null,
    reflex: null,
    muscleTone: null,
    breathing: null
  }
}
</script>
