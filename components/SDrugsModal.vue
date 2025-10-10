<template>
  <div>
    <UModal v-if="!isMobile" v-model:open="openLocal" :title="modalTitle" :description="drugModalDescription" :ui="{
      overlay: 'bg-slate-700/50',
      wrapper: 'sm:max-w-2xl',
      content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
      body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
      close: 'cursor-pointer'
    }" modal overlay transition>
      <template #body>
        <div v-if="selectedDrug" class="space-y-5">
          <div v-if="categoriesSafe.length">
            <div class="flex flex-wrap gap-1.5">
              <span v-for="(c, i) in categoriesSafe" :key="i"
                :class="isAntidoteCategory(c.name)
                  ? 'text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                  : 'text-xs px-2 py-1 rounded bg-slate-200 text-slate-600'">
                {{ c.name }}
              </span>
            </div>
          </div>

          <div>
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Латинское название</label>
            <p class="text-slate-900 dark:text-white">{{ selectedDrug.latinName || '—' }}</p>
          </div>

          <div v-if="selectedDrug.ageRestrictions">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Возрастные ограничения</label>
            <p class="text-slate-900 dark:text-white">{{ selectedDrug.ageRestrictions }}</p>
          </div>

          <div v-if="selectedDrug.indications && selectedDrug.indications.length">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Показания</label>
            <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
              <li v-for="(v,i) in selectedDrug.indications" :key="i" class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                <span>{{ v }}</span>
              </li>
            </ul>
          </div>

          <div v-if="selectedDrug.contraindications && selectedDrug.contraindications.length">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Противопоказания</label>
            <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
              <li v-for="(v,i) in selectedDrug.contraindications" :key="i" class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                <span>{{ v }}</span>
              </li>
            </ul>
          </div>

          <div v-if="selectedDrug.dosages?.description">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Дозировки</label>
            <div class="mt-1 text-slate-700 dark:text-slate-300">
              <template v-if="Array.isArray(selectedDrug.dosages.description)">
                <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <li v-for="(d,i) in selectedDrug.dosages.description" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>{{ d }}</span>
                  </li>
                </ul>
              </template>
              <template v-else>
                <p>{{ selectedDrug.dosages.description }}</p>
              </template>
            </div>
          </div>

          <!-- Калькуляторы: общий блок с взаимно исключающимися вариантами -->
          <template v-if="selectedDrug.dosages">
            <div v-if="selectedDrug.dosages.type === 'calculator' && Array.isArray(selectedDrug.dosages.variants)" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
              <div class="mt-2 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                    <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Вариант</label>
                    <USelect v-model="d_selectedVariantName" size="xl" :items="d_variantNameItems" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Группа</label>
                    <USelect v-model="d_selectedGroupIdx" size="xl" :items="d_groupItems" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Метод</label>
                    <USelect v-model="d_selectedMethod" size="xl" :items="d_methodItems" class="w-full" />
                  </div>
                </div>
                <div>
                  <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Дозировка ({{ d_perKgUnit }})</label>
                  <USelect v-model="d_selectedDoseValue" size="xl" :items="d_doseItems" class="w-full" />
                </div>
                <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div class="text-sm text-slate-700 dark:text-slate-300">
                    <span class="font-medium">Расчетная доза:&nbsp;</span>
                    <span v-if="d_calcDoseMg">{{ d_calcDoseMg }} {{ d_resultUnit }}</span>
                    <span v-else> —</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="selectedDrug.dosages.type === 'simple_calculator'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
              <div class="mt-2 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                    <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ d_simpleUnit }})</label>
                    <USelect v-model="d_simpleSelectedDose" size="xl" :items="d_simpleDoseItems" class="w-full" />
                    <p v-if="selectedDrug.dosages?.dose_description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ selectedDrug.dosages.dose_description }}</p>
                  </div>
                </div>
                <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div class="text-sm text-slate-700 dark:text-slate-300">
                    <span class="font-medium">Расчетная доза:&nbsp;</span>
                    <span v-if="d_simpleResult.value">{{ d_simpleResult.value }} {{ d_simpleResult.unit }}<span v-if="d_simpleResult.capped" class="text-xs text-amber-600 dark:text-amber-400"> (указана максимальная доза)</span></span>
                    <span v-else> —</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="selectedDrug.dosages.type === 'simple_calculator_with_ml'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
              <div class="mt-2 space-y-3">
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                    <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ d_withMlMgUnit }}; {{ d_withMlMlUnit }})</label>
                    <USelect v-model="d_withMlSelectedIndex" size="xl" :items="d_withMlDoseItems" class="w-full" />
                  </div>
                </div>
                <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <div class="text-sm text-slate-700 dark:text-slate-300">
                    <span class="font-medium">Расчетная доза:&nbsp;</span>
                    <span v-if="d_withMlResult.mg">{{ d_withMlResult.mg }} мг ({{ d_withMlResult.ml }} мл)</span>
                    <span v-else> —</span>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="selectedDrug.dosages.type === 'table'">
              <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
              <div class="mt-2">
                <table v-if="d_tableDisplayRows.length" class="w-full table-auto text-sm border border-slate-200 dark:border-slate-700">
                  <thead class="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th v-for="col in d_tableColumns" :key="col" class="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">{{ d_columnHeader(col) }}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="(row, i) in d_tableDisplayRows" :key="i" class="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60">
                      <td v-for="col in d_tableColumns" :key="col" class="px-3 py-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">{{ row[col] }}</td>
                    </tr>
                  </tbody>
                </table>
                <div v-else class="py-6 text-center text-sm text-muted">Нет данных</div>
              </div>
            </div>
          </template>

          <div v-else-if="selectedDrug.dosages && selectedDrug.dosages.type === 'simple_calculator'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
            <div class="mt-2 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                  <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ d_simpleUnit }})</label>
                  <USelect v-model="d_simpleSelectedDose" size="xl" :items="d_simpleDoseItems" class="w-full" />
                  <p v-if="selectedDrug.dosages?.dose_description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ selectedDrug.dosages.dose_description }}</p>
                </div>
              </div>
              <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div class="text-sm text-slate-700 dark:text-slate-300">
                  <span class="font-medium">Расчетная доза:&nbsp;</span>
                  <span v-if="d_simpleResult.value">{{ d_simpleResult.value }} {{ d_simpleResult.unit }}<span v-if="d_simpleResult.capped" class="text-xs text-amber-600 dark:text-amber-400"> (указана максимальная доза)</span></span>
                  <span v-else> —</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedDrug.dosages && selectedDrug.dosages.type === 'simple_calculator_with_ml'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
            <div class="mt-2 space-y-3">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                  <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ d_withMlMgUnit }}; {{ d_withMlMlUnit }})</label>
                  <USelect v-model="d_withMlSelectedIndex" size="xl" :items="d_withMlDoseItems" class="w-full" />
                </div>
              </div>
              <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <div class="text-sm text-slate-700 dark:text-slate-300">
                  <span class="font-medium">Расчетная доза:&nbsp;</span>
                  <span v-if="d_withMlResult.mg">{{ d_withMlResult.mg }} мг ({{ d_withMlResult.ml }} мл)</span>
                  <span v-else> —</span>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="selectedDrug.dosages && selectedDrug.dosages.type === 'table'">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
            <div class="mt-2">
              <table v-if="d_tableDisplayRows.length" class="w-full table-auto text-sm border border-slate-200 dark:border-slate-700">
                <thead class="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th v-for="col in d_tableColumns" :key="col" class="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">{{ d_columnHeader(col) }}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, i) in d_tableDisplayRows" :key="i" class="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60">
                    <td v-for="col in d_tableColumns" :key="col" class="px-3 py-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">{{ row[col] }}</td>
                  </tr>
                </tbody>
              </table>
              <div v-else class="py-6 text-center text-sm text-muted">Нет данных</div>
            </div>
          </div>

          <div v-if="selectedDrug.adverse && selectedDrug.adverse.length">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Побочные эффекты</label>
            <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
              <li v-for="(v,i) in selectedDrug.adverse" :key="i" class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                <span>{{ v }}</span>
              </li>
            </ul>
          </div>

          <div v-if="selectedDrug.mechanism && selectedDrug.mechanism.length">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Механизм действия</label>
            <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
              <li v-for="(v,i) in selectedDrug.mechanism" :key="i" class="flex items-start gap-2">
                <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                <span>{{ v }}</span>
              </li>
            </ul>
          </div>

          <div v-if="selectedDrug.pharmacokinetics && (selectedDrug.pharmacokinetics.onset || selectedDrug.pharmacokinetics.duration || selectedDrug.pharmacokinetics.half_life || selectedDrug.pharmacokinetics.metabolism || selectedDrug.pharmacokinetics.elimination)">
            <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Фармакокинетика</label>
            <div class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
              <div v-if="selectedDrug.pharmacokinetics.onset" class="flex items-center">
                <span>Начало действия</span>
                <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.onset }}</span>
              </div>
              <div v-if="selectedDrug.pharmacokinetics.duration" class="flex items-center">
                <span>Длительность</span>
                <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.duration }}</span>
              </div>
              <div v-if="selectedDrug.pharmacokinetics.half_life" class="flex items_center">
                <span>T1/2</span>
                <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.half_life }}</span>
              </div>
              <div v-if="selectedDrug.pharmacokinetics.metabolism" class="flex items-center">
                <span>Метаболизм</span>
                <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.metabolism }}</span>
              </div>
              <div v-if="selectedDrug.pharmacokinetics.elimination" class="flex items-center">
                <span>Выведение</span>
                <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.elimination }}</span>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" type="button" @click="openLocal = false" class="cursor-pointer">Закрыть</UButton>
        </div>
      </template>
    </UModal>

    <template v-else>
      <ClientOnly>
        <BottomSheet v-model="openLocal" :title="modalTitle" @close="openLocal = false">
          <div class="p-4 pb-6">
            <div v-if="selectedDrug" class="space-y-5">
              <div v-if="categoriesSafe.length">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категории</label>
                <div class="flex flex-wrap gap-1.5">
                  <span v-for="(c, i) in categoriesSafe" :key="i"
                    :class="isAntidoteCategory(c.name)
                      ? 'text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                      : 'text-xs px-2 py-1 rounded bg-slate-200 text-slate-600'">
                    {{ c.name }}
                  </span>
                </div>
              </div>

              <div>
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Латинское название</label>
                <p class="text-slate-900 dark:text-white">{{ selectedDrug.latinName || '—' }}</p>
              </div>

              <div v-if="selectedDrug.ageRestrictions">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Возрастные ограничения</label>
                <p class="text-slate-900 dark:text-white">{{ selectedDrug.ageRestrictions }}</p>
              </div>

              <div v-if="selectedDrug.indications && selectedDrug.indications.length">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Показания</label>
                <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <li v-for="(v,i) in selectedDrug.indications" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>{{ v }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="selectedDrug.contraindications && selectedDrug.contraindications.length">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Противопоказания</label>
                <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <li v-for="(v,i) in selectedDrug.contraindications" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>{{ v }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="selectedDrug.dosages?.description">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Дозировки</label>
                <div class="mt-1 text-slate-700 dark:text-slate-300">
                  <template v-if="Array.isArray(selectedDrug.dosages.description)">
                    <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <li v-for="(d,i) in selectedDrug.dosages.description" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ d }}</span>
                      </li>
                    </ul>
                  </template>
                  <template v-else>
                    <p>{{ selectedDrug.dosages.description }}</p>
                  </template>
                </div>
              </div>

              <!-- Калькуляторы (мобильный): тот же набор, что и десктоп -->
              <div v-if="selectedDrug.dosages && selectedDrug.dosages.type === 'calculator' && Array.isArray(selectedDrug.dosages.variants)" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                <div class="mt-2 space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                      <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Вариант</label>
                      <USelect v-model="d_selectedVariantName" size="xl" :items="d_variantNameItems" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Группа</label>
                      <USelect v-model="d_selectedGroupIdx" size="xl" :items="d_groupItems" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Метод</label>
                      <USelect v-model="d_selectedMethod" size="xl" :items="d_methodItems" class="w-full" />
                    </div>
                  </div>
                  <div>
                    <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Дозировка ({{ d_perKgUnit }})</label>
                    <USelect v-model="d_selectedDoseValue" size="xl" :items="d_doseItems" class="w-full" />
                  </div>
                  <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div class="text-sm text-slate-700 dark:text-slate-300">
                      <span class="font-medium">Расчетная доза:&nbsp;</span>
                      <span v-if="d_calcDoseMg">{{ d_calcDoseMg }} {{ d_resultUnit }}</span>
                      <span v-else> —</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="selectedDrug.dosages && selectedDrug.dosages.type === 'simple_calculator'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                <div class="mt-2 space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                      <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ d_simpleUnit }})</label>
                      <USelect v-model="d_simpleSelectedDose" size="xl" :items="d_simpleDoseItems" class="w-full" />
                      <p v-if="selectedDrug.dosages?.dose_description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ selectedDrug.dosages.dose_description }}</p>
                    </div>
                  </div>
                  <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div class="text-sm text-slate-700 dark:text-slate-300">
                      <span class="font-medium">Расчетная доза:&nbsp;</span>
                      <span v-if="d_simpleResult.value">{{ d_simpleResult.value }} {{ d_simpleResult.unit }}<span v-if="d_simpleResult.capped" class="text-xs text-amber-600 dark:text-amber-400"> (указана максимальная доза)</span></span>
                      <span v-else> —</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="selectedDrug.dosages && selectedDrug.dosages.type === 'simple_calculator_with_ml'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                <div class="mt-2 space-y-3">
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                      <UInput v-model.number="d_weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                    </div>
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ d_withMlMgUnit }}; {{ d_withMlMlUnit }})</label>
                      <USelect v-model="d_withMlSelectedIndex" size="xl" :items="d_withMlDoseItems" class="w-full" />
                    </div>
                  </div>
                  <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <div class="text-sm text-slate-700 dark:text-slate-300">
                      <span class="font-medium">Расчетная доза:&nbsp;</span>
                      <span v-if="d_withMlResult.mg">{{ d_withMlResult.mg }} мг ({{ d_withMlResult.ml }} мл)</span>
                      <span v-else> —</span>
                    </div>
                  </div>
                </div>
              </div>

              <div v-else-if="selectedDrug.dosages && selectedDrug.dosages.type === 'table'">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                <div class="mt-2">
                  <table v-if="d_tableDisplayRows.length" class="w-full table-auto text-sm border border-slate-200 dark:border-slate-700">
                    <thead class="bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th v-for="col in d_tableColumns" :key="col" class="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">{{ d_columnHeader(col) }}</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr v-for="(row, i) in d_tableDisplayRows" :key="i" class="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60">
                        <td v-for="col in d_tableColumns" :key="col" class="px-3 py-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">{{ row[col] }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div v-else class="py-6 text-center text-sm text-muted">Нет данных</div>
                </div>
              </div>

              <div v-if="selectedDrug.adverse && selectedDrug.adverse.length">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Побочные эффекты</label>
                <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <li v-for="(v,i) in selectedDrug.adverse" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>{{ v }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="selectedDrug.mechanism && selectedDrug.mechanism.length">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Механизм действия</label>
                <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <li v-for="(v,i) in selectedDrug.mechanism" :key="i" class="flex items-start gap-2">
                    <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>{{ v }}</span>
                  </li>
                </ul>
              </div>

              <div v-if="selectedDrug.pharmacokinetics && (selectedDrug.pharmacokinetics.onset || selectedDrug.pharmacokinetics.duration || selectedDrug.pharmacokinetics.half_life || selectedDrug.pharmacokinetics.metabolism || selectedDrug.pharmacokinetics.elimination)">
                <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Фармакокинетика</label>
                <div class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                  <div v-if="selectedDrug.pharmacokinetics.onset" class="flex items-center">
                    <span>Начало действия</span>
                    <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                    <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.onset }}</span>
                  </div>
                  <div v-if="selectedDrug.pharmacokinetics.duration" class="flex items-center">
                    <span>Длительность</span>
                    <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                    <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.duration }}</span>
                  </div>
                  <div v-if="selectedDrug.pharmacokinetics.half_life" class="flex items_center">
                    <span>T1/2</span>
                    <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                    <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.half_life }}</span>
                  </div>
                  <div v-if="selectedDrug.pharmacokinetics.metabolism" class="flex items-center">
                    <span>Метаболизм</span>
                    <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                    <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.metabolism }}</span>
                  </div>
                  <div v-if="selectedDrug.pharmacokinetics.elimination" class="flex items-center">
                    <span>Выведение</span>
                    <div class="mx-2 flex-1 border-б border-dashed border-slate-300 dark:border-slate-600"></div>
                    <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selectedDrug.pharmacokinetics.elimination }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </BottomSheet>
      </ClientOnly>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
