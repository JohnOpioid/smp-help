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
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте категории МКБ</p>
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
                    <col style="width: 80px;">
                  </colgroup>
                  <thead>
                    <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                      <th class="text-left p-3 font-medium">Название</th>
                      <th class="text-center p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="cat in categoriesTableData" :key="cat._id" class="border-t border-slate-100 dark:border-slate-700/60">
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="cat.name">{{ cat.name }}</div>
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

        <!-- Таблица МКБ кодов -->
        <div class="mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">МКБ коды</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте МКБ коды</p>
              </div>
              <UButton color="primary" size="sm" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onAddMKB" :disabled="categories.length === 0" title="Новый МКБ код" />
            </div>

            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <UInput 
                v-model="mkbSearchQuery" 
                placeholder="Поиск по коду станции, МКБ коду, названию или примечанию..." 
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
                    <col style="width: 150px;">
                    <col style="width: auto;">
                    <col style="width: 100px;">
                    <col style="width: 100px;">
                    <col style="width: 80px;">
                  </colgroup>
                  <thead>
                    <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                      <th class="text-left p-3 font-medium">Категория</th>
                      <th class="text-left p-3 font-medium">Нозологическая форма</th>
                      <th class="text-left p-3 font-medium whitespace-nowrap">Код станции</th>
                      <th class="text-left p-3 font-medium whitespace-nowrap">Код МКБ-10</th>
                      <th class="text-center p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in mkbPaginated" :key="item._id" class="border-t border-slate-100 dark:border-slate-700/60">
                      <td class="p-3">
                        <div class="text-sm text-muted truncate" :title="item.category?.name || '—'">{{ item.category?.name || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted">{{ item.name }}</div>
                        <div v-if="item.note" class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ item.note }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap font-mono">{{ item.stationCode || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap font-mono">{{ item.mkbCode || '—' }}</div>
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
                                  @click="onEditMKB(item)"
                                >
                                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                                  <span>Редактировать</span>
                                </button>
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                                  @click="onDeleteMKB(item)"
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
              <div v-if="!pendingMKB && mkbPaginated.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
                <div v-if="mkbError" class="text-red-600 dark:text-red-400 mb-2">
                  Ошибка загрузки: {{ mkbError }}
                </div>
                <div v-else>
                  Пока нет МКБ кодов
                </div>
              </div>
              <div v-if="pendingMKB" class="p-6"><USkeleton class="h-6 w-full" /></div>
              <div v-if="!pendingMKB && hasMoreMKB" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="loadMoreMKB"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-down" class="me-1" />
                  Показать еще ({{ mkbTotal - mkbItems.length }})
                </UButton>
              </div>
              <div v-if="!pendingMKB && !hasMoreMKB && mkbItems.length > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="collapseMKB"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-up" class="me-1" />
                  Свернуть все
                </UButton>
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
import { ref, reactive, computed, watch, onMounted } from 'vue'
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
onMounted(() => { 
  refreshCategories() 
})

// МКБ коды
const mkbSlideoverOpen = ref(false)
const isEditMKB = ref(false)
const currentMKBId = ref<string | null>(null)
const mkbForm = reactive({ category: '', stationCode: '', mkbCode: '', name: '', note: '' })
const pendingMKBForm = ref(false)
const pendingMKB = ref(false)

// Пагинация для МКБ кодов
const mkbPage = ref(1)
const mkbPerPage = 10
const mkbTotal = ref(0)
const mkbTotalPages = ref(0)
const mkbSearchQuery = ref('')
const mkbItems = ref<any[]>([])

const { data: mkbData, refresh: refreshMKB, pending: fetchingMKB, error: mkbError } = await useFetch('/api/mkb', {
  query: computed(() => ({
    page: mkbPage.value,
    limit: mkbPerPage,
    search: mkbSearchQuery.value
  })),
  server: false,
  watch: [mkbPage, mkbSearchQuery]
})

watch(mkbData, (newData) => {
  if (newData) {
    const items = (newData as any)?.items || []
    if (mkbPage.value === 1) {
      // Первая страница - заменяем данные
      mkbItems.value = items
    } else {
      // Последующие страницы - добавляем к существующим
      mkbItems.value = [...mkbItems.value, ...items]
    }
    mkbTotal.value = (newData as any).total || 0
    mkbTotalPages.value = (newData as any).totalPages || 0
  }
}, { immediate: true })

const mkbPaginated = computed(() => mkbItems.value)
const hasMoreMKB = computed(() => {
  return mkbItems.value.length < mkbTotal.value
})

const loadMoreMKB = () => {
  if (mkbPage.value < mkbTotalPages.value) {
    mkbPage.value += 1
  }
}

const collapseMKB = () => {
  mkbPage.value = 1
  mkbItems.value = []
}

watch(fetchingMKB, v => { pendingMKB.value = !!v })
watch(mkbSearchQuery, () => { 
  mkbPage.value = 1
  mkbItems.value = [] // Очищаем при новом поиске
})

onMounted(() => { refreshMKB() })

const categoryOptions = computed(() => categories.value.map((c: any) => ({ 
  label: c.name, 
  value: c._id
})))

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


