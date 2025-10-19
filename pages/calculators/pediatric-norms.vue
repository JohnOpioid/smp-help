<template>
  <div class="flex-1">
    <!-- Блок поиска с шапкой калькулятора -->
    <div class="max-w-5xl w-full mx-auto px-4 pt-8">
      <SearchBar />
      <div class="flex items-center justify-between gap-2 mb-2 mt-6">
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">Физиологические возрастные нормы у детей</h1>
        <UButton color="neutral" variant="soft" @click="resetAll">Сбросить</UButton>
      </div>
      <p class="text-slate-600 dark:text-slate-300">
        Калькулятор для определения физиологических норм у детей в зависимости от возраста. Показывает нормальные значения частоты дыхания (ЧДД), частоты сердечных сокращений (ЧСС), артериального давления (АД) и массы тела.
      </p>
    </div>

    <!-- Основной контент -->
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-6">

      <div class="grid grid-cols-1 gap-6">
        <!-- Ввод данных -->
        <div class="bg-white dark:bg-slate-800 md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Параметры ребенка</div>
          </div>
          <div class="p-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Возраст -->
              <div class="flex flex-col">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Возраст</label>
                <div class="relative flex-1">
                  <input
                    v-model="ageInput"
                    type="number"
                    placeholder="Введите возраст"
                    min="0"
                    max="168"
                    class="w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-3 py-3 text-base gap-2 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    @input="onAgeInput"
                  />
                </div>
              </div>
              
              <!-- Единица измерения -->
              <div class="flex flex-col">
                <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Единица измерения</label>
                <div class="relative flex-1 dropdown-container">
                  <button
                    type="button"
                    class="relative group rounded-md inline-flex items-center focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-3 py-3 text-base gap-2 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary pe-9 w-full cursor-pointer"
                    @click="showDropdown = !showDropdown"
                  >
                    <span class="truncate">{{ ageUnit }}</span>
                    <span class="absolute inset-y-0 end-0 flex items-center pe-2.5">
                      <svg class="h-5 w-5 text-dimmed shrink-0 transition-transform duration-200" :class="{ 'rotate-180': showDropdown }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </span>
                  </button>
                  
                  <!-- Выпадающий список -->
                  <div v-if="showDropdown" class="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-md shadow-lg">
                    <div class="py-1">
                      <button
                        type="button"
                        class="w-full px-3 py-2 text-left text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        :class="{ 'bg-slate-100 dark:bg-slate-700': ageUnit === 'Месяцы' }"
                        @click="selectOption('Месяцы')"
                      >
                        Месяцы
                      </button>
                      <button
                        type="button"
                        class="w-full px-3 py-2 text-left text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        :class="{ 'bg-slate-100 dark:bg-slate-700': ageUnit === 'Годы' }"
                        @click="selectOption('Годы')"
                      >
                        Годы
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="mt-4 text-sm text-slate-600 dark:text-slate-400">
              <span class="font-medium">Описание:</span> Введите возраст ребенка и выберите единицу измерения (месяцы или годы)
            </div>
          </div>
          
          <!-- Таблица норм в футере -->
          <div v-if="currentNorms" class="p-0">
            <div class="overflow-x-auto">
              <table class="w-full border-collapse border-t border-slate-200 dark:border-slate-600">
                <thead>
                  <tr class="bg-slate-200 dark:bg-slate-600">
                    <th class="px-4 py-2 text-left text-sm font-medium text-slate-900 dark:text-white border-r border-slate-200 dark:border-slate-600">Параметр</th>
                    <th class="px-4 py-2 text-left text-sm font-medium text-slate-900 dark:text-white">Нормальное значение</th>
                  </tr>
                </thead>
                <tbody>
                  <tr class="border-b border-slate-200 dark:border-slate-600">
                    <td class="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600">Масса тела</td>
                    <td class="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white">{{ currentNorms.weight }} кг</td>
                  </tr>
                  <tr class="border-b border-slate-200 dark:border-slate-600">
                    <td class="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600">Частота дыхания (ЧДД)</td>
                    <td class="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white">{{ currentNorms.respiratoryRate }} в минуту</td>
                  </tr>
                  <tr class="border-b border-slate-200 dark:border-slate-600">
                    <td class="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600">Частота сердечных сокращений (ЧСС)</td>
                    <td class="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white">{{ currentNorms.heartRate }} в минуту</td>
                  </tr>
                  <tr>
                    <td class="px-4 py-2 text-sm text-slate-700 dark:text-slate-300 border-r border-slate-200 dark:border-slate-600">Артериальное давление (АД)</td>
                    <td class="px-4 py-2 text-sm font-medium text-slate-900 dark:text-white">{{ currentNorms.bloodPressure }} мм рт. ст.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>


        <!-- Справочная таблица -->

        <!-- Формулы расчета АД -->
        <div class="bg-white dark:bg-slate-800 overflow-hidden md:rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-600">
            <div class="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">Формулы расчета АД для детей 1-10 лет</div>
          </div>
          <div class="px-4 py-3">
            <div class="space-y-3">
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Среднее возрастное АД:</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Систолическое: 90 + (возраст в годах) × 2</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Диастолическое: 60 + (возраст в годах)</div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Верхнее пограничное:</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Систолическое: 105 + (возраст в годах) × 2</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Диастолическое: 75 + (возраст в годах)</div>
              </div>
              <div>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Нижнее пограничное:</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Систолическое: 75 + (возраст в годах) × 2</div>
                <div class="text-sm text-slate-600 dark:text-slate-400">Диастолическое: 45 + (возраст в годах)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Физиологические возрастные нормы у детей' })

