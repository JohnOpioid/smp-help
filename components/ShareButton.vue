<template>
  <div ref="shareRef" :class="['relative', rootClass]">
    <button
      ref="buttonRef"
      type="button"
      @click="toggleShareMenu"
      :class="[
        'w-full rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors h-[2.5rem]',
        props.buttonClass
      ]"
      :disabled="!shareImageUrl"
    >
      <UIcon name="i-heroicons-share" class="w-4 h-4" />
      Поделиться
    </button>
    
    <!-- Попап с превью через Teleport (чтобы не обрезался overflow-hidden) -->
    <Teleport to="body">
      <div
        v-if="shareMenuOpen"
        ref="popupRef"
        class="fixed z-[9999] w-72 sm:w-80 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-lg p-3"
        :style="popupStyle"
        @mousedown.stop
        @click.stop
      >
      <!-- Превью изображения -->
      <div class="rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
        <div class="relative w-full aspect-[3/2]">
          <div
            v-if="!shareImageUrl || !shareImageLoaded"
            class="absolute inset-0 z-10 flex items-center justify-center bg-slate-50 dark:bg-slate-800 pointer-events-none"
          >
            <div class="flex flex-col items-center gap-3">
              <div class="w-8 h-8 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              <p class="text-xs text-slate-500 dark:text-slate-400">Загрузка изображения...</p>
            </div>
          </div>
          <img
            v-if="shareImageUrl"
            :src="shareImageUrl"
            alt="preview"
            class="absolute inset-0 z-0 w-full h-full object-cover transition-opacity"
            :class="{ 'opacity-0': !shareImageLoaded, 'opacity-100': shareImageLoaded }"
            @load="shareImageLoaded = true"
            @error="shareImageLoaded = false"
          />
        </div>
      </div>
      
      <!-- Кнопка поделиться -->
      <div class="mt-2" @mousedown.stop @click.stop>
        <button
          type="button"
          @mousedown.stop
          @click.stop="(e) => handleShare(e)"
          class="w-full rounded-md px-3 py-2 text-sm flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition-colors pointer-events-auto"
          :disabled="!shareText || !pageUrl"
        >
          <UIcon name="i-heroicons-share" class="w-4 h-4" />
          Поделиться
        </button>
      </div>
      
      <!-- Поле со ссылкой -->
      <div class="mt-2 relative" @mousedown.stop @click.stop>
        <input
          readonly
          :value="pageUrl || ''"
          class="w-full text-xs pl-3 pr-9 py-2 rounded-md border-0 focus:outline-none focus:ring-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 cursor-pointer select-none caret-transparent pointer-events-auto"
          @mousedown.stop
          @click.stop="(e) => copyLink(e)"
        />
        <span
          class="absolute inset-y-0 right-2 inline-flex items-center text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-slate-100 cursor-pointer pointer-events-auto z-10"
          title="Копировать ссылку"
          @mousedown.stop
          @click.stop="(e) => copyLink(e)"
        >
          <UIcon name="i-heroicons-clipboard" class="w-4 h-4" />
        </span>
      </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
interface Props {
  title?: string
  description?: string
  imageId?: string
  imageType?: 'codifier' | 'algorithm' | 'test' | 'page'
  sectionName?: string
  buttonClass?: string
  rootClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  buttonClass: '',
  rootClass: 'w-full'
})

// Используем composable для получения SEO данных
// Преобразуем props в computed для реактивности
const { seoData } = useSeoShare({
  title: computed(() => props.title),
  description: computed(() => props.description),
  imageId: computed(() => props.imageId),
  imageType: props.imageType,
  sectionName: computed(() => props.sectionName)
})

const shareImageUrl = computed(() => seoData.value.shareImageUrl)
const shareText = computed(() => seoData.value.shareText)
const pageUrl = computed(() => seoData.value.pageUrl)

const shareRef = ref<HTMLElement | null>(null)
const buttonRef = ref<HTMLElement | null>(null)
const popupRef = ref<HTMLElement | null>(null)
const shareMenuOpen = ref(false)
const shareImageLoaded = ref(false)
const popupStyle = ref<Record<string, string>>({})

// Вычисление позиции попапа
function updatePopupPosition() {
  if (!buttonRef.value || !popupRef.value || !shareMenuOpen.value) return
  
  nextTick(() => {
    if (!buttonRef.value || !popupRef.value) return
    
    const buttonRect = buttonRef.value.getBoundingClientRect()
    const popupHeight = popupRef.value.offsetHeight || 400
    const margin = 8 // mb-2 = 0.5rem = 8px
    
    // Вычисляем позицию: над кнопкой, выровнено по правому краю
    const top = buttonRect.top - popupHeight - margin
    const right = window.innerWidth - buttonRect.right
    
    // Если попап не помещается сверху, показываем снизу
    if (top < 0) {
      popupStyle.value = {
        top: `${buttonRect.bottom + margin}px`,
        right: `${right}px`
      }
    } else {
      popupStyle.value = {
        top: `${top}px`,
        right: `${right}px`
      }
    }
  })
}

