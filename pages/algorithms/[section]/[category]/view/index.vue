<template>
  <div class="max-w-5xl mx-auto px-4">

    <div class="flex items-center justify-between mb-4">
      <div>
        <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ category?.name || 'Алгоритмы' }}</h1>
        <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {{ mappedSection }} •
          <span v-if="pending">Загрузка…</span>
          <span v-else>{{ total }} алгоритмов</span>
        </p>
      </div>

      <NuxtLink
        :to="`/algorithms/${sectionSlug}`"
        class="inline-flex items-center px-3 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200"
      >
        <UIcon name="i-heroicons-arrow-uturn-left" class="w-4 h-4 mr-2" />
        К категориям
      </NuxtLink>
    </div>

    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p class="text-sm text-slate-600 dark:text-slate-300">Список алгоритмов</p>
          <div class="flex items-center gap-2">
            <UInput v-model="query" placeholder="Поиск по названию" size="sm" icon="i-heroicons-magnifying-glass-20-solid" />
            <USelect v-model="sort" :options="sortOptions" size="sm" />
          </div>
        </div>
      </div>

      <!-- Скелеты на время загрузки -->
      <div v-if="pending" class="p-4 space-y-3">
        <USkeleton class="h-4 w-2/3" />
        <USkeleton class="h-4 w-3/4" />
        <USkeleton class="h-4 w-1/2" />
        <USkeleton class="h-4 w-5/6" />
      </div>

      <ul v-else class="divide-y divide-slate-100 dark:divide-slate-700">
        <li v-for="algo in paginated" :key="algo._id" class="p-4">
          <NuxtLink :to="`${algo._id}`" class="text-sm text-primary hover:underline cursor-pointer">
            {{ algo.title }}
          </NuxtLink>
        </li>

        <li v-if="!pending && filtered.length === 0" class="p-8 text-center">
          <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных</p>
        </li>
      </ul>

      <!-- Пагинация -->
      <div v-if="!pending && totalFilteredPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
        <UPagination v-model="page" :page-count="perPage" :total="filtered.length" size="sm" />
      </div>
    </div>
  </div>
  
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

type Category = { _id: string; name: string; url: string }
type Algo = { _id: string; title: string }

const route = useRoute()
const sectionSlug = computed(() => route.params.section as string)
const categoryUrl = computed(() => route.params.category as string)

const mapSectionSlugToRu = (s?: string): 'Взрослые' | 'Детские' | 'ОНМП' => {
  if (s === 'adults') return 'Взрослые'
  if (s === 'pediatrics') return 'Детские'
  if (s === 'onmp') return 'ОНМП'
  return 'Взрослые'
}
const mappedSection = computed(() => mapSectionSlugToRu(sectionSlug.value))

const category = ref<Category | null>(null)
const sortOptions = [
  { label: 'По названию (А→Я)', value: 'title-asc' },
  { label: 'По названию (Я→А)', value: 'title-desc' },
  { label: 'Сначала новые', value: 'createdAt-desc' },
  { label: 'Сначала старые', value: 'createdAt-asc' }
]
const sort = ref<'title-asc' | 'title-desc' | 'createdAt-asc' | 'createdAt-desc'>('title-asc')
const query = ref('')
const page = ref(1)
const perPage = 20

const sortBy = computed(() => (sort.value.split('-')[0]))
const sortOrder = computed(() => (sort.value.split('-')[1] === 'desc' ? 'desc' : 'asc'))

// Загружаем категорию по URL
const { data: categoryData } = await useFetch<any>(() => `/api/algorithms/categories/by-url/${categoryUrl.value}`, { server: false })
watchEffect(() => { category.value = (categoryData.value as any)?.item || null })

// Загружаем список алгоритмов категории с учетом сортировки
const { data: listData, pending } = await useFetch<any>('/api/algorithms', {
  query: computed(() => ({
    page: 1,
    limit: 500,
    category: category.value?._id,
    section: mappedSection.value,
    sortBy: sortBy.value,
    sortOrder: sortOrder.value
  })),
  server: false
})

const rawItems = computed<Algo[]>(() => (listData.value?.items || []) as Algo[])
const total = computed(() => Number(listData.value?.total || rawItems.value.length || 0))

// Клиентский фильтр по названию
const filtered = computed<Algo[]>(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return rawItems.value
  return rawItems.value.filter(a => (a.title || '').toLowerCase().includes(q))
})

// Пагинация по отфильтрованным
const totalFilteredPages = computed(() => Math.ceil(filtered.value.length / perPage))
watch([filtered], () => { page.value = 1 })
const paginated = computed<Algo[]>(() => {
  const start = (page.value - 1) * perPage
  return filtered.value.slice(start, start + perPage)
})

watch([sectionSlug, categoryUrl], () => {
  // при смене маршрута сбрасываем состояние
  query.value = ''
  sort.value = 'title-asc'
  page.value = 1
})
</script>


