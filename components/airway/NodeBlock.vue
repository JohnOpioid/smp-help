<template>
  <div ref="nodeRef" :class="wrapperClass + ' node-block relative group'" :style="nodeStyle">
    <!-- Resize handle только в правом нижнем углу -->
    <div 
      v-if="editable"
      class="resize-handle resize-handle-se"
      @mousedown.stop="startResize('se', $event)"
    ></div>
    
    <!-- Handles - используем только source handles для обоих направлений -->
    <!-- Vue Flow автоматически определит направление при перетаскивании -->
    <Handle id="top" type="source" :position="Position.Top" class="vb-handle vb-handle-top" />
    <Handle id="bottom" type="source" :position="Position.Bottom" class="vb-handle vb-handle-bottom" />
    <Handle id="left" type="source" :position="Position.Left" class="vb-handle vb-handle-left" />
    <Handle id="right" type="source" :position="Position.Right" class="vb-handle vb-handle-right" />
    <!-- Target handles для входящих связей -->
    <Handle id="top" type="target" :position="Position.Top" class="vb-handle vb-handle-top" />
    <Handle id="bottom" type="target" :position="Position.Bottom" class="vb-handle vb-handle-bottom" />
    <Handle id="left" type="target" :position="Position.Left" class="vb-handle vb-handle-left" />
    <Handle id="right" type="target" :position="Position.Right" class="vb-handle vb-handle-right" />

    <div ref="contentRef">
      <p v-if="data.title" class="text-sm font-semibold mb-1">{{ data.title }}</p>
      <div v-if="html" class="prose prose-sm dark:prose-invert prose-headings:m-0 prose-headings:text-sm prose-p:m-0 prose-li:m-0" v-html="html"></div>
    </div>
    
    <!-- Отображение размеров в правом нижнем углу только в админке -->
    <div v-if="editable && isAdmin" class="absolute bottom-1 right-1 text-xs text-slate-500 dark:text-slate-400 pointer-events-none select-none bg-white/80 dark:bg-slate-800/80 px-1.5 py-0.5 rounded">
      {{ Math.round(width) }} × {{ Math.round(height) }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, onMounted, ref, watch, nextTick } from 'vue'
import { Handle, Position, useVueFlow } from '@vue-flow/core'
import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })

const props = defineProps<{ id: string, data: any }>()
const { getNodes, updateNodeInternals, applyNodeChanges } = useVueFlow()

// Refs для измерения контента
const nodeRef = ref<HTMLElement | null>(null)
const contentRef = ref<HTMLElement | null>(null)
const minContentHeight = ref(50) // Минимальная высота по умолчанию

// Определяем, редактируемый ли узел
const editable = computed(() => {
  const nodes = getNodes.value
  const node = nodes.find(n => n.id === props.id)
  return node?.draggable !== false
})

// Определяем, находимся ли мы в админке
const isAdmin = computed(() => {
  // Проверяем URL или другой способ определения админки
  if (typeof window !== 'undefined') {
    return window.location.pathname.includes('/admin/')
  }
  return false
})

// Размеры узла - если есть сохраненные размеры, используем их, иначе берем из текущего узла
const width = computed(() => {
  // Сначала проверяем сохраненные размеры
  if (props.data?.width) return props.data.width
  // Если размеров нет, берем из текущего узла Vue Flow
  const node = getNodes.value.find(n => n.id === props.id)
  if (node) {
    const nodeAny = node as any
    return node.dimensions?.width || nodeAny.measured?.width || node.width || 200
  }
  return 200
})
const height = computed(() => {
  if (props.data?.height) return props.data.height
  // Если размеров нет, берем из текущего узла Vue Flow
  const node = getNodes.value.find(n => n.id === props.id)
  if (node) {
    const nodeAny = node as any
    return node.dimensions?.height || nodeAny.measured?.height || node.height || 100
  }
  return 100
})

