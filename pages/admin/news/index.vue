<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div class="mb-6 flex items-center justify-between">
          <div class="text-sm text-slate-600 dark:text-slate-300">Управление новостями (таймлайн)</div>
          <UButton color="primary" class="cursor-pointer" @click="openCreate">Добавить</UButton>
        </div>

        <!-- Changelog-like list (without UI Pro) -->
        <div class="space-y-6">
          <article v-for="v in versions" :key="v._id" class="w-full">
            <div class="flex flex-col w-full bg-white dark:bg-slate-800 rounded-xl p-4">
              <div class="flex items-center justify-between gap-3 mb-2">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="text-sm/6 text-slate-500 dark:text-slate-400 truncate">{{ formatDate(v.date) }}</div>
                  <UBadge v-if="v.badge" variant="outline" size="sm">{{ v.badge }}</UBadge>
                </div>
                <div class="shrink-0 flex items-center gap-2">
                  <UButton size="sm" color="neutral" variant="soft" class="cursor-pointer !p-0 size-7 rounded-md !flex !items-center !justify-center" @click="openEdit(v)">
                    <UIcon name="i-lucide-pencil" class="w-4 h-4" />
                  </UButton>
                  <UButton size="sm" color="error" variant="soft" class="cursor-pointer !p-0 size-7 rounded-md !flex !items-center !justify-center" @click="onDelete(v)">
                    <UIcon name="i-lucide-trash-2" class="w-4 h-4" />
                  </UButton>
                </div>
              </div>
              <h3 class="relative text-xl font-semibold text-slate-900 dark:text-white">{{ v.title }}</h3>
              <div v-if="v.description" class="mt-2 md-content" v-html="renderMarkdown(v.description)"></div>
              
            </div>
          </article>
        </div>

        <USlideover v-model:open="formOpen" :title="isEdit ? 'Редактировать новость' : 'Новая новость'" :description="isEdit ? 'Форма редактирования новости' : 'Форма создания новости'" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="form" @submit.prevent="onSubmit" class="space-y-4">
              <UFormField label="Заголовок" required>
                <UInput v-model="form.title" placeholder="Заголовок" size="lg" class="w-full" />
              </UFormField>
              <UFormField label="Описание">
                <UTextarea v-model="form.description" :rows="6" placeholder="Краткий текст" size="lg" class="w-full" />
              </UFormField>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <UFormField label="Дата">
                  <UInput v-model="form.date" type="date" size="lg" class="w-full" />
                </UFormField>
                <UFormField label="Иконка (UIcon)">
                  <UInputMenu
                    :key="'icon-'+(form._id||'new')+'-'+(form.icon||'')"
                    v-model="iconDisplay"
                    :items="iconMenuItems"
                    size="lg"
                    class="w-full cursor-pointer"
                    searchable
                    clearable
                    placeholder="например, i-lucide-newspaper"
                    :value-attribute="'value'"
                    :option-attribute="'value'"
                    :ui="{ item: 'cursor-pointer' }"
                  >
                    <template #item="{ item }">
                      <div class="flex items-start gap-2 w-full">
                        <UIcon :name="item.icon" class="w-4 h-4 mt-0.5" />
                        <div class="flex-1">
                          <div class="text-sm">{{ item.label }}</div>
                          <div class="text-xs text-slate-500">{{ item.value }}</div>
                        </div>
                      </div>
                    </template>
                  </UInputMenu>
                </UFormField>
              </div>
              <UCheckbox v-model="form.published" label="Опубликовано" />
            </UForm>
          </template>
          <template #footer>
            <div class="w-full flex items-center gap-2">
              <UButton type="submit" color="primary" @click="onSubmit">Сохранить</UButton>
              <UButton variant="soft" color="neutral" @click="formOpen=false">Отмена</UButton>
              <UButton v-if="isEdit" color="error" variant="soft" class="ml-auto" @click="onDeleteById(form._id)">Удалить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Новости' })

const items = ref<any[]>([])
const loading = ref(false)
const versions = computed(() => (items.value || []).map((n: any) => ({
  _id: n._id,
  title: n.title,
  description: n.description || '',
  descriptionPlain: stripMarkdownToText(n.description || ''),
  date: (n.date || n.createdAt),
  icon: n.icon,
  published: n.published,
  badge: undefined
})))

const formOpen = ref(false)
const isEdit = ref(false)
const form = reactive<any>({ _id: undefined, title: '', description: '', date: '', icon: '', published: true })

