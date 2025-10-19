<template>
  <div>
    <main class="flex-1">
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <AdminSubnav title="Алгоритмы" />

        <!-- Таблица разделов алгоритмов -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Разделы ({{ sectionsTotal }})</h3>
            <UButton color="primary" @click="onAddSection" class="cursor-pointer">Добавить раздел</UButton>
          </div>

          <div class="mb-4">
            <UInput v-model="sectionsSearch" placeholder="Поиск по названию раздела..." size="lg" class="w-full" :input-class="'px-4 py-3'">
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border rounded-lg overflow-hidden">
            <UTable :data="sectionsVisible" :columns="sectionsColumns" :loading="pendingSections" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">
                  <div v-if="sectionsError" class="text-red-600 dark:text-red-400 mb-2">Ошибка загрузки: {{ sectionsError }}</div>
                  <div v-else-if="!pendingSections && sections.length === 0">Нет данных. Добавьте раздел.</div>
                  <div v-else>Загрузка...</div>
                </div>
              </template>
            </UTable>
            
            <!-- Кнопка показать ещё/скрыть -->
            <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
              <UButton 
                v-if="filteredSections.length > 3" 
                variant="soft" 
                color="neutral" 
                @click="showAllSections = !showAllSections"
                class="cursor-pointer"
              >
                <UIcon :name="showAllSections ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="me-1" />
                {{ showAllSections ? 'Свернуть' : `Показать все (${filteredSections.length})` }}
              </UButton>
            </div>

            <!-- Пагинация только когда раскрыто полностью -->
            <div v-if="showAllSections && sectionsTotalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <UPagination :page="sectionsPage" :total="sectionsTotalPages" :page-size="1" :max-visible="10" show-last show-first @update:page="sectionsPage = $event" />
            </div>
          </div>
        </div>

        <!-- Таблица категорий алгоритмов -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Категории ({{ catTotal }})</h3>
            <UButton color="primary" @click="onAddCategory" class="cursor-pointer">Добавить категорию</UButton>
          </div>

          <div class="mb-4">
            <UInput v-model="catSearch" placeholder="Поиск по названию категории..." size="lg" class="w-full" :input-class="'px-4 py-3'">
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border rounded-lg overflow-hidden">
            <UTable :data="catsVisible" :columns="catColumns" :loading="pendingCats" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">
                  <div v-if="catsError" class="text-red-600 dark:text-red-400 mb-2">Ошибка загрузки: {{ catsError }}</div>
                  <div v-else-if="!pendingCats && cats.length === 0">Нет данных. Добавьте категорию.</div>
                  <div v-else>Загрузка...</div>
                </div>
              </template>
            </UTable>
            
            <!-- Кнопка показать ещё/скрыть -->
            <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
              <UButton 
                v-if="filteredCats.length > 3" 
                variant="soft" 
                color="neutral" 
                @click="showAllCategories = !showAllCategories"
                class="cursor-pointer"
              >
                <UIcon :name="showAllCategories ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="me-1" />
                {{ showAllCategories ? 'Свернуть' : `Показать все (${filteredCats.length})` }}
              </UButton>
            </div>

            <!-- Пагинация только когда раскрыто полностью -->
            <div v-if="showAllCategories && catTotalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <UPagination :page="catPage" :total="catTotalPages" :page-size="1" :max-visible="10" show-last show-first @update:page="catPage = $event" />
            </div>
          </div>
        </div>

        <!-- Таблица алгоритмов -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Алгоритмы ({{ algoTotal }})</h3>
            <UButton color="primary" @click="onAddAlgorithm" class="cursor-pointer" :disabled="cats.length===0">Добавить алгоритм</UButton>
          </div>

          <div class="mb-4">
            <UInput v-model="algoSearch" placeholder="Поиск по названию, категории или коду диагноза..." size="lg" class="w-full" :input-class="'px-4 py-3'">
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border rounded-lg overflow-hidden">
            <UTable :data="algoPaginated" :columns="algoColumns" :loading="pendingAlgos" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">
                  <div v-if="algosError" class="text-red-600 dark:text-red-400 mb-2">Ошибка загрузки: {{ algosError }}</div>
                  <div v-else-if="!pendingAlgos && algos.length === 0">Нет данных. Добавьте алгоритм.</div>
                  <div v-else>Загрузка...</div>
                </div>
              </template>
            </UTable>
            <div v-if="algoTotalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <div class="flex items-center justify-between">
                <div class="text-sm text-slate-600 dark:text-slate-400">Страница {{ algoPage }} из {{ algoTotalPages }} ({{ algoTotal }} записей)</div>
                <div class="flex items-center gap-2">
                  <UButton :disabled="algoPage <= 1" @click="algoPage = 1" size="sm" variant="ghost">Первая</UButton>
                  <UButton :disabled="algoPage <= 1" @click="algoPage = algoPage - 1" size="sm" variant="ghost">Предыдущая</UButton>
                  <div class="flex items-center gap-1">
                    <template v-for="pageNum in visibleAlgoPages" :key="pageNum">
                      <UButton v-if="pageNum !== '...'" :variant="pageNum === algoPage ? 'solid' : 'ghost'" :color="pageNum === algoPage ? 'primary' : 'neutral'" @click="algoPage = pageNum as number" size="sm">{{ pageNum }}</UButton>
                      <span v-else class="px-2 text-slate-400">...</span>
                    </template>
                  </div>
                  <UButton :disabled="algoPage >= algoTotalPages" @click="algoPage = algoPage + 1" size="sm" variant="ghost">Следующая</UButton>
                  <UButton :disabled="algoPage >= algoTotalPages" @click="algoPage = algoTotalPages" size="sm" variant="ghost">Последняя</UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Слайдовер: раздел -->
        <USlideover v-if="sectionSlideoverOpen" v-model:open="sectionSlideoverOpen" :title="isEditSection ? 'Редактировать раздел' : 'Новый раздел'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="sectionForm" @submit.prevent="onSubmitSection">
              <div class="space-y-3 w-full">
                <UFormField label="Название" required>
                  <UInput v-model="sectionForm.name" placeholder="Название раздела" class="w-full" />
                </UFormField>
                <UFormField label="URL" required>
                  <UInput v-model="sectionForm.url" placeholder="adults, pediatrics, onmp, onmp-children" class="w-full" />
                </UFormField>
                <UFormField label="Описание">
                  <UTextarea v-model="sectionForm.description" placeholder="Описание раздела" class="w-full" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="sectionSlideoverOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingSectionForm" @click="onSubmitSection" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>

        <!-- Слайдовер: категория -->
        <USlideover v-if="catSlideoverOpen" v-model:open="catSlideoverOpen" :title="isEditCategory ? 'Редактировать категорию' : 'Новая категория'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="catForm" @submit.prevent="onSubmitCategory">
              <div class="space-y-3 w-full">
                <UFormField label="Разделы" required>
                  <USelect 
                    v-model="catForm.sections" 
                    :items="sectionsList.map((s: any) => ({ label: s.name, value: s._id }))" 
                    placeholder="Выберите разделы" 
                    multiple 
                    class="w-full" 
                  />
                </UFormField>
                <UFormField label="URL">
                  <UInput v-model="catForm.url" placeholder="url-kategorii (необязательно)" class="w-full" />
                </UFormField>
                <UFormField label="Название" required>
                  <UInput v-model="catForm.name" placeholder="Название категории" class="w-full" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="catSlideoverOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingCatForm" @click="onSubmitCategory" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>

        <!-- Слайдовер: алгоритм -->
        <USlideover v-if="algoSlideoverOpen" v-model:open="algoSlideoverOpen" :title="isEditAlgorithm ? 'Редактировать алгоритм' : 'Новый алгоритм'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="algoForm" @submit.prevent="onSubmitAlgorithm">
              <div class="space-y-3 w-full">
                <UFormField label="Категория" required>
                  <USelect v-model="algoForm.category" :items="cats.map((c: any) => c.name)" placeholder="Выберите категорию" class="w-full" :disabled="cats.length===0" />
                </UFormField>
                <UFormField label="Раздел" required>
                  <USelect v-model="algoForm.section" :items="sectionsList.map((s: any) => ({ label: s.name, value: String(s._id) }))" placeholder="Выберите раздел" class="w-full" />
                </UFormField>
                <UFormField label="Название" required>
                  <UInput v-model="algoForm.title" placeholder="Название алгоритма" class="w-full" />
                </UFormField>
                <UFormField label="Порядок (число)">
                  <UInput v-model="algoForm.order" type="number" placeholder="Напр., 10" class="w-full" />
                </UFormField>
                <UFormField label="Возможные коды диагнозов">
                  <div class="relative" ref="algoMkbDropdownRef">
                    <div class="flex items-center gap-2">
                      <UInput v-model="algoMkbSearch" placeholder="Начните вводить МКБ, станцию, название или диапазон (A00-A02, A00-)" class="flex-1 min-w-[200px]" @keyup.enter.prevent="addAlgoMkbFromInput" @input="onAlgoSearchMKB" />
                      <UButton size="sm" color="primary" variant="soft" @click="addAlgoMkbFromInput" class="shrink-0">Добавить</UButton>
                      <UButton v-if="algoForm.mkb.length" size="sm" color="neutral" variant="soft" @click="clearAlgoMkb" class="shrink-0">
                        <UIcon name="i-heroicons-x-mark" />
                      </UButton>
                    </div>
                    <div v-if="algoMkbDropdownOpen" class="absolute z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl max-h-72 overflow-auto">
                      <ul>
                        <li v-for="item in algoMkbResults" :key="item._id" class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700" @click="onAlgoPickMKB(item)">
                          <div class="flex items-center gap-2">
                            <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-600 dark:text-slate-300">{{ item.mkbCode }}</span>
                            <span class="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-[11px] font-mono text-blue-700 dark:text-blue-300">{{ item.stationCode }}</span>
                          </div>
                          <div class="mt-1 text-slate-800 dark:text-slate-200">{{ item.name }}</div>
                        </li>
                        <li v-if="!algoMkbLoading && algoMkbResults.length === 0" class="px-3 py-2 text-sm text-slate-500">Ничего не найдено</li>
                        <li v-if="algoMkbLoading" class="px-3 py-2 text-sm text-slate-500">Поиск...</li>
                      </ul>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-2">
                      <div v-for="code in algoForm.mkb" :key="code" class="flex items-center gap-1 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">
                        <span class="font-mono">{{ code }}</span>
                        <button type="button" class="cursor-pointer" @click="removeAlgoMkb(code)"><UIcon name="i-heroicons-x-mark" class="w-4 h-4" /></button>
                      </div>
                    </div>
                    <div class="mt-2 text-xs text-slate-500">Примеры: A00-A02 (диапазон), A00- (все коды категории A00.*)</div>
                  </div>
                </UFormField>
                <UFormField label="Алгоритм (Markdown/HTML)">
                  <UTextarea v-model="algoForm.content" :rows="8" placeholder="Поддерживаются HTML и Markdown" class="w-full font-mono" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="algoSlideoverOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingAlgoForm" @click="onSubmitAlgorithm" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h, onMounted } from 'vue'
