<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала CIWA-AR</h1>
        <div class="flex items-center gap-2">
          <UButton 
            :color="isBookmarked ? 'primary' : 'neutral'" 
            :variant="isBookmarked ? 'solid' : 'soft'"
            :icon="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'"
            @click="toggleBookmark('ciwa-ar')"
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
        Шкала CIWA-AR (Clinical Institute Withdrawal Assessment for Alcohol scale, Revised) используется для определения у пациента симптомов алкогольного абстинентного синдрома и его степени тяжести.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Тошнота и рвота -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">1. Тошнота и рвота</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">На основании наблюдения</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in nauseaOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                nauseaScore === option.value ? [nauseaSelectedTextClass, nauseaSelectedBgClass, nauseaSelectedHoverClass] : ''
              ]"
              @click="nauseaScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Тремор -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">2. Тремор</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">На основании наблюдения; пациент с вытянутыми перед собой руками и расставленными пальцами</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in tremorOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                tremorScore === option.value ? [tremorSelectedTextClass, tremorSelectedBgClass, tremorSelectedHoverClass] : ''
              ]"
              @click="tremorScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Потливость -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">3. Потливость</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">На основании наблюдения</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in sweatingOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                sweatingScore === option.value ? [sweatingSelectedTextClass, sweatingSelectedBgClass, sweatingSelectedHoverClass] : ''
              ]"
              @click="sweatingScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Тревога -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">4. Тревога</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">На основании наблюдения, следует спросить у пациента чувствует ли он тревогу</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in anxietyOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                anxietyScore === option.value ? [anxietySelectedTextClass, anxietySelectedBgClass, anxietySelectedHoverClass] : ''
              ]"
              @click="anxietyScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Двигательное возбуждение -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">5. Двигательное возбуждение</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">На основании наблюдения</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in agitationOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                agitationScore === option.value ? [agitationSelectedTextClass, agitationSelectedBgClass, agitationSelectedHoverClass] : ''
              ]"
              @click="agitationScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Тактильные нарушения -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">6. Тактильные нарушения</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Спросите у пациента испытывает ли он зуд, онемение, жжение, а также чувство ползания под кожей насекомых</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in tactileOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                tactileScore === option.value ? [tactileSelectedTextClass, tactileSelectedBgClass, tactileSelectedHoverClass] : ''
              ]"
              @click="tactileScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Слуховые нарушения -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">7. Слуховые нарушения</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Спросите у пациента кажутся ли ему звуки, которые он слышит, громче или резче чем обычно</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in auditoryOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                auditoryScore === option.value ? [auditorySelectedTextClass, auditorySelectedBgClass, auditorySelectedHoverClass] : ''
              ]"
              @click="auditoryScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Визуальные нарушения -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">8. Визуальные нарушения</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Спросите у пациента не является ли свет в комнате слишком резким</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in visualOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                visualScore === option.value ? [visualSelectedTextClass, visualSelectedBgClass, visualSelectedHoverClass] : ''
              ]"
              @click="visualScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Головная боль -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">9. Головная боль, сжатие головы</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Спросите у пациента чувствует ли он боль или ощущение обруча вокруг головы</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in headacheOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                headacheScore === option.value ? [headacheSelectedTextClass, headacheSelectedBgClass, headacheSelectedHoverClass] : ''
              ]"
              @click="headacheScore = option.value"
            >
              <div class="flex items-center justify-between">
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ option.text }}</span>
                <span class="text-sm font-medium">{{ option.value }}</span>
              </div>
            </button>
          </div>
        </div>

        <!-- Ориентация -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">10. Ориентация и нарушения сознания</div>
            <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">Спросите пациента какое сегодня число, а также знает ли где находится и кем являются окружающие его лица</div>
          </div>
          <div class="flex flex-col">
            <button
              v-for="option in orientationOptions"
              :key="option.value"
              type="button"
              :class="[
                'w-full px-4 py-3 text-left border-b border-slate-100 dark:border-slate-700 cursor-pointer transition-colors',
                'hover:bg-slate-100 dark:hover:bg-slate-700',
                orientationScore === option.value ? [orientationSelectedTextClass, orientationSelectedBgClass, orientationSelectedHoverClass] : ''
              ]"
              @click="orientationScore = option.value"
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
                <span class="font-medium">Сумма баллов:</span> {{ totalScore }} из 67
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

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала CIWA-AR' })

