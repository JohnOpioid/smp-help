<template>
  <ClientOnly>
    <div v-if="isSearchActive" class="flex-1">
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="text-center mb-8">
        <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-700 dark:text-white mb-2 sm:mb-4">
          {{ searchResults.length > 0 ? 'Результаты поиска' : 'Поиск' }}
        </h2>
        <p class="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300">
          {{ searchResults.length > 0 ? `Найдено ${searchResults.length} результатов` : 'Введите запрос для поиска' }}
        </p>
      </div>

      <!-- Скелетон во время поиска -->
      <div v-if="isSearching" class="space-y-3">
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
          <div class="flex items-center justify-between">
            <USkeleton class="h-4 w-48 rounded" />
            <USkeleton class="h-4 w-24 rounded" />
          </div>
          <div class="mt-3 space-y-2">
            <USkeleton class="h-3 w-full rounded" />
            <USkeleton class="h-3 w-5/6 rounded" />
            <USkeleton class="h-3 w-2/3 rounded" />
          </div>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600 p-3">
          <div class="flex items-center justify-between">
            <USkeleton class="h-4 w-40 rounded" />
            <USkeleton class="h-4 w-20 rounded" />
          </div>
          <div class="mt-3 space-y-2">
            <USkeleton class="h-3 w-full rounded" />
            <USkeleton class="h-3 w-4/6 rounded" />
          </div>
        </div>
      </div>

      <!-- Результаты поиска -->
      <div v-else-if="searchResults.length > 0" class="space-y-4">
        <!-- Динамические группы в зависимости от контекста страницы -->
        <template v-for="group in orderedGroups" :key="group.key">
          <!-- МКБ -->
          <template v-if="group.key === 'mkb'">
          <div class="space-y-3">
            <div v-for="result in getDisplayedResults('mkb', groupedResults.mkb)" :key="result._id || result.id" 
              class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <div class="p-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">
                      {{ result.title || result.name }}
                      <template v-if="(result.synonyms && result.synonyms.length > 0) || (result.data?.synonyms && result.data.synonyms.length > 0)">
                        — {{ (result.synonyms && result.synonyms.length > 0 ? result.synonyms : result.data?.synonyms)?.join(', ') }}
                      </template>
                    </h4>
                    <p v-if="(result.description || result.note || result.content)" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {{ truncateToApproximateLines(result.description || result.note || result.content, 5) }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- Разделитель между шапкой и футером -->
              <div class="border-t border-slate-100 dark:border-slate-600"></div>
              <!-- Контентная часть с бейджами и заметками -->
              <div class="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30">
                <div class="flex items-center gap-2 mb-2 flex-wrap">
                  <span v-if="result.mkbCode" class="bg-slate-100 dark:bg-slate-600 px-2 py-1 rounded text-xs font-mono text-slate-600 dark:text-slate-300">МКБ: {{ result.mkbCode }}</span>
                  <span v-if="result.stationCode" class="bg-green-100 dark:bg-green-900 px-2 py-1 rounded text-xs font-mono text-green-700 dark:text-green-300">Станция: {{ result.stationCode }}</span>
                  <span v-if="result.category?.name" class="bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded text-xs text-blue-700 dark:text-blue-300">{{ result.category.name }}</span>
                </div>
              </div>
              <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                <div class="flex flex-wrap gap-1 pt-2">
                  <button @click="openMkbModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-clipboard-list" class="w-3 h-3" />Открыть
                  </button>
                  <button @click="copyToClipboard((result.title || result.name) + ': ' + (result.description || result.note || result.content))" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Кнопка "Показать еще" для МКБ -->
            <div v-if="groupedResults.mkb.length > 3" class="flex justify-center pt-2">
              <button @click="toggleGroup('mkb')" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors border-0 cursor-pointer">
                <UIcon :name="expandedGroups.mkb ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                {{ expandedGroups.mkb ? 'Скрыть' : `Показать еще ${getHiddenCount('mkb', groupedResults.mkb)} результатов` }}
              </button>
            </div>
          </div>
          </template>

          <!-- Локальные статусы -->
          <template v-if="group.key === 'ls'">
          <div class="space-y-3">
            <div v-for="result in getDisplayedResults('localStatus', groupedResults.ls)" :key="result._id || result.id" 
              class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <div class="p-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">
                      {{ result.title || result.name || result.data?.name }}
                      <template v-if="(result.synonyms && result.synonyms.length > 0) || (result.data?.synonyms && result.data.synonyms.length > 0)">
                        — {{ (result.synonyms && result.synonyms.length > 0 ? result.synonyms : result.data?.synonyms)?.join(', ') }}
                      </template>
                    </h4>
                    <p v-if="(result.description || result.data?.description || result.data?.note)" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {{ truncateToApproximateLines(result.description || result.data?.description || result.data?.note, 5) }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- Описание локального статуса (localis) -->
              <div v-if="result.localis" class="px-3 py-2 border-t border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-700">
                <div class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line">{{ truncateToApproximateLines(result.localis, 5) }}</div>
              </div>
              <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                <div class="flex flex-wrap gap-1 pt-2">
                  <button @click="openLocalStatusModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 rounded-full text-xs hover:bg-orange-200 dark:hover:bg-orange-800 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-tag" class="w-3 h-3" />Открыть
                  </button>
                  <button @click="copyToClipboard((result.title || result.name) + ': ' + (result.description || result.note || result.content))" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Кнопка "Показать еще" для локальных статусов -->
            <div v-if="groupedResults.ls.length > 3" class="flex justify-center pt-2">
              <button @click="toggleGroup('localStatus')" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors border-0 cursor-pointer">
                <UIcon :name="expandedGroups.localStatus ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                {{ expandedGroups.localStatus ? 'Скрыть' : `Показать еще ${getHiddenCount('localStatus', groupedResults.ls)} результатов` }}
              </button>
            </div>
          </div>
          </template>

          <!-- Алгоритмы -->
          <template v-if="group.key === 'algorithm'">
          <div class="space-y-3">
            <div v-for="result in getDisplayedResults('algorithm', groupedResults.algorithm)" :key="result._id || result.id" 
              class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <div class="p-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title || result.data?.name || result.name }}</h4>
                    <p v-if="(result.description || result.data?.description || result.data?.note)" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {{ truncateToApproximateLines(result.description || result.data?.description || result.data?.note, 5) }}
                    </p>
                  </div>
                </div>
              </div>
              <!-- Разделитель между шапкой и футером -->
              <div class="border-t border-slate-100 dark:border-slate-600"></div>
              <!-- Контентная часть с таблицей алгоритма -->
              <div class="bg-slate-50/50 dark:bg-slate-800/30">
                <div v-if="result.content" class="relative">
                  <div :class="isTableExpanded(String(result._id || result.id)) ? 'max-h-none' : 'max-h-32 overflow-hidden'">
                    <!-- Обертка таблицы без внешнего бордера -->
                    <div class="bg-white dark:bg-slate-800 rounded-none overflow-x-hidden relative sticky-container" data-styled-table-wrapper>
                      <div v-html="renderAlgorithmTable(result.content)" @vue:mounted="setupMobileTableLogic"></div>
                    </div>
                  </div>
                  <!-- Градиент для визуального эффекта исчезновения (только когда таблица свернута) -->
                  <div v-if="!isTableExpanded(String(result._id || result.id))" class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-slate-50/50 to-transparent dark:from-slate-800/30 dark:to-transparent pointer-events-none"></div>
                  <!-- Кнопка раскрытия/скрытия -->
                  <div class="flex justify-center py-2">
                    <button @click="toggleTable(String(result._id || result.id))" class="inline-flex items-center gap-1 px-3 py-1 bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-full text-xs hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors border-0 cursor-pointer">
                      <UIcon :name="isTableExpanded(String(result._id || result.id)) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-3 h-3" />
                      {{ isTableExpanded(String(result._id || result.id)) ? 'Скрыть' : 'Показать полностью' }}
                    </button>
                  </div>
                </div>
              </div>
              <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                <div class="flex flex-wrap gap-1 pt-2">
                  <button @click="openAlgorithmModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-xs hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-list-tree" class="w-3 h-3" />Открыть
                  </button>
                  <button @click="copyToClipboard((result.title || result.name) + ': ' + (result.description || result.note || result.content))" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Кнопка "Показать еще" для алгоритмов -->
            <div v-if="groupedResults.algorithm.length > 3" class="flex justify-center pt-2">
              <button @click="toggleGroup('algorithm')" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors border-0 cursor-pointer">
                <UIcon :name="expandedGroups.algorithm ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                {{ expandedGroups.algorithm ? 'Скрыть' : `Показать еще ${getHiddenCount('algorithm', groupedResults.algorithm)} результатов` }}
              </button>
            </div>
          </div>
          </template>

          <!-- Препараты -->
          <template v-if="group.key === 'drug'">
          <div class="space-y-3">
            <div v-for="result in getDisplayedResults('drug', groupedResults.drug)" :key="result._id || result.id" 
              class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <div class="p-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">
                      {{ result.title || result.name || result.data?.name }}
                      <template v-if="(result.synonyms && result.synonyms.length > 0) || (result.data?.synonyms && result.data.synonyms.length > 0)">
                        , {{ (result.synonyms && result.synonyms.length > 0 ? result.synonyms : result.data?.synonyms)?.join(', ') }}
                      </template>
                    </h4>
                    <p v-if="result.latinName || result.data?.latinName" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ result.latinName || result.data?.latinName }}</p>
                    <p v-if="result.dosage" class="text-sm text-green-600 dark:text-green-400 mt-1 font-medium">{{ result.dosage }}</p>
                    
                    <p v-if="(result.description || result.note || result.data?.description || result.data?.note) && (result.description) !== (result.latinName || result.data?.latinName)" class="text-sm text-slate-600 dark:text-slate-300 mt-1">
                      {{ (result.description || result.note || result.data?.description || result.data?.note) }}
                    </p>
                    
                  </div>
                </div>
              </div>

              <!-- Разделитель между шапкой и контентом -->
              <div class="border-t border-slate-200 dark:border-slate-600"></div>

              <!-- Калькуляторы дозировок: между шапкой и футером, без внешнего фона и бордера, во всю ширину -->
              <div v-if="result?.dosages?.type === 'calculator' && Array.isArray(result?.dosages?.variants)" class="">
                <div class="mt-0 rounded-none bg-transparent border-0" v-if="initDrugCalc(result)">
                  <div class="px-3 py-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  </div>
                  <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="drugCalc[getDrugId(result)].weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Вариант</label>
                        <USelect v-model="drugCalc[getDrugId(result)].variant" size="xl" :items="getVariantItems(result)" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Метод</label>
                        <USelect v-model="drugCalc[getDrugId(result)].method" size="xl" :items="getMethodItems(result, drugCalc[getDrugId(result)].variant)" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Группа</label>
                        <USelect v-model="drugCalc[getDrugId(result)].groupIdx" size="xl" :items="getGroupItems(result)" class="w-full" />
                      </div>
                    </div>
                    <div class="px-3">
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Дозировка ({{ getPerKgUnit(result) }})</label>
                      <USelect v-model="drugCalc[getDrugId(result)].doseValue" size="xl" :items="getDoseItems(result)" class="w-full" />
                    </div>
                    <div class="px-3 pb-2">
                      <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-700 dark:text-slate-300">
                          <span class="font-medium">Расчетная доза:&nbsp;</span>
                          <span v-if="calcDoseByPerKg(result)">{{ calcDoseByPerKg(result) }} {{ resultUnitByPerKg(result) }}</span>
                          <span v-else> —</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="result?.dosages?.type === 'simple_calculator'" class="">
                <div class="mt-0 rounded-none bg-transparent border-0" v-if="initDrugCalc(result)">
                  <div class="px-3 py-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  </div>
                  <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="drugCalc[getDrugId(result)].weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ simpleUnit(result) }})</label>
                        <USelect v-model="drugCalc[getDrugId(result)].simpleDose" size="xl" :items="simpleDoseItems(result)" class="w-full" />
                      </div>
                    </div>
                    <div class="px-3 pb-2">
                      <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-700 dark:text-slate-300">
                          <span class="font-medium">Расчетная доза:&nbsp;</span>
                          <span v-if="simpleResult(result).value">
                            {{ simpleResult(result).value }} {{ simpleResult(result).unit }}
                            <span v-if="simpleResult(result).capped" class="text-xs text-amber-600 dark:text-amber-400">(указана максимальная доза)</span>
                          </span>
                          <span v-else> —</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="result?.dosages?.type === 'simple_calculator_with_ml'" class="">
                <div class="mt-0 rounded-none bg-transparent border-0" v-if="initDrugCalc(result)">
                  <div class="px-3 py-2">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  </div>
                  <div class="space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 px-3">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="drugCalc[getDrugId(result)].weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ withMlMgUnit(result) }}; {{ withMlMlUnit(result) }})</label>
                        <USelect v-model="drugCalc[getDrugId(result)].withMlIndex" size="xl" :items="withMlDoseItems(result)" class="w-full" />
                      </div>
                    </div>
                    <div class="px-3 pb-2">
                      <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-700 dark:text-slate-300">
                          <span class="font-medium">Расчетная доза:&nbsp;</span>
                          <span v-if="withMlResult(result).mg">
                            {{ withMlResult(result).mg }} мг ({{ withMlResult(result).ml }} мл)
                            <span v-if="withMlResult(result).capped" class="text-xs text-amber-600 dark:text-amber-400">(указана максимальная доза)</span>
                          </span>
                          <span v-else> —</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                <div class="flex flex-wrap gap-1 pt-2">
                  <button @click="openDrugModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-heroicons:eye" class="w-3 h-3" />Подробнее
                  </button>
                  <button @click="addDrugBookmark(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full text-xs hover:bg-green-200 dark:hover:bg-green-800 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-heroicons:bookmark" class="w-3 h-3" />В закладки
                  </button>
                  <button @click="copyToClipboard((result.title || result.name) + ': ' + (result.description || result.note || ''))" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Кнопка "Показать еще" для препаратов -->
            <div v-if="groupedResults.drug.length > 3" class="flex justify-center pt-2">
              <button @click="toggleGroup('drug')" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors border-0 cursor-pointer">
                <UIcon :name="expandedGroups.drug ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                {{ expandedGroups.drug ? 'Скрыть' : `Показать еще ${getHiddenCount('drug', groupedResults.drug)} результатов` }}
              </button>
            </div>
          </div>
          </template>

          <!-- Подстанции -->
          <template v-if="group.key === 'substation'">
          <div class="space-y-3">
            <div v-for="result in getDisplayedResults('substation', groupedResults.substation)" :key="result._id || result.id" 
              class="bg-white dark:bg-slate-700 rounded-lg border border-slate-200 dark:border-slate-600 overflow-hidden">
              <div class="p-3">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <h4 class="font-medium text-slate-900 dark:text-white">{{ result.title || result.name || result.data?.name || result.data?.title }}</h4>
                    <p v-if="result.data?.address || result.address" class="text-sm text-slate-500 dark:text-slate-400 mt-1">{{ result.data?.address || result.address }}</p>
                  </div>
                </div>
              </div>
              
              <!-- Разделитель между шапкой и контентом -->
              <div class="border-t border-slate-100 dark:border-slate-600"></div>
              
              <!-- Контентная часть с телефонами и картой -->
              <div class="px-3 py-2 bg-slate-50/50 dark:bg-slate-800/30">
                <!-- Кнопки для телефонов -->
                <div v-if="result.data?.phones || result.phones" class="flex flex-wrap gap-2">
                  <button 
                    v-for="(phone, index) in getPhoneArray(result.data?.phones || result.phones)" 
                    :key="index"
                    @click="callPhone(phone)"
                    class="inline-flex items-center px-3 py-1 bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 rounded-full text-sm hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors cursor-pointer"
                  >
                    <UIcon name="i-lucide-phone" class="w-3 h-3 mr-1" />{{ phone }}
                  </button>
                </div>
                
                <!-- Карта подстанции -->
                <div v-if="result.location?.coordinates && Array.isArray(result.location.coordinates) && result.location.coordinates.length === 2" class="mt-3">
                  <div class="bg-slate-50 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div class="h-32 w-full">
                      <YMap 
                        :center="[result.location.coordinates[1], result.location.coordinates[0]]"
                        :zoom="15"
                        :placemarks="[{
                          id: result.id,
                          coords: [result.location.coordinates[1], result.location.coordinates[0]],
                          hint: result.title || result.name || result.data?.name || result.data?.title,
                          balloon: getSubstationBalloon(result)
                        }]"
                        class="rounded-lg"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div class="px-3 pb-3 pt-0 border-t border-slate-100 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/50">
                <div class="flex flex-wrap gap-1 pt-2">
                  <button @click="openSubstationModal(result)" class="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 rounded-full text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-map-pin" class="w-3 h-3" />Открыть
                  </button>
                  <button @click="copyToClipboard((result.title || result.name) + ': ' + (result.description || result.note || result.content))" class="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-xs hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border-0 cursor-pointer">
                    <UIcon name="i-lucide-copy" class="w-3 h-3" />Копировать
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Кнопка "Показать еще" для подстанций -->
            <div v-if="groupedResults.substation.length > 3" class="flex justify-center pt-2">
              <button @click="toggleGroup('substation')" class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-200 dark:hover:bg-slate-500 transition-colors border-0 cursor-pointer">
                <UIcon :name="expandedGroups.substation ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'" class="w-4 h-4" />
                {{ expandedGroups.substation ? 'Скрыть' : `Показать еще ${getHiddenCount('substation', groupedResults.substation)} результатов` }}
              </button>
            </div>
          </div>
          </template>
        </template>
      </div>

      <!-- Пустое состояние -->
      <div v-else class="text-center py-12">
        <div class="text-slate-400 dark:text-slate-500">
          <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
          </svg>
          <p class="text-lg font-medium mb-2">{{ searchQuery ? 'Ничего не найдено' : 'Начните поиск' }}</p>
          <p class="text-sm">{{ searchQuery ? 'Попробуйте изменить запрос или использовать другие ключевые слова' : 'Введите запрос в поле поиска выше' }}</p>
        </div>
      </div>
    </div>
  </div>
  </ClientOnly>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import DOMPurify from 'dompurify'
