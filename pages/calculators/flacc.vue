<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала FLACC</h1>
        <div class="flex items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('flacc')"
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
        Шкала FLACC (Face, Legs, Activity, Cry, Consolability) — поведенческая шкала оценки боли у младенцев и детей до 7 лет. Шкала учитывает выражение лица ребенка, положение или подвижность ног, характер крика и то, насколько ребенок поддается успокоению. Боль оценивается по десятибалльной шкале.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Выражение лица -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">1. Выражение лица</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in faceOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
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

        <!-- Ноги -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">2. Ноги</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in legsOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                legsScore === option.value ? [legsSelectedTextClass, legsSelectedBgClass, legsSelectedHoverClass] : ''
              ]"
              @click="legsScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Активность -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">3. Активность</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in activityOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                activityScore === option.value ? [activitySelectedTextClass, activitySelectedBgClass, activitySelectedHoverClass] : ''
              ]"
              @click="activityScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Плач/крик -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">4. Плач/крик</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in cryOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                cryScore === option.value ? [crySelectedTextClass, crySelectedBgClass, crySelectedHoverClass] : ''
              ]"
              @click="cryScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Реакция на попытки успокоить -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">5. Реакция на попытки успокоить</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in consolabilityOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                consolabilityScore === option.value ? [consolabilitySelectedTextClass, consolabilitySelectedBgClass, consolabilitySelectedHoverClass] : ''
              ]"
              @click="consolabilityScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Сообщение с маскотом слева и результатом справа -->
        <div class="flex items-start gap-3">
          <!-- Маскот слева -->
          <div class="flex-shrink-0">
            <Mascot :is-active="true" size="lg" />
          </div>

          <!-- Блок с результатом справа -->
          <div class="w-fit max-w-full bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
            <div class="px-4 py-3 space-y-2">
              <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div class="text-3xl font-bold">
                  <span :class="resultTextClass">{{ totalScore }}</span>
                  <span class="text-base font-medium text-slate-500 dark:text-slate-400"> — <span :class="resultTextClass">{{ resultLabel }}</span></span>
                </div>
              </div>
              <div class="text-sm text-slate-600 dark:text-slate-400">
                <span class="font-medium">Сумма баллов:</span> Лицо <span :class="faceScoreTextClass">{{ faceScore }}</span> + Ноги <span :class="legsScoreTextClass">{{ legsScore }}</span> + Активность <span :class="activityScoreTextClass">{{ activityScore }}</span> + Плач <span :class="cryScoreTextClass">{{ cryScore }}</span> + Успокоение <span :class="consolabilityScoreTextClass">{{ consolabilityScore }}</span>
              </div>
            </div>
            <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <div class="space-y-1">
                <div v-for="(item, i) in interpretationItems" :key="i" class="flex items-start gap-2">
                  <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-blue-600 dark:text-blue-400" />
                  <span class="text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
                </div>
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
import Mascot from '~/components/Mascot.vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала FLACC' })

const faceScore = ref<number>(0)
const legsScore = ref<number>(0)
const activityScore = ref<number>(0)
const cryScore = ref<number>(0)
const consolabilityScore = ref<number>(0)

const faceOptions = [
  { value: 0, text: 'Неопределенное выражение или улыбка' },
  { value: 1, text: 'Изредка хмурится, морщится или не проявляет интереса' },
  { value: 2, text: 'Сильно морщится, зубы стиснуты, часто или постоянно дрожит подбородок' }
]

const legsOptions = [
  { value: 0, text: 'Нормальное или расслабленное положение' },
  { value: 1, text: 'Неспокойные, напряженные' },
  { value: 2, text: 'Брыкается или вытягивает ноги' }
]

const activityOptions = [
  { value: 0, text: 'Спокоен, положение тела обычное, движения не затруднены' },
  { value: 1, text: 'Отталкивает, корчится, ерзает, напряжен' },
  { value: 2, text: 'Резко дергается или выгнулся дугой, застыл' }
]

const cryOptions = [
  { value: 0, text: 'Не плачет, не кричит, не стонет (в том числе во сне или когда только что разбужен)' },
  { value: 1, text: 'Периодически стонет, хнычет, иногда плачет' },
  { value: 2, text: 'Постоянно плачет, кричит или всхлипывает, часто' }
]

