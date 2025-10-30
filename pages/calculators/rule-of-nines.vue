<template>
  <div class="flex-1">
    <!-- Шапка и действия -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Правило «девяток» (TBSA)</h1>
        <div class="flex md:items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('rule-of-nines')"
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
        Быстрая оценка общей площади поражения кожи у взрослых по анатомическим зонам, кратным 9%.
      </p>
    </div>

    <!-- Основной контент в стиле карточек как у ШОКС -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
        <!-- Карточки зон -->
        <div v-for="region in regions" :key="region.key" class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white flex items-center justify-between">
              <span>{{ region.title }}</span>
              <span class="text-xs font-medium text-slate-500 dark:text-slate-400">{{ selected[region.key] }}%</span>
            </div>
          </div>
          <div class="p-3">
            <div class="flex flex-wrap gap-2">
              <UButton
                v-for="opt in regionRowOptions(region)"
                :key="String(region.key)+'-'+opt"
                size="sm"
                :color="selected[region.key] === opt ? 'primary' : 'neutral'"
                :variant="selected[region.key] === opt ? 'solid' : 'soft'"
                class="cursor-pointer"
                @click="setValue(region.key, opt)"
              >
                {{ opt }}%
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Результат с маскотом (как в pain-vas) -->
      <div class="flex items-start gap-3">
        <div class="flex-shrink-0">
          <Mascot :is-active="true" size="lg" />
        </div>
        <div class="w-fit max-w-full bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="p-4 space-y-3">
            <div class="text-3xl font-bold">
              <span :class="totalTextClass">{{ total.toFixed(1) }}%</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400"> — <span :class="totalTextClass">{{ severityLabel }}</span></span>
            </div>
            <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <span><span class="font-semibold text-emerald-600 dark:text-emerald-400">&lt;10%</span> — лёгкая степень</span>
              <span><span class="font-semibold text-amber-600 dark:text-amber-400">10–20%</span> — умеренная</span>
              <span><span class="font-semibold text-red-600 dark:text-red-400">&gt;20%</span> — тяжёлая</span>
            </div>
            <div>
              <div class="font-medium text-slate-700 dark:text-slate-300">Замечания</div>
              <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                <li class="flex items-start gap-2">
                  <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Учитывать ожоги II степени и выше; эритема не входит в расчёт.</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>У детей используйте <NuxtLink to="/calculators/burn-area" class="underline hover:no-underline">схему Лунда–Браудера</NuxtLink>.</span>
                </li>
                <li class="flex items-start gap-2">
                  <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                  <span>Метод не учитывает глубину поражения и может быть менее точен при очень малых (&lt;5%) или очень обширных (&gt;90%) поражениях.</span>
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
definePageMeta({ middleware: 'auth', headerTitle: 'Правило "девяток" (TBSA)' })

type RegionKey = 'head' | 'frontTorso' | 'backTorso' | 'rightArm' | 'leftArm' | 'rightLeg' | 'leftLeg' | 'perineum'

type Region = {
  key: RegionKey
  title: string
  options: number[]
}

const regions: Region[] = [
  { key: 'head', title: 'Голова и лицо', options: [9] },
  { key: 'frontTorso', title: 'Передняя поверхность туловища', options: [9, 18] },
  { key: 'backTorso', title: 'Задняя поверхность туловища', options: [9, 18] },
  { key: 'rightArm', title: 'Правая верхняя конечность', options: [4.5, 9] },
  { key: 'leftArm', title: 'Левая верхняя конечность', options: [4.5, 9] },
  { key: 'rightLeg', title: 'Правая нижняя конечность', options: [9, 18] },
  { key: 'leftLeg', title: 'Левая нижняя конечность', options: [9, 18] },
  { key: 'perineum', title: 'Промежность', options: [1] }
]

const selected = reactive<Record<RegionKey, number>>({
  head: 0,
  frontTorso: 0,
  backTorso: 0,
  rightArm: 0,
  leftArm: 0,
  rightLeg: 0,
  leftLeg: 0,
  perineum: 0
})

function setValue(key: RegionKey, value: number) {
  selected[key] = value
}

function regionRowOptions(region: Region): number[] {
  const set = new Set<number>([0, ...region.options])
  return Array.from(set).sort((a, b) => a - b)
}

const total = computed(() =>
  Object.values(selected).reduce((sum, v) => sum + (Number.isFinite(v) ? Number(v) : 0), 0)
)

const severityLabel = computed(() => {
  const t = total.value
  if (t < 10) return 'Лёгкая степень'
  if (t <= 20) return 'Умеренная степень'
  return 'Тяжёлая степень'
})

const totalTextClass = computed(() => {
  const t = total.value
  if (t < 10) return 'text-emerald-600 dark:text-emerald-400'
  if (t <= 20) return 'text-amber-500 dark:text-amber-600'
  return 'text-red-600 dark:text-red-500'
})

const pillClass = computed(() => {
  const t = total.value
  if (t < 10) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (t <= 20) return 'bg-amber-500 text-white dark:bg-amber-600'
  return 'bg-red-600 text-white dark:bg-red-500'
})

function resetAll() {
  Object.keys(selected).forEach(k => (selected[k as RegionKey] = 0))
}

function printPage() {
  if (process.client) window.print()
}

// Закладки — как в других калькуляторах
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()

onMounted(() => {
  updateIsBookmarked('rule-of-nines')
})
</script>

<style scoped>
</style>


