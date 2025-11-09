<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
          <div class="flex items-center justify-between gap-2 mb-3">
            <div>
              <div class="mb-1">
                <NuxtLink to="/admin/tests" class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                  <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                  <span>Назад к категориям</span>
                </NuxtLink>
              </div>
              <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ category?.name || 'Категория' }}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Вопросы и ответы категории</p>
            </div>
            <UButton color="primary" size="lg" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onNew" title="Новый вопрос" />
          </div>
          <div v-if="unapprovedCount > 0" class="flex items-center gap-2">
            <UButton 
              size="sm" 
              color="success" 
              variant="soft" 
              class="cursor-pointer" 
              @click="approveAll"
              :loading="pendingApproveAll"
            >
              <UIcon name="i-heroicons-check-circle" class="w-4 h-4 mr-1" />
              Одобрить все ({{ unapprovedCount }})
            </UButton>
            <UButton 
              size="sm" 
              color="red" 
              variant="soft" 
              class="cursor-pointer" 
              @click="rejectAll"
              :loading="pendingRejectAll"
            >
              <UIcon name="i-heroicons-x-circle" class="w-4 h-4 mr-1" />
              Отклонить все ({{ unapprovedCount }})
            </UButton>
          </div>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-700">
          <div v-if="pending" class="p-4"><USkeleton class="h-6 w-full" /></div>
          <div v-else-if="items.length === 0" class="p-4 text-sm text-slate-500 dark:text-slate-400">Пока нет вопросов</div>
          <div v-for="q in items" :key="q._id" class="p-4 flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <div class="font-medium text-slate-900 dark:text-white">{{ q.question }}</div>
                <UBadge 
                  v-if="q.suggestion?.createdBy" 
                  color="warning" 
                  variant="soft" 
                  size="xs"
                  class="cursor-default"
                >
                  На модерации
                </UBadge>
                <UBadge 
                  v-else-if="q.approved !== undefined" 
                  :color="q.approved ? 'success' : 'warning'" 
                  variant="soft" 
                  size="xs"
                  class="cursor-default"
                >
                  {{ q.approved ? 'Одобрен' : 'На модерации' }}
                </UBadge>
              </div>
              <div v-if="q.createdBy || !q.approved" class="mb-2">
                <span v-if="!q.suggestion?.createdBy" class="text-xs text-slate-500 dark:text-slate-400 mr-2">
                  {{ !q.approved ? 'Предложен вопрос:' : 'Добавлен:' }}
                </span>
                <span v-if="q.createdBy" class="font-medium inline-flex items-center text-[10px]/3 px-1.5 py-1 gap-1.5 rounded-sm text-default bg-elevated">
                  <span class="h-3.5 w-3.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 inline-block">
                    <img v-if="q.createdBy.avatarUrl" :src="q.createdBy.avatarUrl" alt="avatar" class="h-full w-full object-cover" />
                  </span>
                  <span>{{ userDisplayName(q.createdBy) }}</span>
                </span>
                <span v-else-if="!q.approved" class="text-xs text-slate-500 dark:text-slate-400 italic">Пользователь</span>
                <span v-else class="text-xs text-slate-500 dark:text-slate-400 italic">Администратор</span>
              </div>
              <div v-if="q.correctedBy" class="mb-2">
                <span class="text-xs text-slate-500 dark:text-slate-400 mr-2">Исправлен:</span>
                <span class="font-medium inline-flex items-center text-[10px]/3 px-1.5 py-1 gap-1.5 rounded-sm text-default bg-elevated">
                  <span class="h-3.5 w-3.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 inline-block">
                    <img v-if="q.correctedBy?.avatarUrl || q.correctedBy?.telegram?.photo_url" :src="q.correctedBy?.avatarUrl || q.correctedBy?.telegram?.photo_url" alt="avatar" class="h-full w-full object-cover" />
                  </span>
                  <span>{{ userDisplayName(q.correctedBy) }}</span>
                </span>
              </div>
              <div v-if="q.suggestion?.createdBy" class="mb-2">
                <span class="text-xs text-slate-500 dark:text-slate-400 mr-2">Предложено исправление</span>
                <span class="font-medium inline-flex items-center text-[10px]/3 px-1.5 py-1 gap-1.5 rounded-sm text-default bg-elevated">
                  <span class="h-3.5 w-3.5 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 inline-block">
                    <img v-if="q.suggestion.createdBy?.avatarUrl || q.suggestion.createdBy?.telegram?.photo_url" :src="q.suggestion.createdBy?.avatarUrl || q.suggestion.createdBy?.telegram?.photo_url" alt="avatar" class="h-full w-full object-cover" />
                  </span>
                  <span>{{ userDisplayName(q.suggestion.createdBy) }}</span>
                </span>
              </div>
              <!-- Когда есть предложение: показываем текущие ответы и блок предложения рядом -->
              <div v-if="q.suggestion?.createdBy" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="space-y-2 rounded-md border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40 p-3">
                  <div class="text-xs font-medium text-slate-800 dark:text-slate-300 mb-1">Актуальные ответы</div>
                  <div class="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                    <div v-for="(a, idx) in q.answers" :key="idx" class="flex items-center gap-2">
                      <UCheckbox :model-value="!!a.isCorrect" disabled size="lg" />
                      <span>{{ a.text }}</span>
                    </div>
                  </div>
                </div>
                <div class="space-y-2 rounded-md border border-amber-200 dark:border-amber-900 bg-amber-50/60 dark:bg-amber-900/20 p-3">
                  <div class="text-xs font-medium text-amber-800 dark:text-amber-300 mb-1">Что предлагается изменить</div>
                  <div v-if="q.suggestion.question && q.suggestion.question !== q.question" class="text-sm mb-2">
                    <div class="text-slate-500 dark:text-slate-400">Вопрос:</div>
                    <div class="mt-1 flex flex-col gap-1">
                      <div class="line-through decoration-rose-500/70 text-slate-600 dark:text-slate-300">{{ q.question }}</div>
                      <div class="text-emerald-700 dark:text-emerald-300 font-medium">{{ q.suggestion.question }}</div>
                    </div>
                  </div>
                  <div v-if="Array.isArray(q.suggestion.answers) && q.suggestion.answers.length" class="text-sm">
                    <div class="space-y-1">
                      <div v-for="(a, idx) in q.suggestion.answers" :key="idx" class="flex items-center gap-2">
                        <UCheckbox :model-value="!!a.isCorrect" disabled size="lg" />
                        <span class="text-slate-800 dark:text-slate-200">{{ a.text }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <!-- Если предложения нет: обычный блок текущих ответов + inline-кнопки для предложенного вопроса -->
              <div v-else>
                <div class="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                  <div v-for="(a, idx) in q.answers" :key="idx" class="flex items-center gap-2">
                    <UCheckbox :model-value="!!a.isCorrect" disabled size="lg" />
                    <span>{{ a.text }}</span>
                  </div>
                </div>
                <div v-if="q.approved !== true" class="mt-2 flex items-center gap-2">
                  <UButton size="xs" color="primary" variant="soft" class="cursor-pointer" @click="onApprove(q)">Одобрить</UButton>
                  <UButton size="xs" color="neutral" variant="ghost" class="cursor-pointer" @click="onDelete(q)">Отклонить</UButton>
                </div>
              </div>
              <div v-if="q.suggestion?.createdBy" class="mt-2 flex items-center gap-2">
                <UButton size="xs" color="primary" variant="soft" class="cursor-pointer" @click="approveSuggestion(q)">Одобрить исправление</UButton>
                <UButton size="xs" color="neutral" variant="ghost" class="cursor-pointer" @click="rejectSuggestion(q)">Отклонить</UButton>
              </div>
              </div>
            <div class="flex items-center gap-2">
              <!-- Кнопка-меню действий через UPopover -->
              <UPopover :content="{ side: 'bottom', align: 'end', sideOffset: 8 }">
                <button
                  type="button"
                  class="rounded-md p-2 size-9 inline-flex items-center justify-center text-default text-slate-500 dark:text-slate-400 hover:bg-elevated focus:outline-none cursor-pointer"
                  title="Действия"
                >
                  <UIcon name="i-heroicons-ellipsis-vertical" class="w-5 h-5" />
                </button>
                <template #content>
                  <div class="w-56">
                    <nav class="py-1">
                      <button
                        v-for="item in getActionItems(q)[0]"
                        :key="item.label"
                        type="button"
                        class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                        @click="item.click && item.click()"
                      >
                        <UIcon :name="item.icon" class="w-4 h-4 text-slate-500" />
                        <span>{{ item.label }}</span>
                      </button>
                    </nav>
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
        </div>
      </div>
    </div>

    <USlideover v-if="slideoverOpen" v-model:open="slideoverOpen" :title="isEdit ? 'Редактировать вопрос' : 'Новый вопрос'" side="right" description="Заполните поля или вставьте markdown" :ui="{ overlay: 'bg-slate-700/50' }">
      <template #body>
        <div class="space-y-4">
          <UForm :state="form" @submit.prevent="onSubmit">
            <div class="space-y-3 w-full">
              <UFormField label="Вопрос" required class="w-full">
                <UInput v-model="form.question" placeholder="Текст вопроса" class="w-full" size="lg" />
              </UFormField>

              <div class="space-y-2">
                <div class="text-sm font-medium text-slate-900 dark:text-white">Ответы</div>
                <div v-for="(ans, idx) in form.answers" :key="idx" class="flex items-center gap-2">
                  <UCheckbox v-model="ans.isCorrect" size="lg" />
                  <UInput v-model="ans.text" placeholder="Текст ответа" class="flex-1" size="lg" />
                  <UButton v-if="idx >= 2" size="lg" color="neutral" variant="ghost" icon="i-heroicons-trash" @click="removeAnswer(idx)" class="cursor-pointer" />
                </div>
                <div>
                  <UButton size="lg" variant="soft" color="primary" class="cursor-pointer" @click="addAnswer">Добавить ответ</UButton>
                </div>
              </div>

              <UFormField label="Markdown (двусторонняя синхронизация)">
                <UTextarea
                  v-model="form.markdown"
                  :rows="12"
                  class="w-full"
                  size="lg"
                  placeholder="Вопрос и ответы в формате:
Первая строка — вопрос
- [x] Правильный ответ
- [ ] Неправильный ответ"
                />
              </UFormField>
            </div>
          </UForm>
        </div>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <UButton size="lg" color="neutral" variant="ghost" type="button" @click="slideoverOpen = false" class="cursor-pointer">Отмена</UButton>
          <UButton size="lg" color="primary" :loading="pendingSubmit" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Тесты' })

const route = useRoute()
const categoryId = computed(() => String(route.params.id))

const category = ref<any>(null)
const pending = ref(false)
const items = ref<any[]>([])
const pendingApproveAll = ref(false)
const pendingRejectAll = ref(false)

const unapprovedCount = computed(() => {
  return items.value.filter((q: any) => q.approved !== true).length
})

async function fetchCategory() {
  const res: any = await $fetch(`/api/tests/categories/${categoryId.value}`)
  if (res?.success) category.value = res.item
}

async function fetchItems() {
  pending.value = true
  try {
    const res: any = await $fetch(`/api/tests?category=${categoryId.value}&includeAll=1`)
    items.value = Array.isArray(res?.items) ? res.items : []
  } finally {
    pending.value = false
  }
}

onMounted(async () => {
  await Promise.all([fetchCategory(), fetchItems()])
})

const slideoverOpen = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)
const pendingSubmit = ref(false)

