<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <div class="bg-white dark:bg-slate-800 rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <NuxtLink to="/tests" class="inline-flex items-center px-2 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors duration-200" title="Назад">
            <UIcon name="i-heroicons-arrow-left-20-solid" class="w-4 h-4" />
          </NuxtLink>
          <p class="text-sm text-slate-600 dark:text-slate-300 flex-1">{{ category?.name || 'Категория' }}</p>
          <button v-if="isLoggedIn" type="button" @click="openModal()" class="inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 size-9 cursor-pointer" title="Предложить вопрос">
            <UIcon name="i-heroicons-plus" class="w-5 h-5" />
          </button>
        </div>
      </div>

      <div v-if="pending" class="p-4 space-y-3">
        <USkeleton class="h-8 w-1/2" />
        <USkeleton v-for="i in 4" :key="i" class="h-20 w-full" />
      </div>

      <div v-else>
        <div v-if="filteredItems.length === 0" class="p-4 text-sm text-slate-500 dark:text-slate-400">
          {{ searchQueryLocal.trim().length > 0 ? 'Ничего не найдено' : 'Вопросов пока нет' }}
        </div>
        <ul v-else class="divide-y divide-slate-100 dark:divide-slate-700">
          <li v-for="q in filteredItems" :key="q._id" class="px-4 py-4">
            <div class="flex items-start justify-between gap-3">
              <div class="font-medium text-slate-900 dark:text-white" v-html="highlight(q.question, searchQueryLocal)"></div>
              <button
                type="button"
                class="rounded-md p-2 size-9 inline-flex items-center justify-center text-default text-slate-400 dark:text-slate-400 hover:bg-elevated focus:outline-none cursor-pointer"
                title="Предложить исправление"
                @click="proposeFix(q)"
              >
                <UIcon name="i-heroicons-pencil-square" class="w-5 h-5" />
              </button>
            </div>
            
            <ul class="space-y-2">
              <li v-for="(a, idx) in q.answers" :key="idx" class="flex items-start gap-2">
                <UCheckbox :model-value="a.isCorrect" disabled color="primary" class="mt-0.5" />
                <div class="text-sm" :class="a.isCorrect ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'" v-html="highlight(a.text, searchQueryLocal)"></div>
              </li>
            </ul>
            <div v-if="q.createdBy || q.correctedBy" class="mt-3 rounded-md bg-slate-50/60 dark:bg-slate-700/40 p-1 w-fit">
              <div class="flex flex-wrap items-center gap-3">
                <div v-if="q.createdBy" class="flex items-center gap-2">
                  <span class="text-xs text-slate-600 dark:text-slate-300">Добавлен:</span>
                  <span class="font-medium inline-flex items-center text-[10px]/3 px-1.5 py-1 gap-1.5 rounded-sm bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                    <span class="h-3.5 w-3.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 inline-block">
                      <img v-if="q.createdBy.avatarUrl" :src="q.createdBy.avatarUrl" alt="avatar" class="h-full w-full object-cover" />
                    </span>
                    <span>{{ userDisplayName(q.createdBy) }}</span>
                  </span>
                </div>
                <div v-if="q.correctedBy" class="flex items-center gap-2">
                  <span class="text-xs text-slate-600 dark:text-slate-300">Исправлен:</span>
                  <span class="font-medium inline-flex items-center text-[10px]/3 px-1.5 py-1 gap-1.5 rounded-sm bg-slate-200 text-slate-700 dark:bg-slate-600 dark:text-slate-200">
                    <span class="h-3.5 w-3.5 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-700 inline-block">
                      <img v-if="q.correctedBy?.avatarUrl || q.correctedBy?.telegram?.photo_url" :src="q.correctedBy?.avatarUrl || q.correctedBy?.telegram?.photo_url" alt="avatar" class="h-full w-full object-cover" />
                    </span>
                    <span>{{ userDisplayName(q.correctedBy) }}</span>
                  </span>
                </div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>

  <template v-if="!isMobile">
    <UModal
      v-model:open="modalOpen"
      :title="'Предложить вопрос'"
      :ui="{
        overlay: 'bg-slate-700/50',
        wrapper: 'sm:max-w-lg',
        content: 'sm:rounded-md rounded-t-md',
        body: 'p-4 sm:p-6 overflow-y-auto custom-scroll',
        close: 'cursor-pointer'
      }"
      modal
      overlay
      transition
    >
      <template #body>
        <UForm :state="formNew" @submit.prevent="submitNewQuestion">
          <div class="space-y-4 w-full">
            <UFormField label="Вопрос" required class="w-full">
              <UInput v-model="formNew.question" placeholder="Текст вопроса" class="w-full" size="lg" />
            </UFormField>
            <div class="space-y-2">
              <div class="text-sm font-medium text-slate-900 dark:text-white">Ответы</div>
              <div v-for="(ans, idx) in formNew.answers" :key="idx" class="flex items-center gap-2">
                <UCheckbox v-model="ans.isCorrect" color="primary" class="mt-0.5" />
                <UInput v-model="ans.text" placeholder="Текст ответа" class="flex-1" size="lg" />
                <UButton
                  v-if="idx >= 2"
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  class="cursor-pointer p-2"
                  @click.prevent="removeAnswerField(idx)"
                  title="Удалить ответ"
                >
                  <UIcon name="i-heroicons-trash" class="w-5 h-5" />
                </UButton>
              </div>
              <div>
                <UButton type="button" color="primary" variant="soft" size="sm" class="cursor-pointer px-3 py-2 text-sm" @click="addAnswerField">Добавить ответ</UButton>
              </div>
            </div>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
            <UButton variant="ghost" color="neutral" class="cursor-pointer px-3 py-2 text-sm gap-1.5" @click="closeModal">Отмена</UButton>
            <UButton color="primary" variant="soft" class="cursor-pointer px-3 py-2 text-sm gap-1.5" @click="submitNewQuestion">Отправить</UButton>
          </div>
      </template>
    </UModal>
  </template>
  <template v-else>
    <ClientOnly>
      <BottomSheet v-model="modalOpen" title="Предложить вопрос" @close="modalOpen = false">
        <div class="p-4 w-full">
          <UForm :state="formNew" @submit.prevent="submitNewQuestion">
            <div class="space-y-4 w-full">
              <UFormField label="Вопрос" required class="w-full">
                <UInput v-model="formNew.question" placeholder="Текст вопроса" class="w-full" size="lg" />
              </UFormField>
              <div class="space-y-2">
                <div class="text-sm font-medium text-slate-900 dark:text-white">Ответы</div>
                <div v-for="(ans, idx) in formNew.answers" :key="idx" class="flex items-center gap-2">
                  <UCheckbox v-model="ans.isCorrect" color="primary" class="mt-0.5" />
                  <UInput v-model="ans.text" placeholder="Текст ответа" class="flex-1" size="lg" />
                  <UButton
                    v-if="idx >= 2"
                    variant="ghost"
                    color="neutral"
                    size="sm"
                    class="cursor-pointer p-2"
                    @click.prevent="removeAnswerField(idx)"
                    title="Удалить ответ"
                  >
                    <UIcon name="i-heroicons-trash" class="w-5 h-5" />
                  </UButton>
                </div>
                <div>
                  <UButton type="button" color="primary" variant="soft" size="sm" class="cursor-pointer px-3 py-2 text-sm" @click="addAnswerField">Добавить ответ</UButton>
                </div>
              </div>
            </div>
          </UForm>
          <div class="flex items-center gap-1.5 p-4 sm:px-6">
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton variant="ghost" color="neutral" class="cursor-pointer px-3 py-2 text-sm gap-1.5" @click="closeModal">Отмена</UButton>
              <UButton color="primary" variant="soft" class="cursor-pointer px-3 py-2 text-sm gap-1.5" @click="submitNewQuestion">Отправить</UButton>
            </div>
          </div>
        </div>
      </BottomSheet>
    </ClientOnly>
  </template>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'default' })
