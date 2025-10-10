<template>
  <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">О проекте</h1>
    
    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg p-6">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Справочник СМП</h2>
        
        <p class="text-slate-600 dark:text-slate-300 mb-4">
          Профессиональный справочник для сотрудников скорой медицинской помощи, 
          содержащий актуальную информацию о диагностике, лечении и алгоритмах действий.
        </p>
        
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">Основные разделы:</h3>
        <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2 mb-6">
          <li><strong>Кодификатор МКБ</strong> - международная классификация болезней</li>
          <li><strong>Местные статусы</strong> - региональные особенности диагностики</li>
          <li><strong>Алгоритмы</strong> - пошаговые инструкции для различных ситуаций</li>
          <li><strong>Препараты</strong> - справочник лекарственных средств с калькулятором дозировок</li>
          <li><strong>Инструкции</strong> - методические рекомендации</li>
        </ul>
        
        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">Технические особенности:</h3>
        <ul class="list-disc list-inside text-slate-600 dark:text-slate-300 space-y-2">
          <li>Адаптивный дизайн для всех устройств</li>
          <li>Быстрый поиск по всем разделам</li>
          <li>Калькуляторы дозировок для педиатрии</li>
          <li>Интеграция с картами для поиска подстанций</li>
          <li>Темная и светлая темы</li>
        </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-информация для страницы
useHead({
  title: 'О проекте - Справочник СМП',
  meta: [
    { name: 'description', content: 'Информация о проекте Справочник СМП - профессиональном инструменте для сотрудников скорой медицинской помощи' }
  ]
})

// Заголовок для хедера
definePageMeta({
  headerTitle: 'О проекте',
  middleware: 'auth'
})
</script>
