<template>
  <div class="flex flex-col h-full">
    <main class="flex-1 flex flex-col overflow-hidden">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8 flex flex-col flex-1 w-full">
        <div v-if="pending || !pageType" class="text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>

        <!-- List Editor -->
        <div v-else-if="pageType === 'list'" class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
            <div class="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white truncate">{{ listForm.title || 'Список' }}</h3>
            <UDropdownMenu :items="actionMenu" :ui="{ content: 'w-48', item: 'cursor-pointer' }">
              <UButton icon="i-lucide-ellipsis-vertical" size="sm" variant="ghost" square class="cursor-pointer" />
            </UDropdownMenu>
          </div>

          <div class="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <div class="text-sm font-medium text-slate-700 dark:text-slate-200">Пункты ({{ listForm.items.length }})</div>
            <UButton size="sm" variant="soft" icon="i-lucide-plus" @click="addItem" class="cursor-pointer">Добавить пункт</UButton>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-700">
            <div v-if="listForm.items.length === 0" class="p-6 text-center">
              <p class="text-sm text-slate-500 dark:text-slate-400">Пока ничего не добавлено</p>
            </div>
            <div v-for="(it, i) in listForm.items" :key="it._id || i" class="p-3 space-y-3">
              <div class="grid grid-cols-1 gap-2">
                <UInput v-model="listForm.items[i].title" placeholder="Заголовок" size="lg" class="w-full" />
                <div class="flex items-center gap-2 justify-end">
                  <UButton size="sm" variant="soft" icon="i-lucide-square-plus" @click="addField(i, 'input')" class="cursor-pointer">Добавить поле</UButton>
                  <UButton size="sm" variant="soft" icon="i-lucide-file-text" @click="addField(i, 'textarea')" class="cursor-pointer">Добавить текст</UButton>
                  <UButton size="sm" color="error" variant="soft" icon="i-lucide-trash" @click="removeItem(i)" class="cursor-pointer">Удалить пункт</UButton>
                </div>
                <div class="space-y-3">
                  <div v-for="(f, fi) in (listForm.items[i].fields || [])" :key="f._id || fi" class="space-y-2">
                    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-start">
                      <div class="space-y-2">
                        <UInput v-model="listForm.items[i].fields[fi].label" placeholder="Подпись" size="lg" class="w-full" />
                        <UInput v-if="f.type === 'input'" v-model="listForm.items[i].fields[fi].value" placeholder="Значение" size="lg" class="w-full" />
                        <UTextarea v-else v-model="listForm.items[i].fields[fi].value" :rows="4" placeholder="Текст" size="lg" class="w-full" />
                      </div>
                      <div class="flex flex-col items-end gap-2 md:self-start">
                        <UButton size="sm" variant="soft" :icon="f.type === 'input' ? 'i-lucide-file-text' : 'i-lucide-square-plus'" @click="toggleType(i, fi)" class="cursor-pointer">{{ f.type === 'input' ? 'На текст' : 'На поле' }}</UButton>
                        <UButton size="sm" color="error" variant="soft" icon="i-lucide-trash" @click="removeField(i, fi)" class="cursor-pointer">Удалить</UButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="p-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <UButton color="primary" :loading="saving" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
          </div>
        </div>

        <!-- Table Editor -->
        <div v-else-if="pageType === 'table'" class="space-y-4">
          <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
            <div class="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white truncate">{{ tableForm.title || 'Таблица' }}</h3>
              <UDropdownMenu :items="actionMenu" :ui="{ content: 'w-48', item: 'cursor-pointer' }">
                <UButton icon="i-lucide-ellipsis-vertical" size="sm" variant="ghost" square class="cursor-pointer" />
              </UDropdownMenu>
            </div>

            <div class="p-4 space-y-4">
              <div>
                <div class="relative">
                  <div class="flex gap-0">
                    <div class="flex-1">
                      <div class="relative">
                        <table 
                          ref="tableRef"
                          class="w-full text-sm text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 relative"
                        >
                          <tbody>
                            <tr 
                              v-for="(row, r) in displayGrid" 
                              :key="r" 
                              :class="[
                                'relative group-row',
                                tableForm.rowStyles?.[r]?.rowClass || ''
                              ]"
                              @mouseenter="hoveredRow = r"
                              @mouseleave="hoveredRow = null"
                            >
                              <template v-for="(cell, c) in row" :key="c">
                                <ClientOnly>
                                  <UContextMenu :items="getCellMenuItems(r, c)" :ui="{ content: 'w-64' }">
                                    <td 
                                      v-if="!cell.hidden"
                                      :colspan="cell.colspan || 1" 
                                      :rowspan="cell.rowspan || 1" 
                                      :class="[
                                        'p-0 border border-slate-200 dark:border-slate-700 relative group-cell min-w-[100px] min-h-[40px]',
                                        cell.verticalAlign === 'middle' ? 'align-middle' : cell.verticalAlign === 'bottom' ? 'align-bottom' : 'align-top',
                                        tableForm.columnStyles?.[c]?.columnClass || '',
                                        cell.cellClass || ''
                                      ]"
                                      :style="{
                                        textAlign: cell.textAlign || 'left',
                                        width: tableForm.columnStyles?.[c]?.width || undefined,
                                        verticalAlign: cell.verticalAlign || 'top'
                                      }"
                                      @mouseenter="hoveredCol = c"
                                      @mouseleave="hoveredCol = null"
                                    >
                                      <div 
                                        class="w-full h-full flex"
                                        :class="{
                                          'items-start': cell.verticalAlign === 'top' || !cell.verticalAlign,
                                          'items-center': cell.verticalAlign === 'middle',
                                          'items-end': cell.verticalAlign === 'bottom'
                                        }"
                                      >
                                        <textarea 
                                          :value="getCellValue(r, c)"
                                          @input="(e:any) => { setCellValue(r, c, e.target.value); autoResize(e.target) }"
                                          rows="1" 
                                          data-cpr-ta
                                          class="w-full bg-transparent outline-none border-0 resize-none p-2"
                                          :style="{ textAlign: cell.textAlign || 'left' }"
                                          @focus="selectCell(r, c)"
                                        />
                                      </div>
                                    
                                      <!-- Кнопка удаления столбца снизу -->
                                      <div 
                                        v-if="isLastRowInGrid(r, cell)"
                                        class="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-20 flex items-center justify-center transition-opacity"
                                        :class="hoveredCol === c ? 'opacity-100' : 'opacity-0'"
                                      >
                                        <button 
                                          type="button"
                                          class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-600"
                                          title="Удалить столбец"
                                          @click.stop="removeColumn(c)"
                                        >
                                          <UIcon name="i-lucide-minus" class="w-3 h-3" />
                                        </button>
                                      </div>
                                      
                                      <!-- Кнопка удаления строки справа -->
                                      <div 
                                        v-if="isLastColumnInRow(row, c, cell)"
                                        class="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-20 flex items-center justify-center transition-opacity"
                                        :class="hoveredRow === r ? 'opacity-100' : 'opacity-0'"
                                      >
                                        <button 
                                          type="button"
                                          class="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center shadow-lg cursor-pointer hover:bg-red-600"
                                          title="Удалить строку"
                                          @click.stop="removeRow(r)"
                                        >
                                          <UIcon name="i-lucide-minus" class="w-3 h-3" />
                                        </button>
                                      </div>
                                    </td>
                                  </UContextMenu>
                                </ClientOnly>
                              </template>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Добавляйте строки и столбцы, поддерживается объединение соседних ячеек.</p>
              </div>

              <div>
                <div class="flex items-center justify-between mb-2">
                  <h4 class="text-sm font-medium text-slate-700 dark:text-slate-200">Примечания</h4>
                  <UButton size="xs" variant="soft" @click="addNote" class="cursor-pointer">Добавить пункт</UButton>
                </div>
                <div class="space-y-2">
                  <div v-for="(n, i) in tableForm.notes" :key="i" class="flex items-start gap-2">
                    <UTextarea v-model="tableForm.notes[i]" autoresize :min-rows="3" class="flex-1" placeholder="Текст примечания" />
                    <UButton size="xs" color="error" variant="soft" @click="removeNote(i)" class="cursor-pointer">Удалить</UButton>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
              <UButton color="primary" :loading="saving" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
            </div>
          </div>
        </div>

        <!-- Scheme Editor -->
        <div v-else-if="pageType === 'scheme'" class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden flex flex-col flex-1 min-h-0">
            <div class="p-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white truncate">{{ schemeForm.title || 'Схема' }}</h3>
            <UDropdownMenu :items="actionMenu" :ui="{ content: 'w-48', item: 'cursor-pointer' }">
              <UButton icon="i-lucide-ellipsis-vertical" size="sm" variant="ghost" square class="cursor-pointer" />
            </UDropdownMenu>
          </div>

          <div class="flex-1 flex flex-col min-h-0 p-2">
            <ClientOnly>
              <UContextMenu :items="cmItems" :ui="{ content: 'w-64' }">
                <div ref="canvasWrap"
                  class="rounded-lg border border-dashed border-slate-300 dark:border-slate-600 overflow-hidden flex-1 flex flex-col min-h-0"
                  style="border-width: 1px; min-height: 500px; height: calc(100vh - 300px);"
                  @contextmenu.capture="prepareMenu">
                  <FlowEditor v-if="loaded" v-model:graph="workingGraph" 
                    @update:graph="(g: any) => { 
                      if (!g) return
                      if (isSavingScheme) return
                      const newEdgesCount = (g?.edges || []).length
                      const currentEdgesCount = (workingGraph.value?.edges || []).length
                      if (newEdgesCount === 0 && currentEdgesCount > 0) {
                        if (g.nodes && g.viewport) {
                          workingGraph.value = {
                            ...workingGraph.value,
                            nodes: g.nodes,
                            viewport: g.viewport
                          }
                        }
                        return
                      }
                      workingGraph.value = g 
                    }"
                    @select="onSelectNodeLeft"
                    @select-edge="onSelectEdgeLeft" 
                    @context-select-node="onSelectNodeCtx"
                    @context-select-edge="onSelectEdgeCtx" 
                    ref="flowRef" />
                  <div v-else class="bg-white dark:bg-slate-800 rounded-lg p-6 text-sm text-slate-600 dark:text-slate-300">Загрузка...</div>
                </div>
              </UContextMenu>
            </ClientOnly>
          </div>

          <div class="p-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-2">
            <UButton color="primary" :loading="saving" variant="solid" class="cursor-pointer" @click="onSubmit">Сохранить</UButton>
          </div>
        </div>

        <!-- Scheme Node/Edge Edit Slideover -->
        <USlideover v-if="pageType === 'scheme' && panelOpen" v-model:open="panelOpen" side="right"
          :title="selectedNodeId ? (isNewNode ? 'Новый блок' : 'Свойства узла') : 'Свойства связи'"
          description="Панель редактирования элемента диаграммы" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <div class="p-0 flex flex-col gap-3">
              <template v-if="selectedNodeId">
                <UInput v-model="nodeTitle" placeholder="Заголовок" size="lg" />
                <UTextarea v-model="nodeBody" :rows="10" placeholder="Markdown контент" size="lg" />
                <div class="flex flex-col gap-2">
                  <div class="text-sm text-slate-600 dark:text-slate-300">Цвет блока</div>
                  <div class="flex items-center gap-3">
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="neutral" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'neutral' 
                          ? 'border-slate-400 dark:border-slate-500 bg-slate-100 dark:bg-slate-700' 
                          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                      ]"></span>
                      <span class="text-sm">Обычный</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="blue" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'blue' 
                          ? 'border-blue-400 dark:border-blue-500 bg-blue-100 dark:bg-blue-700' 
                          : 'border-blue-200 dark:border-blue-900/50 bg-blue-50 dark:bg-blue-900/30'
                      ]"></span>
                      <span class="text-sm">Синий</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="pink" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'pink' 
                          ? 'border-pink-400 dark:border-pink-500 bg-pink-100 dark:bg-pink-700' 
                          : 'border-pink-200 dark:border-pink-900/50 bg-pink-50 dark:bg-pink-900/30'
                      ]"></span>
                      <span class="text-sm">Розовый</span>
                    </label>
                    <label class="inline-flex items-center gap-2 cursor-pointer">
                      <input type="radio" :name="`tone-${selectedNodeId || 'none'}`" v-model="nodeTone" value="green" class="sr-only" />
                      <span :class="[
                        'inline-block h-4 w-8 rounded-sm border',
                        nodeTone === 'green' 
                          ? 'border-green-400 dark:border-green-500 bg-green-100 dark:bg-green-700' 
                          : 'border-green-200 dark:border-green-900/50 bg-green-50 dark:bg-green-900/30'
                      ]"></span>
                      <span class="text-sm">Зелёный</span>
                    </label>
                  </div>
                </div>
              </template>
              <template v-else-if="selectedEdgeId">
                <UInput v-model="edgeLabel" placeholder="Подпись связи" size="lg" />
                <div class="flex items-center gap-2">
                  <UCheckbox v-model="edgeDashed" label="Пунктирная линия" />
                </div>
              </template>
            </div>
          </template>
          <template #footer>
            <div class="flex items-center gap-2 w-full justify-end">
              <UButton variant="soft" class="cursor-pointer" @click="panelOpen = false">Отмена</UButton>
              <UButton color="primary" class="cursor-pointer" @click="applyAndClose">Сохранить</UButton>
            </div>
          </template>
        </USlideover>

        <!-- Edit Slideover -->
        <USlideover v-model:open="editOpen" title="Редактирование страницы" description="Измените поля и сохраните" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="editForm">
              <div class="space-y-3 w-full">
                <UFormField label="Заголовок" required class="w-full">
                  <UInput v-model="editForm.title" size="lg" class="w-full" />
                </UFormField>
                <UFormField label="Описание" class="w-full" v-if="pageType !== 'table'">
                  <UTextarea v-model="editForm.description" :rows="4" size="lg" class="w-full" />
                </UFormField>
                <UFormField label="Иконка" class="w-full">
                  <UInput v-model="editForm.icon" placeholder="i-lucide-..." size="lg" class="w-full" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center gap-2 w-full justify-end">
              <UButton variant="ghost" class="cursor-pointer" @click="editOpen = false">Отмена</UButton>
              <UButton color="primary" :loading="savingMeta" class="cursor-pointer" @click="saveMeta">Сохранить</UButton>
            </div>
          </template>
        </USlideover>

        <!-- Slideover для редактирования стилей строк и столбцов -->
        <USlideover v-model:open="styleEditOpen" :title="styleEditType === 'row' ? 'Стиль строки' : 'Стиль столбца'" description="Настройте стили для строки или столбца" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <div class="space-y-4">
              <div v-if="styleEditType === 'row'">
                <UFormField label="CSS классы для строки" class="w-full">
                  <UInput v-model="styleEditForm.rowClass" placeholder="Например: bg-slate-50 dark:bg-slate-700/60" size="lg" class="w-full" />
                </UFormField>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Введите Tailwind CSS классы через пробел</p>
              </div>
              <div v-if="styleEditType === 'column'">
                <UFormField label="CSS классы для столбца" class="w-full">
                  <UInput v-model="styleEditForm.columnClass" placeholder="Например: px-3 py-2 text-center uppercase tracking-wide" size="lg" class="w-full" />
                </UFormField>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Введите Tailwind CSS классы через пробел</p>
                <UFormField label="Ширина столбца" class="w-full mt-4">
                  <UInput v-model="styleEditForm.width" placeholder="Например: 22% или 200px" size="lg" class="w-full" />
                </UFormField>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Введите ширину в процентах или пикселях</p>
              </div>
            </div>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton variant="ghost" @click="styleEditOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" @click="saveStyle" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { ContextMenuItem } from '@nuxt/ui'