const { isLoggedIn } = useAuth()
const isMobile = ref(false)
onMounted(() => {
  const update = () => { isMobile.value = window.innerWidth <= 768 }
  update()
  window.addEventListener('resize', update)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', () => {})
})

const route = useRoute()
const categoryId = computed(() => String(route.params.id))

const category = ref<any>(null)
const items = ref<any[]>([])
const filteredItems = computed(() => {
  const q = searchQueryLocal.value.trim().toLowerCase()
  if (!q) return items.value
  return items.value.filter((qst: any) => {
    const inQuestion = String(qst.question || '').toLowerCase().includes(q)
    const inAnswers = Array.isArray(qst.answers) && qst.answers.some((a: any) => String(a.text || '').toLowerCase().includes(q))
    return inQuestion || inAnswers
  })
})
const pending = ref(true)
const testsEnabled = ref<boolean>(true)
const searchQueryLocal = ref('')
const activeEditQuestionId = ref('')

onMounted(async () => {
  try {
    const s: any = await $fetch('/api/settings/tests-enabled', { cache: 'no-cache' as any })
    testsEnabled.value = Boolean(s?.enabled)
    if (!testsEnabled.value) {
      return
    }
    const [cat, qs] = await Promise.all([
      $fetch(`/api/tests/categories/${categoryId.value}`, { cache: 'no-cache' as any }),
      $fetch(`/api/tests?category=${categoryId.value}`, { cache: 'no-cache' as any })
    ])
    if ((cat as any)?.success) category.value = (cat as any).item
    items.value = Array.isArray((qs as any)?.items) ? (qs as any).items : []
  } finally {
    pending.value = false
  }
})

