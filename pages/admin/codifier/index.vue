<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">

        <!-- Таблица категорий -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">
              Категории ({{ categoriesTotal }}) 
            </h3>
            <UButton color="primary" @click="onAddCategory">Добавить категорию</UButton>
          </div>

          <!-- Поиск по категориям -->
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

          <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
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
                  <div v-else>
                    Загрузка...
                  </div>
                </div>
              </template>
            </UTable>
            <div class="px-4 py-3 border-t border-slate-100 dark:border-slate-600 flex items-center justify-center">
              <UButton 
                v-if="filteredCategories.length > 3" 
                variant="soft" 
                color="neutral" 
                @click="showAllCategories = !showAllCategories"
                class="cursor-pointer"
              >
                <UIcon :name="showAllCategories ? 'i-heroicons-chevron-up' : 'i-heroicons-chevron-down'" class="me-1" />
                {{ showAllCategories ? 'Свернуть' : `Показать все (${filteredCategories.length})` }}
              </UButton>
            </div>
            <!-- Пагинация для категорий (когда раскрыто) -->
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

        <!-- Таблица МКБ кодов -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">МКБ коды ({{ mkbTotal }})</h3>
            <UButton color="primary" @click="onAddMKB" :disabled="categories.length === 0">Добавить МКБ код</UButton>
          </div>

          <!-- Поиск по МКБ кодам -->
          <div class="mb-4">
            <UInput 
              v-model="mkbSearchQuery" 
              placeholder="Поиск по коду станции, МКБ коду, названию или примечанию..." 
              size="lg"
              class="w-full"
              :input-class="'px-4 py-3'"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
            <UTable :data="mkbPaginated" :columns="mkbColumns" :loading="pendingMKB" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">
                  <div v-if="mkbError" class="text-red-600 dark:text-red-400 mb-2">
                    Ошибка загрузки: {{ mkbError }}
                  </div>
                  <div v-else-if="!pendingMKB && mkbItems.length === 0">
                    Нет данных. Добавьте МКБ код.
                  </div>
                  <div v-else>
                    Загрузка...
                  </div>
                </div>
              </template>
            </UTable>
            
            <!-- Кастомная пагинация для МКБ кодов -->
            <div v-if="mkbTotalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <div class="flex items-center justify-between">
                <div class="text-sm text-slate-600 dark:text-slate-400">
                  Страница {{ mkbPage }} из {{ mkbTotalPages }} ({{ mkbTotal }} записей)
                </div>
                <div class="flex items-center gap-2">
                  <UButton 
                    :disabled="mkbPage <= 1" 
                    @click="mkbPage = 1"
                    size="sm"
                    variant="ghost"
                  >
                    Первая
                  </UButton>
                  <UButton 
                    :disabled="mkbPage <= 1" 
                    @click="mkbPage = mkbPage - 1"
                    size="sm"
                    variant="ghost"
                  >
                    Предыдущая
                  </UButton>
                  
                  <!-- Номера страниц -->
                  <div class="flex items-center gap-1">
                    <template v-for="pageNum in visiblePages" :key="pageNum">
                      <UButton 
                        v-if="pageNum !== '...'"
                        :variant="pageNum === mkbPage ? 'solid' : 'ghost'"
                        :color="pageNum === mkbPage ? 'primary' : 'neutral'"
                        @click="mkbPage = pageNum as number"
                        size="sm"
                      >
                        {{ pageNum }}
                      </UButton>
                      <span v-else class="px-2 text-slate-400">...</span>
                    </template>
                  </div>
                  
                  <UButton 
                    :disabled="mkbPage >= mkbTotalPages" 
                    @click="mkbPage = mkbPage + 1"
                    size="sm"
                    variant="ghost"
                  >
                    Следующая
                  </UButton>
                  <UButton 
                    :disabled="mkbPage >= mkbTotalPages" 
                    @click="mkbPage = mkbTotalPages"
                    size="sm"
                    variant="ghost"
                  >
                    Последняя
                  </UButton>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Слайдовер для категории -->
        <USlideover 
          v-if="categorySlideoverOpen"
          v-model:open="categorySlideoverOpen" 
          :title="isEditCategory ? 'Редактировать категорию' : 'Новая категория'"
          side="right"
          description="Заполните поля и сохраните"
          :ui="{ overlay: 'bg-slate-700/50' }"
        >
          <template #body>
            <UForm :state="categoryForm" @submit.prevent="onSubmitCategory">
              <div class="space-y-3 w-full">
                <UFormField label="Название" required class="w-full">
                  <UInput v-model="categoryForm.name" placeholder="Например: Сердечно-сосудистые заболевания" class="w-full" />
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

        <!-- Слайдовер для МКБ кода -->
        <USlideover 
          v-if="mkbSlideoverOpen"
          v-model:open="mkbSlideoverOpen" 
          :title="isEditMKB ? 'Редактировать МКБ код' : 'Новый МКБ код'"
          side="right"
          description="Заполните поля и сохраните"
          :ui="{ overlay: 'bg-slate-700/50' }"
        >
          <template #body>
            <UForm :state="mkbForm" @submit.prevent="onSubmitMKB">
              <div class="space-y-3 w-full">
                <UFormField label="Категория" required class="w-full">
                  <USelect 
                    v-model="mkbForm.category" 
                    :items="categories.map(c => c.name)" 
                    placeholder="Выберите категорию" 
                    class="w-full"
                    :disabled="categories.length === 0"
                  />
                  <template v-if="categories.length === 0" #hint>
                    <span class="text-xs text-slate-500 dark:text-slate-400">Сначала добавьте категории ({{ categoryOptions.length }} опций)</span>
                  </template>
                  <template v-else #hint>
                    <span class="text-xs text-slate-500 dark:text-slate-400">Доступно {{ categoryOptions.length }} категорий</span>
                  </template>
                </UFormField>
                <UFormField label="Код станции" required class="w-full">
                  <UInput v-model="mkbForm.stationCode" placeholder="Например: 001" class="w-full" />
                </UFormField>
                <UFormField label="Код МКБ-10" required class="w-full">
                  <UInput v-model="mkbForm.mkbCode" placeholder="Например: I25.9" class="w-full" />
                </UFormField>
                <UFormField label="Нозологическая форма" required class="w-full">
                  <UInput v-model="mkbForm.name" placeholder="Название заболевания" class="w-full" />
                </UFormField>
                <UFormField label="Примечание" class="w-full">
                  <UInput v-model="mkbForm.note" placeholder="Дополнительная информация" class="w-full" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="mkbSlideoverOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingMKBForm" @click="onSubmitMKB" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, h, resolveComponent, onMounted } from 'vue'
