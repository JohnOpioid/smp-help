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
        <UIcon name="i-heroicons-bookmark" class="w-12 h-12 mx-auto" />
      </div>
      <p class="text-slate-600 dark:text-slate-300 mb-2">У вас пока нет закладок</p>
      <p class="text-sm text-slate-500 dark:text-slate-400">Добавляйте интересные препараты и статусы в закладки для быстрого доступа</p>
    </div>

    <div v-else class="space-y-6">
      <template v-for="section in groupedBookmarks" :key="section.type">
        <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border rounded-lg overflow-hidden">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <UIcon :name="section.icon" class="w-4 h-4 text-slate-500" />
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ section.label }}</p>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-700">
            <div 
              v-for="bookmark in section.items" 
              :key="bookmark._id" 
              class="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/40 cursor-pointer"
              @click="openBookmark(bookmark)"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {{ bookmark.title }}
                  </h3>
                  <p v-if="bookmark.description" class="text-sm text-slate-600 dark:text-slate-300 mb-2 line-clamp-2">
                    {{ bookmark.description }}
                  </p>
                  <div class="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                    <span v-if="bookmark.category">{{ bookmark.category }}</span>
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
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Закладки', layout: 'profile' })

const bookmarks = ref<any[]>([])
const pending = ref(true)
const error = ref<string | null>(null)

const groupedBookmarks = computed(() => {
  const groups = [
    { type: 'codifier', label: 'Кодификатор', icon: 'i-heroicons-document-text' },
    { type: 'drug', label: 'Препараты', icon: 'i-lucide-pill' },
    { type: 'local-status', label: 'Локальные статусы', icon: 'i-heroicons-clipboard-document-list' },
    { type: 'substation', label: 'Подстанции', icon: 'i-heroicons-building-office' }
  ]
  return groups
    .map(g => ({ ...g, items: bookmarks.value.filter(b => b.type === g.type) }))
    .filter(g => g.items.length > 0)
})

async function loadBookmarks() {
  try {
    const res: any = await $fetch('/api/bookmarks')
    if (res?.success) {
      bookmarks.value = res.items || []
      error.value = null
    } else {
      error.value = res?.message || 'Ошибка загрузки закладок'
    }
  } catch (err: any) {
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
      // @ts-ignore
      const toast = useToast?.()
      toast?.add?.({ title: 'Закладка удалена', color: 'neutral' })
    }
  } catch (err: any) {
    // @ts-ignore
    const toast = useToast?.()
    toast?.add?.({ title: 'Не удалось удалить закладку', color: 'error' })
  }
}

onMounted(() => {
  loadBookmarks()
})
</script>


