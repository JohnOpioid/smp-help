<template>
  <div v-if="isMounted && !isOnline" class="fixed top-0 left-0 right-0 bg-orange-500 text-white text-center py-2 z-50 offline-indicator">
    <div class="flex items-center justify-center gap-2">
      <Icon name="heroicons:wifi" class="w-4 h-4" />
      <span class="text-sm font-medium">Работа в офлайн режиме</span>
    </div>
  </div>
</template>

<script setup lang="ts">
const { isOnline } = useNetworkStatus()
const isMounted = ref(false)

onMounted(() => {
  isMounted.value = true
})
</script>
