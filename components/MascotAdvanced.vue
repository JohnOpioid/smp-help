<template>
  <div 
    ref="mascotContainer"
    class="fixed bottom-4 right-4 z-50 cursor-pointer"
    @click="speakRandomPhrase"
  >
    <!-- Маскот -->
    <div 
      ref="mascot"
      class="relative transform transition-all duration-300 ease-out"
      :class="mascotClasses"
      :style="mascotStyle"
    >
      <!-- Изображение маскота -->
      <div class="relative">
        <img 
          :src="mascotImage" 
          alt="Маскот-медсестра"
          class="w-24 h-24 object-contain drop-shadow-lg transition-all duration-300"
          :class="imageClasses"
        />
        
        <!-- Анимация улыбки (светящиеся частицы) -->
        <div 
          v-if="isSmiling"
          class="absolute inset-0 pointer-events-none"
        >
          <div 
            v-for="i in 8" 
            :key="i"
            class="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
            :style="getSparkleStyle(i)"
          ></div>
        </div>
        
        <!-- Анимация моргания -->
        <div 
          v-if="isBlinking"
          class="absolute inset-0 pointer-events-none"
        >
          <div class="absolute top-4 left-4 w-8 h-4 bg-slate-900 dark:bg-white rounded-full animate-pulse"></div>
          <div class="absolute top-4 right-4 w-8 h-4 bg-slate-900 dark:bg-white rounded-full animate-pulse"></div>
        </div>
        
        <!-- Индикатор активности -->
        <div 
          v-if="isActive"
          class="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full animate-pulse"
        ></div>
      </div>
      
      <!-- Пузырь с речью -->
      <div 
        v-if="currentPhrase"
        class="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg px-3 py-2 shadow-lg border border-slate-200 dark:border-slate-700 max-w-xs"
        :class="speechBubbleClasses"
      >
        <div class="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
          {{ currentPhrase }}
        </div>
        <!-- Стрелка пузыря -->
        <div class="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white dark:border-t-slate-800"></div>
      </div>
      
      <!-- Меню действий -->
      <div 
        v-if="showMenu"
        class="absolute bottom-full right-0 mb-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-2"
      >
        <div class="flex flex-col space-y-1">
          <button 
            @click="speakPhrase('Привет! Как дела? 😊')"
            class="text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Приветствие
          </button>
          <button 
            @click="speakPhrase('Нужна помощь? Я здесь! 💙')"
            class="text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Помощь
          </button>
          <button 
            @click="speakPhrase('Все будет хорошо! ✨')"
            class="text-xs px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300"
          >
            Поддержка
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface MascotAdvancedProps {
  image?: string
  autoSpeak?: boolean
  followCursor?: boolean
  blinkInterval?: number
}

const props = withDefaults(defineProps<MascotAdvancedProps>(), {
  image: '/maskot.png',
  autoSpeak: true,
  followCursor: true,
  blinkInterval: 3000
})

// Реактивные данные
const mascotContainer = ref<HTMLElement>()
const mascot = ref<HTMLElement>()
const mousePosition = ref({ x: 0, y: 0 })
const isSmiling = ref(false)
const isBlinking = ref(false)
const isActive = ref(false)
const currentPhrase = ref('')
const showMenu = ref(false)
const mascotImage = ref(props.image)

// Фразы маскота
const phrases = [
  'Привет! Я здесь, чтобы помочь! 😊',
  'Нужна помощь с поиском?',
  'Не стесняйтесь обращаться!',
  'Я всегда готова помочь! 💙',
  'Есть вопросы? Задавайте!',
  'Рада видеть вас здесь!',
  'Все будет хорошо! ✨',
  'Медицина - это важно!',
  'Берегите себя! 💪',
  'Я рядом, если нужна помощь!',
  'Как дела? Чем могу помочь?',
  'Не забывайте о здоровье! 🏥',
  'Работаем вместе! 🤝',
  'Все получится! 💪',
  'Держитесь! Я с вами! 💙'
]

// Состояния анимации
const isHovered = ref(false)
const isMoving = ref(false)
const lastMouseTime = ref(0)

// Таймеры
let blinkTimer: NodeJS.Timeout | null = null
let activityTimer: NodeJS.Timeout | null = null
let menuTimer: NodeJS.Timeout | null = null

// Вычисляемые свойства
const mascotClasses = computed(() => [
  isHovered.value && 'scale-110',
  isMoving.value && 'animate-bounce',
  isSmiling.value && 'animate-pulse',
  isActive.value && 'ring-2 ring-green-400 ring-opacity-50'
])

const imageClasses = computed(() => [
  isSmiling.value && 'brightness-110 contrast-110',
  isBlinking.value && 'opacity-80'
])

const speechBubbleClasses = computed(() => [
  'animate-fade-in-up'
])

const mascotStyle = computed(() => {
  if (!props.followCursor || !mousePosition.value.x || !mousePosition.value.y) return {}
  
  const containerRect = mascotContainer.value?.getBoundingClientRect()
  if (!containerRect) return {}
  
  const centerX = containerRect.left + containerRect.width / 2
  const centerY = containerRect.top + containerRect.height / 2
  
  const deltaX = mousePosition.value.x - centerX
  const deltaY = mousePosition.value.y - centerY
  
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const maxDistance = 200
  
  if (distance > maxDistance) return {}
  
  const intensity = Math.min(distance / maxDistance, 1)
  const angle = Math.atan2(deltaY, deltaX)
  
  const eyeOffsetX = Math.cos(angle) * intensity * 8
  const eyeOffsetY = Math.sin(angle) * intensity * 8
  
  return {
    transform: `translate(${eyeOffsetX}px, ${eyeOffsetY}px)`
  }
})