type Answer = { text: string; isCorrect: boolean }
type FormState = { question: string; answers: Answer[]; markdown: string }
const form = reactive<FormState>({ question: '', answers: [], markdown: '' })

function resetForm() {
  form.question = ''
  form.answers = [
    { text: '', isCorrect: false },
    { text: '', isCorrect: false }
  ]
  form.markdown = ''
}

function onNew() {
  isEdit.value = false
  currentId.value = null
  resetForm()
  slideoverOpen.value = true
}

function onEdit(q: any) {
  isEdit.value = true
  currentId.value = String(q._id)
  form.question = q.question || ''
  const mapped = (q.answers || []).map((a: any) => ({ text: a.text || '', isCorrect: Boolean(a.isCorrect) }))
  while (mapped.length < 2) mapped.push({ text: '', isCorrect: false })
  form.answers = mapped
  form.markdown = serializeToMarkdown()
  slideoverOpen.value = true
}

async function onDelete(q: any) {
  const ok = window.confirm('Удалить вопрос?')
  if (!ok) return
  await $fetch(`/api/tests/${q._id}`, { method: 'DELETE' })
  items.value = items.value.filter((i: any) => i._id !== q._id)
}

async function onApprove(q: any) {
  const id = String(q._id)
  const res: any = await $fetch(`/api/tests/${id}`, { method: 'PATCH', body: { approved: true } })
  if (res?.success && res.item) {
    const idx = items.value.findIndex((i: any) => i._id === id)
    if (idx !== -1) {
      // Сохраняем автора, если сервер не вернул populate
      const prev = items.value[idx]
      const next = { ...res.item }
      if (!next.createdBy && prev?.createdBy) next.createdBy = prev.createdBy
      items.value[idx] = next
    }
  }
}