const props = defineProps<{ open: boolean; queryName?: string }>()
const emit = defineEmits<{ (e: 'update:open', v: boolean): void }>()
const openLocal = computed({ get: () => props.open, set: (v: boolean) => emit('update:open', v) })

const { isMobile } = useIsMobile()

const selectedDrug = ref<any | null>(null)
const modalTitle = computed(() => selectedDrug.value?.name || 'Препарат')
const drugModalDescription = computed(() => {
  const syn = selectedDrug.value?.synonyms
  if (Array.isArray(syn) && syn.length) return syn.filter(Boolean).join(', ')
  return 'Информация о препарате'
})

const categoriesSafe = computed<Array<{ name: string }>>(() => {
  const arr = Array.isArray(selectedDrug.value?.categories) ? selectedDrug.value?.categories : []
  return arr
    .map((c: any) => ({ name: String(c?.name || '').trim() }))
    .filter((c: { name: string }) => !!c.name)
})

function isAntidoteCategory(name?: string): boolean {
  if (!name) return false
  const n = String(name).toLowerCase().trim()
  return n.includes('антидот')
}

watch(() => props.queryName, async (name) => {
  if (!name) return
  await fetchByName(name)
}, { immediate: true })

async function fetchByName(name: string) {
  try {
    const q = String(name || '').trim()
    if (!q) return
    const res: any = await $fetch('/api/drugs/search', { params: { name: q } })
    const list: any[] = Array.isArray(res?.items) ? res.items : []
    if (list.length === 0) return
    let it = list.find(d => String(d?.name || '').trim().toLowerCase() === q.toLowerCase())
    if (!it) it = list.find(d => String(d?.latinName || '').trim().toLowerCase() === q.toLowerCase())
    if (!it) it = list.find(d => (Array.isArray(d?.synonyms) ? d.synonyms : []).some((s: any) => String(s||'').trim().toLowerCase() === q.toLowerCase()))
    if (!it) it = list.find(d => d?.dosages && Object.keys(d.dosages || {}).length)
    if (!it) it = list[0]
    selectedDrug.value = it
  } catch {}
}

