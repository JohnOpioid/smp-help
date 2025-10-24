<template>
  <div class="mascot-container">
    <img 
      src="/mascot.png" 
      alt="Амби" 
      class="w-6 h-6 object-contain"
      :class="mascotClass"
    />
  </div>
</template>

<script setup lang="ts">
interface Props {
  isActive?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const props = withDefaults(defineProps<Props>(), {
  isActive: false,
  size: 'md'
})

const mascotClass = computed(() => {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8', 
    lg: 'w-10 h-10'
  }
  
  return [
    sizeClasses[props.size],
    'object-contain',
    'transition-all',
    'duration-300',
    'ease-in-out',
    props.isActive ? 'animate-pulse' : ''
  ]
})
</script>

<style scoped>
.mascot-container {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Анимация для активного состояния */
@keyframes mascot-bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

.animate-pulse {
  animation: mascot-bounce 1s ease-in-out infinite;
}
</style>
