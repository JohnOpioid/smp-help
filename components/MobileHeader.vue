<template>
  <header 
    class="mobile-header"
  >
    <div class="header-content">
      <!-- Логотип и название -->
      <div class="header-left">
        <img src="/logo.svg" alt="СМП" class="header-logo" />
        <h1 class="header-title">Помощник СМП</h1>
      </div>
      
      <!-- Кнопки действий -->
      <div class="header-right">
        <button 
          v-if="showBackButton"
          @click="goBack"
          class="header-button"
          aria-label="Назад"
        >
          <Icon name="heroicons:arrow-left" class="w-6 h-6" />
        </button>
        
        <button 
          @click="toggleTheme"
          class="header-button"
          aria-label="Переключить тему"
        >
          <Icon 
            :name="isDark ? 'heroicons:sun' : 'heroicons:moon'" 
            class="w-6 h-6" 
          />
        </button>
        
        <button 
          @click="toggleMenu"
          class="header-button"
          aria-label="Меню"
        >
          <Icon name="heroicons:bars-3" class="w-6 h-6" />
        </button>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">

// Props
defineProps<{
  showBackButton?: boolean
}>()

// Composables
const { isDark, toggleTheme } = useTheme()
const router = useRouter()

// Состояние
const statusBarHeight = ref(0)
const isMenuOpen = ref(false)

// Получаем высоту статус-бара
onMounted(async () => {
  // Упрощенная логика без Capacitor
  statusBarHeight.value = 24 // Fallback значение
})

// Навигация назад
const goBack = () => {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

// Переключение меню
const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value
  // Здесь можно добавить логику для бокового меню
}
</script>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  /* Добавляем отступ сверху для статус-бара */
  padding-top: env(safe-area-inset-top);
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  min-height: 56px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-logo {
  width: 32px;
  height: 32px;
  filter: brightness(0) invert(1);
}

.header-title {
  font-size: 18px;
  font-weight: 600;
  color: white;
  margin: 0;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.header-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
}

.header-button:hover {
  background: rgba(255, 255, 255, 0.2);
  transform: scale(1.05);
}

.header-button:active {
  transform: scale(0.95);
}

/* Темная тема */
.dark .mobile-header {
  background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
}

/* Адаптивность */
@media (max-width: 480px) {
  .header-title {
    font-size: 16px;
  }
  
  .header-content {
    padding: 10px 12px;
  }
}
</style>
