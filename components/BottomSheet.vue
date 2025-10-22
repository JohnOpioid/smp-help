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
            height: isExpanded ? `${maxHeight}px` : 'auto',
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
            class="flex-shrink-0" 
            :class="{ 
              'overflow-y-auto': isExpanded || needsScroll, 
              'overflow-hidden': !isExpanded && !needsScroll
            }"
            :style="{ 
              maxHeight: isExpanded || needsScroll ? `${maxContentHeight}px` : 'auto',
              height: isExpanded || needsScroll ? `${maxContentHeight}px` : 'auto'
            }"
            @touchstart="onContentDragStart"
            @touchmove="onContentDragMove"
            @touchend="onContentDragEnd"
            @mousedown="onContentDragStart"
            @mousemove="onContentDragMove"
            @mouseup="onContentDragEnd"
            @mouseleave="onContentDragEnd"
          >
            <!-- Скелетон во время загрузки -->
            <div v-if="loading" class="p-4 pb-6">
              <div class="space-y-4">
                <!-- Скелетон для заголовка -->
                <div v-if="title" class="space-y-2">
                  <USkeleton class="h-6 w-3/4" />
                  <USkeleton class="h-4 w-1/2" />
                </div>
                
                <!-- Скелетон для основного контента -->
                <div class="space-y-3">
                  <div v-for="i in skeletonLines" :key="i" class="space-y-2">
                    <USkeleton class="h-4 w-full" />
                    <USkeleton class="h-4 w-5/6" />
                    <USkeleton class="h-4 w-4/6" />
                  </div>
                </div>
                
                <!-- Скелетон для кнопок -->
                <div class="mt-6">
                  <div class="flex gap-2">
                    <USkeleton class="h-10 flex-1" />
                    <USkeleton class="h-10 flex-1" />
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Основной контент -->
            <div v-else>
              <slot />
            </div>
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
  loading?: boolean
  skeletonLines?: number
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'close'): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  skeletonLines: 3
})
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
const needsScroll = ref(false) // Флаг необходимости скролла

// Computed для проверки длинного контента
const hasLongContent = computed(() => {
  if (process.client && contentRef.value) {
    const availableHeight = window.innerHeight * 0.9
    const headerHeight = headerRef.value?.offsetHeight || 60
    const contentAvailableHeight = availableHeight - headerHeight
    return contentRef.value.scrollHeight > contentAvailableHeight
  }
  return false
})

// Computed для максимальной высоты контента
const maxContentHeight = computed(() => {
  if (process.client) {
    const availableHeight = window.innerHeight * 0.9 // 90vh
    const headerHeight = headerRef.value?.offsetHeight || 60
    return availableHeight - headerHeight
  }
  return 400 // Fallback для SSR
})

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
  
  // Обрабатываем только свайп вниз для закрытия BottomSheet
  if (dy > 0) {
    safePreventDefault(e)
    dragOffset.value = Math.max(0, dy)
  }
  // Полностью игнорируем свайп вверх - не показываем никакой визуальной обратной связи
}

function onDragEnd(e: TouchEvent | MouseEvent) {
  if (!isDragging.value) return
  
  // Убираем класс для восстановления скролла страницы
  document.body.classList.remove('bottomsheet-dragging')
  
  const threshold = 100 // Порог в пикселях для закрытия
  const clientY = 'changedTouches' in e ? e.changedTouches[0].clientY : e.clientY
  const dy = clientY - startY.value
  
  // Обрабатываем только свайп вниз для закрытия
  if (dy > 0) {
    if (dragOffset.value > threshold) {
      close()
    } else {
      // Возвращаемся к исходному состоянию
      dragOffset.value = 0
    }
  } else {
    // Полностью игнорируем свайп вверх - просто сбрасываем состояние
    dragOffset.value = 0
  }
  
  isDragging.value = false
}

