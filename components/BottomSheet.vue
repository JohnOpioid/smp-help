<template>
  <transition name="fade">
    <div v-if="modelValue" class="fixed inset-0 z-50 sm:hidden" :class="{ 'bottomsheet-active': modelValue }">
      <div class="absolute inset-0 bg-black/40" @click="close" />
      <div class="absolute inset-0 flex items-end p-2 sm:p-4">
        <div 
          ref="sheetRef" 
          tabindex="-1"
          class="bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-600 shadow-xl flex flex-col will-change-transform outline-none transition-height max-w-5xl w-full mx-auto overflow-hidden" 
          :class="{ 'dragging': isDragging }"
          :style="{ 
            transform: `translateY(${dragOffset}px)`,
            height: `${sheetHeight}px`,
            maxHeight: '90vh'
          }"
        >
          <!-- Заголовок с ручкой для перетаскивания -->
          <div 
            ref="headerRef" 
            class="py-2 px-3 border-b border-slate-200 dark:border-slate-600 flex-shrink-0 cursor-grab active:cursor-grabbing touch-none"
            @touchstart="onDragStart"
            @touchmove="onDragMove"
            @touchend="onDragEnd"
            @mousedown="onDragStart"
            @mousemove="onDragMove"
            @mouseup="onDragEnd"
            @mouseleave="onDragEnd"
          >
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
          <div 
            ref="contentRef" 
            class="flex-1" 
            :class="{ 'overflow-y-auto': isExpanded, 'overflow-hidden': !isExpanded }"
            @touchstart="onContentDragStart"
            @touchmove="onContentDragMove"
            @touchend="onContentDragEnd"
            @mousedown="onContentDragStart"
            @mousemove="onContentDragMove"
            @mouseup="onContentDragEnd"
            @mouseleave="onContentDragEnd"
          >
            <slot />
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

// Глобальная проверка на дублирование BottomSheet
const globalBottomSheetCount = ref(0)

const sheetRef = ref<HTMLDivElement | null>(null)
const headerRef = ref<HTMLDivElement | null>(null)
const contentRef = ref<HTMLDivElement | null>(null)
const dragOffset = ref(0)
const startY = ref(0)
const isDragging = ref(false)
const sheetHeight = ref(400) // Начальная высота по умолчанию
const maxHeight = ref(0) // Максимальная высота контента
const isExpanded = ref(false) // Флаг расширенного состояния
const isScrollDisabled = ref(false) // Флаг для отслеживания состояния скролла
const savedScrollPosition = ref(0) // Сохраненная позиция скролла
const isScrollingToTop = ref(false) // Флаг скролла наверх
const isInitialized = ref(false) // Флаг инициализации

// Вспомогательная функция для безопасного предотвращения события
function safePreventDefault(e: TouchEvent | MouseEvent) {
  try {
    if (e.cancelable && e.defaultPrevented === false) {
      e.preventDefault()
    }
  } catch (error) {
    // Игнорируем ошибки предотвращения событий
  }
}

function close() {
  // Проверяем, что это единственный активный BottomSheet
  if (globalBottomSheetCount.value > 1) {
    console.warn('Обнаружено дублирование BottomSheet, закрываем все')
    // Закрываем все BottomSheet
    document.querySelectorAll('.bottomsheet-active').forEach(el => {
      el.remove()
    })
    globalBottomSheetCount.value = 0
  }
  
  emit('update:modelValue', false)
  emit('close')
  // Восстанавливаем скролл при закрытии
  enableBodyScroll()
}

function onDragStart(e: TouchEvent | MouseEvent) {
  // Предотвращаем множественные события
  if (isDragging.value) return
  
  startY.value = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragOffset.value = 0
  isDragging.value = true
  
  // Добавляем класс для предотвращения скролла страницы
  document.body.classList.add('bottomsheet-dragging')
}

function onDragMove(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return
  
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const dy = clientY - startY.value
  
  // Если тянем вниз - плавно уменьшаем высоту
  if (dy > 0) {
    safePreventDefault(e)
    
    if (isExpanded.value) {
      // Если расширен, сначала уменьшаем высоту
      const downwardDistance = dy
      const newHeight = maxHeight.value - downwardDistance
      
      // Ограничиваем минимальной высотой
      sheetHeight.value = Math.max(newHeight, getInitialHeight())
      
      // Если достигли начальной высоты, переключаемся в обычный режим
      if (newHeight <= getInitialHeight()) {
        isExpanded.value = false
        sheetHeight.value = getInitialHeight()
      }
    } else {
      // Если не расширен, показываем визуальную обратную связь
      dragOffset.value = Math.max(0, dy)
    }
  } else {
    // Если тянем вверх - расширяем
    safePreventDefault(e)
    
    if (!isExpanded.value) {
      const initialHeight = getInitialHeight()
      const upwardDistance = Math.abs(dy)
      
      const newHeight = initialHeight + upwardDistance
      sheetHeight.value = Math.min(newHeight, maxHeight.value)
      
      if (newHeight >= maxHeight.value) {
        isExpanded.value = true
        sheetHeight.value = maxHeight.value
      }
    }
    
    dragOffset.value = 0
  }
}

