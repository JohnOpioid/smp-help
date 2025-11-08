<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
          <div class="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">СЛР – редактирование таблицы</h3>
            <div class="flex items-center gap-2">
              <UButton color="neutral" variant="soft" @click="resetFromDoc" class="cursor-pointer">Сбросить</UButton>
              <UButton color="primary" :loading="pending" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
            </div>
          </div>

          <div class="p-4 space-y-4">
            <UForm :state="form">
              <div class="grid grid-cols-1 gap-3">
                <UFormField label="Заголовок" class="w-full">
                  <UInput v-model="form.title" size="lg" class="w-full" placeholder="Параметры проведения СЛР" />
                </UFormField>
              </div>
            </UForm>

            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-200">Строки таблицы</h4>
                <UButton size="xs" variant="soft" @click="addRow" class="cursor-pointer">Добавить строку</UButton>
              </div>
              <div class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
                <table class="w-full table-fixed text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 table-cpr">
                  <thead>
                    <tr class="bg-slate-50 dark:bg-slate-700/60">
                      <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[22%]">Этап</th>
                      <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[26%]">Взрослые / ≥14 лет</th>
                      <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[26%]">Дети</th>
                      <th class="px-3 py-2 text-center uppercase tracking-wide border-x border-slate-200 dark:border-slate-700 w-[26%]">Новорождённые</th>
                      <th class="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
                    <tr v-for="(r, i) in form.rows" :key="i">
                      <td class="align-top p-0 border-x border-slate-200 dark:border-slate-700">
                        <textarea v-model="r.stage" rows="1" placeholder="Этап" data-cpr-ta
                          class="w-full bg-transparent outline-none border-0 rounded-none resize-none p-2"
                          @input="(e: any) => onCellInput(i, 'stage', e)" />
                      </td>
                      <td class="align-top p-0 border-x border-slate-200 dark:border-slate-700">
                        <textarea v-model="r.adults" rows="1" placeholder="Взрослые / ≥14 лет" data-cpr-ta
                          class="w-full bg-transparent outline-none border-0 rounded-none resize-none p-2"
                          @input="(e: any) => onCellInput(i, 'adults', e)" />
                      </td>
                      <td class="align-top p-0 border-x border-slate-200 dark:border-slate-700">
                        <textarea v-model="r.children" rows="1" placeholder="Дети" data-cpr-ta
                          class="w-full bg-transparent outline-none border-0 rounded-none resize-none p-2"
                          @input="(e: any) => onCellInput(i, 'children', e)" />
                      </td>
                      <td class="align-top p-0 border-x border-slate-200 dark:border-slate-700">
                        <textarea v-model="r.newborns" rows="1" placeholder="Новорождённые" data-cpr-ta
                          class="w-full bg-transparent outline-none border-0 rounded-none resize-none p-2"
                          @input="(e: any) => onCellInput(i, 'newborns', e)" />
                      </td>
                      <td class="align-top p-2 whitespace-nowrap"><UButton size="xs" color="error" variant="soft" @click="removeRow(i)" class="cursor-pointer">Удалить</UButton></td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Поддерживаются переносы строк и Markdown-разметка в ячейках.</p>
            </div>

            <div>
              <div class="flex items-center justify-between mb-2">
                <h4 class="text-sm font-medium text-slate-700 dark:text-slate-200">Примечания</h4>
                <UButton size="xs" variant="soft" @click="addNote" class="cursor-pointer">Добавить пункт</UButton>
              </div>
              <div class="space-y-2">
                <div v-for="(n, i) in form.notes" :key="i" class="flex items-start gap-2">
                  <UTextarea v-model="form.notes[i]" autoresize :min-rows="3" class="flex-1" placeholder="Текст примечания" />
                  <UButton size="xs" color="error" variant="soft" @click="removeNote(i)" class="cursor-pointer">Удалить</UButton>
                </div>
              </div>
            </div>
          </div>

          <div class="p-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <UButton color="neutral" variant="soft" @click="resetFromDoc" class="cursor-pointer">Сбросить</UButton>
            <UButton color="primary" :loading="pending" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

const open = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)
const pending = ref(false)
const pendingList = ref(false)
const total = ref(0)

