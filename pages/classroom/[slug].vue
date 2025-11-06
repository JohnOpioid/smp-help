<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-4">
    <h1 class="text-2xl font-bold text-slate-900 dark:text-white">{{ title }}</h1>

    <template v-if="type === 'list'">
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="p-4 border-b border-slate-100 dark:border-slate-700">
          <p class="text-sm text-slate-600 dark:text-slate-300">Список доступных инструкций</p>
        </div>
        <ul class="divide-y divide-slate-100 dark:divide-slate-700">
          <li v-for="(it, i) in listItems" :key="i" class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer" @click="openItem(i)">
            <div class="flex items-center justify-between">
              <p class="text-slate-900 dark:text-white font-medium">{{ it.title }}</p>
              <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <div class="md-content md-preview text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{{ itemPreview(it) }}</div>
          </li>
        </ul>
      </div>

      <template v-if="!isMobile">
        <UModal 
          v-model:open="open"
          :title="currentItem?.title || ''"
          description="Инструкция"
          :ui="{
            overlay: 'bg-slate-700/50',
            wrapper: 'sm:max-w-lg',
            content: 'sm:rounded-md rounded-t-md max-h-[80vh] sm:max-h-[85vh]',
            body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
            close: 'cursor-pointer'
          }"
        >
          <template #body>
            <div class="space-y-3">
              <div v-for="(f, fi) in (currentItem?.fields || [])" :key="fi" class="space-y-1">
                <div v-if="f.label" class="text-sm text-slate-500 dark:text-slate-400">{{ f.label }}</div>
                <div v-if="f.type === 'input'" class="text-slate-900 dark:text-white">{{ f.value }}</div>
                <div v-else class="md-content leading-6 text-slate-700 dark:text-slate-300" v-html="md(f.value)"></div>
              </div>
            </div>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="close" class="cursor-pointer">Закрыть</UButton>
            </div>
          </template>
        </UModal>
      </template>

      <template v-else>
        <ClientOnly>
          <BottomSheet v-model="open" :title="currentItem?.title" @close="close">
            <div class="p-4 pb-6">
              <div class="space-y-3">
                <div v-for="(f, fi) in (currentItem?.fields || [])" :key="fi" class="space-y-1">
                  <div v-if="f.label" class="text-sm text-slate-500 dark:text-slate-400">{{ f.label }}</div>
                  <div v-if="f.type === 'input'" class="text-slate-900 dark:text-white">{{ f.value }}</div>
                  <div v-else class="md-content leading-6 text-slate-700 dark:text-slate-300 text-sm" v-html="md(f.value)"></div>
                </div>
              </div>
            </div>
            <template #footer>
              <div class="flex justify-end">
                <UButton color="neutral" variant="ghost" type="button" @click="close" class="cursor-pointer">Закрыть</UButton>
              </div>
            </template>
          </BottomSheet>
        </ClientOnly>
      </template>
    </template>

    <template v-else-if="type === 'table'">
      <div class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
        <table class="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800">
          <thead>
            <tr class="bg-slate-50 dark:bg-slate-700/60">
              <th class="px-3 py-2 text-center">Этап</th>
              <th class="px-3 py-2 text-center">Взрослые / ≥14 лет</th>
              <th class="px-3 py-2 text-center">Дети</th>
              <th class="px-3 py-2 text-center">Новорождённые</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
            <tr v-for="(r, i) in cprRows" :key="i">
              <td class="align-top p-2" v-html="fmt(r.stage)"></td>
              <td class="align-top p-2" v-html="fmt(r.adults)"></td>
              <td class="align-top p-2" v-html="fmt(r.children)"></td>
              <td class="align-top p-2" v-html="fmt(r.newborns)"></td>
            </tr>
          </tbody>
        </table>
      </div>
      <div v-if="cprNotes.length" class="space-y-1 text-sm text-slate-600 dark:text-slate-300">
        <div v-for="(n, i) in cprNotes" :key="i">• {{ n }}</div>
      </div>
    </template>

    <template v-else-if="type === 'scheme'">
      <div class="text-sm text-slate-500 dark:text-slate-400">Эта схема доступна в админ-редакторе.</div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'auth', headerTitle: 'Учебная комната' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const { data: pagesData } = await useFetch('/api/classroom/pages', { server: true })
const found = computed<any>(() => (pagesData.value?.items || []).find((x: any) => x.slug === slug.value))

const type = computed<'list'|'table'|'scheme'|null>(() => (found.value?.type || null))
const title = computed(() => found.value?.title || '')

const listItems = ref<any[]>([])
const open = ref(false)
const currentIndex = ref<number | null>(null)
const currentItem = computed<any | null>(() => (currentIndex.value != null ? listItems.value[currentIndex.value] : null))
const { isMobile } = useIsMobile()
const cprRows = ref<any[]>([])
const cprNotes = ref<string[]>([])

watchEffect(async () => {
  if (!type.value || !slug.value) return
  if (type.value === 'list') {
    const res: any = await $fetch(`/api/classroom/list/${slug.value}`)
    listItems.value = (res?.item?.items || [])
  } else if (type.value === 'table') {
    const res: any = await $fetch(`/api/cpr/${slug.value}`)
    cprRows.value = res?.item?.rows || []
    cprNotes.value = res?.item?.notes || []
  } else if (type.value === 'scheme') {
    // схему не рендерим здесь (сложно и тяжело); можно позже добавить viewer
  }
})

function close() { open.value = false }

function itemPreview(it: any) {
  const values = (it?.fields || []).map((f: any) => String(f?.value || ''))
  return values.join('\n').slice(0, 500)
}

function openItem(i: number) {
  currentIndex.value = i
  open.value = true
}

import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod = await import('dompurify')
  const createDOMPurify = (mod as any).default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}
const fmt = (t: string) => sanitizeHtml(marked.parse((t || '').replace(/\r\n?/g, '\n')) as string)
const md = (t: string) => fmt(t)
</script>