import { MarkerType } from '@vue-flow/core'

definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Учебный класс' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const pending = ref(true)
const saving = ref(false)
const savingMeta = ref(false)
const pageType = ref<'list' | 'table' | 'scheme' | null>(null)

// Fetch page type
const { data: pagesData, refresh: refreshPages } = await useFetch('/api/classroom/pages', { server: false })
const found = computed<any>(() => (pagesData.value?.items || []).find((x: any) => x.slug === slug.value))

watch(found, () => {
  if (found.value) {
    pageType.value = found.value.type
    pending.value = false
  }
}, { immediate: true })

// List Editor State
const listForm = reactive<{ title: string; description: string; items: any[] }>({ title: '', description: '', items: [] })
const listData = ref<any>(null)
const refreshList = async () => {
  if (pageType.value === 'list' && slug.value) {
    try {
      const res = await $fetch<any>(`/api/classroom/list/${slug.value}`)
      listData.value = res
      if (res?.item) {
        Object.assign(listForm, {
          title: res.item.title || '',
          description: res.item.description || '',
          items: (res.item.items || []).map((it: any) => ({
            _id: it._id,
            title: it.title || '',
            fields: Array.isArray(it.fields) && it.fields.length
              ? JSON.parse(JSON.stringify(it.fields))
              : (it.description ? [{ type: 'textarea', label: 'Описание', value: it.description }] : [])
          }))
        })
      }
    } catch (e) {
      console.error('Failed to fetch list data:', e)
    }
  }
}
watch(() => [pageType.value, slug.value], () => { if (pageType.value === 'list') refreshList() }, { immediate: true })

