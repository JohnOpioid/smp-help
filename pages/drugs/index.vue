<template>
  <div>
    <main class="flex-1">

      <!-- Основной контент -->
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div class="bg-white dark:bg-slate-800 rounded-lg">

          <div class="p-4 border-b border-slate-100 dark:border-slate-700">
            <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div class="flex-1 min-w-0">
                <p class="text-sm text-slate-600 dark:text-slate-300">Все препараты</p>
              </div>
              <div class="flex items-center gap-2 w-full sm:w-auto">
                <USelect
                  v-model="selectedCategoryIds"
                  :items="categoryOptions"
                  multiple
                  placeholder="Фильтр по категориям"
                  class="w-full sm:w-80"
                />
                <UButton color="neutral" variant="ghost" class="w-8 h-8 flex items-center justify-center"
                  @click="selectedCategoryIds = []" v-if="selectedCategoryIds.length">
                  <UIcon name="i-heroicons-x-mark-20-solid" />
                </UButton>
              </div>
            </div>
          </div>

          <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <li v-for="(drug, index) in filteredItems" :key="drug._id"
              class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              :class="{
                'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < filteredItems.length - 1) || (index === filteredItems.length - 1 && filteredItems.length % 2 === 1),
                'md:border-b-0': index >= filteredItems.length - 2 && filteredItems.length % 2 === 0
              }" @click="openModal(drug)">
              <div class="flex items-center justify-between">
                <div class="min-w-0">
                  <p class="text-slate-900 dark:text-white font-medium truncate">{{ drug.name }}</p>
                  
                  <p v-if="drug.latinName" class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">{{
                    drug.latinName }}</p>
                  <p v-if="drug.forms && (drug.forms.doseValue || drug.forms.doseUnit || drug.forms.volumeMl)"
                    class="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {{ formatDrugForm(drug.forms) }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                    <template v-if="drug.categories && drug.categories.length">
                      <span v-if="getFirstNonAntidoteCategoryName(drug.categories)"
                        class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">
                        {{ getFirstNonAntidoteCategoryName(drug.categories) }}
                      </span>
                    </template>
                    <span v-if="drug.antidote || (drug.categories || []).some((c:any)=> String(c?.name||'').toLowerCase().includes('антидот'))"
                      class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200">
                      Антидот
                    </span>
                  </div>
                </div>
                <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </li>

            <li v-if="!initialLoading && items.length === 0" class="p-6 border-b-0">
              <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных. Добавьте их в админке.</p>
            </li>
            <li v-if="initialLoading" class="p-6 border-b-0">
              <USkeleton class="h-6 w-1/3 mb-2" />
              <USkeleton class="h-6 w-2/3" />
            </li>
            <li v-if="loadingMore" class="p-4 text-center md:col-span-2 border-b-0">
              <USkeleton class="h-6 w-24 mx-auto" />
            </li>
            <div v-if="loadingMore" ref="sentinel" class="h-1 md:col-span-2"></div>
          </ul>
        </div>

        <!-- Модальное окно с препаратом (desktop) -->
        <template v-if="!isMobile">
          <UModal v-model:open="modalOpen" :title="selected?.name || ''" :description="modalDescription" :ui="{
            overlay: 'bg-slate-700/50',
            wrapper: 'sm:max-w-2xl',
            content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
            body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
            close: 'cursor-pointer'
          }" modal overlay transition>
            <template #body>
              <div v-if="selected" class="space-y-5">
                <div v-if="selected.categories && selected.categories.length">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категории</label>
                  <div class="flex flex-wrap gap-1.5">
                    <span
                      v-for="(cat, i) in selected.categories"
                      :key="i"
                      :class="isAntidoteCategory(cat?.name)
                        ? 'text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                        : 'text-xs px-2 py-1 rounded bg-slate-200 text-slate-600'"
                    >
                      {{ cat?.name || '' }}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Латинское название</label>
                  <p class="text-slate-900 dark:text-white">{{ selected.latinName || '—' }}</p>
                </div>
                


                <div v-if="selected.ageRestrictions">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Возрастные ограничения</label>
                  <p class="text-slate-900 dark:text-white">{{ selected.ageRestrictions }}</p>
                </div>

                <div
                  v-if="(Array.isArray(selected?.pediatricDose) ? selected.pediatricDose.some((s: any) => (s ?? '').toString().trim().length > 0) : ((selected?.pediatricDose ?? '').toString().trim().length > 0))">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Педиатрическая дозировка</label>
                  <p class="text-slate-900 dark:text-white">{{ pediatricDoseDisplay }}{{ selected.pediatricDoseUnit ? `
                    ${selected.pediatricDoseUnit}` : '' }}</p>
                  <ul class="mt-1 space-y-1 text-sm text-slate-700 dark:text-slate-300"
                    v-if="Array.isArray(selected.pediatricDose) && selected.pediatricDose.length > 1">
                    <li v-for="(d, i) in selected.pediatricDose" :key="i" class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-20-solid"
                        class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{{ d }}</span>
                    </li>
                  </ul>
                </div>

                <div v-if="selected.indications && selected.indications.length">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Показания</label>
                  <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <li v-for="(v, i) in selected.indications" :key="i" class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-20-solid"
                        class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{{ v }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="selected.contraindications && selected.contraindications.length">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Противопоказания</label>
                  <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <li v-for="(v, i) in selected.contraindications" :key="i" class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-20-solid"
                        class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{{ v }}</span>
                    </li>
                  </ul>
                </div>

                <!-- Описание дозировок -->
                <div v-if="selected.dosages?.description">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Дозировки</label>
                  <div class="mt-1 text-slate-700 dark:text-slate-300">
                    <template v-if="Array.isArray(selected.dosages.description)">
                      <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                        <li v-for="(d,i) in selected.dosages.description" :key="i" class="flex items-start gap-2">
                          <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                          <span>{{ d }}</span>
                        </li>
                      </ul>
                    </template>
                    <template v-else>
                      <p>{{ selected.dosages.description }}</p>
                    </template>
                  </div>
                </div>

                <!-- Дозировки (калькулятор) -->
                <div v-if="selected.dosages && selected.dosages.type === 'calculator' && Array.isArray(selected.dosages.variants)" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  <div class="mt-2 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Вариант</label>
                        <USelect v-model="selectedVariantName" size="xl" :items="variantNameItems" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Группа</label>
                        <USelect v-model="selectedGroupIdx" size="xl" :items="groupItems" class="w-full" />
                    </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Метод</label>
                        <USelect v-model="selectedMethod" size="xl" :items="methodItems" class="w-full" />
                      </div>
                      </div>
                    <div>
                      <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Дозировка ({{ perKgUnit }})</label>
                      <USelect v-model="selectedDoseValue" size="xl" :items="doseItems" class="w-full" />
                      <p v-if="currentGroup?.description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ currentGroup.description }}</p>
                    </div>
                    <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div class="text-sm text-slate-700 dark:text-slate-300">
                        <span class="font-medium">Расчетная доза:&nbsp;</span>
                        <span v-if="calcDoseMg">{{ calcDoseMg }} {{ resultUnit }}</span>
                        <span v-else> —</span>
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Способ введения: {{ selectedMethod || currentVariant?.method || '—' }}{{ currentVariant?.variant_name ? `, ${currentVariant.variant_name}` : '' }}
                    </div>
                    </div>
                    </div>
                </div>

                <!-- Дозировки (простой калькулятор) -->
                  <div v-else-if="selected.dosages && selected.dosages.type === 'simple_calculator'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  <div class="mt-2 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ simpleUnit }})</label>
                          <USelect v-model="simpleSelectedDose" size="xl" :items="simpleDoseItems" class="w-full" />
                          <p v-if="selected.dosages?.dose_description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ selected.dosages.dose_description }}</p>
                        </div>
                    </div>
                    <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div class="text-sm text-slate-700 dark:text-slate-300">
                        <span class="font-medium">Расчетная доза:&nbsp;</span>
                        <span v-if="simpleResult.value">
                          {{ simpleResult.value }} {{ simpleResult.unit }}
                          <span v-if="simpleResult.capped" class="text-xs text-amber-600 dark:text-amber-400">(указана максимальная доза)</span>
                        </span>
                        <span v-else> —</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Дозировки (простой калькулятор с мл) -->
                <div v-else-if="selected.dosages && selected.dosages.type === 'simple_calculator_with_ml'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  <div class="mt-2 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ withMlMgUnit }}; {{ withMlMlUnit }})</label>
                        <USelect v-model="withMlSelectedIndex" size="xl" :items="withMlDoseItems" class="w-full" />
                      </div>
                    </div>
                    <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div class="text-sm text-slate-700 dark:text-slate-300">
                        <span class="font-medium">Расчетная доза:&nbsp;</span>
                        <span v-if="withMlResult.mg">
                          {{ withMlResult.mg }} мг ({{ withMlResult.ml }} мл)
                          <span v-if="withMlResult.capped" class="text-xs text-amber-600 dark:text-amber-400">(указана максимальная доза)</span>
                        </span>
                        <span v-else> —</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Дозировки (простой калькулятор с мл) -->
                <div v-else-if="selected.dosages && selected.dosages.type === 'simple_calculator_with_ml'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  <div class="mt-2 space-y-3">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                        <UInput v-model.number="weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70" class="w-full" />
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ withMlMgUnit }}; {{ withMlMlUnit }})</label>
                        <USelect v-model="withMlSelectedIndex" size="xl" :items="withMlDoseItems" class="w-full" />
                      </div>
                    </div>
                    <div class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                      <div class="text-sm text-slate-700 dark:text-slate-300">
                        <span class="font-medium">Расчетная доза:&nbsp;</span>
                        <span v-if="withMlResult.mg">
                          {{ withMlResult.mg }} мг ({{ withMlResult.ml }} мл)
                          <span v-if="withMlResult.capped" class="text-xs text-amber-600 dark:text-amber-400">(указана максимальная доза)</span>
                        </span>
                        <span v-else> —</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Дозировки (таблица) -->
                <div v-else-if="selected.dosages && selected.dosages.type === 'table'">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                  <div class="mt-2">
                    <table v-if="tableDisplayRows.length" class="w-full table-auto text-sm border border-slate-200 dark:border-slate-700">
                      <thead class="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                          <th v-for="col in tableColumns" :key="col" class="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">
                            {{ columnHeader(col) }}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr v-for="(row, i) in tableDisplayRows" :key="i" class="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60">
                          <td v-for="col in tableColumns" :key="col" class="px-3 py-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">
                            {{ row[col] }}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-else class="py-6 text-center text-sm text-muted">Нет данных</div>
                  </div>
                </div>


                <div v-if="selected.adverse && selected.adverse.length">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Побочные эффекты</label>
                  <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <li v-for="(v, i) in selected.adverse" :key="i" class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-20-solid"
                        class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{{ v }}</span>
                    </li>
                  </ul>
                </div>
                <div v-if="selected.interactions && selected.interactions.length">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Взаимодействия</label>
                  <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <li v-for="(v, i) in selected.interactions" :key="i" class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-20-solid"
                        class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{{ v }}</span>
                    </li>
                  </ul>
                </div>

                <div v-if="selected.mechanism && selected.mechanism.length">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Механизм действия</label>
                  <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <li v-for="(v, i) in selected.mechanism" :key="i" class="flex items-start gap-2">
                      <UIcon name="i-heroicons-check-20-solid"
                        class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                      <span>{{ v }}</span>
                    </li>
                  </ul>
                </div>

                <div v-if="selected.pharmacokinetics && (selected.pharmacokinetics.onset || selected.pharmacokinetics.duration || selected.pharmacokinetics.half_life || selected.pharmacokinetics.metabolism || selected.pharmacokinetics.elimination)">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Фармакокинетика</label>
                  <div class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                    <div v-if="selected.pharmacokinetics.onset" class="flex items-center">
                      <span>Начало действия</span>
                      <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.onset }}</span>
                    </div>
                    <div v-if="selected.pharmacokinetics.duration" class="flex items-center">
                      <span>Длительность</span>
                      <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.duration }}</span>
                    </div>
                    <div v-if="selected.pharmacokinetics.half_life" class="flex items-center">
                      <span>T1/2</span>
                      <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.half_life }}</span>
                    </div>
                    <div v-if="selected.pharmacokinetics.metabolism" class="flex items-center">
                      <span>Метаболизм</span>
                      <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.metabolism }}</span>
                    </div>
                    <div v-if="selected.pharmacokinetics.elimination" class="flex items-center">
                      <span>Выведение</span>
                      <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                      <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.elimination }}</span>
                    </div>
                  </div>
                </div>

                
                <div v-if="selected.antidote">
                  <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Антидот</label>
                  <div class="mt-1 text-slate-700 dark:text-slate-300">
                    <p v-if="selected.antidote.name" class="font-semibold">{{ selected.antidote.name }}</p>
                    <p v-if="selected.antidote.latin_name" class="mt-0.5">{{ selected.antidote.latin_name }}</p>
                    <p v-if="selected.antidote.description" class="mt-1">{{ selected.antidote.description }}</p>
                    <div v-if="Array.isArray(selected.antidote.dosages) && selected.antidote.dosages.length"
                      class="mt-2">
                      <label class="text-sm font-medium">Дозировки антидота</label>
                      <ul class="mt-1 space-y-1">
                        <li v-for="(d, i) in selected.antidote.dosages" :key="i"
                          class="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                          <UIcon name="i-heroicons-check-20-solid"
                            class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                          <span>{{ d.dose }} — {{ d.indication }}</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>


              </div>
            </template>
            <template #footer>
              <div class="flex gap-3 w-full">
                <button 
                  type="button" 
                  :title="isBookmarked ? 'В избранном' : 'В закладки'" 
                  :disabled="!selected"
                  @click="toggleBookmark()"
                  class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer flex-1 justify-center items-center"
                >
                  <UIcon :name="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                  {{ isBookmarked ? 'В избранном' : 'В закладки' }}
                </button>
                <div class="flex-1">
                  <ShareButton
                    :title="selected?.name ? `${selected.name} — Препараты` : 'Препараты'"
                    :description="selected?.latinName || (selected?.name ? `Препарат: ${selected.name}` : '')"
                    :image-id="selected?._id"
                    image-type="page"
                    section-name="Препараты"
                  />
                </div>
              </div>
            </template>
          </UModal>
        </template>

        <!-- Bottom Sheet для мобильных -->
        <template v-if="isMobile">
          <ClientOnly>
            <BottomSheet 
              v-model="modalOpen" 
              :title="selected?.name"
              :subtitle="modalDescription"
              :loading="isLoadingDrug"
              :skeleton-lines="6"
              @close="modalOpen = false"
            >
              <div class="p-4 pb-6">
                <div v-if="selected" class="space-y-5">
                  <div v-if="selected.categories && selected.categories.length">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Категории</label>
                    <div class="flex flex-wrap gap-1.5">
                      <span
                        v-for="(cat, i) in selected.categories"
                        :key="i"
                        :class="isAntidoteCategory(cat?.name)
                          ? 'text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200'
                          : 'text-xs px-2 py-1 rounded bg-slate-200 text-slate-600'"
                      >
                        {{ cat?.name || '' }}
                      </span>
                    </div>
                  </div>
                  
                  <div>
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Латинское название</label>
                    <p class="text-slate-900 dark:text-white">{{ selected.latinName || '—' }}</p>
                  </div>

                  <div v-if="selected.ageRestrictions">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Возрастные ограничения</label>
                    <p class="text-slate-900 dark:text-white">{{ selected.ageRestrictions }}</p>
                  </div>

                  

                  <div
                    v-if="(Array.isArray(selected?.pediatricDose) ? selected.pediatricDose.some((s: any) => (s ?? '').toString().trim().length > 0) : ((selected?.pediatricDose ?? '').toString().trim().length > 0))">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Педиатрическая
                      дозировка</label>
                    <p class="text-slate-900 dark:text-white">{{ pediatricDoseDisplay }}{{ selected.pediatricDoseUnit ?
                      `
                      ${selected.pediatricDoseUnit}` : '' }}</p>
                    <ul class="mt-1 space-y-1 text-sm text-slate-700 dark:text-slate-300"
                      v-if="Array.isArray(selected.pediatricDose) && selected.pediatricDose.length > 1">
                      <li v-for="(d, i) in selected.pediatricDose" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid"
                          class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ d }}</span>
                      </li>
                    </ul>
                  </div>

                  <div v-if="selected.indications && selected.indications.length">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Показания</label>
                    <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <li v-for="(v, i) in selected.indications" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid"
                          class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ v }}</span>
                      </li>
                    </ul>
                  </div>
                  <div v-if="selected.contraindications && selected.contraindications.length">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Противопоказания</label>
                    <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <li v-for="(v, i) in selected.contraindications" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid"
                          class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ v }}</span>
                      </li>
                    </ul>
                  </div>
                  <!-- Описание дозировок -->
                  <div v-if="selected.dosages?.description">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Дозировки</label>
                    <div class="mt-1 text-slate-700 dark:text-slate-300">
                      <template v-if="Array.isArray(selected.dosages.description)">
                        <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                          <li v-for="(d,i) in selected.dosages.description" :key="i" class="flex items-start gap-2">
                            <UIcon name="i-heroicons-check-20-solid" class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>{{ d }}</span>
                          </li>
                        </ul>
                      </template>
                      <template v-else>
                        <p class="text-sm">{{ selected.dosages.description }}</p>
                      </template>
                    </div>
                  </div>

                  <!-- Дозировки (калькулятор) -->
                  <div
                    v-if="selected.dosages && selected.dosages.type === 'calculator' && Array.isArray(selected.dosages.variants)">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                    <div class="mt-2 space-y-3">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                          <UInput v-model.number="weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70"
                            class="w-full" />
                        </div>
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Вариант</label>
                          <USelect v-model="selectedVariantName" size="xl" :items="variantNameItems" class="w-full" />
                        </div>
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Группа</label>
                          <USelect v-model="selectedGroupIdx" size="xl" :items="groupItems" class="w-full" />
                        </div>
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Метод</label>
                          <USelect v-model="selectedMethod" size="xl" :items="methodItems" class="w-full" />
                        </div>
                      </div>
                      <div>
                        <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Дозировка ({{ perKgUnit
                          }})</label>
                        <USelect v-model="selectedDoseValue" size="xl" :items="doseItems" class="w-full" />
                      </div>
                      <div
                        class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-700 dark:text-slate-300">
                          <span class="font-medium">Расчетная доза:&nbsp;</span>
                          <span v-if="calcDoseMg">{{ calcDoseMg }} {{ resultUnit }}</span>
                          <span v-else> —</span>
                        </div>
                        <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Способ введения: {{ selectedMethod || currentVariant?.method || '—' }}{{
                            currentVariant?.variant_name ? `,
                          ${currentVariant.variant_name}` : '' }}
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Дозировки (простой калькулятор) -->
                  <div v-else-if="selected.dosages && selected.dosages.type === 'simple_calculator'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                    <div class="mt-2 space-y-3">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                          <UInput v-model.number="weight" size="xl" type="number" min="0" step="0.1" placeholder="Например, 70"
                            class="w-full" />
                        </div>
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ simpleUnit }})</label>
                          <USelect v-model="simpleSelectedDose" size="xl" :items="simpleDoseItems" class="w-full" />
                          <p v-if="selected.dosages?.dose_description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ selected.dosages.dose_description }}</p>
                        </div>
                      </div>
                      <div
                        class="p-3 rounded bg-slate-200 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-700 dark:text-slate-300">
                          <span class="font-medium">Расчетная доза:&nbsp;</span>
                          <span v-if="simpleResult.value">
                            {{ simpleResult.value }} {{ simpleResult.unit }}
                            <span v-if="simpleResult.capped" class="text-xs text-amber-600 dark:text-amber-400">(указана
                              максимальная
                              доза)</span>
                          </span>
                          <span v-else> —</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Дозировки (простой калькулятор) -->
                  <div v-else-if="selected.dosages && selected.dosages.type === 'simple_calculator'" class="p-2 rounded bg-slate-50/50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Дозировки</label>
                    <div class="mt-2 space-y-3">
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Масса (кг)</label>
                          <UInput v-model.number="weight" type="number" min="0" step="0.1" placeholder="Например, 70"
                            class="w-full" />
                        </div>
                        <div>
                          <label class="block text-xs text-slate-600 dark:text-slate-400 mb-1">Доза ({{ simpleUnit }})</label>
                          <USelect v-model="simpleSelectedDose" :items="simpleDoseItems" class="w-full" />
                          <p v-if="selected.dosages?.dose_description" class="mt-2 text-sm text-slate-600 dark:text-slate-400">{{ selected.dosages.dose_description }}</p>
                        </div>
                      </div>
                      <div
                        class="p-3 rounded bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                        <div class="text-sm text-slate-700 dark:text-slate-300">
                          <span class="font-medium">Расчетная доза:&nbsp;</span>
                          <span v-if="simpleResult.value">
                            {{ simpleResult.value }} {{ simpleResult.unit }}
                            <span v-if="simpleResult.capped" class="text-xs text-amber-600 dark:text-amber-400">(указана
                              максимальная
                              доза)</span>
                          </span>
                          <span v-else> —</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Дозировки (таблица) -->
                  <div v-else-if="selected.dosages && selected.dosages.type === 'table'">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Калькулятор дозировок</label>
                    <div class="mt-2">
                      <table v-if="tableDisplayRows.length"
                        class="w-full table-auto text-sm border border-slate-200 dark:border-slate-700">
                        <thead class="bg-slate-50 dark:bg-slate-800/50">
                          <tr>
                            <th v-for="col in tableColumns" :key="col"
                              class="px-3 py-2 text-left font-medium text-slate-700 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">
                              {{ columnHeader(col) }}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-for="(row, i) in tableDisplayRows" :key="i"
                            class="odd:bg-white even:bg-slate-50/50 dark:odd:bg-slate-800 dark:even:bg-slate-800/60">
                            <td v-for="col in tableColumns" :key="col"
                              class="px-3 py-2 text-slate-800 dark:text-slate-200 border-b border-slate-200 dark:border-slate-700 whitespace-normal break-words align-top">
                              {{ row[col] }}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                      <div v-else class="py-6 text-center text-sm text-muted">Нет данных</div>
                    </div>
                  </div>
                  <div v-if="selected.adverse && selected.adverse.length">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Побочные эффекты</label>
                    <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <li v-for="(v, i) in selected.adverse" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid"
                          class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ v }}</span>
                      </li>
                    </ul>
                  </div>
                  

                  <!-- Механизм действия (как в модалке, после калькуляторов) -->
                  <div v-if="selected.mechanism && selected.mechanism.length">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Механизм действия</label>
                    <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <li v-for="(v, i) in selected.mechanism" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid"
                          class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ v }}</span>
                      </li>
                    </ul>
                  </div>

                  <div v-if="selected.interactions && selected.interactions.length">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Взаимодействия</label>
                    <ul class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <li v-for="(v, i) in selected.interactions" :key="i" class="flex items-start gap-2">
                        <UIcon name="i-heroicons-check-20-solid"
                          class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                        <span>{{ v }}</span>
                      </li>
                    </ul>
                  </div>
                  <div
                    v-if="selected.pharmacokinetics && (selected.pharmacokinetics.onset || selected.pharmacokinetics.duration || selected.pharmacokinetics.half_life || selected.pharmacokinetics.metabolism || selected.pharmacokinetics.elimination)">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Фармакокинетика</label>
                    <div class="mt-1 space-y-1 text-slate-700 dark:text-slate-300">
                      <div v-if="selected.pharmacokinetics.onset" class="flex items-center">
                        <span>Начало действия</span>
                        <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                        <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.onset }}</span>
                      </div>
                      <div v-if="selected.pharmacokinetics.duration" class="flex items-center">
                        <span>Длительность</span>
                        <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                        <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.duration }}</span>
                      </div>
                      <div v-if="selected.pharmacokinetics.half_life" class="flex items-center">
                        <span>T1/2</span>
                        <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                        <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.half_life }}</span>
                      </div>
                      <div v-if="selected.pharmacokinetics.metabolism" class="flex items-center">
                        <span>Метаболизм</span>
                        <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                        <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.metabolism }}</span>
                      </div>
                      <div v-if="selected.pharmacokinetics.elimination" class="flex items-center">
                        <span>Выведение</span>
                        <div class="mx-2 flex-1 border-b border-dashed border-slate-300 dark:border-slate-600"></div>
                        <span class="text-sm font-medium text-slate-900 dark:text-white">{{ selected.pharmacokinetics.elimination }}</span>
                      </div>
                    </div>
                  </div>
                  <div v-if="selected.antidote">
                    <label class="text-sm font-medium text-slate-700 dark:text-slate-300">Антидот</label>
                    <div class="mt-1 text-slate-700 dark:text-slate-300">
                      <p v-if="selected.antidote.name" class="font-semibold">{{ selected.antidote.name }}</p>
                      <p v-if="selected.antidote.latin_name" class="mt-0.5">{{ selected.antidote.latin_name }}</p>
                      <p v-if="selected.antidote.description" class="mt-1">{{ selected.antidote.description }}</p>
                      <div v-if="Array.isArray(selected.antidote.dosages) && selected.antidote.dosages.length"
                        class="mt-2">
                        <label class="text-sm font-medium">Дозировки антидота</label>
                        <ul class="mt-1 space-y-1">
                          <li v-for="(d, i) in selected.antidote.dosages" :key="i"
                            class="flex items-start gap-2 text-slate-700 dark:text-slate-300">
                            <UIcon name="i-heroicons-check-20-solid"
                              class="mt-1 shrink-0 w-4 h-4 text-green-600 dark:text-green-400" />
                            <span>{{ d.dose }} — {{ d.indication }}</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
                
                <!-- Кнопки действий -->
                <div class="mt-6">
                  <div class="flex gap-3 w-full">
                    <button 
                      type="button" 
                      :title="isBookmarked ? 'В избранном' : 'В закладки'" 
                      :disabled="!selected"
                      @click="toggleBookmark()"
                      class="rounded-md font-medium inline-flex disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors px-3 py-2 text-sm gap-2 text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 cursor-pointer flex-1 justify-center items-center"
                    >
                      <UIcon :name="isBookmarked ? 'i-heroicons-bookmark-solid' : 'i-heroicons-bookmark'" class="w-4 h-4" />
                      {{ isBookmarked ? 'В избранном' : 'В закладки' }}
                    </button>
                    <div class="flex-1">
                      <ShareButton
                        :title="selected?.name ? `${selected.name} — Препараты` : 'Препараты'"
                        :description="selected?.latinName || (selected?.name ? `Препарат: ${selected.name}` : '')"
                        :image-id="selected?._id"
                        image-type="page"
                        section-name="Препараты"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </BottomSheet>
          </ClientOnly>
        </template>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { marked } from 'marked'