const nauseaScore = ref<number>(0)
const tremorScore = ref<number>(0)
const sweatingScore = ref<number>(0)
const anxietyScore = ref<number>(0)
const agitationScore = ref<number>(0)
const tactileScore = ref<number>(0)
const auditoryScore = ref<number>(0)
const visualScore = ref<number>(0)
const headacheScore = ref<number>(0)
const orientationScore = ref<number>(0)

const nauseaOptions = [
  { value: 0, text: 'Отсутствие тошноты и рвоты' },
  { value: 1, text: 'Легкая тошнота и отсутствие рвоты' },
  { value: 4, text: 'Рецидивирующая тошнота' },
  { value: 7, text: 'Постоянная тошнота, частые сухие позывы на рвоту, рвота' }
]

const tremorOptions = [
  { value: 0, text: 'Отсутствие тремора' },
  { value: 1, text: 'Ощутимый на кончиках пальцев при прикосновении' },
  { value: 4, text: 'Заметный, если руки пациента вытянуты' },
  { value: 7, text: 'Тремор сильный, видимый даже если руки пациента не вытянуты' }
]

const sweatingOptions = [
  { value: 0, text: 'Не наблюдается' },
  { value: 1, text: 'Заметная потливость, влажные ладони' },
  { value: 4, text: 'Капли пота заметны на лбу' },
  { value: 7, text: 'Профузный пот' }
]

const anxietyOptions = [
  { value: 0, text: 'Поведение спокойное' },
  { value: 1, text: 'Легкая тревога' },
  { value: 4, text: 'Выраженная тревога, насторожен' },
  { value: 7, text: 'Эквивалент острым паническим состояниям, отмечаемым при тяжелом делирии или при острых шизофренических реакциях' }
]

const agitationOptions = [
  { value: 0, text: 'Нормальная активность' },
  { value: 1, text: 'Незначительно усилено' },
  { value: 4, text: 'Значительное возбуждение и манипуляционное беспокойство' },
  { value: 7, text: 'Больной при обследовании постоянно ходит по комнате (кабинету) или все время мечется' }
]

const tactileOptions = [
  { value: 0, text: 'Отсутствуют' },
  { value: 1, text: 'Очень легкий зуд, покалывание, жжение или онемение' },
  { value: 2, text: 'Легкий зуд, покалывание, жжение или онемение' },
  { value: 3, text: 'Умеренный зуд, покалывание, жжение или онемение' },
  { value: 4, text: 'Спорадические осязательные галлюцинации' },
  { value: 5, text: 'Оживленные осязательные галлюцинации' },
  { value: 6, text: 'Крайне интенсивные осязательные галлюцинации' },
  { value: 7, text: 'Постоянные осязательные галлюцинации' }
]

const auditoryOptions = [
  { value: 0, text: 'Отсутствуют' },
  { value: 1, text: 'Очень незначительная гиперчувствительность к звуковым стимулам' },
  { value: 2, text: 'Слабо выраженная гиперчувствительность к звуковым стимулам' },
  { value: 3, text: 'Чрезмерная гиперчувствительность к звуковым стимулам' },
  { value: 4, text: 'Спорадические слуховые галлюцинации' },
  { value: 5, text: 'Оживленные слуховые галлюцинации' },
  { value: 6, text: 'Чрезвычайно выраженные слуховые галлюцинации' },
  { value: 7, text: 'Постоянные слуховые галлюцинации' }
]

const visualOptions = [
  { value: 0, text: 'Отсутствуют' },
  { value: 1, text: 'Небольшая гиперчувствительность' },
  { value: 2, text: 'Умеренная гиперчувствительность' },
  { value: 3, text: 'Выраженная гиперчувствительность' },
  { value: 4, text: 'Спорадические зрительные галлюцинации' },
  { value: 5, text: 'Оживленные зрительные галлюцинации' },
  { value: 6, text: 'Необыкновенно сильные зрительные галлюцинации' },
  { value: 7, text: 'Постоянные зрительные галлюцинации' }
]

