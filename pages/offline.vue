<template>
  <OfflinePage />
</template>

<script setup lang="ts">
// Устанавливаем мета-теги для офлайн страницы
useHead({
  title: 'Офлайн режим - Справочник СМП',
  meta: [
    { name: 'description', content: 'Приложение работает в офлайн режиме' },
    { name: 'robots', content: 'noindex, nofollow' }
  ]
})
</script>
