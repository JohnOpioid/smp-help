<template>
  <div class="flex-1">
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2 mb-2">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала оценки риска суицида (ШОРС)</h1>
        <div class="flex md:items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('shors')"
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
        Отметьте присутствующие факторы риска. Каждый пункт добавляет 1 балл. Итоговая сумма определяет уровень риска и рекомендации.
      </p>
    </div>

    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">
      <div class="grid grid-cols-1 gap-6">
        <!-- Все пункты в одном блоке -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Факторы риска (отметьте присутствующие)</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="(item, idx) in items"
              :key="idx"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                selected[idx] ? [selectedTextClass, selectedBgClass, selectedHoverClass] : ''
              ]"
              @click="toggle(idx)"
            >
              <div class="flex items-center justify-between gap-4">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
                <span class="text-sm font-medium">{{ selected[idx] ? '+1' : '0' }}</span>
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
                <span class="font-medium">Сумма баллов:</span> {{ totalScore }} из 10
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

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала оценки риска суицида (ШОРС)' })

const items = [
  'Мужской пол',
  'Возраст 12–24 лет, 45 лет и выше',
  'Депрессивные состояния в прошлом, депрессия в настоящее время',
  'Предыдущие попытки суицида',
  'Зависимость от психоактивных веществ',
  'Потеря рационального мышления (иррациональное, психотическое состояние)',
  'Нехватка социальной поддержки (нет семьи, друзей, круга общения)',
  'Конкретный план (время, место, способ и его летальность, лёгкость исполнения)',
  'Отсутствие супруга/близкого (одинокий, овдовевший, разведённый, живущий отдельно)',
  'Хроническое заболевание с сильными болями/утратой трудоспособности, плохим прогнозом'
]

const selected = ref<boolean[]>(Array(items.length).fill(false))

function toggle(idx: number) {
  selected.value[idx] = !selected.value[idx]
}

const totalScore = computed(() => selected.value.filter(Boolean).length)

const resultLabel = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'Низкий риск'
  if (s <= 4) return 'Средний риск'
  if (s <= 6) return 'Высокий риск'
  return 'Очень высокий риск'
})

const resultTextClass = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'text-emerald-600 dark:text-emerald-400'
  if (s <= 4) return 'text-blue-600 dark:text-blue-400'
  if (s <= 6) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const resultPillClass = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (s <= 4) return 'bg-blue-600 text-white dark:bg-blue-500'
  if (s <= 6) return 'bg-amber-600 text-white dark:bg-amber-500'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const interpretationItems = computed(() => {
  const s = totalScore.value
  if (s <= 2) {
    return ['Низкий риск — амбулаторное наблюдение']
  }
  if (s <= 4) {
    return [
      'Средний риск',
      'Амбулаторное наблюдение с частыми встречами (1–3 раза в неделю)',
      'Дневной стационар',
      'Рассмотреть возможность госпитализации'
    ]
  }
  if (s <= 6) {
    return [
      'Высокий риск',
      'Рекомендовать госпитализацию, если нет уверенности в качественном амбулаторном наблюдении',
      'Требуется участие психиатрической и социальной службы, родственников'
    ]
  }
  return [
    'Очень высокий риск',
    'Требуется госпитализация',
    'Рассмотреть принудительную госпитализацию'
  ]
})

const mascotMessage = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'Вижу низкий риск. Достаточно амбулаторного наблюдения.'
  if (s <= 4) return 'Средний риск. Нужны частые встречи (1–3/нед), дневной стационар возможен.'
  if (s <= 6) return 'Высокий риск. Рекомендую госпитализацию при сомнениях в амбулаторном наблюдении.'
  return 'Очень высокий риск. Показана госпитализация, в т.ч. принудительная.'
})

// Цвет выделения выбранных пунктов зависит от общего результата
const selectedTextClass = computed(() => resultTextClass.value)
const selectedBgClass = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'bg-emerald-100/60 dark:bg-emerald-900/30'
  if (s <= 4) return 'bg-blue-100/60 dark:bg-blue-900/30'
  if (s <= 6) return 'bg-amber-100/70 dark:bg-amber-900/30'
  return 'bg-red-100/70 dark:bg-red-900/30'
})
const selectedHoverClass = computed(() => {
  const s = totalScore.value
  if (s <= 2) return 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
  if (s <= 4) return 'hover:!bg-blue-50 dark:hover:!bg-blue-900/30'
  if (s <= 6) return 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
  return 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
})

function resetAll() {
  selected.value = Array(items.length).fill(false)
}

// Закладки
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()

onMounted(() => {
  updateIsBookmarked('shors')
})
</script>


