<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-2 md:px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Шкала NEWS</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300 mb-0">
        Калькулятор для расчета оценки тяжести состояния пациентов с COVID-19. Шкала NEWS 2 (National Early Warning Score) предложена в 2020 году для оценки тяжести течения COVID-19 Королевским колледжем врачей (Royal College of Physicians) - британским обществом профессиональных врачей медицины общего профиля и её узких направлений.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Частота дыханий -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Частота дыханий (в минуту)</div>
          </div>
          <div class="p-4">
            <UInput 
              v-model.number="respiratoryRate" 
              size="xl" 
              type="number" 
              placeholder="Например, 16" 
              class="w-full"
            />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="respiratoryRateClass">{{ respiratoryRatePoints }}</span>
            </div>
          </div>
        </div>

        <!-- Сатурация SpO2 -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Сатурация SpO2 (%)</div>
          </div>
          <div class="p-4">
            <UInput 
              v-model.number="spo2" 
              size="xl" 
              type="number" 
              placeholder="Например, 98" 
              class="w-full"
            />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="spo2Class">{{ spo2Points }}</span>
            </div>
          </div>
        </div>

        <!-- Потребность в оксигенации -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Потребность в оксигенации</div>
          </div>
          <div class="p-4">
            <USwitch v-model="oxygenNeed" />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="oxygenNeedClass">{{ oxygenNeedPoints }}</span>
            </div>
          </div>
        </div>

        <!-- Систолическое АД -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Систолическое АД (мм. рт. ст.)</div>
          </div>
          <div class="p-4">
            <UInput 
              v-model.number="systolicBP" 
              size="xl" 
              type="number" 
              placeholder="Например, 120" 
              class="w-full"
            />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="systolicBPClass">{{ systolicBPPoints }}</span>
            </div>
          </div>
        </div>

        <!-- ЧСС -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">ЧСС (в минуту)</div>
          </div>
          <div class="p-4">
            <UInput 
              v-model.number="heartRate" 
              size="xl" 
              type="number" 
              placeholder="Например, 80" 
              class="w-full"
            />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="heartRateClass">{{ heartRatePoints }}</span>
            </div>
          </div>
        </div>

        <!-- Температура тела -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Температура тела (°C)</div>
          </div>
          <div class="p-4">
            <UInput 
              v-model="temperature" 
              size="xl" 
              placeholder="36.5" 
              class="w-full"
              @input="onTempInput"
              @keydown="onTempKeydown"
              @paste.prevent="onTempPaste"
            />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="temperatureClass">{{ temperaturePoints }}</span>
            </div>
          </div>
        </div>

        <!-- Нарушение сознания -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Нарушение сознания</div>
          </div>
          <div class="p-4">
            <USwitch v-model="consciousnessDisturbance" />
            <div class="mt-2 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Баллы:</span> 
              <span :class="consciousnessDisturbanceClass">{{ consciousnessDisturbancePoints }}</span>
            </div>
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
        </div>

        <!-- Интерпретация -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Интерпретация</div>
          </div>
          <div class="px-4 py-3">
            <div class="space-y-2">
              <div v-for="(item, i) in interpretationItems" :key="i" class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                <span class="text-sm text-slate-700 dark:text-slate-300">{{ item }}</span>
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

definePageMeta({ middleware: 'auth', headerTitle: 'Шкала NEWS' })

const respiratoryRate = ref<number | null>(null)
const spo2 = ref<number | null>(null)
const oxygenNeed = ref<boolean>(false)
const systolicBP = ref<number | null>(null)
const heartRate = ref<number | null>(null)
const temperature = ref<string>('')
const consciousnessDisturbance = ref<boolean>(false)

// Функции для маски температуры
function maskTemperatureString(value: string): string {
  // Удаляем все кроме цифр и точки
  let cleaned = value.replace(/[^\d.]/g, '')
  
  // Удаляем лишние точки
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('')
  }
  
  // Ограничиваем до формата **.*
  if (cleaned.length > 4) {
    cleaned = cleaned.slice(0, 4)
  }
  
  return cleaned
}

function onTempInput(event: Event) {
  const target = event.target as HTMLInputElement
  const masked = maskTemperatureString(target.value)
  target.value = masked
  temperature.value = masked
}

function onTempKeydown(event: KeyboardEvent) {
  const allowedKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
  const isNumber = /[0-9]/.test(event.key)
  const isDot = event.key === '.'
  
  if (!allowedKeys.includes(event.key) && !isNumber && !isDot) {
    event.preventDefault()
  }
}

function onTempPaste(event: ClipboardEvent) {
  event.preventDefault()
  const pastedData = event.clipboardData?.getData('text') || ''
  const masked = maskTemperatureString(pastedData)
  temperature.value = masked
}