import { nextTick, onMounted, onBeforeUnmount } from 'vue'
import { useGlobalSearch } from '~/composables/useGlobalSearch'

const { isSearchActive, isSearching, searchResults, groupedResults, selectSearchResult, deactivateSearch, currentPageContext, searchQuery } = useGlobalSearch()

// Определяем порядок отображения групп в зависимости от контекста страницы
const groupDisplayOrder = computed(() => {
  const context = currentPageContext.value
  
  switch (context) {
    case 'algorithm':
      return ['algorithm', 'mkb', 'ls', 'drug', 'substation']
    case 'mkb':
      return ['mkb', 'algorithm', 'ls', 'drug', 'substation']
    case 'ls':
      return ['ls', 'mkb', 'algorithm', 'drug', 'substation']
    case 'drug':
      return ['drug', 'algorithm', 'mkb', 'ls', 'substation']
    case 'substation':
      return ['substation', 'mkb', 'ls', 'algorithm', 'drug']
    default:
      return ['mkb', 'algorithm', 'ls', 'drug', 'substation']
  }
})

// Получаем группы в правильном порядке
const orderedGroups = computed(() => {
  const groups: Array<{ key: string, title: string, results: any[] }> = []
  
  groupDisplayOrder.value.forEach(groupKey => {
    const results = groupedResults.value[groupKey]
    if (results && results.length > 0) {
      let title = ''
      switch (groupKey) {
        case 'mkb':
          title = 'МКБ'
          break
        case 'ls':
          title = 'Локальные статусы'
          break
        case 'algorithm':
          title = 'Алгоритмы'
          break
        case 'drug':
          title = 'Препараты'
          break
        case 'substation':
          title = 'Подстанции'
          break
      }
      groups.push({ key: groupKey, title, results })
    }
  })
  
  return groups
})