const consolabilityOptions = [
  { value: 0, text: 'В утешении не нуждается, расслабленный, довольный' },
  { value: 1, text: 'Если приобнять, погладить, утешить — хорошо успокаивается, перестает плакать' },
  { value: 2, text: 'Поддается плохо или не поддается вообще. Не успокаивается' }
]

const totalScore = computed(() => faceScore.value + legsScore.value + activityScore.value + cryScore.value + consolabilityScore.value)

const resultLabel = computed(() => {
  const score = totalScore.value
  if (score === 0) return 'Нет боли'
  return `Уровень боли ${score} из 10`
})

const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 1 && score <= 3) return 'text-blue-600 dark:text-blue-400'
  if (score >= 4 && score <= 6) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score === 0) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (score >= 1 && score <= 3) return 'bg-blue-600 text-white dark:bg-blue-500'
  if (score >= 4 && score <= 6) return 'bg-amber-600 text-white dark:bg-amber-500'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const interpretationItems = computed(() => {
  const score = totalScore.value
  if (score === 0) {
    return [
      'Боль отсутствует',
      'Ребенок находится в комфортном состоянии',
      'Корректировка терапии не требуется'
    ]
  }
  if (score >= 1 && score <= 3) {
    return [
      'Незначительная боль',
      'Может потребоваться легкое обезболивание',
      'Мониторинг состояния ребенка'
    ]
  }
  if (score >= 4 && score <= 6) {
    return [
      'Умеренная боль',
      'Требуется обезболивающая терапия',
      'Регулярная оценка состояния'
    ]
  }
  return [
    'Сильная боль',
    'Необходимо срочное обезболивание',
    'Требуется медицинское наблюдение'
  ]
})

// Цвета для отдельных критериев
const faceScoreTextClass = computed(() => {
  if (faceScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (faceScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const legsScoreTextClass = computed(() => {
  if (legsScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (legsScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const activityScoreTextClass = computed(() => {
  if (activityScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (activityScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const cryScoreTextClass = computed(() => {
  if (cryScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (cryScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const consolabilityScoreTextClass = computed(() => {
  if (consolabilityScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (consolabilityScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

// Цвета для выбранных элементов - Face
const faceSelectedTextClass = computed(() => {
  if (faceScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (faceScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const faceSelectedBgClass = computed(() => {
  if (faceScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (faceScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const faceSelectedHoverClass = computed(() => {
  if (faceScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (faceScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

// Цвета для выбранных элементов - Legs
const legsSelectedTextClass = computed(() => {
  if (legsScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (legsScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const legsSelectedBgClass = computed(() => {
  if (legsScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (legsScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const legsSelectedHoverClass = computed(() => {
  if (legsScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (legsScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

// Цвета для выбранных элементов - Activity
const activitySelectedTextClass = computed(() => {
  if (activityScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (activityScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const activitySelectedBgClass = computed(() => {
  if (activityScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (activityScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const activitySelectedHoverClass = computed(() => {
  if (activityScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (activityScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

// Цвета для выбранных элементов - Cry
const crySelectedTextClass = computed(() => {
  if (cryScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (cryScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const crySelectedBgClass = computed(() => {
  if (cryScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (cryScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const crySelectedHoverClass = computed(() => {
  if (cryScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (cryScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

// Цвета для выбранных элементов - Consolability
const consolabilitySelectedTextClass = computed(() => {
  if (consolabilityScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (consolabilityScore.value === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const consolabilitySelectedBgClass = computed(() => {
  if (consolabilityScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (consolabilityScore.value === 1) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const consolabilitySelectedHoverClass = computed(() => {
  if (consolabilityScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (consolabilityScore.value === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

function resetAll() {
  faceScore.value = 0
  legsScore.value = 0
  activityScore.value = 0
  cryScore.value = 0
  consolabilityScore.value = 0
}

// Функции для работы с закладками
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()

onMounted(() => {
  updateIsBookmarked('flacc')
})
</script>

