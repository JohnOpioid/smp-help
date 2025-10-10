<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Приложения</h2>
      <p class="text-slate-600 dark:text-slate-300">Заглушка страницы раздела "Приложения".</p>
    </div>
  </div>

</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Приложения' })
</script>



