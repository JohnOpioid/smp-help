<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">

        <!-- Таблица категорий -->
        <div class="mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Категории</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте категории локальных статусов</p>
              </div>
              <UButton color="primary" size="sm" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onAddCategory" title="Новая категория" />
            </div>

            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <UInput 
                v-model="categoriesSearchQuery" 
                placeholder="Поиск по названию категории..." 
                size="lg"
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-heroicons-magnifying-glass" />
                </template>
              </UInput>
            </div>

            <div class="relative">
              <div class="overflow-x-auto">
                <table class="w-full table-fixed min-w-[600px]">
                  <colgroup>
                    <col style="width: auto;">
                    <col style="width: 150px;">
                    <col style="width: 80px;">
                  </colgroup>
                  <thead>
                    <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                      <th class="text-left p-3 font-medium">Название</th>
                      <th class="text-left p-3 font-medium whitespace-nowrap">URL</th>
                      <th class="text-center p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cat in categoriesTableData" :key="cat._id" class="border-t border-slate-100 dark:border-slate-700/60">
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="cat.name">{{ cat.name }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="`/${cat.url}`">/{{ cat.url }}</div>
                      </td>
                      <td class="p-3 text-center whitespace-nowrap">
                        <UPopover :content="{ side: 'bottom', align: 'end', sideOffset: 8 }">
                          <button
                            type="button"
                            class="rounded-md p-2 size-9 inline-flex items-center justify-center text-default text-slate-500 dark:text-slate-400 hover:bg-elevated focus:outline-none cursor-pointer"
                            title="Действия"
                          >
                            <UIcon name="i-heroicons-ellipsis-vertical" class="w-5 h-5" />
                          </button>
                          <template #content>
                            <div class="w-56">
                              <nav class="py-1">
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  @click="onEditCategory(cat)"
                                >
                                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                                  <span>Редактировать</span>
                                </button>
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                                  @click="onDeleteCategory(cat)"
                                >
                                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                                  <span>Удалить</span>
                                </button>
                              </nav>
                            </div>
                          </template>
                        </UPopover>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="!pendingCategories && categoriesTableData.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
                <div v-if="categoriesError" class="text-red-600 dark:text-red-400 mb-2">
                  Ошибка загрузки: {{ categoriesError }}
                </div>
                <div v-else>
                  Пока нет категорий
                </div>
              </div>
              <div v-if="pendingCategories" class="p-6"><USkeleton class="h-6 w-full" /></div>
              <div v-if="!pendingCategories && hasMoreCategories" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="categoriesShown += 10"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-down" class="me-1" />
                  Показать еще ({{ filteredCategories.length - categoriesShown }})
                </UButton>
              </div>
              <div v-if="!pendingCategories && !hasMoreCategories && categoriesShown > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="categoriesShown = 10"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-up" class="me-1" />
                  Свернуть все
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Таблица локальных статусов -->
        <div class="mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Локальные статусы</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте локальные статусы</p>
              </div>
              <UButton color="primary" size="sm" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onAddLocalStatus" :disabled="categories.length === 0" title="Новый статус" />
            </div>

            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <UInput 
                v-model="lsSearchQuery" 
                placeholder="Поиск по коду станции, коду, названию или примечанию..." 
                size="lg"
                class="w-full"
              >
                <template #leading>
                  <UIcon name="i-heroicons-magnifying-glass" />
                </template>
              </UInput>
            </div>

            <div class="relative">
              <div class="overflow-x-auto">
                <table class="w-full table-fixed min-w-[800px]">
                  <colgroup>
                    <col style="width: 200px;">
                    <col style="width: 100px;">
                    <col style="width: auto;">
                    <col style="width: 80px;">
                  </colgroup>
                  <thead>
                    <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                      <th class="text-left p-3 font-medium">Категория</th>
                      <th class="text-left p-3 font-medium whitespace-nowrap">Код</th>
                      <th class="text-left p-3 font-medium">Название</th>
                      <th class="text-center p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in lsPaginated" :key="item._id" class="border-t border-slate-100 dark:border-slate-700/60">
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="item.category?.name || '—'">{{ item.category?.name || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap font-mono">{{ item.code || item.stationCode || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="item.name">{{ item.name }}</div>
                        <div v-if="item.note" class="text-sm text-muted whitespace-nowrap truncate mt-1" :title="item.note">{{ item.note }}</div>
                      </td>
                      <td class="p-3 text-center whitespace-nowrap">
                        <UPopover :content="{ side: 'bottom', align: 'end', sideOffset: 8 }">
                          <button
                            type="button"
                            class="rounded-md p-2 size-9 inline-flex items-center justify-center text-default text-slate-500 dark:text-slate-400 hover:bg-elevated focus:outline-none cursor-pointer"
                            title="Действия"
                          >
                            <UIcon name="i-heroicons-ellipsis-vertical" class="w-5 h-5" />
                          </button>
                          <template #content>
                            <div class="w-56">
                              <nav class="py-1">
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                                  @click="onEditLS(item)"
                                >
                                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                                  <span>Редактировать</span>
                                </button>
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                                  @click="onDeleteLS(item)"
                                >
                                  <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                                  <span>Удалить</span>
                                </button>
                              </nav>
                            </div>
                          </template>
                        </UPopover>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div v-if="!pendingLS && lsPaginated.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
                <div v-if="lsError" class="text-red-600 dark:text-red-400 mb-2">
                  Ошибка загрузки: {{ lsError }}
                </div>
                <div v-else>
                  Пока нет статусов
                </div>
              </div>
              <div v-if="pendingLS" class="p-6"><USkeleton class="h-6 w-full" /></div>
              <div v-if="!pendingLS && hasMoreLS" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="loadMoreLS"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-down" class="me-1" />
                  Показать еще ({{ lsTotal - lsItems.length }})
                </UButton>
              </div>
              <div v-if="!pendingLS && !hasMoreLS && lsItems.length > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="collapseLS"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-up" class="me-1" />
                  Свернуть все
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Слайдовер: категория -->
        <USlideover v-if="categorySlideoverOpen" v-model:open="categorySlideoverOpen" :title="isEditCategory ? 'Редактировать категорию' : 'Новая категория'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="categoryForm" @submit.prevent="onSubmitCategory">
              <div class="space-y-3 w-full">
                <UFormField label="Название" required class="w-full">
                  <UInput v-model="categoryForm.name" placeholder="Например: Статусы диспетчеризации" class="w-full" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="categorySlideoverOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingCategory" @click="onSubmitCategory" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>

        <!-- Слайдовер: Локальный статус -->
        <USlideover v-if="lsSlideoverOpen" v-model:open="lsSlideoverOpen" :title="isEditLS ? 'Редактировать статус' : 'Новый статус'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="lsForm" @submit.prevent="onSubmitLS">
              <div class="space-y-3 w-full">
                <UFormField label="Категория" required class="w-full">
                  <USelect v-model="lsForm.category" :items="categories.map(c => c.name)" placeholder="Выберите категорию" class="w-full" :disabled="categories.length === 0" />
                </UFormField>
                <UFormField label="Кодировка" class="w-full">
                  <div class="relative" ref="mkbDropdownRef">
                    <div class="flex gap-2">
                      <UInput v-model="mkbSearch" placeholder="Начните вводить МКБ, станцию или название" class="w-full" @input="onSearchMKB" />
                      <UButton v-if="lsForm.code || lsForm.stationCode" size="sm" color="neutral" variant="soft" @click="clearCoding" class="shrink-0">
                        <UIcon name="i-heroicons-x-mark" />
                      </UButton>
                    </div>
                    <div v-if="mkbDropdownOpen" class="absolute z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl max-h-72 overflow-auto">
                      <ul>
                        <li 
                          v-for="item in mkbResults" :key="item._id" 
                          class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                          @click="onPickMKB(item)"
                        >
                          <div class="flex items-center gap-2">
                            <span class="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[11px] font-mono text-slate-600 dark:text-slate-300">{{ item.mkbCode }}</span>
                            <span class="bg-blue-100 dark:bg-blue-900 px-1.5 py-0.5 rounded text-[11px] font-mono text-blue-700 dark:text-blue-300">{{ item.stationCode }}</span>
                          </div>
                          <div class="mt-1 text-slate-800 dark:text-slate-200">{{ item.name }}</div>
                        </li>
                        <li v-if="!mkbLoading && mkbResults.length === 0" class="px-3 py-2 text-sm text-slate-500">Ничего не найдено</li>
                        <li v-if="mkbLoading" class="px-3 py-2 text-sm text-slate-500">Поиск...</li>
                      </ul>
                    </div>
                    <p v-if="lsForm.code || lsForm.stationCode" class="text-xs text-slate-500 mt-1">
                      Выбрано: {{ lsForm.mkbCode || lsForm.code }} / {{ lsForm.stationCode }} — {{ lsForm.name }}
                    </p>
                  </div>
                </UFormField>
                <UFormField label="Название" required class="w-full">
                  <UInput v-model="lsForm.name" placeholder="Название статуса" class="w-full" />
                </UFormField>
                <UFormField label="Примечание" class="w-full">
                  <UInput v-model="lsForm.note" placeholder="Дополнительная информация" class="w-full" />
                </UFormField>
                <UFormField label="Жалобы (Markdown)" class="w-full">
                  <textarea
                    v-model="lsForm.complaints"
                    class="w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-2 py-4 text-sm gap-1.5 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    placeholder="Поддерживается Markdown"
                    rows="4"
                    style="overflow:auto; resize:vertical;"
                  />
                </UFormField>
                <UFormField label="Анамнез (Markdown)" class="w-full">
                  <textarea
                    v-model="lsForm.anamnesis"
                    class="w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-2 py-4 text-sm gap-1.5 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    placeholder="Поддерживается Markdown"
                    rows="4"
                    style="overflow:auto; resize:vertical;"
                  />
                </UFormField>
                <UFormField label="Status localis (Markdown)" class="w-full">
                  <textarea
                    v-model="lsForm.localis"
                    class="w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-2 py-4 text-sm gap-1.5 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    placeholder="Поддерживается Markdown"
                    rows="4"
                    style="overflow:auto; resize:vertical;"
                  />
                </UFormField>
                <UFormField label="Описание (Markdown)" class="w-full">
                  <textarea
                    ref="lsDescRef"
                    v-model="lsForm.description"
                    class="w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-2 py-4 text-sm gap-1.5 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    placeholder="Поддерживается Markdown"
                    rows="5"
                    @input="resizeLsTextarea"
                    style="overflow:hidden; resize:none;"
                  />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="lsSlideoverOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingLSForm" @click="onSubmitLS" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, h, resolveComponent, watch, onMounted, onUnmounted } from 'vue'
definePageMeta({ middleware: 'admin', layout: 'admin' })

// Категории
const categorySlideoverOpen = ref(false)
const isEditCategory = ref(false)
const currentCategoryId = ref<string | null>(null)
const categoryForm = reactive({ name: '' })
const pendingCategory = ref(false)
const pendingCategories = ref(false)

const categoriesSearchQuery = ref('')
const categoriesTotal = ref(0)
const categoriesShown = ref(10)

const { data: categoriesData, refresh: refreshCategories, pending: fetchingCategories, error: categoriesError } = await useFetch('/api/local-statuses', { server: false })
const categories = computed(() => categoriesData.value?.items || [])

const { matchesNormalized } = useTextNormalization()
const filteredCategories = computed(() => {
  const all = categories.value
  if (!categoriesSearchQuery.value.trim()) return all
  const q = categoriesSearchQuery.value.trim()
  return all.filter((c: any) => matchesNormalized(q, c.name || ''))
})

const categoriesTableData = computed(() => {
  return filteredCategories.value.slice(0, categoriesShown.value)
})
const hasMoreCategories = computed(() => {
  return filteredCategories.value.length > categoriesShown.value
})

watch(filteredCategories, (n) => {
  categoriesTotal.value = n.length
  categoriesShown.value = 10 // Сбрасываем при изменении фильтра
})
watch(categoriesSearchQuery, () => { categoriesShown.value = 10 })
watch(fetchingCategories, v => { pendingCategories.value = !!v })
onMounted(() => { refreshCategories() })

const categoryColumns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'url', header: 'URL' },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => h('div', { class: 'flex items-center gap-2' }, [
      h(resolveComponent('UButton') as any, { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEditCategory(row.original) }, { default: () => 'Редактировать' }),
      h(resolveComponent('UButton') as any, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDeleteCategory(row.original) }, { default: () => 'Удалить' })
    ])
  }
]

