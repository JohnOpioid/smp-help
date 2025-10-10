<template>
  <div v-if="isOpen" class="fixed inset-0 bg-white dark:bg-slate-900 z-[100] flex flex-col backdrop-blur-xl">
    <!-- Заголовок панели с переключателем режимов -->
    <div class="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 relative z-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <!-- Переключатель режимов -->
            <div class="flex items-center bg-white dark:bg-slate-700 rounded-lg p-1">
              <button @click="currentMode = 'search'" :class="[
                'px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                currentMode === 'search'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              ]">
                🔍 Поиск
              </button>
              <button @click="currentMode = 'chat'" :class="[
                'px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer',
                currentMode === 'chat'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              ]">
                🤖 Помощник
              </button>
            </div>

            <!-- Кнопка очистки чата -->
            <button v-if="currentMode === 'chat' && chatMessages.length > 0" @click="clearChatHistory"
              class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              title="Очистить историю чата">
              <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor"
                viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16">
                </path>
              </svg>
            </button>
          </div>

          <button @click="closePanel"
            class="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
            <svg class="w-5 h-5 text-slate-500 dark:text-slate-400" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Контентная область -->
    <div class="flex-1 overflow-y-auto" ref="contentContainer">
      <!-- Режим поиска -->
      <div v-if="currentMode === 'search'" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <!-- Результаты поиска -->
        <div v-if="isLoading" class="space-y-4">
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
          <USkeleton class="h-16 w-full" />
        </div>

        <div v-else-if="searchQuery && results.length === 0" class="text-center py-8">
          <svg class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p class="text-slate-500 dark:text-slate-400">Ничего не найдено</p>
        </div>

        <div v-else-if="searchQuery && results.length > 0" class="space-y-6">
          <!-- Результаты с текущей страницы -->
          <div v-if="currentPageResults.length > 0">
            <div class="relative my-4">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-slate-200 dark:border-slate-600"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">На этой
                  странице</span>
              </div>
            </div>

            <div v-for="result in currentPageResults" :key="result.id"
              class="rounded-md overflow-visible border border-slate-200 dark:border-slate-600 mb-2">
              <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                @click="navigateToResult(result)">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                    <p v-if="result.type === 'drug' && result.data?.latinName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ result.data.latinName }}</p>
                    <p v-if="result.type === 'drug' && result.data?.forms && (result.data.forms.doseValue || result.data.forms.doseUnit || result.data.forms.volumeMl)" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {{ formatDrugForm(result.data.forms) }}
                    </p>
                    <div v-if="result.type !== 'drug' && result.type !== 'mkb'"
                      class="text-sm text-slate-600 dark:text-slate-300 mt-1 prose prose-sm max-w-none dark:prose-invert line-clamp-3"
                      v-html="renderMarkdown(result.description)"></div>
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">{{
                        result.type }}</span>
                      <span v-if="result.category"
                        class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">{{
                        result.category }}</span>
                      <span v-if="result.codes?.mkbCode"
                        class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-mono">МКБ:
                        {{ result.codes.mkbCode }}</span>
                      <span v-if="result.codes?.stationCode"
                        class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-mono">Станция:
                        {{ result.codes.stationCode }}</span>
                    </div>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              <!-- Футер с калькулятором (не кликабельный) -->
              <div
                v-if="result.type === 'Препарат' && shouldShowCalculator(result.drugData?.ageRestrictions) && result.drugData?.pediatricDose"
                class="border-t border-slate-200 dark:border-slate-600 p-3 bg-slate-50 dark:bg-slate-800/50 overflow-visible"
                @click.stop>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Калькулятор детской дозы</div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Вес (кг)</label>
                    <input v-model.number="getCalculatorState(result.id).weight" type="number" min="0" step="0.1"
                      placeholder="15"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
                      @click.stop />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Дозировка</label>
                    <div class="relative">
                      <button @click.stop="toggleDropdown(result.id)"
                        class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 pe-9 text-left"
                        :class="{ 'ring-indigo-600': getCalculatorState(result.id).dropdownOpen }">
                        <span class="truncate">{{ getCalculatorState(result.id).selectedDose || 'Выберите' }}</span>
                        <span class="absolute inset-y-0 end-0 flex items-center pe-2.5">
                          <svg class="w-4 h-4 text-slate-400 transition-transform"
                            :class="{ 'rotate-180': getCalculatorState(result.id).dropdownOpen }" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </span>
                      </button>

                      <!-- Выпадающий список -->
                      <div v-if="getCalculatorState(result.id).dropdownOpen"
                        class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto left-0 right-0"
                        @click.stop>
                        <div v-for="dose in getDoseOptions(result.drugData.pediatricDose)" :key="dose.label"
                          @click.stop="selectOption(result.id, dose.label)"
                          class="px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': getCalculatorState(result.id).selectedDose === dose.label }">
                          {{ dose.label }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат
                      (мг)</label>
                    <input :value="getCalculatorResultMg(result)" type="text" readonly placeholder="—"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                      @click.stop />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат
                      (мл)</label>
                    <input :value="getCalculatorResultMl(result)" type="text" readonly placeholder="—"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                      @click.stop />
                  </div>
                </div>

                <!-- Кнопки копирования и шаринга -->
                <div v-if="getCalculatorResultMg(result)" class="mt-3 flex gap-2 justify-center">
                  <button @click.stop="copyCalculatorResult(result)"
                    class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z">
                      </path>
                    </svg>
                    Копировать
                  </button>
                  <button @click.stop="shareCalculatorResult(result)"
                    class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z">
                      </path>
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
                <span class="px-3 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium">В других
                  разделах</span>
              </div>
            </div>

            <div v-for="result in otherResults" :key="result.id"
              class="rounded-md overflow-visible border border-slate-200 dark:border-slate-600 mb-2">
              <div class="p-3 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                @click="navigateToResult(result)">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                    <p v-if="result.type === 'drug' && result.data?.latinName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ result.data.latinName }}</p>
                    <p v-if="result.type === 'drug' && result.data?.forms && (result.data.forms.doseValue || result.data.forms.doseUnit || result.data.forms.volumeMl)" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      {{ formatDrugForm(result.data.forms) }}
                    </p>
                    <div v-if="result.type !== 'drug' && result.type !== 'mkb'"
                      class="text-sm text-slate-600 dark:text-slate-300 mt-1 prose prose-sm max-w-none dark:prose-invert line-clamp-3"
                      v-html="renderMarkdown(result.description)"></div>
                    <div class="flex items-center gap-2 mt-2 flex-wrap">
                      <span
                        class="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded">{{
                        result.type }}</span>
                      <span v-if="result.category"
                        class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded">{{
                        result.category }}</span>
                      <span v-if="result.codes?.mkbCode"
                        class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded font-mono">МКБ:
                        {{ result.codes.mkbCode }}</span>
                      <span v-if="result.codes?.stationCode"
                        class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded font-mono">Станция:
                        {{ result.codes.stationCode }}</span>
                    </div>
                  </div>
                  <svg class="w-4 h-4 text-slate-400 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                  </svg>
                </div>
              </div>

              <!-- Футер с калькулятором (не кликабельный) -->
              <div
                v-if="result.type === 'Препарат' && shouldShowCalculator(result.drugData?.ageRestrictions) && result.drugData?.pediatricDose"
                class="border-t border-slate-200 dark:border-slate-600 p-3 bg-slate-50 dark:bg-slate-800/50 overflow-visible"
                @click.stop>
                <div class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Калькулятор детской дозы</div>
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Вес (кг)</label>
                    <input v-model.number="getCalculatorState(result.id).weight" type="number" min="0" step="0.1"
                      placeholder="15"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600"
                      @click.stop />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Дозировка</label>
                    <div class="relative">
                      <button @click.stop="toggleDropdown(result.id)"
                        class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 pe-9 text-left"
                        :class="{ 'ring-indigo-600': getCalculatorState(result.id).dropdownOpen }">
                        <span class="truncate">{{ getCalculatorState(result.id).selectedDose || 'Выберите' }}</span>
                        <span class="absolute inset-y-0 end-0 flex items-center pe-2.5">
                          <svg class="w-4 h-4 text-slate-400 transition-transform"
                            :class="{ 'rotate-180': getCalculatorState(result.id).dropdownOpen }" fill="none"
                            stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7">
                            </path>
                          </svg>
                        </span>
                      </button>

                      <!-- Выпадающий список -->
                      <div v-if="getCalculatorState(result.id).dropdownOpen"
                        class="absolute z-50 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md shadow-lg max-h-60 overflow-auto left-0 right-0"
                        @click.stop>
                        <div v-for="dose in getDoseOptions(result.drugData.pediatricDose)" :key="dose.label"
                          @click.stop="selectOption(result.id, dose.label)"
                          class="px-3 py-2 text-sm text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                          :class="{ 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400': getCalculatorState(result.id).selectedDose === dose.label }">
                          {{ dose.label }}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат
                      (мг)</label>
                    <input :value="getCalculatorResultMg(result)" type="text" readonly placeholder="—"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                      @click.stop />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Результат
                      (мл)</label>
                    <input :value="getCalculatorResultMl(result)" type="text" readonly placeholder="—"
                      class="w-full px-3 py-2 text-sm rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-600 cursor-not-allowed bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300"
                      @click.stop />
                  </div>
                </div>

                <!-- Кнопки копирования и шаринга -->
                <div v-if="getCalculatorResultMg(result)" class="mt-3 flex gap-2 justify-center">
                  <button @click.stop="copyCalculatorResult(result)"
                    class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z">
                      </path>
                    </svg>
                    Копировать
                  </button>
                  <button @click.stop="shareCalculatorResult(result)"
                    class="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors flex items-center gap-1">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z">
                      </path>
                    </svg>
                    Поделиться
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center py-8">
          <svg class="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor"
            viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p class="text-slate-500 dark:text-slate-400">Введите запрос для поиска</p>
        </div>
      </div>

      <!-- Режим чата -->
      <div v-else-if="currentMode === 'chat'" class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div class="space-y-4">
          <!-- Приветственное сообщение -->
          <div v-if="chatMessages.length === 0" class="flex items-start gap-3">
            <div class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
                </path>
              </svg>
            </div>
            <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 max-w-2xl">
              <p class="text-slate-900 dark:text-white mb-3">
                Привет! Я помощник СМП. Могу помочь найти информацию о:
              </p>
              <div class="flex flex-wrap gap-2">
                <button @click="sendQuickMessage('Покажи диагнозы по коду МКБ')"
                  class="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors">
                  📋 Диагнозах МКБ
                </button>
                <button @click="sendQuickMessage('Найди препарат для лечения')"
                  class="inline-flex items-center px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                  💊 Препаратах
                </button>
                <button @click="sendQuickMessage('Покажи инструкции по процедурам')"
                  class="inline-flex items-center px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors">
                  📖 Инструкциях
                </button>
                <button @click="sendQuickMessage('Где находится ближайшая подстанция?')"
                  class="inline-flex items-center px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-sm hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors">
                  🏥 Подстанциях
                </button>
              </div>
            </div>
          </div>

          <!-- Сообщения чата -->
          <div v-for="message in chatMessages" :key="message.id" class="flex items-start gap-3"
            :class="message.isUser ? 'flex-row-reverse' : ''">
            <!-- Аватар -->
            <div v-if="!message.isUser"
              class="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z">
                </path>
              </svg>
            </div>
            <div v-else class="w-8 h-8 bg-slate-600 rounded-full flex items-center justify-center flex-shrink-0">
              <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
              </svg>
            </div>

            <!-- Сообщение -->
            <div class="max-w-2xl" :class="message.isUser ? 'text-right' : ''">
              <UContextMenu :items="getContextMenuItems(message)">
                <div class="rounded-lg p-2"
                  :class="message.isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'">
                  <div v-if="message.isLoading" class="flex items-center gap-3">
                    <div class="flex space-x-1">
                      <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce"></div>
                      <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.1s">
                      </div>
                      <div class="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" style="animation-delay: 0.2s">
                      </div>
                    </div>
                    <span class="text-slate-600 dark:text-slate-300">{{ message.text }}</span>
                  </div>

                  <div v-else>
                    <!-- Режим редактирования -->
                    <div v-if="editingMessageId === message.id" class="space-y-3">
                      <textarea v-model="editingText"
                        class="w-full p-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-none"
                        rows="3" @keydown.enter.ctrl="saveEditMessage" @keydown.escape="cancelEditMessage"></textarea>
                      <div class="flex gap-2 justify-end">
                        <button @click="cancelEditMessage"
                          class="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                          Отмена
                        </button>
                        <button @click="saveEditMessage"
                          class="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                          Сохранить
                        </button>
                      </div>
                    </div>

                    <!-- Обычный режим -->
                    <div v-else>
                      <div 
                        class="max-w-none text-slate-900 dark:text-white leading-relaxed"
                        :class="message.isUser ? 'text-white' : ''"
                        v-html="renderMarkdown(message.text)"
                      ></div>

                      <!-- Результаты поиска в чате -->
                      <div v-if="message.results && message.results.length > 0" class="mt-4 space-y-3">
                        <div v-for="result in message.results" :key="result.id"
                          class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
                          <!-- Основное содержимое результата -->
                          <div class="p-3">
                            <div class="flex items-start justify-between">
                                   <div class="flex-1">
                                     <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title }}</h4>
                                     <p v-if="result.type === 'drug' && result.data?.latinName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ result.data.latinName }}</p>
                                     <p v-if="result.type === 'drug' && result.data?.forms && (result.data.forms.doseValue || result.data.forms.doseUnit || result.data.forms.volumeMl)" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                       {{ formatDrugForm(result.data.forms) }}
                                     </p>
                                     <p v-if="result.type === 'drug' && result.data?.synonyms && result.data.synonyms.length > 0" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                       Аналоги: {{ Array.isArray(result.data.synonyms) ? result.data.synonyms.join(', ') : result.data.synonyms }}
                                     </p>
                                     <p v-if="result.type !== 'drug' && result.type !== 'mkb'" class="text-sm text-slate-600 dark:text-slate-300 mt-1">{{ result.description }}</p>

                                <!-- Коды МКБ -->
                                <div v-if="result.codes" class="flex items-center gap-2 mt-2">
                                  <span v-if="result.codes.mkbCode"
                                    class="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">
                                    МКБ: {{ result.codes.mkbCode }}
                                  </span>
                                  <span v-if="result.codes.stationCode"
                                    class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs font-mono text-blue-700 dark:text-blue-300">
                                    Станция: {{ result.codes.stationCode }}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <!-- Инлайн кнопки действий под контейнером -->
                          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                            <div class="flex flex-wrap gap-1 pt-2">
                                     <button v-if="result.type === 'drug'" @click="openDrugPage(result)"
                                       class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0">
                                       <UIcon name="i-lucide-pill" class="w-3 h-3" />
                                       Подробнее
                                     </button>
                                     <button v-if="result.type === 'mkb'" @click="openMkbModal(result)"
                                       class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0">
                                       <UIcon name="i-lucide-clipboard-list" class="w-3 h-3" />
                                       Открыть
                                     </button>
                                     <button v-if="result.type === 'instruction'" @click="navigateTo(result.url); closePanel()"
                                       class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors border-0">
                                       <UIcon name="i-lucide-book-open" class="w-3 h-3" />
                                       Инструкция
                                     </button>
                                     <button v-if="result.type === 'local-status'" @click="navigateTo(result.url); closePanel()"
                                       class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors border-0">
                                       <UIcon name="i-lucide-tag" class="w-3 h-3" />
                                       Статус
                                     </button>
                                     <button v-if="result.type === 'substation'" @click="navigateTo(result.url); closePanel()"
                                       class="inline-flex items-center gap-1 px-2 py-1 bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300 rounded-full text-xs hover:bg-cyan-200 dark:hover:bg-cyan-800 transition-colors border-0">
                                       <UIcon name="i-lucide-building-2" class="w-3 h-3" />
                                       Подстанция
                                     </button>
                                     <button @click="copyToClipboard(result.title + ': ' + result.description)"
                                       class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0">
                                       <UIcon name="i-lucide-copy" class="w-3 h-3" />
                                       Копировать
                                     </button>
                            </div>
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              </UContextMenu>

              <!-- Быстрые ответы вне блока сообщения -->
              <div v-if="shouldShowQuickReplies(message)" class="flex flex-wrap gap-2 mt-3 text-left">
                <!-- Специальные кнопки для препаратов -->
                <template v-if="hasDrugResults(message)">
                  <button 
                    @click="navigateTo('/drugs'); closePanel()"
                    class="inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-sm hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                  >
                    <UIcon name="i-lucide-pill" class="w-4 h-4" />
                    Открыть все препараты
                  </button>
                  <button 
                    v-if="hasCalculatorDrugs(message)"
                    @click="sendCalculatorMessage(message)"
                    class="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <UIcon name="i-lucide-calculator" class="w-4 h-4" />
                    Открыть калькулятор
                  </button>
                </template>
                
                <!-- Обычные быстрые ответы для других типов -->
                <template v-else>
                  <button 
                    v-for="reply in message.quickReplies" 
                    :key="reply"
                    @click="handleQuickReply(reply, message)"
                    class="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                  >
                    {{ reply }}
                  </button>
                </template>
              </div>

              <!-- Футер с learning-note (если есть) -->
              <div v-if="!message.isUser && hasLearningNote(message.text)" class="mt-3 pt-2 border-t border-slate-200 dark:border-slate-600">
                <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <UIcon name="i-lucide-info" class="w-3 h-3 flex-shrink-0" />
                  <span>{{ extractLearningNote(message.text) }}</span>
                </div>
              </div>

              <!-- Время сообщения и оценка (только для ответов бота) -->
              <div class="flex items-center justify-between mt-1">
                <div class="text-xs text-slate-400">
                  {{ formatTime(message.timestamp) }}
                </div>
                
                <!-- Кнопки оценки для ответов бота -->
                <div v-if="!message.isUser && !message.isLoading" class="flex items-center gap-2">
                  <button
                    @click="rateBotResponse(message, 'positive')"
                    :class="[
                      'p-1 rounded-full transition-colors text-xs',
                      message.userRating === 'positive' 
                        ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' 
                        : 'text-slate-400 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                    ]"
                    :disabled="!!message.userRating"
                    title="Хороший ответ"
                  >
                    <UIcon name="i-lucide-thumbs-up" class="w-4 h-4" />
                  </button>
                  
                  <button
                    @click="rateBotResponse(message, 'negative')"
                    :class="[
                      'p-1 rounded-full transition-colors text-xs',
                      message.userRating === 'negative' 
                        ? 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400' 
                        : 'text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                    ]"
                    :disabled="!!message.userRating"
                    title="Плохой ответ"
                  >
                    <UIcon name="i-lucide-thumbs-down" class="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Футер панели -->
    <div class="border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 relative z-10">
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <!-- Форма поиска для режима поиска -->
        <div v-if="currentMode === 'search'" class="relative z-10">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Введите запрос для поиска..."
            class="block w-full pl-10 pr-20 sm:pl-12 sm:pr-24 py-3 sm:py-4 text-base sm:text-base border border-slate-100 dark:border-slate-600 md:rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200"
            @input="onSearch" @keydown.enter="performSearchButton">
          <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3">
            <button @click="performSearchButton"
              class="inline-flex items-center px-3 sm:px-6 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200">
              <span class="hidden sm:inline">Найти</span>
              <svg class="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </button>
          </div>
        </div>

        <!-- Форма чата для режима чата -->
        <div v-else-if="currentMode === 'chat'" class="flex items-center gap-3">
          <div class="flex-1 relative">
            <input ref="chatInput" v-model="currentChatMessage" type="text"
              placeholder="Задайте вопрос о диагнозах, препаратах или процедурах..."
              class="block w-full pl-4 pr-12 py-3 text-base border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200"
              @keydown.enter="sendChatMessage" :disabled="isChatProcessing">
            <button @click="sendChatMessage" :disabled="!currentChatMessage.trim() || isChatProcessing"
              class="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-indigo-600 hover:text-indigo-700 disabled:text-slate-400 disabled:cursor-not-allowed transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'

