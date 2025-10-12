<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-4 mb-0">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Калькулятор срока беременности</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Калькулятор даты родов — это удобный инструмент, который поможет определить предполагаемую дату родов по первому дню последней менструации. Предполагаемая дата родов (ПДР) рассчитывается на основе среднего срока беременности, который составляет около 280 дней (40 недель) от первого дня последней менструации.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-0 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Ввод даты -->
        <div class="bg-white dark:bg-slate-800 md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Дата первого дня последней менструации</div>
          </div>
          <div class="p-4 overflow-visible">
            <div class="relative calendar-container">
              <div class="flex gap-2">
                <UInput
                  v-model="dateInput"
                  size="xl"
                  placeholder="ДД.ММ.ГГГГ"
                  class="flex-1 border-slate-200 dark:border-slate-600"
                  @input="onDateInput"
                  @keydown="onDateKeydown"
                  @paste.prevent="onDatePaste"
                />
                <UButton
                  variant="ghost"
                  size="xl"
                  icon="i-heroicons-calendar-days-20-solid"
                  class="border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  @click="showCalendar = !showCalendar"
                />
              </div>
              
              <!-- Кастомный выпадающий календарь -->
              <div 
                v-if="showCalendar" 
                class="absolute top-full right-0 mt-2 z-50 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded shadow-lg p-4 min-w-max"
              >
                <UCalendar
                  v-model="selectedDate"
                  size="lg"
                  color="primary"
                  :locale="'ru'"
                  :first-day-of-week="1"
                  @update:model-value="onCalendarDateSelect"
                />
              </div>
            </div>
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Описание:</span> Укажите первый день последней менструации (акушерский срок)
            </div>
          </div>
          
          <!-- Футер карточки с высотой стояния дна матки -->
          <div v-if="selectedDate" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
            <div class="text-sm text-slate-600 dark:text-slate-400">
              <div class="font-medium mb-1">Высота стояния дна матки ({{ pregnancyWeeks }} недель):</div>
              <div>{{ getCurrentFundalDescription(pregnancyWeeks) }}</div>
            </div>
          </div>
        </div>

        <!-- Результат -->
        <div v-if="dueDate" class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Результат</div>
          </div>
          <div class="px-4 py-3 space-y-2">
            <div class="text-3xl font-bold">
              <span class="text-slate-900 dark:text-white">{{ pregnancyWeeks }} недель и {{ pregnancyDays }} дней</span>
              <span class="text-base font-medium text-slate-500 dark:text-slate-400"> — <span class="text-slate-900 dark:text-white">Срок беременности</span></span>
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Предполагаемая дата родов:</span> {{ dueDateFormatted }}
            </div>
            <div class="text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Метод расчета:</span> Акушерский срок (280 дней)
            </div>
          </div>
          <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-information-circle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Только 4–5% женщин рожают точно в ПДР</span>
              </div>
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-information-circle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">У 80% женщин роды происходят в пределах ±2 недель от ПДР</span>
              </div>
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-information-circle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Нормальные роды могут произойти на 37–42 неделе беременности</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Дополнительная информация -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Методы расчета даты родов</div>
          </div>
          <div class="px-4 py-3">
            <div class="space-y-3">
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">1. По первому дню последней менструации (акушерский срок)</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Самый распространенный метод. Формула: Первый день менструации + 280 дней = ПДР</div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">2. По дню зачатия (эмбриональный срок)</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Используется, если известна точная дата овуляции. Формула: День зачатия + 266 дней = ПДР</div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">3. По УЗИ</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Наиболее точен до 12 недель, когда размер плодного яйца строго соответствует сроку</div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">4. По первому шевелению плода</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">К дате первого шевеления прибавляют 20 недель (для первородящих) или 22 недели (для повторнородящих)</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Факторы, влияющие на точность -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Факторы, влияющие на точность расчета</div>
          </div>
          <div class="px-4 py-3">
            <div class="space-y-2">
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Нерегулярный цикл может сместить овуляцию</span>
              </div>
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Индивидуальные особенности организма</span>
              </div>
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Здоровье матери и плода</span>
              </div>
              <div class="flex items-start gap-2">
                <UIcon name="i-heroicons-exclamation-triangle-20-solid" class="mt-1 shrink-0 w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">Точность указанных данных</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { CalendarDate } from '@internationalized/date'

definePageMeta({ middleware: 'auth', headerTitle: 'Калькулятор срока беременности' })

const selectedDate = ref<any>(null)
const dateInput = ref('')
const showCalendar = ref(false)

// Закрытие календаря при клике вне его
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    const calendarContainer = document.querySelector('.calendar-container')
    
    if (calendarContainer && !calendarContainer.contains(target)) {
      showCalendar.value = false
    }
  })
})

function onCalendarDateSelect() {
  console.log('onCalendarDateSelect called')
  console.log('selectedDate:', selectedDate.value)
  isCalendarSelection = true
  showCalendar.value = false
  console.log('Calendar selection completed, popover closed')
}