// Состояние развернутых групп
const expandedGroups = ref<Record<string, boolean>>({
  mkb: false,
  localStatus: false,
  algorithm: false,
  drug: false,
  substation: false
})

// Функции для управления развертыванием групп
const toggleGroup = (groupName: string) => {
  expandedGroups.value[groupName] = !expandedGroups.value[groupName]
}

// Получение отображаемых результатов для каждой группы
const getDisplayedResults = (groupName: string, results: any[]) => {
  if (expandedGroups.value[groupName] || results.length <= 3) {
    return results
  }
  return results.slice(0, 3)
}

// Проверка, есть ли скрытые результаты
const hasHiddenResults = (groupName: string, results: any[]) => {
  return !expandedGroups.value[groupName] && results.length > 3
}

// Получение количества скрытых результатов
const getHiddenCount = (groupName: string, results: any[]) => {
  return Math.max(0, results.length - 3)
}

// Работа с телефонами подстанций
const getPhoneArray = (phones: any): string[] => {
  if (!phones) return []
  
  // Если это уже массив
  if (Array.isArray(phones)) {
    return phones.filter(phone => phone && phone.trim())
  }
  
  // Если это строка, пытаемся распарсить
  if (typeof phones === 'string') {
    try {
      const parsed = JSON.parse(phones)
      if (Array.isArray(parsed)) {
        return parsed.filter(phone => phone && phone.trim())
      }
    } catch {
      // Если не JSON, разделяем по запятым
      return phones.split(',').map((p: string) => p.trim()).filter((p: string) => p)
    }
  }
  
  return []
}

const callPhone = (phone: string) => {
  // Очищаем номер от лишних символов для tel: ссылки
  const cleanPhone = phone.replace(/[^\d+]/g, '')
  window.open(`tel:${cleanPhone}`, '_self')
}

