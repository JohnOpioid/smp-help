<template>
  <div class="mobile-layout min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Мобильный заголовок -->
    <header v-if="showBackButton" class="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-between px-4 py-3">
        <button 
          @click="$router.back()"
          class="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <UIcon name="i-heroicons-arrow-left" class="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white truncate">
          {{ title || 'Справочник СМП' }}
        </h1>
        
        <div class="w-10"></div> <!-- Spacer for centering -->
      </div>
    </header>

    <!-- Основной контент -->
    <main class="flex-1">
      <slot />
    </main>

    <!-- Мобильная навигация -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div class="flex items-center justify-around py-2">
        <NuxtLink 
          to="/" 
          class="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          :class="{ 'text-blue-600 dark:text-blue-400': $route.path === '/' }"
        >
          <UIcon name="i-heroicons-home" class="w-6 h-6" />
          <span class="text-xs mt-1">Главная</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/algorithms" 
          class="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          :class="{ 'text-blue-600 dark:text-blue-400': $route.path.startsWith('/algorithms') }"
        >
          <UIcon name="i-heroicons-document-text" class="w-6 h-6" />
          <span class="text-xs mt-1">Алгоритмы</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/calculators" 
          class="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          :class="{ 'text-blue-600 dark:text-blue-400': $route.path.startsWith('/calculators') }"
        >
          <UIcon name="i-heroicons-calculator" class="w-6 h-6" />
          <span class="text-xs mt-1">Калькуляторы</span>
        </NuxtLink>
        
        <NuxtLink 
          to="/profile" 
          class="flex flex-col items-center p-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
          :class="{ 'text-blue-600 dark:text-blue-400': $route.path.startsWith('/profile') }"
        >
          <UIcon name="i-heroicons-user" class="w-6 h-6" />
          <span class="text-xs mt-1">Профиль</span>
        </NuxtLink>
      </div>
    </nav>

    <!-- Отступ снизу для навигации -->
    <div class="h-16"></div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  showBackButton?: boolean
  title?: string
}

withDefaults(defineProps<Props>(), {
  showBackButton: true,
  title: ''
})
</script>

<style scoped>
.mobile-layout {
  /* Дополнительные стили для мобильного лейаута */
}
</style>
