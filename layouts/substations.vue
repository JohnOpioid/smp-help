<template>
  <UApp>
    <div class="absolute inset-0 top-16 flex overflow-hidden">
        <aside class="w-full sm:w-[380px] h-[calc(100vh-4rem-4rem)] sm:h-full sm:border-r border-slate-200 dark:border-slate-700 overflow-y-auto custom-scroll pt-0">
          <slot name="sidebar" />
        </aside>
        <main class="flex-1 hidden sm:flex overflow-hidden">
          <slot />
        </main>
      </div>
      
      <!-- Глобальный индикатор предзагрузки -->
      <PreloadIndicator />
  </UApp>
</template>

<script setup lang="ts">
import PreloadIndicator from '~/components/PreloadIndicator.vue'

// Лайаут под список и карту

// Настраиваем автоматическую предзагрузку
onMounted(() => {
  const { setupAutoPreload } = useAutoPreload()
  setupAutoPreload()
})
</script>


