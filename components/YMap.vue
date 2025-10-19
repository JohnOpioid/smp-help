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

.custom-balloon__header {
  background: #f8fafc;
  padding: 12px 16px;
  border-bottom: 1px solid #e2e8f0;
  position: relative;
  border-radius: 12px 12px 0 0;
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

.balloon-title {
  font-weight: 600;
  font-size: 14px;
  color: #1e293b;
  margin-bottom: 4px;
}

.balloon-subtitle {
  font-size: 12px;
  color: #64748b;
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

.phone-item:hover {
  background: #e2e8f0;
  transform: translateY(-1px);
}

.phone-item:last-child {
  margin-bottom: 0;
}

.phone-icon {
  width: 16px;
  height: 16px;
  color: #64748b;
}

.phone-text {
  font-size: 13px;
  font-weight: 500;
  color: #1e293b;
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

const { $ymaps } = useNuxtApp()

onMounted(async () => {
  // Гарантируем готовность API
  if (typeof $ymaps === 'function') {
    await $ymaps()
  }
  const ym = (window as any).ymaps
  if (!ym) return
  await new Promise<void>((resolve) => ym.ready(() => resolve()))

  if (!mapRef.value) return

  // Чистим контейнер на случай повторного монтирования
  mapRef.value.innerHTML = ''
  map = new ym.Map(mapRef.value, { 
    center: props.center, 
    zoom: props.zoom ?? 11, 
    controls: ['zoomControl'],
    suppressMapOpenBlock: true
  })
  updatePlacemarks()
  
  // Добавляем обработчик клика на кнопку закрытия балуна через делегирование событий
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement
    if (target && (target.classList.contains('ymaps-2-1-79-balloon__close') || target.classList.contains('ymaps-2-1-79-balloon__close-button'))) {
      emit('balloonCloseButtonClick')
    }
  })
})

watch(() => props.placemarks, () => updatePlacemarks(), { deep: true })

function updatePlacemarks() {
  if (!map) return
  const ymaps = (window as any).ymaps
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
}

onBeforeUnmount(() => {
  if (map) {
    map.destroy()
    map = null
  }
})

function focusTo(coords: [number, number], zoom: number = 14) {
  if (map && Array.isArray(coords)) {
    try {
      map.setCenter(coords, zoom)
    } catch {}
  }
}

function setCenter(coords: [number, number], zoom: number = 10) {
  if (map && Array.isArray(coords)) {
    try {
      map.setCenter(coords, zoom)
    } catch {}
  }
}

function openBalloon(placemarkId: string) {
  if (map && placemarkObjs[placemarkId]) {
    try {
      placemarkObjs[placemarkId].balloon.open()
    } catch {}
  }
}

defineExpose({ focusTo, setCenter, openBalloon })
</script>


