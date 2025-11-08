<template>
  <div>
    <div class="bg-white dark:bg-slate-800 rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Список категорий закладок</p>
      </div>
      <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
        <li
          v-for="(category, index) in categories"
          :key="category.type"
          class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
          :class="{
            'md:border-r md:border-slate-100 dark:md:border-slate-700': index % 2 === 0,
            'md:border-b-0': index >= categories.length - 2 && categories.length % 2 === 0,
            'border-b-0': index === categories.length - 1
          }"
        >
          <NuxtLink :to="category.url" class="block">
            <div class="flex items-stretch gap-3">
              <div class="shrink-0 flex items-center">
                <div :class="['w-12 h-12 rounded-lg flex items-center justify-center', category.iconBg]">
                  <UIcon :name="category.icon" :class="['w-6 h-6 sm:w-8 sm:h-8', category.iconColor]" />
                </div>
              </div>
              <div class="flex-1 min-w-0 flex flex-col justify-center">
                <div class="font-medium text-slate-900 dark:text-white">{{ category.label }}</div>
                <div class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ category.description }}</div>
              </div>
              <div class="shrink-0 flex items-center">
                <span v-if="category.count !== undefined" class="font-mono text-base font-semibold bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded">{{ category.count }}</span>
              </div>
            </div>
          </NuxtLink>
        </li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Закладки', layout: 'profile' })

const bookmarks = ref<any[]>([])
const pending = ref(true)

const categories = computed(() => {
  const allCategories = [
    { 
      type: 'codifier', 
      label: 'Кодификатор', 
      icon: 'i-heroicons-document-text',
      url: '/profile/bookmarks/codifier',
      description: 'Коды МКБ-10 и станций',
      iconBg: 'bg-green-100 dark:bg-green-900',
      iconColor: 'text-green-600 dark:text-green-400'
    },
    { 
      type: 'drug', 
      label: 'Препараты', 
      icon: 'i-lucide-pill',
      url: '/profile/bookmarks/drug',
      description: 'Лекарственные препараты',
      iconBg: 'bg-red-100 dark:bg-red-900',
      iconColor: 'text-red-600 dark:text-red-400'
    },
    { 
      type: 'local-status', 
      label: 'Локальные статусы', 
      icon: 'i-lucide-list-checks',
      url: '/profile/bookmarks/local-status',
      description: 'Локальные статусы пациентов',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900',
      iconColor: 'text-yellow-600 dark:text-yellow-400'
    },
    { 
      type: 'substation', 
      label: 'Подстанции', 
      icon: 'i-lucide-building-2',
      url: '/profile/bookmarks/substation',
      description: 'Подстанции скорой помощи',
      iconBg: 'bg-indigo-100 dark:bg-indigo-900',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    },
    { 
      type: 'calculator', 
      label: 'Калькуляторы', 
      icon: 'i-lucide-calculator',
      url: '/profile/bookmarks/calculator',
      description: 'Медицинские калькуляторы',
      iconBg: 'bg-orange-100 dark:bg-orange-900',
      iconColor: 'text-orange-600 dark:text-orange-400'
    },
    { 
      type: 'classroom', 
      label: 'Учебный класс', 
      icon: 'i-lucide-book-open',
      url: '/profile/bookmarks/classroom',
      description: 'Учебные материалы',
      iconBg: 'bg-teal-100 dark:bg-teal-900',
      iconColor: 'text-teal-600 dark:text-teal-400'
    }
  ]
  
  return allCategories.map(cat => ({
    ...cat,
    count: bookmarks.value.filter(b => b.type === cat.type).length
  }))
})

async function loadBookmarks() {
  try {
    pending.value = true
    const res: any = await $fetch('/api/bookmarks', {
      query: { _t: Date.now() }
    })
    if (res?.success) {
      bookmarks.value = res.items || []
    }
  } catch (err: any) {
    console.error('Ошибка загрузки закладок:', err)
  } finally {
    pending.value = false
  }
}

onMounted(() => {
  loadBookmarks()
  // Слушаем кастомные события обновления закладок
  window.addEventListener('bookmarks-updated', loadBookmarks)
})

onBeforeUnmount(() => {
  window.removeEventListener('bookmarks-updated', loadBookmarks)
})
</script>