definePageMeta({ middleware: 'admin' })

const sections = ['Взрослые', 'Детские', 'ОНМП', 'ОНМП Дети']

// Разделы
const sectionSlideoverOpen = ref(false)
const isEditSection = ref(false)
const currentSectionId = ref<string | null>(null)
const sectionForm = reactive({ name: '', url: '', description: '' })
const pendingSectionForm = ref(false)
const pendingSections = ref(false)
const sectionsSearch = ref('')
const sectionsPage = ref(1)
const sectionsPerPage = 100
const sectionsTotal = ref(0)
const showAllSections = ref(false)
const { data: sectionsData, refresh: refreshSections, pending: fetchingSections, error: sectionsError } = await useFetch('/api/algorithms/sections', { server: false })
const sectionsList = computed(() => (sectionsData.value as any)?.items || [])
const filteredSections = computed(() => {
  const all = sectionsList.value
  if (!sectionsSearch.value.trim()) return all
  const q = sectionsSearch.value.trim()
  return all.filter((s: any) => matchesNormalized(q, s.name || ''))
})
const sectionsPaginated = computed(() => {
  const start = (sectionsPage.value - 1) * sectionsPerPage
  const end = start + sectionsPerPage
  return filteredSections.value.slice(start, end)
})
const sectionsTotalPages = computed(() => Math.ceil(filteredSections.value.length / sectionsPerPage))
const sectionsVisible = computed(() => showAllSections.value ? sectionsPaginated.value : filteredSections.value.slice(0, 3))
watch(filteredSections, (n) => { sectionsTotal.value = n.length; if (sectionsPage.value > Math.ceil(n.length / sectionsPerPage)) sectionsPage.value = 1 })
watch(sectionsSearch, () => { sectionsPage.value = 1 })
watch(fetchingSections, v => { pendingSections.value = !!v })
onMounted(() => { refreshSections() })