// ====== калькуляторы (как на /drugs) ======
const d_weight = ref<number | null>(null)
const d_variants = computed<any[]>(() => (selectedDrug.value?.dosages?.variants || []) as any[])
const d_variantNameItems = computed(() => {
  const names = Array.from(new Set(d_variants.value.map((v: any) => (v?.variant_name || '').toString().trim()).filter(Boolean)))
  return names.map(n => ({ label: n, value: n }))
})
const d_selectedVariantName = ref<string | undefined>(undefined)
const d_methodsForVariant = computed(() => {
  const name = (d_selectedVariantName.value || '').toString().trim()
  const list = d_variants.value.filter((v: any) => (v?.variant_name || '').toString().trim() === name)
  const methods = list.map((v: any) => v?.method).flat()
  const flat = Array.isArray(methods) ? methods : list.map((v: any) => v?.method)
  const uniq = Array.from(new Set((flat as any[]).filter(Boolean).map(x => String(x))))
  return uniq
})
const d_methodItems = computed(() => d_methodsForVariant.value.map(m => ({ label: m, value: m })))
const d_selectedMethod = ref<string | undefined>(undefined)
const d_currentVariant = computed(() => {
  const name = (d_selectedVariantName.value || '').toString().trim()
  const method = (d_selectedMethod.value || '').toString().trim()
  let list = d_variants.value.filter((v: any) => (v?.variant_name || '').toString().trim() === name)
  if (method) list = list.filter((v: any) => String(v?.method) === method)
  return list[0] || null
})
const d_groups = computed<any[]>(() => (d_currentVariant.value?.groups || []) as any[])
const d_groupItems = computed(() => d_groups.value.map((g: any, i: number) => ({ label: g?.group_name || `Группа ${i + 1}`, value: i })))
const d_selectedGroupIdx = ref<number>(0)
const d_currentGroup = computed<any | null>(() => d_groups.value[d_selectedGroupIdx.value] || null)
const d_doseItems = computed(() => (d_currentGroup.value?.doses || []).map((d: any) => ({ label: d, value: d })))
const d_selectedDoseValue = ref<string | number | undefined>(undefined)
watch([selectedDrug, d_selectedVariantName, d_selectedMethod, d_selectedGroupIdx], () => {
  const def = d_currentGroup.value?.default_dose
  d_selectedDoseValue.value = def ?? (d_currentGroup.value?.doses || [])[0]
})
watch([selectedDrug, d_selectedVariantName], () => {
  const firstMethod = d_methodItems.value[0]?.value
  d_selectedMethod.value = firstMethod
  d_selectedGroupIdx.value = 0
})
const d_perKgUnit = computed(() => {
  const u = (d_currentGroup.value?.unit || '').toString().trim()
  return u || (d_selectedMethod.value === 'инфузор' ? 'мг/кг/час' : 'мг/кг')
})
const d_resultUnit = computed(() => (d_perKgUnit.value.includes('/час') ? 'мг/час' : 'мг'))
const d_calcDoseMg = computed(() => {
  if (!d_weight.value || !d_selectedDoseValue.value) return ''
  const perKg = parseFloat(String(d_selectedDoseValue.value).replace(',', '.'))
  if (!perKg || perKg <= 0) return ''
  const total = Math.round(perKg * (d_weight.value || 0))
  return `${total}`
})

