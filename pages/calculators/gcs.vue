<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала комы Глазго (GCS)</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Шкала комы Глазго (Glasgow Coma Scale, GCS) используется для оценки степени нарушения сознания у взрослых.
      </p>
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
                  eyeOpening === opt.value ? [eyeButtonBgClass, eyeButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
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
                  verbalResponse === opt.value ? [verbalButtonBgClass, verbalButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
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
                  motorResponse === opt.value ? [motorButtonBgClass, motorButtonHoverClass] : 'hover:bg-slate-50 dark:hover:bg-slate-700'
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

      <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
          <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Результат</div>
        </div>
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
          </div>
          <span :class="resultPillClass" class="font-medium inline-flex items-center text-sm px-2 py-1 gap-1.5 rounded-md">{{ interpretation }}</span>
        </div>
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
          <p class="text-slate-700 dark:text-slate-300">
            Интерпретация:
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">15</span> — ясное сознание;
            <span class="font-semibold text-amber-300 dark:text-amber-300">13–14</span> — оглушение;
            <span class="font-semibold text-amber-500 dark:text-amber-500">9–12</span> — сопор;
            <span class="font-semibold text-red-600 dark:text-red-400">3–8</span> — кома.
          </p>
        </div>
      </div>

      
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Шкала Глазго' })

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
</script>

<style scoped>
</style>


