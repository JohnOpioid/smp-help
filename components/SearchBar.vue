<template>
  <div class="relative mx-auto w-full">
    <!-- Темный фон при фокусе -->
    <div v-if="isFocused" class="fixed inset-0 bg-slate-700/50 z-30" @click="blurSearch"></div>
    
    <div class="relative z-40" @click.prevent.stop="openPanelFromHeader">
      <ReactiveSearch
        v-model="searchQuery"
        placeholder="Введите запрос для поиска..."
        :ai-enabled="true"
        @clear="clearSearch"
        @enter="performSearch"
        @focus="handleSearchFocus"
        @blur="handleSearchBlur"
      />
    </div>

    <!-- Результаты поиска -->
    <div v-if="showResults && (currentPageResults.length > 0 || otherResults.length > 0)" class="absolute top-full left-0 right-0 mt-2 mb-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-60 max-h-[calc(80vh-3rem)] overflow-y-auto">
      <div class="p-2 pb-4">
        <!-- Результаты с текущей страницы -->
        <div v-if="currentPageResults.length > 0">
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200 dark:border-slate-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">На этой странице</span>
            </div>
          </div>
          <div v-for="result in currentPageResults" :key="result.id" 
               class="rounded-md overflow-visible border border-slate-200 dark:border-slate-600 mb-2">
            <!-- Основной контент (кликабельный) -->
            <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                 @click="navigateToResult(result)">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                  <div class="text-sm text-slate-600 dark:text-slate-300 mt-1 prose prose-sm max-w-none dark:prose-invert line-clamp-3" v-html="renderMarkdown(result.description)"></div>
                  <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <span class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">{{ result.type }}</span>
                    <span v-if="result.category" class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">{{ result.category }}</span>
                    <span v-if="result.codes?.mkbCode" class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-mono">МКБ: {{ result.codes.mkbCode }}</span>
                    <span v-if="result.codes?.stationCode" class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-mono">Станция: {{ result.codes.stationCode }}</span>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <!-- Футер с калькулятором (не кликабельный) -->
            <div v-if="result.type === 'Препарат' && shouldShowCalculator(result.drugData?.ageRestrictions) && result.drugData?.pediatricDose" 
                 class="border-t border-slate-200 dark:border-slate-600 p-3 bg-slate-50 dark:bg-slate-800/50 overflow-visible"
                 @click.stop>
              <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Калькулятор детской дозы</div>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Вес (кг)</label>
                  <input 
                    v-model.number="getCalculatorState(result.id).weight"
                    type="number" 
                    min="0" 
                    step="0.1" 
                    placeholder="15"
                    class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
                    @click.stop
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Дозировка</label>
                  <div class="relative">
                    <button 
                      @click.stop="toggleDropdown(result.id)"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 pe-9 text-left"
                      :class="{ 'ring-indigo-600': getCalculatorState(result.id).dropdownOpen }"
                    >
                      <span class="truncate">{{ getCalculatorState(result.id).selectedDose || 'Выберите' }}</span>
                      <span class="absolute inset-y-0 end-0 flex items-center pe-2.5">
                        <svg class="w-4 h-4 text-slate-400 transition-transform" :class="{ 'rotate-180': getCalculatorState(result.id).dropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </span>
                    </button>

                    <!-- Выпадающий список -->
                    <div
                      v-if="getCalculatorState(result.id).dropdownOpen"
                      class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto left-0 right-0"
                      @click.stop
                    >
                      <div
                        v-for="dose in getDoseOptions(result.drugData.pediatricDose)"
                        :key="dose.label"
                        @click.stop="selectOption(result.id, dose.label)"
                        class="px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': getCalculatorState(result.id).selectedDose === dose.label }"
                      >
                        {{ dose.label }}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат (мг)</label>
                  <input 
                    :value="getCalculatorResultMg(result)"
                    type="text" 
                    readonly
                    placeholder="—"
                    class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                    @click.stop
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат (мл)</label>
                  <input 
                    :value="getCalculatorResultMl(result)"
                    type="text" 
                    readonly
                    placeholder="—"
                    class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                    @click.stop
                  />
                </div>
              </div>
              
              <!-- Кнопки копирования и шаринга -->
              <div v-if="getCalculatorResultMg(result)" class="mt-3 flex gap-2 justify-center">
                <button 
                  @click.stop="copyCalculatorResult(result)"
                  class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Копировать
                </button>
                <button 
                  @click.stop="shareCalculatorResult(result)"
                  class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                  </svg>
                  Поделиться
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Остальные результаты -->
        <div v-if="otherResults.length > 0">
          <div class="relative my-4">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-200 dark:border-slate-600"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В других разделах</span>
            </div>
          </div>
          <div v-for="result in otherResults" :key="result.id" 
               class="rounded-md overflow-visible border border-slate-200 dark:border-slate-600 mb-2">
            <!-- Основной контент (кликабельный) -->
            <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                 @click="navigateToResult(result)">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                  <div class="text-sm text-slate-600 dark:text-slate-300 mt-1 prose prose-sm max-w-none dark:prose-invert line-clamp-3" v-html="renderMarkdown(result.description)"></div>
                  <div class="flex items-center gap-2 mt-2 flex-wrap">
                    <span class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">{{ result.type }}</span>
                    <span v-if="result.category" class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">{{ result.category }}</span>
                    <span v-if="result.codes?.mkbCode" class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-mono">МКБ: {{ result.codes.mkbCode }}</span>
                    <span v-if="result.codes?.stationCode" class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-mono">Станция: {{ result.codes.stationCode }}</span>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
            
            <!-- Футер с калькулятором (не кликабельный) -->
            <div v-if="result.type === 'Препарат' && shouldShowCalculator(result.drugData?.ageRestrictions) && result.drugData?.pediatricDose" 
                 class="border-t border-slate-200 dark:border-slate-600 p-3 bg-slate-50 dark:bg-slate-800/50 overflow-visible"
                 @click.stop>
              <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Калькулятор детской дозы</div>
              <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Вес (кг)</label>
                  <input 
                    v-model.number="getCalculatorState(result.id).weight"
                    type="number" 
                    min="0" 
                    step="0.1" 
                    placeholder="15"
                    class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
                    @click.stop
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Дозировка</label>
                  <div class="relative">
                    <button 
                      @click.stop="toggleDropdown(result.id)"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 pe-9 text-left"
                      :class="{ 'ring-indigo-600': getCalculatorState(result.id).dropdownOpen }"
                    >
                      <span class="truncate">{{ getCalculatorState(result.id).selectedDose || 'Выберите' }}</span>
                      <span class="absolute inset-y-0 end-0 flex items-center pe-2.5">
                        <svg class="w-4 h-4 text-slate-400 transition-transform" :class="{ 'rotate-180': getCalculatorState(result.id).dropdownOpen }" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </span>
                    </button>

                    <!-- Выпадающий список -->
                    <div
                      v-if="getCalculatorState(result.id).dropdownOpen"
                      class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto left-0 right-0"
                      @click.stop
                    >
                      <div
                        v-for="dose in getDoseOptions(result.drugData.pediatricDose)"
                        :key="dose.label"
                        @click.stop="selectOption(result.id, dose.label)"
                        class="px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                        :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': getCalculatorState(result.id).selectedDose === dose.label }"
                      >
                        {{ dose.label }}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат (мг)</label>
                  <input 
                    :value="getCalculatorResultMg(result)"
                    type="text" 
                    readonly
                    placeholder="—"
                    class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                    @click.stop
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат (мл)</label>
                  <input 
                    :value="getCalculatorResultMl(result)"
                    type="text" 
                    readonly
                    placeholder="—"
                    class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                    @click.stop
                  />
                </div>
              </div>
              
              <!-- Кнопки копирования и шаринга -->
              <div v-if="getCalculatorResultMg(result)" class="mt-3 flex gap-2 justify-center">
                <button 
                  @click.stop="copyCalculatorResult(result)"
                  class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                  Копировать
                </button>
                <button 
                  @click.stop="shareCalculatorResult(result)"
                  class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
                  </svg>
                  Поделиться
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Сообщение "Ничего не найдено" -->
    <div v-if="showResults && currentPageResults.length === 0 && otherResults.length === 0 && searchQuery.trim()" 
         class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg z-60">
      <div class="p-4" v-if="emptyLoading">
        <div class="flex items-center gap-4">
          <USkeleton class="h-10 w-10 rounded-full" />
          <div class="grid gap-2 flex-1">
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-4 w-1/2" />
          </div>
        </div>
      </div>
      <div class="p-4 text-center" v-else>
        <p class="text-slate-600 dark:text-slate-300">Ничего не найдено</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

