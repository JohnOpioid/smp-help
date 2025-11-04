<template>
  <div class="flex items-center gap-2 z-40">
    <!-- Input area -->
    <div class="relative flex-1">
      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg class="h-5 w-5 sm:h-6 sm:w-6 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
      </div>
             <input
               :value="modelValue"
               @input="onInput"
               @keydown.enter.prevent="onEnter"
               @focus="onFocus"
               @blur="onBlur"
               type="text"
               :placeholder="placeholder"
               class="block w-full pl-10 pr-12 sm:pl-12 sm:pr-14 py-3 sm:py-4 text-base border border-slate-100 dark:border-slate-600 outline-none focus:outline-none focus:ring-0 focus:border-slate-300 dark:focus:border-slate-500 hover:shadow-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 transition-all duration-200 rounded-lg"
             />
      <div class="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3">
        <button v-if="showClear"
          @click="clear"
          class="inline-flex items-center justify-center h-9 w-9 sm:h-10 sm:w-10 rounded-md text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 transition-colors duration-200 cursor-pointer"
          aria-label="Очистить">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
    </div>

    <!-- Right side: avatar and clear button -->
    <div class="flex items-center gap-1.5 relative">
      <!-- Info popover -->
      <transition name="fade" appear>
        <div v-if="aiEnabled && showInfo" class="absolute right-full mr-3 top-1/2 -translate-y-1/2 z-50">
          <div 
            @click="dismissInfo"
            class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 shadow-sm rounded-lg px-4 py-3 w-72 cursor-pointer hover:shadow-md transition-shadow duration-200"
          >
            <div class="flex items-start gap-2">
              <div class="min-w-0">
                <p class="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{{ aiName }}</p>
                <p class="text-xs text-slate-600 dark:text-slate-300">{{ aiRole }}</p>
                <p class="text-sm text-slate-700 dark:text-slate-200 mt-2 leading-snug">{{ infoMessage }}</p>
              </div>
            </div>
          </div>
        </div>
      </transition>

      <button
        v-if="aiEnabled"
        type="button"
        @click="openAiPanel($event)"
        @mouseenter="onMouseEnter"
        @mouseleave="stopInfo()"
        @focus="onAvatarFocus"
        @blur="stopInfo()"
        class="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-full border border-slate-100 dark:border-slate-600 bg-white dark:bg-slate-800 cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300"
        aria-label="Открыть панель поиска"
      >
        <img src="/assets/img/AI-avatar.png" alt="AI" class="rounded-full w-10 h-10 sm:w-12 sm:h-12 object-cover" />
      </button>
      <!-- clear moved inside input container -->
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  aiEnabled?: boolean
}>(), {
  modelValue: '',
  placeholder: 'Поиск...',
  aiEnabled: false
})
const emit = defineEmits<{
  'update:modelValue': [value: string]
  'clear': []
  'enter': []
  'focus': []
  'blur': []
}>()

const showClear = computed(() => Boolean((props.modelValue || '').trim()))

// AI info (name, role, context-aware summary)
const aiName = 'Амби'
const aiRole = 'Ваш помощник по справочнику СМП'
const showInfo = ref(false)
const { userDismissed } = useAmbiPopup() // Используем глобальный флаг
const route = useRoute()
const currentSummary = computed(() => {
  const path = route.path
  if (path.startsWith('/algorithms')) return 'Алгоритмы: разделы и быстрый поиск по категориям.'
  if (path.startsWith('/codifier')) return 'Кодификатор МКБ-10: быстрый поиск по диагнозам.'
  if (path.startsWith('/drugs')) return 'Лекарства: формы, дозировки и категории.'
  if (path.startsWith('/local-statuses')) return 'Локальные статусы: коды, станции и описания.'
  if (path.startsWith('/classroom/instructions')) return 'Инструкции: список и быстрый поиск по описанию.'
  return 'Помогу найти нужную информацию и сориентироваться.'
})

// Message selection (one per show, longer intervals)
const infoMessages = computed(() => [
  currentSummary.value,
  'Я Амби. Помогу быстро найти нужный раздел.',
  'Начните печатать — найду диагноз, алгоритм или статус.',
  'Нажмите Enter — покажу больше результатов.',
  'Кликните по мне — открою расширенный поиск и чат.',
  'Если вы в категории, сначала ищу внутри неё.'
].filter(Boolean))
const infoMessage = ref(infoMessages.value[0] || '')
let infoTimer: any = null
function pickMessage() {
  const arr = infoMessages.value
  if (!arr.length) return ''
  const idx = Math.floor(Math.random() * arr.length)
  return arr[idx]
}
function startInfo() {
  // Не показываем, если пользователь закрыл попап
  if (userDismissed.value) return
  
  showInfo.value = true
  try { clearInterval(infoTimer) } catch {}
  infoMessage.value = pickMessage() || currentSummary.value
}
function stopInfo() {
  showInfo.value = false
  try { clearInterval(infoTimer) } catch {}
  infoTimer = null
}
function dismissInfo() {
  // Помечаем, что пользователь закрыл попап
  userDismissed.value = true
  stopInfo()
}
function onMouseEnter() {
  // Сбрасываем флаг при наведении, чтобы пользователь мог снова увидеть попап
  userDismissed.value = false
  startInfo()
}
function onAvatarFocus() {
  // Сбрасываем флаг при фокусе, чтобы пользователь мог снова увидеть попап
  userDismissed.value = false
  startInfo()
}
function startInfoForced() {
  // Принудительный показ без проверки флага (для автоматических показов)
  showInfo.value = true
  try { clearInterval(infoTimer) } catch {}
  infoMessage.value = pickMessage() || currentSummary.value
}
onMounted(() => {
  // Автоматически показать на короткое время при первом рендере только если не было закрыто
  if (!userDismissed.value) {
    startInfoForced()
    setTimeout(() => { stopInfo() }, 12000)
  }
})
watch(() => route.path, () => {
  // Короткая подсказка при смене контекста страницы только если не было закрыто
  if (!userDismissed.value) {
    startInfoForced()
    setTimeout(() => { stopInfo() }, 12000)
  }
})
onUnmounted(() => { try { clearInterval(infoTimer) } catch {} })

function onInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  emit('update:modelValue', val)
}
function clear() {
  emit('update:modelValue', '')
  emit('clear')
}
function onEnter() { emit('enter') }
function onFocus() { emit('focus') }
function onBlur() { emit('blur') }

function openAiPanel(event?: Event) {
  try {
    if (event) {
      event.stopPropagation()
    }
    window.dispatchEvent(new Event('openBottomSearch'))
  } catch {}
}
</script>


