<template>
  <div class="px-4 max-w-5xl mx-auto">
    <!-- Скелетон хлебных крошек -->
    <div class="flex items-center space-x-2">
      <!-- Скелетон для "Главная" -->
      <USkeleton class="h-4 w-16 bg-slate-200 dark:bg-slate-700" />
      
      <!-- Скелетон для разделителя -->
      <div class="text-slate-300 dark:text-slate-600">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </div>
      
      <!-- Скелетон для текущей страницы -->
      <USkeleton class="h-4 w-24 bg-slate-200 dark:bg-slate-700" />
    </div>
    
    <!-- Скелетон кнопки "Назад" только на мобильных -->
    <div class="mt-4 md:hidden">
      <USkeleton class="h-10 w-20 rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Пустой компонент скелетона breadcrumbs
</script>