// simple_calculator
const d_simpleDoseItems = computed(() => {
  const d: any = selectedDrug.value?.dosages
  if (!d || d.type !== 'simple_calculator') return []
  const arr = Array.isArray(d.doses) ? d.doses : []
  return arr.map((x: any) => ({ label: String(x), value: String(x) }))
})
const d_simpleSelectedDose = ref<string | undefined>(undefined)
watch(selectedDrug, () => {
  const d: any = selectedDrug.value?.dosages
  if (d?.type === 'simple_calculator') {
    d_simpleSelectedDose.value = d.default_dose ? String(d.default_dose) : (Array.isArray(d.doses) ? String(d.doses[0] ?? '') : undefined)
  } else {
    d_simpleSelectedDose.value = undefined
  }
})
const d_simpleUnit = computed(() => {
  const u = (selectedDrug.value?.dosages?.unit || '').toString().trim()
  return u || 'мг/кг'
})
const d_simpleResult = computed(() => {
  const d: any = selectedDrug.value?.dosages
  if (!d || d.type !== 'simple_calculator') return { value: '', capped: false, unit: '' }
  const w = Number(d_weight.value || 0)
  const perKg = parseFloat(String(d_simpleSelectedDose.value || '').replace(',', '.'))
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
})

// simple_calculator_with_ml
const d_withMlSelectedIndex = ref<number | undefined>(undefined)
const d_withMlMgUnit = computed(() => (selectedDrug.value?.dosages?.mg_dosages?.unit || 'мг/кг'))
const d_withMlMlUnit = computed(() => (selectedDrug.value?.dosages?.ml_dosages?.unit || 'мл/кг'))
const d_withMlDoseItems = computed(() => {
  const d: any = selectedDrug.value?.dosages
  if (!d || d.type !== 'simple_calculator_with_ml') return []
  const mg = Array.isArray(d.mg_dosages?.doses) ? d.mg_dosages.doses : []
  const ml = Array.isArray(d.ml_dosages?.doses) ? d.ml_dosages.doses : []
  const maxLen = Math.max(mg.length, ml.length)
  const items: Array<{ label: string; value: number }> = []
  for (let i = 0; i < maxLen; i++) {
    const mgVal = mg[i] != null ? String(mg[i]) : ''
    const mlVal = ml[i] != null ? String(ml[i]) : ''
    const label = `${mgVal || '—'} ${d_withMlMgUnit.value}${mlVal ? ` (${mlVal} ${d_withMlMlUnit.value})` : ''}`
    items.push({ label, value: i })
  }
  return items
})
watch(selectedDrug, () => {
  const d: any = selectedDrug.value?.dosages
  if (d?.type === 'simple_calculator_with_ml') {
    const defMg = d.mg_dosages?.default_dose
    if (defMg != null) {
      const idx = (Array.isArray(d.mg_dosages?.doses) ? d.mg_dosages.doses : []).findIndex((x: any) => String(x) === String(defMg))
      d_withMlSelectedIndex.value = idx >= 0 ? idx : 0
    } else {
      d_withMlSelectedIndex.value = 0
    }
  } else {
    d_withMlSelectedIndex.value = undefined
  }
})
const d_withMlResult = computed(() => {
  const d: any = selectedDrug.value?.dosages
  if (!d || d.type !== 'simple_calculator_with_ml') return { mg: '', ml: '', capped: false }
  const w = Number(d_weight.value || 0)
  const idx = Number(d_withMlSelectedIndex.value ?? -1)
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
})

