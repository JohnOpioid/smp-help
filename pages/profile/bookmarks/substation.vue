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
        <UIcon name="i-heroicons-building-office" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-slate-600 dark:text-slate-300 mb-2">У вас пока нет закладок подстанций</p>
      <p class="text-sm text-slate-500 dark:text-slate-400">Добавляйте интересные подстанции в закладки для быстрого доступа</p>
    </div>

    <div v-else class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
        <UIcon name="i-heroicons-building-office" class="w-4 h-4 text-slate-500" />
        <p class="text-sm text-slate-600 dark:text-slate-300">Подстанции</p>
      </div>
      <div class="divide-y divide-slate-100 dark:divide-slate-700">
        <div 
          v-for="bookmark in bookmarks" 
          :key="bookmark._id" 
          class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer"
          @click="openBookmark(bookmark)"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                {{ bookmark.title }}
              </h3>
              <div v-if="bookmark.mkbCode || bookmark.stationCode || bookmark.code" class="flex items-center gap-2 mt-1 flex-wrap mb-2">
                <span v-if="bookmark.mkbCode" class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ bookmark.mkbCode }}</span>
                <span v-if="bookmark.code" class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono">{{ bookmark.code }}</span>
                <span v-if="bookmark.stationCode" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 font-mono">{{ bookmark.stationCode }}</span>
              </div>
              <div v-if="bookmark.description && bookmark.description.trim()" class="text-sm text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line line-clamp-3">
                {{ bookmark.description }}
              </div>
              <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                <div v-if="bookmark.category" class="flex flex-wrap gap-1.5">
                  <template v-for="category in bookmark.category.split(', ')" :key="category">
                    <span 
                      v-if="category.toLowerCase().includes('антидот')" 
                      class="text-xs px-2 py-1 rounded bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200"
                    >
                      {{ category }}
                    </span>
                    <span 
                      v-else 
                      class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600"
                    >
                      {{ category }}
                    </span>
                  </template>
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
definePageMeta({ middleware: 'auth', headerTitle: 'Закладки - Подстанции', layout: 'profile' })

const bookmarks = ref<any[]>([])
const pending = ref(true)
const error = ref<string | null>(null)

async function loadBookmarks() {
  try {
    pending.value = true
    const res: any = await $fetch('/api/bookmarks', {
      query: { _t: Date.now(), type: 'substation' }
    })
    if (res?.success) {
      bookmarks.value = (res.items || []).filter((b: any) => b.type === 'substation')
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