const sectionsColumns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'url', header: 'URL' },
  { accessorKey: 'description', header: 'Описание' },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('button', {
          class: 'px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded',
          onClick: () => onEditSection(row.original)
        }, 'Редактировать'),
        h('button', {
          class: 'px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded',
          onClick: () => onDeleteSection(row.original)
        }, 'Удалить')
      ])
    }
  }
]

const onAddSection = () => { 
  isEditSection.value = false; 
  currentSectionId.value = null; 
  sectionForm.name = ''; 
  sectionForm.url = ''; 
  sectionForm.description = ''; 
  sectionSlideoverOpen.value = true 
}
const onEditSection = (item: any) => { 
  isEditSection.value = true; 
  currentSectionId.value = item._id; 
  sectionForm.name = item.name || ''; 
  sectionForm.url = item.url || ''; 
  sectionForm.description = item.description || ''; 
  sectionSlideoverOpen.value = true 
}
const onSubmitSection = async () => {
  pendingSectionForm.value = true
  try {
    let res: any
    if (isEditSection.value && currentSectionId.value) {
      res = await $fetch(`/api/algorithms/sections/${currentSectionId.value}`, { method: 'PATCH', body: sectionForm })
    } else {
      res = await $fetch('/api/algorithms/sections', { method: 'POST', body: sectionForm })
    }
    if (res?.success) { await refreshSections(); sectionSlideoverOpen.value = false }
  } finally { pendingSectionForm.value = false }
}
const onDeleteSection = async (item: any) => { 
  if (!confirm('Удалить раздел?')) return; 
  pendingSections.value = true; 
  try { 
    const res:any = await $fetch(`/api/algorithms/sections/${item._id}`, { method: 'DELETE' }); 
    if (res?.success) await refreshSections() 
  } finally { pendingSections.value = false } 
}

