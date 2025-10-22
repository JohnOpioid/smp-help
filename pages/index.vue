<template>
  <div>
    <!-- Основной контент -->
    <main class="flex-1">
      <!-- Заголовок и описание -->
      <div class="max-w-5xl mx-auto px-4 py-8">
        <!-- Скелетон заголовка и описания -->
        <div v-if="isInitialLoading" class="text-center mb-8 sm:mb-12">
          <div class="flex flex-col items-center gap-2 sm:gap-3">
            <USkeleton class="h-7 sm:h-9 w-64 sm:w-96 bg-slate-200 dark:bg-slate-700" />
            <USkeleton class="h-5 sm:h-6 w-72 sm:w-[28rem] bg-slate-200 dark:bg-slate-700" />
          </div>
        </div>

        <!-- Реальный заголовок и описание -->
        <div v-else class="text-center mb-8 sm:mb-12">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-700 dark:text-white mb-2 sm:mb-4">
            Найдите нужную информацию
          </h2>
          <p class="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 sm:mb-8">
            Быстрый поиск по всем разделам справочника СМП
          </p>
        </div>
      </div>

      <!-- Разделы -->
      <div class="max-w-5xl mx-auto px-2 md:px-4">
        <!-- Скелетоны контента при первичной загрузке -->
        <div v-if="isInitialLoading" class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <div v-for="n in 6" :key="n" class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg">
            <div class="p-2 h-full flex flex-col">
              <div class="flex flex-col sm:flex-row items-center sm:items-start mb-4 sm:mb-6">
                <div class="flex-shrink-0 mb-3 sm:mb-0">
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center bg-slate-200 dark:bg-slate-700">
                    <USkeleton class="w-6 h-6 sm:w-8 sm:h-8 bg-slate-300 dark:bg-slate-600" />
                  </div>
                </div>
                <div class="text-center sm:text-left sm:ml-4 sm:ml-6">
                  <USkeleton class="h-5 w-32 mb-2 bg-slate-200 dark:bg-slate-700" />
                  <USkeleton class="h-4 w-24 bg-slate-200 dark:bg-slate-700" />
                </div>
              </div>
              <USkeleton class="h-4 w-full mb-2 bg-slate-200 dark:bg-slate-700" />
              <USkeleton class="h-4 w-5/6 mb-4 sm:mb-6 bg-slate-200 dark:bg-slate-700" />
              <USkeleton class="h-10 w-full mt-auto rounded-md bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>
        </div>

         <!-- Реальный контент -->
         <div v-else class="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2">
           <div v-for="card in cards" :key="card.id" @click="handleCardClick(card.id, card.link)"
             class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg cursor-pointer hover:shadow-lg dark:hover:shadow-xl transition-all duration-200 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
             :class="{ 'loading-card': card.isLoading }" tabindex="0" role="button"
             @keydown.enter="handleCardClick(card.id, card.link)"
             @keydown.space.prevent="handleCardClick(card.id, card.link)">
             <div class="px-2 py-4 sm:px-4 h-full flex flex-col">
               <div class="flex flex-col sm:flex-row items-center sm:items-start mb-0 sm:mb-4 sm:mb-6">
                 <div class="flex-shrink-0 mb-3 sm:mb-0">
                   <div :class="card.iconBg" class="w-12 h-12 rounded-lg flex items-center justify-center">
                     <svg :class="card.iconColor" class="w-6 h-6 sm:w-8 sm:h-8" fill="none" stroke="currentColor"
                       viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="card.iconPath"></path>
                     </svg>
                   </div>
                 </div>
                 <div class="text-center sm:text-left sm:ml-4 sm:ml-6">
                   <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white line-clamp-1">{{ card.title
                     }}</h3>
                   <p class="text-sm text-slate-500 dark:text-slate-400">{{ card.subtitle }}</p>
                 </div>
               </div>
               <p
                 class="text-base text-slate-600 dark:text-slate-300 flex-grow text-center sm:text-left hidden sm:block">
                 {{ card.description }}
               </p>
             </div>
           </div>
         </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
})

const { user, logout } = useAuth()
const { isDark, toggleTheme } = useTheme()
// Состояние первичной загрузки из лейаута/app
const isInitialLoading = inject('isInitialLoading', ref(false))