import { ref, computed, nextTick, watch, onMounted, onUnmounted } from 'vue'

definePageMeta({ middleware: 'auth', headerTitle: 'Лекарства' })

// Получаем route для работы с query параметрами
const route = useRoute()

// Пагинация по 20
const PAGE_SIZE = 20
const items = ref<any[]>([])
const total = ref(0)
const skip = ref(0)
const initialLoading = ref(true)
const loadingMore = ref(false)
const sentinel = ref<HTMLElement | null>(null)

async function loadPage(first = false) {
  if (loadingMore.value) return
  loadingMore.value = true
  try {
    const res: any = await $fetch('/api/drugs', {
      params: { limit: PAGE_SIZE, skip: skip.value }
    })
    if (Array.isArray(res.items)) {
      items.value.push(...res.items)
      total.value = Number(res.total || 0)
      skip.value += PAGE_SIZE
    }
  } finally {
    loadingMore.value = false
    if (first) initialLoading.value = false
  }
}

let io: IntersectionObserver | null = null
onUnmounted(() => { try { io?.disconnect() } catch { } })

onMounted(async () => {
  await loadPage(true)
  // IntersectionObserver для догрузки
  io = new IntersectionObserver((entries) => {
    const entry = entries[0]
    if (entry && entry.isIntersecting) {
      if (items.value.length < total.value) loadPage()
    }
  })
  if (sentinel.value && io) io.observe(sentinel.value)
  
  // Проверяем URL параметр для автоматического открытия модального окна
  const openDrugId = route.query.id
  
  if (openDrugId) {
    console.log('Найден openDrugId в URL:', openDrugId)
    // Очищаем флаг о закрытии модалки при прямом переходе по ссылке
    sessionStorage.removeItem('drugModalClosedByUser')
    
    // Ждем загрузки данных и открываем нужный препарат
    const checkAndOpenDrug = async () => {
      if (!initialLoading.value) {
        if (items.value.length > 0) {
          const found = items.value.find((d: any) => String(d._id) === String(openDrugId))
          if (found) {
            // Открываем модалку без изменения URL для предотвращения моргания
            selected.value = normalizeDrug(found)
            modalOpen.value = true
            updateIsBookmarked()
            dropdownOpen.value = false
            return
          }
        }

        // Если не нашли в уже загруженных или список пуст — пробуем догрузить по ID
        try {
          isLoadingDrug.value = true
          const response: any = await $fetch(`/api/drugs/${openDrugId}`)
          const data = response?.data ?? response?.item ?? response
          if (data && (data._id || data.id)) {
            selected.value = normalizeDrug(data)
            modalOpen.value = true
            updateIsBookmarked()
            dropdownOpen.value = false
          }
        } catch (error) {
          console.error('Ошибка загрузки препарата:', error)
        } finally {
          isLoadingDrug.value = false
        }
      } else {
        // Данные еще загружаются, повторяем через 100мс
        setTimeout(checkAndOpenDrug, 100)
      }
    }
    checkAndOpenDrug()
  }
})