// Пропс для определения главной страницы
const props = defineProps<{
  isHomePage?: boolean
}>()

// Функции для работы с педиатрическими дозами (из pages/drugs/index.vue)
const parsePediatricDose = (text: string) => {
  if (!text) return []
  
  // Нормализуем запятые в десятичных числах
  const normalizedText = text.replace(/(\d+),(\d+)/g, '$1.$2')
  
  const doses = []
  const parts = normalizedText.split(/[,;]/).map(s => s.trim())
  
  for (const part of parts) {
    const rangeMatch = part.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/)
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1])
      const max = parseFloat(rangeMatch[2])
      doses.push({ label: `${min}-${max} мг/кг`, minPerKg: min, maxPerKg: max })
    } else {
      const singleMatch = part.match(/(\d+(?:\.\d+)?)/)
      if (singleMatch) {
        const value = parseFloat(singleMatch[1])
        doses.push({ label: `${value} мг/кг`, minPerKg: value, maxPerKg: value })
      }
    }
  }
  
  return doses
}

// Проверка возрастных ограничений для калькулятора
const shouldShowCalculator = (ageRestrictions?: string) => {
  if (!ageRestrictions) return true
  
  const restrictions = ageRestrictions.toLowerCase()
  const adultRestrictions = ['старше 18', 'с 18 лет', 'взрослым', '18+', 'от 18', 'для взрослых']
  
  return !adultRestrictions.some(restriction => restrictions.includes(restriction))
}

