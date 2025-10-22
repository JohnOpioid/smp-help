<template>
  <div class="mobile-layout">
    <!-- Основная шапка (как в десктопе) -->
    <AppHeader v-if="!isInitialLoading" :title="headerTitle" />
    <header v-else class="transition-colors duration-300 relative z-50">
      <div class="w-full max-w-5xl mx-auto px-2 md:px-4 py-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex items-center gap-2 min-w-0">
            <img 
              src="/logo.svg" 
              alt="Логотип" 
              class="h-9 w-9 animate-spin"
            />
          </div>
          <div class="relative flex-1">
            <USkeleton class="h-10 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
          </div>
          <div class="flex items-center space-x-3 sm:space-x-4 relative">
            <USkeleton class="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>
      </div>
    </header>
    
    <div class="flex-1 flex flex-col min-h-0">
      <!-- Результаты поиска -->
      <SearchResults v-if="!isInitialLoading" />
      
      <!-- Основной контент -->
      <div v-if="!isSearchActive">
        <div v-if="showBreadcrumbs">
          <Breadcrumbs v-if="!isInitialLoading && !isContentLoading" />
          <BreadcrumbsSkeleton v-else />
        </div>
        
        <!-- Основной контент -->
        <div v-if="!isContentLoading">
          <main 
            class="mobile-main"
            :style="{ 
              paddingBottom: bottomNavHeight + 'px'
            }"
          >
            <slot />
          </main>
        </div>
        
        <!-- Скелетон контента при навигации -->
        <div v-else class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-4">
          <USkeleton class="h-6 w-1/3" />
          <USkeleton class="h-4 w-2/3" />
          <div class="space-y-2">
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
            <USkeleton class="h-20 w-full" />
          </div>
        </div>
      </div>
      
      <!-- Панель поиска вместо контента -->
      <div v-else class="flex-1 flex flex-col min-h-0">
        <div class="flex-1 overflow-y-auto">
          <div class="max-w-5xl mx-auto px-4 py-8">
            <!-- Скелетон загрузки -->
            <div v-if="isSearching" class="space-y-4">
              <div class="space-y-3">
                <div class="flex items-center space-x-3">
                  <div class="w-4 h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"></div>
                  <div class="flex-1">
                    <div class="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mb-1"></div>
                    <div class="h-3 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/3"></div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Результаты поиска -->
            <div v-else-if="!isSearching && searchResults.length > 0" class="space-y-6">
              <!-- Здесь будут результаты поиска -->
            </div>
            
            <!-- Заглушка при отсутствии результатов -->
            <div v-else class="text-center py-16">
              <div class="flex flex-col items-center space-y-4">
                <div class="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center">
                  <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                  </svg>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-600 dark:text-slate-300 mb-1">
                    Ничего не найдено
                  </p>
                  <p class="text-xs text-slate-500 dark:text-slate-400">
                    Попробуйте изменить запрос
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Мобильная нижняя навигация -->
    <MobileNav />
    
    <!-- Панель поиска с чат-ботом -->
    <BottomSearchPanel :is-open="isBottomSearchOpen" @close="closeBottomSearch" />
    
    <!-- Глобальный индикатор предзагрузки -->
    <PreloadIndicator />
  </div>
</template>

<script setup lang="ts">
import { Capacitor } from '@capacitor/core'

// Props
defineProps<{
  showBackButton?: boolean
}>()

// Используем те же композаблы, что и в основном лейауте
const route = useRoute()
const { user, logout } = useAuth()
const { isDark, toggleTheme } = useTheme()

// Состояние загрузки (как в основном лейауте)
const isInitialLoading = inject('isInitialLoading', ref(false))
const isContentLoading = inject('isContentLoading', ref(false))
const isSearchActive = inject('isSearchActive', ref(false))
const isSearching = inject('isSearching', ref(false))
const searchResults = inject('searchResults', ref([]))
const isBottomSearchOpen = inject('isBottomSearchOpen', ref(false))

// Заголовок страницы
const headerTitle = computed(() => {
  const titles: Record<string, string> = {
    '/': 'Главная',
    '/algorithms': 'Алгоритмы',
    '/calculators': 'Калькуляторы',
    '/drugs': 'Лекарства',
    '/profile': 'Профиль',
    '/codifier': 'Кодификатор',
    '/substations': 'Подстанции',
    '/local-statuses': 'Локальные статусы',
    '/instructions': 'Инструкции'
  }
  return titles[route.path] || 'Справочник СМП'
})

// Показывать ли хлебные крошки
const showBreadcrumbs = computed(() => {
  return route.path !== '/' && !route.path.startsWith('/auth')
})

// Состояние
const headerHeight = ref(88) // 56px + 32px отступ
const bottomNavHeight = ref(76) // 60px + 16px отступ

// Определяем, находимся ли в мобильном приложении
const isMobileApp = computed(() => {
  return process.client && Capacitor.isNativePlatform()
})

// Функция закрытия поиска
const closeBottomSearch = () => {
  isBottomSearchOpen.value = false
}

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
  display: flex;
  flex-direction: column;
  /* Оптимизация производительности */
  transform: translateZ(0);
  backface-visibility: hidden;
  will-change: transform;
}

.dark .mobile-layout {
  background: #111827;
}

.mobile-main {
  flex: 1;
  padding: 16px;
  transition: padding 0.3s ease;
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