definePageMeta({ middleware: 'admin', layout: 'admin' })

// Категории
const categorySlideoverOpen = ref(false)
const isEditCategory = ref(false)
const currentCategoryId = ref<string | null>(null)
const categoryForm = reactive({ name: '' })
const pendingCategory = ref(false)
const pendingCategories = ref(false)

// Поиск
const categoriesSearchQuery = ref('')
const mkbSearchQuery = ref('')

// Пагинация для категорий
const categoriesPage = ref(1)
const categoriesPerPage = 15
const categoriesTotal = ref(0)

const { data: categoriesData, refresh: refreshCategories, pending: fetchingCategories, error: categoriesError } = await useFetch('/api/categories', { server: false })
const categories = computed(() => categoriesData.value?.items || [])

// Фильтрация категорий по поиску
const { matchesNormalized } = useTextNormalization()
const filteredCategories = computed(() => {
  const allCategories = categories.value
  if (!categoriesSearchQuery.value.trim()) return allCategories
  
  const query = categoriesSearchQuery.value.trim()
  return allCategories.filter((category: any) => 
    matchesNormalized(query, category.name || '')
  )
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

watch(filteredCategories, (newCategories) => {
  categoriesTotal.value = newCategories.length
  // Сбрасываем на первую страницу при изменении поиска
  if (categoriesPage.value > Math.ceil(newCategories.length / categoriesPerPage)) {
    categoriesPage.value = 1
  }
})

// Сбрасываем страницу при изменении поиска категорий
watch(categoriesSearchQuery, () => {
  categoriesPage.value = 1
})

watch(fetchingCategories, v => { pendingCategories.value = !!v })
onMounted(() => { 
  console.log('Mounted, refreshing categories')
  refreshCategories() 
})

const categoryColumns = [
  {
    accessorKey: 'name',
    header: 'Название'
  },
  {
    accessorKey: 'url',
    header: 'URL'
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => h(
      'div',
      { class: 'flex items-center gap-2' },
      [
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEditCategory(row.original) },
          { default: () => 'Редактировать' }
        ),
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDeleteCategory(row.original) },
          { default: () => 'Удалить' }
        )
      ]
    )
  }
]

// МКБ коды
const mkbSlideoverOpen = ref(false)
const isEditMKB = ref(false)
const currentMKBId = ref<string | null>(null)
const mkbForm = reactive({ category: '', stationCode: '', mkbCode: '', name: '', note: '' })
const pendingMKBForm = ref(false)
const pendingMKB = ref(false)

// Пагинация для МКБ кодов
const mkbPage = ref(1)
const mkbPerPage = 15
const mkbTotal = ref(0)
const mkbTotalPages = ref(0)

// Computed для видимых страниц
const visiblePages = computed(() => {
  const current = mkbPage.value
  const total = mkbTotalPages.value
  const delta = 2 // количество страниц с каждой стороны от текущей
  
  if (total <= 7) {
    // Если страниц мало, показываем все
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  const pages = []
  
  // Всегда показываем первую страницу
  pages.push(1)
  
  if (current > delta + 3) {
    pages.push('...')
  }
  
  // Показываем страницы вокруг текущей
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    pages.push(i)
  }
  
  if (current < total - delta - 2) {
    pages.push('...')
  }
  
  // Всегда показываем последнюю страницу
  if (total > 1) {
    pages.push(total)
  }
  
  return pages
})