// Функция для расчета результата в мг
const calculateDoseMg = (weight: number, doseLabel: string, pediatricDose: any) => {
  if (!weight || !doseLabel || !pediatricDose) return ''
  
  const doses = Array.isArray(pediatricDose) ? pediatricDose : [pediatricDose]
  const parsedDoses = doses.flatMap(s => parsePediatricDose(s || ''))
  const pickedDose = parsedDoses.find(o => o.label === doseLabel)
  
  if (!pickedDose) return ''
  
  const w = weight
  const d = pickedDose
  
  // Если есть диапазон дозировок
  if (d.minPerKg != null && d.maxPerKg != null && d.minPerKg !== d.maxPerKg) {
    const minDose = Math.round(w * d.minPerKg)
    const maxDose = Math.round(w * d.maxPerKg)
    return `${minDose} - ${maxDose} мг`
  }
  
  // Если одна дозировка
  if (d.minPerKg != null || d.maxPerKg != null) {
    const dosePerKg = d.minPerKg ?? d.maxPerKg ?? 0
    const totalDose = Math.round(w * dosePerKg)
    return `${totalDose} мг`
  }
  
  return ''
}

// Функция для расчета результата в мл
const calculateDoseMl = (weight: number, doseLabel: string, pediatricDose: any, forms: any) => {
  if (!weight || !doseLabel || !pediatricDose || !forms) return ''
  
  const doses = Array.isArray(pediatricDose) ? pediatricDose : [pediatricDose]
  const parsedDoses = doses.flatMap(s => parsePediatricDose(s || ''))
  const pickedDose = parsedDoses.find(o => o.label === doseLabel)
  
  if (!pickedDose) return ''
  
  const w = weight
  const d = pickedDose
  
  // Получаем данные о форме выпуска
  const doseValue = forms.doseValue || 0
  const doseUnit = forms.doseUnit || ''
  const volumeMl = forms.volumeMl || 0
  
  if (!doseValue || !volumeMl) return ''
  
  // Рассчитываем концентрацию в мг/мл
  const concentrationMgPerMl = doseValue / volumeMl
  
  let requiredMg = 0
  
  // Если есть диапазон дозировок
  if (d.minPerKg != null && d.maxPerKg != null && d.minPerKg !== d.maxPerKg) {
    const avgDosePerKg = (d.minPerKg + d.maxPerKg) / 2
    requiredMg = w * avgDosePerKg
  } else if (d.minPerKg != null || d.maxPerKg != null) {
    const dosePerKg = d.minPerKg ?? d.maxPerKg ?? 0
    requiredMg = w * dosePerKg
  }
  
  if (requiredMg === 0) return ''
  
  // Рассчитываем объем в мл
  const requiredMl = Math.round((requiredMg / concentrationMgPerMl) * 100) / 100
  
  return `${requiredMl} мл`
}

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  category?: string
  url: string
  codes?: {
    mkbCode?: string
    stationCode?: string
  }
  // Поля для препаратов
  drugData?: {
    forms?: any
    pediatricDose?: any
    ageRestrictions?: string
    pediatricDoseUnit?: string
  }
}