// Категории
const catSlideoverOpen = ref(false)
const isEditCategory = ref(false)
const currentCatId = ref<string | null>(null)
const catForm = reactive({ sections: [] as string[], name: '', url: '' })
const pendingCatForm = ref(false)
const pendingCats = ref(false)
const catSearch = ref('')
const catPage = ref(1)
const catPerPage = 100
const showAllCategories = ref(false)
const catsVisible = computed(() => showAllCategories.value ? catPaginated.value : filteredCats.value.slice(0, 3))
const catTotal = ref(0)
const { data: catsData, refresh: refreshCats, pending: fetchingCats, error: catsError } = await useFetch('/api/algorithms/categories', { server: false })
const cats = computed(() => catsData.value?.items || [])
const { matchesNormalized } = useTextNormalization()
const filteredCats = computed(() => {
  const all = cats.value
  if (!catSearch.value.trim()) return all
  const q = catSearch.value.trim()
  return all.filter((c: any) => matchesNormalized(q, c.name || ''))
})
const catPaginated = computed(() => {
  const start = (catPage.value - 1) * catPerPage
  const end = start + catPerPage
  return filteredCats.value.slice(start, end)
})
const catTotalPages = computed(() => Math.ceil(filteredCats.value.length / catPerPage))
watch(filteredCats, (n) => { catTotal.value = n.length; if (catPage.value > Math.ceil(n.length / catPerPage)) catPage.value = 1 })
watch(catSearch, () => { catPage.value = 1 })
watch(fetchingCats, v => { pendingCats.value = !!v })
onMounted(() => { refreshCats() })