// Методы
const trackMouse = (event: MouseEvent) => {
  if (!props.followCursor) return
  
  mousePosition.value = { x: event.clientX, y: event.clientY }
  lastMouseTime.value = Date.now()
  
  // Анимация движения
  isMoving.value = true
  setTimeout(() => {
    isMoving.value = false
  }, 300)
}

const speakRandomPhrase = () => {
  if (currentPhrase.value) return
  
  const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)]
  speakPhrase(randomPhrase)
}

const speakPhrase = (phrase: string) => {
  if (currentPhrase.value) return
  
  currentPhrase.value = phrase
  
  // Анимация улыбки
  isSmiling.value = true
  setTimeout(() => {
    isSmiling.value = false
  }, 2000)
  
  // Скрываем фразу через 4 секунды
  setTimeout(() => {
    currentPhrase.value = ''
  }, 4000)
}

const blink = () => {
  isBlinking.value = true
  setTimeout(() => {
    isBlinking.value = false
  }, 200)
}

const showActivityIndicator = () => {
  isActive.value = true
  if (activityTimer) clearTimeout(activityTimer)
  activityTimer = setTimeout(() => {
    isActive.value = false
  }, 2000)
}

const toggleMenu = () => {
  showMenu.value = !showMenu.value
  if (showMenu.value) {
    if (menuTimer) clearTimeout(menuTimer)
    menuTimer = setTimeout(() => {
      showMenu.value = false
    }, 5000)
  }
}

// Периодические реплики
const scheduleRandomPhrase = () => {
  if (!props.autoSpeak) return
  
  const intervals = [15000, 25000, 35000, 45000] // 15-45 секунд
  const randomInterval = intervals[Math.floor(Math.random() * intervals.length)]
  
  setTimeout(() => {
    if (!currentPhrase.value) {
      speakRandomPhrase()
    }
    scheduleRandomPhrase()
  }, randomInterval)
}

// Периодическое моргание
const scheduleBlinking = () => {
  if (blinkTimer) clearTimeout(blinkTimer)
  
  const intervals = [2000, 4000, 6000, 8000] // 2-8 секунд
  const randomInterval = intervals[Math.floor(Math.random() * intervals.length)]
  
  blinkTimer = setTimeout(() => {
    blink()
    scheduleBlinking()
  }, randomInterval)
}

// Хуки жизненного цикла
onMounted(() => {
  // Отслеживание мыши
  if (props.followCursor) {
    document.addEventListener('mousemove', trackMouse)
  }
  
  // Обработчики наведения
  if (mascotContainer.value) {
    mascotContainer.value.addEventListener('mouseenter', () => {
      isHovered.value = true
      showActivityIndicator()
      speakPhrase('Привет! 👋')
    })
    
    mascotContainer.value.addEventListener('mouseleave', () => {
      isHovered.value = false
    })
    
    // Двойной клик для меню
    mascotContainer.value.addEventListener('dblclick', (e) => {
      e.preventDefault()
      toggleMenu()
    })
  }
  
  // Запуск периодических функций
  setTimeout(() => {
    scheduleRandomPhrase()
    scheduleBlinking()
  }, 3000)
})

onUnmounted(() => {
  if (props.followCursor) {
    document.removeEventListener('mousemove', trackMouse)
  }
  
  // Очистка таймеров
  if (blinkTimer) clearTimeout(blinkTimer)
  if (activityTimer) clearTimeout(activityTimer)
  if (menuTimer) clearTimeout(menuTimer)
})

// Экспорт методов для родительского компонента
defineExpose({
  speakPhrase,
  speakRandomPhrase,
  blink,
  showActivityIndicator,
  toggleMenu
})

// Вспомогательная функция для позиционирования искорок
const getSparkleStyle = (index: number) => {
  const positions = [
    { top: '15%', left: '20%' },
    { top: '25%', right: '15%' },
    { top: '10%', left: '55%' },
    { bottom: '20%', left: '25%' },
    { bottom: '30%', right: '25%' },
    { top: '40%', left: '45%' },
    { top: '60%', left: '35%' },
    { bottom: '10%', left: '60%' }
  ]
  
  const delay = index * 0.15
  const position = positions[index - 1] || positions[0]
  
  return {
    ...position,
    animationDelay: `${delay}s`
  }
}
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out;
}

/* Кастомные анимации для маскота */
@keyframes mascot-bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.animate-mascot-bounce {
  animation: mascot-bounce 0.6s ease-in-out;
}

/* Анимация искорок */
@keyframes sparkle {
  0% {
    opacity: 0;
    transform: scale(0);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
  100% {
    opacity: 0;
    transform: scale(0);
  }
}

.animate-sparkle {
  animation: sparkle 1s ease-in-out infinite;
}

/* Анимация моргания */
@keyframes blink {
  0%, 90%, 100% {
    opacity: 1;
  }
  95% {
    opacity: 0;
  }
}

.animate-blink {
  animation: blink 0.3s ease-in-out;
}
</style>

