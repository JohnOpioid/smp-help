<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <div class="bg-white dark:bg-slate-800 rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Выберите категорию</p>
      </div>

    <div v-if="pending" class="space-y-3">
      <USkeleton class="h-8 w-1/3" />
      <USkeleton v-for="i in 4" :key="i" class="h-14 w-full" />
    </div>

    <div v-else>
      <div v-if="items.length === 0" class="text-sm text-slate-500 dark:text-slate-400">Доступных категорий пока нет</div>
      <ul class="divide-y divide-slate-100 dark:divide-slate-700">
        <li v-for="cat in items" :key="cat._id" class="hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer">
          <NuxtLink :to="`/tests/${cat._id}`" class="flex items-start gap-3 px-4 py-3">
            <div class="min-w-0 flex-1">
              <p class="text-slate-900 dark:text-white font-medium truncate">{{ cat.name }}</p>
              <p v-if="cat.description" class="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{{ cat.description }}</p>
              <UButton
                v-if="cat.courseLink"
                size="xs"
                color="slate"
                variant="soft"
                icon="i-heroicons-academic-cap"
                class="mt-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600"
                @click.stop="window.open(cat.courseLink, '_blank', 'noopener,noreferrer')"
              >
                Курс на портале
              </UButton>
            </div>
            <span class="text-xs px-2 py-1 rounded bg-slate-200 text-slate-600 font-mono whitespace-nowrap">{{ countsMap[cat._id] ?? 0 }} {{ getTestWord(countsMap[cat._id] ?? 0) }}</span>
          </NuxtLink>
        </li>
      </ul>
    </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })

const items = ref<any[]>([])
const pending = ref(true)
const testsEnabled = ref<boolean>(true)
const countsMap = reactive<Record<string, number>>({})

function getTestWord(count: number): string {
  const lastDigit = count % 10
  const lastTwoDigits = count % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return 'тестов'
  if (lastDigit === 1) return 'тест'
  if (lastDigit >= 2 && lastDigit <= 4) return 'теста'
  return 'тестов'
}

onMounted(async () => {
  try {
    const s: any = await $fetch('/api/settings/tests-enabled', { cache: 'no-cache' as any })
    testsEnabled.value = Boolean(s?.enabled)
    if (!testsEnabled.value) {
      // Раздел отключён
      return
    }
    const res: any = await $fetch('/api/tests/categories?publicOnly=1', { cache: 'no-cache' as any })
    items.value = Array.isArray(res?.items) ? res.items : []
    // Загружаем количества тестов по категориям (только одобренные для публичной страницы)
    await Promise.all(items.value.map(async (cat: any) => {
      try {
        const qs: any = await $fetch(`/api/tests?category=${cat._id}`, { cache: 'no-cache' as any })
        countsMap[cat._id] = Array.isArray(qs?.items) ? qs.items.length : 0
      } catch {
        countsMap[cat._id] = 0
      }
    }))
  } finally {
    pending.value = false
  }
})
</script>


