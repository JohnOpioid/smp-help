<template>
  <div class="flex-1">
    <!-- Шапка -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала Westley Croup</h1>
        <div class="flex md:items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('westley-croup')"
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
        Оценка тяжести крупа у детей по 5 признакам. Сумма баллов определяет тяжесть: лёгкий (≤2), средний (3–7), тяжёлый (≥8).
      </p>
    </div>

    <!-- Контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <!-- Втяжение уступчивых мест грудной клетки (Retractions) 0-3 -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
              <span class="flex-1">Втяжение уступчивых мест грудной клетки</span>
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ retractions }}</span>
            </div>
          </div>
          <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <UButton v-for="opt in retractionsOptions" :key="'ret-'+opt.value"
              :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer', ...selectedButtonClasses('ret', retractions, opt.value)]"
              color="neutral" variant="ghost" @click="retractions = opt.value">
              <span class="w-full inline-flex items-start gap-3 text-left">
                <span class="inline-block w-6 font-semibold">{{ opt.value }}</span>
                <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ opt.label }}</span>
              </span>
            </UButton>
          </div>
        </div>

        <!-- Стридор 0-2 -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
              <span class="flex-1">Стридор</span>
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ stridor }}</span>
            </div>
          </div>
          <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <UButton v-for="opt in stridorOptions" :key="'str-'+opt.value"
              :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer', ...selectedButtonClasses('str', stridor, opt.value)]"
              color="neutral" variant="ghost" @click="stridor = opt.value">
              <span class="w-full inline-flex items-start gap-3 text-left">
                <span class="inline-block w-6 font-semibold">{{ opt.value }}</span>
                <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ opt.label }}</span>
              </span>
            </UButton>
          </div>
        </div>

        <!-- Воздушный поток/дыхание (Air entry) 0-2 -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
              <span class="flex-1">Воздушный поток (аускультативно)</span>
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ airEntry }}</span>
            </div>
          </div>
          <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <UButton v-for="opt in airEntryOptions" :key="'air-'+opt.value"
              :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer', ...selectedButtonClasses('air', airEntry, opt.value)]"
              color="neutral" variant="ghost" @click="airEntry = opt.value">
              <span class="w-full inline-flex items-start gap-3 text-left">
                <span class="inline-block w-6 font-semibold">{{ opt.value }}</span>
                <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ opt.label }}</span>
              </span>
            </UButton>
          </div>
        </div>

        <!-- Цианоз 0/4/5 -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
              <span class="flex-1">Цианоз</span>
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ cyanosis }}</span>
            </div>
          </div>
          <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <UButton v-for="opt in cyanosisOptions" :key="'cya-'+opt.value"
              :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer', ...selectedButtonClasses('cya', cyanosis, opt.value)]"
              color="neutral" variant="ghost" @click="cyanosis = opt.value">
              <span class="w-full inline-flex items-start gap-3 text-left">
                <span class="inline-block w-6 font-semibold">{{ opt.value }}</span>
                <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ opt.label }}</span>
              </span>
            </UButton>
          </div>
        </div>

        <!-- Сознание 0/5 -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
              <span class="flex-1">Сознание</span>
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ consciousness }}</span>
            </div>
          </div>
          <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
            <UButton v-for="opt in consciousnessOptions" :key="'con-'+opt.value"
              :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer', ...selectedButtonClasses('con', consciousness, opt.value)]"
              color="neutral" variant="ghost" @click="consciousness = opt.value">
              <span class="w-full inline-flex items-start gap-3 text-left">
                <span class="inline-block w-6 font-semibold">{{ opt.value }}</span>
                <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ opt.label }}</span>
              </span>
            </UButton>
          </div>
        </div>
      </div>

      <!-- Результат с маскотом -->
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <Mascot :is-active="true" size="lg" />
        </div>
        <div class="w-fit max-w-full bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="p-4 space-y-3">
            <div class="text-3xl font-bold">
              <span :class="resultTextClass">{{ totalScore }}</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400"> — {{ interpretation }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span><span class="font-semibold text-emerald-600 dark:text-emerald-400">0–2</span> — лёгкий</span>
              <span><span class="font-semibold text-amber-600 dark:text-amber-500">3–7</span> — средний</span>
              <span><span class="font-semibold text-red-600 dark:text-red-500">≥8</span> — тяжёлый</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Mascot from '~/components/Mascot.vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Westley Croup' })