// Table Editor State
type GridCell = { value: string; colspan?: number; rowspan?: number; hidden?: boolean; textAlign?: 'left' | 'center' | 'right'; verticalAlign?: 'top' | 'middle' | 'bottom'; cellClass?: string }
type RowStyle = { rowClass?: string }
type ColumnStyle = { columnClass?: string; width?: string }
const tableForm = reactive<{ title: string; grid: GridCell[][]; notes: string[]; rowStyles?: RowStyle[]; columnStyles?: ColumnStyle[] }>({
  title: '', grid: [], notes: [], rowStyles: [], columnStyles: []
})
const tableData = ref<any>(null)
const refreshTable = async () => {
  if (pageType.value === 'table' && slug.value) {
    try {
      const res = await $fetch<any>(`/api/cpr/${slug.value}`)
      tableData.value = res
      if (res?.item) {
        // Сохраняем текущий grid, если новый пустой
        const currentGrid = tableForm.grid.length > 0 ? tableForm.grid : null
        const newGrid = Array.isArray(res.item.grid) && res.item.grid.length > 0 
          ? JSON.parse(JSON.stringify(res.item.grid))
          : (currentGrid || [])
        // Загружаем стили из базы данных
        const newRowStyles = Array.isArray(res.item.rowStyles)
          ? JSON.parse(JSON.stringify(res.item.rowStyles))
          : []
        const newColumnStyles = Array.isArray(res.item.columnStyles)
          ? JSON.parse(JSON.stringify(res.item.columnStyles))
          : []
        Object.assign(tableForm, {
          title: res.item.title || '',
          grid: newGrid,
          notes: Array.isArray(res.item.notes) ? res.item.notes.slice() : [],
          rowStyles: newRowStyles,
          columnStyles: newColumnStyles
        })
      }
    } catch (e) {
      console.error('Failed to fetch table data:', e)
    }
  }
}
watch(() => [pageType.value, slug.value], () => { if (pageType.value === 'table') refreshTable() }, { immediate: true })

// Scheme Editor State
const schemeForm = reactive<{ title: string; description: string; data: any }>({
  title: '', description: '', data: {}
})
const workingGraph = ref<any>({ nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } })
const canvasWrap = ref<HTMLElement | null>(null)
const flowRef = ref<any>(null)
const loaded = computed(() => Boolean(schemeForm.data && (schemeForm.data.nodes || Object.keys(schemeForm.data).length > 0)))
let isSavingScheme = false
const schemeData = ref<any>(null)
const refreshScheme = async () => {
  if (pageType.value === 'scheme' && slug.value) {
    try {
      const res = await $fetch<any>(`/api/classroom/airway/${slug.value}`)
      schemeData.value = res
      if (res?.item) {
        Object.assign(schemeForm, {
          title: res.item.title || '',
          description: res.item.description || '',
          data: res.item.data || {}
        })
        // Если data - это объект с вкладками, берем первую вкладку или создаем пустую схему
        // Если data уже содержит nodes/edges напрямую, используем его
        if (schemeForm.data && !schemeForm.data.nodes && typeof schemeForm.data === 'object') {
          const firstKey = Object.keys(schemeForm.data)[0]
          if (firstKey) {
            const graph = schemeForm.data[firstKey] ? JSON.parse(JSON.stringify(schemeForm.data[firstKey])) : { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
            // Нормализуем edges с MarkerType
            const nodeIds = new Set((graph.nodes || []).map((n: any) => n.id))
            const normalizedEdges = (graph.edges || [])
              .filter((e: any) => e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target))
              .map((e: any) => {
                let markerEnd = e.markerEnd || MarkerType.ArrowClosed
                if (typeof markerEnd === 'string') {
                  if (markerEnd === 'arrowclosed' || markerEnd === 'arrow-closed') {
                    markerEnd = MarkerType.ArrowClosed
                  } else if (markerEnd === 'arrow') {
                    markerEnd = MarkerType.Arrow
                  }
                }
                return {
                  id: e.id,
                  source: e.source,
                  target: e.target,
                  sourceHandle: e.sourceHandle,
                  targetHandle: e.targetHandle,
                  type: e.type || 'step',
                  markerEnd: markerEnd,
                  label: e.label !== undefined ? e.label : '',
                  data: e.data || {},
                  style: e.style || {},
                  pathOptions: e.pathOptions || { borderRadius: 8 }
                }
              })
            workingGraph.value = { nodes: graph.nodes || [], edges: normalizedEdges, viewport: graph.viewport || { x: 0, y: 0, zoom: 1 } }
            schemeForm.data = workingGraph.value
          } else {
            workingGraph.value = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
            schemeForm.data = workingGraph.value
          }
        } else if (schemeForm.data && schemeForm.data.nodes) {
          const nodeIds = new Set((schemeForm.data.nodes || []).map((n: any) => n.id))
          const normalizedEdges = (schemeForm.data.edges || [])
            .filter((e: any) => e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target))
            .map((e: any) => {
              let markerEnd = e.markerEnd || MarkerType.ArrowClosed
              if (typeof markerEnd === 'string') {
                if (markerEnd === 'arrowclosed' || markerEnd === 'arrow-closed') {
                  markerEnd = MarkerType.ArrowClosed
                } else if (markerEnd === 'arrow') {
                  markerEnd = MarkerType.Arrow
                }
              }
              return {
                id: e.id,
                source: e.source,
                target: e.target,
                sourceHandle: e.sourceHandle,
                targetHandle: e.targetHandle,
                type: e.type || 'step',
                markerEnd: markerEnd,
                label: e.label !== undefined ? e.label : '',
                data: e.data || {},
                style: e.style || {},
                pathOptions: e.pathOptions || { borderRadius: 8 }
              }
            })
          workingGraph.value = { nodes: schemeForm.data.nodes || [], edges: normalizedEdges, viewport: schemeForm.data.viewport || { x: 0, y: 0, zoom: 1 } }
        } else {
          workingGraph.value = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
          schemeForm.data = workingGraph.value
        }
      }
    } catch (e) {
      console.error('Failed to fetch scheme data:', e)
    }
  }
}
watch(() => [pageType.value, slug.value], () => { if (pageType.value === 'scheme') refreshScheme() }, { immediate: true })