// Функция для создания balloon подстанции
const getSubstationBalloon = (result: any) => {
  const name = result.title || result.name || result.data?.name || result.data?.title
  const address = result.data?.address || result.address || ''
  const phones = result.phones || []
  
  let balloon = `
    <div class="balloon-header">
      <div class="balloon-title">${name}</div>
      <div class="balloon-subtitle">${address}</div>
    </div>
    <div class="balloon-body">`
  
  if (phones && phones.length > 0) {
    phones.forEach((phone: string) => {
      balloon += `
        <div class="phone-item" onclick="window.open('tel:${phone}', '_self')">
          <svg class="phone-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
          </svg>
          <span class="phone-text">${phone}</span>
        </div>`
    })
  } else {
    balloon += `<div style="text-align: center; color: #64748b; font-size: 12px; padding: 8px;">Телефоны не указаны</div>`
  }
  
  balloon += `</div>`
  return balloon
}

// Закрывать поиск при любой навигации
try {
  const router = useRouter()
  router.afterEach(() => {
    deactivateSearch()
  })
} catch {}

const route = useRoute()

// Состояние калькуляторов дозировок для карточек препаратов в поиске
const drugCalc = reactive<Record<string, {
  weight: number | null
  variant?: string
  method?: string
  groupIdx: number
  doseValue?: string | number
  simpleDose?: string
  withMlIndex?: number
}>>({})

const getDrugId = (r: any): string => String(r?._id || r?.data?._id || r?.id || '')

const getDrugVariants = (r: any): any[] => Array.isArray(r?.dosages?.variants) ? r.dosages.variants : []
const getVariantNames = (r: any): string[] => Array.from(new Set(getDrugVariants(r).map((v: any) => String(v?.variant_name || '').trim()).filter(Boolean)))
const getVariantItems = (r: any) => getVariantNames(r).map(n => ({ label: n, value: n }))
const getVariantListForName = (r: any, name?: string): any[] => {
  const nm = String(name || '').trim()
  const list = getDrugVariants(r).filter((v: any) => String(v?.variant_name || '').trim() === nm)
  return list
}
const getMethodItems = (r: any, name?: string) => {
  const list = getVariantListForName(r, name)
  const methods = list.map((v: any) => v?.method).flat()
  const flat = Array.isArray(methods) ? methods : list.map((v: any) => v?.method)
  const uniq = Array.from(new Set((flat as any[]).filter(Boolean).map(x => String(x))))
  return uniq.map(m => ({ label: m, value: m }))
}
const getCurrentVariant = (r: any): any | null => {
  const id = getDrugId(r)
  const st = drugCalc[id]
  if (!st?.variant) return null
  const list = getVariantListForName(r, st.variant)
  if (st.method) return list.find((v: any) => String(v?.method) === String(st.method)) || list[0] || null
  return list[0] || null
}
const getGroups = (r: any): any[] => (getCurrentVariant(r)?.groups || [])
const getGroupItems = (r: any) => getGroups(r).map((g: any, i: number) => ({ label: g?.group_name || `Группа ${i + 1}`, value: i }))
const getCurrentGroup = (r: any): any | null => getGroups(r)[drugCalc[getDrugId(r)]?.groupIdx || 0] || null
const getDoseItems = (r: any) => (getCurrentGroup(r)?.doses || []).map((d: any) => ({ label: String(d), value: d }))
const getPerKgUnit = (r: any): string => {
  const u = String(getCurrentGroup(r)?.unit || '').trim()
  const id = getDrugId(r)
  return u || (drugCalc[id]?.method === 'инфузор' ? 'мг/кг/час' : 'мг/кг')
}

const initDrugCalc = (r: any): boolean => {
  const id = getDrugId(r)
  if (!id) return true
  if (!drugCalc[id]) {
    drugCalc[id] = { weight: null, groupIdx: 0 }
  }
  const st = drugCalc[id]
  // Вариант по умолчанию
  if (!st.variant) st.variant = getVariantNames(r)[0]
  // Метод по умолчанию
  if (!st.method) st.method = getMethodItems(r, st.variant)[0]?.value
  // Группа и доза по умолчанию
  const grp = getCurrentGroup(r)
  if (st.groupIdx == null) st.groupIdx = 0
  if (!st.doseValue) st.doseValue = grp?.default_dose ?? (grp?.doses || [])[0]
  // simple калькулятор — доза по умолчанию
  if (r?.dosages?.type === 'simple_calculator' && !st.simpleDose) {
    const arr = Array.isArray(r?.dosages?.doses) ? r.dosages.doses : []
    st.simpleDose = arr.length ? String(arr[0]) : undefined
  }
  // with ml — индекс по умолчанию
  if (r?.dosages?.type === 'simple_calculator_with_ml' && st.withMlIndex == null) {
    const defMg = r?.dosages?.mg_dosages?.default_dose
    if (defMg != null) {
      const mgArr = Array.isArray(r?.dosages?.mg_dosages?.doses) ? r.dosages.mg_dosages.doses : []
      const idx = mgArr.findIndex((x: any) => String(x) === String(defMg))
      st.withMlIndex = idx >= 0 ? idx : 0
    } else {
      st.withMlIndex = 0
    }
  }
  return true
}

// Расчеты
const calcDoseByPerKg = (r: any): string => {
  const id = getDrugId(r)
  const st = drugCalc[id]
  if (!st?.weight || !st?.doseValue) return ''
  const perKg = parseFloat(String(st.doseValue).replace(',', '.'))
  if (!perKg || perKg <= 0) return ''
  const total = Math.round(perKg * (st.weight || 0) * 10) / 10
  return String(total)
}
const resultUnitByPerKg = (r: any): string => getPerKgUnit(r).includes('/час') ? 'мг/час' : 'мг'

const simpleUnit = (r: any): string => String(r?.dosages?.unit || 'мг/кг')
const simpleDoseItems = (r: any) => {
  const arr = Array.isArray(r?.dosages?.doses) ? r.dosages.doses : []
  return arr.map((x: any) => ({ label: String(x), value: String(x) }))
}
const simpleResult = (r: any): { value: string; unit: string; capped: boolean } => {
  const id = getDrugId(r)
  const st = drugCalc[id]
  const d = r?.dosages
  if (!d || d.type !== 'simple_calculator') return { value: '', capped: false, unit: '' }
  const w = Number(st?.weight || 0)
  const perKg = parseFloat(String(st?.simpleDose || '').replace(',', '.'))
  if (!w || isNaN(perKg)) return { value: '', capped: false, unit: d.unit || '' }
  let total = perKg * w
  total = Math.round(total * 100) / 100
  let capped = false
  const rawMax = d.max_dose != null ? d.max_dose : d.mxn_dose
  if (rawMax != null) {
    const maxv = Number(rawMax)
    if (!isNaN(maxv) && total > maxv) { total = maxv; capped = true }
  }
  return { value: String(total), capped, unit: d.max_dose_unit || d.mxn_dose_unit || (d.unit ? String(d.unit).split('/')[0] : 'мг') }
}