const onAddCategory = () => { isEditCategory.value = false; currentCategoryId.value = null; categoryForm.name = ''; categorySlideoverOpen.value = true }
const onEditCategory = (item: any) => { isEditCategory.value = true; currentCategoryId.value = item._id; categoryForm.name = item.name; categorySlideoverOpen.value = true }
const onSubmitCategory = async () => {
  pendingCategory.value = true
  try {
    let res: any
    if (isEditCategory.value && currentCategoryId.value) {
      res = await $fetch(`/api/local-statuses/${currentCategoryId.value}`, { method: 'PATCH', body: categoryForm })
    } else {
      res = await $fetch('/api/local-statuses', { method: 'POST', body: categoryForm })
    }
    if (res?.success) { 
      await refreshCategories(); 
      categorySlideoverOpen.value = false 
    } else {
      console.error('Ошибка создания категории:', res)
      alert(res?.message || 'Не удалось создать категорию')
    }
  } finally { pendingCategory.value = false }
}
const onDeleteCategory = async (item: any) => {
  if (!confirm('Удалить категорию?')) return
  pendingCategories.value = true
  try { const res: any = await $fetch(`/api/local-statuses/${item._id}`, { method: 'DELETE' }); if (res?.success) await refreshCategories() } finally { pendingCategories.value = false }
}