// Локальный реактивный поиск — слушаем события из шапки
function onTestsSearch(e: any) {
  try {
    searchQueryLocal.value = String(e?.detail?.query || '')
  } catch { searchQueryLocal.value = '' }
}

onMounted(() => {
  if (process.client) window.addEventListener('tests-search', onTestsSearch as any)
})
onBeforeUnmount(() => {
  if (process.client) window.removeEventListener('tests-search', onTestsSearch as any)
})

// Подсветка совпадений
function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function highlight(text: string, query: string): string {
  const q = (query || '').trim()
  if (!q) return escapeHtml(text || '')
  try {
    const escaped = escapeHtml(text || '')
    const re = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'ig')
    return escaped.replace(re, (m) => `<span class=\"bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 rounded px-0.5\">${m}</span>`)
  } catch {
    return escapeHtml(text || '')
  }
}

function userDisplayName(user: any): string {
  const first = String(user?.firstName || '').trim()
  const last = String(user?.lastName || '').trim()
  const name = [first, last].filter(Boolean).join(' ').trim()
  if (name) return name
  if (user?.telegram?.username) return `@${user.telegram.username}`
  return String(user?.email || 'Пользователь')
}

// Модальное окно добавления вопроса
const modalOpen = ref(false)
type NewAnswer = { text: string; isCorrect: boolean }
const formNew = reactive<{ question: string; answers: NewAnswer[] }>({ question: '', answers: [{ text: '', isCorrect: false }, { text: '', isCorrect: false }] })

function openModal() {
  modalOpen.value = true
}
function closeModal() {
  modalOpen.value = false
}
function addAnswerField() {
  formNew.answers.push({ text: '', isCorrect: false })
}
function removeAnswerField(index: number) {
  if (formNew.answers.length > 2) formNew.answers.splice(index, 1)
}
async function submitNewQuestion() {
  if (!formNew.question.trim()) return
  let res: any
  if (activeEditQuestionId.value) {
    // Предложение исправления существующего вопроса
    const payload = {
      question: formNew.question.trim(),
      answers: formNew.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect }))
    }
    res = await $fetch(`/api/tests/${activeEditQuestionId.value}/suggestion`, { method: 'POST', body: payload })
  } else {
    // Предложение нового вопроса
    const payload = {
      category: categoryId.value,
      question: formNew.question.trim(),
      answers: formNew.answers.map(a => ({ text: a.text, isCorrect: a.isCorrect }))
    }
    res = await $fetch('/api/tests/public', { method: 'POST', body: payload })
  }
  if (res?.success) {
    try { (useToast as any)?.().add?.({ title: 'Отправлено на модерацию', description: 'Вопрос появится после одобрения администратором', color: 'neutral' }) } catch {}
    closeModal()
    formNew.question = ''
    formNew.answers = [{ text: '', isCorrect: false }, { text: '', isCorrect: false }]
    activeEditQuestionId.value = ''
  }
}

function proposeFix(q: any) {
  // Заполняем форму текущими данными вопроса
  formNew.question = String(q?.question || '')
  const mapped = Array.isArray(q?.answers) ? q.answers.map((a: any) => ({ text: String(a?.text || ''), isCorrect: Boolean(a?.isCorrect) })) : []
  // Гарантируем минимум 2 ответа
  while (mapped.length < 2) mapped.push({ text: '', isCorrect: false })
  formNew.answers = mapped
  activeEditQuestionId.value = String(q?._id || '')
  openModal()
}

defineExpose({ proposeFix })
</script>



