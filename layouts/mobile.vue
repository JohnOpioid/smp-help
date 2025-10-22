<template>
  <div class="mobile-layout">
    <!-- Мобильная шапка -->
    <MobileHeader 
      :show-back-button="showBackButton"
    />
    
    <!-- Основной контент -->
    <main 
      class="mobile-main"
      :style="{ 
        paddingBottom: bottomNavHeight + 'px'
      }"
    >
      <slot />
    </main>
    
    <!-- Мобильная нижняя навигация -->
    <MobileBottomNav />
  </div>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

// Props
defineProps<{
  showBackButton?: boolean
}>()

// Состояние
const headerHeight = ref(88) // 56px + 32px отступ
const bottomNavHeight = ref(76) // 60px + 16px отступ

// Определяем, находимся ли в мобильном приложении
const isMobileApp = computed(() => {
  return process.client && Capacitor.isNativePlatform()
})

// Обновляем высоты при изменении размера экрана
onMounted(() => {
  if (process.client) {
    const updateHeights = () => {
      // Высота шапки: статус-бар + контент шапки
      const statusBarHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--status-bar-height') || '24')
      headerHeight.value = statusBarHeight + 56
      
      // Высота нижней навигации: контент + безопасная зона
      const safeAreaBottom = parseInt(getComputedStyle(document.documentElement).getPropertyValue('env(safe-area-inset-bottom)') || '0')
      bottomNavHeight.value = 60 + safeAreaBottom + 16
    }
    
    updateHeights()
    window.addEventListener('resize', updateHeights)
    
    onUnmounted(() => {
      window.removeEventListener('resize', updateHeights)
    })
  }
})
</script>

<style scoped>
.mobile-layout {
  min-height: 100vh;
  background: #f9fafb;
  /* Оптимизация производительности */
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}

.dark .mobile-layout {
  background: #111827;
}

.mobile-main {
  min-height: calc(100vh - var(--bottom-nav-height, 76px));
  padding: 16px;
  transition: padding 0.3s ease;
  /* Добавляем отступ сверху для шапки */
  margin-top: calc(56px + env(safe-area-inset-top));
  /* Оптимизация прокрутки */
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior: contain;
}

/* Анимации переходов */
.mobile-main {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* Адаптивность */
@media (max-width: 480px) {
  .mobile-main {
    padding: 12px;
  }
}

/* Для устройств с вырезами */
@supports (padding: max(0px)) {
  .mobile-main {
    padding-left: max(16px, env(safe-area-inset-left));
    padding-right: max(16px, env(safe-area-inset-right));
  }
}

/* Оптимизация для мобильных устройств */
@media (max-width: 768px) {
  .mobile-layout {
    /* Предотвращаем горизонтальную прокрутку */
    overflow-x: hidden;
  }
  
  .mobile-main {
    /* Оптимизация текста */
    text-rendering: optimizeSpeed;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}
</style>