const headacheOptions = [
  { value: 0, text: 'Отсутствует' },
  { value: 1, text: 'Очень легкая' },
  { value: 2, text: 'Легкая' },
  { value: 3, text: 'Умеренная' },
  { value: 4, text: 'Умеренно выраженная' },
  { value: 5, text: 'Сильная' },
  { value: 6, text: 'Очень сильная' },
  { value: 7, text: 'Исключительно сильная' }
]

const orientationOptions = [
  { value: 0, text: 'Полностью ориентирован, выполняет порядковые сложения чисел' },
  { value: 1, text: 'Не уверен в дате, не справляется с тестом на сложение чисел' },
  { value: 2, text: 'Ошибается в дате не более, чем на 2 календарных дня' },
  { value: 3, text: 'Ошибается в дате более, чем на 2 календарных дня' },
  { value: 4, text: 'Неправильная ориентация в месте пребывания и окружающих лицах' }
]

const totalScore = computed(() => 
  nauseaScore.value + tremorScore.value + sweatingScore.value + anxietyScore.value + agitationScore.value + 
  tactileScore.value + auditoryScore.value + visualScore.value + headacheScore.value + orientationScore.value
)

const resultLabel = computed(() => {
  const score = totalScore.value
  if (score <= 9) return 'Очень умеренный абстинентный синдром'
  if (score >= 10 && score <= 15) return 'Легкий абстинентный синдром'
  if (score >= 16 && score <= 20) return 'Умеренный абстинентный синдром'
  return 'Тяжелый абстинентный синдром'
})

const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score <= 9) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 10 && score <= 15) return 'text-blue-600 dark:text-blue-400'
  if (score >= 16 && score <= 20) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
})

const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score <= 9) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (score >= 10 && score <= 15) return 'bg-blue-600 text-white dark:bg-blue-500'
  if (score >= 16 && score <= 20) return 'bg-amber-600 text-white dark:bg-amber-500'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const interpretationItems = computed(() => {
  const score = totalScore.value
  if (score <= 9) {
    return [
      'Очень умеренная симптоматика',
      'Немедикаментозное лечение или минимальное вмешательство',
      'Амбулаторное наблюдение возможно'
    ]
  }
  if (score >= 10 && score <= 15) {
    return [
      'Легкая форма абстиненции',
      'Мониторинг состояния пациента',
      'При необходимости симптоматическое лечение'
    ]
  }
  if (score >= 16 && score <= 20) {
    return [
      'Умеренная форма абстиненции',
      'Требуется медикаментозная терапия',
      'Регулярное наблюдение медицинского персонала'
    ]
  }
  return [
    'Тяжелая форма абстиненции',
    'Необходима срочная госпитализация',
    'Интенсивная медикаментозная терапия под постоянным наблюдением'
  ]
})

// Функция для определения цвета в зависимости от значения
const getColorClasses = (value: number, scale: '0-7' | '0-4') => {
  if (value === 0) {
    return {
      text: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-100/60 dark:bg-emerald-900/30',
      hover: 'hover:!bg-emerald-50 dark:hover:!bg-emerald-900/30'
    }
  }
  
  if (scale === '0-4') {
    // Для шкалы 0-4
    if (value === 1) return {
      text: 'text-amber-500 dark:text-amber-500',
      bg: 'bg-amber-200/70 dark:bg-amber-900/50',
      hover: 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
    }
    return {
      text: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100/70 dark:bg-red-900/30',
      hover: 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
    }
  }
  
  // Для шкалы 0-7
  if (value <= 2) {
    return {
      text: 'text-amber-500 dark:text-amber-500',
      bg: 'bg-amber-200/70 dark:bg-amber-900/50',
      hover: 'hover:!bg-amber-100 dark:hover:!bg-amber-900/30'
    }
  }
  
  if (value <= 4) {
    return {
      text: 'text-orange-500 dark:text-orange-500',
      bg: 'bg-orange-200/70 dark:bg-orange-900/50',
      hover: 'hover:!bg-orange-100 dark:hover:!bg-orange-900/30'
    }
  }
  
  return {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100/70 dark:bg-red-900/30',
    hover: 'hover:!bg-red-50 dark:hover:!bg-red-900/30'
  }
}