const { isMobile } = useIsMobile()
const modalOpen = ref(false)
const selected = ref<any | null>(null)
const isBookmarked = ref(false)
const userBookmarks = ref<any[]>([])
const isLoadingDrug = ref(false)
// Фильтрация по категориям
const selectedCategoryIds = ref<string[]>([])
const categoryOptions = ref<Array<{ label: string; value: string }>>([])
// Загружаем категории один раз
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/drugs/categories')
    if (Array.isArray(res)) {
      const mapped: Array<{ label: string; value: string }> = res.map((c: any) => ({ label: c?.name || '', value: String(c?._id || c?.id || '') }))
      categoryOptions.value = mapped.filter((o: { label: string; value: string }) => !!o.value)
    } else if (Array.isArray(res?.items)) {
      const mapped2: Array<{ label: string; value: string }> = res.items.map((c: any) => ({ label: c?.name || '', value: String(c?._id || c?.id || '') }))
      categoryOptions.value = mapped2.filter((o: { label: string; value: string }) => !!o.value)
    }
  } catch (e) {
    console.warn('Не удалось загрузить категории', e)
  }
})
function normalizeDrug(drug: any) {
  const d = { ...(drug || {}) }
  // Приводим категории к массиву объектов { _id, name }
  const cats = Array.isArray(d.categories) ? d.categories : []
  d.categories = cats.map((c: any) => {
    const id = String(c?._id || c?.id || c?.value || '')
    const name = String(c?.name || findCategoryNameById(id) || '').trim()
    return { _id: id, name }
  }).filter((c: any) => c._id)
  return d
}