const catColumns = [
  { 
    accessorKey: 'sections', 
    header: 'Разделы',
    cell: ({ row }: any) => (row.original.sections || []).map((s: any) => s.name || s).join(', ')
  },
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'url', header: 'URL' },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('button', {
          class: 'px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded',
          onClick: () => onEditCategory(row.original)
        }, 'Редактировать'),
        h('button', {
          class: 'px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded',
          onClick: () => onDeleteCategory(row.original)
        }, 'Удалить')
      ])
    }
  }
]

const onAddCategory = () => { 
  isEditCategory.value = false; 
  currentCatId.value = null; 
  catForm.sections = []; 
  catForm.name = ''; 
  catForm.url = ''; 
  catSlideoverOpen.value = true 
}
const onEditCategory = (item: any) => { 
  isEditCategory.value = true; 
  currentCatId.value = item._id; 
  catForm.sections = (item.sections || []).map((s: any) => s._id || s); 
  catForm.name = item.name || ''; 
  catForm.url = item.url || ''; 
  catSlideoverOpen.value = true 
}
const onSubmitCategory = async () => {
  pendingCatForm.value = true
  try {
    let res: any
    if (isEditCategory.value && currentCatId.value) {
      res = await $fetch(`/api/algorithms/categories/${currentCatId.value}`, { method: 'PATCH', body: catForm })
    } else {
      res = await $fetch('/api/algorithms/categories', { method: 'POST', body: catForm })
    }
    if (res?.success) { await refreshCats(); catSlideoverOpen.value = false }
  } finally { pendingCatForm.value = false }
}
const onDeleteCategory = async (item: any) => { if (!confirm('Удалить категорию?')) return; pendingCats.value = true; try { const res:any = await $fetch(`/api/algorithms/categories/${item._id}`, { method: 'DELETE' }); if (res?.success) await refreshCats() } finally { pendingCats.value = false } }

// Алгоритмы
const algoSlideoverOpen = ref(false)
const isEditAlgorithm = ref(false)
const currentAlgoId = ref<string | null>(null)
const algoForm = reactive({ category: '', section: '', title: '', order: undefined as number | undefined, mkb: [] as string[], content: '' })
const pendingAlgoForm = ref(false)
const pendingAlgos = ref(false)
const algoSearch = ref('')
const algoPage = ref(1)
const algoPerPage = 15
const algoTotal = ref(0)
const algoTotalPages = ref(0)
const visibleAlgoPages = computed(() => {
  const current = algoPage.value, total = algoTotalPages.value, delta = 2
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages:any[] = [1]
  if (current > delta + 3) pages.push('...')
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) pages.push(i)
  if (current < total - delta - 2) pages.push('...')
  if (total > 1) pages.push(total)
  return pages
})

const { data: algosData, refresh: refreshAlgos, pending: fetchingAlgos, error: algosError } = await useFetch('/api/algorithms', { 
  query: computed(() => ({ page: algoPage.value, limit: algoPerPage, search: algoSearch.value })),
  server: false 
})
const algos = computed(() => algosData.value?.items || [])
const algoPaginated = computed(() => algos.value)
watch(algosData, (n) => { if (n) { algoTotal.value = n.total || 0; algoTotalPages.value = n.totalPages || 0 } })
watch(fetchingAlgos, v => { pendingAlgos.value = !!v })
watch(algoPage, () => { refreshAlgos() })
watch(algoSearch, () => { algoPage.value = 1 })
onMounted(() => { refreshAlgos(); refreshMkb() })

