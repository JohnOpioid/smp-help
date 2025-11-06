<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">

        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Список инструкций ({{ total }})</h3>
          <UButton color="primary" @click="onAdd">Добавить</UButton>
        </div>
        
        <!-- Поиск -->
        <div class="mb-4">
          <UInput 
            v-model="searchQuery" 
            placeholder="Поиск по заголовку, коду или описанию..." 
            size="lg"
            class="w-full"
            :input-class="'px-4 py-3'"
          >
            <template #leading>
              <UIcon name="i-heroicons-magnifying-glass" />
            </template>
          </UInput>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
          <UTable :data="paginatedItems" :columns="columns" :loading="pendingList" sticky="header" class="w-full">
            <template #empty>
              <div class="p-6 text-sm text-slate-600 dark:text-slate-300">Нет данных. Добавьте инструкцию.</div>
            </template>
          </UTable>
          
          <!-- Пагинация -->
          <div v-if="totalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
            <UPagination 
              :page="page" 
              :total="totalPages" 
              :page-size="1"
              :max-visible="10"
              show-last
              show-first
              @update:page="page = $event"
            />
          </div>
        </div>

        <USlideover v-model:open="open" title="Новая инструкция" description="Заполните поля и сохраните" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="form" @submit.prevent="onSubmit">
              <div class="space-y-3 w-full">
                <UFormField label="Заголовок" required class="w-full">
                  <UInput v-model="form.title" placeholder="Например: Анафилаксия" class="w-full" />
                </UFormField>
                <UFormField label="Код" required class="w-full">
                  <UInput v-model="form.code" placeholder="Например: A00" class="w-full" />
                </UFormField>
                <UFormField label="Описание (Markdown)" class="w-full">
                  <textarea
                    ref="descRef"
                    v-model="form.description"
                    class="w-full rounded-md border-0 appearance-none placeholder:text-dimmed focus:outline-none disabled:cursor-not-allowed disabled:opacity-75 transition-colors px-2 py-4 text-sm gap-1.5 text-highlighted bg-default ring ring-inset ring-accented focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                    placeholder="Поддерживается Markdown"
                    rows="5"
                    @input="resizeTextarea"
                    style="overflow:hidden; resize:none;"
                  />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="open = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pending" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

// Markdown превью убран по требованию



const open = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)
const form = reactive({ title: '', code: '', description: '' })
const pending = ref(false)
const pendingList = ref(false)

// Поиск
const searchQuery = ref('')

// Пагинация
const page = ref(1)
const perPage = 15
const total = ref(0)

const fetchOptions: any = { method: 'GET', credentials: 'include' }
if (process.server) {
  const headers = useRequestHeaders(['cookie'])
  fetchOptions.headers = { cookie: headers.cookie as string }
}
const { data, refresh, pending: fetching } = await useFetch('/api/classroom/section/instructions', {
  ...fetchOptions,
  server: false
})
const doc = computed(() => data.value?.item || null)
const items = computed(() => (doc.value?.data?.items) || [])

// Фильтрация по поиску
const { matchesNormalized } = useTextNormalization()
const filteredItems = computed(() => {
  const allItems = items.value
  if (!searchQuery.value.trim()) return allItems
  
  const query = searchQuery.value.trim()
  return allItems.filter((item: any) => {
    const searchableText = [
      item.title,
      item.code,
      item.description
    ].filter(Boolean).join(' ')
    
    return matchesNormalized(query, searchableText)
  })
})

const paginatedItems = computed(() => {
  const start = (page.value - 1) * perPage
  const end = start + perPage
  return filteredItems.value.slice(start, end)
})
const totalPages = computed(() => Math.ceil(filteredItems.value.length / perPage))

watch(filteredItems, (newItems) => {
  total.value = newItems.length
  // Сбрасываем на первую страницу при изменении поиска
  if (page.value > Math.ceil(newItems.length / perPage)) {
    page.value = 1
  }
})

// Сбрасываем страницу при изменении поиска
watch(searchQuery, () => {
  page.value = 1
})

watch(fetching, v => { pendingList.value = !!v })

onMounted(() => { 
  refresh()
})

import { h } from 'vue'

const columns = [
  { accessorKey: 'title', header: 'Заголовок' },
  { accessorKey: 'code', header: 'Код' },
  {
    accessorKey: 'description',
    header: 'Описание',
    cell: ({ row }: any) => h(
      'div',
      { class: 'max-w-[240px] sm:max-w-[320px] md:max-w-[420px] truncate text-ellipsis overflow-hidden' },
      row.original.description || ''
    )
  },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => h(
      'div',
      { class: 'flex items-center gap-2' },
      [
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEdit(row.original) },
          { default: () => 'Редактировать' }
        ),
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) },
          { default: () => 'Удалить' }
        )
      ]
    )
  }
]

const onAdd = () => {
  isEdit.value = false
  currentId.value = null
  form.title = ''
  form.code = ''
  form.description = ''
  open.value = true
}

const onEdit = (item: any) => {
  isEdit.value = true
  currentId.value = item._id
  form.title = item.title
  form.code = item.code
  form.description = item.description || ''
  open.value = true
}

const onSubmit = async () => {
  pending.value = true
  try {
    // Собираем новый список items и сохраняем в Classroom
    const list = items.value.slice()
    if (isEdit.value && currentId.value) {
      const idx = list.findIndex((x: any) => String(x._id) === String(currentId.value))
      if (idx >= 0) list[idx] = { ...list[idx], title: form.title, code: form.code, description: form.description }
    } else {
      list.push({ _id: currentId.value || Date.now().toString(), title: form.title, code: form.code, description: form.description, createdAt: new Date().toISOString() })
    }
    await $fetch('/api/classroom/section/instructions', { method: 'PATCH', body: { data: { items: list } } })
      form.title = ''
      form.code = ''
      form.description = ''
      await refresh()
      open.value = false
  } finally {
    pending.value = false
  }
}

const onDelete = async (item: any) => {
  if (!confirm('Удалить инструкцию?')) return
  pendingList.value = true
  try {
    const list = items.value.filter((x: any) => String(x._id) !== String(item._id))
    await $fetch('/api/classroom/section/instructions', { method: 'PATCH', body: { data: { items: list } } })
    await refresh()
  } finally {
    pendingList.value = false
  }
}

const descRef = ref<HTMLTextAreaElement | null>(null)
const resizeTextarea = () => {
  const el = descRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = `${el.scrollHeight}px`
}
onMounted(() => resizeTextarea())
watch(() => form.description, () => resizeTextarea())
watch(open, async (v) => {
  if (v) {
    await nextTick()
    resizeTextarea()
  }
})
</script>