function findCategoryNameById(id: string): string | undefined {
  if (!id) return undefined
  const found = (categoryOptions.value || []).find(o => String(o.value) === String(id))
  return found?.label
}

const filteredItems = computed(() => {
  // Текстовый фильтр по поиску
  const q = (searchText.value || '').toLowerCase().trim()
  const byText = q
    ? items.value.filter((d: any) => {
        const text = [d.name, d.latinName, formatDrugForm(d.forms), ...(d.synonyms||[])].filter(Boolean).join(' ').toLowerCase()
        return text.includes(q)
      })
    : items.value

  if (!selectedCategoryIds.value.length) return byText
  const set = new Set<string>(selectedCategoryIds.value.map((v: string) => String(v)))
  const selectedNames = new Set<string>(
    categoryOptions.value
      .filter((o) => set.has(o.value))
      .map((o) => normalizeCategoryName(o.label))
  )
  return byText.filter((d: any) => {
    const cats = (d?.categories || [])
    const catIds = cats.map((c: any) => String(c?._id || c?.id || c?.value || ''))
    if (catIds.some((id: string) => set.has(id))) return true
    // Фолбэк по названию (на случай расхождений в единственном/множественном числе)
    const catNames = cats.map((c: any) => normalizeCategoryName(String(c?.name || '')))
    return catNames.some((n: string) => selectedNames.has(n))
  })
})

