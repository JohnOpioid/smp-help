<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала FOUR</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Шкала комы FOUR служит для градации глубины комы у интубированных больных, когда оценка речевой реакции по GCS невозможна.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <!-- E: Глазные реакции -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Глазные реакции (E)</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in eyeOptions"
                :key="'e-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  eye === opt.value ? [eyeButtonBgClass, eyeButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="eye = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="eye === opt.value ? eyeTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="eye === opt.value ? eyeTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- M: Двигательные реакции -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Двигательные реакции (M)</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in motorOptions"
                :key="'m-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  motor === opt.value ? [motorButtonBgClass, motorButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="motor = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="motor === opt.value ? motorTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="motor === opt.value ? motorTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- B: Стволовые рефлексы -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Стволовые рефлексы (B)</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in brainOptions"
                :key="'b-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  brain === opt.value ? [brainButtonBgClass, brainButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="brain = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="brain === opt.value ? brainTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="brain === opt.value ? brainTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- R: Дыхательный паттерн -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Дыхательный паттерн (R)</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton
                v-for="opt in respOptions"
                :key="'r-btn-'+opt.value"
                :class="[
                  'w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  resp === opt.value ? [respButtonBgClass, respButtonHoverClass] : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                ]"
                :color="'neutral'"
                variant="ghost"
                @click="resp = opt.value"
              >
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left" :class="resp === opt.value ? respTextClass : ''">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold" :class="resp === opt.value ? respTextClass : ''">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Результат -->
      <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
          <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Результат</div>
        </div>
        <div class="p-4 h-full flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div class="space-y-1">
            <div class="text-3xl font-bold">
              <span :class="resultTextClass">{{ totalScore }}</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400">
                (E <span :class="eyeTextClass">{{ eye }}</span>
                + M <span :class="motorTextClass">{{ motor }}</span>
                + B <span :class="brainTextClass">{{ brain }}</span>
                + R <span :class="respTextClass">{{ resp }}</span>)
              </span>
            </div>
          </div>
          <span :class="resultPillClass" class="font-medium inline-flex items-center text-sm px-2 py-1 gap-1.5 rounded-md">{{ fourCategory }}</span>
        </div>
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
          <p class="text-slate-700 dark:text-slate-300">
            Интерпретация:
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">16</span> — ясное сознание;
            <span class="font-semibold text-blue-600 dark:text-blue-400">15</span> — сомноленция;
            <span class="font-semibold text-amber-300 dark:text-amber-300">13–14</span> — оглушение;
            <span class="font-semibold text-amber-500 dark:text-amber-500">9–12</span> — сопор;
            <span class="font-semibold text-red-600 dark:text-red-400">4–8</span> — кома;
            <span class="font-semibold text-red-700 dark:text-red-500">0</span> — смерть мозга.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Шкала FOUR' })

type Opt = { value: number, label: string }

const eyeOptions: Opt[] = [
  { value: 4, label: 'Глаза открыты, слежение и мигание по команде' },
  { value: 3, label: 'Глаза открыты, но нет слежения' },
  { value: 2, label: 'Глаза закрыты, открываются на громкий звук, но слежения нет' },
  { value: 1, label: 'Глаза закрыты, открываются на боль, но слежения нет' },
  { value: 0, label: 'Глаза остаются закрытыми в ответ на боль' }
]

const motorOptions: Opt[] = [
  { value: 4, label: 'Выполняет команды (знак отлично, кулак, знак мира)' },
  { value: 3, label: 'Локализует боль' },
  { value: 2, label: 'Сгибательный ответ на боль' },
  { value: 1, label: 'Разгибательная поза на боль' },
  { value: 0, label: 'Нет ответа на боль или генерализованный миоклонический эпистатус' }
]

const brainOptions: Opt[] = [
  { value: 4, label: 'Зрачковый и корнеальный рефлексы сохранены' },
  { value: 3, label: 'Один зрачок расширен и не реагирует на свет' },
  { value: 2, label: 'Зрачковый или роговичный рефлексы отсутствуют' },
  { value: 1, label: 'Зрачковый и роговичный рефлексы отсутствуют' },
  { value: 0, label: 'Отсутствуют зрачковый, роговичный и кашлевой рефлексы' }
]

