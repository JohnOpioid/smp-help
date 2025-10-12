<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <AdminSubnav title="Локальные статусы" />

        <!-- Таблица категорий -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Категории ({{ categoriesTotal }}) 
            </h3>
            <UButton color="primary" @click="onAddCategory">Добавить категорию</UButton>
          </div>

          <div class="mb-4">
            <UInput 
              v-model="categoriesSearchQuery" 
              placeholder="Поиск по названию категории..." 
              size="lg"
              class="w-full"
              :input-class="'px-4 py-3'"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg overflow-hidden">
            <UTable :data="categoriesTableData" :columns="categoryColumns" :loading="pendingCategories" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">
                  <div v-if="categoriesError" class="text-red-600 dark:text-red-400 mb-2">
                    Ошибка загрузки: {{ categoriesError }}
                  </div>
                  <div v-else-if="pendingCategories">
                    <div class="space-y-3">
                      <USkeleton class="h-5 w-1/3" />
                      <USkeleton class="h-5 w-1/2" />
                      <USkeleton class="h-5 w-2/3" />
                    </div>
                  </div>
                  <div v-else-if="!pendingCategories && categories.length === 0">
                    Нет данных. Добавьте категорию.
                  </div>
                </div>
              </template>
            </UTable>
            <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
              <UButton 
                v-if="filteredCategories.length > 3" 
                variant="soft" 
                color="gray" 
                @click="showAllCategories = !showAllCategories"
                class="cursor-pointer"
              >
                <UIcon :name="showAllCategories ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="me-1" />
                {{ showAllCategories ? 'Свернуть' : `Показать все (${filteredCategories.length})` }}
              </UButton>
            </div>
            <div v-if="showAllCategories && categoriesTotalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <UPagination 
                :page="categoriesPage" 
                :total="categoriesTotalPages" 
                :page-size="1"
                :max-visible="10"
                show-last
                show-first
                @update:page="categoriesPage = $event"
              />
            </div>
          </div>
        </div>

        <!-- Таблица локальных статусов -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Локальные статусы ({{ lsTotal }})</h3>
            <UButton color="primary" @click="onAddLocalStatus" :disabled="categories.length === 0">Добавить статус</UButton>
          </div>

          <div class="mb-4">
            <UInput 
              v-model="lsSearchQuery" 
              placeholder="Поиск по коду станции, коду, названию или примечанию..." 
              size="lg"
              class="w-full"
              :input-class="'px-4 py-3'"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg overflow-hidden">
            <UTable :data="lsPaginated" :columns="lsColumns" :loading="pendingLS" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">
                  <div v-if="lsError" class="text-red-600 dark:text-red-400 mb-2">
                    Ошибка загрузки: {{ lsError }}
                  </div>
                  <div v-else-if="pendingLS">
                    <div class="space-y-3">
                      <USkeleton class="h-5 w-1/3" />
                      <USkeleton class="h-5 w-1/2" />
                      <USkeleton class="h-5 w-2/3" />
                    </div>
                  </div>
                  <div v-else-if="!pendingLS && lsItems.length === 0">
                    Нет данных. Добавьте статус.
                  </div>
                </div>
              </template>
            </UTable>
            <div v-if="lsTotalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <div class="flex items-center justify-between">
                <div class="text-sm text-slate-600 dark:text-slate-400">
                  Страница {{ lsPage }} из {{ lsTotalPages }} ({{ lsTotal }} записей)
                </div>
                <div class="flex items-center gap-2">
                  <UButton :disabled="lsPage <= 1" @click="lsPage = 1" size="sm" variant="ghost">Первая</UButton>
                  <UButton :disabled="lsPage <= 1" @click="lsPage = lsPage - 1" size="sm" variant="ghost">Предыдущая</UButton>
                  <div class="flex items-center gap-1">
                    <template v-for="pageNum in visiblePages" :key="pageNum">
                      <UButton v-if="pageNum !== '...'" :variant="pageNum === lsPage ? 'solid' : 'ghost'" :color="pageNum === lsPage ? 'primary' : 'gray'" @click="lsPage = pageNum as number" size="sm">
                        {{ pageNum }}
                      </UButton>
                      <span v-else class="px-2 text-slate-400">...</span>
                    </template>
                  </div>
                  <UButton :disabled="lsPage >= lsTotalPages" @click="lsPage = lsPage + 1" size="sm" variant="ghost">Следующая</UButton>
                  <UButton :disabled="lsPage >= lsTotalPages" @click="lsPage = lsTotalPages" size="sm" variant="ghost">Последняя</UButton>
                </div>
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
                      <UButton v-if="lsForm.code || lsForm.stationCode" size="sm" color="gray" variant="soft" @click="clearCoding" class="shrink-0">
                        <UIcon name="i-heroicons-x-mark" />
                      </UButton>
                    </div>
                    <div v-if="mkbDropdownOpen" class="absolute z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl max-h-72 overflow-auto">
                      <ul>
                        <li 
                          v-for="item in mkbResults" :key="item._id" 
                          class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
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
definePageMeta({ middleware: 'admin' })

