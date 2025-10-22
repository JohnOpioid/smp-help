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
        <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2">
            <UIcon :name="section.icon" class="w-4 h-4 text-slate-500" />
            <p class="text-sm text-slate-600 dark:text-slate-300">{{ section.label }}</p>
          </div>
          <!-- Специальный стиль для препаратов и кодификатора -->
          <div v-if="section.type === 'drug' || section.type === 'codifier'" class="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div 
              v-for="(bookmark, index) in section.items" 
              :key="bookmark._id" 
              class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700 last:border-b-0"
              :class="{
                'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0 && index < section.items.length - 1) || (index === section.items.length - 1 && section.items.length % 2 === 1),
                'md:border-b-0': index >= section.items.length - 2 && section.items.length % 2 === 0
              }"
              @click="openBookmark(bookmark)"
            >
              <!-- Содержимое для препаратов -->
              <div v-if="section.type === 'drug'" class="flex items-start justify-between">
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-1">
                    {{ bookmark.title }}
                  </h3>
                  <p v-if="bookmark.description" class="text-sm text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    {{ bookmark.description }}
                  </p>
                  <div class="flex items-center gap-1.5 mt-1 flex-wrap">
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
              
              <!-- Содержимое для кодификатора -->
              <div v-else-if="section.type === 'codifier'" class="flex items-start justify-between">
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
          
          <!-- Обычный стиль для других типов -->
          <div v-else class="divide-y divide-slate-100 dark:divide-slate-700">
            <div 
              v-for="bookmark in section.items" 
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
                  <!-- Отображение отдельных секций для локальных статусов -->
                  <div v-if="bookmark.type === 'local-status'" class="space-y-2 mb-2">
                    <div v-if="bookmark.complaints && bookmark.complaints.trim()">
                      <label class="text-xs font-medium text-slate-600 dark:text-slate-400">Жалобы</label>
                      <div class="text-sm text-slate-900 dark:text-white line-clamp-2">
                        {{ bookmark.complaints }}
                      </div>
                    </div>
                    <div v-if="bookmark.anamnesis && bookmark.anamnesis.trim()">
                      <label class="text-xs font-medium text-slate-600 dark:text-slate-400">Анамнез</label>
                      <div class="text-sm text-slate-900 dark:text-white line-clamp-2">
                        {{ bookmark.anamnesis }}
                      </div>
                    </div>
                    <div v-if="bookmark.localis && bookmark.localis.trim()">
                      <label class="text-xs font-medium text-slate-600 dark:text-slate-400">Status localis</label>
                      <div class="text-sm text-slate-900 dark:text-white line-clamp-2">
                        {{ bookmark.localis }}
                      </div>
                    </div>
                    <div v-if="bookmark.description && bookmark.description.trim()">
                      <label class="text-xs font-medium text-slate-600 dark:text-slate-400">Примечание</label>
                      <div class="text-sm text-slate-900 dark:text-white line-clamp-2">
                        {{ bookmark.description }}
                      </div>
                    </div>
                  </div>
                  <!-- Обычное описание для других типов -->
                  <div v-else-if="bookmark.description && bookmark.description.trim()" class="text-sm text-slate-600 dark:text-slate-300 mb-2 whitespace-pre-line line-clamp-3">
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


