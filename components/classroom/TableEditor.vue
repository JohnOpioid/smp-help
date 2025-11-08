<template>
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
          <tr v-for="(row, r) in modelValue" :key="r">
            <template v-for="(cell, c) in row" :key="c">
              <td v-if="!cell.hidden" :colspan="cell.colspan || 1" :rowspan="cell.rowspan || 1" class="align-top p-0 border border-slate-200 dark:border-slate-700">
                <textarea v-model="mutable[r][c].value" rows="1" data-cpr-ta
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
  
</template>

<script setup lang="ts">
type GridCell = { value: string; colspan?: number; rowspan?: number; hidden?: boolean }
const props = defineProps<{ modelValue: GridCell[][] }>()
const emit = defineEmits<{ 'update:modelValue': [GridCell[][]] }>()

const mutable = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const selection = reactive<{ r: number | null; c: number | null }>({ r: null, c: null })
const hasSelection = computed(() => selection.r != null && selection.c != null)
function selectCell(r: number, c: number) { selection.r = r; selection.c = c }

function addRow() {
  const cols = Math.max(1, (mutable.value[0]?.length || 0))
  const row: GridCell[] = Array.from({ length: cols }, () => ({ value: '', colspan: 1, rowspan: 1, hidden: false }))
  mutable.value = [...mutable.value, row]
}
function addColumn() {
  if (mutable.value.length === 0) {
    mutable.value = [[{ value: '', colspan: 1, rowspan: 1, hidden: false }]]
    return
  }
  mutable.value = mutable.value.map((row) => [...row, { value: '', colspan: 1, rowspan: 1, hidden: false }])
}

function mergeRight() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const row = mutable.value[r]
  const cell = row[c]
  const next = row[c + 1]
  if (!next || next.hidden) return
  cell.colspan = (cell.colspan || 1) + 1
  next.hidden = true
  emit('update:modelValue', mutable.value)
}
function mergeDown() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const cell = mutable.value[r][c]
  const below = mutable.value[r + 1]?.[c]
  if (!below || below.hidden) return
  cell.rowspan = (cell.rowspan || 1) + 1
  below.hidden = true
  emit('update:modelValue', mutable.value)
}
function unmergeRight() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const cell = mutable.value[r][c]
  const span = cell.colspan || 1
  if (span <= 1) return
  const idxToUnhide = c + span - 1
  const row = mutable.value[r]
  if (row[idxToUnhide]) {
    row[idxToUnhide].hidden = false
    row[idxToUnhide].colspan = 1
    row[idxToUnhide].rowspan = 1
    cell.colspan = span - 1
    emit('update:modelValue', mutable.value)
  }
}
function unmergeDown() {
  if (!hasSelection.value) return
  const r = selection.r as number; const c = selection.c as number
  const cell = mutable.value[r][c]
  const span = cell.rowspan || 1
  if (span <= 1) return
  const rowIdxToUnhide = r + span - 1
  const target = mutable.value[rowIdxToUnhide]?.[c]
  if (target) {
    target.hidden = false
    target.colspan = 1
    target.rowspan = 1
    cell.rowspan = span - 1
    emit('update:modelValue', mutable.value)
  }
}

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
onMounted(() => nextTick(() => resizeAll()))
watch(mutable, () => nextTick(() => resizeAll()), { deep: true })
</script>