// Получаем текущий путь для определения контекста
const route = useRoute()
const currentPath = computed(() => route.path)

interface SearchResult {
  id: string
  title: string
  description: string
  type: string
  category?: string
  url?: string
  codes?: {
    mkbCode?: string
    stationCode?: string
  }
  data?: any
  // Поля для препаратов
  drugData?: {
    forms?: any
    pediatricDose?: any
    ageRestrictions?: string
    pediatricDoseUnit?: string
  }
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

// Режим панели с сохранением в localStorage
const currentMode = ref<'search' | 'chat'>('search')

// Переменные для чата
interface ChatMessage {
  id: string
  text: string
  isUser: boolean
  timestamp: Date
  isLoading?: boolean
  results?: SearchResult[]
  quickReplies?: string[]
  userRating?: 'positive' | 'negative'
  originalQuestion?: string // Для связи ответа с вопросом
}

const chatMessages = ref<ChatMessage[]>([])
const currentChatMessage = ref('')
const isChatProcessing = ref(false)
const chatInput = ref<HTMLInputElement>()
const contentContainer = ref<HTMLElement>()
const editingMessageId = ref<string | null>(null)
const editingText = ref('')

const searchQuery = ref('')
const isLoading = ref(false)
const results = ref<SearchResult[]>([])
const currentPageResults = ref<SearchResult[]>([])
const otherResults = ref<SearchResult[]>([])
const searchInput = ref<HTMLInputElement>()

// Переменные для калькулятора в результатах поиска
const calculatorStates = ref<{ [key: string]: { weight: number | null, selectedDose: string, dropdownOpen: boolean } }>({})

// Функции для работы с педиатрическими дозами (из SearchBar)
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
      doses.push({
        label: `${min}-${max} мг/кг`,
        minPerKg: min,
        maxPerKg: max
      })
    } else {
      const singleMatch = part.match(/(\d+(?:\.\d+)?)/)
      if (singleMatch) {
        const value = parseFloat(singleMatch[1])
        doses.push({
          label: `${value} мг/кг`,
          minPerKg: value,
          maxPerKg: value
        })
      }
    }
  }

  return doses
}

