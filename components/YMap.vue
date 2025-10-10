<template>
  <div ref="mapRef" class="w-full h-full rounded-lg overflow-hidden"></div>
  
</template>

<script setup lang="ts">
const props = defineProps<{ center: [number, number]; zoom?: number; placemarks?: Array<{ id: string; coords: [number, number]; hint?: string; balloon?: string }>; }>()

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
  map = new ym.Map(mapRef.value, { center: props.center, zoom: props.zoom ?? 11, controls: ['zoomControl'] })
  updatePlacemarks()
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
      const pm = new ymaps.Placemark(p.coords, { hintContent: p.hint, balloonContent: p.balloon }, { preset: 'islands#blueCircleDotIcon' })
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

defineExpose({ focusTo })
</script>