const searchText = ref('')
function clearSearch() { searchText.value = '' }

function normalizeCategoryName(name: string): string {
  const n = (name || '').toLowerCase().trim()
  // Убираем типичные русские множественные окончания
  return n
    .replace(/ы$/i, '')
    .replace(/и$/i, '')
    .replace(/а$/i, '')
    .replace(/я$/i, '')
    .replace(/е$/i, '')
}


function openModal(drug: any) {
  selected.value = drug
  modalOpen.value = true
  isLoadingDrug.value = false // Данные уже загружены
  updateIsBookmarked()
  dropdownOpen.value = false
  
  // Обновляем URL с ID препарата через query параметр только если его еще нет
  if (!route.query.id || route.query.id !== drug._id) {
    // Используем прямое изменение истории браузера для избежания моргания
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.set('id', drug._id)
    window.history.replaceState({}, '', newUrl.toString())
  }
}
async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) userBookmarks.value = res.items || []
  } catch {}
}

function buildDrugUrl(it: any) {
  return `/drugs?id=${it?._id}`
}

async function updateIsBookmarked() {
  if (!selected.value) { isBookmarked.value = false; return }
  if (userBookmarks.value.length === 0) await loadBookmarks()
  const targetUrl = buildDrugUrl(selected.value)
  isBookmarked.value = userBookmarks.value.some((b: any) => b.url === targetUrl)
}

async function addBookmark() {
  if (!selected.value) return
  try {
    const isAntidote = selected.value.antidote || (selected.value.categories || []).some((c:any)=> String(c?.name||'').toLowerCase().includes('антидот'))
    
    console.log('🔍 Adding bookmark for drug:', selected.value.name)
    console.log('🔍 Drug data:', selected.value)
    
    // Подготавливаем дозировки для сохранения
    let dosagesToSave: any = []
    if (selected.value.dosages) {
      // Если есть описание дозировок (текстовое)
      if (selected.value.dosages.description) {
        if (Array.isArray(selected.value.dosages.description)) {
          dosagesToSave = selected.value.dosages.description
        } else {
          dosagesToSave = [selected.value.dosages.description]
        }
      } 
      // Если есть doses массив (калькулятор)
      else if (selected.value.dosages.doses && Array.isArray(selected.value.dosages.doses)) {
        dosagesToSave = selected.value.dosages.doses.map((d: any) => {
          if (typeof d === 'string') return d
          // Формируем строку с информацией о дозе
          const parts = []
          if (d.context) parts.push(`${d.context}:`)
          if (d.formula) parts.push(d.formula)
          if (d.mgPerKg) parts.push(`${d.mgPerKg} мг/кг`)
          if (d.maxMg) parts.push(`макс. ${d.maxMg} мг`)
          if (d.concentrationMgPerMl) parts.push(`${d.concentrationMgPerMl} мг/мл`)
          if (d.notes) parts.push(`(${d.notes})`)
          return parts.join(' ')
        }).filter(Boolean)
      }
      // Если есть default_dose и unit (простой калькулятор) - НЕ сохраняем, это калькулятор
      // else if (selected.value.dosages.default_dose && selected.value.dosages.unit) {
      //   dosagesToSave = [`${selected.value.dosages.default_dose} ${selected.value.dosages.unit}`]
      //   if (selected.value.dosages.description) {
      //     dosagesToSave.push(selected.value.dosages.description)
      //   }
      // }
    }
    
    const response = await $fetch('/api/bookmarks', {
      method: 'POST',
      body: {
        type: 'drug',
        title: selected.value.name,
        description: selected.value.description || selected.value.latinName || '',
        category: getCategoryForBookmark(selected.value.categories, isAntidote),
        url: buildDrugUrl(selected.value),
        // Добавляем все данные препарата
        latinName: selected.value.latinName || '',
        categories: (selected.value.categories || []).map((c: any) => c?.name).filter(Boolean),
        indications: selected.value.indications || [],
        contraindications: selected.value.contraindications || [],
        dosages: dosagesToSave,
        sideEffects: selected.value.adverse || selected.value.sideEffects || [], // используем adverse если есть
        adverse: selected.value.adverse || [], // альтернативное поле для побочных
        mechanismOfAction: selected.value.mechanismOfAction || [],
        mechanism: selected.value.mechanism || [], // альтернативное поле
        pharmacokinetics: selected.value.pharmacokinetics || {},
        synonyms: selected.value.synonyms || [],
        analogs: selected.value.analogs || [],
        interactions: selected.value.interactions || [],
        antidotes: selected.value.antidotes || [],
        antidote: selected.value.antidote || {},
        forms: selected.value.forms || {},
        pediatricDose: selected.value.pediatricDose || [],
        pediatricDoseUnit: selected.value.pediatricDoseUnit || '',
        ageRestrictions: selected.value.ageRestrictions || ''
      }
    })
    
    console.log('🔍 Bookmark response:', response)
    isBookmarked.value = true
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Добавлено в закладки', color: 'primary' })
  } catch (error) {
    console.error('🔍 Error adding bookmark:', error)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось добавить в закладки', color: 'error' })
  }
}

async function removeBookmark() {
  if (!selected.value) return
  try {
    const targetUrl = buildDrugUrl(selected.value)
    if (userBookmarks.value.length === 0) await loadBookmarks()
    const bm = userBookmarks.value.find((b: any) => b.url === targetUrl)
    if (!bm?._id) return
    await $fetch(`/api/bookmarks/${bm._id}`, { method: 'DELETE' })
    isBookmarked.value = false
    userBookmarks.value = userBookmarks.value.filter((b: any) => b._id !== bm._id)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Удалено из закладок', color: 'neutral' })
  } catch {}
}