const shouldShowCalculator = (ageRestrictions?: string) => {
  if (!ageRestrictions) return true

  const restrictions = ageRestrictions.toLowerCase()
  return !restrictions.includes('старше 18') &&
    !restrictions.includes('с 18 лет') &&
    !restrictions.includes('взрослым')
}

const calculateDoseMg = (weight: number, doseLabel: string, pediatricDose: any) => {
  if (!weight || !doseLabel || !pediatricDose) return ''

  const doses = Array.isArray(pediatricDose) ? pediatricDose : [pediatricDose]
  const parsedDoses = doses.flatMap(s => parsePediatricDose(s || ''))

  const selectedDose = parsedDoses.find(d => d.label === doseLabel)
  if (!selectedDose) return ''

  const avgDose = (selectedDose.minPerKg + selectedDose.maxPerKg) / 2
  const totalMg = weight * avgDose

  return `${totalMg.toFixed(1)} мг`
}

const calculateDoseMl = (weight: number, doseLabel: string, pediatricDose: any, forms: any) => {
  if (!weight || !doseLabel || !pediatricDose || !forms) return ''

  const doses = Array.isArray(pediatricDose) ? pediatricDose : [pediatricDose]
  const parsedDoses = doses.flatMap(s => parsePediatricDose(s || ''))

  const selectedDose = parsedDoses.find(d => d.label === doseLabel)
  if (!selectedDose) return ''

  const avgDose = (selectedDose.minPerKg + selectedDose.maxPerKg) / 2
  const totalMg = weight * avgDose

  // Рассчитываем концентрацию в ампуле
  const doseValue = forms.doseValue || 0
  const volumeMl = forms.volumeMl || 1
  const concentrationPerMl = doseValue / volumeMl

  if (concentrationPerMl === 0) return ''

  const requiredMl = totalMg / concentrationPerMl

  return `${requiredMl.toFixed(2)} мл`
}

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

