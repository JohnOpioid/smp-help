<template>
  <div>
    <div v-if="pending" class="p-6">
      <div class="space-y-3">
        <USkeleton class="h-6 w-1/3" />
        <USkeleton class="h-5 w-1/2" />
        <USkeleton class="h-5 w-2/3" />
      </div>
    </div>

    <div v-else-if="error" class="p-6 text-center">
      <p class="text-red-600 dark:text-red-400">{{ error }}</p>
    </div>

    <div v-else-if="bookmarks.length === 0" class="p-6 text-center">
      <div class="text-slate-400 dark:text-slate-500 mb-4">
        <UIcon name="i-heroicons-document-text" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-slate-600 dark:text-slate-300 mb-2">У вас пока нет закладок в кодификаторе</p>
      <p class="text-sm text-slate-500 dark:text-slate-400">Добавляйте интересные коды МКБ-10 в закладки для быстрого доступа</p>
    </div>

    <div v-else class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
        <UIcon name="i-heroicons-document-text" class="w-4 h-4 text-slate-500" />
        <p class="text-sm text-slate-600 dark:text-slate-300">Кодификатор</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-0">
        <div 
          v-for="(bookmark, index) in bookmarks" 
          :key="bookmark._id" 
          class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
          :class="{
            'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < bookmarks.length - 1) || (index === bookmarks.length - 1 && bookmarks.length % 2 === 1),
            'md:border-b-0': index >= bookmarks.length - 2 && bookmarks.length % 2 === 0
          }"
          @click="openBookmark(bookmark)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {{ bookmark.title }}
              </h3>
              <div v-if="bookmark.mkbCode || bookmark.stationCode" class="flex items-center gap-2 mt-1 flex-wrap mb-2">
                <span v-if="bookmark.mkbCode" class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ bookmark.mkbCode }}</span>
                <span v-if="bookmark.stationCode" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ bookmark.stationCode }}</span>
              </div>
              <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div v-if="bookmark.category" class="flex flex-wrap gap-1.5">
                  <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600">{{ bookmark.category }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2 ml-4">
              <UButton
                size="xs"
                variant="ghost"
                color="error"
                icon="i-heroicons-trash"
                class="w-7 h-7 p-0 cursor-pointer inline-flex items-center justify-center"
                @click.stop="removeBookmark(bookmark._id)"
                aria-label="Удалить закладку"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Закладки - Кодификатор', layout: 'profile' })

const bookmarks = ref<any[]>([])
const pending = ref(true)
const error = ref<string | null>(null)

async function loadBookmarks() {
  try {
    pending.value = true
    const res: any = await $fetch('/api/bookmarks', {
      query: { _t: Date.now(), type: 'codifier' }
    })
    if (res?.success) {
      bookmarks.value = (res.items || []).filter((b: any) => b.type === 'codifier')
      error.value = null
    } else {
      error.value = res?.message || 'Ошибка загрузки закладок'
    }
  } catch (err: any) {
    console.error('Ошибка загрузки:', err)
    error.value = err.message || 'Ошибка загрузки закладок'
  } finally {
    pending.value = false
  }
}

function openBookmark(bookmark: any) {
  if (bookmark.url) {
    navigateTo(bookmark.url)
  }
}

async function removeBookmark(bookmarkId: string) {
  if (!confirm('Удалить закладку?')) return
  try {
    const res: any = await $fetch(`/api/bookmarks/${bookmarkId}`, { method: 'DELETE' })
    if (res?.success) {
      bookmarks.value = bookmarks.value.filter(b => b._id !== bookmarkId)
      const toast = useToast?.()
      toast?.add?.({ title: 'Закладка удалена', color: 'neutral' })
      window.dispatchEvent(new CustomEvent('bookmarks-updated'))
    }
  } catch (err: any) {
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось удалить закладку', color: 'error' })
  }
}

onMounted(() => {
  loadBookmarks()
  window.addEventListener('bookmarks-updated', loadBookmarks)
})

onBeforeUnmount(() => {
  window.removeEventListener('bookmarks-updated', loadBookmarks)
})
</script>