// Scheme Editor Panel State
const selectedNodeId = ref<string | null>(null)
const selectedEdgeId = ref<string | null>(null)
const panelOpen = ref(false)
const isNewNode = ref(false)
const addMode = ref<'none' | 'edge'>('none')
const pendingSourceId = ref<string | null>(null)
const nodeTitle = ref('')
const nodeBody = ref('')
const nodeTone = ref<'neutral' | 'blue' | 'pink' | 'green'>('neutral')
const edgeLabel = ref('')
const edgeDashed = ref(false)
const contextMode = ref<'canvas' | 'node' | 'edge'>('canvas')

// Unified form for template (deprecated, use specific forms directly)

// Action menu for dropdown
const actionMenu = computed(() => [[
  { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => { editOpen.value = true } },
  { label: 'Удалить', icon: 'i-lucide-trash', color: 'error', onSelect: () => { onDelete() } }
]])

// Prevent scroll lock when dropdown opens (как на airway/index.vue)
onMounted(() => { /* noop */ })

// Edit slideover
const editOpen = ref(false)
const editForm = reactive<{ title: string; description: string; icon: string }>({ title: '', description: '', icon: '' })
watch(editOpen, (open) => {
  if (open && found.value) {
    editForm.title = found.value.title || ''
    editForm.description = found.value.description || ''
    editForm.icon = found.value.icon || ''
  }
})

// List Editor Functions
const addItem = () => {
  if (pageType.value === 'list') listForm.items.push({ title: '', fields: [] })
}
const removeItem = (i: number) => {
  if (pageType.value === 'list') listForm.items.splice(i, 1)
}
const addField = (itemIndex: number, type: 'input' | 'textarea') => {
  if (pageType.value === 'list') {
    const arr = listForm.items[itemIndex].fields || (listForm.items[itemIndex].fields = [])
    arr.push({ type, label: '', value: '' })
  }
}
const removeField = (itemIndex: number, fieldIndex: number) => {
  if (pageType.value === 'list') {
    const arr = listForm.items[itemIndex].fields || []
    arr.splice(fieldIndex, 1)
  }
}
const toggleType = (itemIndex: number, fieldIndex: number) => {
  if (pageType.value === 'list') {
    const f = listForm.items[itemIndex].fields?.[fieldIndex]
    if (!f) return
    f.type = f.type === 'input' ? 'textarea' : 'input'
  }
}

// Table Editor Functions
const selection = reactive<{ r: number | null; c: number | null }>({ r: null, c: null })
const hoveredRow = ref<number | null>(null)
const hoveredCol = ref<number | null>(null)
const hasSelection = computed(() => selection.r != null && selection.c != null)
function selectCell(r: number, c: number) { selection.r = r; selection.c = c }

// Контекстное меню для ячеек таблицы
function getCellMenuItems(r: number, c: number): ContextMenuItem[][] {
  if (pageType.value !== 'table') return []
  const cell = tableForm.grid[r]?.[c]
  if (!cell) return []
  
  const textAlign = cell?.textAlign || 'left'
  const verticalAlign = cell?.verticalAlign || 'top'
  
  return [[
    {
      label: 'Выравнивание по горизонтали',
      icon: 'i-lucide-align-left',
      children: [
        { 
          label: 'По левому краю', 
          icon: 'i-lucide-align-left',
          onSelect: () => setCellTextAlign(r, c, 'left')
        },
        { 
          label: 'По центру', 
          icon: 'i-lucide-align-center',
          onSelect: () => setCellTextAlign(r, c, 'center')
        },
        { 
          label: 'По правому краю', 
          icon: 'i-lucide-align-right',
          onSelect: () => setCellTextAlign(r, c, 'right')
        }
      ]
    },
    {
      label: 'Выравнивание по вертикали',
      icon: 'i-lucide-align-vertical-justify-start',
      children: [
        { 
          label: 'По верху', 
          icon: 'i-lucide-align-vertical-justify-start',
          onSelect: () => setCellVerticalAlign(r, c, 'top')
        },
        { 
          label: 'По центру', 
          icon: 'i-lucide-align-vertical-justify-center',
          onSelect: () => setCellVerticalAlign(r, c, 'middle')
        },
        { 
          label: 'По низу', 
          icon: 'i-lucide-align-vertical-justify-end',
          onSelect: () => setCellVerticalAlign(r, c, 'bottom')
        }
      ]
    },
    {
      label: 'Стили',
      icon: 'i-lucide-palette',
      children: [
        {
          label: 'Стиль строки',
          icon: 'i-lucide-layout',
          onSelect: () => editRowStyle(r)
        },
        {
          label: 'Стиль столбца',
          icon: 'i-lucide-columns',
          onSelect: () => editColumnStyle(c)
        }
      ]
    },
    {
      label: 'Добавить',
      icon: 'i-lucide-plus',
      children: [
        {
          label: 'Добавить строку',
          icon: 'i-lucide-plus',
          onSelect: () => insertRow(r + 1)
        },
        {
          label: 'Добавить столбец',
          icon: 'i-lucide-plus',
          onSelect: () => insertColumn(c + 1)
        }
      ]
    },
    {
      label: 'Объединить',
      icon: 'i-lucide-merge',
      children: [
        {
          label: 'Объединить вправо',
          icon: 'i-lucide-arrow-right',
          disabled: !tableForm.grid[r]?.[c + 1] || tableForm.grid[r][c + 1].hidden,
          onSelect: () => { 
            selectCell(r, c)
            const cell = tableForm.grid[r][c]
            const next = tableForm.grid[r][c + 1]
            if (next && !next.hidden) {
              cell.colspan = (cell.colspan || 1) + 1
              next.hidden = true
            }
          }
        },
        {
          label: 'Объединить вниз',
          icon: 'i-lucide-arrow-down',
          disabled: !tableForm.grid[r + 1]?.[c] || tableForm.grid[r + 1][c].hidden,
          onSelect: () => { 
            selectCell(r, c)
            const cell = tableForm.grid[r][c]
            const below = tableForm.grid[r + 1]?.[c]
            if (below && !below.hidden) {
              cell.rowspan = (cell.rowspan || 1) + 1
              below.hidden = true
            }
          }
        }
      ]
    },
    {
      label: 'Разъединить',
      icon: 'i-lucide-split',
      children: [
        {
          label: 'Разъединить вправо',
          icon: 'i-lucide-split',
          disabled: !(tableForm.grid[r]?.[c]?.colspan && tableForm.grid[r][c].colspan > 1),
          onSelect: () => { 
            selectCell(r, c)
            const cell = tableForm.grid[r][c]
            const span = cell.colspan || 1
            if (span > 1) {
              const idxToUnhide = c + span - 1
              const row = tableForm.grid[r]
              if (row[idxToUnhide]) {
                row[idxToUnhide].hidden = false
                row[idxToUnhide].colspan = 1
                row[idxToUnhide].rowspan = 1
                cell.colspan = span - 1
              }
            }
          }
        },
        {
          label: 'Разъединить вниз',
          icon: 'i-lucide-split',
          disabled: !(tableForm.grid[r]?.[c]?.rowspan && tableForm.grid[r][c].rowspan > 1),
          onSelect: () => { 
            selectCell(r, c)
            const cell = tableForm.grid[r][c]
            const span = cell.rowspan || 1
            if (span > 1) {
              const rowIdxToUnhide = r + span - 1
              const target = tableForm.grid[rowIdxToUnhide]?.[c]
              if (target) {
                target.hidden = false
                target.colspan = 1
                target.rowspan = 1
                cell.rowspan = span - 1
              }
            }
          }
        }
      ]
    }
  ]]
}

