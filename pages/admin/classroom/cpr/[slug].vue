<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 space-y-4">
        <div class="flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">СЛР – редактирование таблицы</h3>
          <div class="flex items-center gap-2">
            <UButton color="error" variant="soft" @click="onDelete" class="cursor-pointer">Удалить</UButton>
            <UButton color="neutral" variant="soft" @click="resetFromDoc" class="cursor-pointer">Сбросить</UButton>
            <UButton color="primary" :loading="pending" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
          </div>
        </div>

        <UForm :state="form">
          <div class="grid grid-cols-1 gap-3">
            <UFormField label="Заголовок" class="w-full">
              <UInput v-model="form.title" size="lg" class="w-full" placeholder="Параметры проведения СЛР" />
            </UFormField>
          </div>
        </UForm>

        <div>
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-medium text-slate-700 dark:text-slate-200">Таблица</h4>
            <div class="flex items-center gap-2">
              <UButton size="xs" variant="soft" @click="addColumn" class="cursor-pointer">Добавить столбец</UButton>
              <UButton size="xs" variant="soft" @click="addRow" class="cursor-pointer">Добавить строку</UButton>
              <UButton size="xs" variant="soft" @click="mergeRight" :disabled="!hasSelection" class="cursor-pointer">Объединить вправо</UButton>
              <UButton size="xs" variant="soft" @click="mergeDown" :disabled="!hasSelection" class="cursor-pointer">Объединить вниз</UButton>
              <UButton size="xs" variant="soft" @click="unmergeRight" :disabled="!hasSelection" class="cursor-pointer">Разъединить вправо</UButton>
              <UButton size="xs" variant="soft" @click="unmergeDown" :disabled="!hasSelection" class="cursor-pointer">Разъединить вниз</UButton>
            </div>
          </div>
          <div class="overflow-x-auto rounded-md border border-slate-200 dark:border-slate-700">
            <table class="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800">
              <tbody>
                <tr v-for="(row, r) in form.grid" :key="r">
                  <template v-for="(cell, c) in row" :key="c">
                    <td v-if="!cell.hidden" :colspan="cell.colspan || 1" :rowspan="cell.rowspan || 1" class="align-top p-0 border border-slate-200 dark:border-slate-700">
                      <textarea v-model="form.grid[r][c].value" rows="1" data-cpr-ta
                        class="w-full bg-transparent outline-none border-0 resize-none p-2"
                        @focus="selectCell(r, c)"
                        @input="(e:any) => autoResize(e.target)" />
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Добавляйте строки и столбцы, поддерживается объединение соседних ячеек.</p>
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
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const pending = ref(false)

const { data, refresh } = await useFetch<any>(() => slug.value ? `/api/cpr/${slug.value}` : null, { server: false })
const doc = computed<any>(() => (data as any)?.value?.item || null)
const docSlug = computed(() => doc.value?.slug || slug.value)

type GridCell = { value: string; colspan?: number; rowspan?: number; hidden?: boolean }
const form = reactive<{ title: string; grid: GridCell[][]; notes: string[] }>({
  title: '', grid: [], notes: []
})

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

const ensureGrid = (g: any) => Array.isArray(g) ? g : []
const resetFromDoc = () => {
  Object.assign(form, {
    title: doc.value?.title || '',
    grid: ensureGrid(doc.value?.grid || []),
    notes: (doc.value?.notes || []).slice()
  })
}
watch(doc, () => resetFromDoc(), { immediate: true })

const onSubmit = async () => {
  pending.value = true
  try {
    await $fetch(`/api/cpr/${slug.value}` , { method: 'PATCH', body: { title: form.title, grid: form.grid, notes: form.notes } })
    await refresh()
  } finally {
    pending.value = false
  }
}

const addRow = () => {
  const cols = Math.max(1, (form.grid[0]?.length || 0))
  const row: GridCell[] = Array.from({ length: cols }, () => ({ value: '', colspan: 1, rowspan: 1, hidden: false }))
  form.grid.push(row)
}
const addColumn = () => {
  if (form.grid.length === 0) form.grid.push([{ value: '', colspan: 1, rowspan: 1, hidden: false }])
  form.grid.forEach((row) => row.push({ value: '', colspan: 1, rowspan: 1, hidden: false }))
}
const addNote = () => form.notes.push('')
const removeNote = (i: number) => form.notes.splice(i, 1)

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
onMounted(() => { nextTick(() => resizeAll()) })
watch(() => form.grid, () => nextTick(() => resizeAll()), { deep: true })

const selection = reactive<{ r: number | null; c: number | null }>({ r: null, c: null })
const hasSelection = computed(() => selection.r != null && selection.c != null)
function selectCell(r: number, c: number) { selection.r = r; selection.c = c }
function mergeRight() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const row = form.grid[r]
  const cell = row[c]
  const next = row[c + 1]
  if (!next || next.hidden) return
  cell.colspan = (cell.colspan || 1) + 1
  next.hidden = true
}
function mergeDown() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const cell = form.grid[r][c]
  const below = form.grid[r + 1]?.[c]
  if (!below || below.hidden) return
  cell.rowspan = (cell.rowspan || 1) + 1
  below.hidden = true
}

function unmergeRight() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const cell = form.grid[r][c]
  const span = cell.colspan || 1
  if (span <= 1) return
  const idxToUnhide = c + span - 1
  const row = form.grid[r]
  if (row[idxToUnhide]) {
    row[idxToUnhide].hidden = false
    row[idxToUnhide].colspan = 1
    row[idxToUnhide].rowspan = 1
    cell.colspan = span - 1
  }
}

function unmergeDown() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const cell = form.grid[r][c]
  const span = cell.rowspan || 1
  if (span <= 1) return
  const rowIdxToUnhide = r + span - 1
  const target = form.grid[rowIdxToUnhide]?.[c]
  if (target) {
    target.hidden = false
    target.colspan = 1
    target.rowspan = 1
    cell.rowspan = span - 1
  }
}

const onDelete = async () => {
  if (!confirm('Удалить эту страницу?')) return
  pending.value = true
  try {
    const res: any = await $fetch(`/api/cpr/${docSlug.value}`, { method: 'DELETE' })
    if (!res?.success || !res?.deletedCount) {
      // @ts-ignore
      const toast = useToast?.(); toast?.add?.({ title: 'Не удалось удалить', color: 'error' })
      return
    }
    const pagesVersion = useState<number>('classroomPagesVersion')
    if (pagesVersion) pagesVersion.value = (pagesVersion.value || 0) + 1
    await navigateTo('/admin/classroom')
  } finally {
    pending.value = false
  }
}
</script>

<style scoped>
.table-cpr :deep(thead th:first-child),
.table-cpr :deep(tbody td:first-child) {
  border-left-width: 0 !important;
}
.table-cpr :deep(thead th:last-child),
.table-cpr :deep(tbody td:last-child) {
  border-right-width: 0 !important;
}
</style>