async function toggleBookmark() {
  if (!selected.value) return
  
  if (isBookmarked.value) {
    await removeBookmark()
  } else {
    await addBookmark()
  }
  
  // Обновляем локальный список закладок
  await loadBookmarks()
  
  // Уведомляем другие компоненты об обновлении закладок
  window.dispatchEvent(new CustomEvent('bookmarks-updated'))
}

// Функция для поделиться
async function shareItem() {
  if (!selected.value) return
  
  const shareData = {
    title: selected.value.name,
    text: `Препарат: ${selected.value.name}${selected.value.latinName ? ` (${selected.value.latinName})` : ''}`,
    url: window.location.href
  }
  
  try {
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      await navigator.share(shareData)
    } else {
      // Fallback - копируем URL в буфер обмена
      await navigator.clipboard.writeText(window.location.href)
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Ссылка скопирована в буфер обмена', color: 'primary' })
    }
  } catch (error) {
    console.error('Ошибка при попытке поделиться:', error)
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось поделиться', color: 'error' })
  }
}

function closeModal() {
  modalOpen.value = false
  selected.value = null
  dropdownOpen.value = false
  
  // Очищаем query параметры используя прямое изменение истории браузера
  const newUrl = new URL(window.location.href)
  newUrl.searchParams.delete('id')
  window.history.replaceState({}, '', newUrl.toString())
}





// Форматирование формы выпуска
const formatDrugForm = (forms: any) => {
  if (!forms) return '—'

  const parts = []

  if (forms.doseValue != null) {
    parts.push(forms.doseValue)
  }

  if (forms.doseUnit) {
    parts.push(forms.doseUnit)
  }

  if (forms.volumeMl != null) {
    // Добавляем точку только если есть дозировка
    const separator = (forms.doseValue != null || forms.doseUnit) ? ' • ' : ''
    parts.push(`${separator}${forms.volumeMl} мл`)
  }

  return parts.join('') || '—'
}

// Функции для копирования и шаринга
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    // Можно добавить уведомление об успешном копировании
    console.log('Скопировано в буфер обмена:', text)
  } catch (err) {
    console.error('Ошибка копирования:', err)
  }
}

const shareResult = async () => {
  if (!calcResult.value) return

  const shareText = `Расчет дозировки препарата ${selected.value?.name || ''}:
Вес: ${weight.value} кг
Дозировка: ${selectedDoseLabel.value}
Результат: ${calcResult.value}${calcResultMl.value ? ` (${calcResultMl.value})` : ''}`

  if (navigator.share) {
    try {
      await navigator.share({
        title: `Дозировка ${selected.value?.name || ''}`,
        text: shareText
      })
    } catch (err) {
      console.error('Ошибка шаринга:', err)
    }
  } else {
    // Fallback - копируем в буфер обмена
    await copyToClipboard(shareText)
  }
}

const copyResult = async () => {
  if (!calcResult.value) return

  const resultText = `${calcResult.value}${calcResultMl.value ? ` (${calcResultMl.value})` : ''}`
  await copyToClipboard(resultText)
}

// Проверка возрастных ограничений для калькулятора
const shouldShowCalculator = computed(() => {
  if (!selected.value?.ageRestrictions) return true

  const restrictions = selected.value.ageRestrictions.toLowerCase()
  // Скрываем калькулятор если есть ограничения "старше 18", "с 18 лет", "взрослым" и т.д.
  const adultRestrictions = ['старше 18', 'с 18 лет', 'взрослым', '18+', 'от 18', 'для взрослых']

  return !adultRestrictions.some(restriction => restrictions.includes(restriction))
})

// Калькулятор детской дозы
const weight = ref<number | null>(null)
const selectedDoseLabel = ref<string | undefined>(undefined)
const dropdownOpen = ref(false)
// Dosages calculator state
const selectedVariantName = ref<string | undefined>(undefined)
const selectedGroupIdx = ref<number>(0)
const selectedDoseValue = ref<string | number | undefined>(undefined)
const selectedMethod = ref<string | undefined>(undefined)

const variants = computed(() => (selected.value?.dosages?.variants || []) as any[])
const variantNameItems = computed(() => {
  const names = Array.from(new Set(variants.value.map((v: any) => (v?.variant_name || '').toString().trim()).filter(Boolean)))
  return names.map(n => ({ label: n, value: n }))
})
const methodsForVariant = computed(() => {
  const name = (selectedVariantName.value || '').toString().trim()
  const list = variants.value.filter((v: any) => (v?.variant_name || '').toString().trim() === name)
  const methods = list.map((v: any) => v?.method).flat()
  const flat = Array.isArray(methods) ? methods : list.map((v: any) => v?.method)
  const uniq = Array.from(new Set((flat as any[]).filter(Boolean).map(x => String(x))))
  return uniq
})
const methodItems = computed(() => methodsForVariant.value.map(m => ({ label: m, value: m })))
const currentVariant = computed(() => {
  const name = (selectedVariantName.value || '').toString().trim()
  const method = (selectedMethod.value || '').toString().trim()
  let list = variants.value.filter((v: any) => (v?.variant_name || '').toString().trim() === name)
  if (method) list = list.filter((v: any) => String(v?.method) === method)
  return list[0] || null
})
const groups = computed(() => (currentVariant.value?.groups || []) as any[])
const currentGroup = computed(() => groups.value[selectedGroupIdx.value] || null)

const groupItems = computed(() => groups.value.map((g: any, i: number) => ({ label: g?.group_name || `Группа ${i + 1}`, value: i })))
const doseItems = computed(() => (currentGroup.value?.doses || []).map((d: any) => ({ label: d, value: d })))

watch([selected, selectedVariantName, selectedMethod, selectedGroupIdx], () => {
  // Сброс выбора дозы на значение по умолчанию при смене препарата/варианта/группы
  const def = currentGroup.value?.default_dose
  selectedDoseValue.value = def ?? (currentGroup.value?.doses || [])[0]
})

watch([selected, selectedVariantName], () => {
  // При смене препарата или варианта — выставляем метод по умолчанию
  const firstMethod = methodItems.value[0]?.value
  selectedMethod.value = firstMethod
  selectedGroupIdx.value = 0
})

const doseOptions = computed(() => {
  const raw = selected.value?.pediatricDose
  if (!raw) return []
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.flatMap(s => parsePediatricDose(s || ''))
})
const doseOptionsLabels = computed(() => doseOptions.value.map(o => o.label))

watch(selected, () => {
  // сброс при смене препарата
  console.log('🔄 Смена препарата, сбрасываем состояние')
  weight.value = null
  selectedDoseLabel.value = undefined
  dropdownOpen.value = false
  // НЕ убираем обработчик клика здесь, так как BottomSheet еще открыт
})

// Функции для управления выпадающим списком
const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const selectOption = (label: string) => {
  selectedDoseLabel.value = label
  dropdownOpen.value = false
}

// Закрываем выпадающий список при закрытии BottomSheet и очищаем URL
watch(modalOpen, (newValue, oldValue) => {
  if (!newValue) {
    dropdownOpen.value = false
  }
  
  // Если модалка закрылась (была открыта, стала закрыта)
  if (oldValue === true && newValue === false) {
    // Устанавливаем флаг о том, что модалка была закрыта пользователем
    sessionStorage.setItem('drugModalClosedByUser', 'true')
    
    // Очищаем query параметры используя прямое изменение истории браузера
    const newUrl = new URL(window.location.href)
    newUrl.searchParams.delete('id')
    window.history.replaceState({}, '', newUrl.toString())
  }
})