function setCellTextAlign(r: number, c: number, align: 'left' | 'center' | 'right') {
  if (pageType.value !== 'table') return
  if (!tableForm.grid[r] || !tableForm.grid[r][c]) return
  if (!tableForm.grid[r][c]) {
    tableForm.grid[r][c] = { value: '', colspan: 1, rowspan: 1, hidden: false }
  }
  tableForm.grid[r][c].textAlign = align
}

function setCellVerticalAlign(r: number, c: number, align: 'top' | 'middle' | 'bottom') {
  if (pageType.value !== 'table') return
  if (!tableForm.grid[r] || !tableForm.grid[r][c]) return
  if (!tableForm.grid[r][c]) {
    tableForm.grid[r][c] = { value: '', colspan: 1, rowspan: 1, hidden: false }
  }
  tableForm.grid[r][c].verticalAlign = align
}

// Редактирование стилей строк и столбцов
const styleEditOpen = ref(false)
const styleEditType = ref<'row' | 'column' | null>(null)
const styleEditIndex = ref<number | null>(null)
const styleEditForm = reactive<{ rowClass: string; columnClass: string; width: string }>({
  rowClass: '',
  columnClass: '',
  width: ''
})

function editRowStyle(r: number) {
  if (pageType.value !== 'table') return
  styleEditType.value = 'row'
  styleEditIndex.value = r
  styleEditForm.rowClass = tableForm.rowStyles?.[r]?.rowClass || ''
  styleEditForm.columnClass = ''
  styleEditForm.width = ''
  styleEditOpen.value = true
}

function editColumnStyle(c: number) {
  if (pageType.value !== 'table') return
  styleEditType.value = 'column'
  styleEditIndex.value = c
  styleEditForm.columnClass = tableForm.columnStyles?.[c]?.columnClass || ''
  styleEditForm.width = tableForm.columnStyles?.[c]?.width || ''
  styleEditForm.rowClass = ''
  styleEditOpen.value = true
}

function saveStyle() {
  if (styleEditType.value === 'row' && styleEditIndex.value !== null) {
    if (!tableForm.rowStyles) tableForm.rowStyles = []
    while (tableForm.rowStyles.length <= styleEditIndex.value) {
      tableForm.rowStyles.push({})
    }
    tableForm.rowStyles[styleEditIndex.value] = { rowClass: styleEditForm.rowClass }
  } else if (styleEditType.value === 'column' && styleEditIndex.value !== null) {
    if (!tableForm.columnStyles) tableForm.columnStyles = []
    while (tableForm.columnStyles.length <= styleEditIndex.value) {
      tableForm.columnStyles.push({})
    }
    tableForm.columnStyles[styleEditIndex.value] = { 
      columnClass: styleEditForm.columnClass,
      width: styleEditForm.width || undefined
    }
  }
  styleEditOpen.value = false
}

const tableRef = ref<HTMLTableElement | null>(null)

// Отображаемая сетка (с минимум 1x1 если пустая)
const displayGrid = computed(() => {
  if (pageType.value !== 'table') return []
  if (tableForm.grid.length === 0 || tableForm.grid[0]?.length === 0) {
    return [[{ value: '', colspan: 1, rowspan: 1, hidden: false }]]
  }
  return tableForm.grid
})

// Вспомогательные функции для работы с таблицей
function getRowLength(row: GridCell[]) {
  return row.filter(c => !c.hidden).length
}

function getMaxColspan() {
  if (pageType.value !== 'table' || !tableForm.grid || tableForm.grid.length === 0) return 1
  // Вычисляем максимальное количество видимых столбцов с учетом colspan
  let maxCols = 0
  tableForm.grid.forEach(row => {
    let rowCols = 0
    row.forEach(cell => {
      if (!cell.hidden) {
        rowCols += (cell.colspan || 1)
      }
    })
    maxCols = Math.max(maxCols, rowCols)
  })
  return maxCols || 1
}

function getCellValue(r: number, c: number) {
  if (pageType.value !== 'table') return ''
  // Если это отображаемая пустая таблица, создаем реальную при первом редактировании
  if (tableForm.grid.length === 0 || tableForm.grid[0]?.length === 0) {
    if (r === 0 && c === 0) {
      tableForm.grid = [[{ value: '', colspan: 1, rowspan: 1, hidden: false }]]
    }
  }
  if (!tableForm.grid[r] || !tableForm.grid[r][c]) return ''
  return tableForm.grid[r][c].value
}

function setCellValue(r: number, c: number, value: string) {
  if (pageType.value !== 'table') return
  // Если это отображаемая пустая таблица, создаем реальную при первом редактировании
  if (tableForm.grid.length === 0 || tableForm.grid[0]?.length === 0) {
    tableForm.grid = [[{ value: '', colspan: 1, rowspan: 1, hidden: false }]]
  }
  if (!tableForm.grid[r]) return
  if (!tableForm.grid[r][c]) {
    tableForm.grid[r][c] = { value: '', colspan: 1, rowspan: 1, hidden: false }
  }
  tableForm.grid[r][c].value = value
}

function isLastColumnInRow(row: GridCell[], c: number, cell: GridCell) {
  if (cell.hidden) return false
  const colspan = cell.colspan || 1
  // Находим последний видимый индекс в строке
  let lastVisibleIndex = -1
  for (let i = row.length - 1; i >= 0; i--) {
    if (!row[i].hidden) {
      lastVisibleIndex = i
      break
    }
  }
  // Проверяем, что текущая ячейка является последней видимой в строке
  const cellEndIndex = c + colspan - 1
  return lastVisibleIndex >= 0 && cellEndIndex === lastVisibleIndex
}

function getNextColumnIndex(row: GridCell[], c: number, cell: GridCell) {
  const colspan = cell.colspan || 1
  return c + colspan
}

function isLastRowInGrid(r: number, cell: GridCell) {
  if (pageType.value !== 'table' || cell.hidden) return false
  const rowspan = cell.rowspan || 1
  const cellEndRow = r + rowspan - 1
  // Проверяем, что ячейка находится в последней строке сетки
  return cellEndRow === tableForm.grid.length - 1
}

function getNextRowIndex(r: number, cell: GridCell) {
  const rowspan = cell.rowspan || 1
  return r + rowspan
}