const withMlMgUnit = (r: any) => (r?.dosages?.mg_dosages?.unit || 'мг/кг')
const withMlMlUnit = (r: any) => (r?.dosages?.ml_dosages?.unit || 'мл/кг')
const withMlDoseItems = (r: any) => {
  const d = r?.dosages
  if (!d || d.type !== 'simple_calculator_with_ml') return []
  const mg = Array.isArray(d.mg_dosages?.doses) ? d.mg_dosages.doses : []
  const ml = Array.isArray(d.ml_dosages?.doses) ? d.ml_dosages.doses : []
  const maxLen = Math.max(mg.length, ml.length)
  const items: Array<{ label: string; value: number }> = []
  for (let i = 0; i < maxLen; i++) {
    const mgVal = mg[i] != null ? String(mg[i]) : ''
    const mlVal = ml[i] != null ? String(ml[i]) : ''
    const label = `${mgVal || '—'} ${withMlMgUnit(r)}${mlVal ? ` (${mlVal} ${withMlMlUnit(r)})` : ''}`
    items.push({ label, value: i })
  }
  return items
}
const withMlResult = (r: any): { mg: string; ml: string; capped: boolean } => {
  const id = getDrugId(r)
  const st = drugCalc[id]
  const d = r?.dosages
  if (!d || d.type !== 'simple_calculator_with_ml') return { mg: '', ml: '', capped: false }
  const w = Number(st?.weight || 0)
  const idx = Number(st?.withMlIndex ?? -1)
  if (!w || idx < 0) return { mg: '', ml: '', capped: false }
  const mgDose = parseFloat(String((d.mg_dosages?.doses || [])[idx] ?? '').replace(',', '.'))
  const mlDose = parseFloat(String((d.ml_dosages?.doses || [])[idx] ?? '').replace(',', '.'))
  if (Number.isNaN(mgDose) && Number.isNaN(mlDose)) return { mg: '', ml: '', capped: false }
  let mgTotal = !Number.isNaN(mgDose) ? mgDose * w : 0
  let mlTotal = !Number.isNaN(mlDose) ? mlDose * w : 0
  mgTotal = Math.round(mgTotal * 10) / 10
  mlTotal = Math.round(mlTotal * 10) / 10
  let capped = false
  const max = d.max_dose
  const maxUnit = d.max_dose_unit
  if (max != null && maxUnit) {
    const maxNum = Number(max)
    if (!Number.isNaN(maxNum)) {
      if (String(maxUnit).toLowerCase().includes('мг') && mgTotal > maxNum) { mgTotal = maxNum; capped = true }
      if (String(maxUnit).toLowerCase().includes('мл') && mlTotal > maxNum) { mlTotal = maxNum; capped = true }
    }
  }
  return { mg: mgTotal ? mgTotal.toFixed(1) : '', ml: mlTotal ? mlTotal.toFixed(1) : '', capped }
}

// Состояние разворота таблиц алгоритмов
const expandedTables = ref<Record<string, boolean>>({})
const toggleTable = (tableId: string) => { expandedTables.value[tableId] = !expandedTables.value[tableId] }
const isTableExpanded = (tableId: string) => !!expandedTables.value[tableId]

// Функция для обрезки текста до приблизительного количества строк
const truncateToApproximateLines = (text: string, maxLines: number = 5) => {
  if (!text) return ''
  
  // Примерно 60-70 символов на строку для текста размера text-sm
  const charsPerLine = 65
  const maxChars = maxLines * charsPerLine
  
  if (text.length <= maxChars) return text
  
  // Находим последний пробел перед лимитом, чтобы не обрезать слово
  let cutIndex = maxChars
  while (cutIndex > 0 && text[cutIndex] !== ' ') {
    cutIndex--
  }
  
  if (cutIndex === 0) cutIndex = maxChars
  
  return text.substring(0, cutIndex) + '...'
}

// Функция для рендеринга markdown
const renderMarkdown = (text: string) => {
  if (!text) return ''
  const html = marked.parse(text) as string
  return DOMPurify.sanitize(html)
}

// Функция для рендеринга таблиц алгоритмов с мобильной поддержкой (точно как на странице алгоритмов)
const renderAlgorithmTable = (content: string): string => {
  if (!content) return ''
  
  // Очищаем контент от лишних тегов и оставляем только таблицы
  let html = content
  
  // Удаляем все кроме таблиц
  const tableMatch = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi)
  if (!tableMatch) return ''
  
  // Берем первую таблицу и стилизуем её
  let table = tableMatch[0]
  
  // Удаляем лишние теги, которые могут появиться из-за неправильной обработки
  table = table.replace(/<tr><th[^>]*><\/th><\/tr>/gi, '')
  
  // Создаем временный DOM элемент для работы с таблицей
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = table
  const tableElement = tempDiv.querySelector('table') as HTMLTableElement
  
  if (!tableElement) return table
  
  // Применяем стили точно как на странице алгоритмов
  // Стили только для содержимого таблицы, без внешнего бордера
  tableElement.classList.remove('border', 'border-slate-100', 'dark:border-slate-700', 'rounded-lg', 'rounded-md', 'overflow-hidden')
  tableElement.classList.add('w-full', 'table-fixed', 'border-0', 'bg-transparent')
  tableElement.style.tableLayout = 'fixed'
  
  const thead = tableElement.querySelector('thead')
  const tbody = tableElement.querySelector('tbody')
  if (thead) thead.classList.add('bg-slate-100', 'dark:bg-slate-800', 'border-b', 'border-slate-100', 'dark:border-slate-700', 'sticky', 'top-0', 'z-20')
  if (tbody) tbody.classList.add('divide-y', 'divide-slate-100', 'dark:divide-slate-700')
  
  // Равномерное распределение 3 колонок + перенос текста
  tableElement.querySelectorAll('colgroup col').forEach(col => (col as HTMLElement).style.width = '33.3333%')
  
  tableElement.querySelectorAll('th').forEach(th => {
    th.classList.remove('text-left', 'align-top', 'h-[85px]')
    th.classList.add('px-4', 'py-3', 'text-sm', 'text-slate-600', 'dark:text-slate-300', 'text-center', 'font-medium', 'whitespace-normal', 'break-words', 'align-middle', 'sticky', 'top-0', 'z-20', 'bg-slate-200', 'dark:bg-slate-800')
  })
  
  tableElement.querySelectorAll('td').forEach(td => {
    td.classList.add('p-4', 'text-sm', 'text-slate-600', 'dark:text-slate-300', 'whitespace-normal', 'break-words', 'align-top', 'bg-white', 'dark:bg-slate-800')
  })
  
  tableElement.querySelectorAll('tr').forEach(tr => tr.classList.add('hover:bg-slate-50/60', 'dark:hover:bg-slate-700/40'))
  
  // Бордеры: у первой колонки справа, у второй слева и справа на md+ экранах
  tableElement.querySelectorAll('thead tr').forEach(tr => {
    const cells = Array.from(tr.children) as HTMLElement[]
    if (cells[0]) cells[0].classList.add('border-r', 'border-slate-100', 'dark:border-slate-700')
    if (cells[1]) {
      cells[1].classList.add('border-l', 'border-slate-100', 'dark:border-slate-700')
      cells[1].classList.add('md:border-r', 'md:border-slate-100', 'md:dark:border-slate-700')
    }
  })
  
  tableElement.querySelectorAll('tbody tr').forEach(tr => {
    const cells = Array.from(tr.children) as HTMLElement[]
    if (cells[0]) cells[0].classList.add('border-r', 'border-slate-100', 'dark:border-slate-700')
    if (cells[1]) {
      cells[1].classList.add('border-l', 'border-slate-100', 'dark:border-slate-700')
      cells[1].classList.add('md:border-r', 'md:border-slate-100', 'md:dark:border-slate-700')
    }
  })
  
  // Возвращаем HTML строку
  return tableElement.outerHTML
}

