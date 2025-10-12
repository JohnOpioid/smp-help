<template>
  <div :class="containerClass">
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <div class="flex-1 flex flex-col min-h-0">
      <div v-if="showBreadcrumbs" class="pt-6">
        <Breadcrumbs v-if="!isInitialLoading" />
        <BreadcrumbsSkeleton v-else />
      </div>

      <!-- Навигация по профилю (вне всех блоков) -->
       <div v-if="!isInitialLoading" class="px-4 max-w-5xl mx-auto pt-8 w-full">
         <nav class="flex space-x-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1 w-full justify-start items-start text-left overflow-x-auto hide-scrollbar">
          <NuxtLink to="/profile" class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
            exact-active-class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
            inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <UIcon name="i-heroicons-calendar-days" class="w-4 h-4 mr-2" />
            Смены
          </NuxtLink>
          <NuxtLink to="/profile/bookmarks"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
            exact-active-class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
            inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <UIcon name="i-heroicons-bookmark" class="w-4 h-4 mr-2" />
            Закладки
          </NuxtLink>
          <NuxtLink to="/profile/settings"
            class="flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap"
            exact-active-class="bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm"
            inactive-class="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">
            <UIcon name="i-heroicons-cog-6-tooth" class="w-4 h-4 mr-2" />
            Настройки
          </NuxtLink>
        </nav>
      </div>

      <!-- Скелетон контента при навигации -->
      <div v-if="isContentLoading" class="px-4 max-w-5xl mx-auto py-8 space-y-4">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-4 w-2/3" />
        <div class="space-y-2">
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
          <USkeleton class="h-20 w-full" />
        </div>
      </div>

      <!-- Основной контент -->
      <div v-else>
        <div class="md:px-4 max-w-5xl mx-auto py-8">
          <!-- Контент страницы -->
          <Suspense>
            <template #default>
              <slot />
            </template>
            <template #fallback>
              <div class="space-y-4">
                <USkeleton class="h-6 w-1/3" />
                <USkeleton class="h-4 w-2/3" />
                <div class="space-y-2">
                  <USkeleton class="h-20 w-full" />
                  <USkeleton class="h-20 w-full" />
                  <USkeleton class="h-20 w-full" />
                </div>
              </div>
            </template>
          </Suspense>
        </div>
      </div>

    </div>

    <!-- Футер сайта -->
    <AppFooter v-if="!isInitialLoading" />
    <AppFooterSkeleton v-else />

    <MobileNav v-if="!isInitialLoading" />

    <!-- Панель поиска с чат-ботом -->
    <BottomSearchPanel :is-open="isBottomSearchOpen" @close="closeBottomSearch" />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const headerTitle = computed(() => (route.meta as any)?.headerTitle || 'Профиль')

// Получаем состояния загрузки из app.vue через provide/inject
const isInitialLoading = inject('isInitialLoading', ref(false))
const isContentLoading = inject('isContentLoading', ref(false))

// Состояние панели поиска с чат-ботом
const isBottomSearchOpen = ref(false)

const closeBottomSearch = () => {
  isBottomSearchOpen.value = false
}

// Слушаем события от SearchBar для открытия панели поиска
onMounted(() => {
  const handleOpenBottomSearch = () => {
    isBottomSearchOpen.value = true
  }

  window.addEventListener('openBottomSearch', handleOpenBottomSearch)

  onUnmounted(() => {
    window.removeEventListener('openBottomSearch', handleOpenBottomSearch)
  })
})

// Динамический класс контейнера
const containerClass = computed(() => {
  return 'flex flex-col min-h-screen'
})

const showBreadcrumbs = computed(() => true)
</script>