// Предзагружаем основные данные для ускорения навигации
if (process.client) {
  // Предзагружаем категории алгоритмов
  $fetch('/api/algorithms/categories').catch(() => {})
  
  // Предзагружаем основные категории
  $fetch('/api/categories').catch(() => {})
}

// Реактивное состояние загрузки для каждой карточки
const loadingStates = ref<Record<string, boolean>>({})

// Функция для обработки клика по карточке
const handleCardClick = async (cardId: string, link: string) => {
  // Устанавливаем состояние загрузки для конкретной карточки
  loadingStates.value[cardId] = true

  try {
    // Предзагрузка страницы
    await navigateTo(link)
  } catch (error) {
    console.error('Ошибка навигации:', error)
  } finally {
    // Сбрасываем состояние загрузки
    loadingStates.value[cardId] = false
  }
}

// Массив карточек главной страницы
const cards = computed(() => [
  {
    id: 'algorithms',
    title: 'Алгоритмы',
    subtitle: 'Оказания помощи',
    description: 'Пошаговые алгоритмы диагностики и лечения различных заболеваний',
    link: '/algorithms/adults',
    iconBg: 'bg-blue-100 dark:bg-blue-900',
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    isLoading: loadingStates.value.algorithms || false
  },
  {
    id: 'codifier',
    title: 'Кодификатор',
    subtitle: 'МКБ-10 и коды Станции',
    description: 'Международная классификация болезней и медицинские коды',
    link: '/codifier',
    iconBg: 'bg-green-100 dark:bg-green-900',
    iconColor: 'text-green-600 dark:text-green-400',
    iconPath: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    isLoading: loadingStates.value.codifier || false
  },
  {
    id: 'calculators',
    title: 'Калькуляторы',
    subtitle: 'Медицинские расчеты',
    description: 'Инструменты для расчета дозировок, индексов и других показателей',
    link: '/calculators',
    iconBg: 'bg-purple-100 dark:bg-purple-900',
    iconColor: 'text-purple-600 dark:text-purple-400',
    iconPath: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z',
    isLoading: loadingStates.value.calculators || false
  },
  {
    id: 'drugs',
    title: 'Лекарства',
    subtitle: 'Справочник препаратов',
    description: 'Полная информация о лекарственных препаратах и их применении',
    link: '/drugs',
    iconBg: 'bg-red-100 dark:bg-red-900',
    iconColor: 'text-red-600 dark:text-red-400',
    iconPath: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    isLoading: loadingStates.value.drugs || false
  },
  {
    id: 'local-statuses',
    title: 'Локальные статусы',
    subtitle: 'Готовые описания',
    description: 'Локальные статусы и состояния пациентов для медицинской документации',
    link: '/local-statuses',
    iconBg: 'bg-yellow-100 dark:bg-yellow-900',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
    iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    isLoading: loadingStates.value['local-statuses'] || false
  },
  {
    id: 'substations',
    title: 'Подстанции',
    subtitle: 'Карта подстанций',
    description: 'Информация о подстанциях скорой медицинской помощи и их контактах',
    link: '/substations',
    iconBg: 'bg-indigo-100 dark:bg-indigo-900',
    iconColor: 'text-indigo-600 dark:text-indigo-400',
    iconPath: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z',
    isLoading: loadingStates.value.substations || false
  }
])
</script>

<style scoped>
.loading-card {
  position: relative;
  overflow: hidden;
}

.loading-card::before {
  content: '';
  position: absolute;
  top: -3px;
  left: -3px;
  right: -3px;
  bottom: -3px;
  border-radius: 0.5rem;
  background: linear-gradient(90deg, transparent, #3b82f6, transparent);
  background-size: 200% 100%;
  animation: slide 2s linear infinite;
  z-index: 1;
  pointer-events: none;
}

.loading-card::after {
  content: '';
  position: absolute;
  top: 3px;
  left: 3px;
  right: 3px;
  bottom: 3px;
  background: inherit;
  border-radius: calc(0.5rem - 3px);
  z-index: 2;
  pointer-events: none;
}

@keyframes slide {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

.loading-card .p-4 {
  position: relative;
  z-index: 3;
}
</style>