const algoColumns = [
  { accessorKey: 'category.name', header: 'Категория' },
  { 
    accessorKey: 'section', 
    header: 'Раздел',
    cell: ({ row }: any) => row.original.section?.name || row.original.section || ''
  },
  { accessorKey: 'title', header: 'Название' },
  { accessorKey: 'mkbCodes', header: 'Коды МКБ', cell: ({ row }: any) => (row.original.mkbCodes || []).join(', ') },
  {
    id: 'actions', 
    header: 'Действия',
    cell: ({ row }: any) => {
      return h('div', { class: 'flex items-center gap-2' }, [
        h('button', {
          class: 'px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded',
          onClick: () => onEditAlgorithm(row.original)
        }, 'Редактировать'),
        h('button', {
          class: 'px-2 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-700 rounded',
          onClick: () => onDeleteAlgorithm(row.original)
        }, 'Удалить')
      ])
    }
  }
]

const onAddAlgorithm = () => { 
  isEditAlgorithm.value = false; 
  currentAlgoId.value = null; 
  algoForm.category = ''; 
  algoForm.section = ''; 
  algoForm.title = ''; 
  algoForm.order = undefined; 
  algoForm.mkb = []; 
  algoForm.content = ''; 
  algoSlideoverOpen.value = true; 
}
const onEditAlgorithm = (item: any) => { 
  isEditAlgorithm.value = true; 
  currentAlgoId.value = item._id; 
  algoForm.category = item.category?.name || ''; 
  algoForm.section = item.section?._id || item.section || ''; 
  algoForm.title = item.title || ''; 
  algoForm.order = item.order ?? undefined; 
  algoForm.mkb = item.mkbCodes || []; 
  algoForm.content = item.content || ''; 
  algoSlideoverOpen.value = true 
}
const onSubmitAlgorithm = async () => {
  pendingAlgoForm.value = true
  try {
    const selectedCategory = cats.value.find((c: any) => c.name === algoForm.category)
    if (!selectedCategory) { alert('Выберите категорию'); return }
    
    const selectedSection = sectionsList.value.find((s: any) => s._id === algoForm.section)
    if (!selectedSection) { alert('Выберите раздел'); return }
    
    const formData: any = { 
      category: selectedCategory._id, 
      section: selectedSection._id, 
      title: algoForm.title, 
      mkbCodes: algoForm.mkb, 
      content: algoForm.content 
    }
    if (algoForm.order !== undefined && algoForm.order !== null && algoForm.order !== ('' as any)) formData.order = Number(algoForm.order)
    let res:any
    if (isEditAlgorithm.value && currentAlgoId.value) res = await $fetch(`/api/algorithms/${currentAlgoId.value}`, { method: 'PATCH', body: formData })
    else res = await $fetch('/api/algorithms', { method: 'POST', body: formData })
    if (res?.success) { await refreshAlgos(); algoSlideoverOpen.value = false }
  } finally { pendingAlgoForm.value = false }
}
const onDeleteAlgorithm = async (item:any) => { if (!confirm('Удалить алгоритм?')) return; pendingAlgos.value = true; try { const res:any = await $fetch(`/api/algorithms/${item._id}`, { method: 'DELETE' }); if (res?.success) await refreshAlgos() } finally { pendingAlgos.value = false } }

// MKB options for select
const mkbOptions = ref<string[]>([])
async function refreshMkb() {
  try {
    const res:any = await $fetch('/api/mkb', { query: { page: 1, limit: 1000 }, server: false })
    mkbOptions.value = (res?.items || []).map((x:any) => `${x.mkbCode}`)
  } catch { mkbOptions.value = [] }
}