const searchQuery = ref('')
const currentPageResults = ref<SearchResult[]>([])
const otherResults = ref<SearchResult[]>([])
const showResults = ref(false)
const isFocused = ref(false)
let searchTimeout: NodeJS.Timeout | null = null
const emptyLoading = ref(false)

// Переменные для калькулятора в результатах поиска
const calculatorStates = ref<{[key: string]: { weight: number | null, selectedDose: string, dropdownOpen: boolean }}>({})

// Функции для работы с калькулятором в результатах поиска
const getCalculatorState = (resultId: string) => {
  if (!calculatorStates.value[resultId]) {
    calculatorStates.value[resultId] = { weight: null, selectedDose: '', dropdownOpen: false }
  }
  return calculatorStates.value[resultId]
}

const toggleDropdown = (resultId: string) => {
  const state = getCalculatorState(resultId)
  state.dropdownOpen = !state.dropdownOpen
}

const selectOption = (resultId: string, label: string) => {
  const state = getCalculatorState(resultId)
  state.selectedDose = label
  state.dropdownOpen = false
}

const closeAllDropdowns = () => {
  Object.keys(calculatorStates.value).forEach(resultId => {
    calculatorStates.value[resultId].dropdownOpen = false
  })
}

// Управление скроллом теперь в BottomSearchPanel
// Убираем конфликтующие функции отсюда

const getDoseOptions = (pediatricDose: any) => {
  if (!pediatricDose) return []
  const doses = Array.isArray(pediatricDose) ? pediatricDose : [pediatricDose]
  return doses.flatMap(s => parsePediatricDose(s || ''))
}

const getCalculatorResultMg = (result: SearchResult) => {
  const state = getCalculatorState(result.id)
  if (!state.weight || !state.selectedDose || !result.drugData?.pediatricDose) return ''
  
  return calculateDoseMg(state.weight, state.selectedDose, result.drugData.pediatricDose)
}

const getCalculatorResultMl = (result: SearchResult) => {
  const state = getCalculatorState(result.id)
  if (!state.weight || !state.selectedDose || !result.drugData?.pediatricDose || !result.drugData?.forms) return ''
  
  return calculateDoseMl(state.weight, state.selectedDose, result.drugData.pediatricDose, result.drugData.forms)
}

// Функции для копирования и шаринга
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    console.log('Скопировано в буфер обмена:', text)
  } catch (err) {
    console.error('Ошибка копирования:', err)
  }
}

const copyCalculatorResult = async (result: SearchResult) => {
  const mgResult = getCalculatorResultMg(result)
  const mlResult = getCalculatorResultMl(result)
  const state = getCalculatorState(result.id)
  
  if (!mgResult) return
  
  const resultText = `${mgResult}${mlResult ? ` (${mlResult})` : ''}`
  await copyToClipboard(resultText)
}

const shareCalculatorResult = async (result: SearchResult) => {
  const mgResult = getCalculatorResultMg(result)
  const mlResult = getCalculatorResultMl(result)
  const state = getCalculatorState(result.id)
  
  if (!mgResult) return
  
  const shareText = `Расчет дозировки препарата ${result.title}:
Вес: ${state.weight} кг
Дозировка: ${state.selectedDose}
Результат: ${mgResult}${mlResult ? ` (${mlResult})` : ''}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Дозировка ${result.title}`,
        text: shareText
      })
    } catch (err) {
      console.error('Ошибка шаринга:', err)
    }
  } else {
    await copyToClipboard(shareText)
  }
}

