<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div>
            <div class="mb-1">
              <NuxtLink to="/tests" class="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
                <UIcon name="i-heroicons-arrow-left" class="w-4 h-4" />
                <span>Назад к категориям</span>
              </NuxtLink>
            </div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Тесты — {{ category?.name || 'Категория' }}</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Вопросы и ответы категории</p>
          </div>
          <UButton color="primary" size="lg" class="cursor-pointer" @click="onNew">Новый вопрос</UButton>
        </div>

        <div class="divide-y divide-slate-100 dark:divide-slate-700">
          <div v-if="pending" class="p-4"><USkeleton class="h-6 w-full" /></div>
          <div v-else-if="items.length === 0" class="p-4 text-sm text-slate-500 dark:text-slate-400">Пока нет вопросов</div>
          <div v-for="q in items" :key="q._id" class="p-4 flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="font-medium text-slate-900 dark:text-white mb-2">{{ q.question }}</div>
              <div class="text-sm text-slate-700 dark:text-slate-300 space-y-1">
                <div v-for="(a, idx) in q.answers" :key="idx" class="flex items-center gap-2">
                  <UCheckbox :model-value="!!a.isCorrect" disabled size="lg" />
                  <span>{{ a.text }}</span>
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton size="xs" variant="soft" color="neutral" class="cursor-pointer" @click="onEdit(q)">Редактировать</UButton>
              <UButton size="xs" variant="soft" color="red" class="cursor-pointer" @click="onDelete(q)">Удалить</UButton>
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

async function fetchCategory() {
  const res: any = await $fetch(`/api/tests/categories/${categoryId.value}`)
  if (res?.success) category.value = res.item
}

async function fetchItems() {
  pending.value = true
  try {
    const res: any = await $fetch(`/api/tests?category=${categoryId.value}`)
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


