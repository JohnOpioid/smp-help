<template>
  <footer class="relative z-10">
    <div class="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
        <!-- Левая часть - копирайт -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          © {{ currentYear }} Помощник СМП. Сделано 
          <a 
            href="https://desjo.ru/" 
            target="_blank" 
            rel="noopener noreferrer"
            class="inline-block text-sm font-black text-slate-700/50 dark:text-slate-100 hover:text-slate-700/75 dark:hover:text-indigo-400 transition-colors duration-200"
          >
            DЖ<span class="text-indigo-400/50">O</span>
          </a>
        </div>
        
        <!-- Правая часть - ссылки -->
        <div class="flex flex-wrap items-center justify-center sm:justify-start gap-4">
          <NuxtLink
            v-for="link in footerLinks"
            :key="link.name"
            :to="link.to"
            class="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors duration-200 whitespace-nowrap"
          >
            {{ link.name }}
          </NuxtLink>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
// Текущий год для копирайта
const currentYear = new Date().getFullYear()

// Ссылки в футере
const footerLinks = [
  { name: 'О проекте', to: '/about' },
  { name: 'Контакты', to: '/contacts' },
  { name: 'Помощь', to: '/help' },
  { name: 'Политика конфиденциальности', to: '/privacy' }
]
</script>