// Функция для настройки мобильной логики таблиц
const setupMobileTableLogic = () => {
  nextTick(() => {
    const tables = document.querySelectorAll('[data-styled-table-wrapper] table')
    tables.forEach(table => {
      const wrapper = table.closest('[data-styled-table-wrapper]') as HTMLElement
      if (wrapper && !wrapper.hasAttribute('data-mobile-init')) {
        // Применяем стили темной темы после рендеринга
        applyDarkThemeStyles(table as HTMLTableElement)
        // Настраиваем мобильную логику
        setupMobileTwoColumn(table as HTMLTableElement)
      }
    })
  })
}

// Функция для применения стилей темной темы к таблице
const applyDarkThemeStyles = (table: HTMLTableElement) => {
  // Проверяем, активна ли темная тема
  const isDark = document.documentElement.classList.contains('dark')
  
  if (isDark) {
    // Применяем стили для темной темы
    const thead = table.querySelector('thead')
    if (thead) {
      thead.style.backgroundColor = '#1e293b'
      thead.style.borderBottomColor = '#475569'
    }
    
    const tbody = table.querySelector('tbody')
    if (tbody) {
      tbody.style.borderTopWidth = '0'
    }
    
    // Стили для заголовков
    table.querySelectorAll('th').forEach(th => {
      th.style.color = '#cbd5e1'
      th.style.backgroundColor = '#1e293b'
    })
    
    // Стили для ячеек
    table.querySelectorAll('td').forEach(td => {
      td.style.color = '#cbd5e1'
      td.style.backgroundColor = '#1e293b'
    })
    
    // Границы между колонками
    table.querySelectorAll('thead tr th:first-child, tbody tr td:first-child').forEach(cell => {
      (cell as HTMLElement).style.borderRightColor = '#475569'
    })
    
    table.querySelectorAll('thead tr th:nth-child(2), tbody tr td:nth-child(2)').forEach(cell => {
      (cell as HTMLElement).style.borderLeftColor = '#475569'
      if (window.innerWidth >= 768) {
        (cell as HTMLElement).style.borderRightColor = '#475569'
      }
    })
    
    // Границы между строками
    table.querySelectorAll('tbody tr').forEach(tr => {
      (tr as HTMLElement).style.borderBottomColor = '#475569'
    })
    
    // Добавляем hover эффекты для темной темы
    table.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('mouseenter', () => {
        (tr as HTMLElement).style.backgroundColor = 'rgba(51, 65, 85, 0.4)'
      })
      tr.addEventListener('mouseleave', () => {
        (tr as HTMLElement).style.backgroundColor = ''
      })
    })
  } else {
    // Применяем стили для светлой темы
    const thead = table.querySelector('thead')
    if (thead) {
      thead.style.backgroundColor = '#f1f5f9'
      thead.style.borderBottomColor = '#e2e8f0'
    }
    
    const tbody = table.querySelector('tbody')
    if (tbody) {
      tbody.style.borderTopWidth = '0'
    }
    
    // Стили для заголовков
    table.querySelectorAll('th').forEach(th => {
      th.style.color = '#475569'
      th.style.backgroundColor = '#e2e8f0'
    })
    
    // Стили для ячеек
    table.querySelectorAll('td').forEach(td => {
      td.style.color = '#475569'
      td.style.backgroundColor = '#ffffff'
    })
    
    // Границы между колонками
    table.querySelectorAll('thead tr th:first-child, tbody tr td:first-child').forEach(cell => {
      (cell as HTMLElement).style.borderRightColor = '#e2e8f0'
    })
    
    table.querySelectorAll('thead tr th:nth-child(2), tbody tr td:nth-child(2)').forEach(cell => {
      (cell as HTMLElement).style.borderLeftColor = '#e2e8f0'
      if (window.innerWidth >= 768) {
        (cell as HTMLElement).style.borderRightColor = '#e2e8f0'
      }
    })
    
    // Границы между строками
    table.querySelectorAll('tbody tr').forEach(tr => {
      (tr as HTMLElement).style.borderBottomColor = '#e2e8f0'
    })
    
    // Добавляем hover эффекты для светлой темы
    table.querySelectorAll('tr').forEach(tr => {
      tr.addEventListener('mouseenter', () => {
        (tr as HTMLElement).style.backgroundColor = 'rgba(248, 250, 252, 0.6)'
      })
      tr.addEventListener('mouseleave', () => {
        (tr as HTMLElement).style.backgroundColor = ''
      })
    })
  }
}

// Наблюдатель за изменением темы
const setupThemeObserver = () => {
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        // Тема изменилась, обновляем стили всех таблиц
        nextTick(() => {
          const tables = document.querySelectorAll('[data-styled-table-wrapper] table')
          tables.forEach(table => {
            applyDarkThemeStyles(table as HTMLTableElement)
          })
        })
      }
    })
  })
  
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  })
  
  return observer
}

// Функция для настройки мобильного отображения таблицы в две колонки
const setupMobileTwoColumn = (table: HTMLTableElement) => {
  const wrapper = table.closest('[data-styled-table-wrapper]') as HTMLElement | null
  if (!wrapper) return
  if (wrapper.getAttribute('data-mobile-init') === '1') {
    // Обновим отображение при повторном вызове (напр., при ререндере)
    applyMobileTwoColumnView(wrapper, table)
    return
  }
  wrapper.setAttribute('data-mobile-init', '1')
  // По умолчанию показываем 2-ю колонку на мобильных
  if (!wrapper.getAttribute('data-mobile-col')) wrapper.setAttribute('data-mobile-col', '2')

  // Обработчики свайпов
  let touchStartX = 0
  let touchStartY = 0
  let touchStartTs = 0
  let isDragging = false
  let lastDx = 0
  const minDistance = 60 // пикселей
  wrapper.style.touchAction = 'pan-y'
  wrapper.addEventListener('touchstart', (e: TouchEvent) => {
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    touchStartX = t.clientX
    touchStartY = t.clientY
    touchStartTs = Date.now()
    isDragging = true
    lastDx = 0
  }, { passive: true })
  wrapper.addEventListener('touchmove', (e: TouchEvent) => {
    if (!isMobile() || !isDragging) return
    if (!e.touches || e.touches.length === 0) return
    const t = e.touches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    // Только горизонтальный доминирующий жест
    if (Math.abs(dx) <= Math.abs(dy) * 1.2) return
    lastDx = dx
  }, { passive: true })

  wrapper.addEventListener('touchend', (e: TouchEvent) => {
    if (!isMobile()) return
    if (!e.changedTouches || e.changedTouches.length === 0) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStartX
    const dy = t.clientY - touchStartY
    const dt = Date.now() - touchStartTs
    // Условия для валидного горизонтального свайпа
    const maxDuration = 600 // мс
    const horizontalDominance = Math.abs(dx) > Math.abs(dy) * 1.5
    const shouldSwitch = Math.abs(dx) >= minDistance && horizontalDominance && dt <= maxDuration
    
    if (shouldSwitch) {
      if (dx < 0) wrapper.setAttribute('data-mobile-col', '3')
      else wrapper.setAttribute('data-mobile-col', '2')
      
      applyMobileTwoColumnView(wrapper, table)
    }
    isDragging = false
  }, { passive: true })

  // На ресайз восстанавливаем/применяем вид
  const onResize = () => applyMobileTwoColumnView(wrapper, table)
  window.addEventListener('resize', onResize)

  // Начальная отрисовка
  applyMobileTwoColumnView(wrapper, table)
}