function maskDateString(value: string): string {
  // Удаляем все кроме цифр
  const digits = value.replace(/\D/g, '')
  
  // Применяем маску ##.##.####
  if (digits.length <= 2) {
    return digits
  } else if (digits.length <= 4) {
    return `${digits.slice(0, 2)}.${digits.slice(2)}`
  } else {
    return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4, 8)}`
  }
}

function onDateInput(event: Event) {
  const target = event.target as HTMLInputElement
  const masked = maskDateString(target.value)
  target.value = masked
  dateInput.value = masked
  parseDateInput()
}

function onDateKeydown(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  const isNumber = /[0-9]/.test(event.key)
  
  if (!allowedKeys.includes(event.key) && !isNumber) {
    event.preventDefault()
  }
}

function onDatePaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const masked = maskDateString(pastedData)
  dateInput.value = masked
  parseDateInput()
}

function parseDateInput() {
  if (!dateInput.value.trim()) {
    selectedDate.value = null
    return
  }

  // Проверяем формат DD.MM.YYYY
  const match = dateInput.value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/)
  if (match) {
    const day = parseInt(match[1])
    const month = parseInt(match[2])
    const year = parseInt(match[3])

    // Проверяем валидность даты
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= 2100) {
      try {
        selectedDate.value = new CalendarDate(year, month, day)
        return
      } catch (error) {
        // Невалидная дата
      }
    }
  }

  // Если не удалось распарсить, сбрасываем selectedDate
  selectedDate.value = null
}



function formatDate(date: CalendarDate) {
  return date.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// Синхронизируем выбранную дату с input при выборе из календаря
let isCalendarSelection = false

watch(selectedDate, (newDate) => {
  console.log('selectedDate changed:', newDate)
  if (isCalendarSelection) {
    if (newDate) {
      // Форматируем в маску DD.MM.YYYY
      const day = newDate.day.toString().padStart(2, '0')
      const month = newDate.month.toString().padStart(2, '0')
      const year = newDate.year.toString()
      dateInput.value = `${day}.${month}.${year}`
      console.log('Formatted date input:', dateInput.value)
    } else {
      dateInput.value = ''
    }
    isCalendarSelection = false
  }
})



const dueDate = computed(() => {
  if (!selectedDate.value) return null
  
  // Добавляем 280 дней (40 недель) для акушерского срока
  const resultDate = selectedDate.value.add({ days: 280 })
  
  return new Date(resultDate.year, resultDate.month - 1, resultDate.day)
})

const dueDateFormatted = computed(() => {
  if (!dueDate.value) return ''
  
  return dueDate.value.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

const pregnancyWeeks = computed(() => {
  if (!selectedDate.value || !dueDate.value) return 0
  
  const today = new Date()
  const inputDate = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  
  // Вычисляем разность в днях
  const diffTime = today.getTime() - inputDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  const weeks = Math.floor(diffDays / 7)
  return Math.max(0, weeks)
})

const pregnancyDays = computed(() => {
  if (!selectedDate.value || !dueDate.value) return 0
  
  const today = new Date()
  const inputDate = new Date(selectedDate.value.year, selectedDate.value.month - 1, selectedDate.value.day)
  
  // Вычисляем разность в днях
  const diffTime = today.getTime() - inputDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  const days = diffDays % 7
  return Math.max(0, days)
})

function resetAll() {
  console.log('resetAll called')
  selectedDate.value = null
  dateInput.value = ''
  showCalendar.value = false
  console.log('Reset completed')
}


function getCurrentFundalDescription(weeks: number): string {
  if (weeks < 4) return 'Размер матки соответствует размеру куриного яйца'
  if (weeks < 8) return 'Размер матки соответствует размеру гусиного яйца'
  if (weeks < 12) return 'Размер матки достигает размера головки новорожденного, дно матки достигает верхнего края лобкового симфиза'
  if (weeks < 16) return 'Дно матки становится доступным для пальпации через переднюю брюшную стенку'
  if (weeks < 20) return 'Дно матки находится на середине расстояния между лобком и пупком'
  if (weeks < 24) return 'Дно матки находится на 2 поперечных пальца ниже пупка. Живот уже заметно увеличен'
  if (weeks < 28) return 'Дно матки находится на уровне пупка'
  if (weeks < 32) return 'Дно матки определяется на 2-3 пальца выше пупка'
  if (weeks < 38) return 'Дно матки находится на середине расстояния между пупком и мечевидным отростком, пупок начинает сглаживаться'
  if (weeks < 40) return 'Дно матки поднимается до мечевидного отростка и реберных дуг - это самый высокий уровень стояния дна матки'
  return 'Дно матки опускается до середины расстояния между пупком и мечевидным отростком. В конце беременности пупок выпячивается'
}
</script>