function onDragEnd(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return
  
  // Убираем класс для восстановления скролла страницы
  document.body.classList.remove('bottomsheet-dragging')
  
  const threshold = 100 // Порог в пикселях для закрытия
  const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY
  const dy = clientY - startY.value
  
  if (dy > 0) {
    // Если тянем вниз
    if (isExpanded.value) {
      // Если расширен, проверяем, нужно ли закрыть
      if (dy > threshold) {
        close()
      } else {
        // Возвращаемся к начальной высоте
        isExpanded.value = false
        sheetHeight.value = getInitialHeight()
      }
    } else {
      // Если не расширен, проверяем порог для закрытия
      if (dragOffset.value > threshold) {
        close()
      } else {
        // Возвращаемся к исходному состоянию
        dragOffset.value = 0
      }
    }
  } else {
    // Если тянем вверх - определяем финальное состояние
    if (!isExpanded.value) {
      const upwardDistance = Math.abs(dy)
      
      if (upwardDistance > 100) {
        isExpanded.value = true
        sheetHeight.value = maxHeight.value
      } else {
        sheetHeight.value = getInitialHeight()
      }
    }
    
    dragOffset.value = 0
  }
  
  isDragging.value = false
}

// Функции для перетаскивания контента (только для расширения)
function onContentDragStart(e: TouchEvent | MouseEvent) {
  // Разрешаем перетаскивание только если не расширен
  if (isExpanded.value) return
  
  // Предотвращаем множественные события
  if (isDragging.value) return
  
  // Проверяем, не скроллится ли контент
  const contentEl = contentRef.value
  if (contentEl && contentEl.scrollTop > 0) {
    return // Если контент уже прокручен, не начинаем перетаскивание
  }
  
  startY.value = 'touches' in e ? e.touches[0].clientY : e.clientY
  dragOffset.value = 0
  isDragging.value = true
  
  // Добавляем класс для предотвращения скролла страницы
  document.body.classList.add('bottomsheet-dragging')
}

function onContentDragMove(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return
  
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  const dy = clientY - startY.value
  
  // Проверяем состояние скролла
  const contentEl = contentRef.value
  const isScrolled = contentEl && contentEl.scrollTop > 0
  
  if (dy < 0) {
    // Свайп вверх - расширение
    if (!isScrolled && !isExpanded.value) {
      safePreventDefault(e)
      
      const initialHeight = getInitialHeight()
      const upwardDistance = Math.abs(dy)
      const newHeight = initialHeight + upwardDistance
      
      sheetHeight.value = Math.min(newHeight, maxHeight.value)
      
      if (newHeight >= maxHeight.value) {
        isExpanded.value = true
        sheetHeight.value = maxHeight.value
      }
    }
  } else if (dy > 0) {
    // Свайп вниз
    if (isScrolled) {
      // Если контент прокручен, сначала прокручиваем наверх
      safePreventDefault(e)
      
      if (contentEl) {
        const scrollAmount = Math.min(dy * 1.5, contentEl.scrollTop) // Ускоряем скролл
        contentEl.scrollTop -= scrollAmount
        
        // Если достигли верха, начинаем закрывать BottomSheet
        if (contentEl.scrollTop <= 0) {
          isScrollingToTop.value = true
          
          if (isExpanded.value) {
            const downwardDistance = dy - (contentEl.scrollTop + scrollAmount)
            const newHeight = maxHeight.value - downwardDistance
            
            // Убеждаемся, что высота не меньше начальной
            sheetHeight.value = Math.max(newHeight, getInitialHeight())
            
            if (newHeight <= getInitialHeight()) {
              isExpanded.value = false
              sheetHeight.value = getInitialHeight()
            }
          } else {
            dragOffset.value = Math.max(0, dy - scrollAmount)
          }
        }
      }
    } else {
      // Если контент наверху, закрываем BottomSheet
      safePreventDefault(e)
      
      if (isExpanded.value) {
        // Если расширен, уменьшаем высоту
        const downwardDistance = dy
        const newHeight = maxHeight.value - downwardDistance
        
        // Убеждаемся, что высота не меньше начальной
        sheetHeight.value = Math.max(newHeight, getInitialHeight())
        
        if (newHeight <= getInitialHeight()) {
          isExpanded.value = false
          sheetHeight.value = getInitialHeight()
        }
      } else {
        // Если не расширен, показываем визуальную обратную связь
        dragOffset.value = Math.max(0, dy)
      }
    }
  }
}

