<template>
  <!-- Автоматическое перенаправление на /algorithms/adults -->
</template>

<script setup lang="ts">
definePageMeta({ 
  headerTitle: 'Алгоритмы',
  middleware: 'auth',
  layout: 'algorithms'
})

// Автоматическое перенаправление на страницу взрослых алгоритмов
await navigateTo('/algorithms/adults')
</script>

 