// Множественный выбор МКБ как в «Кодировке» у лок. статусов
const algoMkbSearch = ref('')
const algoMkbDropdownOpen = ref(false)
const algoMkbLoading = ref(false)
const algoMkbResults = ref<any[]>([])
const algoMkbDropdownRef = ref<HTMLElement | null>(null)
let algoMkbTimer: any
const onAlgoSearchMKB = () => {
  algoMkbDropdownOpen.value = true
  clearTimeout(algoMkbTimer)
  algoMkbTimer = setTimeout(async () => {
    algoMkbLoading.value = true
    try {
      const query = algoMkbSearch.value.trim()
      // Если введён диапазон или префикс с дефисом — не показываем список, а позволяем добавить как есть
      const isRange = /[\-–]/.test(query)
      if (isRange) {
        algoMkbResults.value = []
      } else {
        const res:any = await $fetch('/api/mkb', { query: { page: 1, limit: 10, search: query }, server: false })
        algoMkbResults.value = res?.items || []
      }
    } finally { algoMkbLoading.value = false }
  }, 300)
}
const onAlgoPickMKB = (item: any) => {
  const code = item.mkbCode
  if (!algoForm.mkb.includes(code)) algoForm.mkb.push(code)
  algoMkbSearch.value = ''
  algoMkbDropdownOpen.value = false
}
const clearAlgoMkb = () => { algoForm.mkb = []; algoMkbSearch.value = ''; algoMkbResults.value = []; algoMkbDropdownOpen.value = false }
const removeAlgoMkb = (code: string) => { algoForm.mkb = algoForm.mkb.filter(c => c !== code) }

// Добавление по Enter или кнопке, включая диапазоны A00-A02 и префиксы A00-
watch(algoMkbSearch, async (val, old) => {
  // Ничего не делаем здесь автоматически
})

function isRangeInput(s: string) {
  return /[\-–]/.test(s.trim())
}

async function expandRangeInput(input: string): Promise<string[]> {
  const s = input.trim().toUpperCase()
  // Префикс вида A00- → спросим бэкенд
  if (/^[A-Z]\d{2}\s*[\-–]\s*$/.test(s)) {
    const prefix = s.replace(/[\s–-]+$/, '')
    const res:any = await $fetch('/api/mkb/expand', { query: { range: prefix + '-' } })
    return res?.mkbCodes || []
  }
  // Диапазон вида A00-A02
  if (/^[A-Z]\d{2}\s*[\-–]\s*[A-Z]?\d{2}$/.test(s)) {
    const res:any = await $fetch('/api/mkb/expand', { query: { range: s } })
    return res?.mkbCodes || []
  }
  return []
}

async function addAlgoMkbFromInput() {
  const q = algoMkbSearch.value.trim()
  if (!q) return
  if (isRangeInput(q)) {
    try {
      const list = await expandRangeInput(q)
      if (list.length) {
        for (const c of list) if (!algoForm.mkb.includes(c)) algoForm.mkb.push(c)
        algoMkbSearch.value = ''
        algoMkbDropdownOpen.value = false
        return
      }
    } catch {}
  }
  // Если не диапазон — ничего не меняем, пусть выбирают из выпадающего списка
}

// Автопроставление порядка для новых алгоритмов
const suggestingOrder = ref(false)
async function suggestNextOrder() {
  if (isEditAlgorithm.value) return
  if (!algoSlideoverOpen.value) return
  if (!algoForm.category || !algoForm.section) return
  // Не перезатираем, если пользователь уже ввёл значение
  if (algoForm.order !== undefined && algoForm.order !== ('' as any)) return
  const selectedCategory = cats.value.find((c: any) => c.name === algoForm.category)
  if (!selectedCategory) return
  try {
    suggestingOrder.value = true
    const res:any = await $fetch('/api/algorithms', { query: { page: 1, limit: 1, category: selectedCategory._id, section: algoForm.section, sortBy: 'order', sortOrder: 'desc' } })
    const last = (res?.items && res.items[0]) ? Number(res.items[0].order || 0) : 0
    algoForm.order = (isFinite(last) ? last : 0) + 1
  } finally {
    suggestingOrder.value = false
  }
}

watch([() => algoForm.category, () => algoForm.section, algoSlideoverOpen, isEditAlgorithm], () => {
  suggestNextOrder()
})
</script>