// Цвета для выбранных элементов
const nauseaSelectedTextClass = computed(() => getColorClasses(nauseaScore.value, '0-7').text)
const nauseaSelectedBgClass = computed(() => getColorClasses(nauseaScore.value, '0-7').bg)
const nauseaSelectedHoverClass = computed(() => getColorClasses(nauseaScore.value, '0-7').hover)

const tremorSelectedTextClass = computed(() => getColorClasses(tremorScore.value, '0-7').text)
const tremorSelectedBgClass = computed(() => getColorClasses(tremorScore.value, '0-7').bg)
const tremorSelectedHoverClass = computed(() => getColorClasses(tremorScore.value, '0-7').hover)

const sweatingSelectedTextClass = computed(() => getColorClasses(sweatingScore.value, '0-7').text)
const sweatingSelectedBgClass = computed(() => getColorClasses(sweatingScore.value, '0-7').bg)
const sweatingSelectedHoverClass = computed(() => getColorClasses(sweatingScore.value, '0-7').hover)

const anxietySelectedTextClass = computed(() => getColorClasses(anxietyScore.value, '0-7').text)
const anxietySelectedBgClass = computed(() => getColorClasses(anxietyScore.value, '0-7').bg)
const anxietySelectedHoverClass = computed(() => getColorClasses(anxietyScore.value, '0-7').hover)

const agitationSelectedTextClass = computed(() => getColorClasses(agitationScore.value, '0-7').text)
const agitationSelectedBgClass = computed(() => getColorClasses(agitationScore.value, '0-7').bg)
const agitationSelectedHoverClass = computed(() => getColorClasses(agitationScore.value, '0-7').hover)

const tactileSelectedTextClass = computed(() => getColorClasses(tactileScore.value, '0-7').text)
const tactileSelectedBgClass = computed(() => getColorClasses(tactileScore.value, '0-7').bg)
const tactileSelectedHoverClass = computed(() => getColorClasses(tactileScore.value, '0-7').hover)

const auditorySelectedTextClass = computed(() => getColorClasses(auditoryScore.value, '0-7').text)
const auditorySelectedBgClass = computed(() => getColorClasses(auditoryScore.value, '0-7').bg)
const auditorySelectedHoverClass = computed(() => getColorClasses(auditoryScore.value, '0-7').hover)

const visualSelectedTextClass = computed(() => getColorClasses(visualScore.value, '0-7').text)
const visualSelectedBgClass = computed(() => getColorClasses(visualScore.value, '0-7').bg)
const visualSelectedHoverClass = computed(() => getColorClasses(visualScore.value, '0-7').hover)

const headacheSelectedTextClass = computed(() => getColorClasses(headacheScore.value, '0-7').text)
const headacheSelectedBgClass = computed(() => getColorClasses(headacheScore.value, '0-7').bg)
const headacheSelectedHoverClass = computed(() => getColorClasses(headacheScore.value, '0-7').hover)

const orientationSelectedTextClass = computed(() => getColorClasses(orientationScore.value, '0-4').text)
const orientationSelectedBgClass = computed(() => getColorClasses(orientationScore.value, '0-4').bg)
const orientationSelectedHoverClass = computed(() => getColorClasses(orientationScore.value, '0-4').hover)

function resetAll() {
  nauseaScore.value = 0
  tremorScore.value = 0
  sweatingScore.value = 0
  anxietyScore.value = 0
  agitationScore.value = 0
  tactileScore.value = 0
  auditoryScore.value = 0
  visualScore.value = 0
  headacheScore.value = 0
  orientationScore.value = 0
}

// Функции для работы с закладками
const { isBookmarked, toggleBookmark, updateIsBookmarked } = useCalculatorBookmarks()

onMounted(() => {
  updateIsBookmarked('ciwa-ar')
})
</script>

