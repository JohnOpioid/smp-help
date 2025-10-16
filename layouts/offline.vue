<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
    <div class="max-w-5xl w-full mx-auto px-4">
      <slot />
    </div>
    
    <!-- Глобальный индикатор предзагрузки -->
    <PreloadIndicator />
  </div>
</template>

<script setup lang="ts">
// Специальный лайаут для страницы offline без шапки и футера

// Настраиваем автоматическую предзагрузку
onMounted(() => {
  const { setupAutoPreload } = useAutoPreload()
  setupAutoPreload()
})
</script>