type Opt = { value: number, label: string }

// Опции критериев
const retractionsOptions: Opt[] = [
  { value: 0, label: 'нет' },
  { value: 1, label: 'лёгкие' },
  { value: 2, label: 'умеренные' },
  { value: 3, label: 'выраженные' }
]
const stridorOptions: Opt[] = [
  { value: 0, label: 'нет' },
  { value: 1, label: 'при беспокойстве' },
  { value: 2, label: 'в покое' }
]
const airEntryOptions: Opt[] = [
  { value: 0, label: 'нормальный' },
  { value: 1, label: 'снижен' },
  { value: 2, label: 'значительно снижен' }
]
const cyanosisOptions: Opt[] = [
  { value: 0, label: 'нет' },
  { value: 4, label: 'при беспокойстве' },
  { value: 5, label: 'в покое' }
]
const consciousnessOptions: Opt[] = [
  { value: 0, label: 'ясное' },
  { value: 5, label: 'дезориентация' }
]

// Состояние
const retractions = ref<number>(0)
const stridor = ref<number>(0)
const airEntry = ref<number>(0)
const cyanosis = ref<number>(0)
const consciousness = ref<number>(0)

const totalScore = computed(() => retractions.value + stridor.value + airEntry.value + cyanosis.value + consciousness.value)

const interpretation = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'Лёгкий круп'
  if (s <= 7) return 'Средний круп'
  return 'Тяжёлый круп'
})

const resultTextClass = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'text-emerald-600 dark:text-emerald-400'
  if (s <= 7) return 'text-amber-500 dark:text-amber-600'
  return 'text-red-600 dark:text-red-500'
})

function resetAll() {
  retractions.value = 0
  stridor.value = 0
  airEntry.value = 0
  cyanosis.value = 0
  consciousness.value = 0
}

// Закладки
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()
onMounted(() => { updateIsBookmarked('westley-croup') })

// Цвета выделения как в других калькуляторах
function selectedButtonClasses(group: 'ret'|'str'|'air'|'cya'|'con', selectedVal: number, value: number): string[] | string {
  if (selectedVal !== value) return 'hover:bg-slate-100 dark:hover:bg-slate-700'
  // определить «серьёзность»
  let level: 'green'|'amber'|'red' = 'green'
  switch (group) {
    case 'ret': // 0-3
      level = value === 0 ? 'green' : value === 1 ? 'amber' : value === 2 ? 'amber' : 'red'; break
    case 'str': // 0,1,2
      level = value === 0 ? 'green' : value === 1 ? 'amber' : 'red'; break
    case 'air': // 0,1,2
      level = value === 0 ? 'green' : value === 1 ? 'amber' : 'red'; break
    case 'cya': // 0,4,5
      level = value === 0 ? 'green' : value === 4 ? 'amber' : 'red'; break
    case 'con': // 0,5
      level = value === 0 ? 'green' : 'red'; break
  }
  if (level === 'green') return ['text-emerald-600','dark:text-emerald-400','bg-emerald-100/60','dark:bg-emerald-900/30','hover:!bg-emerald-50','dark:hover:!bg-emerald-900/30']
  if (level === 'amber') return ['text-amber-500','dark:text-amber-600','bg-amber-100/70','dark:bg-amber-900/40','hover:!bg-amber-200','dark:hover:!bg-amber-900/50']
  return ['text-red-600','dark:text-red-500','bg-red-100/70','dark:bg-red-900/40','hover:!bg-red-100','dark:hover:!bg-red-900/40']
}
</script>

<style scoped>
</style>