// Локальные статусы
const lsSlideoverOpen = ref(false)
const isEditLS = ref(false)
const currentLSId = ref<string | null>(null)
const lsForm = reactive<{
  category: string
  stationCode: string
  code: string
  mkbCode: string
  name: string
  note: string
  complaints: string
  anamnesis: string
  localis: string
  description: string
}>({ category: '', stationCode: '', code: '', mkbCode: '', name: '', note: '', complaints: '', anamnesis: '', localis: '', description: '' })
const pendingLSForm = ref(false)
const pendingLS = ref(false)

const lsPage = ref(1)
const lsPerPage = 10
const lsTotal = ref(0)
const lsTotalPages = ref(0)
const lsSearchQuery = ref('')
const lsItems = ref<any[]>([])

const { data: lsData, refresh: refreshLS, pending: fetchingLS, error: lsError } = await useFetch('/api/local-statuses/all', {
  query: computed(() => ({ page: lsPage.value, limit: lsPerPage, search: lsSearchQuery.value })),
  server: false,
  watch: [lsPage, lsSearchQuery]
})

watch(lsData, (newData) => {
  if (newData) {
    const items = (newData as any)?.items || []
    if (lsPage.value === 1) {
      // Первая страница - заменяем данные
      lsItems.value = items
    } else {
      // Последующие страницы - добавляем к существующим
      lsItems.value = [...lsItems.value, ...items]
    }
    lsTotal.value = (newData as any).total || 0
    lsTotalPages.value = (newData as any).totalPages || 0
  }
}, { immediate: true })