function isFirstVisibleColumnInRow(row: GridCell[], c: number, cell: GridCell) {
  if (cell.hidden) return false
  // Проверяем, является ли эта ячейка началом видимого столбца
  // Находим первый видимый индекс в строке
  for (let i = 0; i < row.length; i++) {
    if (!row[i].hidden) {
      return i === c
    }
  }
  return false
}

function getColumnIndex(row: GridCell[], c: number, cell: GridCell) {
  // Возвращаем реальный индекс столбца в grid
  return c
}

const removeRow = (rowIndex: number) => {
  if (pageType.value !== 'table') return
  if (tableForm.grid.length <= 1) {
    // Если осталась одна строка, очищаем таблицу
    tableForm.grid = []
    return
  }
  
  // Удаляем строку
  tableForm.grid.splice(rowIndex, 1)
  
  // Обрабатываем ячейки с rowspan, которые пересекают удаленную строку
  for (let r = 0; r < tableForm.grid.length; r++) {
    const row = tableForm.grid[r]
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      if (!cell.hidden && cell.rowspan) {
        const cellStartRow = r
        const cellEndRow = r + (cell.rowspan || 1) - 1
        
        // Если ячейка начинается до удаленной строки и заканчивается после нее
        if (cellStartRow < rowIndex && cellEndRow >= rowIndex) {
          // Уменьшаем rowspan
          cell.rowspan = Math.max(1, (cell.rowspan || 1) - 1)
        }
        // Если ячейка начинается после удаленной строки, сдвигаем ее вверх
        else if (cellStartRow > rowIndex) {
          // Ячейка уже сдвинулась автоматически при удалении строки
        }
      }
    }
  }
}

const removeColumn = (colIndex: number) => {
  if (pageType.value !== 'table') return
  if (tableForm.grid.length === 0) return
  
  // Проверяем, есть ли хотя бы один столбец после удаления
  const maxCols = Math.max(...tableForm.grid.map(row => row.length))
  if (maxCols <= 1) {
    // Если остался один столбец, очищаем таблицу
    tableForm.grid = []
    return
  }
  
  // Удаляем столбец из каждой строки
  for (let r = 0; r < tableForm.grid.length; r++) {
    const row = tableForm.grid[r]
    if (row[colIndex]) {
      // Если ячейка объединена (colspan > 1), уменьшаем colspan
      const cell = row[colIndex]
      if (!cell.hidden && cell.colspan && cell.colspan > 1) {
        cell.colspan = cell.colspan - 1
      } else {
        // Удаляем ячейку
        row.splice(colIndex, 1)
      }
    }
  }
  
  // Обрабатываем ячейки с colspan, которые пересекают удаленный столбец
  for (let r = 0; r < tableForm.grid.length; r++) {
    const row = tableForm.grid[r]
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      if (!cell.hidden && cell.colspan) {
        const cellStartCol = c
        const cellEndCol = c + (cell.colspan || 1) - 1
        
        // Если ячейка начинается до удаленного столбца и заканчивается после него
        if (cellStartCol < colIndex && cellEndCol >= colIndex) {
          // Уменьшаем colspan
          cell.colspan = Math.max(1, (cell.colspan || 1) - 1)
        }
        // Если ячейка начинается после удаленного столбца, сдвигаем ее влево
        else if (cellStartCol > colIndex) {
          // Ячейка уже сдвинулась автоматически при удалении столбца
        }
      }
    }
  }
}

const addRow = () => {
  if (pageType.value === 'table') {
    const cols = Math.max(1, (tableForm.grid[0]?.length || 0))
    const row: GridCell[] = Array.from({ length: cols }, () => ({ value: '', colspan: 1, rowspan: 1, hidden: false }))
    tableForm.grid.push(row)
  }
}

const insertRow = (index: number) => {
  if (pageType.value !== 'table') return
  const cols = Math.max(1, (tableForm.grid[0]?.length || 0))
  const row: GridCell[] = Array.from({ length: cols }, () => ({ value: '', colspan: 1, rowspan: 1, hidden: false }))
  tableForm.grid.splice(index, 0, row)
}

const addColumn = () => {
  if (pageType.value === 'table') {
    if (tableForm.grid.length === 0) tableForm.grid.push([{ value: '', colspan: 1, rowspan: 1, hidden: false }])
    tableForm.grid.forEach((row) => row.push({ value: '', colspan: 1, rowspan: 1, hidden: false }))
  }
}

const insertColumn = (index: number) => {
  if (pageType.value !== 'table') return
  if (tableForm.grid.length === 0) {
    tableForm.grid.push([{ value: '', colspan: 1, rowspan: 1, hidden: false }])
    return
  }
  tableForm.grid.forEach((row) => {
    row.splice(index, 0, { value: '', colspan: 1, rowspan: 1, hidden: false })
  })
}