// Обработчик события от поиска - выносим из onMounted для глобальной доступности
const handleOpenDrugModal = (event: CustomEvent) => {
  console.log('Получено событие openDrugModal:', event.detail)
  const drugId = event.detail.drugId
  
  // Очищаем флаг о закрытии модалки, так как пользователь явно хочет её открыть
  sessionStorage.removeItem('drugModalClosedByUser')
  
  const found = items.value.find((d: any) => String(d._id) === String(drugId))
  if (found) {
    console.log('Найден препарат для открытия:', found.name)
    openModal(found)
  } else {
    console.log('Препарат не найден в списке, ID:', drugId)
  }
}

// Добавляем обработчик события глобально
window.addEventListener('openDrugModal', handleOpenDrugModal as EventListener)

onUnmounted(() => {
  window.removeEventListener('openDrugModal', handleOpenDrugModal as EventListener)
})

onUnmounted(() => {
  // НЕ убираем обработчик клика - мы его не добавляем
  // removeOutsideClickHandler()
})

const pickedDose = computed(() => doseOptions.value.find(o => o.label === selectedDoseLabel.value) || null)

const calcResult = computed(() => {
  if (!weight.value || !pickedDose.value || weight.value <= 0) return ''

  const w = weight.value
  const d = pickedDose.value

  // Если есть диапазон дозировок
  if (d.minPerKg != null && d.maxPerKg != null && d.minPerKg !== d.maxPerKg) {
    const minDose = round(w * d.minPerKg)
    const maxDose = round(w * d.maxPerKg)
    return `${minDose} - ${maxDose} мг`
  }

  // Если одна дозировка
  if (d.minPerKg != null || d.maxPerKg != null) {
    const dosePerKg = d.minPerKg ?? d.maxPerKg ?? 0
    const totalDose = round(w * dosePerKg)
    return `${totalDose} мг`
  }

  return ''
})

const calcResultMl = computed(() => {
  if (!calcResult.value || !selected.value?.forms) return ''

  const forms = selected.value.forms
  const doseValue = forms.doseValue
  const volumeMl = forms.volumeMl

  // Проверяем, что у нас есть данные для расчета концентрации
  if (!doseValue || !volumeMl || doseValue <= 0 || volumeMl <= 0) return ''

  // Вычисляем общее количество вещества в ампуле: дозировка (мг) × объем (мл)
  const totalMgInAmpule = doseValue * volumeMl

  // Извлекаем числовое значение из calcResult (берем первое число)
  const resultMatch = calcResult.value.match(/(\d+(?:[\.,]\d+)?)/)
  if (!resultMatch) return ''

  const requiredMg = parseFloat(resultMatch[1].replace(',', '.'))

  // Рассчитываем необходимое количество ампул
  const requiredAmpules = round(requiredMg / totalMgInAmpule)

  // Переводим в мл: количество ампул × объем одной ампулы
  const requiredMl = round(requiredAmpules * volumeMl)

  // Если есть диапазон, рассчитываем и для максимального значения
  const rangeMatch = calcResult.value.match(/(\d+(?:[\.,]\d+)?)\s*-\s*(\d+(?:[\.,]\d+)?)/)
  if (rangeMatch) {
    const minMg = parseFloat(rangeMatch[1].replace(',', '.'))
    const maxMg = parseFloat(rangeMatch[2].replace(',', '.'))
    const minAmpules = round(minMg / totalMgInAmpule)
    const maxAmpules = round(maxMg / totalMgInAmpule)
    const minMl = round(minAmpules * volumeMl)
    const maxMl = round(maxAmpules * volumeMl)
    return `${minMl} - ${maxMl} мл`
  }

  return `${requiredMl} мл`
})

// Calculator: compute mg based on weight * selectedDoseValue
const calcDoseMg = computed(() => {
  if (!weight.value || !selectedDoseValue.value) return ''
  const perKg = parseFloat(String(selectedDoseValue.value).replace(',', '.'))
  if (!perKg || perKg <= 0) return ''
  const total = round(perKg * (weight.value || 0))
  return `${total}`
})

const perKgUnit = computed(() => {
  const u = (currentGroup.value?.unit || '').toString().trim()
  return u || (selectedMethod.value === 'инфузор' ? 'мг/кг/час' : 'мг/кг')
})
const resultUnit = computed(() => {
  const u = perKgUnit.value
  // Преобразуем единицу дозы на кг в итоговую единицу (на час, если присутствует /час)
  if (u.includes('/час')) return 'мг/час'
  return 'мг'
})

// Табличные дозировки
const tableRows = computed(() => {
  const d = selected.value?.dosages || {}
  const data = Array.isArray(d.table_data) ? d.table_data
    : (Array.isArray(d.rows) ? d.rows
      : (Array.isArray(d.table) ? d.table : []))
  return data as any[]
})
const tableColumns = computed(() => {
  const rows = tableRows.value
  if (!Array.isArray(rows) || rows.length === 0) return [] as string[]
  // Объединяем ключи всех строк
  const set = new Set<string>()
  for (const r of rows) Object.keys(r || {}).forEach(k => set.add(k))
  let cols = Array.from(set)
  // Фолбэк: если по какой-то причине ключи не определены, пробуем взять из первой строки
  if (cols.length === 0) cols = Object.keys(rows[0] || {})
  // Ещё один фолбэк: ожидаемые ключи таблиц дозировок
  if (cols.length === 0) cols = ['age', 'dose', 'unit', 'note']
  return cols
})
function columnHeader(key: string): string {
  const map: Record<string, string> = {
    age: 'Возраст',
    dose: 'Доза',
    unit: 'Ед.',
    note: 'Примечание'
  }
  return map[key] || key
}

// Debug: логирование табличных дозировок
if (process.client) {
  watch([selected, tableRows, tableColumns], () => {
    try {
      // @ts-ignore
      const d = selected.value?.dosages
      console.log('🧪 dosages:', d)
      console.log('🧪 tableRows:', tableRows.value)
      console.log('🧪 tableColumns:', tableColumns.value)
      console.log('🧪 nuxtTableColumns:', nuxtTableColumns.value)
    } catch (e) {
      console.warn('🧪 debug error:', e)
    }
  }, { immediate: false })
}

// Плоские объекты для таблицы (убираем Proxy)
const tableDisplayRows = computed(() => {
  const rows = Array.isArray(tableRows.value) ? tableRows.value : []
  try {
    return JSON.parse(JSON.stringify(rows))
  } catch {
    return rows.map(r => ({ ...(r || {}) }))
  }
})

// Простой калькулятор (simple_calculator)
const simpleDoseItems = computed(() => {
  const d: any = selected.value?.dosages
  if (!d || d.type !== 'simple_calculator') return []
  const arr = Array.isArray(d.doses) ? d.doses : []
  return arr.map((x: any) => ({ label: String(x), value: String(x) }))
})
const simpleSelectedDose = ref<string | undefined>(undefined)
watch(selected, () => {
  const d: any = selected.value?.dosages
  if (d?.type === 'simple_calculator') {
    simpleSelectedDose.value = d.default_dose ? String(d.default_dose) : (Array.isArray(d.doses) ? String(d.doses[0] ?? '') : undefined)
  } else {
    simpleSelectedDose.value = undefined
  }
})
const simpleUnit = computed(() => {
  const u = (selected.value?.dosages?.unit || '').toString().trim()
  return u || 'мг/кг'
})
const simpleResult = computed(() => {
  const d: any = selected.value?.dosages
  if (!d || d.type !== 'simple_calculator') return { value: '', capped: false, unit: '' }
  const w = Number(weight.value || 0)
  // Дозы в YAML задаются в мг/кг (например, 0.05 мг/кг)
  const perKg = parseFloat(String(simpleSelectedDose.value || '').replace(',', '.'))
  if (!w || isNaN(perKg)) return { value: '', capped: false, unit: d.unit || '' }
  // Пересчёт в мг: мг/кг × кг
  let total = perKg * w
  // Округляем до двух знаков для малых чисел (пример: 0.5 мг при 10 кг и 0.05 мг/кг)
  total = Math.round(total * 100) / 100
  let capped = false
  const rawMax = d.max_dose != null ? d.max_dose : d.mxn_dose
  if (rawMax != null) {
    const maxv = Number(rawMax)
    if (!isNaN(maxv) && total > maxv) { total = maxv; capped = true }
  }
  return { value: String(total), capped, unit: d.max_dose_unit || d.mxn_dose_unit || (d.unit ? String(d.unit).split('/')[0] : 'мг') }
})