// Реф для input элемента
const searchInput = ref<HTMLInputElement | null>(null)

// Отслеживаем изменения поискового запроса
watch(searchQuery, () => {
  onSearch()
})

// Открытие полноэкранной панели из поисковой строки хедера
function openPanelFromHeader() {
  // Сообщаем лейауту открыть панель поиска
  window.dispatchEvent(new Event('openBottomSearch'))
}

// Данные для поиска
const searchData = ref<SearchResult[]>([])
const currentPageData = ref<SearchResult[]>([])

// Получаем текущий путь для определения контекста
const route = useRoute()
const currentPath = computed(() => route.path)

// Функция для рендеринга Markdown
function renderMarkdown(text: string): string {
  if (!text) return ''
  
  // Настраиваем marked для безопасного рендеринга
  marked.setOptions({
    breaks: true,
    gfm: true
  })
  
  return marked(text) as string
}

// Загружаем данные для поиска
onMounted(async () => {
  await loadSearchData()
})

async function loadSearchData() {
  try {
    // Загружаем данные из всех разделов
    const [instructions, categories, mkbCodes, algorithms, lsCategories, lsAll, drugs] = await Promise.all([
      $fetch('/api/instructions').catch(() => ({ items: [] })),
      $fetch('/api/categories').catch(() => ({ items: [] })),
      $fetch('/api/mkb/all').catch(() => ({ items: [] })),
      // Пока нет API для алгоритмов, используем заглушку
      Promise.resolve({ items: [] }),
      $fetch('/api/local-statuses').catch(() => ({ items: [] })),
      $fetch('/api/local-statuses/all').catch(() => ({ items: [] })),
      $fetch('/api/drugs').catch(() => ({ items: [] }))
    ])

    const allResults: SearchResult[] = []
    const currentPageItems: SearchResult[] = []

    // Добавляем инструкции
    if ((instructions as any).items) {
      (instructions as any).items.forEach((item: any) => {
        const result = {
          id: `instruction-${item._id}`,
          title: item.title,
          description: item.description || 'Инструкция',
          type: 'Инструкция',
          url: `/instructions`
        }
        allResults.push(result)
        
        // Если мы на странице инструкций, добавляем в текущие данные
        if (currentPath.value === '/instructions') {
          currentPageItems.push(result)
        }
      })
    }

    // Добавляем категории МКБ
    if ((categories as any).items) {
      (categories as any).items.forEach((item: any) => {
        const result = {
          id: `category-${item._id}`,
          title: item.name,
          description: `${item.mkbCount || 0} заболеваний`,
          type: 'Категория МКБ',
          url: `/codifier/${item.url}`
        }
        allResults.push(result)
        
        // Если мы на странице кодификатора или в категории МКБ, добавляем в текущие данные
        if (currentPath.value === '/codifier' || currentPath.value.startsWith('/codifier/')) {
          currentPageItems.push(result)
        }
      })
    }

    // Добавляем МКБ коды
    if ((mkbCodes as any).items) {
      (mkbCodes as any).items.forEach((item: any) => {
        const result = {
          id: `mkb-${item._id}`,
          title: item.name,
          description: item.note || 'Заболевание МКБ',
          type: 'Заболевание МКБ',
          category: item.category?.name,
          url: `/codifier/${item.category?.url}?open=${item._id}`,
          codes: {
            mkbCode: item.mkbCode,
            stationCode: item.stationCode
          }
        }
        allResults.push(result)
      })
    }

    // Добавляем категории локальных статусов
    if ((lsCategories as any).items) {
      (lsCategories as any).items.forEach((item: any) => {
        const result = {
          id: `lscat-${item._id}`,
          title: item.name,
          description: `${item.count || 0} статусов`,
          type: 'Категория статусов',
          url: `/local-statuses/${item.url}`
        }
        allResults.push(result)
        if (currentPath.value === '/local-statuses' || currentPath.value.startsWith('/local-statuses/')) {
          currentPageItems.push(result)
        }
      })
    }

    // Добавляем локальные статусы (все)
    if ((lsAll as any).items) {
      (lsAll as any).items.forEach((item: any) => {
        const result = {
          id: `ls-${item._id}`,
          title: item.name,
          description: item.description || item.note || 'Локальный статус',
          type: 'Локальный статус',
          category: item.category?.name,
          url: `/local-statuses/${item.category?.url}?open=${item._id}`,
          codes: {
            mkbCode: item.code,
            stationCode: item.stationCode
          }
        }
        allResults.push(result)
      })
    }

    // Добавляем препараты
    if ((drugs as any).items) {
      (drugs as any).items.forEach((item: any) => {
        const formText = item.forms ? 
          `${item.forms.doseValue || ''} ${item.forms.doseUnit || ''} ${item.forms.volumeMl ? `• ${item.forms.volumeMl} мл` : ''}`.trim() : ''
        
        const synonymsText = item.synonyms && item.synonyms.length > 0 ? 
          `Аналоги: ${item.synonyms.join(', ')}` : ''
        
        const description = [
          item.latinName,
          formText,
          synonymsText,
          item.description
        ].filter(Boolean).join(' • ')
        
        const result = {
          id: `drug-${item._id}`,
          title: item.name,
          description: description,
          type: 'Препарат',
          url: `/drugs?open=${item._id}`,
          drugData: {
            forms: item.forms,
            pediatricDose: item.pediatricDose,
            ageRestrictions: item.ageRestrictions,
            pediatricDoseUnit: item.pediatricDoseUnit
          }
        }
        allResults.push(result)
        
        // Если мы на странице препаратов, добавляем в текущие данные
        if (currentPath.value === '/drugs') {
          currentPageItems.push(result)
        }
      })
    }

    // Добавляем алгоритмы (заглушка)
    const algorithmItems = [
      { title: 'Алгоритм оказания помощи при инфаркте', description: 'Стандартный протокол лечения' },
      { title: 'Алгоритм реанимации', description: 'Базовая сердечно-легочная реанимация' },
      { title: 'Алгоритм лечения гипертонии', description: 'Протокол ведения пациентов с АГ' }
    ]

    algorithmItems.forEach((item, index) => {
      const result = {
        id: `algorithm-${index}`,
        title: item.title,
        description: item.description,
        type: 'Алгоритм',
        url: '/algorithms'
      }
      allResults.push(result)
      
      // Если мы на странице алгоритмов, добавляем в текущие данные
      if (currentPath.value === '/algorithms') {
        currentPageItems.push(result)
      }
    })

    // Если мы на странице конкретной категории МКБ, загружаем заболевания этой категории
    if (currentPath.value.startsWith('/codifier/') && currentPath.value !== '/codifier') {
      try {
        const categoryUrl = currentPath.value.replace('/codifier/', '')
        const categoryData = await $fetch(`/api/codifier/${categoryUrl}`).catch(() => ({ items: [] }))
        
        if ((categoryData as any).items) {
          (categoryData as any).items.forEach((item: any) => {
            const result = {
              id: `mkb-${item._id}`,
              title: item.name,
              description: item.note || 'Заболевание МКБ',
              type: 'Заболевание МКБ',
              category: item.category?.name,
              url: `/codifier/${categoryUrl}?open=${item._id}`,
              codes: {
                mkbCode: item.mkbCode,
                stationCode: item.stationCode
              }
            }
            currentPageItems.push(result)
          })
        }
      } catch (error) {
        console.error('Ошибка загрузки данных категории:', error)
      }
    }

    // Если мы на странице конкретной категории локальных статусов, загружаем статусы этой категории
    if (currentPath.value.startsWith('/local-statuses/') && currentPath.value !== '/local-statuses') {
      try {
        const lsUrl = currentPath.value.replace('/local-statuses/', '')
        const lsData = await $fetch(`/api/local-statuses/${lsUrl}`).catch(() => ({ items: [] }))
        if ((lsData as any).items) {
          (lsData as any).items.forEach((item: any) => {
            const result = {
              id: `ls-${item._id}`,
              title: item.name,
              description: item.description || item.note || 'Локальный статус',
              type: 'Локальный статус',
              category: item.category?.name,
              url: `/local-statuses/${lsUrl}?open=${item._id}`,
              codes: {
                mkbCode: item.code,
                stationCode: item.stationCode
              }
            }
            currentPageItems.push(result)
          })
        }
      } catch (error) {
        console.error('Ошибка загрузки локальных статусов категории:', error)
      }
    }

    searchData.value = allResults
    currentPageData.value = currentPageItems
  } catch (error) {
    console.error('Ошибка загрузки данных для поиска:', error)
  }
}

function onSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      // Показываем placeholder-скелетон для пустых результатов на короткое время
      emptyLoading.value = true
      setTimeout(() => { emptyLoading.value = false }, 1200)
      performSearch()
    } else {
      showResults.value = false
    }
  }, 300) // Задержка 300мс для дебаунса
}

function clearSearch() {
  searchQuery.value = ''
  showResults.value = false
  isFocused.value = false
}

const { matchesNormalized } = useTextNormalization()

function performSearch() {
  const query = searchQuery.value.trim()
  
  if (!query) {
    showResults.value = false
    return
  }

  // Поиск по текущей странице
  const currentResults = currentPageData.value.filter(item => {
    const searchableText = [
      item.title,
      item.description,
      item.type,
      item.codes?.mkbCode,
      item.codes?.stationCode
    ].filter(Boolean).join(' ')
    
    return matchesNormalized(query, searchableText)
  })

  // Поиск по всем данным, исключая уже найденные на текущей странице
  const currentPageIds = new Set(currentResults.map(item => item.id))
  const otherResultsFiltered = searchData.value.filter(item => {
    if (currentPageIds.has(item.id)) return false
    // Исключаем результаты, ведущие на текущий раздел/страницу, чтобы не дублировать блок "На этой странице"
    if (item.url === currentPath.value) return false
    
    const searchableText = [
      item.title,
      item.description,
      item.type,
      item.codes?.mkbCode,
      item.codes?.stationCode
    ].filter(Boolean).join(' ')
    
    return matchesNormalized(query, searchableText)
  })

  currentPageResults.value = currentResults
  otherResults.value = otherResultsFiltered
  showResults.value = true
}