const iconPresetItems = [
  { label: 'Новости', value: 'i-lucide-newspaper', icon: 'i-lucide-newspaper' },
  { label: 'Обновление', value: 'i-lucide-refresh-ccw', icon: 'i-lucide-refresh-ccw' },
  { label: 'Выпуск', value: 'i-lucide-rocket', icon: 'i-lucide-rocket' },
  { label: 'Исправления', value: 'i-lucide-wrench', icon: 'i-lucide-wrench' }
] as Array<{ label: string, value: string, icon: string }>
const iconMenuItems = computed<any[]>(() => {
  const base = [...iconPresetItems]
  const curr = form.icon as any
  const v = curr && typeof curr === 'object' && 'value' in curr ? String(curr.value) : String(curr || '')
  if (v && !base.some(i => i.value === v)) {
    base.unshift({ label: v, value: v, icon: v })
  }
  return base
})

// Отображаем в инпуте label для предустановленных иконок, иначе сам код
const iconDisplay = computed<string>({
  get() {
    const curr = form.icon as any
    const value = curr && typeof curr === 'object' && 'value' in curr ? String(curr.value) : String(curr || '')
    const preset = iconPresetItems.find(i => i.value === value)
    return preset ? preset.label : value
  },
  set(input: string) {
    const byLabel = iconPresetItems.find(i => i.label === input)
    const byValue = iconPresetItems.find(i => i.value === input)
    form.icon = (byLabel?.value) || (byValue?.value) || String(input || '').trim()
  }
})


function resetForm() {
  form._id = undefined
  form.title = ''
  form.description = ''
  form.date = ''
  form.icon = ''
  form.published = true
}

function formatDate(d: any) {
  try {
    const dt = d ? new Date(d) : null
    if (!dt) return ''
    return dt.toLocaleDateString()
  } catch { return '' }
}

async function loadItems() {
  loading.value = true
  try {
    const res: any = await $fetch('/api/news')
    if (res?.success) items.value = res.items
  } catch (e) {
    console.error(e)
  } finally { loading.value = false }
}

function openCreate() {
  resetForm()
  isEdit.value = false
  formOpen.value = true
}

function openEdit(n: any) {
  form._id = n._id
  form.title = n.title
  form.description = n.description || ''
  form.date = n.date ? new Date(n.date).toISOString().substring(0,10) : ''
  form.icon = typeof n.icon === 'string' ? n.icon.trim() : ''
  form.published = n.published ?? true
  isEdit.value = true
  formOpen.value = true
}

async function onSubmit() {
  try {
    // гарантируем строку с кодом иконки
    form.icon = typeof form.icon === 'object' && (form.icon as any)?.value ? (form.icon as any).value : String(form.icon || '').trim()
    if (isEdit.value && form._id) {
      await $fetch(`/api/news/${form._id}`, { method: 'PATCH', body: form })
    } else {
      await $fetch('/api/news', { method: 'POST', body: form })
    }
    formOpen.value = false
    await loadItems()
  } catch (e) {
    console.error(e)
  }
}

async function onDelete(n: any) {
  await onDeleteById(n._id)
}

async function onDeleteById(id?: string) {
  if (!id) return
  try {
    // оптимистичное удаление
    const prev = items.value.slice()
    items.value = items.value.filter((n: any) => n._id !== id)
    if (form._id === id) formOpen.value = false
    await $fetch(`/api/news/${id}`, { method: 'DELETE' })
  } catch (e) {
    console.error(e)
    // при ошибке перезагрузим список для консистентности
    await loadItems()
  }
}

onMounted(() => { loadItems() })

// Убираем насильную конверсию во избежание очистки поля при открытии

function getIcon(n: any) {
  return (n && n.icon && String(n.icon).trim() !== '') ? n.icon : 'i-lucide-newspaper'
}

// Удалены вспомогательные обработчики popover'а — UInputMenu держит строковое значение

// Markdown rendering (client-safe)
import { marked } from 'marked'
marked.setOptions({ gfm: true, breaks: true })
let sanitizeHtml: (h: string) => string = (h) => h
if (process.client) {
  const mod: any = await import('dompurify')
  const createDOMPurify = mod.default
  const purifier = createDOMPurify(window)
  sanitizeHtml = (h: string) => purifier.sanitize(h)
}
function renderMarkdown(text: string) {
  if (!text) return ''
  const raw = text.replace(/\r\n?/g, '\n')
  const html = marked.parse(raw) as string
  return sanitizeHtml(html)
}

function stripMarkdownToText(text: string) {
  if (!text) return ''
  if (process.client) {
    const html = renderMarkdown(text)
    const tmp = document.createElement('div')
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || '').trim()
  }
  return text
}
</script>


