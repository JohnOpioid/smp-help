<template>
  <div class="px-2 md:px-2 md:px-4 max-w-5xl mx-auto py-8">

    <!-- Список категорий (как в кодификаторе) -->
    <div class="bg-white dark:bg-slate-800 rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Список категорий алгоритмов</p>
      </div>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
        <li v-for="(cat, index) in filteredCategories" :key="cat._id"
            class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
            :class="{ 
              'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < filteredCategories.length - 1) || (index === filteredCategories.length - 1 && filteredCategories.length % 2 === 1),
              'md:border-b-0': index >= filteredCategories.length - 2 && filteredCategories.length % 2 === 0,
              'border-b-0': index === filteredCategories.length - 1
            }"
            @click="openCategory(cat)">
          <div class="flex items-start justify-between gap-2">
            <div>
              <p class="text-slate-900 dark:text-white font-medium">{{ cat.name }}</p>
              <p v-if="loadingCounts" class="mt-1">
                <USkeleton class="h-3 w-24" />
              </p>
              <p v-else class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ getAlgorithmCount(cat) }} алгоритмов</p>
            </div>
            <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </div>

          <div v-if="activeCategoryUrl === cat.url" class="mt-2">
            <div v-if="loadingAlgos" class="text-xs text-slate-500">Загрузка...</div>
            <div v-else-if="algosByCategory.length === 0" class="text-xs text-slate-500">Нет алгоритмов</div>
            <ul v-else class="mt-1 space-y-1">
              <li v-for="a in algosByCategory" :key="a._id">
                <NuxtLink :to="`/algorithms/${sectionToSlug(activeSection)}/${activeCategoryUrl}/${a._id}`" class="text-sm text-primary hover:underline cursor-pointer">{{ a.title }}</NuxtLink>
              </li>
            </ul>
          </div>
        </li>

        <li v-if="filteredCategories.length === 0" class="p-6 border-b-0">
          <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет данных</p>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const route = useRoute()
const slug = route.params.section as string
const activeSection = ref<'Взрослые' | 'Детские' | 'ОНМП'>(
  slug === 'adults' ? 'Взрослые' : slug === 'pediatrics' ? 'Детские' : slug === 'onmp' ? 'ОНМП' : 'Детские'
)

function sectionToSlug(s: string) {
  if (s === 'Взрослые') return 'adults'
  if (s === 'Детские') return 'pediatrics'
  if (s === 'ОНМП') return 'onmp'
  if (s === 'ОНМП Дети') return 'onmp-children'
  return 'adults'
}
function goSection(s: 'Взрослые'|'Детские'|'ОНМП') {
  activeSection.value = s
  navigateTo(`/algorithms/${sectionToSlug(s)}`)
}
function openCategory(cat: any) {
  activeCategoryUrl.value = cat.url
  navigateTo(`/algorithms/${sectionToSlug(activeSection.value)}/${cat.url}`)
}

// Категории
const { data: catsData } = await useFetch('/api/algorithms/categories', { server: false })
const cats = computed(() => (catsData.value?.items || []))
const filteredCategories = computed(() => (cats.value as any[]).filter(c => {
  const sections = c.sections || []
  // Проверяем, есть ли в разделах категории нужный раздел по названию
  return sections.some((section: any) => section.name === activeSection.value)
}))

// Лениво подгружаем алгоритмы выбранной категории
const activeCategoryUrl = ref<string>('')
const loadingAlgos = ref(false)
const algosByCategory = ref<any[]>([])
const algorithmCounts = ref<Record<string, number>>({})
const loadingCounts = ref(false)

// Функция для получения количества алгоритмов в категории
const getAlgorithmCount = (cat: any) => {
  return algorithmCounts.value[cat._id] || 0
}

// Загружаем количество алгоритмов для каждой категории (оптимизированно)
const loadAlgorithmCounts = async () => {
  loadingCounts.value = true
  
  // Загружаем все алгоритмы сразу с большим лимитом
  try {
    const res: any = await $fetch('/api/algorithms', { 
      query: { 
        page: 1, 
        limit: 1000, // Увеличиваем лимит
        section: sectionToSlug(activeSection.value)
      }
    })
    
    // Подсчитываем количество алгоритмов для каждой категории
    const counts: Record<string, number> = {}
    if (res?.items) {
      res.items.forEach((algo: any) => {
        const catId = algo.category?._id
        if (catId) {
          counts[catId] = (counts[catId] || 0) + 1
        }
      })
    }
    
    algorithmCounts.value = counts
  } catch (error) {
    console.error('Ошибка загрузки счетчиков:', error)
    // Устанавливаем 0 для всех категорий
    filteredCategories.value.forEach(cat => {
      algorithmCounts.value[cat._id] = 0
    })
  }
  
  loadingCounts.value = false
}

// Загружаем счетчики при изменении категорий
watch(filteredCategories, loadAlgorithmCounts, { immediate: true })

watch(activeCategoryUrl, async (url) => {
  algosByCategory.value = []
  if (!url) return
  loadingAlgos.value = true
  try {
    // Сначала получаем категорию по URL
    const categoryRes: any = await $fetch(`/api/algorithms/categories/by-url/${url}`)
    if (categoryRes?.success && categoryRes.item) {
      // Затем получаем алгоритмы по ID категории
      const res: any = await $fetch('/api/algorithms', { 
        query: { 
          page: 1, 
          limit: 50, 
          category: categoryRes.item._id, 
          section: sectionToSlug(activeSection.value),
          sortBy: 'createdAt', 
          sortOrder: 'asc' 
        }
      })
      algosByCategory.value = res?.items || []
    }
  } finally {
    loadingAlgos.value = false
  }
})

// В списке подкатегории добавим переход на просмотр с query section
function openAlgoFromIndex(id: string) {
  if (!activeCategoryUrl.value) return
  navigateTo(`/algorithms/${sectionToSlug(activeSection.value)}/${activeCategoryUrl.value}/${id}`)
}

// Поиск перенесен в лейаут algorithms.vue
</script>


