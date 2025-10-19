<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала оценки вероятности ТЭЛА</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Женевская шкала (индекс Geneva) позволяет на основании определенных прогностических правил оценить вероятность развития тромбоэмболии легочной артерии. Женевская шкала включена в международные стандарты обследования и лечения ТЭЛА.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Предшествующие ТЭЛА или ТГВ -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Предшествующие ТЭЛА или ТГВ</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in thromboembolismOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                thromboembolismScore === option.value ? [thromboembolismSelectedTextClass, thromboembolismSelectedBgClass, thromboembolismSelectedHoverClass] : ''
              ]"
              @click="thromboembolismScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- ЧСС -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">ЧСС (в минуту)</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in heartRateOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                heartRateScore === option.value ? [heartRateSelectedTextClass, heartRateSelectedBgClass, heartRateSelectedHoverClass] : ''
              ]"
              @click="heartRateScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Хирургические операции или переломы -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Хирургические операции или переломы в предшествующий 1 мес.</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in surgeryOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                surgeryScore === option.value ? [surgerySelectedTextClass, surgerySelectedBgClass, surgerySelectedHoverClass] : ''
              ]"
              @click="surgeryScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Кровохарканье -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Кровохарканье</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in hemoptysisOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                hemoptysisScore === option.value ? [hemoptysisSelectedTextClass, hemoptysisSelectedBgClass, hemoptysisSelectedHoverClass] : ''
              ]"
              @click="hemoptysisScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Активное злокачественное новообразование -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Активное злокачественное новообразование</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in cancerOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                cancerScore === option.value ? [cancerSelectedTextClass, cancerSelectedBgClass, cancerSelectedHoverClass] : ''
              ]"
              @click="cancerScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Односторонняя боль в нижней конечности -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Односторонняя боль в нижней конечности</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in legPainOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                legPainScore === option.value ? [legPainSelectedTextClass, legPainSelectedBgClass, legPainSelectedHoverClass] : ''
              ]"
              @click="legPainScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Боль при пальпации глубоких вен -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Боль при пальпации глубоких вен нижних конечностей и односторонний отек</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in veinPainOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                veinPainScore === option.value ? [veinPainSelectedTextClass, veinPainSelectedBgClass, veinPainSelectedHoverClass] : ''
              ]"
              @click="veinPainScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Возраст старше 65 лет -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Возраст старше 65 лет</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in ageOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-50 dark:hover:bg-slate-700',
                ageScore === option.value ? [ageSelectedTextClass, ageSelectedBgClass, ageSelectedHoverClass] : ''
              ]"
              @click="ageScore = option.value"
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
          </div>
          <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
            <div class="space-y-3">
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Трехуровневая шкала:</div>
                <div class="space-y-1">
                  <div v-for="(item, i) in threeLevelItems" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span class="text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
                  </div>
                </div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Двухуровневая шкала:</div>
                <div class="space-y-1">
                  <div v-for="(item, i) in twoLevelItems" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span class="text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
                  </div>
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

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала оценки вероятности ТЭЛА' })

const thromboembolismScore = ref<number>(0)
const heartRateScore = ref<number>(0)
const surgeryScore = ref<number>(0)
const hemoptysisScore = ref<number>(0)
const cancerScore = ref<number>(0)
const legPainScore = ref<number>(0)
const veinPainScore = ref<number>(0)
const ageScore = ref<number>(0)

const thromboembolismOptions = [
  { value: 0, text: 'Нет' },
  { value: 3, text: 'Да' }
]

const heartRateOptions = [
  { value: 0, text: 'Менее 75 ударов в минуту' },
  { value: 3, text: 'От 75 до 94 ударов в минуту' },
  { value: 5, text: '95 ударов в минуту и более' }
]

const surgeryOptions = [
  { value: 0, text: 'Нет' },
  { value: 2, text: 'Да' }
]

const hemoptysisOptions = [
  { value: 0, text: 'Нет' },
  { value: 2, text: 'Да' }
]

const cancerOptions = [
  { value: 0, text: 'Нет' },
  { value: 2, text: 'Да' }
]

const legPainOptions = [
  { value: 0, text: 'Нет' },
  { value: 3, text: 'Да' }
]

const veinPainOptions = [
  { value: 0, text: 'Нет' },
  { value: 4, text: 'Да' }
]