const { data, refresh, pending: fetching } = await useFetch('/api/classroom/section/cpr', { server: false })
const doc = computed(() => data.value?.item || null)
const items = computed(() => doc.value ? [doc.value] : [])
watch(doc, v => { total.value = v ? 1 : 0 })
watch(fetching, v => { pendingList.value = !!v })

const form = reactive<{ title: string; slug: string; order: number; rows: Array<any>; notes: string[] }>({
  title: '', slug: '', order: 0, rows: [], notes: []
})

// Инициализируем форму текущими данными
const toEditableRows = (rows: any[] = []) => rows.map(r => ({
  stage: String(r?.stage || '').replace(/<br\s*\/?>(\n)?/gi, '\n'),
  adults: String(r?.adults || '').replace(/<br\s*\/?>(\n)?/gi, '\n'),
  children: String(r?.children || '').replace(/<br\s*\/?>(\n)?/gi, '\n'),
  newborns: String(r?.newborns || '').replace(/<br\s*\/?>(\n)?/gi, '\n')
}))
const toSaveRows = (rows: any[] = []) => rows.map(r => ({
  stage: String(r?.stage || '').replace(/\n/g, '<br>'),
  adults: String(r?.adults || '').replace(/\n/g, '<br>'),
  children: String(r?.children || '').replace(/\n/g, '<br>'),
  newborns: String(r?.newborns || '').replace(/\n/g, '<br>')
}))

const resetFromDoc = () => {
  Object.assign(form, {
    title: doc.value?.title || 'Параметры проведения СЛР',
    slug: 'cpr',
    order: doc.value?.order || 0,
    rows: toEditableRows(doc.value?.data?.rows || []),
    notes: (doc.value?.data?.notes || []).slice()
  })
}
watch(doc, () => resetFromDoc(), { immediate: true })

const onEdit = (item: any) => {
  isEdit.value = true
  currentId.value = item._id
  Object.assign(form, { title: item.title, slug: item.slug, order: item.order || 0, rows: JSON.parse(JSON.stringify(item.rows || [])), notes: (item.notes || []).slice() })
  open.value = true
}

const onSubmit = async () => {
  pending.value = true
  try {
    await $fetch('/api/classroom/section/cpr', {
      method: 'PATCH',
      body: { title: form.title, order: form.order, data: { rows: toSaveRows(form.rows), notes: form.notes } }
    })
    await refresh()
    open.value = false
  } finally {
    pending.value = false
  }
}

const onDelete = async (_item: any) => {
  alert('Для раздела СЛР предусмотрена одна запись. Удаление отключено.')
}

const addRow = () => form.rows.push({ stage: '', adults: '', children: '', newborns: '' })
const removeRow = (i: number) => form.rows.splice(i, 1)
const addNote = () => form.notes.push('')
const removeNote = (i: number) => form.notes.splice(i, 1)

import { h } from 'vue'
import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod = await import('dompurify')
  const createDOMPurify = (mod as any).default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}
const format = (t: string) => sanitizeHtml(marked.parse((t || '').replace(/\r\n?/g, '\n')) as string)

// Авто-ресайз для textarea под контент
const autoResize = (el: HTMLTextAreaElement | null) => {
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
const resizeAll = () => {
  if (!process.client) return
  const list = document.querySelectorAll('textarea[data-cpr-ta]')
  list.forEach((n) => autoResize(n as HTMLTextAreaElement))
}
onMounted(() => {
  nextTick(() => resizeAll())
})
watch(() => form.rows, () => nextTick(() => resizeAll()), { deep: true })

// Нормализация ввода: заменяем '<br>' на перевод строки сразу при вводе
const onCellInput = (idx: number, key: 'stage'|'adults'|'children'|'newborns', e: Event) => {
  const el = e.target as HTMLTextAreaElement
  const txt = String(el.value || '')
  const normalized = txt.replace(/<br\s*\/?>(\n)?/gi, '\n')
  if (normalized !== txt) {
    form.rows[idx][key] = normalized
    nextTick(() => autoResize(el))
  } else {
    autoResize(el)
  }
}
</script>

<style scoped>
/* Убираем внешние вертикальные границы у первой и последней колонок */
.table-cpr :deep(thead th:first-child),
.table-cpr :deep(tbody td:first-child) {
  border-left-width: 0 !important;
}
.table-cpr :deep(thead th:last-child),
.table-cpr :deep(tbody td:last-child) {
  border-right-width: 0 !important;
}
</style>




