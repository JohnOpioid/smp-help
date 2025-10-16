<template>
  <div v-if="isPreloading" class="fixed top-0 left-0 right-0 z-50">
    <!-- Прогресс-бар -->
    <div class="h-1 w-full bg-transparent">
      <div 
        class="h-1 bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-300 ease-out"
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
    
    <!-- Отладочная информация (только в dev режиме) -->
    <div v-if="isDev" class="bg-red-100 dark:bg-red-900 px-2 py-1 text-xs text-red-800 dark:text-red-200">
      DEBUG: {{ preloadProgress }}% - {{ preloadMessage }}
    </div>
  </div>
</template>

<script setup lang="ts">
const { isPreloading, preloadProgress, preloadMessage } = usePreloader()
const isDev = process.dev
</script>
