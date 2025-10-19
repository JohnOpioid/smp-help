<template>
  <footer class="relative z-10">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <!-- Левая часть - скелетон копирайта -->
        <div class="flex items-center">
          <USkeleton class="h-4 w-48 bg-slate-200 dark:bg-slate-700" />
        </div>
        
        <!-- Правая часть - скелетон ссылок -->
        <div class="flex items-center gap-4">
          <USkeleton v-for="i in 4" :key="i" class="h-4 w-20 bg-slate-200 dark:bg-slate-700" />
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Пустой компонент скелетона футера
</script>