async function approveAll() {
  const unapproved = items.value.filter((q: any) => q.approved !== true)
  if (unapproved.length === 0) return
  
  const ok = window.confirm(`Одобрить все ${unapproved.length} неодобренных вопросов?`)
  if (!ok) return
  
  pendingApproveAll.value = true
  try {
    const results = await Promise.allSettled(unapproved.map((q: any) => 
      $fetch(`/api/tests/${q._id}`, { method: 'PATCH', body: { approved: true } })
    ))
    
    // Реактивно обновляем одобренные тесты
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value?.success && result.value?.item) {
        const q = unapproved[index]
        const idx = items.value.findIndex((i: any) => i._id === q._id)
        if (idx !== -1) {
          const prev = items.value[idx]
          const next = { ...result.value.item }
          // Сохраняем автора, если сервер не вернул populate
          if (!next.createdBy && prev?.createdBy) next.createdBy = prev.createdBy
          items.value[idx] = next
        }
      }
    })
    
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value?.success).length
    try { (useToast as any)?.().add?.({ title: `Одобрено вопросов: ${successCount}`, color: 'success' }) } catch {}
  } catch (err: any) {
    try { (useToast as any)?.().add?.({ title: 'Ошибка при одобрении', color: 'error' }) } catch {}
  } finally {
    pendingApproveAll.value = false
  }
}

