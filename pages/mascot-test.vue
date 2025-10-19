<template>
  <div class="min-h-screen bg-slate-50 dark:bg-slate-900 py-8">
    <div class="max-w-4xl mx-auto px-4">
      <!-- Заголовок -->
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Тест маскота
        </h1>
        <p class="text-slate-600 dark:text-slate-400">
          Интерактивный маскот-медсестра с анимацией, отслеживанием курсора и репликами
        </p>
      </div>

      <!-- Панель управления -->
      <UCard class="mb-8">
        <template #header>
          <h2 class="text-xl font-semibold">Управление маскотом</h2>
        </template>
        
        <div class="space-y-4">
          <!-- Кнопки действий -->
          <div class="flex flex-wrap gap-3">
            <UButton 
              @click="triggerRandomPhrase"
              color="primary"
              variant="solid"
            >
              Случайная реплика
            </UButton>
            
            <UButton 
              @click="triggerWelcome"
              color="success"
              variant="solid"
            >
              Приветствие
            </UButton>
            
            <UButton 
              @click="triggerHelp"
              color="primary"
              variant="solid"
            >
              Помощь
            </UButton>
            
            <UButton 
              @click="triggerEncouragement"
              color="secondary"
              variant="solid"
            >
              Поддержка
            </UButton>
          </div>

          <!-- Информация о состоянии -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <h3 class="font-medium text-slate-900 dark:text-white mb-2">
                Отслеживание курсора
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Маскот следит за движением мыши и поворачивается в сторону курсора
              </p>
            </div>
            
            <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <h3 class="font-medium text-slate-900 dark:text-white mb-2">
                Анимация улыбки
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                При репликах появляются светящиеся искорки вокруг маскота
              </p>
            </div>
            
            <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <h3 class="font-medium text-slate-900 dark:text-white mb-2">
                Периодические реплики
              </h3>
              <p class="text-sm text-slate-600 dark:text-slate-400">
                Маскот автоматически говорит каждые 15-45 секунд
              </p>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Демонстрационная область -->
      <UCard>
        <template #header>
          <h2 class="text-xl font-semibold">Демонстрация</h2>
        </template>
        
        <div class="space-y-6">
          <!-- Инструкции -->
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <h3 class="font-medium text-blue-900 dark:text-blue-300 mb-2">
              Как взаимодействовать с маскотом:
            </h3>
            <ul class="text-sm text-blue-800 dark:text-blue-400 space-y-1">
              <li>• Двигайте мышью по экрану - маскот будет следить за курсором</li>
              <li>• Наведите на маскота - он поприветствует вас</li>
              <li>• Кликните по маскоту - он скажет случайную фразу</li>
              <li v-if="mascotType === 'advanced'">• Двойной клик по маскоту - откроет меню действий</li>
              <li v-if="mascotType === 'advanced'">• Маскот автоматически моргает</li>
              <li v-if="mascotType === 'advanced'">• Индикатор активности показывает, когда маскот реагирует</li>
              <li v-if="mascotType === 'animated'">• Анимированные глаза следят за курсором</li>
              <li v-if="mascotType === 'animated'">• Автоматическое моргание и дыхание</li>
              <li v-if="mascotType === 'lottie'">• Lottie анимации для плавных движений</li>
              <li v-if="mascotType === 'lottie'">• Легковесные векторные анимации</li>
              <li>• Используйте кнопки выше для разных типов реплик</li>
              <li>• Маскот автоматически говорит периодически</li>
            </ul>
          </div>

          <!-- Область для демонстрации -->
          <div 
            class="relative h-96 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-600 flex items-center justify-center"
          >
            <div class="text-center text-slate-500 dark:text-slate-400">
              <p class="text-lg font-medium mb-2">Двигайте мышью здесь</p>
              <p class="text-sm">Маскот в правом нижнем углу будет следить за курсором</p>
            </div>
          </div>

          <!-- Статистика -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <h3 class="font-medium text-slate-900 dark:text-white mb-2">
                Статистика взаимодействий
              </h3>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-slate-600 dark:text-slate-400">Клики по маскоту:</span>
                  <span class="font-medium">{{ stats.clicks }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600 dark:text-slate-400">Наведения:</span>
                  <span class="font-medium">{{ stats.hovers }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-slate-600 dark:text-slate-400">Реплик показано:</span>
                  <span class="font-medium">{{ stats.phrases }}</span>
                </div>
              </div>
            </div>
            
            <div class="bg-slate-100 dark:bg-slate-800 rounded-lg p-4">
              <h3 class="font-medium text-slate-900 dark:text-white mb-2">
                Последняя активность
              </h3>
              <div class="text-sm text-slate-600 dark:text-slate-400">
                <p v-if="lastActivity">
                  {{ lastActivity }}
                </p>
                <p v-else>
                  Пока нет активности
                </p>
              </div>
            </div>
          </div>
        </div>
      </UCard>

      <!-- Выбор типа маскота -->
      <UCard class="mb-8">
        <template #header>
          <h2 class="text-xl font-semibold">Тип маскота</h2>
        </template>
        
        <div class="flex flex-wrap gap-3">
          <UButton 
            @click="mascotType = 'basic'"
            :variant="mascotType === 'basic' ? 'solid' : 'outline'"
            color="primary"
          >
            Базовый
          </UButton>
          <UButton 
            @click="mascotType = 'advanced'"
            :variant="mascotType === 'advanced' ? 'solid' : 'outline'"
            color="success"
          >
            Продвинутый
          </UButton>
          <UButton 
            @click="mascotType = 'animated'"
            :variant="mascotType === 'animated' ? 'solid' : 'outline'"
            color="secondary"
          >
            Анимированный
          </UButton>
          <UButton 
            @click="mascotType = 'lottie'"
            :variant="mascotType === 'lottie' ? 'solid' : 'outline'"
              color="warning"
          >
            Lottie
          </UButton>
        </div>
      </UCard>

      <!-- Маскот -->
      <Mascot 
        v-if="mascotType === 'basic'"
        ref="mascotRef"
        @click="handleMascotClick"
        @hover="handleMascotHover"
      />
      
      <MascotAdvanced 
        v-if="mascotType === 'advanced'"
        ref="mascotAdvancedRef"
        @click="handleMascotClick"
        @hover="handleMascotHover"
      />
      
      <MascotAnimated 
        v-if="mascotType === 'animated'"
        ref="mascotAnimatedRef"
        @click="handleMascotClick"
        @hover="handleMascotHover"
      />
      
      <MascotLottie 
        v-if="mascotType === 'lottie'"
        ref="mascotLottieRef"
        @click="handleMascotClick"
        @hover="handleMascotHover"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
// Мета-информация страницы
definePageMeta({
  title: 'Тест маскота',
  description: 'Тестовая страница для демонстрации интерактивного маскота-медсестры',
  middleware: 'auth'
})

// Реактивные данные
const mascotRef = ref()
const mascotAdvancedRef = ref()
const mascotAnimatedRef = ref()
const mascotLottieRef = ref()
const mascotType = ref<'basic' | 'advanced' | 'animated' | 'lottie'>('basic')
const stats = ref({
  clicks: 0,
  hovers: 0,
  phrases: 0
})
const lastActivity = ref('')

// Методы управления маскотом
const getCurrentMascot = () => {
  switch (mascotType.value) {
    case 'basic':
      return mascotRef.value
    case 'advanced':
      return mascotAdvancedRef.value
    case 'animated':
      return mascotAnimatedRef.value
    case 'lottie':
      return mascotLottieRef.value
    default:
      return mascotRef.value
  }
}

const triggerRandomPhrase = () => {
  const mascot = getCurrentMascot()
  if (mascot) {
    mascot.speakRandomPhrase()
    stats.value.phrases++
    lastActivity.value = `Случайная реплика в ${new Date().toLocaleTimeString()}`
  }
}

const triggerWelcome = () => {
  const mascot: any = getCurrentMascot()
  if (mascot) {
    mascot.speakPhrase('Добро пожаловать! Я рада вас видеть! 😊')
    stats.value.phrases++
    lastActivity.value = `Приветствие в ${new Date().toLocaleTimeString()}`
  }
}

const triggerHelp = () => {
  const mascot: any = getCurrentMascot()
  if (mascot) {
    mascot.speakPhrase('Нужна помощь? Я всегда готова ответить на ваши вопросы! 💙')
    stats.value.phrases++
    lastActivity.value = `Предложение помощи в ${new Date().toLocaleTimeString()}`
  }
}

const triggerEncouragement = () => {
  const mascot: any = getCurrentMascot()
  if (mascot) {
    mascot.speakPhrase('Вы делаете отличную работу! Продолжайте в том же духе! ✨')
    stats.value.phrases++
    lastActivity.value = `Поддержка в ${new Date().toLocaleTimeString()}`
  }
}

// Обработчики событий маскота
const handleMascotClick = () => {
  stats.value.clicks++
  lastActivity.value = `Клик по маскоту в ${new Date().toLocaleTimeString()}`
}

const handleMascotHover = () => {
  stats.value.hovers++
  lastActivity.value = `Наведение на маскота в ${new Date().toLocaleTimeString()}`
}

// Инициализация
onMounted(() => {
  // Приветствие при загрузке страницы
  setTimeout(() => {
    triggerWelcome()
  }, 1000)
})
</script>

<style scoped>
/* Дополнительные стили для тестовой страницы */
.animate-pulse-slow {
  animation: pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style>