const ageOptions = [
  { value: 0, text: '65 лет и младше' },
  { value: 1, text: 'Старше 65 лет' }
]

const totalScore = computed(() => {
  return thromboembolismScore.value + heartRateScore.value + surgeryScore.value + 
         hemoptysisScore.value + cancerScore.value + legPainScore.value + 
         veinPainScore.value + ageScore.value
})

const resultLabel = computed(() => {
  const score = totalScore.value
  if (score <= 1) return 'Низкая вероятность'
  if (score <= 6) return 'Средняя вероятность'
  return 'Высокая вероятность'
})

const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score <= 1) return 'text-emerald-600 dark:text-emerald-400'
  if (score <= 6) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score <= 1) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (score <= 6) return 'bg-amber-500 text-white dark:bg-amber-600'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const threeLevelItems = computed(() => {
  const score = totalScore.value
  if (score <= 1) {
    return ['Низкая вероятность ТЭЛА (0-1 балл)']
  }
  if (score <= 6) {
    return ['Средняя вероятность ТЭЛА (2-6 баллов)']
  }
  return ['Высокая вероятность ТЭЛА (более 7 баллов)']
})

const twoLevelItems = computed(() => {
  const score = totalScore.value
  if (score <= 4) {
    return ['ТЭЛА маловероятна (0-4 балла)']
  }
  return ['ТЭЛА вероятна (более 5 баллов)']
})

// Цвета для выбранных элементов
const thromboembolismSelectedTextClass = computed(() => {
  if (thromboembolismScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
})

const thromboembolismSelectedBgClass = computed(() => {
  if (thromboembolismScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const thromboembolismSelectedHoverClass = computed(() => {
  if (thromboembolismScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const heartRateSelectedTextClass = computed(() => {
  if (heartRateScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (heartRateScore.value === 3) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const heartRateSelectedBgClass = computed(() => {
  if (heartRateScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (heartRateScore.value === 3) return 'bg-amber-200/70 dark:bg-amber-900/50'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const heartRateSelectedHoverClass = computed(() => {
  if (heartRateScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (heartRateScore.value === 3) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const surgerySelectedTextClass = computed(() => {
  if (surgeryScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-amber-500 dark:text-amber-500'
})

const surgerySelectedBgClass = computed(() => {
  if (surgeryScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-amber-200/70 dark:bg-amber-900/50'
})

const surgerySelectedHoverClass = computed(() => {
  if (surgeryScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
})

const hemoptysisSelectedTextClass = computed(() => {
  if (hemoptysisScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-amber-500 dark:text-amber-500'
})

const hemoptysisSelectedBgClass = computed(() => {
  if (hemoptysisScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-amber-200/70 dark:bg-amber-900/50'
})

const hemoptysisSelectedHoverClass = computed(() => {
  if (hemoptysisScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
})

const cancerSelectedTextClass = computed(() => {
  if (cancerScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-amber-500 dark:text-amber-500'
})

const cancerSelectedBgClass = computed(() => {
  if (cancerScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-amber-200/70 dark:bg-amber-900/50'
})

const cancerSelectedHoverClass = computed(() => {
  if (cancerScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
})

const legPainSelectedTextClass = computed(() => {
  if (legPainScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
})

const legPainSelectedBgClass = computed(() => {
  if (legPainScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const legPainSelectedHoverClass = computed(() => {
  if (legPainScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const veinPainSelectedTextClass = computed(() => {
  if (veinPainScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
})

const veinPainSelectedBgClass = computed(() => {
  if (veinPainScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-red-100/70 dark:bg-red-900/30'
})

const veinPainSelectedHoverClass = computed(() => {
  if (veinPainScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const ageSelectedTextClass = computed(() => {
  if (ageScore.value === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-amber-500 dark:text-amber-500'
})

const ageSelectedBgClass = computed(() => {
  if (ageScore.value === 0) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  return 'bg-amber-200/70 dark:bg-amber-900/50'
})

const ageSelectedHoverClass = computed(() => {
  if (ageScore.value === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
})

function resetAll() {
  thromboembolismScore.value = 0
  heartRateScore.value = 0
  surgeryScore.value = 0
  hemoptysisScore.value = 0
  cancerScore.value = 0
  legPainScore.value = 0
  veinPainScore.value = 0
  ageScore.value = 0
}
</script>
