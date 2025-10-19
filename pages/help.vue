<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Помощь</h1>
    
    <div class="space-y-6">
        <!-- Поиск -->
        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <UIcon name="i-lucide-search" class="mr-2" />
            Поиск по сайту
          </h2>
          <p class="text-slate-600 dark:text-slate-300 mb-4">
            Используйте поисковую строку в шапке сайта для быстрого поиска по всем разделам. 
            Поиск работает по названиям, кодам МКБ, препаратам и другим данным.
          </p>
          <div class="bg-slate-50 dark:bg-slate-700 rounded-lg p-4">
            <p class="text-sm text-slate-600 dark:text-slate-300">
              <strong>Совет:</strong> Для более точного поиска используйте коды МКБ (например, A00-B99) 
              или названия препаратов на латыни.
            </p>
          </div>
        </div>

        <!-- Навигация -->
        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <UIcon name="i-lucide-navigation" class="mr-2" />
            Навигация по сайту
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Основные разделы:</h3>
              <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                <li><NuxtLink to="/codifier" class="text-indigo-600 hover:text-indigo-700">Кодификатор МКБ</NuxtLink></li>
                <li><NuxtLink to="/local-statuses" class="text-indigo-600 hover:text-indigo-700">Местные статусы</NuxtLink></li>
                <li><NuxtLink to="/drugs" class="text-indigo-600 hover:text-indigo-700">Препараты</NuxtLink></li>
                <li><NuxtLink to="/instructions" class="text-indigo-600 hover:text-indigo-700">Инструкции</NuxtLink></li>
              </ul>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white mb-2">Дополнительно:</h3>
              <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-1">
                <li><NuxtLink to="/substations" class="text-indigo-600 hover:text-indigo-700">Подстанции</NuxtLink></li>
                <li><NuxtLink to="/favorites" class="text-indigo-600 hover:text-indigo-700">Избранное</NuxtLink></li>
                <li><NuxtLink to="/profile" class="text-indigo-600 hover:text-indigo-700">Профиль</NuxtLink></li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Калькуляторы -->
        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <UIcon name="i-lucide-calculator" class="mr-2" />
            Калькуляторы дозировок
          </h2>
          <p class="text-slate-600 dark:text-slate-300 mb-4">
            В разделе "Препараты" доступны калькуляторы для расчета детских дозировок. 
            Введите вес ребенка и выберите дозировку из списка - калькулятор автоматически 
            рассчитает необходимое количество препарата.
          </p>
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p class="text-sm text-blue-700 dark:text-blue-300">
              <strong>Важно:</strong> Калькуляторы предназначены только для справочных целей. 
              Всегда консультируйтесь с врачом перед применением препаратов.
            </p>
          </div>
        </div>

        <!-- Часто задаваемые вопросы -->
        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-6">
          <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
            <UIcon name="i-lucide-help-circle" class="mr-2" />
            Часто задаваемые вопросы
          </h2>
          <div class="space-y-4">
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Как добавить материал в избранное?</h3>
              <p class="text-slate-600 dark:text-slate-300">Нажмите на иконку звездочки рядом с нужным материалом. Избранные материалы сохраняются в вашем профиле.</p>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Как скопировать информацию?</h3>
              <p class="text-slate-600 dark:text-slate-300">Используйте кнопки "Копировать" в модальных окнах или нажмите на текст для выделения.</p>
            </div>
            <div>
              <h3 class="font-semibold text-slate-900 dark:text-white">Работает ли сайт офлайн?</h3>
              <p class="text-slate-600 dark:text-slate-300">Нет, для работы сайта требуется подключение к интернету для получения актуальных данных.</p>
            </div>
          </div>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-информация для страницы
useHead({
  title: 'Помощь - Справочник СМП',
  meta: [
    { name: 'description', content: 'Справочная информация по использованию Справочника СМП' }
  ]
})

// Заголовок для хедера
definePageMeta({
  headerTitle: 'Помощь',
  middleware: 'auth'
})
</script>