// Функция для аккуратного рендеринга Markdown
const renderMarkdown = (text: string): string => {
  if (!text) return ''
  
  let html = text
  
  // Обрабатываем карточки МКБ кодов ПЕРВЫМИ
  html = html.replace(/<mkb-cards>([\s\S]*?)<\/mkb-cards>/g, (match, cardsContent) => {
    const cards = cardsContent.trim().split('\n').filter((line: string) => line.trim())
    
    if (cards.length === 0) return ''
    
    const cardElements = cards.map((card: string) => {
      const [code, name, category, note, stationCode] = card.split('|')
      return `
        <div class="flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col">
          <!-- Основное содержимое карточки -->
          <div class="p-3 flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-slate-900 dark:text-white text-sm">${name}</h4>
                ${note ? `<p class="text-xs text-slate-600 dark:text-slate-400 italic mt-1">${note}</p>` : ''}
                
                <!-- Коды МКБ, станции и категория -->
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">МКБ: ${code}</span>
                  ${stationCode ? `<span class="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs font-mono text-green-700 dark:text-green-300">Станция: ${stationCode}</span>` : ''}
                  <span class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">${category}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Футер с кнопками действий (всегда внизу) -->
          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 mt-auto">
            <div class="flex flex-wrap gap-1 pt-2">
              <button onclick="openMKBCode('${code}', '${category}')" class="mkb-open-btn inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Открыть
              </button>
              <button onclick="copyMKBInfo('${code}', '${name}', '${stationCode || ''}')" class="mkb-copy-btn inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Копировать
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')
    
    if (cards.length === 1) {
      return `<div class="my-4">${cardElements}</div>`
    } else {
      return `
        <div class="my-4">
          <div class="mkb-slider-container relative overflow-hidden">
            <div class="mkb-slider flex gap-1 xs:gap-2 sm:gap-3 pb-2 px-2 -mx-2 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing" style="transform: translateX(0px);">
              ${cardElements}
            </div>
          </div>
        </div>
      `
    }
  })
  
  // Обрабатываем карточки препаратов
  html = html.replace(/<drug-cards>([\s\S]*?)<\/drug-cards>/g, (match, cardsContent) => {
    const cards = cardsContent.trim().split('\n').filter((line: string) => line.trim())
    
    if (cards.length === 0) return ''
    
    const cardElements = cards.map((card: string) => {
      const [name, latinName, forms, analogs, drugId] = card.split('|')
      return `
        <div class="flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col">
          <!-- Основное содержимое карточки -->
          <div class="p-3 flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-slate-900 dark:text-white text-sm">${name}</h4>
                ${latinName ? `<p class="text-xs text-slate-600 dark:text-slate-400 italic mt-1">${latinName}</p>` : ''}
                ${forms ? `<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${forms}</p>` : ''}
                ${analogs ? `<p class="text-xs text-slate-600 dark:text-slate-400 mt-1">Аналоги: ${analogs}</p>` : ''}
                
                <!-- Категория препарата -->
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  <span class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">Препарат</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Футер с кнопками действий (всегда внизу) -->
          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 mt-auto">
            <div class="flex flex-wrap gap-1 pt-2">
              <button onclick="openDrugDetails('${drugId}', '${name}')" class="drug-open-btn inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Подробнее
              </button>
              <button onclick="copyDrugInfo('${name}', '${latinName}', '${forms}')" class="drug-copy-btn inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Копировать
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')
    
    if (cards.length === 1) {
      // Для одной карточки делаем её на полную ширину
      const fullWidthCard = cardElements.replace(
        'flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80',
        'w-full max-w-none'
      )
      return `<div class="my-4">${fullWidthCard}</div>`
    } else {
      return `
        <div class="my-4">
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
            ${cardElements}
          </div>
        </div>
      `
    }
  })

  // Обрабатываем карточки подстанций
  html = html.replace(/<substation-cards>([\s\S]*?)<\/substation-cards>/g, (match, cardsContent) => {
    const cards = cardsContent.trim().split('\n').filter((line: string) => line.trim())
    
    if (cards.length === 0) return ''
    
    const cardElements = cards.map((card: string) => {
      const [name, address, phones, coords] = card.split('|')
      return `
        <div class="flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80 bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden flex flex-col">
          <!-- Основное содержимое карточки -->
          <div class="p-3 flex-1">
            <div class="flex items-start justify-between">
              <div class="flex-1">
                <h4 class="font-medium text-slate-900 dark:text-white text-sm">${name}</h4>
                <p class="text-xs text-slate-600 dark:text-slate-400 mt-1">${address}</p>
                
                <!-- Телефоны -->
                <div class="flex items-center gap-2 mt-2 flex-wrap">
                  ${phones && phones !== 'Не указан' && phones.trim() ? 
                    `<span class="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs font-mono text-green-700 dark:text-green-300">📞 ${phones}</span>` :
                    `<span class="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs text-gray-600 dark:text-gray-400">📞 нет данных</span>`
                  }
                </div>
              </div>
            </div>
          </div>
          
          <!-- Футер с кнопками действий (всегда внизу) -->
          <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50 mt-auto">
            <div class="flex flex-wrap gap-1 pt-2">
              ${coords ? `<button onclick="openSubstationMap('${coords}', '${name}')" class="substation-map-btn inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Карта
              </button>` : ''}
              ${phones && phones !== 'Не указан' && phones.trim() ? 
                `<button onclick="callSubstation('${phones}')" class="substation-call-btn inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer">
                  <span class="w-3 h-3 inline-block"></span> Позвонить
                </button>` :
                `<span class="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-full text-xs">
                  <span class="w-3 h-3 inline-block"></span> Нет телефона
                </span>`
              }
              <button onclick="copySubstationInfo('${name}', '${address}', '${phones}')" class="substation-copy-btn inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                <span class="w-3 h-3 inline-block"></span> Копировать
              </button>
            </div>
          </div>
        </div>
      `
    }).join('')
    
    if (cards.length === 1) {
      // Для одной карточки делаем её на полную ширину
      const fullWidthCard = cardElements.replace(
        'flex-shrink-0 w-56 xs:w-64 sm:w-72 md:w-80',
        'w-full max-w-none'
      )
      return `<div class="my-4">${fullWidthCard}</div>`
    } else {
      return `
        <div class="my-4">
          <div class="substation-slider-container relative overflow-hidden">
            <div class="substation-slider flex gap-1 xs:gap-2 sm:gap-3 pb-2 px-2 -mx-2 transition-transform duration-300 ease-out cursor-grab active:cursor-grabbing" style="transform: translateX(0px);">
              ${cardElements}
            </div>
          </div>
        </div>
      `
    }
  })
  
  // Обрабатываем запросы геолокации
  html = html.replace(/<geolocation-request>([\s\S]*?)<\/geolocation-request>/g, (match, content) => {
    return `
      <div class="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <div class="flex items-start gap-3">
          <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
            </svg>
          </div>
          <div class="flex-1">
            <p class="text-sm text-blue-800 dark:text-blue-200 mb-3">${content.trim()}</p>
            <button onclick="requestGeolocation()" class="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
              </svg>
              Определить местоположение
            </button>
          </div>
        </div>
      </div>
    `
  })
  
  // Обрабатываем learning-note теги (скрываем из основного текста, но помечаем для футера)
  html = html.replace(/<learning-note>(.*?)<\/learning-note>/g, 
    '<div class="learning-note-footer" style="display: none;">$1</div>')
  
  // Эмодзи заголовки - просто жирный текст с эмодзи
  html = html.replace(/(🔍|💊|📋|💉|⚠️|🏥|💡)\s*\*\*(.*?)\*\*/g, 
    '<div class="mt-3 mb-1"><span class="mr-2">$1</span><strong class="font-semibold">$2</strong></div>')
  
  // Обычный жирный текст **text**
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-slate-800 dark:text-slate-200">$1</strong>')
  
  // Курсив *text*
  html = html.replace(/\*(.*?)\*/g, '<em class="italic text-slate-700 dark:text-slate-300">$1</em>')
  
  // Медицинские термины в скобках (ГБ)
  html = html.replace(/\(([А-ЯЁ]{1,5})\)/g, '<span class="text-slate-600 dark:text-slate-400 font-medium">($1)</span>')
  
  // Заголовки (поддерживаем все уровни Markdown)
  html = html.replace(/^###### (.*$)/gm, '<h6 class="text-sm font-medium text-slate-600 dark:text-slate-400 mt-1 mb-1">$1</h6>')
  html = html.replace(/^##### (.*$)/gm, '<h5 class="text-sm font-medium text-slate-600 dark:text-slate-400 mt-2 mb-1">$1</h5>')
  html = html.replace(/^#### (.*$)/gm, '<h4 class="text-base font-medium text-slate-700 dark:text-slate-300 mt-2 mb-1">$1</h4>')
  html = html.replace(/^### (.*$)/gm, '<h3 class="text-lg font-semibold mt-3 mb-2">$1</h3>')
  html = html.replace(/^## (.*$)/gm, '<h2 class="text-xl font-semibold mt-3 mb-2">$1</h2>')
  html = html.replace(/^# (.*$)/gm, '<h1 class="text-2xl font-bold mt-3 mb-2">$1</h1>')
  
  // Медицинские значения - просто моноширинный шрифт
  html = html.replace(/(\d+(?:\.\d+)?)\s*(мг|мл|кг|г|л|мкг|мг\/кг|мг\/мл|мкг\/мл)/g, 
    '<span class="font-mono font-medium">$1 $2</span>')
  
  // Диапазоны доз - тоже моноширинный
  html = html.replace(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*(мг|мл|кг|г|л|мкг|мг\/кг|мг\/мл|мкг\/мл)/g, 
    '<span class="font-mono font-medium">$1 - $2 $3</span>')
  
  // Списки - text
  html = html.replace(/^- (.*$)/gm, '<li class="mb-1">$1</li>')
  
  // Код `code`
  html = html.replace(/`([^`]*)`/g, '<code class="bg-slate-100 dark:bg-slate-700 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
  
  // Переносы строк - только двойные для разделения блоков
  html = html.replace(/\n\n/g, '<div class="mb-3"></div>')
  
  // Обертываем списки в ul с правильными отступами
  html = html.replace(/(<li class="mb-1">.*?<\/li>(?:\n)*)+/g, (match) => {
    return `<ul class="list-disc list-inside space-y-1 ml-6 mb-3">${match.replace(/\n/g, '')}</ul>`
  })
  
  // Убираем одиночные переносы строк только после обработки списков
  html = html.replace(/\n/g, ' ')
  
  return html
}

// Настройка marked (оставляем для совместимости, но используем кастомную функцию)
marked.setOptions({
  breaks: true,
  gfm: true
})

const closePanel = () => {
  emit('close')
  searchQuery.value = ''
}

// Функции для обработки learning-note
const hasLearningNote = (text: string): boolean => {
  return text.includes('<learning-note-footer>')
}

const extractLearningNote = (text: string): string => {
  const match = text.match(/<div class="learning-note-footer">(.*?)<\/div>/)
  return match ? match[1] : ''
}

// Функция для инициализации иконок в МКБ кнопках
const initializeMKBIcons = () => {
  nextTick(() => {
    // Инициализируем иконки для кнопок открытия
    document.querySelectorAll('.mkb-open-btn span').forEach(span => {
      if (!span.innerHTML) {
        span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>'
      }
    })
    
    // Инициализируем иконки для кнопок копирования
    document.querySelectorAll('.mkb-copy-btn span').forEach(span => {
      if (!span.innerHTML) {
        span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>'
      }
    })
    
    // Инициализируем иконки для кнопок подстанций
    document.querySelectorAll('.substation-map-btn span').forEach(span => {
      if (!span.innerHTML) {
        span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>'
      }
    })
    
    document.querySelectorAll('.substation-call-btn span').forEach(span => {
      if (!span.innerHTML) {
        span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>'
      }
    })
    
    document.querySelectorAll('.substation-copy-btn span').forEach(span => {
      if (!span.innerHTML) {
        span.innerHTML = '<svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>'
      }
    })
    
    // Инициализируем слайдеры МКБ карточек
    initializeMKBSliders()
    
    // Инициализируем слайдеры подстанций
    initializeSubstationSliders()
  })
}

// Функция для инициализации drag-and-drop слайдеров
const initializeMKBSliders = () => {
  document.querySelectorAll('.mkb-slider:not([data-initialized])').forEach(sliderElement => {
    const slider = sliderElement as HTMLElement
    slider.dataset.initialized = 'true'
    
    let isDragging = false
    let startX = 0
    let currentTranslate = 0
    let prevTranslate = 0
    let animationId = 0
    
    // Пересчитываем размеры при каждом взаимодействии
    const getConstraints = () => {
      const container = slider.parentElement as HTMLElement
      const containerWidth = container.offsetWidth
      const sliderWidth = slider.scrollWidth
      return Math.min(0, containerWidth - sliderWidth)
    }
    
    // Функция для установки позиции
    const setSliderPosition = () => {
      slider.style.transform = `translateX(${currentTranslate}px)`
    }
    
    // Функция анимации
    const animation = () => {
      setSliderPosition()
      if (isDragging) {
        animationId = requestAnimationFrame(animation)
      }
    }
    
    // Обработчики событий мыши
    const handleMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent
      
      // Проверяем, что клик не по кнопке
      const target = mouseEvent.target as HTMLElement
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return
      }
      
      isDragging = true
      startX = mouseEvent.clientX
      prevTranslate = currentTranslate
      
      slider.classList.remove('transition-transform')
      slider.classList.add('cursor-grabbing')
      slider.style.userSelect = 'none'
      
      animationId = requestAnimationFrame(animation)
      e.preventDefault()
    }
    
    const handleMouseMove = (e: Event) => {
      if (!isDragging) return
      
      const mouseEvent = e as MouseEvent
      const currentX = mouseEvent.clientX
      const deltaX = currentX - startX
      const maxTranslate = getConstraints()
      
      currentTranslate = Math.max(maxTranslate, Math.min(0, prevTranslate + deltaX))
      e.preventDefault()
    }
    
    const handleMouseUp = (e: Event) => {
      if (!isDragging) return
      
      isDragging = false
      cancelAnimationFrame(animationId)
      
      slider.classList.add('transition-transform')
      slider.classList.remove('cursor-grabbing')
      slider.style.userSelect = ''
      
      // Сохраняем финальную позицию
      prevTranslate = currentTranslate
    }
    
    // Обработчики событий касания для мобильных
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent
      isDragging = true
      startX = touchEvent.touches[0].clientX
      prevTranslate = currentTranslate
      
      slider.classList.remove('transition-transform')
      animationId = requestAnimationFrame(animation)
    }
    
    const handleTouchMove = (e: Event) => {
      if (!isDragging) return
      
      const touchEvent = e as TouchEvent
      const currentX = touchEvent.touches[0].clientX
      const deltaX = currentX - startX
      const maxTranslate = getConstraints()
      
      currentTranslate = Math.max(maxTranslate, Math.min(0, prevTranslate + deltaX))
      e.preventDefault()
    }
    
    const handleTouchEnd = () => {
      if (!isDragging) return
      
      isDragging = false
      cancelAnimationFrame(animationId)
      prevTranslate = currentTranslate
      slider.classList.add('transition-transform')
    }
    
    // Добавляем обработчики событий
    slider.addEventListener('mousedown', handleMouseDown, { passive: false })
    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp, { passive: false })
    
    slider.addEventListener('touchstart', handleTouchStart, { passive: false })
    slider.addEventListener('touchmove', handleTouchMove, { passive: false })
    slider.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Предотвращаем выделение текста при перетаскивании
    slider.addEventListener('dragstart', (e) => e.preventDefault())
    slider.addEventListener('selectstart', (e) => e.preventDefault())
    
    console.log('🎯 Слайдер инициализирован:', slider)
  })
}

// Функция для инициализации drag-and-drop слайдеров подстанций
const initializeSubstationSliders = () => {
  document.querySelectorAll('.substation-slider:not([data-initialized])').forEach(sliderElement => {
    const slider = sliderElement as HTMLElement
    slider.dataset.initialized = 'true'
    
    let isDragging = false
    let startX = 0
    let currentTranslate = 0
    let prevTranslate = 0
    let animationId = 0
    
    const setSliderPosition = () => {
      slider.style.transform = `translateX(${currentTranslate}px)`
    }
    
    const animation = () => {
      setSliderPosition()
      if (isDragging) requestAnimationFrame(animation)
    }
    
    // Обработчики событий мыши
    const handleMouseDown = (e: Event) => {
      const mouseEvent = e as MouseEvent
      
      // Проверяем, что клик не по кнопке
      if ((e.target as HTMLElement).closest('button')) {
        return
      }
      
      isDragging = true
      startX = mouseEvent.clientX
      prevTranslate = currentTranslate
      
      slider.classList.remove('transition-transform')
      slider.classList.add('cursor-grabbing')
      slider.style.userSelect = 'none'
      animationId = requestAnimationFrame(animation)
    }
    
    const handleMouseMove = (e: Event) => {
      if (!isDragging) return
      
      const mouseEvent = e as MouseEvent
      const currentX = mouseEvent.clientX
      const diffX = currentX - startX
      currentTranslate = prevTranslate + diffX
      
      // Ограничиваем перетаскивание
      const maxTranslate = 0
      const minTranslate = -(slider.scrollWidth - slider.offsetWidth)
      currentTranslate = Math.max(Math.min(currentTranslate, maxTranslate), minTranslate)
    }
    
    const handleMouseUp = (e: Event) => {
      if (!isDragging) return
      
      isDragging = false
      cancelAnimationFrame(animationId)
      
      slider.classList.add('transition-transform')
      slider.classList.remove('cursor-grabbing')
      slider.style.userSelect = ''
      
      // Сохраняем финальную позицию
      prevTranslate = currentTranslate
    }
    
    // Обработчики событий касания для мобильных
    const handleTouchStart = (e: Event) => {
      const touchEvent = e as TouchEvent
      isDragging = true
      startX = touchEvent.touches[0].clientX
      prevTranslate = currentTranslate
      
      slider.classList.remove('transition-transform')
      animationId = requestAnimationFrame(animation)
    }
    
    const handleTouchMove = (e: Event) => {
      if (!isDragging) return
      
      const touchEvent = e as TouchEvent
      const currentX = touchEvent.touches[0].clientX
      const diffX = currentX - startX
      currentTranslate = prevTranslate + diffX
      
      // Ограничиваем перетаскивание
      const maxTranslate = 0
      const minTranslate = -(slider.scrollWidth - slider.offsetWidth)
      currentTranslate = Math.max(Math.min(currentTranslate, maxTranslate), minTranslate)
    }
    
    const handleTouchEnd = (e: Event) => {
      if (!isDragging) return
      
      isDragging = false
      cancelAnimationFrame(animationId)
      prevTranslate = currentTranslate
      slider.classList.add('transition-transform')
    }
    
    // Добавляем обработчики событий
    slider.addEventListener('mousedown', handleMouseDown, { passive: false })
    window.addEventListener('mousemove', handleMouseMove, { passive: false })
    window.addEventListener('mouseup', handleMouseUp, { passive: false })
    
    slider.addEventListener('touchstart', handleTouchStart, { passive: false })
    slider.addEventListener('touchmove', handleTouchMove, { passive: false })
    slider.addEventListener('touchend', handleTouchEnd, { passive: false })
    
    // Предотвращаем выделение текста при перетаскивании
    slider.addEventListener('dragstart', (e) => e.preventDefault())
    slider.addEventListener('selectstart', (e) => e.preventDefault())
    
    console.log('🎯 Слайдер подстанций инициализирован:', slider)
  })
}

// Глобальные функции для кнопок в карточках МКБ
if (typeof window !== 'undefined') {
  // Функция для открытия МКБ кода
  (window as any).openMKBCode = async (mkbCode: string, categoryName: string) => {
    try {
      // Находим категорию по имени, чтобы получить её URL
      const response = await $fetch('/api/categories') as any
      const categories = response.items || []
      const category = categories.find((cat: any) => cat.name === categoryName)
      
      if (!category) {
        console.error('Категория не найдена:', categoryName)
        return
      }
      
      // Закрываем панель поиска
      closePanel()
      
      // Переходим на страницу кодификатора с параметром для открытия модального окна
      navigateTo(`/codifier/${category.url}?mkb=${mkbCode}`)
    } catch (error) {
      console.error('Ошибка при поиске категории:', error)
    }
  }
  
  // Функция для копирования информации о МКБ
  (window as any).copyMKBInfo = async (mkbCode: string, name: string, stationCode: string) => {
    const info = `МКБ: ${mkbCode}${stationCode ? ` | Станция: ${stationCode}` : ''}\n${name}`
    
    try {
      await navigator.clipboard.writeText(info)
      // Можно добавить уведомление об успешном копировании
      console.log('МКБ информация скопирована:', info)
    } catch (error) {
      console.error('Ошибка копирования:', error)
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = info
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }
  
  // Функция для открытия карты подстанции
  (window as any).openSubstationMap = (coords: string, name: string) => {
    if (!coords) {
      console.error('Координаты не указаны для подстанции:', name)
      return
    }
    
    const [lat, lon] = coords.split(',').map(c => parseFloat(c.trim()))
    if (isNaN(lat) || isNaN(lon)) {
      console.error('Некорректные координаты:', coords)
      return
    }
    
    // Закрываем панель поиска
    closePanel()
    
    // Переходим на страницу подстанций с координатами для автоматического выбора
    navigateTo(`/substations?lat=${lat}&lon=${lon}&name=${encodeURIComponent(name)}`)
  }
  
  // Функция для открытия деталей препарата
  (window as any).openDrugDetails = (drugId: string, drugName: string) => {
    if (!drugId || drugId === 'undefined') {
      console.error('ID препарата не указан')
      return
    }
    
    // Переходим на страницу препаратов и открываем модал
    navigateTo(`/drugs?drug=${drugId}`)
  }
  
  // Функция для копирования информации о препарате
  (window as any).copyDrugInfo = async (name: string, latinName: string, forms: string) => {
    let info = name
    if (latinName && latinName !== 'undefined') info += `\nЛатинское название: ${latinName}`
    if (forms && forms !== 'undefined') info += `\nФорма выпуска: ${forms}`
    
    try {
      await navigator.clipboard.writeText(info)
      console.log('Информация о препарате скопирована:', info)
    } catch (error) {
      console.error('Ошибка копирования:', error)
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = info
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }

  // Функция для звонка в подстанцию
  (window as any).callSubstation = (phones: string) => {
    if (!phones || phones === 'Не указан') {
      console.error('Телефон не указан')
      return
    }
    
    // Берем первый номер телефона
    const phone = phones.split(',')[0].trim()
    window.location.href = `tel:${phone}`
  }
  
  // Функция для копирования информации о подстанции
  (window as any).copySubstationInfo = async (name: string, address: string, phones: string) => {
    const info = `${name}\nАдрес: ${address}\nТелефон: ${phones}`
    
    try {
      await navigator.clipboard.writeText(info)
      console.log('Информация о подстанции скопирована:', info)
    } catch (error) {
      console.error('Ошибка копирования:', error)
      // Fallback для старых браузеров
      const textArea = document.createElement('textarea')
      textArea.value = info
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
    }
  }
  
  // Функция для запроса геолокации
  (window as any).requestGeolocation = async () => {
    if (!navigator.geolocation) {
      alert('Геолокация не поддерживается вашим браузером')
      return
    }
    
    // Находим последнее сообщение бота с запросом геолокации
    const lastBotMessage = [...chatMessages.value].reverse().find(msg => 
      !msg.isUser && msg.text.includes('<geolocation-request>')
    )
    
    if (!lastBotMessage) {
      console.error('Не найдено сообщение с запросом геолокации')
      return
    }
    
    try {
      // Обновляем сообщение на состояние загрузки
      lastBotMessage.text = lastBotMessage.text.replace(
        /<geolocation-request>[\s\S]*?<\/geolocation-request>/g,
        `<div class="my-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 bg-yellow-100 dark:bg-yellow-800 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm text-yellow-800 dark:text-yellow-200">Определяем ваше местоположение...</p>
            </div>
          </div>
        </div>`
      )
      
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 минут
        })
      })
      
      const { latitude, longitude } = position.coords
      console.log('Получены координаты:', latitude, longitude)
      
      // Обновляем сообщение на состояние поиска подстанций
      lastBotMessage.text = lastBotMessage.text.replace(
        /<div class="my-4 p-4 bg-yellow-50[\s\S]*?<\/div>/,
        `<div class="my-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div class="flex items-start gap-3">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
            <div class="flex-1">
              <p class="text-sm text-blue-800 dark:text-blue-200">Ищем ближайшие подстанции...</p>
            </div>
          </div>
        </div>`
      )
      
      // Ищем ближайшие подстанции
      const nearestSubstations = await $fetch('/api/substations/nearest', {
        method: 'POST',
        body: { latitude, longitude }
      })
      
      // Обновляем сообщение с результатами
      const updatedResponse = generateNearestSubstationsResponse(nearestSubstations)
      lastBotMessage.text = updatedResponse
      
      // Сохраняем обновленный чат
      saveChatToStorage()
      
      // Инициализируем иконки и слайдеры для новых карточек
      setTimeout(() => {
        initializeMKBIcons()
      }, 100)
      
    } catch (error: any) {
      console.error('Ошибка получения геолокации:', error)
      let errorMessage = 'Не удалось определить местоположение. '
      
      if (error.code === 1) {
        errorMessage += 'Доступ к геолокации запрещен.'
      } else if (error.code === 2) {
        errorMessage += 'Местоположение недоступно.'
      } else if (error.code === 3) {
        errorMessage += 'Превышено время ожидания.'
      } else {
        errorMessage += 'Произошла неизвестная ошибка.'
      }
      
      // Обновляем сообщение с ошибкой
      if (lastBotMessage) {
        lastBotMessage.text = lastBotMessage.text.replace(
          /<div class="my-4 p-4 bg-(?:yellow|blue)-50[\s\S]*?<\/div>/,
          `<div class="my-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-800 rounded-full flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <div class="flex-1">
                <p class="text-sm text-red-800 dark:text-red-200">${errorMessage}</p>
                <button onclick="requestGeolocation()" class="inline-flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-medium rounded-lg transition-colors mt-2">
                  Попробовать снова
                </button>
              </div>
            </div>
          </div>`
        )
        saveChatToStorage()
      }
    }
  }
}

// Функция для генерации ответа с ближайшими подстанциями
const generateNearestSubstationsResponse = (data: any): string => {
  if (!data.success || !data.substations || data.substations.length === 0) {
    return 'К сожалению, не удалось найти ближайшие подстанции. Попробуйте позже или обратитесь к диспетчерской службе.'
  }
  
  const { substations, userLocation } = data
  let response = `**Ближайшие подстанции СМП к вашему местоположению:**\n\n`
  
  // Генерируем карточки подстанций с информацией о расстоянии и времени
  response += '<substation-cards>\n'
  substations.forEach((substation: any) => {
    const phones = Array.isArray(substation.phones) ? substation.phones.join(', ') : (substation.phone || 'Не указан')
    const coords = substation.location?.coordinates ? `${substation.location.coordinates[1]},${substation.location.coordinates[0]}` : ''
    const distance = substation.distanceKm ? `${substation.distanceKm} км` : ''
    const travelTime = substation.estimatedTravelTime ? `${substation.estimatedTravelTime} мин` : ''
    
    // Добавляем расстояние и время к названию
    let nameWithDistance = substation.name
    if (distance && travelTime) {
      nameWithDistance += ` (${distance}, ~${travelTime})`
    } else if (distance) {
      nameWithDistance += ` (${distance})`
    }
    
    response += `${nameWithDistance}|${substation.address || 'Адрес не указан'}|${phones}|${coords}\n`
  })
  response += '</substation-cards>\n\n'
  
  // Добавляем рекомендации
  response += `💡 **Информация:**\n`
  response += `- Расстояние и время рассчитаны от вашего текущего местоположения\n`
  response += `- Время доезда приблизительное (средняя скорость 40 км/ч)\n`
  
  return response
}

// Функция для генерации ответа с ближайшими подстанциями к конкретной подстанции
const generateNearbySubstationsResponse = (data: any): string => {
  if (!data.success || !data.nearbySubstations || data.nearbySubstations.length === 0) {
    return `К сожалению, рядом с подстанцией "${data.sourceSubstation?.name || 'указанной'}" не найдено других подстанций в радиусе ${(data.searchRadius || 3000) / 1000} км.`
  }
  
  const { sourceSubstation, nearbySubstations, searchRadius } = data
  let response = `**Подстанции рядом с "${sourceSubstation.name}" (в радиусе ${searchRadius / 1000} км):**\n\n`
  
  // Генерируем карточки ближайших подстанций
  response += '<substation-cards>\n'
  nearbySubstations.forEach((substation: any) => {
    const phones = Array.isArray(substation.phones) ? substation.phones.join(', ') : (substation.phone || 'Не указан')
    const coords = substation.location?.coordinates ? `${substation.location.coordinates[1]},${substation.location.coordinates[0]}` : ''
    const distance = substation.distanceKm ? `${substation.distanceKm} км` : ''
    const travelTime = substation.estimatedTravelTime ? `${substation.estimatedTravelTime} мин` : ''
    
    // Добавляем расстояние к названию
    let nameWithDistance = substation.name
    if (distance) {
      nameWithDistance += ` (${distance}${travelTime ? `, ~${travelTime}` : ''})`
    }
    
    response += `${nameWithDistance}|${substation.address || 'Адрес не указан'}|${phones}|${coords}\n`
  })
  response += '</substation-cards>\n\n'
  
  // Добавляем информацию
  response += `💡 **Информация:**\n`
  response += `- Показаны подстанции в радиусе ${searchRadius / 1000} км от "${sourceSubstation.name}"\n`
  response += `- Расстояние рассчитано по прямой линии\n`
  response += `- Время доезда между подстанциями приблизительное\n`
  
  return response
}

// Функция для оценки ответа бота
const rateBotResponse = async (message: ChatMessage, rating: 'positive' | 'negative') => {
  if (message.userRating) return // Уже оценено
  
  try {
    if (rating === 'positive') {
      // Положительная оценка - сразу сохраняем
      await saveFeedback(message, rating)
      message.userRating = rating
      saveChatToStorage()
    } else {
      // Отрицательная оценка - спрашиваем что не так
      const userComment = prompt('Что именно не так в этом ответе? Ваш комментарий поможет улучшить качество ответов.')
      
      if (userComment && userComment.trim()) {
        await saveFeedback(message, rating, userComment.trim())
        message.userRating = rating
        saveChatToStorage()
        
        // Добавляем сообщение благодарности
        const thankYouMessage: ChatMessage = {
          id: Date.now().toString(),
          text: 'Спасибо за обратную связь! Ваш комментарий поможет мне давать более точные ответы в будущем.',
          isUser: false,
          timestamp: new Date()
        }
        chatMessages.value.push(thankYouMessage)
        saveChatToStorage()
      }
    }
  } catch (error) {
    console.error('Ошибка сохранения оценки:', error)
    alert('Ошибка сохранения оценки. Попробуйте еще раз.')
  }
}

// Функция для сохранения обратной связи
const saveFeedback = async (message: ChatMessage, rating: 'positive' | 'negative', userComment?: string) => {
  const feedbackData = {
    question: message.originalQuestion || 'Неизвестный вопрос',
    answer: message.text,
    rating,
    userComment: userComment || '',
    searchResults: message.results || []
  }
  
  const response = await $fetch('/api/feedback', {
    method: 'POST',
    body: feedbackData
  })
  
  return response
}

const clearResults = () => {
  results.value = []
  currentPageResults.value = []
  otherResults.value = []
  // Восстанавливаем скролл
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
  }
}

// Функция для форматирования формы выпуска препарата
const formatDrugForm = (forms: any) => {
  if (!forms) return ''
  
  const parts = []
  
  // Добавляем дозировку
  if (forms.doseValue) {
    const dose = `${forms.doseValue}${forms.doseUnit || 'мг'}/мл`
    parts.push(dose)
  }
  
  // Добавляем объем отдельно
  if (forms.volumeMl) {
    parts.push(`${forms.volumeMl}мл`)
  }
  
  return parts.join(' • ')
}

const lockScroll = () => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = 'hidden'
  }
}

const unlockScroll = () => {
  if (typeof window !== 'undefined') {
    document.body.style.overflow = ''
  }
}

// Данные для поиска
const searchData = ref<SearchResult[]>([])
const currentPageData = ref<SearchResult[]>([])

// Загружаем данные для поиска
onMounted(async () => {
  await loadSearchData()
})

async function loadSearchData() {
  try {
    console.log('Loading search data...')
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

    console.log('Fetched data:', {
      instructions: (instructions as any).items?.length || 0,
      categories: (categories as any).items?.length || 0,
      mkbCodes: (mkbCodes as any).items?.length || 0,
      lsCategories: (lsCategories as any).items?.length || 0,
      lsAll: (lsAll as any).items?.length || 0,
      drugs: (drugs as any).items?.length || 0
    })

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

    console.log('Final data loaded:', {
      allResults: allResults.length,
      currentPageItems: currentPageItems.length
    })
  } catch (error) {
    console.error('Ошибка загрузки данных для поиска:', error)
  }
}

const { matchesNormalized } = useTextNormalization()

function performSearch() {
  const query = searchQuery.value.trim()

  console.log('performSearch called with query:', query)
  console.log('searchData length:', searchData.value.length)
  console.log('currentPageData length:', currentPageData.value.length)

  if (!query) {
    results.value = []
    currentPageResults.value = []
    otherResults.value = []
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
    if (currentPath.value === '/codifier' && item.url?.startsWith('/codifier/')) return false
    if (currentPath.value === '/local-statuses' && item.url?.startsWith('/local-statuses/')) return false
    if (currentPath.value === '/instructions' && item.url === '/instructions') return false
    if (currentPath.value === '/drugs' && item.url?.startsWith('/drugs')) return false
    if (currentPath.value === '/algorithms' && item.url === '/algorithms') return false

    const searchableText = [
      item.title,
      item.description,
      item.type,
      item.codes?.mkbCode,
      item.codes?.stationCode
    ].filter(Boolean).join(' ')

    return matchesNormalized(query, searchableText)
  })

  console.log('currentResults:', currentResults.length)
  console.log('otherResultsFiltered:', otherResultsFiltered.length)

  currentPageResults.value = currentResults
  otherResults.value = otherResultsFiltered
  results.value = [...currentResults, ...otherResultsFiltered]
}

let searchTimeout: NodeJS.Timeout | null = null

function onSearch() {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }

  searchTimeout = setTimeout(() => {
    if (searchQuery.value.trim()) {
      performSearch()
    } else {
      results.value = []
      currentPageResults.value = []
      otherResults.value = []
    }
  }, 300) // Задержка 300мс для дебаунса
}

const performSearchButton = () => {
  performSearch()
}

const navigateToResult = (result: SearchResult) => {
  if (result.url) {
    // Специальная обработка для препаратов
    if (result.type === 'Препарат' && result.url.includes('?open=')) {
      const drugId = result.url.split('?open=')[1]
      navigateTo('/drugs')
      // Отправляем событие для открытия модалки препарата
      nextTick(() => {
        window.dispatchEvent(new CustomEvent('openDrugModal', {
          detail: { drugId }
        }))
      })
    } else {
      navigateTo(result.url)
    }
    closePanel()
  }
}

// Загружаем историю чата и режим при монтировании
onMounted(() => {
  loadChatFromStorage()
  loadModeFromStorage()
})

// Фокус на поле поиска при открытии панели
watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    lockScroll()
    nextTick(() => {
      // Фокусируемся на соответствующем инпуте в зависимости от режима
      if (currentMode.value === 'search' && searchInput.value) {
        searchInput.value.focus()
      } else if (currentMode.value === 'chat' && chatInput.value) {
        chatInput.value.focus()
      }
    })
  } else {
    unlockScroll()
  }
})

// Функции для работы с localStorage
const CHAT_STORAGE_KEY = 'smp-help-chat-history'
const MODE_STORAGE_KEY = 'smp-help-panel-mode'

const saveChatToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(chatMessages.value))
    } catch (error) {
      console.error('Ошибка сохранения чата:', error)
    }
  }
}

const loadChatFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        chatMessages.value = parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }))
        initializeMKBIcons()
        
        // Дополнительная инициализация с задержкой
        setTimeout(() => {
          initializeMKBIcons()
        }, 100)
      }
    } catch (error) {
      console.error('Ошибка загрузки чата:', error)
    }
  }
}

const saveModeToStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(MODE_STORAGE_KEY, currentMode.value)
    } catch (error) {
      console.error('Ошибка сохранения режима:', error)
    }
  }
}

const loadModeFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem(MODE_STORAGE_KEY)
      if (saved && (saved === 'search' || saved === 'chat')) {
        currentMode.value = saved as 'search' | 'chat'
      }
    } catch (error) {
      console.error('Ошибка загрузки режима:', error)
    }
  }
}

const clearChatHistory = () => {
  chatMessages.value = []
  saveChatToStorage()
}

// Функции для чата
const scrollToBottom = () => {
  nextTick(() => {
    if (contentContainer.value) {
      contentContainer.value.scrollTop = contentContainer.value.scrollHeight
    }
  })
}

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const sendChatMessage = async () => {
  const text = currentChatMessage.value.trim()
  if (!text || isChatProcessing.value) return
  
  // Добавляем сообщение пользователя
  const userMessage: ChatMessage = {
    id: Date.now().toString(),
    text,
    isUser: true,
    timestamp: new Date()
  }
  chatMessages.value.push(userMessage)
  const originalQuestion = text // Сохраняем исходный вопрос для связи с ответом
  currentChatMessage.value = ''
  saveChatToStorage()

  // Добавляем индикатор загрузки с случайным сообщением
  const loadingMessages = [
    'Ищу информацию в базе данных...',
    'Анализирую медицинские данные...',
    'Подбираю подходящие результаты...',
    'Проверяю актуальную информацию...',
    'Обрабатываю ваш запрос...'
  ]

  const loadingMessage: ChatMessage = {
    id: (Date.now() + 1).toString(),
    text: loadingMessages[Math.floor(Math.random() * loadingMessages.length)],
    isUser: false,
    timestamp: new Date(),
    isLoading: true
  }
  chatMessages.value.push(loadingMessage)
  scrollToBottom()

  isChatProcessing.value = true

  try {
    // Поиск через AI API чат-бота
    const response = await $fetch('/api/chatbot/ai-search', {
      method: 'POST',
      body: { query: text }
    })

    // Минимальная задержка для показа индикатора поиска (1.5 секунды)
    const minDelay = 1500
    const startTime = Date.now()

    await new Promise(resolve => {
      const elapsed = Date.now() - startTime
      const remainingDelay = Math.max(0, minDelay - elapsed)
      setTimeout(resolve, remainingDelay)
    })

    // Удаляем индикатор загрузки
    chatMessages.value.pop()

    // Создаем ответ бота
    const botResponse: ChatMessage = {
      id: Date.now().toString(),
      text: response.message || 'Получен ответ',
      isUser: false,
      timestamp: new Date(),
      results: response.results || [],
      quickReplies: (response as any).suggestions && (response as any).suggestions.length > 0 ? (response as any).suggestions : undefined,
      originalQuestion: originalQuestion // Связываем ответ с исходным вопросом
    }
    chatMessages.value.push(botResponse)
    initializeMKBIcons()
    
    // Дополнительная инициализация с задержкой для надежности
    setTimeout(() => {
      initializeMKBIcons()
    }, 100)
    
    saveChatToStorage()

  } catch (error) {
    console.error('Ошибка чата:', error)
    chatMessages.value.pop()

    const errorMessage: ChatMessage = {
      id: (Date.now() + 2).toString(),
      text: 'Извините, произошла ошибка при поиске. Попробуйте еще раз.',
      isUser: false,
      timestamp: new Date()
    }
    chatMessages.value.push(errorMessage)
    saveChatToStorage()
  } finally {
    isChatProcessing.value = false
    scrollToBottom()
  }
}

const sendQuickMessage = (text: string) => {
  currentChatMessage.value = text
  sendChatMessage()
}

// Обработчик быстрых ответов с специальной логикой для подстанций
const handleQuickReply = async (reply: string, message: ChatMessage) => {
  if (reply === 'Ближайшие подстанции') {
    // Ищем подстанцию в результатах сообщения
    const substationResult = message.results?.find(result => result.type === 'substation')
    
    if (substationResult) {
      try {
        // Запрашиваем ближайшие подстанции к найденной
        const nearbyData = await $fetch('/api/substations/nearby', {
          method: 'POST',
          body: { 
            substationName: substationResult.title,
            maxDistance: 3000 // 3 км
          }
        })
        
        // Генерируем ответ с ближайшими подстанциями
        const responseText = generateNearbySubstationsResponse(nearbyData)
        
        // Добавляем новое сообщение
        const newMessage: ChatMessage = {
          id: Date.now().toString(),
          text: responseText,
          isUser: false,
          timestamp: new Date(),
          results: []
        }
        
        chatMessages.value.push(newMessage)
        
        // Инициализируем иконки и слайдеры для новых карточек
        setTimeout(() => {
          initializeMKBIcons()
        }, 100)
        
      } catch (error) {
        console.error('Ошибка поиска ближайших подстанций:', error)
        
        // Показываем сообщение об ошибке
        const errorMessage: ChatMessage = {
          id: Date.now().toString(),
          text: 'К сожалению, не удалось найти ближайшие подстанции. Попробуйте позже.',
          isUser: false,
          timestamp: new Date(),
          results: []
        }
        
        chatMessages.value.push(errorMessage)
      }
    } else {
      // Если подстанция не найдена в результатах, отправляем обычное сообщение
      sendQuickMessage(reply)
    }
  } else {
    // Для всех остальных быстрых ответов используем обычную логику
    sendQuickMessage(reply)
  }
}

// Функции для обработки специальных кнопок препаратов
const shouldShowQuickReplies = (message: ChatMessage) => {
  return (message.quickReplies && message.quickReplies.length > 0) || hasDrugResults(message)
}

const hasDrugResults = (message: ChatMessage) => {
  return message.results && message.results.some(result => result.type === 'drug')
}

const hasCalculatorDrugs = (message: ChatMessage) => {
  if (!message.results) return false
  
  // Показываем кнопку калькулятора если есть хотя бы один препарат с педиатрической дозировкой и без возрастных ограничений "старше 18 лет"
  const hasCalculatorDrugs = message.results.some(result => {
    if (result.type !== 'drug' || !result.data?.pediatricDose || result.data.pediatricDose.length === 0) {
      return false
    }
    
    // Проверяем возрастные ограничения
    if (result.data.ageRestrictions) {
      const restrictions = result.data.ageRestrictions.toLowerCase()
      const adultRestrictions = ['старше 18', 'с 18 лет', 'взрослым', '18+', 'от 18', 'для взрослых']
      if (adultRestrictions.some(restriction => restrictions.includes(restriction))) {
        return false
      }
    }
    
    return true
  })
  
  console.log('hasCalculatorDrugs:', hasCalculatorDrugs, 'results:', message.results?.map(r => ({ type: r.type, name: r.data?.name, hasPediatricDose: !!r.data?.pediatricDose })))
  return hasCalculatorDrugs
}

const sendCalculatorMessage = (message: ChatMessage) => {
  // Находим первый препарат с педиатрической дозировкой
  const drugResult = message.results?.find(result => 
    result.type === 'drug' && 
    result.data?.pediatricDose && 
    result.data.pediatricDose.length > 0
  )
  
  if (!drugResult) {
    console.error('Препарат с педиатрической дозировкой не найден')
    return
  }
  
  // Создаем HTML для калькулятора
  const calculatorHtml = createCalculatorHtml(drugResult.data)
  
  // Добавляем сообщение с калькулятором
  const calculatorMessage: ChatMessage = {
    id: Date.now().toString(),
    text: `Калькулятор детской дозы для препарата **${drugResult.data.name}**:\n\n${calculatorHtml}`,
    isUser: false,
    timestamp: new Date(),
    results: []
  }
  
  chatMessages.value.push(calculatorMessage)
  
  // Инициализируем калькулятор после добавления в DOM
  setTimeout(() => {
    initializeCalculator(drugResult.data)
  }, 100)
  
  scrollToBottom()
}

// Функция для создания HTML калькулятора
const createCalculatorHtml = (drugData: any) => {
  const drugId = drugData._id || Date.now().toString()
  
  return `
    <div class="calculator-widget border border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-white dark:bg-slate-800" data-drug-id="${drugId}">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Вес ребенка (кг)
          </label>
          <input 
            type="number" 
            min="0" 
            step="0.1" 
            placeholder="Например: 15.5"
            class="calc-weight w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
            Дозировка на кг
          </label>
          <div class="relative">
            <button 
              type="button"
              class="calc-dose-select w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-left flex items-center justify-between focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
            >
              <span class="calc-dose-text">Выберите дозировку</span>
              <svg class="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div class="calc-dose-dropdown absolute z-10 w-full mt-1 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg hidden">
              <!-- Опции будут добавлены динамически -->
            </div>
          </div>
        </div>
      </div>
      
      <!-- Результат расчета -->
      <div class="calc-result p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
        <div class="text-sm text-slate-600 dark:text-slate-400">
          Введите вес ребенка и выберите дозировку для расчета
        </div>
      </div>
    </div>
  `
}

// Функция для инициализации калькулятора
const initializeCalculator = (drugData: any) => {
  const drugId = drugData._id || Date.now().toString()
  const calculator = document.querySelector(`[data-drug-id="${drugId}"]`)
  
  if (!calculator) {
    console.error('Калькулятор не найден в DOM')
    return
  }
  
  // Парсим педиатрические дозы
  const doseOptions = parseDoseOptions(drugData.pediatricDose)
  
  // Находим элементы
  const weightInput = calculator.querySelector('.calc-weight') as HTMLInputElement
  const doseSelect = calculator.querySelector('.calc-dose-select') as HTMLButtonElement
  const doseText = calculator.querySelector('.calc-dose-text') as HTMLSpanElement
  const doseDropdown = calculator.querySelector('.calc-dose-dropdown') as HTMLDivElement
  const resultDiv = calculator.querySelector('.calc-result') as HTMLDivElement
  
  // Заполняем опции дозировки
  doseDropdown.innerHTML = doseOptions.map(option => 
    `<div class="calc-dose-option px-3 py-2 hover:bg-slate-100 dark:hover:bg-slate-600 cursor-pointer" data-value="${option.label}">
      ${option.label}
    </div>`
  ).join('')
  
  let selectedDose: any = null
  
  // Обработчик выбора дозировки
  doseSelect.addEventListener('click', () => {
    doseDropdown.classList.toggle('hidden')
  })
  
  // Обработчики опций дозировки
  doseDropdown.querySelectorAll('.calc-dose-option').forEach(option => {
    option.addEventListener('click', () => {
      const value = option.getAttribute('data-value')
      selectedDose = doseOptions.find(d => d.label === value)
      doseText.textContent = value || 'Выберите дозировку'
      doseDropdown.classList.add('hidden')
      calculateResult()
    })
  })
  
  // Обработчик ввода веса
  weightInput.addEventListener('input', calculateResult)
  
  // Закрытие dropdown при клике вне
  document.addEventListener('click', (e) => {
    if (!calculator.contains(e.target as Node)) {
      doseDropdown.classList.add('hidden')
    }
  })
  
  // Функция расчета результата
  function calculateResult() {
    const weight = parseFloat(weightInput.value)
    
    if (!weight || !selectedDose || weight <= 0) {
      resultDiv.innerHTML = `
        <div class="text-sm text-slate-600 dark:text-slate-400">
          Введите вес ребенка и выберите дозировку для расчета
        </div>
      `
      return
    }
    
    // Расчет дозы в мг
    let doseResult = ''
    if (selectedDose.minPerKg != null && selectedDose.maxPerKg != null && selectedDose.minPerKg !== selectedDose.maxPerKg) {
      const minDose = Math.round((weight * selectedDose.minPerKg) * 10) / 10
      const maxDose = Math.round((weight * selectedDose.maxPerKg) * 10) / 10
      doseResult = `${minDose} - ${maxDose} мг`
    } else {
      const dosePerKg = selectedDose.minPerKg ?? selectedDose.maxPerKg ?? 0
      const totalDose = Math.round((weight * dosePerKg) * 10) / 10
      doseResult = `${totalDose} мг`
    }
    
    // Расчет объема в мл (если есть форма выпуска)
    let volumeResult = ''
    if (drugData.forms && drugData.forms.doseValue && drugData.forms.volumeMl) {
      const concentration = drugData.forms.doseValue / drugData.forms.volumeMl
      const minDose = selectedDose.minPerKg ? weight * selectedDose.minPerKg : weight * (selectedDose.maxPerKg || 0)
      const maxDose = selectedDose.maxPerKg && selectedDose.minPerKg !== selectedDose.maxPerKg ? weight * selectedDose.maxPerKg : minDose
      
      if (minDose === maxDose) {
        const volume = Math.round((minDose / concentration) * 100) / 100
        volumeResult = `${volume} мл`
      } else {
        const minVolume = Math.round((minDose / concentration) * 100) / 100
        const maxVolume = Math.round((maxDose / concentration) * 100) / 100
        volumeResult = `${minVolume} - ${maxVolume} мл`
      }
    }
    
    resultDiv.innerHTML = `
      <div class="text-center">
        <div class="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          ${doseResult}
        </div>
        ${volumeResult ? `
          <div class="text-lg font-semibold text-blue-600 dark:text-blue-400 mb-2">
            ${volumeResult}
          </div>
        ` : ''}
        ${drugData.pediatricDoseUnit ? `
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">
            Единица измерения: ${drugData.pediatricDoseUnit}
          </div>
        ` : ''}
        <div class="text-xs text-slate-500 dark:text-slate-400">
          При весе ${weight} кг
        </div>
      </div>
    `
  }
}

// Функция для парсинга опций дозировки (из SearchBar)
const parseDoseOptions = (pediatricDose: string | string[]) => {
  if (!pediatricDose) return []
  const arr = Array.isArray(pediatricDose) ? pediatricDose : [pediatricDose]
  return arr.flatMap(s => parsePediatricDose(s || ''))
}

// Действия с результатами в чате
const openDrugPage = (result: SearchResult) => {
  // Переходим на страницу препаратов с параметром для открытия модального окна
  navigateTo(`/drugs?open=${result.data._id}`)
  closePanel()
}

const openMkbModal = (result: SearchResult) => {
  navigateTo(`/codifier/${result.data.category?.url}?open=${result.data._id}`)
  closePanel()
}


// Функции для управления сообщениями
const startEditMessage = (messageId: string, currentText: string) => {
  editingMessageId.value = messageId
  editingText.value = currentText
}

const cancelEditMessage = () => {
  editingMessageId.value = null
  editingText.value = ''
}

const saveEditMessage = () => {
  if (editingMessageId.value && editingText.value.trim()) {
    const messageIndex = chatMessages.value.findIndex(msg => msg.id === editingMessageId.value)
    if (messageIndex !== -1) {
      chatMessages.value[messageIndex].text = editingText.value.trim()
      saveChatToStorage()
    }
  }
  cancelEditMessage()
}

const deleteMessage = (messageId: string) => {
  const messageIndex = chatMessages.value.findIndex(msg => msg.id === messageId)
  if (messageIndex !== -1) {
    // Если удаляем сообщение пользователя, удаляем и следующий ответ бота (если есть)
    const message = chatMessages.value[messageIndex]
    if (message.isUser && messageIndex + 1 < chatMessages.value.length) {
      const nextMessage = chatMessages.value[messageIndex + 1]
      if (!nextMessage.isUser) {
        chatMessages.value.splice(messageIndex, 2) // Удаляем оба сообщения
      } else {
        chatMessages.value.splice(messageIndex, 1) // Удаляем только сообщение пользователя
      }
    } else {
      chatMessages.value.splice(messageIndex, 1) // Удаляем одно сообщение
    }
    saveChatToStorage()
  }
}

const getContextMenuItems = (message: ChatMessage) => {
  const items = []

  if (message.isUser && !message.isLoading) {
    items.push([
      {
        label: 'Редактировать',
        icon: 'i-lucide-edit',
        onSelect: () => startEditMessage(message.id, message.text)
      }
    ])
  }

  items.push([
    {
      label: 'Копировать',
      icon: 'i-lucide-copy',
      onSelect: () => copyToClipboard(message.text)
    }
  ])

  if (!message.isLoading) {
    items.push([
      {
        label: 'Удалить',
        icon: 'i-lucide-trash-2',
        color: 'error' as const,
        onSelect: () => deleteMessage(message.id)
      }
    ])
  }

  return items
}


// Обновляем фокус при переключении режимов и сохраняем в localStorage
watch(() => currentMode.value, (mode) => {
  nextTick(() => {
    if (mode === 'search' && searchInput.value) {
      searchInput.value.focus()
    } else if (mode === 'chat' && chatInput.value) {
      chatInput.value.focus()
    }
  })
  // Сохраняем выбранный режим
  saveModeToStorage()
})

// Восстанавливаем скролл при размонтировании компонента
onUnmounted(() => {
  unlockScroll()
})
</script>