const addColumnAtEnd = () => {
  if (pageType.value !== 'table') return
  if (tableForm.grid.length === 0) {
    tableForm.grid.push([{ value: '', colspan: 1, rowspan: 1, hidden: false }])
    return
  }
  // Добавляем столбец в конец всех строк
  tableForm.grid.forEach((row) => {
    row.push({ value: '', colspan: 1, rowspan: 1, hidden: false })
  })
}
const addNote = () => {
  if (pageType.value === 'table') tableForm.notes.push('')
}
const removeNote = (i: number) => {
  if (pageType.value === 'table') tableForm.notes.splice(i, 1)
}
function mergeRight() {
  if (!hasSelection.value || pageType.value !== 'table') return
  const r = selection.r as number; const c = selection.c as number
  const row = tableForm.grid[r]
  const cell = row[c]
  const next = row[c + 1]
  if (!next || next.hidden) return
  cell.colspan = (cell.colspan || 1) + 1
  next.hidden = true
}
function mergeDown() {
  if (!hasSelection.value || pageType.value !== 'table') return
  const r = selection.r as number; const c = selection.c as number
  const cell = tableForm.grid[r][c]
  const below = tableForm.grid[r + 1]?.[c]
  if (!below || below.hidden) return
  cell.rowspan = (cell.rowspan || 1) + 1
  below.hidden = true
}
function unmergeRight() {
  if (!hasSelection.value || pageType.value !== 'table') return
  const r = selection.r as number; const c = selection.c as number
  const cell = tableForm.grid[r][c]
  const span = cell.colspan || 1
  if (span <= 1) return
  const idxToUnhide = c + span - 1
  const row = tableForm.grid[r]
  if (row[idxToUnhide]) {
    row[idxToUnhide].hidden = false
    row[idxToUnhide].colspan = 1
    row[idxToUnhide].rowspan = 1
    cell.colspan = span - 1
  }
}
function unmergeDown() {
  if (!hasSelection.value || pageType.value !== 'table') return
  const r = selection.r as number; const c = selection.c as number
  const cell = tableForm.grid[r][c]
  const span = cell.rowspan || 1
  if (span <= 1) return
  const rowIdxToUnhide = r + span - 1
  const target = tableForm.grid[rowIdxToUnhide]?.[c]
  if (target) {
    target.hidden = false
    target.colspan = 1
    target.rowspan = 1
    cell.rowspan = span - 1
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
onMounted(() => { if (pageType.value === 'table') nextTick(() => resizeAll()) })
watch(() => tableForm.grid, () => { if (pageType.value === 'table') nextTick(() => resizeAll()) }, { deep: true })

// Scheme Editor Functions
// @ts-ignore
const FlowEditor = defineAsyncComponent(() => import('~/components/airway/FlowEditor.vue'))

function syncPanel() {
  if (!selectedNodeId.value) {
    nodeTitle.value = ''
    nodeBody.value = ''
    nodeTone.value = 'neutral'
    return
  }
  const n = (workingGraph.value.nodes || []).find((x: any) => x.id === selectedNodeId.value)
  if (!n) {
    nodeTitle.value = ''
    nodeBody.value = ''
    nodeTone.value = 'neutral'
    return
  }
  nodeTitle.value = n.data?.title || ''
  nodeBody.value = n.data?.bodyMd || ''
  nodeTone.value = n.data?.tone || 'neutral'
}

function syncEdgePanel() {
  if (!selectedEdgeId.value) {
    edgeLabel.value = ''
    edgeDashed.value = false
    return
  }
  const e = (workingGraph.value.edges || []).find((x: any) => x.id === selectedEdgeId.value)
  if (!e) {
    edgeLabel.value = ''
    edgeDashed.value = false
    return
  }
  edgeLabel.value = e?.label || e?.data?.label || ''
  edgeDashed.value = Boolean(e?.data?.dashed || e?.style?.strokeDasharray)
}

watch(panelOpen, async (isOpen) => {
  if (isOpen && selectedNodeId.value) {
    await nextTick()
    syncPanel()
  } else if (isOpen && selectedEdgeId.value) {
    await nextTick()
    syncEdgePanel()
  }
})

watch(selectedEdgeId, (newId) => {
  if (newId) {
    syncEdgePanel()
  } else {
    edgeLabel.value = ''
    edgeDashed.value = false
  }
})

watch(nodeTone, (val) => {
  if (!selectedNodeId.value) return
  const idx = (workingGraph.value.nodes || []).findIndex((x: any) => x.id === selectedNodeId.value)
  if (idx === -1) return
  const current = workingGraph.value.nodes[idx]
  const updated = { 
    ...current, 
    data: { 
      ...(current.data || {}),
      tone: val
    } 
  }
  workingGraph.value.nodes.splice(idx, 1, updated)
  try { (flowRef as any)?.value?.setNodeTone?.(selectedNodeId.value, val) } catch {}
})

function onSelectNodeLeft(id: string) {
  if (addMode.value === 'edge') {
    if (!pendingSourceId.value) {
      pendingSourceId.value = id
      contextMode.value = 'canvas'
      return
    }
    if (pendingSourceId.value && pendingSourceId.value !== id) {
      const eid = 'e_' + Math.random().toString(36).slice(2, 8)
      const newEdge: any = { 
        id: eid, 
        source: pendingSourceId.value, 
        target: id,
        sourceHandle: undefined,
        targetHandle: undefined,
        type: 'step',
        markerEnd: MarkerType.ArrowClosed,
        label: '',
        data: { dashed: false },
        pathOptions: { borderRadius: 8 }
      }
      workingGraph.value = {
        ...workingGraph.value,
        edges: [...(workingGraph.value.edges || []), newEdge]
      }
    }
    addMode.value = 'none'
    pendingSourceId.value = null
    return
  }
}

function onSelectNodeCtx(id: string) {
  selectedNodeId.value = id
  selectedEdgeId.value = null
  contextMode.value = id ? 'node' : 'canvas'
}

function onSelectEdgeLeft(id: string) {
  selectedEdgeId.value = id
  selectedNodeId.value = null
  panelOpen.value = true
}

function onSelectEdgeCtx(id: string) {
  selectedEdgeId.value = id
  selectedNodeId.value = null
  contextMode.value = id ? 'edge' : 'canvas'
}

function removeNode() {
  if (!selectedNodeId.value) return
  workingGraph.value = {
    ...workingGraph.value,
    nodes: (workingGraph.value.nodes || []).filter((x: any) => x.id !== selectedNodeId.value),
    edges: (workingGraph.value.edges || []).filter((e: any) => e.source !== selectedNodeId.value && e.target !== selectedNodeId.value)
  }
  selectedNodeId.value = null
  syncPanel()
}

function removeEdge() {
  if (!selectedEdgeId.value) return
  const newEdges = (workingGraph.value.edges || []).filter((e: any) => e.id !== selectedEdgeId.value)
  workingGraph.value = {
    ...workingGraph.value,
    edges: newEdges
  }
  selectedEdgeId.value = null
}

function applyToNode() {
  const idx = (workingGraph.value.nodes || []).findIndex((x: any) => x.id === selectedNodeId.value)
  if (idx === -1) return
  const currentNode = workingGraph.value.nodes[idx]
  const existingData = currentNode.data || {}
  const title = nodeTitle.value.trim()
  const bodyMd = nodeBody.value
  const tone = nodeTone.value || existingData.tone || 'neutral'
  const nodeData = { 
    ...existingData,
    title: title,
    bodyMd: bodyMd,
    tone: tone
  }
  const n = { ...currentNode, data: nodeData }
  workingGraph.value.nodes.splice(idx, 1, n)
}

function applyToEdge() {
  const idx = (workingGraph.value.edges || []).findIndex((x: any) => x.id === selectedEdgeId.value)
  if (idx === -1) return
  const oldEdge = workingGraph.value.edges[idx]
  const e: any = { 
    ...oldEdge,
    label: edgeLabel.value || '',
    data: { 
      ...(oldEdge.data || {}), 
      dashed: edgeDashed.value 
    },
    style: { 
      ...(oldEdge.style || {}),
      ...(edgeDashed.value ? { strokeDasharray: '6 6' } : {})
    }
  }
  if (!edgeDashed.value && e.style.strokeDasharray) {
    delete e.style.strokeDasharray
  }
  workingGraph.value = {
    ...workingGraph.value,
    edges: workingGraph.value.edges.map((edge: any) => 
      edge.id === selectedEdgeId.value ? e : edge
    )
  }
}

function applyAndClose() {
  if (selectedNodeId.value) applyToNode()
  if (selectedEdgeId.value) applyToEdge()
  panelOpen.value = false
}

function onAddAtCenter() {
  const vp = workingGraph.value?.viewport || { x: 0, y: 0, zoom: 1 }
  const wrap = canvasWrap.value
  const rect = wrap ? wrap.getBoundingClientRect() : { width: 800, height: 500 }
  const graphX = (rect.width / 2 - vp.x) / (vp.zoom || 1)
  const graphY = (rect.height / 2 - vp.y) / (vp.zoom || 1)
  const id = 'n_' + Math.random().toString(36).slice(2, 8)
  const node = { id, type: 'block', position: { x: graphX - 140, y: graphY - 60 }, data: { title: 'Новый блок', bodyMd: '', tone: 'neutral' } }
  workingGraph.value.nodes = [...(workingGraph.value.nodes || []), node]
  selectedNodeId.value = id
  panelOpen.value = true
  isNewNode.value = true
  syncPanel()
}

let ignoreNextSynthetic = false
function prepareMenu(e: MouseEvent) {
  if (ignoreNextSynthetic) { ignoreNextSynthetic = false; return }
  const target = e.target as HTMLElement | null
  if (!target) { contextMode.value = 'canvas'; return }
  const nodeEl = target.closest('.vue-flow__node') as HTMLElement | null
  if (nodeEl && nodeEl.dataset?.id) {
    selectedNodeId.value = nodeEl.dataset.id
    selectedEdgeId.value = null
    contextMode.value = 'node'
    return
  }
  const edgeEl = target.closest('.vue-flow__edge') as HTMLElement | null
  if (edgeEl && edgeEl.dataset?.id) {
    selectedEdgeId.value = edgeEl.dataset.id
    selectedNodeId.value = null
    contextMode.value = 'edge'
    return
  }
  contextMode.value = 'canvas'
  selectedNodeId.value = null
  selectedEdgeId.value = null
  const wrap = canvasWrap.value
  if (wrap) {
    ignoreNextSynthetic = true
    const evt = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: e.clientX, clientY: e.clientY })
    wrap.dispatchEvent(evt)
  }
}