async function rejectAll() {
  const unapproved = items.value.filter((q: any) => q.approved !== true)
  if (unapproved.length === 0) return
  
  const ok = window.confirm(`Отклонить (удалить) все ${unapproved.length} неодобренных вопросов?`)
  if (!ok) return
  
  pendingRejectAll.value = true
  try {
    const results = await Promise.allSettled(unapproved.map((q: any) => 
      $fetch(`/api/tests/${q._id}`, { method: 'DELETE' })
    ))
    
    // Реактивно удаляем отклоненные тесты
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const q = unapproved[index]
        const idx = items.value.findIndex((i: any) => i._id === q._id)
        if (idx !== -1) {
          items.value.splice(idx, 1)
        }
      }
    })
    
    const successCount = results.filter(r => r.status === 'fulfilled').length
    try { (useToast as any)?.().add?.({ title: `Отклонено вопросов: ${successCount}`, color: 'success' }) } catch {}
  } catch (err: any) {
    try { (useToast as any)?.().add?.({ title: 'Ошибка при отклонении', color: 'error' }) } catch {}
  } finally {
    pendingRejectAll.value = false
  }
}

function addAnswer() {
  form.answers.push({ text: '', isCorrect: false })
}
function removeAnswer(idx: number) {
  if (form.answers.length <= 2) {
    // Минимум два ответа: очищаем выбранный вместо удаления
    form.answers[idx] = { text: '', isCorrect: false }
    return
  }
  form.answers.splice(idx, 1)
}

function userDisplayName(user: any): string {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const name = [first, last].filter(Boolean).join(' ').trim()
  if (name) return name
  if (user?.telegram?.username) return `@${user.telegram.username}`
  return String(user?.email || 'Пользователь')
}