const lsPaginated = computed(() => lsItems.value)
const hasMoreLS = computed(() => {
  return lsItems.value.length < lsTotal.value
})

const loadMoreLS = () => {
  if (lsPage.value < lsTotalPages.value) {
    lsPage.value += 1
  }
}

const collapseLS = () => {
  lsPage.value = 1
  lsItems.value = []
}

watch(fetchingLS, v => { pendingLS.value = !!v })
watch(lsSearchQuery, () => { 
  lsPage.value = 1
  lsItems.value = [] // Очищаем при новом поиске
})
onMounted(() => { refreshLS() })

// Поиск по МКБ для поля "Кодировка"
const mkbSearch = ref('')
const mkbDropdownOpen = ref(false)
const mkbLoading = ref(false)
const mkbResults = ref<any[]>([])
const mkbDropdownRef = ref<HTMLElement | null>(null)
let mkbTimer: any
const onSearchMKB = () => {
  mkbDropdownOpen.value = true
  clearTimeout(mkbTimer)
  mkbTimer = setTimeout(async () => {
    mkbLoading.value = true
    try {
      const res: any = await $fetch('/api/mkb', { query: { page: 1, limit: 10, search: mkbSearch.value }, server: false })
      mkbResults.value = res?.items || []
    } finally { mkbLoading.value = false }
  }, 300)
}
const onPickMKB = (item: any) => {
  lsForm.stationCode = item.stationCode
  lsForm.code = item.mkbCode
  lsForm.mkbCode = item.mkbCode
  // Не заполняем автоматически поле name
  mkbSearch.value = `${item.mkbCode} / ${item.stationCode} — ${item.name}`
  mkbDropdownOpen.value = false
}