// Табличные дозировки
const d_tableRows = computed<any[]>(() => {
  const d = selectedDrug.value?.dosages || {}
  const data = Array.isArray((d as any).table_data) ? (d as any).table_data
    : (Array.isArray((d as any).rows) ? (d as any).rows
      : (Array.isArray((d as any).table) ? (d as any).table : []))
  return data as any[]
})
const d_tableColumns = computed<string[]>(() => {
  const rows = d_tableRows.value
  if (!Array.isArray(rows) || rows.length === 0) return []
  const set = new Set<string>()
  for (const r of rows) Object.keys(r || {}).forEach(k => set.add(k))
  let cols = Array.from(set)
  if (cols.length === 0 && rows[0]) cols = Object.keys(rows[0])
  if (cols.length === 0) cols = ['age', 'dose', 'unit', 'note']
  return cols
})
function d_columnHeader(key: string): string {
  const map: Record<string, string> = { age: 'Возраст', dose: 'Доза', unit: 'Ед.', note: 'Примечание' }
  return map[key] || key
}
const d_tableDisplayRows = computed(() => {
  const rows = Array.isArray(d_tableRows.value) ? d_tableRows.value : []
  try { return JSON.parse(JSON.stringify(rows)) } catch { return rows.map(r => ({ ...(r || {}) })) }
})
</script>

<style scoped>
</style>