// Функция для измерения минимальной высоты контента
function measureContentHeight() {
  if (!contentRef.value || !nodeRef.value) return 50
  
  // Получаем стили узла для учета padding
  const nodeStyle = window.getComputedStyle(nodeRef.value)
  const paddingTop = parseFloat(nodeStyle.paddingTop) || 0
  const paddingBottom = parseFloat(nodeStyle.paddingBottom) || 0
  
  // Измеряем реальную высоту контента
  const contentHeight = contentRef.value.scrollHeight
  
  // Возвращаем минимальную высоту с учетом padding узла
  // Добавляем небольшой запас для безопасности
  const minHeight = paddingTop + contentHeight + paddingBottom + 4 // 4px запас
  
  return Math.max(50, minHeight)
}

// Обновляем минимальную высоту при изменении контента
watch(() => [props.data?.title, props.data?.bodyMd], () => {
  nextTick(() => {
    minContentHeight.value = measureContentHeight()
  })
}, { immediate: true })

// Обновляем минимальную высоту после монтирования
onMounted(() => {
  nextTick(() => {
    minContentHeight.value = measureContentHeight()
  })
})

// Применяем сохраненные размеры или используем автоматический размер
const nodeStyle = computed(() => {
  const style: any = {
    minWidth: '100px',
    minHeight: `${minContentHeight.value}px`, // Используем измеренную высоту контента
    maxWidth: '800px',
    maxHeight: '600px'
  }
  // Всегда применяем размеры (либо сохраненные, либо текущие из Vue Flow)
  style.width = `${width.value}px`
  style.height = `${height.value}px`
  return style
})

// Resize логика
let isResizing = false
let resizeDirection = ''
let startX = 0
let startY = 0
let startWidth = 0
let startHeight = 0

function startResize(direction: string, event: MouseEvent) {
  if (!editable.value) return
  
  // Получаем текущие размеры узла из Vue Flow
  const node = getNodes.value.find(n => n.id === props.id)
  if (!node) return
  const nodeAny = node as any
  const currentWidth = node.dimensions?.width || nodeAny.measured?.width || node.width || nodeAny.data?.width || 200
  const currentHeight = node.dimensions?.height || nodeAny.measured?.height || node.height || nodeAny.data?.height || 100
  
  isResizing = true
  resizeDirection = direction
  startX = event.clientX
  startY = event.clientY
  startWidth = currentWidth
  startHeight = currentHeight
  
  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  event.preventDefault()
}

function handleResize(event: MouseEvent) {
  if (!isResizing) return
  
  const deltaX = event.clientX - startX
  const deltaY = event.clientY - startY
  
  // Шаг изменения размера - 10px
  const step = 10
  const deltaXStepped = Math.round(deltaX / step) * step
  const deltaYStepped = Math.round(deltaY / step) * step
  
  let newWidth = startWidth
  let newHeight = startHeight
  
  // Обновляем минимальную высоту контента перед проверкой
  const currentMinHeight = measureContentHeight()
  
  if (resizeDirection.includes('e')) {
    newWidth = Math.max(100, Math.min(800, startWidth + deltaXStepped))
    // Округляем до ближайших 10px
    newWidth = Math.round(newWidth / step) * step
  }
  if (resizeDirection.includes('s')) {
    // Ограничиваем высоту минимальной высотой контента
    newHeight = Math.max(currentMinHeight, Math.min(600, startHeight + deltaYStepped))
    // Округляем до ближайших 10px
    newHeight = Math.round(newHeight / step) * step
  }
  
  // Обновляем размеры через изменение узла
  const node = getNodes.value.find(n => n.id === props.id)
  if (node) {
    // Обновляем данные узла - это сохраняется в БД
    if (!node.data) node.data = {}
    node.data.width = newWidth
    node.data.height = newHeight
    
    // Обновляем style для немедленного отображения
    if (!node.style) node.style = {}
    const nodeStyle = node.style as any
    nodeStyle.width = `${newWidth}px`
    nodeStyle.height = `${newHeight}px`
    
    // Обновляем свойства узла для Vue Flow
    node.width = newWidth
    node.height = newHeight
    
    // Обновляем dimensions - это важно для Vue Flow
    if (!node.dimensions) {
      node.dimensions = { width: 0, height: 0 }
    }
    node.dimensions.width = newWidth
    node.dimensions.height = newHeight
    
    // Принудительно обновляем внутренние данные узла
    // Это триггерит onNodesChange с типом dimensions для показа вспомогательных линий
    // Используем requestAnimationFrame для более плавного обновления
    requestAnimationFrame(() => {
      try {
        // Обновляем внутренние данные узла
        updateNodeInternals([props.id])
        
        // Триггерим изменение dimensions через Vue Flow API
        // Это необходимо для правильной работы resize и обработки в onNodesChange
        const dimensionChange = {
          id: props.id,
          type: 'dimensions' as const,
          dimensions: {
            width: newWidth,
            height: newHeight
          }
        }
        // Применяем изменения через Vue Flow API - это вызовет onNodesChange
        applyNodeChanges([dimensionChange])
      } catch (e) {
        // Игнорируем ошибки при обновлении
      }
    })
  }
}