function onContentDragEnd(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return
  
  // Убираем класс для восстановления скролла страницы
  document.body.classList.remove('bottomsheet-dragging')
  
  const threshold = 100
  const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY
  const dy = clientY - startY.value
  
  // Проверяем состояние скролла
  const contentEl = contentRef.value
  const isScrolled = contentEl && contentEl.scrollTop > 0
  
  if (dy > 0) {
    // Свайп вниз
    if (isScrolled || isScrollingToTop.value) {
      // Если контент был прокручен, завершаем скролл наверх
      if (contentEl) {
        contentEl.scrollTo({ top: 0, behavior: 'smooth' })
        isScrollingToTop.value = false
      }
    } else {
      // Если контент наверху, закрываем BottomSheet
      if (isExpanded.value) {
        if (dy > threshold) {
          close()
        } else {
          isExpanded.value = false
          sheetHeight.value = getInitialHeight()
        }
      } else {
        if (dragOffset.value > threshold) {
          close()
        } else {
          dragOffset.value = 0
        }
      }
    }
  } else {
    // Свайп вверх
    if (!isScrolled && !isExpanded.value) {
      const upwardDistance = Math.abs(dy)
      
      if (upwardDistance > 100) {
        isExpanded.value = true
        sheetHeight.value = maxHeight.value
      } else {
        sheetHeight.value = getInitialHeight()
      }
    }
    
    dragOffset.value = 0
  }
  
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
  const minHeight = Math.max(300, getInitialHeight()) // Минимальная высота не меньше начальной
  
  return Math.max(minHeight, Math.min(totalHeight, maxHeight))
}

// Функция для получения начальной высоты (половина экрана)
function getInitialHeight() {
  return Math.min(window.innerHeight * 0.5, 400)
}

// Обновляем высоту при изменении контента
function updateSheetHeight() {
  nextTick(() => {
    const measuredHeight = measureContentHeight()
    // Убеждаемся, что максимальная высота не меньше начальной высоты
    maxHeight.value = Math.max(measuredHeight, getInitialHeight())
    
    // При открытии всегда устанавливаем начальную высоту (половина экрана)
    if (!isExpanded.value) {
      sheetHeight.value = getInitialHeight()
    }
  })
}

// Экспортируем методы для внешнего использования
defineExpose({
  updateHeight: updateSheetHeight
})

// Функции для управления скроллом страницы
function disableBodyScroll() {
  if (process.client && !isScrollDisabled.value) {
    // Проверяем, нет ли уже активных BottomSheet
    const activeSheets = document.querySelectorAll('.bottomsheet-active')
    if (activeSheets.length > 1) {
      console.warn('Обнаружено дублирование BottomSheet, закрываем лишние')
      // Закрываем все кроме первого
      for (let i = 1; i < activeSheets.length; i++) {
        activeSheets[i].remove()
      }
    }
    
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
    // Проверяем на дублирование перед открытием
    const activeSheets = document.querySelectorAll('.bottomsheet-active')
    if (activeSheets.length > 0) {
      console.warn('Обнаружен активный BottomSheet, закрываем его перед открытием нового')
      activeSheets.forEach(el => el.remove())
    }
    
    // Сбрасываем состояние при открытии
    isExpanded.value = false
    dragOffset.value = 0
    isInitialized.value = true
    
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

// Обработка случая, когда пользователь отпускает палец/мышь вне элемента
function handleTouchEnd(e: TouchEvent | MouseEvent) {
  if (isDragging.value) {
    // Определяем, откуда было начато перетаскивание
    const target = e.target as HTMLElement
    const isContentDrag = contentRef.value?.contains(target)
    
    if (isContentDrag) {
      onContentDragEnd(e)
    } else {
      onDragEnd(e)
    }
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
  document.addEventListener('mouseup', handleTouchEnd, { passive: true })
  
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', handleEscape)
    document.removeEventListener('touchend', handleTouchEnd)
    document.removeEventListener('mouseup', handleTouchEnd)
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

.transition-height {
  transition: height 0.2s ease-out;
}

/* Отключаем анимацию во время перетаскивания */
.transition-height.dragging {
  transition: none;
}

/* Предотвращаем скролл страницы во время перетаскивания */
:global(.bottomsheet-dragging) {
  overflow: hidden !important;
  position: fixed !important;
  width: 100% !important;
  height: 100% !important;
}

/* Улучшаем touch события */
.touch-none {
  touch-action: none;
}
</style>
