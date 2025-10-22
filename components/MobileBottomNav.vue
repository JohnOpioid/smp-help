<template>
  <nav class="mobile-bottom-nav">
    <div class="nav-content">
      <!-- Главная -->
      <NuxtLink 
        to="/" 
        class="nav-item"
        :class="{ active: $route.path === '/' }"
      >
        <Icon name="heroicons:home" class="nav-icon" />
        <span class="nav-label">Главная</span>
      </NuxtLink>
      
      <!-- Алгоритмы -->
      <NuxtLink 
        to="/algorithms" 
        class="nav-item"
        :class="{ active: $route.path.startsWith('/algorithms') }"
      >
        <Icon name="heroicons:document-text" class="nav-icon" />
        <span class="nav-label">Алгоритмы</span>
      </NuxtLink>
      
      <!-- Калькуляторы -->
      <NuxtLink 
        to="/calculators" 
        class="nav-item"
        :class="{ active: $route.path.startsWith('/calculators') }"
      >
        <Icon name="heroicons:calculator" class="nav-icon" />
        <span class="nav-label">Калькуляторы</span>
      </NuxtLink>
      
      <!-- Поиск -->
      <button 
        @click="openSearch"
        class="nav-item nav-search"
        :class="{ active: isSearchOpen }"
      >
        <Icon name="heroicons:magnifying-glass" class="nav-icon" />
        <span class="nav-label">Поиск</span>
      </button>
      
      <!-- Профиль -->
      <NuxtLink 
        to="/profile" 
        class="nav-item"
        :class="{ active: $route.path.startsWith('/profile') }"
      >
        <Icon name="heroicons:user" class="nav-icon" />
        <span class="nav-label">Профиль</span>
      </NuxtLink>
    </div>
    
    <!-- Индикатор безопасной зоны -->
    <div class="safe-area-indicator"></div>
  </nav>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

// Состояние
const isSearchOpen = computed(() => {
  const isSearchActive = inject('isSearchActive', ref(false))
  return isSearchActive.value
})

// Открытие поиска
const openSearch = () => {
  // Используем глобальное состояние поиска
  const isSearchActive = inject('isSearchActive', ref(false))
  const isBottomSearchOpen = inject('isBottomSearchOpen', ref(false))
  
  // Переключаем состояние поиска
  isSearchActive.value = !isSearchActive.value
  
  // Если поиск активен, открываем нижнюю панель поиска
  if (isSearchActive.value) {
    isBottomSearchOpen.value = true
  }
}

// Определяем, находимся ли в мобильном приложении
const isMobileApp = computed(() => {
  return process.client && Capacitor.isNativePlatform()
})
</script>

<style scoped>
.mobile-bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: white;
  border-top: 1px solid #e5e7eb;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
}

.dark .mobile-bottom-nav {
  background: #1f2937;
  border-top-color: #374151;
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-around;
  padding: 8px 0;
  min-height: 60px;
}

.nav-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px 12px;
  border-radius: 8px;
  text-decoration: none;
  color: #6b7280;
  transition: all 0.2s ease;
  min-width: 60px;
  cursor: pointer;
  background: none;
  border: none;
}

.nav-item:hover {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.nav-item.active {
  color: #3b82f6;
  background: rgba(59, 130, 246, 0.1);
}

.nav-icon {
  width: 24px;
  height: 24px;
  margin-bottom: 4px;
}

.nav-label {
  font-size: 12px;
  font-weight: 500;
  line-height: 1;
}

.nav-search {
  position: relative;
}

.nav-search::after {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.nav-search.active::after {
  opacity: 1;
}

/* Индикатор безопасной зоны для устройств с вырезами */
.safe-area-indicator {
  height: env(safe-area-inset-bottom);
  background: inherit;
}

/* Темная тема */
.dark .nav-item {
  color: #9ca3af;
}

.dark .nav-item:hover,
.dark .nav-item.active {
  color: #60a5fa;
  background: rgba(96, 165, 250, 0.1);
}

/* Анимации */
.nav-item {
  transform: scale(1);
}

.nav-item:active {
  transform: scale(0.95);
}

/* Адаптивность */
@media (max-width: 480px) {
  .nav-content {
    padding: 6px 0;
  }
  
  .nav-item {
    padding: 6px 8px;
    min-width: 50px;
  }
  
  .nav-icon {
    width: 20px;
    height: 20px;
  }
  
  .nav-label {
    font-size: 11px;
  }
}
</style>