// Колонки для UTable (TanStack): строго id + accessorKey + строковый header
const nuxtTableColumns = computed(() => tableColumns.value.map(key => ({
  id: String(key),
  accessorKey: String(key),
  header: String(columnHeader(key))
})))

function round(n: number) { return Math.round(n * 10) / 10 }

function renderMarkdown(text: string): string {
  if (!text) return ''

  // Настройки marked для безопасного рендеринга
  marked.setOptions({
    gfm: true,
    breaks: true
  })

  return marked(text) as string
}

function isAntidoteCategory(name?: string): boolean {
  if (!name) return false
  const n = String(name).toLowerCase().trim()
  return n.includes('антидот')
}

function getFirstNonAntidoteCategoryName(categories: Array<any> | undefined | null): string {
  const list = Array.isArray(categories) ? categories : []
  for (const c of list) {
    const name = String(c?.name || '').trim()
    if (!name) continue
    if (!isAntidoteCategory(name)) return name
  }
  return ''
}

function getCategoryForBookmark(categories: Array<any> | undefined | null, isAntidote: boolean): string {
  const list = Array.isArray(categories) ? categories : []
  const categoryNames = []
  
  // Добавляем все не-антидотные категории
  for (const c of list) {
    const name = String(c?.name || '').trim()
    if (!name) continue
    if (!isAntidoteCategory(name)) categoryNames.push(name)
  }
  
  // Добавляем "Антидоты" если препарат является антидотом
  if (isAntidote) {
    categoryNames.push('Антидоты')
  }
  
  return categoryNames.join(', ')
}

const modalDescription = computed(() => {
  const syn = selected.value?.synonyms
  if (Array.isArray(syn) && syn.length) {
    const text = syn.map(s => (s ?? '').toString().trim()).filter(Boolean).join(', ')
    return text || 'Информация о препарате'
  }
  return 'Информация о препарате'
})

function parsePediatricDose(text: string): Array<{ label: string; minPerKg?: number; maxPerKg?: number }> {
  if (!text) return []

  // Сначала заменяем запятые в десятичных числах на точки для корректного парсинга
  // Ищем паттерны типа "0,01" или "1,5" и заменяем запятую на точку
  let normalizedText = text.replace(/(\d+),(\d+)/g, '$1.$2')

  // Теперь разделяем по запятым/точкам с запятой (уже без запятых в числах)
  const parts = normalizedText.split(/[,;]+/).map(p => p.trim()).filter(Boolean)
  const res: Array<{ label: string; minPerKg?: number; maxPerKg?: number }> = []

  for (const p of parts) {
    // Ищем диапазон вида "20-30 мг/кг" или "20–30 мг/кг"
    const range = p.match(/(\d+(?:\.\d+)?)\s*[-–]\s*(\d+(?:\.\d+)?)\s*мг\s*\/\s*кг/i)
    if (range) {
      const a = parseFloat(range[1])
      const b = parseFloat(range[2])
      res.push({ label: p, minPerKg: Math.min(a, b), maxPerKg: Math.max(a, b) })
      continue
    }

    // Ищем одиночное значение с единицами "5 мг/кг"
    const singleWithUnit = p.match(/(\d+(?:\.\d+)?)\s*мг\s*\/\s*кг/i)
    if (singleWithUnit) {
      const v = parseFloat(singleWithUnit[1])
      res.push({ label: p, minPerKg: v, maxPerKg: v })
      continue
    }

    // Ищем просто число без единиц (например, "300" или "0.01")
    const justNumber = p.match(/^(\d+(?:\.\d+)?)$/)
    if (justNumber) {
      const v = parseFloat(justNumber[1])
      res.push({ label: p, minPerKg: v, maxPerKg: v })
      continue
    }

    // Если формат иной — просто добавим как label без расчета
    res.push({ label: p })
  }

  return res
}

const pediatricDoseDisplay = computed(() => {
  const raw = selected.value?.pediatricDose
  if (!raw) return ''
  const arr = Array.isArray(raw) ? raw : [raw]
  const nums = arr
    .map(s => (s ?? '').toString())
    .map(s => s.match(/(\d+(?:[\.,]\d+)?)/g) || [])
    .flat()
    .map(v => parseFloat(v.replace(',', '.')))
    .filter(v => !Number.isNaN(v))
  if (!nums.length) return arr.join(', ')
  const min = Math.min(...nums)
  const max = Math.max(...nums)
  return min === max ? `${min}` : `${min} - ${max}`
})

const hasPediatricDoseBlock = computed(() => {
  const raw = selected.value?.pediatricDose
  if (!raw) return false
  const arr = Array.isArray(raw) ? raw : [raw]
  return arr.some(s => (s ?? '').toString().trim().length > 0)
})

// simple_calculator_with_ml: комбинированные дозы (мг/кг и мл/кг)
const withMlSelectedIndex = ref<number | undefined>(undefined)
const withMlMgUnit = computed(() => (selected.value?.dosages?.mg_dosages?.unit || 'мг/кг'))
const withMlMlUnit = computed(() => (selected.value?.dosages?.ml_dosages?.unit || 'мл/кг'))
const withMlDoseItems = computed(() => {
  const d: any = selected.value?.dosages
  if (!d || d.type !== 'simple_calculator_with_ml') return []
  const mg = Array.isArray(d.mg_dosages?.doses) ? d.mg_dosages.doses : []
  const ml = Array.isArray(d.ml_dosages?.doses) ? d.ml_dosages.doses : []
  const maxLen = Math.max(mg.length, ml.length)
  const items: Array<{ label: string; value: number }> = []
  for (let i = 0; i < maxLen; i++) {
    const mgVal = mg[i] != null ? String(mg[i]) : ''
    const mlVal = ml[i] != null ? String(ml[i]) : ''
    const label = `${mgVal || '—'} ${withMlMgUnit.value}${mlVal ? ` (${mlVal} ${withMlMlUnit.value})` : ''}`
    items.push({ label, value: i })
  }
  return items
})
watch(selected, () => {
  const d: any = selected.value?.dosages
  if (d?.type === 'simple_calculator_with_ml') {
    // Индекс по умолчанию: сначала пробуем mg.default_dose, иначе 0
    const defMg = d.mg_dosages?.default_dose
    if (defMg != null) {
      const idx = (Array.isArray(d.mg_dosages?.doses) ? d.mg_dosages.doses : []).findIndex((x: any) => String(x) === String(defMg))
      withMlSelectedIndex.value = idx >= 0 ? idx : 0
    } else {
      withMlSelectedIndex.value = 0
    }
  } else {
    withMlSelectedIndex.value = undefined
  }
})
const withMlResult = computed(() => {
  const d: any = selected.value?.dosages
  if (!d || d.type !== 'simple_calculator_with_ml') return { mg: '', ml: '', capped: false }
  const w = Number(weight.value || 0)
  const idx = Number(withMlSelectedIndex.value ?? -1)
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
</script>