// Вычисление баллов для каждого параметра
const respiratoryRatePoints = computed(() => {
  const val = respiratoryRate.value
  if (val === null || val === undefined) return 0
  if (val <= 8) return 3
  if (val >= 9 && val <= 11) return 1
  if (val >= 12 && val <= 20) return 0
  if (val >= 21 && val <= 24) return 2
  return 3 // >= 25
})

const spo2Points = computed(() => {
  const val = spo2.value
  if (val === null || val === undefined) return 0
  if (val <= 91) return 3
  if (val >= 92 && val <= 93) return 2
  if (val >= 94 && val <= 95) return 1
  return 0 // >= 96
})

const oxygenNeedPoints = computed(() => oxygenNeed.value ? 2 : 0)

const systolicBPPoints = computed(() => {
  const val = systolicBP.value
  if (val === null || val === undefined) return 0
  if (val <= 90) return 3
  if (val >= 91 && val <= 100) return 2
  if (val >= 101 && val <= 110) return 1
  if (val >= 111 && val <= 219) return 0
  return 3 // >= 220
})

const heartRatePoints = computed(() => {
  const val = heartRate.value
  if (val === null || val === undefined) return 0
  if (val <= 40) return 3
  if (val >= 41 && val <= 50) return 1
  if (val >= 51 && val <= 90) return 0
  if (val >= 91 && val <= 110) return 1
  if (val >= 111 && val <= 130) return 2
  return 3 // >= 131
})

const temperaturePoints = computed(() => {
  const val = parseFloat(temperature.value)
  if (isNaN(val)) return 0
  if (val <= 35.0) return 3
  if (val >= 35.1 && val <= 36.0) return 1
  if (val >= 36.1 && val <= 38.0) return 0
  if (val >= 38.1 && val <= 39.0) return 1
  return 2 // >= 39.1
})

const consciousnessDisturbancePoints = computed(() => consciousnessDisturbance.value ? 3 : 0)

// Общий балл
const totalScore = computed(() => {
  return respiratoryRatePoints.value + spo2Points.value + oxygenNeedPoints.value + 
         systolicBPPoints.value + heartRatePoints.value + temperaturePoints.value + 
         consciousnessDisturbancePoints.value
})

// Интерпретация результата
const resultLabel = computed(() => {
  const score = totalScore.value
  if (score === 0) return 'Нет риска'
  if (score >= 1 && score <= 4) return 'Низкий риск'
  if (score >= 5 && score <= 6) return 'Средний риск'
  return 'Высокий риск'
})

const resultTextClass = computed(() => {
  const score = totalScore.value
  if (score === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (score >= 1 && score <= 4) return 'text-amber-300 dark:text-amber-300'
  if (score >= 5 && score <= 6) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const resultPillClass = computed(() => {
  const score = totalScore.value
  if (score === 0) return 'bg-emerald-600 text-white dark:bg-emerald-500'
  if (score >= 1 && score <= 4) return 'bg-amber-200 text-amber-900 dark:bg-amber-300 dark:text-amber-900'
  if (score >= 5 && score <= 6) return 'bg-amber-500 text-white dark:bg-amber-600'
  return 'bg-red-600 text-white dark:bg-red-500'
})

const interpretationItems = computed(() => {
  const score = totalScore.value
  if (score === 0) {
    return [
      'Нет риска',
      'Наблюдение 1 раз в 12 часов'
    ]
  }
  if (score >= 1 && score <= 4) {
    return [
      'Низкий риск (желтый)',
      'Наблюдение 1 раз в 6 часов'
    ]
  }
  if (score >= 5 && score <= 6) {
    return [
      'Средний риск (оранжевый)',
      'Наблюдение 1 раз в 1-2 часа'
    ]
  }
  return [
    'Высокий риск (красный)',
    'Непрерывное наблюдение'
  ]
})

// Цвета для отдельных параметров
const respiratoryRateClass = computed(() => {
  const points = respiratoryRatePoints.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (points <= 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const spo2Class = computed(() => {
  const points = spo2Points.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (points <= 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const oxygenNeedClass = computed(() => {
  const points = oxygenNeedPoints.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
})

const systolicBPClass = computed(() => {
  const points = systolicBPPoints.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (points <= 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const heartRateClass = computed(() => {
  const points = heartRatePoints.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (points <= 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const temperatureClass = computed(() => {
  const points = temperaturePoints.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  if (points <= 2) return 'text-amber-500 dark:text-amber-500'
  return 'text-red-600 dark:text-red-400'
})

const consciousnessDisturbanceClass = computed(() => {
  const points = consciousnessDisturbancePoints.value
  if (points === 0) return 'text-emerald-600 dark:text-emerald-400'
  return 'text-red-600 dark:text-red-400'
})

function resetAll() {
  respiratoryRate.value = null
  spo2.value = null
  oxygenNeed.value = false
  systolicBP.value = null
  heartRate.value = null
  temperature.value = ''
  consciousnessDisturbance.value = false
}
</script>
