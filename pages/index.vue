<template>
  <div>
    <!-- Основной контент -->
    <main class="flex-1">
      <!-- Поисковая строка -->
      <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div class="text-center mb-8 sm:mb-12">
          <h2 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-700 dark:text-white mb-2 sm:mb-4">
            Найдите нужную информацию
          </h2>
          <p class="text-base sm:text-lg lg:text-xl text-slate-600 dark:text-slate-300 mb-6 sm:mb-8">
            Быстрый поиск по всем разделам справочника СМП
          </p>
        </div>
        
        <!-- Компонент поиска -->
        <div class="mb-8 sm:mb-12">
          <SearchBar :is-home-page="true" />
        </div>

        <!-- Разделы -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
          <!-- Алгоритмы -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Алгоритмы</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Оказания помощи</p>
                </div>
              </div>
              <p class="text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">
                Пошаговые алгоритмы диагностики и лечения различных заболеваний
              </p>
              <NuxtLink
                to="/algorithms/adults"
                role="button"
                class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-auto"
              >
                Открыть
              </NuxtLink>
            </div>
          </div>

          <!-- Кодификатор -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Кодификатор</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">МКБ-10 и другие коды</p>
                </div>
              </div>
              <p class="text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">
                Международная классификация болезней и медицинские коды
              </p>
              <NuxtLink
                to="/codifier"
                role="button"
                class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-auto"
              >
                Открыть
              </NuxtLink>
            </div>
          </div>

          <!-- Калькуляторы -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Калькуляторы</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Медицинские расчеты</p>
                </div>
              </div>
              <p class="text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">
                Инструменты для расчета дозировок, индексов и других показателей
              </p>
              <button class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-auto">
                Открыть
              </button>
            </div>
          </div>

          <!-- Лекарства -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Лекарства</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Справочник препаратов</p>
                </div>
              </div>
              <p class="text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">
                Полная информация о лекарственных препаратах и их применении
              </p>
              <NuxtLink
                to="/drugs"
                role="button"
                class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-auto"
              >
                Открыть
              </NuxtLink>
            </div>
          </div>

          <!-- Локальные статусы -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Локальные статусы</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Статусы местного значения</p>
                </div>
              </div>
              <p class="text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">
                Локальные статусы и состояния пациентов для медицинской документации
              </p>
              <NuxtLink
                to="/local-statuses"
                role="button"
                class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-auto"
              >
                Открыть
              </NuxtLink>
            </div>
          </div>

          <!-- Подстанции -->
          <div class="bg-white dark:bg-slate-800 overflow-hidden rounded-lg hover:shadow-sm transition-all duration-300 border border-slate-100 dark:border-slate-600">
            <div class="p-4 h-full flex flex-col">
              <div class="flex items-center mb-4 sm:mb-6">
                <div class="flex-shrink-0">
                  <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <svg class="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                  </div>
                </div>
                <div class="ml-4 sm:ml-6">
                  <h3 class="text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">Подстанции</h3>
                  <p class="text-sm text-slate-500 dark:text-slate-400">Станции скорой помощи</p>
                </div>
              </div>
              <p class="text-base text-slate-600 dark:text-slate-300 mb-4 sm:mb-6 flex-grow">
                Информация о подстанциях скорой медицинской помощи и их контактах
              </p>
              <NuxtLink
                to="/substations"
                role="button"
                class="w-full inline-flex justify-center items-center px-4 sm:px-6 py-3 border border-slate-200 dark:border-slate-500 text-base font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200 mt-auto"
              >
                Открыть
              </NuxtLink>
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
</script>