const respOptions: Opt[] = [
  { value: 4, label: 'Не интубирован, регулярное дыхание' },
  { value: 3, label: 'Не интубирован, дыхание Чейн–Стокса' },
  { value: 2, label: 'Не интубирован, нерегулярное дыхание' },
  { value: 1, label: 'Сопротивляется аппарату ИВЛ' },
  { value: 0, label: 'Полностью синхронен с аппаратом ИВЛ или апноэ' }
]

const eye = ref<number>(4)
const motor = ref<number>(4)
const brain = ref<number>(4)
const resp = ref<number>(4)

const totalScore = computed(() => eye.value + motor.value + brain.value + resp.value)

// Категория и цвет по сумме
const fourCategory = computed(() => {
  const s = totalScore.value
  if (s === 16) return 'Ясное сознание'
  if (s === 15) return 'Сомноленция'
  if (s >= 13 && s <= 14) return 'Оглушение'
  if (s >= 9 && s <= 12) return 'Сопор'
  if (s >= 4 && s <= 8) return 'Кома'
  return 'Смерть мозга'
})

// Цвет текста по общей сумме (для главного числа)
const resultTextClass = computed(() => {
  const s = totalScore.value
  if (s === 16) return 'text-emerald-600 dark:text-emerald-400'
  if (s === 15) return 'text-blue-600 dark:text-blue-400'
  if (s >= 13 && s <= 14) return 'text-amber-300 dark:text-amber-300'
  if (s >= 9 && s <= 12) return 'text-amber-500 dark:text-amber-500'
  if (s >= 4 && s <= 8) return 'text-red-600 dark:text-red-400'
  return 'text-red-700 dark:text-red-500'
})

// Пилл результата по общей сумме
const resultPillClass = computed(() => {
  const s = totalScore.value
  if (s === 16) return 'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-slate-900'
  if (s === 15) return 'bg-blue-600 text-white dark:bg-blue-500 dark:text-white'
  if (s >= 13 && s <= 14) return 'bg-amber-200 text-amber-900 dark:bg-amber-300 dark:text-amber-900'
  if (s >= 9 && s <= 12) return 'bg-amber-500 text-white dark:bg-amber-600 dark:text-white'
  if (s >= 4 && s <= 8) return 'bg-red-600 text-white dark:bg-red-500 dark:text-white'
  return 'bg-red-700 text-white dark:bg-red-600 dark:text-white'
})

// Текстовые цвета по значениям каждой группы
const eyeTextClass = computed(() => {
  const v = eye.value
  if (v === 4) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 3) return 'text-amber-300 dark:text-amber-300'
  if (v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})
const motorTextClass = computed(() => {
  const v = motor.value
  if (v === 4) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 3) return 'text-amber-300 dark:text-amber-300'
  if (v === 2 || v === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})
const brainTextClass = computed(() => {
  const v = brain.value
  if (v === 4) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 3) return 'text-amber-300 dark:text-amber-300'
  if (v === 2 || v === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})
const respTextClass = computed(() => {
  const v = resp.value
  if (v === 4) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 3) return 'text-amber-300 dark:text-amber-300'
  if (v === 2 || v === 1) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

// Фон и hover для выбранных кнопок по значениям каждой группы
const eyeButtonBgClass = computed(() => {
  const v = eye.value
  if (v === 4) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 3) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const eyeButtonHoverClass = computed(() => {
  const v = eye.value
  if (v === 4) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 3) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const motorButtonBgClass = computed(() => {
  const v = motor.value
  if (v === 4) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 3) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2 || v === 1) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const motorButtonHoverClass = computed(() => {
  const v = motor.value
  if (v === 4) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 3) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 2 || v === 1) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const brainButtonBgClass = computed(() => {
  const v = brain.value
  if (v === 4) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 3) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2 || v === 1) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const brainButtonHoverClass = computed(() => {
  const v = brain.value
  if (v === 4) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 3) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 2 || v === 1) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

const respButtonBgClass = computed(() => {
  const v = resp.value
  if (v === 4) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 3) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2 || v === 1) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
})
const respButtonHoverClass = computed(() => {
  const v = resp.value
  if (v === 4) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 3) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 2 || v === 1) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

function resetAll() {
  eye.value = 4
  motor.value = 4
  brain.value = 4
  resp.value = 4
}
</script>

<style scoped>
</style>


