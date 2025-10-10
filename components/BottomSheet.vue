<template>
  <transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 sm:hidden">
      <div class="absolute inset-0 bg-black/40" @click="close" />
      <div class="absolute inset-x-0 bottom-0">
        <div 
          ref="sheetRef" 
          tabindex="-1"
          class="bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-t-2xl border-t border-slate-200 dark:border-slate-600 shadow-xl flex flex-col will-change-transform outline-none" 
          :style="{ 
            transform: `translateY(${dragOffset}px)`,
            height: `${sheetHeight}px`,
            maxHeight: '90vh'
          }"
          @touchstart="onDragStart"
          @touchmove="onDragMove"
          @touchend="onDragEnd"
        >
          <!-- Заголовок с ручкой для перетаскивания -->
          <div ref="headerRef" class="py-2 px-3 border-b border-slate-200 dark:border-slate-600 flex-shrink-0">
            <div class="flex items-center justify-center select-none">
              <div
                class="w-10 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"
              />
            </div>
            <div v-if="title || subtitle" class="mt-2 text-center">
              <p v-if="title" class="text-lg font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{{ title }}</p>
              <p v-if="subtitle" class="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ subtitle }}</p>
            </div>
          </div>
          
          <!-- Слот для контента -->
          <div ref="contentRef" class="flex-1 overflow-y-auto">
            <slot />
          </div>
          
          <!-- Футер с кнопками -->
          <div v-if="$slots.footer" class="border-t border-slate-200 dark:border-slate-600 p-4 flex-shrink-0">
            <slot name="footer" />
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  title?: string
  subtitle?: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const sheetRef = ref<HTMLDivElement | null>(null)
const headerRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)
const dragOffset = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const sheetHeight = ref(400) // Начальная высота по умолчанию
const isScrollDisabled = ref(false) // Флаг для отслеживания состояния скролла
const savedScrollPosition = ref(0) // Сохраненная позиция скролла

function close() {
  emit('update:modelValue', false)
  emit('close')
  // Восстанавливаем скролл при закрытии
  enableBodyScroll()
}

function onDragStart(e: TouchEvent) {
  startY.value = e.touches[0].clientY
  dragOffset.value = 0
  isDragging.value = true
}

function onDragMove(e: TouchEvent) {
  if (!isDragging.value) return
  
  const dy = e.touches[0].clientY - startY.value
  
  // Предотвращаем скролл только если пользователь тянет вниз
  if (dy > 0) {
    e.preventDefault()
  }
  
  dragOffset.value = Math.max(0, dy)
}

function onDragEnd(e: TouchEvent) {
  if (!isDragging.value) return
  
  const threshold = 100 // Порог в пикселях для закрытия
  if (dragOffset.value > threshold) {
    close()
  }
  dragOffset.value = 0
  isDragging.value = false
}

// Функция для измерения высоты контента
function measureContentHeight() {
  if (!contentRef.value || !headerRef.value) return 400

  // Проверяем, есть ли карта в контенте
  const hasMap = contentRef.value.querySelector('.ymap-container') || 
                 contentRef.value.querySelector('[class*="ymap"]') ||
                 contentRef.value.innerHTML.includes('ymap')

  if (hasMap) {
    // Для контента с картой используем большую высоту
    const headerHeight = headerRef.value.offsetHeight
    const mapHeight = 400 // Фиксированная высота карты
    const contentHeight = contentRef.value.offsetHeight - mapHeight // Высота остального контента
    const totalHeight = headerHeight + contentHeight + mapHeight + 32 // 32px для отступов
    
    const maxHeight = window.innerHeight * 0.85 // 85% от высоты экрана для карты
    const minHeight = 500 // Минимальная высота для карты
    
    return Math.max(minHeight, Math.min(totalHeight, maxHeight))
  }

  // Для обычного контента используем стандартную логику
  const tempDiv = document.createElement('div')
  tempDiv.style.position = 'absolute'
  tempDiv.style.visibility = 'hidden'
  tempDiv.style.width = contentRef.value.offsetWidth + 'px'
  tempDiv.style.padding = '16px'
  tempDiv.innerHTML = contentRef.value.innerHTML
  
  document.body.appendChild(tempDiv)
  
  const contentHeight = tempDiv.offsetHeight
  const headerHeight = headerRef.value.offsetHeight
  
  document.body.removeChild(tempDiv)
  
  // Добавляем отступы и ограничиваем максимальной высотой экрана
  const totalHeight = contentHeight + headerHeight + 32 // 32px для отступов
  const maxHeight = window.innerHeight * 0.9 // 90% от высоты экрана
  const minHeight = 300 // Минимальная высота
  
  return Math.max(minHeight, Math.min(totalHeight, maxHeight))
}

// Обновляем высоту при изменении контента
function updateSheetHeight() {
  nextTick(() => {
    sheetHeight.value = measureContentHeight()
  })
}

// Экспортируем методы для внешнего использования
defineExpose({
  updateHeight: updateSheetHeight
})

// Функции для управления скроллом страницы
function disableBodyScroll() {
  if (process.client && !isScrollDisabled.value) {
    // Сохраняем текущую позицию скролла
    savedScrollPosition.value = window.scrollY
    
    // Применяем стили для блокировки скролла
    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${savedScrollPosition.value}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    
    isScrollDisabled.value = true
  }
}

function enableBodyScroll() {
  if (process.client && isScrollDisabled.value) {
    // Восстанавливаем стили
    document.body.style.overflow = ''
    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.left = ''
    document.body.style.right = ''
    document.body.style.width = ''
    
    // Небольшая задержка для применения стилей, затем возвращаемся к сохраненной позиции
    nextTick(() => {
      window.scrollTo(0, savedScrollPosition.value)
    })
    
    isScrollDisabled.value = false
  }
}

// Следим за изменениями modelValue для обновления высоты
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    // Отключаем скролл страницы
    disableBodyScroll()
    
    // Небольшая задержка для рендеринга контента
    setTimeout(updateSheetHeight, 50)
    
    // Фокусируем элемент для корректной работы touch событий
    nextTick(() => {
      setTimeout(() => {
        if (sheetRef.value) {
          sheetRef.value.focus()
        }
      }, 100) // Дополнительная задержка для полного рендеринга
    })
  } else {
    // Включаем скролл страницы при закрытии с небольшой задержкой
    setTimeout(() => {
      enableBodyScroll()
    }, 50) // Задержка для завершения анимации закрытия
  }
})

// Обработка случая, когда пользователь отпускает палец вне элемента
function handleTouchEnd(e: TouchEvent) {
  if (isDragging.value) {
    onDragEnd(e)
  }
}

// Закрытие по Escape
onMounted(() => {
  const handleEscape = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && props.modelValue) {
      close()
    }
  }
  
  document.addEventListener('keydown', handleEscape)
  document.addEventListener('touchend', handleTouchEnd, { passive: true })
  
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleEscape)
    document.removeEventListener('touchend', handleTouchEnd)
    // Восстанавливаем скролл при размонтировании компонента
    enableBodyScroll()
  })
})
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
