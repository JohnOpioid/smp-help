<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Контакты</h1>
    
    <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 rounded-lg p-6">
        <h2 class="text-xl font-semibold text-slate-900 dark:text-white mb-4">Свяжитесь с нами</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">Техническая поддержка</h3>
            <div class="space-y-2 text-slate-600 dark:text-slate-300">
              <p><strong>Email:</strong> message@johnone.ru</p>
              <p><strong>Телефон:</strong> +7 (980) 010-30-03</p>
              <p><strong>Время работы:</strong> Пн-Пт 9:00-18:00</p>
            </div>
          </div>
        </div>
        
        <div class="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-3">Обратная связь</h3>
          <p class="text-slate-600 dark:text-slate-300 mb-4">
            Если у вас есть предложения по улучшению справочника или вы обнаружили ошибку, 
            пожалуйста, свяжитесь с нами через форму обратной связи.
          </p>
          
          <UButton 
            to="/feedback" 
            color="primary" 
            variant="solid"
            class="inline-flex items-center"
          >
            <UIcon name="i-lucide-mail" class="mr-2" />
            Написать нам
          </UButton>
        </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-информация для страницы
useHead({
  title: 'Контакты - Справочник СМП',
  meta: [
    { name: 'description', content: 'Контактная информация для связи с командой Справочника СМП' }
  ]
})

// Заголовок для хедера
definePageMeta({
  headerTitle: 'Контакты',
  middleware: 'auth'
})
</script>