const cmItems = computed<ContextMenuItem[][]>(() => {
  if (pageType.value !== 'scheme') return []
  if (contextMode.value === 'canvas') {
    return [[
      { label: 'Добавить узел', icon: 'i-lucide-square-plus', onSelect: () => onAddAtCenter() }
    ]]
  }
  if (contextMode.value === 'node') {
    return [[
      { label: 'Свойства', icon: 'i-lucide-edit', onSelect: () => { syncPanel(); panelOpen.value = true } },
      { label: 'Удалить узел', icon: 'i-lucide-trash', color: 'error', onSelect: () => removeNode() }
    ]]
  }
  return [[
    { label: 'Свойства', icon: 'i-lucide-edit', onSelect: () => { panelOpen.value = true } },
    { label: 'Удалить связь', icon: 'i-lucide-trash', color: 'error', onSelect: () => removeEdge() }
  ]]
})

// Submit Functions
const onSubmit = async () => {
  if (saving.value) return
  saving.value = true
  try {
    if (pageType.value === 'list') {
      const items = listForm.items.map((it) => ({ title: it.title, fields: it.fields || [] }))
      await $fetch(`/api/classroom/list/${slug.value}`, { method: 'PATCH', body: { title: listForm.title, description: listForm.description, items } })
      await refreshList()
    } else if (pageType.value === 'table') {
      // Сохраняем текущий grid и стили перед отправкой
      const gridToSave = Array.isArray(tableForm.grid) && tableForm.grid.length > 0 
        ? JSON.parse(JSON.stringify(tableForm.grid))
        : []
      const rowStylesToSave = Array.isArray(tableForm.rowStyles)
        ? JSON.parse(JSON.stringify(tableForm.rowStyles))
        : []
      const columnStylesToSave = Array.isArray(tableForm.columnStyles)
        ? JSON.parse(JSON.stringify(tableForm.columnStyles))
        : []
      const res = await $fetch<any>(`/api/cpr/${slug.value}`, { 
        method: 'PATCH', 
        body: { 
          title: tableForm.title, 
          grid: gridToSave, 
          notes: tableForm.notes,
          rowStyles: rowStylesToSave,
          columnStyles: columnStylesToSave
        } 
      })
      if (res?.success && res?.item) {
        tableData.value = res
        // Используем сохраненные данные из ответа, или текущие если ответ пустой
        const savedGrid = Array.isArray(res.item.grid) && res.item.grid.length > 0 
          ? JSON.parse(JSON.stringify(res.item.grid))
          : (gridToSave.length > 0 ? gridToSave : [])
        const savedRowStyles = Array.isArray(res.item.rowStyles)
          ? JSON.parse(JSON.stringify(res.item.rowStyles))
          : []
        const savedColumnStyles = Array.isArray(res.item.columnStyles)
          ? JSON.parse(JSON.stringify(res.item.columnStyles))
          : []
        Object.assign(tableForm, {
          title: res.item.title || '',
          grid: savedGrid,
          notes: Array.isArray(res.item.notes) ? res.item.notes.slice() : [],
          rowStyles: savedRowStyles,
          columnStyles: savedColumnStyles
        })
      } else {
        await refreshTable()
      }
    } else if (pageType.value === 'scheme') {
      isSavingScheme = true
      try {
        const nodeIds = new Set((workingGraph.value.nodes || []).map((n: any) => n.id))
        const edgesToSave = (workingGraph.value.edges || []).filter((e: any) => {
          return e && e.id && e.source && e.target && nodeIds.has(e.source) && nodeIds.has(e.target)
        })
        const clean = {
          nodes: (workingGraph.value.nodes || []).map((n: any) => ({ id: n.id, position: n.position, data: n.data, type: n.type || 'block' })),
          edges: edgesToSave.map((e: any) => {
            let markerEnd = e.markerEnd || MarkerType.ArrowClosed
            if (markerEnd === MarkerType.ArrowClosed || markerEnd === 'arrowclosed') {
              markerEnd = 'arrowclosed'
            } else if (markerEnd === MarkerType.Arrow || markerEnd === 'arrow') {
              markerEnd = 'arrow'
            } else if (typeof markerEnd !== 'string') {
              markerEnd = 'arrowclosed'
            }
            return {
              id: e.id,
              source: e.source,
              target: e.target,
              sourceHandle: e.sourceHandle,
              targetHandle: e.targetHandle,
              type: e.type || 'step',
              markerEnd: markerEnd,
              label: e.label !== undefined ? e.label : '',
              data: e.data || {},
              style: e.style || {},
              pathOptions: e.pathOptions || { borderRadius: 8 }
            }
          }),
          viewport: workingGraph.value.viewport || { x: 0, y: 0, zoom: 1 }
        }
        const payload = { data: clean }
        await $fetch(`/api/classroom/airway/${slug.value}`, { method: 'PATCH', body: payload })
        schemeForm.data = clean
        await refreshScheme()
      } finally {
        setTimeout(() => { isSavingScheme = false }, 500)
      }
    }
  } finally {
    saving.value = false
  }
}

const saveMeta = async () => {
  if (savingMeta.value) return
  savingMeta.value = true
  try {
    if (pageType.value === 'list') {
      await $fetch(`/api/classroom/list/${slug.value}`, { method: 'PATCH', body: { title: editForm.title, description: editForm.description, icon: editForm.icon } })
      listForm.title = editForm.title
      listForm.description = editForm.description
      await refreshList()
      await refreshPages()
    } else if (pageType.value === 'table') {
      await $fetch(`/api/cpr/${slug.value}`, { method: 'PATCH', body: { title: editForm.title, icon: editForm.icon } })
      tableForm.title = editForm.title
      await refreshTable()
      await refreshPages()
    } else if (pageType.value === 'scheme') {
      await $fetch(`/api/classroom/airway/${slug.value}`, { method: 'PATCH', body: { title: editForm.title, description: editForm.description, icon: editForm.icon } })
      schemeForm.title = editForm.title
      schemeForm.description = editForm.description
      await refreshScheme()
      await refreshPages()
    }
    editOpen.value = false
  } finally {
    savingMeta.value = false
  }
}

const onDelete = async () => {
  if (!confirm('Удалить эту страницу?')) return
  saving.value = true
  try {
    if (pageType.value === 'list') {
      await $fetch(`/api/classroom/list/${slug.value}`, { method: 'DELETE' })
    } else if (pageType.value === 'table') {
      const res: any = await $fetch(`/api/cpr/${slug.value}`, { method: 'DELETE' as any })
      if (!res?.success || !res?.deletedCount) {
        // @ts-ignore
        const toast = useToast?.(); toast?.add?.({ title: 'Не удалось удалить', color: 'error' })
        return
      }
    } else if (pageType.value === 'scheme') {
      await $fetch(`/api/classroom/airway/${slug.value}`, { method: 'DELETE' })
    }
    const pagesVersion = useState<number>('classroomPagesVersion')
    if (pagesVersion) pagesVersion.value = (pagesVersion.value || 0) + 1
    // Отправляем событие для обновления списка страниц
    if (process.client) {
      window.dispatchEvent(new CustomEvent('classroom-pages-updated'))
    }
    await navigateTo('/admin/classroom')
  } finally {
    saving.value = false
  }
}
</script>

