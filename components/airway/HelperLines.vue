<script setup lang="ts">
import { useVueFlow } from '@vue-flow/core'
import { computed, ref, watch } from 'vue'

interface HelperLinesProps {
  horizontal?: number
  vertical?: number
  horizontalDistance?: number
  verticalDistance?: number
}

const props = defineProps<HelperLinesProps>()

const horizontal = computed(() => props.horizontal)
const vertical = computed(() => props.vertical)
const horizontalDistance = computed(() => props.horizontalDistance)
const verticalDistance = computed(() => props.verticalDistance)

const { viewport, dimensions } = useVueFlow()

const canvasRef = ref<HTMLCanvasElement | null>(null)

const width = computed(() => dimensions.value.width)
const height = computed(() => dimensions.value.height)
const x = computed(() => viewport.value.x)
const y = computed(() => viewport.value.y)
const zoom = computed(() => viewport.value.zoom)

function updateCanvasHelperLines() {
  const canvas = canvasRef.value
  const ctx = canvas?.getContext('2d')
  if (!ctx || !canvas) {
    return
  }

  const dpi = window.devicePixelRatio
  canvas.width = width.value * dpi
  canvas.height = height.value * dpi
  ctx.scale(dpi, dpi)

  ctx.clearRect(0, 0, width.value, height.value)

  ctx.strokeStyle = '#00AF79'
  ctx.fillStyle = '#00AF79'
  ctx.lineWidth = 1
  ctx.font = '12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'

  // Вертикальная линия с расстоянием
  if (typeof vertical.value === 'number') {
    const xPos = vertical.value * zoom.value + x.value
    ctx.beginPath()
    ctx.moveTo(xPos, 0)
    ctx.lineTo(xPos, height.value)
    ctx.stroke()
    
    // Отображаем расстояние, если оно определено
    if (typeof verticalDistance.value === 'number') {
      const distanceText = verticalDistance.value === 0 ? '0' : `${Math.round(verticalDistance.value)}px`
      const textY = height.value / 2
      // Фон для текста
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      const textWidth = ctx.measureText(distanceText).width
      ctx.fillRect(xPos - textWidth / 2 - 4, textY - 10, textWidth + 8, 20)
      // Текст
      ctx.fillStyle = '#00AF79'
      ctx.fillText(distanceText, xPos, textY)
    }
  }

  // Горизонтальная линия с расстоянием
  if (typeof horizontal.value === 'number') {
    const yPos = horizontal.value * zoom.value + y.value
    ctx.beginPath()
    ctx.moveTo(0, yPos)
    ctx.lineTo(width.value, yPos)
    ctx.stroke()
    
    // Отображаем расстояние, если оно определено
    if (typeof horizontalDistance.value === 'number') {
      const distanceText = horizontalDistance.value === 0 ? '0' : `${Math.round(horizontalDistance.value)}px`
      const textX = width.value / 2
      // Фон для текста
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      const textWidth = ctx.measureText(distanceText).width
      ctx.fillRect(textX - textWidth / 2 - 4, yPos - 10, textWidth + 8, 20)
      // Текст
      ctx.fillStyle = '#00AF79'
      ctx.fillText(distanceText, textX, yPos)
    }
  }
}

watch([width, height, x, y, zoom, horizontal, vertical, horizontalDistance, verticalDistance], () => updateCanvasHelperLines(), { immediate: true, deep: true })
</script>

<template>
  <canvas ref="canvasRef" class="vue-flow__canvas" />
</template>

<style scoped>
.vue-flow__canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 10;
  pointer-events: none;
}
</style>

