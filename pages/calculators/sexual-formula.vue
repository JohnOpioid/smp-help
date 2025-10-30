<template>
  <div class="flex-1">
    <!-- Шапка -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Половая формула детей и подростков</h1>
        <div class="flex md:items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('sexual-formula')"
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
        Расчёт «половой формулы» по стадиям Танера. Для мальчиков: P (лобковые волосы), Ax (подмышечные волосы), V (развитие гениталий). Для девочек: Ma (молочные железы), P (лобковые волосы), Ax (подмышечные волосы), Me (менархе: 0/1).
      </p>
    </div>

    <!-- Контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <!-- Пол -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Пол</div>
          </div>
          <div class="p-3 flex flex-wrap gap-2">
            <UButton size="sm" :variant="sex==='male' ? 'solid' : 'soft'" :color="sex==='male' ? 'primary' : 'neutral'" @click="sex='male'">Мальчик</UButton>
            <UButton size="sm" :variant="sex==='female' ? 'solid' : 'soft'" :color="sex==='female' ? 'primary' : 'neutral'" @click="sex='female'">Девочка</UButton>
          </div>
        </div>

        <!-- Возраст (не обязателен, для справки) -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Возраст (лет)</div>
          </div>
          <div class="p-3">
            <UInput v-model.number="age" type="number" min="0" step="0.1" placeholder="Например, 13.5" class="w-full" />
          </div>
        </div>

        <!-- Блоки для девочек -->
        <template v-if="sex==='female'">
          <div v-for="cfg in femaleCfg" :key="cfg.key" class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
              <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
                <span class="flex-1">{{ cfg.title }}</span>
                <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ displayValue(cfg.key) }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                <UButton v-for="opt in cfg.options" :key="cfg.key+'-'+opt"
                  :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                    (getVal(cfg.key)===opt) ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700']"
                  color="neutral" variant="ghost" @click="setVal(cfg.key, opt)">
                  <span class="w-full inline-flex items-start gap-3 text-left">
                    <span class="inline-block w-6 font-semibold">{{ opt }}</span>
                    <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ getLegendText(cfg.key as any, opt) }}</span>
                  </span>
                </UButton>
              </div>
            </div>
            
          </div>
        </template>

        <!-- Блоки для мальчиков -->
        <template v-else>
          <div v-for="cfg in maleCfg" :key="cfg.key" class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
              <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between gap-2">
                <span class="flex-1">{{ cfg.title }}</span>
                <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ displayValue(cfg.key) }}</span>
              </div>
            </div>
            <div class="flex flex-col">
              <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
                <UButton v-for="opt in cfg.options" :key="cfg.key+'-'+opt"
                  :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                    (getVal(cfg.key)===opt) ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-100 dark:hover:bg-slate-700']"
                  color="neutral" variant="ghost" @click="setVal(cfg.key, opt)">
                  <span class="w-full inline-flex items-start gap-3 text-left">
                    <span class="inline-block w-6 font-semibold">{{ opt }}</span>
                    <span class="flex-1 text-sm text-slate-700 dark:text-slate-300">{{ getLegendText(cfg.key as any, opt) }}</span>
                  </span>
                </UButton>
              </div>
            </div>
            
          </div>
        </template>
      </div>

      <!-- Результат с маскотом -->
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <Mascot :is-active="true" size="lg" />
        </div>
        <div class="w-fit max-w-full bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="p-4 space-y-3">
            <div class="text-3xl font-bold">
              <span class="text-slate-900 dark:text-white">{{ formula }}</span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span v-if="sex==='female'">Формула: Ma (1–5), P (1–5), Ax (0–5), Me (0/1).</span>
              <span v-else>Формула: P (1–5), Ax (0–5), V (1–5).</span>
              <span v-if="age">Возраст указан: {{ age }} лет</span>
            </div>
            <div>
              <div class="font-medium text-slate-700 dark:text-slate-300">Замечания</div>
              <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                <li class="flex items-start gap-2">
                  <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Стадии Танера оцениваются клинически; ориентируйтесь на атласы/описания.</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Формула используется для описания полового созревания; интерпретация зависит от возраста и индивидуальных особенностей.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import Mascot from '~/components/Mascot.vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Половая формула (Танер)' })

const sex = ref<'male'|'female'>('female')
const age = ref<number | null>(null)

type KeyF = 'Ma' | 'P' | 'Ax' | 'Me'
type KeyM = 'P' | 'Ax' | 'V'

