<template>
  <div v-if="isPreloading" class="fixed top-0 left-0 right-0 z-[9999]">
    <!-- Прогресс-бар -->
    <div class="h-2 w-full bg-slate-200 dark:bg-slate-700 shadow-lg">
      <div 
        class="h-2 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500 ease-out shadow-sm"
        :style="{ width: `${preloadProgress}%` }"
      />
    </div>
    
    <!-- Сообщение о загрузке (опционально) -->
    <div v-if="preloadMessage" class="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-2">
      <div class="flex items-center justify-center">
        <div class="flex items-center space-x-2">
          <div class="animate-spin rounded-full h-4 w-4 border-2 border-indigo-500 border-t-transparent"></div>
          <span class="text-sm text-slate-600 dark:text-slate-300">{{ preloadMessage }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Используем глобальные refs напрямую
import { isPreloading, preloadProgress, preloadMessage } from '~/composables/usePreloader'

// Принудительно обновляем компонент при изменении состояния
watch([isPreloading, preloadProgress, preloadMessage], () => {
  // Компонент обновляется автоматически
}, { immediate: true })
</script>
