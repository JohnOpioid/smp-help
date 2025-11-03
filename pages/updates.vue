<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <h1 class="text-3xl font-bold text-slate-900 dark:text-white mb-6">Обновления</h1>

    <div class="bg-white dark:bg-slate-800 rounded-lg p-4 md:p-6">
      <UTimeline orientation="vertical" size="lg" :items="timelineItems" class="w-full">
        <template #date="{ item }">
          <div class="flex flex-col gap-1">
            <UBadge v-if="item.badge" variant="outline" size="sm" class="w-fit">{{ item.badge }}</UBadge>
            <div class="text-dimmed text-xs/5">{{ item.date }}</div>
          </div>
        </template>
        <template #description="{ item }">
          <div class="md-content text-wrap text-sm" v-html="item.descriptionHtml" />
        </template>
      </UTimeline>
    </div>
  </div>
</template>

<script setup lang="ts">
useHead({ title: 'Обновления — Справочник СМП' })
definePageMeta({ headerTitle: 'Обновления' })

const items = ref<any[]>([])

onMounted(async () => {
  try {
    const res: any = await $fetch('/api/news')
    if (res?.success) items.value = res.items
  } catch (e) { console.error(e) }
})

import type { TimelineItem } from '@nuxt/ui'
import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod: any = await import('dompurify')
  const createDOMPurify = mod.default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}

function toDateStr(d: any) {
  try { const dt = d ? new Date(d) : null; return dt ? dt.toLocaleDateString() : '' } catch { return '' }
}

const timelineItems = computed<TimelineItem[]>(() => (items.value || []).map((n: any, idx: number, arr: any[]) => {
  const raw = (n.description || '').replace(/\r\n?/g, '\n')
  const html = sanitizeHtml(marked.parse(raw) as string)
  const version = n.version && String(n.version).trim() ? String(n.version).trim() : null
  return {
    date: toDateStr(n.date || n.createdAt),
    title: n.title,
    description: '',
    icon: (n.icon && String(n.icon).trim() !== '') ? n.icon : 'i-lucide-newspaper',
    descriptionHtml: html,
    badge: version ? `v${version}` : undefined,
    ui: idx === arr.length - 1 ? { wrapper: 'pb-0' } : undefined
  } as any
}))
</script>