const clearCoding = () => {
  lsForm.stationCode = ''
  lsForm.code = ''
  lsForm.mkbCode = ''
  mkbSearch.value = ''
  mkbResults.value = []
  mkbDropdownOpen.value = false
}

// Обработчик клика вне выпадающего списка
const handleClickOutside = (event: MouseEvent) => {
  if (mkbDropdownRef.value && !mkbDropdownRef.value.contains(event.target as Node)) {
    mkbDropdownOpen.value = false
  }
}

// Добавляем и удаляем обработчик при монтировании/размонтировании
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

const lsColumns = [
  { accessorKey: 'category.name', header: 'Категория' },
  { accessorKey: 'code', header: 'Код' },
  {
    id: 'name',
    header: 'Название',
    cell: ({ row }: any) => h('div', { class: 'w-full max-w-none truncate' }, row.original.name)
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => h('div', { class: 'flex items-center gap-2' }, [
      h(resolveComponent('UButton') as any, { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEditLS(row.original) }, { default: () => 'Редактировать' }),
      h(resolveComponent('UButton') as any, { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDeleteLS(row.original) }, { default: () => 'Удалить' })
    ])
  }
]

const resetLsForm = () => {
  lsForm.category = ''
  lsForm.stationCode = ''
  lsForm.code = ''
  lsForm.mkbCode = ''
  lsForm.name = ''
  lsForm.note = ''
  lsForm.description = ''
  mkbSearch.value = ''
  mkbResults.value = []
  mkbDropdownOpen.value = false
}
const onAddLocalStatus = () => { 
  isEditLS.value = false
  currentLSId.value = null
  resetLsForm()
  lsSlideoverOpen.value = true 
}
const onEditLS = (item: any) => { isEditLS.value = true; currentLSId.value = item._id; lsForm.category = item.category?.name || ''; lsForm.stationCode = item.stationCode; lsForm.code = item.code; lsForm.mkbCode = item.mkbCode || ''; lsForm.name = item.name; lsForm.note = item.note || ''; lsForm.complaints = item.complaints || ''; lsForm.anamnesis = item.anamnesis || ''; lsForm.localis = item.localis || ''; lsForm.description = item.description || ''; lsSlideoverOpen.value = true }
const onSubmitLS = async () => {
  pendingLSForm.value = true
  try {
    const selectedCategory = categories.value.find((c: any) => c.name === lsForm.category)
    if (!selectedCategory) { alert('Выберите категорию'); return }
    const formData = { ...lsForm, category: selectedCategory._id }
    let res: any
    if (isEditLS.value && currentLSId.value) {
      res = await $fetch(`/api/local-statuses/items/${currentLSId.value}`, { method: 'PATCH', body: formData })
    } else {
      res = await $fetch('/api/local-statuses/items', { method: 'POST', body: formData })
    }
    if (res?.success) { await refreshLS(); resetLsForm(); lsSlideoverOpen.value = false }
  } finally { pendingLSForm.value = false }
}

// Авто-изменение высоты textarea
const lsDescRef = ref<HTMLTextAreaElement | null>(null)
const resizeLsTextarea = () => {
  const el = lsDescRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
onMounted(() => resizeLsTextarea())
watch(() => lsForm.description, () => resizeLsTextarea())
watch(lsSlideoverOpen, (open) => { if (!open) resetLsForm() })
const onDeleteLS = async (item: any) => {
  if (!confirm('Удалить статус?')) return
  pendingLS.value = true
  try { const res: any = await $fetch(`/api/local-statuses/items/${item._id}`, { method: 'DELETE' }); if (res?.success) await refreshLS() } finally { pendingLS.value = false }
}
</script>


