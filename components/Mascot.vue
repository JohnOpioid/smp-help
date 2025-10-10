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
          class="w-24 h-24 object-contain drop-shadow-lg"
          :class="imageClasses"
        />
        
        <!-- Анимация улыбки (светящиеся частицы) -->
        <div 
          v-if="isSmiling"
          class="absolute inset-0 pointer-events-none"
        >
          <div 
            v-for="i in 6" 
            :key="i"
            class="absolute w-1 h-1 bg-yellow-300 rounded-full animate-ping"
            :style="getSparkleStyle(i)"
          ></div>
        </div>
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
    </div>
  </div>
</template>

<script setup lang="ts">
interface MascotProps {
  image?: string
}

const props = withDefaults(defineProps<MascotProps>(), {
  image: '/maskot.png'
})

// Реактивные данные
const mascotContainer = ref<HTMLElement>()
const mascot = ref<HTMLElement>()
const mousePosition = ref({ x: 0, y: 0 })
const isSmiling = ref(false)
const currentPhrase = ref('')
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
  'Я рядом, если нужна помощь!'
]

// Состояния анимации
const isHovered = ref(false)
const isMoving = ref(false)
const lastMouseTime = ref(0)

// Вычисляемые свойства
const mascotClasses = computed(() => [
  isHovered.value && 'scale-110',
  isMoving.value && 'animate-bounce',
  isSmiling.value && 'animate-pulse'
])

const imageClasses = computed(() => [
  isSmiling.value && 'brightness-110 contrast-110'
])

const speechBubbleClasses = computed(() => [
  'animate-fade-in-up'
])

const mascotStyle = computed(() => {
  if (!mousePosition.value.x || !mousePosition.value.y) return {}
  
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
  currentPhrase.value = randomPhrase
  
  // Анимация улыбки
  isSmiling.value = true
  setTimeout(() => {
    isSmiling.value = false
  }, 2000)
  
  // Скрываем фразу через 3 секунды
  setTimeout(() => {
    currentPhrase.value = ''
  }, 3000)
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

// Периодические реплики
const scheduleRandomPhrase = () => {
  const intervals = [15000, 25000, 35000, 45000] // 15-45 секунд
  const randomInterval = intervals[Math.floor(Math.random() * intervals.length)]
  
  setTimeout(() => {
    if (!currentPhrase.value) {
      speakRandomPhrase()
    }
    scheduleRandomPhrase()
  }, randomInterval)
}

// Хуки жизненного цикла
onMounted(() => {
  // Отслеживание мыши
  document.addEventListener('mousemove', trackMouse)
  
  // Обработчики наведения
  if (mascotContainer.value) {
    mascotContainer.value.addEventListener('mouseenter', () => {
      isHovered.value = true
      speakPhrase('Привет! 👋')
    })
    
    mascotContainer.value.addEventListener('mouseleave', () => {
      isHovered.value = false
    })
  }
  
  // Запуск периодических реплик
  setTimeout(() => {
    scheduleRandomPhrase()
  }, 5000) // Первая реплика через 5 секунд
})

onUnmounted(() => {
  document.removeEventListener('mousemove', trackMouse)
})

// Экспорт методов для родительского компонента
defineExpose({
  speakPhrase,
  speakRandomPhrase
})

// Вспомогательная функция для позиционирования искорок
const getSparkleStyle = (index: number) => {
  const positions = [
    { top: '20%', left: '25%' },
    { top: '30%', right: '20%' },
    { top: '15%', left: '60%' },
    { bottom: '25%', left: '30%' },
    { bottom: '35%', right: '30%' },
    { top: '45%', left: '50%' }
  ]
  
  const delay = index * 0.2
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
</style>