// Функции для перетаскивания контента (только для расширения)
function onContentDragStart(e: TouchEvent | MouseEvent) {
  // Разрешаем перетаскивание только если не расширен ИЛИ если нужен скролл
  if (isExpanded.value && !needsScroll.value) return
  
  // Предотвращаем множественные события
  if (isDragging.value) return
  
  // Проверяем состояние скролла
  const contentEl = contentRef.value
  const isScrolled = contentEl && contentEl.scrollTop > 0
  const canScroll = contentEl && contentEl.scrollHeight > contentEl.clientHeight
  
  // Начинаем перетаскивание только если:
  // 1. Контент не может скроллиться (короткий контент)
  // 2. ИЛИ контент может скроллиться, но уже наверху (scrollTop = 0)
  if (canScroll && isScrolled) {
    return // Если контент может скроллиться и прокручен, не начинаем перетаскивание
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
  const canScroll = contentEl && contentEl.scrollHeight > contentEl.clientHeight
  
  // Если тянем вверх - позволяем браузеру обрабатывать скролл естественным образом
  if (dy < 0 && canScroll) {
    return // Позволяем браузеру обрабатывать скролл естественным образом
  }
  
  // Обрабатываем только свайп вниз для закрытия
  if (dy > 0) {
    safePreventDefault(e)
    
    // Проверяем текущую позицию скролла (не изменяем её)
    const currentScrollTop = contentEl ? contentEl.scrollTop : 0
    
    if (currentScrollTop > 0) {
      // Если контент прокручен, НЕ показываем визуальную обратную связь
      // Пользователь должен сам прокрутить контент к началу
      dragOffset.value = 0
    } else {
      // Если контент уже наверху, показываем визуальную обратную связь для закрытия
      dragOffset.value = Math.max(0, dy)
    }
  }
  // Полностью игнорируем свайп вверх - не обрабатываем его вообще
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
  const currentScrollTop = contentEl ? contentEl.scrollTop : 0
  
  if (dy > 0) {
    // Свайп вниз
    if (currentScrollTop > 0) {
      // Если контент прокручен, НЕ закрываем модалку
      // Пользователь должен сам прокрутить контент к началу
      dragOffset.value = 0
    } else {
      // Если контент наверху, закрываем BottomSheet только если dragOffset достаточно большой
      if (dragOffset.value > threshold) {
        close()
      } else {
        dragOffset.value = 0
      }
    }
  } else {
    // Полностью игнорируем свайп вверх - просто сбрасываем состояние
    dragOffset.value = 0
  }
  
  isDragging.value = false
}

// Функция для измерения высоты контента
function measureContentHeight() {
  if (!contentRef.value || !headerRef.value) return 400

  // Если контент загружается, используем фиксированную высоту для скелетона
  if (props.loading) {
    const headerHeight = headerRef.value.offsetHeight
    const skeletonHeight = 200 + (props.skeletonLines * 60) // Примерная высота скелетона
    const totalHeight = headerHeight + skeletonHeight + 32 // 32px для отступов
    const maxHeight = window.innerHeight * 0.7 // 70% от высоты экрана для скелетона
    const minHeight = Math.max(300, getInitialHeight())
    
    return Math.max(minHeight, Math.min(totalHeight, maxHeight))
  }

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

  // Для обычного контента используем реальные размеры
  const headerHeight = headerRef.value.offsetHeight
  
  // Получаем реальную высоту контента
  let contentHeight = 0
  
  // Если контент уже отрендерен, используем его реальную высоту
  if (contentRef.value.children.length > 0) {
    // Создаем временный элемент для точного измерения
    const tempDiv = document.createElement('div')
    tempDiv.style.position = 'absolute'
    tempDiv.style.visibility = 'hidden'
    tempDiv.style.width = contentRef.value.offsetWidth + 'px'
    tempDiv.style.top = '-9999px'
    tempDiv.style.left = '-9999px'
    
    // Копируем все стили контента
    const computedStyle = window.getComputedStyle(contentRef.value)
    tempDiv.style.padding = computedStyle.padding
    tempDiv.style.margin = computedStyle.margin
    tempDiv.style.border = computedStyle.border
    tempDiv.style.boxSizing = computedStyle.boxSizing
    
    // Копируем HTML контента
    tempDiv.innerHTML = contentRef.value.innerHTML
    
    document.body.appendChild(tempDiv)
    
    // Измеряем реальную высоту
    contentHeight = tempDiv.scrollHeight
    
    // Удаляем временный элемент
    document.body.removeChild(tempDiv)
    
    console.log('📏 Измеренная высота контента:', contentHeight)
  } else {
    // Если контент еще не отрендерен, используем минимальную высоту
    contentHeight = 300
  }
  
  // Добавляем отступы и определяем финальную высоту
  const totalHeight = contentHeight + headerHeight + 32 // 32px для отступов
  const maxHeight = window.innerHeight * 0.9 // 90% от высоты экрана
  const minHeight = Math.max(300, getInitialHeight()) // Минимальная высота не меньше начальной
  
  // Если контент больше доступной высоты, возвращаем максимальную высоту для включения скролла
  if (totalHeight > maxHeight) {
    console.log('📏 Контент превышает доступную высоту, включаем скролл:', {
      contentHeight,
      headerHeight,
      totalHeight,
      maxHeight,
      needsScroll: true
    })
    return maxHeight // Возвращаем максимальную высоту для включения скролла
  }
  
  console.log('📏 Измерение высоты BottomSheet:', {
    contentHeight,
    headerHeight,
    totalHeight,
    maxHeight,
    minHeight,
    finalHeight: Math.max(minHeight, Math.min(totalHeight, maxHeight))
  })
  
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
    const initialHeight = getInitialHeight()
    
    // Убеждаемся, что максимальная высота не меньше начальной высоты
    maxHeight.value = Math.max(measuredHeight, initialHeight)
    
    // Определяем, нужен ли скролл
    // Если контент больше доступной высоты (90vh), включаем скролл
    const availableHeight = window.innerHeight * 0.9 // 90vh
    const headerHeight = headerRef.value?.offsetHeight || 60
    const contentAvailableHeight = availableHeight - headerHeight
    
    // Принудительно включаем скролл если контент длинный
    const isLongContent = contentRef.value && contentRef.value.scrollHeight > contentAvailableHeight
    
    // needsScroll должен быть true если контент больше доступной высоты ИЛИ если это длинный контент
    needsScroll.value = measuredHeight > availableHeight || !!isLongContent
    
    // Если контент длинный, автоматически переходим в расширенный режим
    if (isLongContent && !isExpanded.value) {
      isExpanded.value = true
      console.log('🔧 Автоматически включен расширенный режим для длинного контента')
      
      // Принудительно обновляем DOM
      nextTick(() => {
        if (contentRef.value) {
          contentRef.value.style.maxHeight = `${maxContentHeight.value}px`
          contentRef.value.style.height = `${maxContentHeight.value}px`
          contentRef.value.classList.add('overflow-y-auto')
          contentRef.value.classList.remove('overflow-hidden')
          console.log('🔧 Принудительно применены стили скролла')
        }
      })
    }
    
    console.log('📏 Обновление высоты BottomSheet:', {
      measuredHeight,
      maxHeight: maxHeight.value,
      isExpanded: isExpanded.value,
      needsScroll: needsScroll.value,
      contentAvailableHeight,
      availableHeight,
      shouldHaveScroll: measuredHeight > availableHeight,
      isLongContent,
      scrollHeight: contentRef.value?.scrollHeight,
      offsetHeight: contentRef.value?.offsetHeight,
      cssClasses: {
        'overflow-y-auto': isExpanded.value || needsScroll.value,
        'overflow-hidden': !isExpanded.value && !needsScroll.value
      },
      inlineStyles: {
        maxHeight: isExpanded.value ? '90vh' : 'auto',
        height: isExpanded.value ? '90vh' : 'auto'
      }
    })
  })
}