const female = reactive<Record<KeyF, number>>({ Ma: 1, P: 1, Ax: 0, Me: 0 })
const male = reactive<Record<KeyM, number>>({ P: 1, Ax: 0, V: 1 })

const femaleCfg = [
  { key: 'Ma', title: 'Ma — молочные железы', options: [1,2,3,4,5] },
  { key: 'P', title: 'P — лобковые волосы', options: [1,2,3,4,5] },
  { key: 'Ax', title: 'Ax — подмышечные волосы', options: [0,1,2,3,4,5] },
  { key: 'Me', title: 'Me — менархе', options: [0,1] }
] as Array<{ key: KeyF, title: string, options: number[] }>

const maleCfg = [
  { key: 'P', title: 'P — лобковые волосы', options: [1,2,3,4,5] },
  { key: 'Ax', title: 'Ax — подмышечные волосы', options: [0,1,2,3,4,5] },
  { key: 'V', title: 'V — развитие гениталий', options: [1,2,3,4,5] }
] as Array<{ key: KeyM, title: string, options: number[] }>

function getVal(key: any): number {
  return sex.value === 'female' ? (female as any)[key] : (male as any)[key]
}
function setVal(key: any, value: number) {
  if (sex.value === 'female') (female as any)[key] = value; else (male as any)[key] = value
}
function displayValue(key: any): string {
  const v = getVal(key)
  return String(v)
}

const formula = computed(() => {
  if (sex.value === 'female') {
    return `Ma${female.Ma} P${female.P} Ax${female.Ax} Me${female.Me}`
  }
  return `P${male.P} Ax${male.Ax} V${male.V}`
})

function resetAll() {
  sex.value = 'female'
  age.value = null
  female.Ma = 1; female.P = 1; female.Ax = 0; female.Me = 0
  male.P = 1; male.Ax = 0; male.V = 1
}

// Закладки
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()
onMounted(() => { updateIsBookmarked('sexual-formula') })

type LegendItem = { stage: string, text: string }
function getLegend(key: KeyF | KeyM): LegendItem[] {
  if (key === 'P') {
    return [
      { stage: '1', text: 'Нет лобковых волос' },
      { stage: '2', text: 'Редкие, прямые по средней линии' },
      { stage: '3', text: 'Темнее, грубее, начинают кудрявиться, больше площадь' },
      { stage: '4', text: 'Взрослый тип, но меньше по площади, не выходит на бёдра' },
      { stage: '5', text: 'Взрослый тип, распространение на медиальные поверхности бёдер' }
    ]
  }
  if (key === 'Ax') {
    return [
      { stage: '0', text: 'Нет подмышечных волос' },
      { stage: '1', text: 'Едва заметные' },
      { stage: '2', text: 'Незначительные/редкие' },
      { stage: '3', text: 'Умеренно выраженные' },
      { stage: '4', text: 'Выраженные' },
      { stage: '5', text: 'Взрослый тип' }
    ]
  }
  if (key === 'Ma') {
    return [
      { stage: '1', text: 'Детская грудь (изменений нет)' },
      { stage: '2', text: 'Появление «почки»: набухание ареолы/железы' },
      { stage: '3', text: 'Дальнейшее увеличение без отделения ареолы' },
      { stage: '4', text: 'Ареола и сосок выступают «вторым бугорком»' },
      { stage: '5', text: 'Зрелая грудь, ареола в уровне кожи, выступает лишь сосок' }
    ]
  }
  if (key === 'V') {
    return [
      { stage: '1', text: 'Детские гениталии' },
      { stage: '2', text: 'Увеличение яичек/мошонки, кожа темнее/морщинистее' },
      { stage: '3', text: 'Рост полового члена (длина), дальнейшее увеличение' },
      { stage: '4', text: 'Рост диаметра, развитие головки, потемнение мошонки' },
      { stage: '5', text: 'Взрослые гениталии' }
    ]
  }
  if (key === 'Me') {
    return [
      { stage: '0', text: 'Менархе не было' },
      { stage: '1', text: 'Менархе было' }
    ]
  }
  return []
}

function getLegendText(key: KeyF | KeyM, value: number): string {
  const list = getLegend(key)
  const stageKey = String(value)
  const item = list.find((x) => x.stage === stageKey)
  return item ? item.text : ''
}
</script>

<style scoped>
</style>


