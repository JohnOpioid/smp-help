<template>
  <div ref="mapRef" class="w-full h-full rounded-lg overflow-hidden"></div>
</template>

<style>
/* Полностью кастомный балун */
.custom-balloon {
  position: relative;
  background: transparent;
  border: none;
  box-shadow: none;
  padding: 0;
  margin: 0;
}

.custom-balloon__content {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  min-width: 280px;
  font-family: system-ui, -apple-system, sans-serif;
  border: none;
  position: relative;
}

.dark .custom-balloon__content {
  background: #1e293b;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 2px 4px -1px rgba(0, 0, 0, 0.2);
}

.custom-balloon__header {
  background: #f8fafc;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  border-radius: 12px 12px 0 0;
}

.dark .custom-balloon__header {
  background: #334155;
  border-bottom: 1px solid #475569;
}

.custom-balloon__body {
  padding: 12px 16px;
}

.custom-balloon__close {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: background-color 0.2s;
}

.custom-balloon__close:hover {
  background: rgba(0, 0, 0, 0.2);
}

.custom-balloon__close::before,
.custom-balloon__close::after {
  content: '';
  position: absolute;
  width: 12px;
  height: 2px;
  background: white;
  border-radius: 1px;
}

.custom-balloon__close::before {
  transform: rotate(45deg);
}

.custom-balloon__close::after {
  transform: rotate(-45deg);
}

.custom-balloon__tail {
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid white;
  z-index: 1;
}

.dark .custom-balloon__tail {
  border-top: 8px solid #1e293b;
}

.custom-balloon__tail::before {
  content: '';
  position: absolute;
  bottom: 1px;
  left: 50%;
  transform: translateX(-50%);
  width: 0;
  height: 0;
  border-left: 9px solid transparent;
  border-right: 9px solid transparent;
  border-top: 9px solid rgba(0, 0, 0, 0.1);
  z-index: -1;
}

.balloon-header {
  background: #f8fafc;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
}

.dark .balloon-header {
  background: #334155;
  border-bottom: 1px solid #475569;
}

.balloon-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
}

.dark .balloon-title {
  color: #f1f5f9;
}

.balloon-subtitle {
  font-size: 12px;
  color: #64748b;
}

.dark .balloon-subtitle {
  color: #94a3b8;
}

.balloon-body {
  padding: 12px 16px;
}

.phone-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: #f1f5f9;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 6px;
}

.dark .phone-item {
  background: #475569;
}

.phone-item:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.dark .phone-item:hover {
  background: #64748b;
}

.phone-item:last-child {
  margin-bottom: 0;
}

.phone-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.dark .phone-icon {
  color: #94a3b8;
}

.phone-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
}

.dark .phone-text {
  color: #f1f5f9;
}

