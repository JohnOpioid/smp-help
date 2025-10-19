<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала ШОКС</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        ШОКС — шкала оценки клинического состояния пациента с хронической сердечной недостаточностью (ХСН). Основана на сумме 10 признаков, по результату определяется функциональный класс.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <!-- 1. Одышка -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Одышка</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in dyspneaOptions" :key="'d-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  dyspnea === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="dyspnea = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 2. Вес за неделю -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Изменение веса за неделю</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in weightOptions" :key="'w-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  weight === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="weight = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 3. Перебои сердца -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Перебои в работе сердца</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in palpitOptions" :key="'p-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  palpit === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="palpit = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 4. Положение в постели -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Положение в постели</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in postureOptions" :key="'pos-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  posture === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="posture = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 5. Набухшие шейные вены -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Набухшие шейные вены</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in jvpOptions" :key="'jvp-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  jvp === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="jvp = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 6. Хрипы в легких -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Хрипы в лёгких</div>
          </div>
        <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in ralesOptions" :key="'ral-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  rales === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="rales = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 7. Ритм галопа -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Ритм галопа</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in gallopOptions" :key="'gal-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  gallop === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="gallop = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 8. Печень -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Печень</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in liverOptions" :key="'liv-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  liver === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="liver = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 9. Отеки -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Отеки</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in edemaOptions" :key="'ed-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  edema === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="edema = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
                </span>
              </UButton>
            </div>
          </div>
        </div>

        <!-- 10. САД -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Систолическое АД</div>
          </div>
          <div class="h-full flex flex-col">
            <div class="flex flex-col divide-y divide-slate-100 dark:divide-slate-700">
              <UButton v-for="opt in sbpOptions" :key="'sbp-'+opt.value"
                :class="['w-full justify-between text-left rounded-none !px-4 !py-3 bg-transparent border-0 cursor-pointer',
                  sbp === opt.value ? 'bg-slate-100 dark:bg-slate-700/40' : 'hover:bg-slate-50 dark:hover:bg-slate-700']"
                color="neutral" variant="ghost" @click="sbp = opt.value">
                <span class="w-full inline-flex items-center justify-between gap-2 text-left">
                  <span class="text-left">{{ opt.label }}</span>
                  <span class="inline-block w-6 text-right font-semibold">{{ opt.value }}</span>
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
              <span :class="scoreTextClass">{{ totalScore }}</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400"> баллов — {{ interpretation }}</span>
            </div>
          </div>
          <span class="font-medium inline-flex items-center text-sm px-2 py-1 gap-1.5 rounded-md"
                :class="pillClass">{{ interpretation }}</span>
        </div>
        <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
          <p class="text-slate-700 dark:text-slate-300">
            Интерпретация:
            <span class="font-semibold text-emerald-600 dark:text-emerald-400">0</span> — отсутствие признаков ХСН;
            <span class="font-semibold text-blue-600 dark:text-blue-500">1–3</span> — I ФК;
            <span class="font-semibold text-amber-300 dark:text-amber-300">4–6</span> — II ФК;
            <span class="font-semibold text-amber-500 dark:text-amber-600">7–9</span> — III ФК;
            <span class="font-semibold text-red-600 dark:text-red-500">≥10</span> — IV ФК.
          </p>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Источник: <a class="underline hover:no-underline" href="https://medsoftpro.ru/kalkulyatory/shocks-scale.html" target="_blank" rel="noopener noreferrer">Шкала ШОКС</a>.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Шкала ШОКС' })

type Opt = { value: number, label: string }

const dyspneaOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'При нагрузке' },
  { value: 2, label: 'В покое' }
]
const weightOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Увеличился' }
]
const palpitOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Есть' }
]
const postureOptions: Opt[] = [
  { value: 0, label: 'Горизонтально' },
  { value: 1, label: 'С приподнятым головным концом (≥2 подушки)' },
  { value: 2, label: 'Плюс просыпается от удушья' },
  { value: 3, label: 'Сидя' }
]
const jvpOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Лежа' },
  { value: 2, label: 'Стоя' }
]
const ralesOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Нижние отделы (до 1/3)' },
  { value: 2, label: 'До лопаток (до 2/3)' },
  { value: 3, label: 'Над всей поверхностью лёгких' }
]
const gallopOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Есть' }
]
const liverOptions: Opt[] = [
  { value: 0, label: 'Не увеличена' },
  { value: 1, label: 'До 5 см' },
  { value: 2, label: 'Более 5 см' }
]
const edemaOptions: Opt[] = [
  { value: 0, label: 'Нет' },
  { value: 1, label: 'Пастозность' },
  { value: 2, label: 'Отеки' },
  { value: 3, label: 'Анасарка' }
]
const sbpOptions: Opt[] = [
  { value: 0, label: 'Более 120 мм рт. ст.' },
  { value: 1, label: '100–120 мм рт. ст.' },
  { value: 2, label: 'Менее 100 мм рт. ст.' }
]

const dyspnea = ref<number>(0)
const weight = ref<number>(0)
const palpit = ref<number>(0)
const posture = ref<number>(0)
const jvp = ref<number>(0)
const rales = ref<number>(0)
const gallop = ref<number>(0)
const liver = ref<number>(0)
const edema = ref<number>(0)
const sbp = ref<number>(0)

const totalScore = computed(() => dyspnea.value + weight.value + palpit.value + posture.value + jvp.value + rales.value + gallop.value + liver.value + edema.value + sbp.value)

const interpretation = computed(() => {
  const s = totalScore.value
  if (s === 0) return 'Отсутствие клинических признаков ХСН'
  if (s >= 1 && s <= 3) return 'I функциональный класс'
  if (s >= 4 && s <= 6) return 'II функциональный класс'
  if (s >= 7 && s <= 9) return 'III функциональный класс'
  return 'IV функциональный класс'
})

const pillClass = computed(() => {
  const s = totalScore.value
  if (s === 0) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (s <= 3) return 'bg-blue-600 text-white dark:bg-blue-500'
  if (s <= 6) return 'bg-amber-300 text-amber-900 dark:bg-amber-300 dark:text-amber-900'
  if (s <= 9) return 'bg-amber-500 text-white dark:bg-amber-600'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const scoreTextClass = computed(() => {
  const s = totalScore.value
  if (s === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (s <= 3) return 'text-blue-600 dark:text-blue-500'
  if (s <= 6) return 'text-amber-300 dark:text-amber-300'
  if (s <= 9) return 'text-amber-500 dark:text-amber-600'
  return 'text-red-600 dark:text-red-500'
})

// Градация цветов для выбранных пунктов (0 — зелёный, 1 — amber-300, 2 — amber-500, ≥3 — красный)
function getTextClass(v: number) {
  if (v === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (v === 1) return 'text-amber-300 dark:text-amber-300'
  if (v === 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
}

function getButtonBgClass(v: number) {
  if (v === 0) return 'bg-emerald-50 dark:bg-emerald-900/30'
  if (v === 1) return 'bg-amber-100 dark:bg-amber-900/30'
  if (v === 2) return 'bg-amber-200 dark:bg-amber-900/50'
  return 'bg-red-50 dark:bg-red-900/30'
}

function getButtonHoverClass(v: number) {
  if (v === 0) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (v === 1) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  if (v === 2) return 'hover:!bg-amber-200 dark:hover:!bg-amber-900/50'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
}

function resetAll() {
  dyspnea.value = 0
  weight.value = 0
  palpit.value = 0
  posture.value = 0
  jvp.value = 0
  rales.value = 0
  gallop.value = 0
  liver.value = 0
  edema.value = 0
  sbp.value = 0
}
</script>

<style scoped>
</style>


