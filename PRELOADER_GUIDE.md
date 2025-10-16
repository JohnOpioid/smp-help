# Глобальная система предзагрузки

Система предзагрузки, аналогичная Google, для всего сайта. Предзагружает данные и страницы перед переходом для мгновенной навигации.

## 🚀 Основные возможности

- **Глобальная предзагрузка** - работает на всех страницах сайта
- **Автоматическая предзагрузка** - при наведении на ссылки
- **Кэширование данных** - избегает повторных запросов
- **Прогресс-бар** - показывает процесс загрузки
- **Типизированные методы** - для разных типов страниц

## 📦 Установка

Система уже интегрирована в `layouts/default.vue` и готова к использованию.

## 🔧 Использование

### Базовое использование

```typescript
import { preloadAndNavigate, preloadPage } from '~/composables/usePreloader'

// Простая предзагрузка
await preloadAndNavigate('/drugs', async () => {
  await $fetch('/api/drugs')
})

// Предзагрузка с кэшированием
await preloadAndNavigate('/codifier/cardiology', async () => {
  await $fetch('/api/codifier/cardiology')
}, {
  cacheKey: 'codifier-cardiology',
  message: 'Загрузка кардиологии...'
})
```

### Типизированные методы

```typescript
// Предзагрузка алгоритма
await preloadPage.algorithm('adults', 'cardiology', 'heart-attack')

// Предзагрузка кодификатора
await preloadPage.codifier('cardiology', 'heart-disease-id')

// Предзагрузка локальных статусов
await preloadPage.localStatus('emergency', 'status-id')

// Предзагрузка препаратов
await preloadPage.drug('drug-id')

// Предзагрузка подстанций
await preloadPage.substation('station-name')

// Предзагрузка инструкций
await preloadPage.instruction('instruction-id')
```

### Использование в компонентах

```vue
<script setup lang="ts">
const { preloadPage, isPreloading, preloadProgress } = usePreloader()

// В обработчике клика
function handleClick(item: any) {
  preloadPage.codifier(item.category.url, item._id)
}
</script>

<template>
  <div>
    <!-- Индикатор загрузки уже встроен глобально -->
    <button @click="handleClick(item)">
      Открыть {{ item.name }}
    </button>
  </div>
</template>
```

## 🎯 Автоматическая предзагрузка

Система автоматически предзагружает страницы при наведении на ссылки:

- **Алгоритмы** - `/algorithms/section/category`
- **Кодификатор** - `/codifier/category`
- **Локальные статусы** - `/local-statuses/category`
- **Препараты** - `/drugs`
- **Подстанции** - `/substations`
- **Инструкции** - `/instructions`

## ⚙️ Конфигурация

### Настройка предзагрузки

```typescript
interface PreloadConfig {
  url: string                    // URL для перехода
  preloadFn?: () => Promise<any> // Функция предзагрузки
  cacheKey?: string             // Ключ кэша
  showProgress?: boolean        // Показывать прогресс
  message?: string              // Сообщение загрузки
}
```

### Управление кэшем

```typescript
const { preloadData, clearCache, getCacheSize } = usePreloader()

// Предзагрузка данных с кэшированием
const data = await preloadData('my-key', async () => {
  return await $fetch('/api/data')
})

// Очистка кэша
clearCache('my-key')        // Очистить конкретный ключ
clearCache()               // Очистить весь кэш

// Размер кэша
console.log('Кэш:', getCacheSize(), 'элементов')
```

## 🎨 Кастомизация

### Собственный индикатор прогресса

```vue
<template>
  <div v-if="isPreloading" class="my-custom-loader">
    <div class="progress-bar" :style="{ width: `${preloadProgress}%` }" />
    <p>{{ preloadMessage }}</p>
  </div>
</template>

<script setup lang="ts">
const { isPreloading, preloadProgress, preloadMessage } = usePreloader()
</script>
```

### Отключение автоматической предзагрузки

```typescript
// В layout или app.vue
const { setupAutoPreload } = useAutoPreload()

// Не вызывать setupAutoPreload() для отключения
```

## 🔄 Миграция с существующего кода

### Было (BottomSearchPanel)
```typescript
const preloadAndNavigate = async (to: string, preloadFn: () => Promise<void>) => {
  try { 
    isPreloading.value = true
    await preloadFn()
    await navigateTo(to)
    closePanel()
  } finally { 
    isPreloading.value = false 
  }
}
```

### Стало (глобальная система)
```typescript
import { preloadPage } from '~/composables/usePreloader'

// Вместо preloadAndNavigate
await preloadPage.codifier(categoryUrl, mkbId)
```

## 📊 Производительность

- **Кэширование** - избегает повторных запросов
- **Ленивая загрузка** - предзагружает только при необходимости
- **Оптимизация** - автоматически определяет тип страницы
- **Память** - ограниченный размер кэша

## 🐛 Отладка

```typescript
// Включить логирование
const { getCacheSize } = usePreloader()
console.log('Размер кэша:', getCacheSize())

// Проверить состояние предзагрузки
const { isPreloading, preloadProgress } = usePreloader()
console.log('Загружается:', isPreloading.value, 'Прогресс:', preloadProgress.value)
```

## 🎯 Примеры использования

### В списке категорий
```vue
<template>
  <li v-for="category in categories" :key="category._id">
    <button @click="openCategory(category)">
      {{ category.name }}
    </button>
  </li>
</template>

<script setup lang="ts">
const { preloadPage } = usePreloader()

function openCategory(category: any) {
  preloadPage.codifier(category.url)
}
</script>
```

### В результатах поиска
```vue
<template>
  <div v-for="result in searchResults" :key="result.id">
    <button @click="openResult(result)">
      {{ result.title }}
    </button>
  </div>
</template>

<script setup lang="ts">
const { preloadPage } = usePreloader()

function openResult(result: any) {
  switch (result.type) {
    case 'Препарат':
      preloadPage.drug(result.id)
      break
    case 'Алгоритм':
      preloadPage.algorithm(result.section, result.category, result.id)
      break
    case 'МКБ':
      preloadPage.codifier(result.category, result.id)
      break
  }
}
</script>
```

Система готова к использованию и автоматически улучшит производительность навигации по всему сайту!