// Обработка клика вне попапа
function onGlobalClick(e: MouseEvent) {
  if (!shareMenuOpen.value) return
  
  const target = e.target as HTMLElement
  if (!target) {
    shareMenuOpen.value = false
    return
  }
  
  // Проверяем, не кликнули ли мы на кнопку открытия
  if (buttonRef.value && (buttonRef.value === target || buttonRef.value.contains(target))) {
    // Если кликнули на кнопку открытия, переключаем состояние
    // (это обрабатывается в toggleShareMenu, но на всякий случай)
    return
  }
  
  // Проверяем, не кликнули ли мы внутри попапа
  if (popupRef.value) {
    const popup = popupRef.value
    // Проверяем, является ли цель клика частью попапа (включая все дочерние элементы)
    if (popup === target || popup.contains(target)) {
      // НЕ закрываем попап, если клик был внутри него
      e.stopPropagation()
      return
    }
  }
  
  // Кликнули вне попапа и кнопки - закрываем
  shareMenuOpen.value = false
}

onMounted(() => {
  if (process.client) {
    // Используем click БЕЗ capture, чтобы события на элементах внутри попапа обрабатывались первыми
    document.addEventListener('click', onGlobalClick, false)
    window.addEventListener('resize', updatePopupPosition)
    window.addEventListener('scroll', updatePopupPosition, true)
  }
})

onUnmounted(() => {
  if (process.client) {
    document.removeEventListener('click', onGlobalClick, false)
    window.removeEventListener('resize', updatePopupPosition)
    window.removeEventListener('scroll', updatePopupPosition, true)
  }
})

watch(shareMenuOpen, (isOpen) => {
  if (isOpen) {
    shareImageLoaded.value = false
    // Отладочная информация
    if (process.client) {
      console.log('ShareButton: попап открыт', {
        shareText: shareText.value,
        pageUrl: pageUrl.value,
        shareImageUrl: shareImageUrl.value
      })
    }
    nextTick(() => {
      updatePopupPosition()
    })
  }
})

watch(() => shareImageLoaded.value, () => {
  if (shareMenuOpen.value) {
    nextTick(() => {
      updatePopupPosition()
    })
  }
})

function toggleShareMenu() {
  shareMenuOpen.value = !shareMenuOpen.value
}

async function handleShare(e: Event) {
  // Останавливаем всплытие события, чтобы не закрывать попап и модалку до завершения операции
  e.stopPropagation()
  e.preventDefault()
  
  const text = shareText.value
  const url = pageUrl.value
  const title = seoData.value.title
  
  if (!text || !url) return
  
  try {
    // Используем Web Share API если доступен
    if (process.client && navigator.share) {
      // Отправляем название и ссылку (название + ссылка через строку)
      await navigator.share({
        title: title,
        text: text // Полный текст: название + ссылка через строку
      })
      shareMenuOpen.value = false
    } else {
      // Fallback: копируем полный текст в буфер обмена
      await navigator.clipboard.writeText(text)
      const toast = useToast?.()
      toast?.add?.({ title: 'Текст скопирован', description: 'Название и ссылка скопированы в буфер обмена', color: 'primary' })
      shareMenuOpen.value = false
    }
  } catch (error: any) {
    // Игнорируем ошибку, если пользователь отменил шаринг
    if (error?.name !== 'AbortError') {
      console.error('Ошибка при попытке поделиться:', error)
      // Fallback: копируем полный текст в буфер обмена
      try {
        await navigator.clipboard.writeText(text)
        const toast = useToast?.()
        toast?.add?.({ title: 'Текст скопирован', description: 'Название и ссылка скопированы в буфер обмена', color: 'primary' })
        shareMenuOpen.value = false
      } catch (copyError) {
        const toast = useToast?.()
        toast?.add?.({ title: 'Не удалось поделиться', color: 'error' })
      }
    }
  }
}

async function copyLink(e: Event) {
  // Останавливаем всплытие события, чтобы не закрывать попап и модалку
  e.stopPropagation()
  e.preventDefault()
  
  try {
    const value = pageUrl.value
    if (!value) return
    
    await navigator.clipboard.writeText(value)
    try {
      document.getSelection()?.removeAllRanges()
    } catch {}
    
    // Показываем уведомление
    const toast = useToast?.()
    toast?.add?.({ title: 'Ссылка скопирована', color: 'primary' })
    
    // НЕ закрываем попап после копирования
  } catch (error) {
    console.error('Ошибка копирования:', error)
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось скопировать', color: 'error' })
  }
}
</script>