function getActionItems(q: any) {
  const items: any[] = []
  items.push({ label: 'Редактировать', icon: 'i-heroicons-pencil-square', click: () => onEdit(q) })
  items.push({ label: 'Удалить', icon: 'i-heroicons-trash', click: () => onDelete(q) })
  return [items]
}

async function approveSuggestion(q: any) {
  const id = String(q._id)
  const res: any = await $fetch(`/api/tests/${id}/suggestion-approve`, { method: 'POST' })
  if (res?.success && res.item) {
    const idx = items.value.findIndex((i: any) => i._id === id)
    if (idx !== -1) {
      // Если correctedBy не популятился, используем автора предложения
      const next = { ...res.item }
      if (!next.correctedBy && q?.suggestion?.createdBy) next.correctedBy = q.suggestion.createdBy
      items.value[idx] = next
    }
  }
}

async function rejectSuggestion(q: any) {
  const id = String(q._id)
  const res: any = await $fetch(`/api/tests/${id}/suggestion-reject`, { method: 'POST' })
  if (res?.success && res.item) {
    const idx = items.value.findIndex((i: any) => i._id === id)
    if (idx !== -1) items.value[idx] = res.item
  }
}

const updatingFrom = ref<'inputs' | 'markdown' | null>(null)

function serializeToMarkdown(): string {
  const lines: string[] = []
  const q = (form.question || '').trim()
  if (q) lines.push(q)
  for (const a of form.answers) {
    if (!String(a.text || '').trim()) continue
    const mark = a.isCorrect ? 'x' : ' '
    lines.push(`- [${mark}] ${a.text || ''}`.trim())
  }
  return lines.join('\n')
}

function parseFromMarkdown(md: string) {
  const lines = (md || '').split(/\r?\n/)
  let i = 0
  // first non-empty line as question
  let question = ''
  while (i < lines.length && !lines[i].trim()) i++
  if (i < lines.length) {
    question = lines[i].trim()
    i++
  }
  // skip one optional blank
  if (i < lines.length && !lines[i].trim()) i++
  const answers: Answer[] = []
  while (i < lines.length) {
    const line = lines[i]
    const m = /^- \[(x|X|\s)\]\s*(.*)$/.exec(line)
    if (!m) break
    const isCorrect = m[1].toLowerCase() === 'x'
    const text = (m[2] || '').trim()
    answers.push({ text, isCorrect })
    i++
  }
  return { question, answers }
}

watch(() => [form.question, form.answers.map(a => `${a.isCorrect}|${a.text}`).join('\u0001')].join('\u0002'), () => {
  if (updatingFrom.value === 'markdown') return
  updatingFrom.value = 'inputs'
  form.markdown = serializeToMarkdown()
  updatingFrom.value = null
})

watch(() => form.markdown, (md) => {
  if (updatingFrom.value === 'inputs') return
  updatingFrom.value = 'markdown'
  if (!md || !String(md).trim()) {
    form.question = ''
    form.answers = [
      { text: '', isCorrect: false },
      { text: '', isCorrect: false }
    ]
    updatingFrom.value = null
    return
  }
  const parsed = parseFromMarkdown(md || '')
  form.question = parsed.question
  const nextAnswers = parsed.answers.slice()
  while (nextAnswers.length < 2) nextAnswers.push({ text: '', isCorrect: false })
  form.answers = nextAnswers
  updatingFrom.value = null
})

async function onSubmit() {
  pendingSubmit.value = true
  try {
    const payload = { category: categoryId.value, question: form.question, answers: form.answers, markdown: form.markdown }
    if (isEdit.value && currentId.value) {
      const res: any = await $fetch(`/api/tests/${currentId.value}`, { method: 'PATCH', body: payload })
      if (res?.success && res.item) {
        const idx = items.value.findIndex((i: any) => i._id === currentId.value)
        if (idx !== -1) items.value[idx] = res.item
      }
    } else {
      const res: any = await $fetch('/api/tests', { method: 'POST', body: payload })
      if (res?.success && res.item) {
        items.value = [res.item, ...items.value]
      } else {
        await fetchItems()
      }
    }
    slideoverOpen.value = false
  } finally {
    pendingSubmit.value = false
  }
}
</script>