// Категории
const categorySlideoverOpen = ref(false)
const isEditCategory = ref(false)
const currentCategoryId = ref<string | null>(null)
const categoryForm = reactive({ name: '' })
const pendingCategory = ref(false)
const pendingCategories = ref(false)

const categoriesSearchQuery = ref('')
const categoriesPage = ref(1)
const categoriesPerPage = 15
const categoriesTotal = ref(0)

const { data: categoriesData, refresh: refreshCategories, pending: fetchingCategories, error: categoriesError } = await useFetch('/api/local-statuses', { server: false })
const categories = computed(() => categoriesData.value?.items || [])

const { matchesNormalized } = useTextNormalization()
const filteredCategories = computed(() => {
  const all = categories.value
  if (!categoriesSearchQuery.value.trim()) return all
  const q = categoriesSearchQuery.value.trim()
  return all.filter((c: any) => matchesNormalized(q, c.name || ''))
})

const categoriesPaginated = computed(() => {
  const start = (categoriesPage.value - 1) * categoriesPerPage
  const end = start + categoriesPerPage
  return filteredCategories.value.slice(start, end)
})
const showAllCategories = ref(false)
const categoriesTableData = computed(() => {
  if (showAllCategories.value) return categoriesPaginated.value
  return filteredCategories.value.slice(0, 3)
})
const categoriesTotalPages = computed(() => Math.ceil(filteredCategories.value.length / categoriesPerPage))

watch(filteredCategories, (n) => {
  categoriesTotal.value = n.length
  if (categoriesPage.value > Math.ceil(n.length / categoriesPerPage)) categoriesPage.value = 1
})
watch(categoriesSearchQuery, () => { categoriesPage.value = 1 })
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
const lsForm = reactive({ category: '', stationCode: '', code: '', mkbCode: '', name: '', note: '', complaints: '', anamnesis: '', localis: '', description: '' })
const pendingLSForm = ref(false)
const pendingLS = ref(false)

const lsPage = ref(1)
const lsPerPage = 15
const lsTotal = ref(0)
const lsTotalPages = ref(0)
const lsSearchQuery = ref('')

const { data: lsData, refresh: refreshLS, pending: fetchingLS, error: lsError } = await useFetch('/api/local-statuses/all', {
  query: computed(() => ({ page: lsPage.value, limit: lsPerPage, search: lsSearchQuery.value })),
  server: false
})
const lsItems = computed(() => lsData.value?.items || [])
const lsPaginated = computed(() => lsItems.value)

watch(lsData, (n) => { if (n) { lsTotal.value = n.total || 0; lsTotalPages.value = n.totalPages || 0 } })
watch(fetchingLS, v => { pendingLS.value = !!v })
watch(lsPage, () => { refreshLS() })
watch(lsSearchQuery, () => { lsPage.value = 1 })
onMounted(() => { refreshLS() })

const visiblePages = computed(() => {
  const current = lsPage.value
  const total = lsTotalPages.value
  const delta = 2
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: any[] = [1]
  if (current > delta + 3) pages.push('...')
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) pages.push(i)
  if (current < total - delta - 2) pages.push('...')
  if (total > 1) pages.push(total)
  return pages
})

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