// Функция для применения мобильного/десктоп отображения таблицы
const applyMobileTwoColumnView = (wrapper: HTMLElement, table: HTMLTableElement) => {
  const mobileTarget = wrapper.getAttribute('data-mobile-col') === '3' ? 3 : 2
  const rows = table.querySelectorAll('thead tr, tbody tr')
  const colgroup = table.querySelector('colgroup') as HTMLElement | null
  const cols = colgroup ? Array.from(colgroup.querySelectorAll('col')) as HTMLElement[] : []

  if (isMobile()) {
    // Мобильный режим: первая колонка + выбранная (2-я или 3-я)
    const thead = table.querySelector('thead')
    if (thead) {
      let dotsContainer = thead.querySelector('[data-mobile-dots-container]') as HTMLElement | null
      if (!dotsContainer) {
        dotsContainer = document.createElement('div')
        dotsContainer.setAttribute('data-mobile-dots-container', '1')
        dotsContainer.classList.add('md:hidden', 'absolute', 'right-2', 'top-1/2', '-translate-y-1/2', 'flex', 'items-center', 'gap-1', 'z-30', 'pointer-events-none', 'bg-slate-100', 'dark:bg-slate-800', 'p-1', 'rounded-full')
        
        const dot2 = document.createElement('span')
        dot2.setAttribute('data-dot', '2')
        dot2.classList.add('inline-block', 'w-1.5', 'h-1.5', 'rounded-full')
        
        const dot3 = document.createElement('span')
        dot3.setAttribute('data-dot', '3')
        dot3.classList.add('inline-block', 'w-1.5', 'h-1.5', 'rounded-full')
        
        dotsContainer.appendChild(dot2)
        dotsContainer.appendChild(dot3)
        thead.appendChild(dotsContainer)
      }
      
      // Обновляем активные точки
      const dot2 = dotsContainer.querySelector('[data-dot="2"]') as HTMLElement
      const dot3 = dotsContainer.querySelector('[data-dot="3"]') as HTMLElement
      
      if (mobileTarget === 2) {
        dot2.style.backgroundColor = 'rgb(59 130 246)'
        dot3.style.backgroundColor = 'rgb(148 163 184)'
      } else {
        dot2.style.backgroundColor = 'rgb(148 163 184)'
        dot3.style.backgroundColor = 'rgb(59 130 246)'
      }
    }

    // На мобильных: 2 колонки (первая 35% + выбранная 65%), фиксированная раскладка
    table.style.tableLayout = 'fixed'
    cols.forEach((c, idx) => {
      // ширины колонок на мобилках
      if (idx === 0) c.style.width = '35%'
      if (idx === 1) {
        c.style.width = '65%'
        c.style.display = mobileTarget === 2 ? '' : 'none'
      }
      if (idx === 2) {
        c.style.width = '65%'
        c.style.display = mobileTarget === 3 ? '' : 'none'
      }
    })

    rows.forEach((tr, rowIndex) => {
      const cells = Array.from(tr.children) as HTMLElement[]
      const isHead = !!(tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead')
      
      if (cells[0]) {
        cells[0].classList.remove('hidden', 'w-0', 'p-0')
        cells[0].style.width = '35%'
        cells[0].style.maxWidth = '35%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[0].tagName === 'TH') {
          cells[0].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      
      if (cells[1]) {
        const hide = mobileTarget !== 2
        cells[1].classList.toggle('hidden', hide)
        cells[1].classList.toggle('w-0', hide)
        cells[1].classList.toggle('p-0', hide)
        cells[1].style.width = hide ? '' : '65%'
        cells[1].style.maxWidth = hide ? '' : '65%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[1].tagName === 'TH') {
          cells[1].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      
      if (cells[2]) {
        const hide = mobileTarget !== 3
        cells[2].classList.toggle('hidden', hide)
        cells[2].classList.toggle('w-0', hide)
        cells[2].classList.toggle('p-0', hide)
        cells[2].style.width = hide ? '' : '65%'
        cells[2].style.maxWidth = hide ? '' : '65%'
        
        // Для заголовков добавляем стили обрезки текста
        if (isHead && cells[2].tagName === 'TH') {
          cells[2].classList.add('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
    })
  } else {
    // Десктоп: возвращаем 3 колонки и фиксированную ширину
    table.style.tableLayout = 'fixed'
    if (cols.length === 3) {
      cols.forEach((c, idx) => {
        c.style.display = ''
        // Первая колонка фикс 30%, остальные — авто
        if (idx === 0) c.style.width = '30%'
        else c.style.width = ''
      })
    }
    
    // Убираем индикаторы точек на десктопе
    const thead = table.querySelector('thead')
    if (thead) {
      const dotsContainer = thead.querySelector('[data-mobile-dots-container]') as HTMLElement | null
      if (dotsContainer) dotsContainer.remove()
    }
    rows.forEach((tr) => {
      const cells = Array.from(tr.children) as HTMLElement[]
      const isHead = !!(tr.parentElement && tr.parentElement.tagName.toLowerCase() === 'thead')
      
      if (cells[0]) { 
        cells[0].classList.remove('hidden', 'w-0', 'p-0'); 
        // Фиксированная ширина первой колонки на десктопе
        cells[0].style.width = '30%'
        cells[0].style.maxWidth = '30%'
        // Убираем стили обрезки текста для десктопа
        if (isHead && cells[0].tagName === 'TH') {
          cells[0].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
      if (cells[1]) {
        cells[1].classList.remove('hidden', 'w-0', 'p-0'); 
        cells[1].style.width = ''
        // Убираем стили обрезки текста и индикаторы для десктопа
        if (isHead && cells[1].tagName === 'TH') {
          cells[1].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis', 'relative')
          const dots = cells[1].querySelector('[data-mobile-dots]') as HTMLElement | null
          if (dots) dots.remove()
        }
      }
      if (cells[2]) {
        cells[2].classList.remove('hidden', 'w-0', 'p-0'); 
        cells[2].style.width = ''
        // Убираем стили обрезки текста для десктопа
        if (isHead && cells[2].tagName === 'TH') {
          cells[2].classList.remove('whitespace-nowrap', 'overflow-hidden', 'text-ellipsis')
        }
      }
    })
  }
}

// Функция для определения мобильного устройства
const isMobile = () => {
  return window.innerWidth < 768
}

// Функция для копирования в буфер обмена
const copyToClipboard = async (text: string) => {
  try { 
    await navigator.clipboard.writeText(text) 
  } catch (err) { 
    console.error('Ошибка копирования:', err) 
  }
}

// Функция для предзагрузки и навигации
const preloadAndNavigate = async (to: string, preloadFn: () => Promise<void>) => {
  try { 
    await preloadFn()
    deactivateSearch()
    await navigateTo(to)
  } catch (err) {
    console.error('Ошибка навигации:', err)
  }
}

// Функции для открытия модалов (скопированы из BottomSearchPanel)
const openMkbModal = (result: any) => {
  // Если в результате уже есть готовый url — используем его
  if (result.url) {
    const url = result.url
    preloadAndNavigate(url, async () => {
      const m = url.match(/\/codifier\/(.*?)\?/)
      const categoryUrl = m?.[1]
      if (categoryUrl) { await $fetch(`/api/codifier/${categoryUrl}`).catch(() => {}) }
    })
    return
  }

  // Пробуем получить категорию и id на верхнем уровне, как в выдаче
  const categoryUrl = result.category?.url || result.data?.category?.url
  const mkbId = result._id || result.data?._id || result.id?.replace('mkb-', '')
  if (categoryUrl && mkbId) {
    const target = `/codifier/${categoryUrl}?id=${mkbId}`
    preloadAndNavigate(target, async () => { await $fetch(`/api/codifier/${categoryUrl}`).catch(() => {}) })
    return
  }
}

const openLocalStatusModal = (result: any) => {
  // Предпочтительно: собрать URL из полей результата
  const categoryUrl = result.category?.url || result.data?.category?.url
  const lsId = result._id || result.data?._id || result.id?.replace('ls-', '')
  if (categoryUrl && lsId) {
    const target = `/local-statuses/${categoryUrl}?id=${lsId}`
    preloadAndNavigate(target, async () => {
      await $fetch(`/api/local-statuses/${categoryUrl}`).catch(() => {})
    })
    return
  }

  // Fallback: если уже есть готовый url
  if (result.url) {
    const url = result.url
    preloadAndNavigate(url, async () => {
      const m = url.match(/\/local-statuses\/(.*?)\?/)
      const cat = m?.[1]
      if (cat) { await $fetch(`/api/local-statuses/${cat}`).catch(() => {}) }
    })
  }
}

const openAlgorithmModal = (result: any) => {
  // Предпочтительно используем реальные поля объекта алгоритма из БД
  const section = result?.section?.url || result?.section
  const category = result?.category?.url || result?.category
  const algorithmId = result?._id || result?.id?.replace('algo-', '')

  if (section && category && algorithmId) {
    const target = `/algorithms/${section}/${category}/${algorithmId}`
    preloadAndNavigate(target, async () => { 
      await $fetch(`/api/algorithms/${section}/${category}`).catch(() => {}) 
    })
    return
  }

  // Поддержка заранее собранного URL (если он есть)
  if (result.url) {
    const url = result.url
    preloadAndNavigate(url, async () => {
      const m = url.match(/\/algorithms\/(.*?)\/(.*?)\/(.*?)(?:\?|$)/)
      const s = m?.[1]
      const c = m?.[2]
      if (s && c) {
        await $fetch(`/api/algorithms/${s}/${c}`).catch(() => {})
      }
    })
    return
  }

  // Если не хватает данных — не уводим на общий список, просто скрываем поиск
  deactivateSearch()
}

const openDrugModal = (drugData: any) => {
  console.log('openDrugModal вызвана с данными:', drugData)
  const raw = drugData?._id || drugData?.data?._id || drugData?.id
  const id = raw ? String(raw).replace(/^drug-/, '') : ''
  console.log('Извлеченный ID:', id)

  if (!id) {
    console.log('Нет корректного ID, переходим на список препаратов')
    // Нет корректного id — просто переходим на список препаратов
    preloadAndNavigate('/drugs', async () => { await $fetch('/api/drugs').catch(() => {}) })
    return
  }

  // Очищаем флаг о закрытии модалки, так как пользователь явно хочет её открыть из поиска
  sessionStorage.removeItem('drugModalClosedByUser')

  // Всегда переходим на страницу с query id для изменения URL
  console.log('Переходим на страницу препаратов с ID:', id)
  const url = `/drugs?id=${id}`
  preloadAndNavigate(url, async () => {
    // Предзагрузим конкретный препарат для ускорения
    await $fetch(`/api/drugs/${id}`).catch(() => {})
  })
}

const addDrugBookmark = async (drugData: any) => {
  if (!drugData?._id) return
  
  try {
    await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'drug',
        itemId: drugData._id,
        title: drugData.name || drugData.title,
        description: drugData.description || drugData.note
      }
    })
    // Можно добавить уведомление об успехе
  } catch (err) {
    console.error('Ошибка добавления в закладки:', err)
  }
}

const openSubstationModal = (result: any) => {
  const name = result.title || result.data?.name
  if (name) {
    preloadAndNavigate(`/substations?select=${name}`, async () => { 
      await $fetch('/api/substations').catch(() => {}) 
    })
  }
}

// Инициализация наблюдателя темы
let themeObserver: MutationObserver | null = null

onMounted(() => {
  // Настраиваем наблюдатель за изменением темы
  themeObserver = setupThemeObserver()
})

onBeforeUnmount(() => {
  // Очищаем наблюдатель при размонтировании
  if (themeObserver) {
    themeObserver.disconnect()
    themeObserver = null
  }
})

</script>

<style scoped>
/* Стили для таблиц в результатах поиска - точно как на странице алгоритмов */
:deep(table) {
  width: 100%;
  table-layout: fixed;
  margin-top: 0;
  margin-bottom: 0;
  border: 0;
  background-color: transparent;
}

:deep(thead) {
  background-color: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
  position: sticky;
  top: 0;
  z-index: 20;
}

.dark :deep(thead) {
  background-color: #1e293b;
  border-bottom-color: #475569;
}

:deep(tbody) {
  border-top-width: 0;
}

:deep(tbody tr) {
  border-bottom: 1px solid #e2e8f0;
}

.dark :deep(tbody tr) {
  border-bottom-color: #475569;
}

:deep(th) {
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #475569;
  text-align: center;
  font-weight: 500;
  white-space: normal;
  word-break: break-word;
  vertical-align: middle;
  position: sticky;
  top: 0;
  z-index: 20;
  background-color: #e2e8f0;
}

.dark :deep(th) {
  color: #cbd5e1;
  background-color: #1e293b;
}

:deep(td) {
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.25rem;
  color: #475569;
  white-space: normal;
  word-break: break-word;
  vertical-align: top;
  background-color: #ffffff;
}

.dark :deep(td) {
  color: #cbd5e1;
  background-color: #1e293b;
}

:deep(tr:hover) {
  background-color: rgba(248, 250, 252, 0.6);
}

.dark :deep(tr:hover) {
  background-color: rgba(51, 65, 85, 0.4);
}

/* Границы между колонками */
:deep(thead tr th:first-child),
:deep(tbody tr td:first-child) {
  border-right: 1px solid #e2e8f0;
}

.dark :deep(thead tr th:first-child),
.dark :deep(tbody tr td:first-child) {
  border-right-color: #475569;
}

:deep(thead tr th:nth-child(2)),
:deep(tbody tr td:nth-child(2)) {
  border-left: 1px solid #e2e8f0;
}

.dark :deep(thead tr th:nth-child(2)),
.dark :deep(tbody tr td:nth-child(2)) {
  border-left-color: #475569;
}

@media (min-width: 768px) {
  :deep(thead tr th:nth-child(2)),
  :deep(tbody tr td:nth-child(2)) {
    border-right: 1px solid #e2e8f0;
  }
  
  .dark :deep(thead tr th:nth-child(2)),
  .dark :deep(tbody tr td:nth-child(2)) {
    border-right-color: #475569;
  }
}

/* Стили для индикаторов точек в контейнере таблицы */
[data-mobile-dots-container] {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(4px);
  border-radius: 8px;
  padding: 4px 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(148, 163, 184, 0.2);
}

[data-mobile-dots-container] span {
  transition: background-color 200ms ease-in-out;
}

/* Темная тема для индикаторов */
.dark [data-mobile-dots-container] {
  background: rgba(30, 41, 59, 0.9);
  border-color: rgba(148, 163, 184, 0.3);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

/* Обрезка текста в шапке таблицы на мобильной версии */
@media (max-width: 767px) {
  :deep(thead th) {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
}
</style>