function stopResize() {
  isResizing = false
  resizeDirection = ''
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  
  // После завершения изменения размера, обновляем родительский компонент
  // Это делается через Vue Flow, который автоматически обновит через onNodesChange
  const node = getNodes.value.find(n => n.id === props.id)
  if (node && node.data?.width && node.data?.height) {
    // Размеры уже обновлены в handleResize, Vue Flow обновит через onNodesChange
  }
}

onUnmounted(() => {
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
})

const html = computed(() => props.data?.bodyMd ? marked.parse(String(props.data.bodyMd)) as string : '')
const wrapperClass = computed(() => {
  const tone = props.data?.tone || 'neutral'
  // Убираем max-w-[420px], так как размер теперь управляется через NodeResizer
  const base = 'rounded-sm px-3 py-2 text-slate-800 dark:text-slate-200 w-full h-full'
  const colors: Record<string,string> = {
    neutral: 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700',
    blue: 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-900/50',
    pink: 'bg-pink-50 dark:bg-pink-900/30 border border-pink-200 dark:border-pink-900/50',
    green: 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-900/50'
  }
  return `${base} ${colors[tone] || colors.neutral}`
})
</script>

<style scoped>
.prose :where(ul,ol){margin:0;padding-left:1.1rem}
.prose :where(li){margin:0}
/* unify font size */
.prose{ font-size: 0.875rem; }

/* Connection handles */
.vb-handle{ @apply absolute opacity-0 group-hover:opacity-100 transition-opacity; width:10px; height:10px; background:#0ea5e9; border:2px solid white; border-radius:9999px; box-shadow:0 0 0 1px rgba(2,6,23,0.2) }
.dark .vb-handle{ background:#3b82f6; border-color:#0b1220; box-shadow:0 0 0 1px rgba(148,163,184,0.25) }
.vb-handle-top{ top:-6px; left:50%; transform:translateX(-50%); }
.vb-handle-bottom{ bottom:-6px; left:50%; transform:translateX(-50%); }
.vb-handle-left{ left:-6px; top:50%; transform:translateY(-50%); }
.vb-handle-right{ right:-6px; top:50%; transform:translateY(-50%); }

/* Resize handles */
.resize-handle {
  position: absolute;
  background: #3b82f6;
  border: 2px solid white;
  border-radius: 4px;
  opacity: 0;
  transition: opacity 0.2s;
  z-index: 10;
}

.group:hover .resize-handle {
  opacity: 1;
}

.dark .resize-handle {
  background: #3b82f6;
  border-color: #0b1220;
}

.resize-handle-se {
  bottom: -4px;
  right: -4px;
  width: 12px;
  height: 12px;
  cursor: se-resize;
}

.resize-handle-s {
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  width: 12px;
  height: 8px;
  cursor: s-resize;
}

.resize-handle-e {
  top: 50%;
  right: -4px;
  transform: translateY(-50%);
  width: 8px;
  height: 12px;
  cursor: e-resize;
}
</style>