const ageInput = ref('')
const ageUnit = ref('Годы')
const showDropdown = ref(false)



// Данные из таблицы (в месяцах)
const ageNorms = [
  { age: 0, label: 'Новорожденные', weight: '3,5', respiratoryRate: '40-60', heartRate: '130-140', bloodPressure: '70/40' },
  { age: 3, label: '3 мес.', weight: '5', respiratoryRate: '35-40', heartRate: '120-130', bloodPressure: '85/40' },
  { age: 6, label: '6 мес.', weight: '7', respiratoryRate: '33-35', heartRate: '120-125', bloodPressure: '90/55' },
  { age: 12, label: '1 год', weight: '10', respiratoryRate: '30-32', heartRate: '120', bloodPressure: '92/56' },
  { age: 24, label: '2 года', weight: '12', respiratoryRate: '26-30', heartRate: '110-115', bloodPressure: '94/56' },
  { age: 48, label: '4 года', weight: '16', respiratoryRate: '25-26', heartRate: '100-105', bloodPressure: '98/56' },
  { age: 60, label: '5 лет', weight: '19', respiratoryRate: '25-26', heartRate: '100', bloodPressure: '100/58' },
  { age: 72, label: '6 лет', weight: '20', respiratoryRate: '25', heartRate: '90-95', bloodPressure: '100/60' },
  { age: 96, label: '8 лет', weight: '25', respiratoryRate: '22-24', heartRate: '80-85', bloodPressure: '100/65' },
  { age: 120, label: '10 лет', weight: '30', respiratoryRate: '20-22', heartRate: '78-80', bloodPressure: '105/70' },
  { age: 144, label: '12 лет', weight: '33-35', respiratoryRate: '18-20', heartRate: '75-82', bloodPressure: '110/70' },
  { age: 168, label: '14 лет', weight: 'до 45', respiratoryRate: '16-18', heartRate: '72-78', bloodPressure: '120/70' }
]

function onAgeInput() {
  // Обработка ввода возраста
}

function selectOption(option: string) {
  ageUnit.value = option
  showDropdown.value = false
}


const currentAgeInMonths = computed(() => {
  const age = parseInt(ageInput.value)
  if (isNaN(age) || age < 0) return null

  if (ageUnit.value === 'Годы') {
    return age * 12
  }
  return age
})

const ageDisplayText = computed(() => {
  const age = parseInt(ageInput.value)
  if (isNaN(age) || age < 0) return ''
  
  if (ageUnit.value === 'Годы') {
    return `${age} ${age === 1 ? 'год' : age < 5 ? 'года' : 'лет'}`
  } else {
    return `${age} ${age === 1 ? 'месяц' : age < 5 ? 'месяца' : 'месяцев'}`
  }
})

const currentAgeGroup = computed(() => {
  const age = currentAgeInMonths.value
  if (age === null) return { label: 'Неизвестно' }

  if (age === 0) return { label: 'Новорожденные' }
  if (age <= 11) return { label: 'Грудной возраст' } // до 1 года
  if (age <= 35) return { label: 'Раннее детство' } // до 3 лет
  if (age <= 83) return { label: 'Дошкольный возраст' } // до 7 лет (83 месяца = 6 лет 11 месяцев)
  return { label: 'Школьный возраст' } // от 7 лет
})

const currentNorms = computed(() => {
  const age = currentAgeInMonths.value
  if (age === null) return null

  // Находим ближайшую возрастную группу
  let closestNorm = ageNorms[0]
  for (let i = 0; i < ageNorms.length; i++) {
    if (age >= ageNorms[i].age) {
      closestNorm = ageNorms[i]
    } else {
      break
    }
  }
  return closestNorm
})

const bloodPressureFormulas = computed(() => {
  const ageYears = currentAgeInMonths.value !== null ? Math.floor(currentAgeInMonths.value / 12) : null
  if (ageYears === null || ageYears < 1 || ageYears > 10) return null

  const averageSystolic = 90 + ageYears * 2
  const averageDiastolic = 60 + ageYears
  const upperSystolic = 105 + ageYears * 2
  const upperDiastolic = 75 + ageYears
  const lowerSystolic = 75 + ageYears * 2
  const lowerDiastolic = 45 + ageYears

  return {
    averageSystolic,
    averageDiastolic,
    upperSystolic,
    upperDiastolic,
    lowerSystolic,
    lowerDiastolic
  }
})

function resetAll() {
  ageInput.value = ''
  ageUnit.value = 'Годы'
  showDropdown.value = false
}

// Закрытие выпадающего списка при клике вне его
onMounted(() => {
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (!target.closest('.dropdown-container')) {
      showDropdown.value = false
    }
  })
})
</script>