function navigateToResult(result: SearchResult) {
  showResults.value = false
  searchQuery.value = ''
  isFocused.value = false
  
  // Если это препарат с параметром open, переходим на страницу препаратов
  if (result.type === 'Препарат' && result.url.includes('?open=')) {
    navigateTo('/drugs')
    // Открываем модалку препарата через query параметр
    nextTick(() => {
      const drugId = result.url.split('?open=')[1]
      // Эмитим событие для открытия модалки препарата
      window.dispatchEvent(new CustomEvent('openDrugModal', { detail: { drugId } }))
    })
  } else {
    navigateTo(result.url)
  }
}

function blurSearch() {
  isFocused.value = false
  showResults.value = false
  if (searchInput.value) {
    searchInput.value.blur()
  }
}

function onFocus() {
  isFocused.value = true
  // Открываем панель поиска с чат-ботом
  window.dispatchEvent(new CustomEvent('openBottomSearch'))
}

function onBlur() {
  // Задержка для обработки кликов по результатам
  setTimeout(() => {
    if (!showResults.value) {
      isFocused.value = false
    }
  }, 150)
}

// Обработчики для ReactiveSearch
function handleSearchFocus() {
  isFocused.value = true
  window.dispatchEvent(new CustomEvent('openBottomSearch'))
}

function handleSearchBlur() {
  setTimeout(() => {
    if (!showResults.value) {
      isFocused.value = false
    }
  }, 150)
}

// Закрываем результаты при клике вне компонента
onMounted(() => {
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (!target.closest('.relative')) {
      showResults.value = false
      isFocused.value = false
      closeAllDropdowns()
    }
  })
})

// Разблокируем скролл при размонтировании компонента
onUnmounted(() => {
  // Убираем вызов unlockScroll, так как управление скроллом теперь в BottomSearchPanel
})
</script>