// Дополнительный метод для принудительного обновления высоты
function forceUpdateHeight() {
  if (props.modelValue && contentRef.value) {
    // Даем время для полного рендеринга контента
    setTimeout(() => {
      updateSheetHeight()
    }, 200)
  }
}

// Экспортируем методы для внешнего использования
defineExpose({
  updateHeight: updateSheetHeight,
  forceUpdateHeight
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
    
    // Дополнительное обновление через больший интервал для длинного контента
    setTimeout(() => {
      if (props.modelValue && contentRef.value) {
        updateSheetHeight()
        // Принудительно обновляем высоту еще раз для длинного контента
        setTimeout(updateSheetHeight, 100)
        
        // Принудительная проверка скролла
        setTimeout(() => {
          if (contentRef.value && contentRef.value.scrollHeight > window.innerHeight * 0.6) {
            needsScroll.value = true
            isExpanded.value = true
            
            // Принудительно применяем стили
            nextTick(() => {
              if (contentRef.value) {
                contentRef.value.style.maxHeight = `${maxContentHeight.value}px`
                contentRef.value.style.height = `${maxContentHeight.value}px`
                contentRef.value.classList.add('overflow-y-auto')
                contentRef.value.classList.remove('overflow-hidden')
              }
            })
            
            console.log('🔧 Принудительно включен скролл и расширенный режим при открытии для длинного контента')
          }
        }, 200)
      }
    }, 300)
    
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

// Следим за изменениями состояния загрузки для автоматической подстройки высоты
watch(() => props.loading, (newLoading, oldLoading) => {
  // Если состояние загрузки изменилось, обновляем высоту
  if (newLoading !== oldLoading && props.modelValue) {
    nextTick(() => {
      setTimeout(updateSheetHeight, 100) // Небольшая задержка для рендеринга скелетона
    })
  }
})

// Следим за изменениями контента для автоматической подстройки высоты
watch(() => contentRef.value?.children.length, (newLength, oldLength) => {
  // Если количество дочерних элементов изменилось, обновляем высоту
  if (newLength !== oldLength && props.modelValue && !props.loading) {
    nextTick(() => {
      setTimeout(updateSheetHeight, 150) // Увеличиваем задержку для полного рендеринга контента
      
      // Дополнительная проверка для длинного контента
      setTimeout(() => {
        if (contentRef.value && contentRef.value.scrollHeight > window.innerHeight * 0.6) {
          needsScroll.value = true
          isExpanded.value = true
          console.log('🔧 Принудительно включен скролл и расширенный режим при изменении контента')
        }
      }, 300)
    })
  }
})

// Дополнительный watcher для отслеживания изменений в содержимом
watch(() => contentRef.value?.innerHTML, (newContent, oldContent) => {
  // Если содержимое изменилось, обновляем высоту
  if (newContent !== oldContent && props.modelValue && !props.loading) {
    nextTick(() => {
      setTimeout(updateSheetHeight, 200) // Задержка для полного рендеринга
      
      // Дополнительная проверка через больший интервал
      setTimeout(() => {
        if (contentRef.value && contentRef.value.scrollHeight > window.innerHeight * 0.6) {
          needsScroll.value = true
          isExpanded.value = true
          console.log('🔧 Принудительно включен скролл и расширенный режим для длинного контента')
        }
      }, 500)
    })
  }
})

// Watcher для отслеживания изменений позиции скролла
watch(() => contentRef.value?.scrollTop, (newScrollTop, oldScrollTop) => {
  // Если скролл достиг верха (scrollTop = 0), разрешаем закрытие модалки
  if (newScrollTop === 0 && (oldScrollTop ?? 0) > 0) {
    console.log('📜 Контент достиг верха, можно закрыть модалку')
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