const { data: mkbData, refresh: refreshMKB, pending: fetchingMKB, error: mkbError } = await useFetch('/api/mkb', {
  query: computed(() => ({
    page: mkbPage.value,
    limit: mkbPerPage,
    search: mkbSearchQuery.value
  })),
  server: false
})

const mkbItems = computed(() => (mkbData.value as any)?.items || [])
const mkbPaginated = computed(() => mkbItems.value)

watch(mkbData, (newData) => {
  if (newData) {
    mkbTotal.value = (newData as any).total || 0
    mkbTotalPages.value = (newData as any).totalPages || 0
  }
})

watch(fetchingMKB, v => { pendingMKB.value = !!v })

// Обновляем данные при изменении страницы
watch(mkbPage, () => {
  refreshMKB()
})

// Сбрасываем страницу при изменении поиска МКБ
watch(mkbSearchQuery, () => {
  mkbPage.value = 1
})

onMounted(() => { refreshMKB() })

const categoryOptions = computed(() => categories.value.map((c: any) => ({ 
  label: c.name, 
  value: c._id
})))

const mkbColumns = [
  {
    accessorKey: 'category.name',
    header: 'Категория'
  },
  {
    accessorKey: 'stationCode',
    header: 'Код станции'
  },
  {
    accessorKey: 'mkbCode',
    header: 'Код МКБ-10'
  },
  {
    accessorKey: 'name',
    header: 'Нозологическая форма'
  },
  {
    accessorKey: 'note',
    header: 'Примечание'
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => h(
      'div',
      { class: 'flex items-center gap-2' },
      [
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEditMKB(row.original) },
          { default: () => 'Редактировать' }
        ),
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDeleteMKB(row.original) },
          { default: () => 'Удалить' }
        )
      ]
    )
  }
]

// Функции для категорий
const onAddCategory = () => {
  isEditCategory.value = false
  currentCategoryId.value = null
  categoryForm.name = ''
  categorySlideoverOpen.value = true
}

const onEditCategory = (item: any) => {
  isEditCategory.value = true
  currentCategoryId.value = item._id
  categoryForm.name = item.name
  categorySlideoverOpen.value = true
}

const onSubmitCategory = async () => {
  pendingCategory.value = true
  try {
    let res: any
    if (isEditCategory.value && currentCategoryId.value) {
      res = await $fetch(`/api/categories/${currentCategoryId.value}`, { method: 'PATCH', body: categoryForm })
    } else {
      res = await $fetch('/api/categories', { method: 'POST', body: categoryForm })
    }
    if (res?.success) {
      await refreshCategories()
      categorySlideoverOpen.value = false
    }
  } finally {
    pendingCategory.value = false
  }
}

const onDeleteCategory = async (item: any) => {
  if (!confirm('Удалить категорию?')) return
  pendingCategories.value = true
  try {
    const res: any = await $fetch(`/api/categories/${item._id}`, { method: 'PATCH' })
    if (res?.success) await refreshCategories()
  } finally {
    pendingCategories.value = false
  }
}

// Функции для МКБ кодов
const onAddMKB = () => {
  isEditMKB.value = false
  currentMKBId.value = null
  mkbForm.category = ''
  mkbForm.stationCode = ''
  mkbForm.mkbCode = ''
  mkbForm.name = ''
  mkbForm.note = ''
  mkbSlideoverOpen.value = true
}

const onEditMKB = (item: any) => {
  isEditMKB.value = true
  currentMKBId.value = item._id
  mkbForm.category = item.category?.name || ''
  mkbForm.stationCode = item.stationCode
  mkbForm.mkbCode = item.mkbCode
  mkbForm.name = item.name
  mkbForm.note = item.note || ''
  mkbSlideoverOpen.value = true
}

const onSubmitMKB = async () => {
  pendingMKBForm.value = true
  try {
    // Найти ID категории по названию
    const selectedCategory = categories.value.find(c => c.name === mkbForm.category)
    if (!selectedCategory) {
      alert('Выберите категорию')
      return
    }
    
    const formData = {
      ...mkbForm,
      category: selectedCategory._id
    }
    
    let res: any
    if (isEditMKB.value && currentMKBId.value) {
      res = await $fetch(`/api/mkb/${currentMKBId.value}`, { method: 'PATCH', body: formData })
    } else {
      res = await $fetch('/api/mkb', { method: 'POST', body: formData })
    }
    if (res?.success) {
      await refreshMKB()
      mkbSlideoverOpen.value = false
    }
  } finally {
    pendingMKBForm.value = false
  }
}

const onDeleteMKB = async (item: any) => {
  if (!confirm('Удалить МКБ код?')) return
  pendingMKB.value = true
  try {
    const res: any = await $fetch(`/api/mkb/${item._id}`, { method: 'PATCH' })
    if (res?.success) await refreshMKB()
  } finally {
    pendingMKB.value = false
  }
}
</script>