/* Темная тема для стандартных балунов Яндекс.Карт */
.dark .ymaps-2-1-79-balloon {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__content {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__header {
  background-color: #334155 !important;
  color: #f1f5f9 !important;
  border-bottom: 1px solid #475569 !important;
}

.dark .ymaps-2-1-79-balloon__body {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__tail {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__close {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* Темная тема для меток */
.dark .ymaps-2-1-79-placemark {
  filter: brightness(1.2) contrast(1.1) !important;
}

.dark .ymaps-2-1-79-placemark__icon {
  filter: brightness(1.2) contrast(1.1) !important;
}

/* Дополнительные стили для хвостика балуна */
.dark ymaps.ymaps-2-1-79-balloon__tail {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark ymaps.ymaps-2-1-80-balloon__tail {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark ymaps.ymaps-2-1-81-balloon__tail {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

/* Еще более специфичные селекторы для хвостика */
.dark ymaps[class*="balloon__tail"] {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon ymaps.ymaps-2-1-79-balloon__tail {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

/* Темная тема для балунов */
.dark .ymaps-2-1-79-balloon {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__content {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__header {
  background-color: #334155 !important;
  color: #f1f5f9 !important;
  border-bottom: 1px solid #475569 !important;
}

.dark .ymaps-2-1-79-balloon__body {
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__tail {
  border-top-color: #1e293b !important;
  background-color: #1e293b !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-balloon__close {
  background-color: rgba(255, 255, 255, 0.2) !important;
}

/* Темная тема для элементов управления картой */
.dark .ymaps-2-1-79-controls {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #f1f5f9 !important;
}

.dark .ymaps-2-1-79-zoom {
  background-color: rgba(30, 41, 59, 0.8) !important;
  color: #f1f5f9 !important;
}

</style>

<script setup lang="ts">
const props = defineProps<{ center: [number, number]; zoom?: number; placemarks?: Array<{ id: string; coords: [number, number]; hint?: string; balloon?: string }>; }>()

const emit = defineEmits<{
  balloonClose: []
  placemarkClick: [id: string]
  balloonCloseButtonClick: []
}>()

const mapRef = ref<HTMLDivElement | null>(null)
let map: any = null
let placemarkObjs: Record<string, any> = {}
let ym: any = null

const { $ymaps } = useNuxtApp()

onMounted(async () => {
  try {
  // Гарантируем готовность API
  if (typeof $ymaps === 'function') {
    await $ymaps()
  }
    ym = (window as any).ymaps
    if (!ym) {
      console.warn('API Яндекс.Карт не загружен')
      return
    }
    
  await new Promise<void>((resolve) => ym.ready(() => resolve()))

    if (!mapRef.value) {
      console.warn('Контейнер карты не найден')
      return
    }

  // Чистим контейнер на случай повторного монтирования
  mapRef.value.innerHTML = ''
    
    // Определяем текущую тему
    const isDark = document.documentElement.classList.contains('dark')
    
    // Создаем кастомный темный слой и тип карты
    const DARK_MAP = 'custom#dark'
    
    try {
      // Добавляем темный слой в хранилище слоев
      ym.layer.storage.add(DARK_MAP, function DarkLayer() {
        // Ссылка на темные тайлы Яндекс.Карт
        // От стандартной отличается наличием &theme=dark
        return new ym.Layer(
          'https://core-renderer-tiles.maps.yandex.net/tiles?l=map&theme=dark&%c&%l&scale={{ scale }}'
        )
      })
      
      // Связываем слой с типом карты
      ym.mapType.storage.add(DARK_MAP, new ym.MapType('Dark Map', [DARK_MAP]))
      
    } catch (error) {
      console.warn('Ошибка при создании темного слоя:', error)
    }
    
    // Создаем карту с соответствующей темой
    const mapType = isDark ? DARK_MAP : 'yandex#map'
    
  map = new ym.Map(mapRef.value, { 
    center: props.center, 
    zoom: props.zoom ?? 11, 
      controls: [], // Убираем все элементы управления
      suppressMapOpenBlock: true,
      type: mapType
  })
    
    
  updatePlacemarks()
    
    // Применяем темные стили к балунам после их создания
    setTimeout(() => {
      applyThemeToBalloons()
    }, 1000)
    
    // Применяем стили периодически для надежности
    const styleInterval = setInterval(() => {
      applyThemeToBalloons()
    }, 2000)
    
    // Сохраняем интервал для очистки
    ;(mapRef.value as any)._styleInterval = styleInterval
    
  
  // Добавляем обработчик клика на кнопку закрытия балуна через делегирование событий
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target && (target.classList.contains('ymaps-2-1-79-balloon__close') || target.classList.contains('ymaps-2-1-79-balloon__close-button'))) {
      emit('balloonCloseButtonClick')
    }
  })
    
    // Observer для отслеживания изменений темы и переключения типа карты
    const observer = new MutationObserver(() => {
      updateMapTheme()
      applyThemeToBalloons()
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })
    
    // Сохраняем observer для очистки
    ;(mapRef.value as any)._themeObserver = observer
  } catch (error) {
    console.error('Ошибка при инициализации карты:', error)
  }
})

watch(() => props.placemarks, () => updatePlacemarks(), { deep: true })

onBeforeUnmount(() => {
  // Очищаем интервал стилей
  if (mapRef.value && (mapRef.value as any)._styleInterval) {
    clearInterval((mapRef.value as any)._styleInterval)
  }
  
  // Очищаем observer темы
  if (mapRef.value && (mapRef.value as any)._themeObserver) {
    (mapRef.value as any)._themeObserver.disconnect()
  }
})

function updatePlacemarks() {
  if (!map) return
  
  try {
  const ymaps = (window as any).ymaps
    if (!ymaps) return
    
  const existingIds = new Set(Object.keys(placemarkObjs))
  const newIds = new Set((props.placemarks || []).map(p => p.id))

  // remove missing
  existingIds.forEach(id => {
    if (!newIds.has(id)) {
      map.geoObjects.remove(placemarkObjs[id])
      delete placemarkObjs[id]
    }
  })

  // add/update
  for (const p of props.placemarks || []) {
    if (!placemarkObjs[p.id]) {
      const pm = new ymaps.Placemark(
        p.coords, 
        { 
          hintContent: p.hint, 
          balloonContent: p.balloon
        }, 
        { 
          iconLayout: 'default#image',
          iconImageHref: '/logo-c.png',
          iconImageSize: [40, 40],
          iconImageOffset: [-20, -20]
        }
      )
      
      // Добавляем обработчик закрытия балуна
      pm.events.add('balloonclose', () => {
        emit('balloonClose')
      })
        
        // Добавляем обработчик открытия балуна для применения темных стилей
        pm.events.add('balloonopen', () => {
          setTimeout(() => {
            applyThemeToBalloons()
          }, 100)
      })
      
      // Добавляем обработчик клика на метку
      pm.events.add('click', () => {
        emit('placemarkClick', p.id)
      })
      
      placemarkObjs[p.id] = pm
      map.geoObjects.add(pm)
    } else {
      placemarkObjs[p.id].geometry.setCoordinates(p.coords)
    }
    }
  } catch (error) {
    console.error('Ошибка при обновлении меток карты:', error)
  }
}

// Функция для обновления темы карты
function updateMapTheme() {
  if (!map) return
  
  try {
    const isDark = document.documentElement.classList.contains('dark')
    const DARK_MAP = 'custom#dark'
    const newType = isDark ? DARK_MAP : 'yandex#map'
    
    // Проверяем, нужно ли менять тип карты
    if (map.getType() !== newType) {
      map.setType(newType)
      
      // Переотображаем метки после смены темы
      setTimeout(() => {
        updatePlacemarks()
      }, 500)
    }
  } catch (error) {
    console.warn('Ошибка при обновлении темы карты:', error)
  }
}

// Функция для применения стилей к балунам в зависимости от темы
function applyThemeToBalloons() {
  const isDark = document.documentElement.classList.contains('dark')
  
  try {
    // Находим все балуны Яндекс.Карт с разными селекторами
    const balloonSelectors = [
      '.ymaps-2-1-79-balloon',
      '.ymaps-2-1-80-balloon', 
      '.ymaps-2-1-81-balloon',
      '[class*="balloon"]'
    ]
    
    balloonSelectors.forEach(selector => {
      const balloons = document.querySelectorAll(selector)
      
      balloons.forEach(balloon => {
        // Применяем стили в зависимости от темы
        if (isDark) {
          // Темная тема
          ;(balloon as HTMLElement).style.setProperty('background-color', '#1e293b', 'important')
          ;(balloon as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
        } else {
          // Светлая тема - сбрасываем стили
          ;(balloon as HTMLElement).style.removeProperty('background-color')
          ;(balloon as HTMLElement).style.removeProperty('color')
        }
        
        // Находим все элементы внутри балуна
        const allElements = balloon.querySelectorAll('*')
        allElements.forEach(element => {
          // Применяем стили к содержимому
          if (element.classList.contains('ymaps-2-1-79-balloon__content') ||
              element.classList.contains('ymaps-2-1-80-balloon__content') ||
              element.classList.contains('ymaps-2-1-81-balloon__content')) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('background-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('background-color')
              ;(element as HTMLElement).style.removeProperty('color')
            }
          }
          
          // Применяем стили к заголовку
          if (element.classList.contains('ymaps-2-1-79-balloon__header') ||
              element.classList.contains('ymaps-2-1-80-balloon__header') ||
              element.classList.contains('ymaps-2-1-81-balloon__header')) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('background-color', '#334155', 'important')
              ;(element as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
              ;(element as HTMLElement).style.setProperty('border-bottom', '1px solid #475569', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('background-color')
              ;(element as HTMLElement).style.removeProperty('color')
              ;(element as HTMLElement).style.removeProperty('border-bottom')
            }
          }
          
          // Применяем стили к телу
          if (element.classList.contains('ymaps-2-1-79-balloon__body') ||
              element.classList.contains('ymaps-2-1-80-balloon__body') ||
              element.classList.contains('ymaps-2-1-81-balloon__body')) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('background-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('background-color')
              ;(element as HTMLElement).style.removeProperty('color')
            }
          }
          
          // Применяем стили к хвостику
          if (element.classList.contains('ymaps-2-1-79-balloon__tail') ||
              element.classList.contains('ymaps-2-1-80-balloon__tail') ||
              element.classList.contains('ymaps-2-1-81-balloon__tail')) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('border-top-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('background-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('border-top-color')
              ;(element as HTMLElement).style.removeProperty('background-color')
              ;(element as HTMLElement).style.removeProperty('color')
            }
          }
          
          // Применяем стили к элементу ymaps с классом balloon__tail
          if (element.tagName === 'YMAPS' && 
              (element.classList.contains('ymaps-2-1-79-balloon__tail') ||
               element.classList.contains('ymaps-2-1-80-balloon__tail') ||
               element.classList.contains('ymaps-2-1-81-balloon__tail'))) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('border-top-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('background-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
              ;(element as HTMLElement).style.setProperty('border-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('fill', '#1e293b', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('border-top-color')
              ;(element as HTMLElement).style.removeProperty('background-color')
              ;(element as HTMLElement).style.removeProperty('color')
              ;(element as HTMLElement).style.removeProperty('border-color')
              ;(element as HTMLElement).style.removeProperty('fill')
            }
          }
          
          // Дополнительная проверка для всех элементов с классом balloon__tail
          if (element.classList.contains('balloon__tail') || 
              element.classList.contains('ymaps-2-1-79-balloon__tail') ||
              element.classList.contains('ymaps-2-1-80-balloon__tail') ||
              element.classList.contains('ymaps-2-1-81-balloon__tail')) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('border-top-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('background-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('color', '#f1f5f9', 'important')
              ;(element as HTMLElement).style.setProperty('border-color', '#1e293b', 'important')
              ;(element as HTMLElement).style.setProperty('fill', '#1e293b', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('border-top-color')
              ;(element as HTMLElement).style.removeProperty('background-color')
              ;(element as HTMLElement).style.removeProperty('color')
              ;(element as HTMLElement).style.removeProperty('border-color')
              ;(element as HTMLElement).style.removeProperty('fill')
            }
          }
          
          // Применяем стили к кнопке закрытия
          if (element.classList.contains('ymaps-2-1-79-balloon__close') ||
              element.classList.contains('ymaps-2-1-80-balloon__close') ||
              element.classList.contains('ymaps-2-1-81-balloon__close')) {
            if (isDark) {
              ;(element as HTMLElement).style.setProperty('background-color', 'rgba(255, 255, 255, 0.2)', 'important')
            } else {
              ;(element as HTMLElement).style.removeProperty('background-color')
            }
          }
        })
      })
    })
    
  } catch (error) {
    console.warn('Ошибка при применении стилей к балунам:', error)
  }
}


onBeforeUnmount(() => {
  if (map) {
    map.destroy()
    map = null
  }
  
  // Очищаем observer
  if (mapRef.value && (mapRef.value as any)._themeObserver) {
    ;(mapRef.value as any)._themeObserver.disconnect()
  }
})

function focusTo(coords: [number, number], zoom: number = 14) {
  if (map && Array.isArray(coords)) {
    try {
      map.setCenter(coords, zoom)
    } catch (error) {
      console.warn('Ошибка при фокусировке карты:', error)
    }
  }
}

function setCenter(coords: [number, number], zoom: number = 10) {
  if (map && Array.isArray(coords)) {
    try {
      map.setCenter(coords, zoom)
    } catch (error) {
      console.warn('Ошибка при установке центра карты:', error)
    }
  }
}

function openBalloon(placemarkId: string) {
  if (map && placemarkObjs[placemarkId]) {
    try {
      placemarkObjs[placemarkId].balloon.open()
    } catch (error) {
      console.warn('Ошибка при открытии балуна:', error)
    }
  }
}

defineExpose({ focusTo, setCenter, openBalloon })
</script>


