<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
    <div class="flex items-center justify-between mb-6">
      <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Учебная комната</h2>
      <UDropdownMenu :items="addMenu" :ui="{ content: 'w-56', item: 'cursor-pointer' }">
        <UButton color="primary" icon="i-lucide-plus" trailing-icon="i-lucide-chevron-down">Добавить</UButton>
      </UDropdownMenu>
    </div>

    <div class="bg-white dark:bg-slate-800 rounded-lg">
      <div class="p-4 border-b border-slate-100 dark:border-slate-700">
        <p class="text-sm text-slate-600 dark:text-slate-300">Разделы</p>
      </div>

      <ul class="grid grid-cols-1 md:grid-cols-2 gap-0">
        <li
          v-for="(section, index) in sections"
          :key="section.url"
          class="p-4 hover:bg-slate-100 dark:hover:bg-slate-700/40 cursor-pointer relative border-b border-slate-100 dark:border-slate-700"
          :class="{
            'md:border-r md:border-slate-100 dark:md:border-slate-700': (index % 2 === 0) && !(sections.length % 2 === 1 && index === sections.length - 1),
            'md:border-b-0': sections.length % 2 === 0 && index >= sections.length - 2,
            'border-b-0': index === sections.length - 1,
            'md:col-span-2': sections.length % 2 === 1 && index === sections.length - 1
          }"
          @click="openSection(section)"
        >
          <div class="flex items-start justify-between gap-2">
            <div class="flex items-center gap-3">
              <UIcon :name="section.icon" class="w-6 h-6 text-slate-600 dark:text-slate-400 flex-shrink-0" />
              <div>
                <p class="text-slate-900 dark:text-white font-medium">{{ section.title }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">{{ section.description }}</p>
              </div>
            </div>
            <div class="flex items-center gap-1" @click.stop>
              <svg class="w-4 h-4 text-slate-400 flex-shrink-0 self-start" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
              <UDropdownMenu v-if="section.isDynamic" :items="getItemMenu(section)" :ui="{ content: 'w-48', item: 'cursor-pointer' }">
                <UButton icon="i-lucide-ellipsis-vertical" size="xs" variant="ghost" class="cursor-pointer" />
              </UDropdownMenu>
            </div>
          </div>
        </li>

        <li v-if="sections.length === 0" class="p-6 border-b-0">
          <p class="text-sm text-slate-600 dark:text-slate-300">Пока нет разделов</p>
        </li>
      </ul>
    </div>

    <USlideover v-model:open="createOpen" title="Новая страница" description="Укажите тип, заголовок и URL" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
      <template #body>
        <UForm :state="createForm">
          <div class="space-y-3">
            <UFormField label="Тип страницы" required>
              <USelect v-model="createForm.type" :items="[
                { label: 'Список', value: 'list' },
                { label: 'Таблица', value: 'table' },
                { label: 'Схема', value: 'scheme' }
              ]" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Заголовок" required>
              <UInput v-model="createForm.title" placeholder="Например: Педиатрия" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="URL (slug)" help="Можно оставить пустым — сформируется из заголовка">
              <UInput v-model="createForm.slug" placeholder="naprimer-pediatriya" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Описание">
              <UTextarea v-model="createForm.description" :rows="4" placeholder="Краткое описание страницы" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Иконка (код, например: i-lucide-file-text)">
              <UInput v-model="createForm.icon" placeholder="i-lucide-file-text" size="lg" class="w-full" />
            </UFormField>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <UButton variant="ghost" @click="createOpen = false">Отмена</UButton>
          <UButton color="primary" :loading="creating" @click="onCreateSubmit">Создать</UButton>
        </div>
      </template>
    </USlideover>
  </div>
  <USlideover v-model:open="editOpen" title="Редактирование страницы" description="Измените поля и сохраните" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
    <template #body>
      <UForm :state="editForm">
        <div class="space-y-3 w-full">
          <UFormField label="Заголовок" required class="w-full">
            <UInput v-model="editForm.title" size="lg" class="w-full" />
          </UFormField>
          <UFormField label="Описание" class="w-full" v-if="editForm.type !== 'table'">
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
        <UButton color="error" variant="soft" class="cursor-pointer" @click="removeItem({ slug: editForm.slug, type: editForm.type as any } as any)">Удалить</UButton>
        <UButton color="primary" :loading="editing" class="cursor-pointer" @click="saveEdit">Сохранить</UButton>
      </div>
    </template>
  </USlideover>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })

type ClassroomSection = {
  title: string
  description: string
  url: string
  icon: string
  type?: 'list' | 'table' | 'scheme'
  slug?: string
  isDynamic?: boolean
}

const baseSections: ClassroomSection[] = [
  {
    title: 'Инструкции',
    description: 'Управление инструкциями и памятками',
    url: '/admin/classroom/instructions',
    icon: 'i-lucide-file-text'
  },
  {
    title: 'СЛР',
    description: 'Таблицы и примечания для СЛР',
    url: '/admin/classroom/cpr',
    icon: 'i-lucide-activity'
  },
  {
    title: 'Проходимость дыхательных путей',
    description: 'Схема проходимости дыхательных путей',
    url: '/admin/classroom/airway',
    icon: 'i-lucide-wind'
  }
]

const { data, refresh } = await useFetch('/api/classroom/pages', { server: false })
const pages = computed<any[]>(() => (data.value?.items || []))
const pagesVersion = useState<number>('classroomPagesVersion', () => 0)
watch(pagesVersion, () => { refresh() })
if (process.client) {
  onMounted(() => {
    window.addEventListener('focus', () => { refresh() })
  })
}

const sections = computed<ClassroomSection[]>(() => {
  const dynamic = (pages.value || []).map((p: any) => ({
    title: p.title,
    description: p.description || (p.type === 'table' ? 'Таблица' : p.type === 'scheme' ? 'Схема' : 'Список'),
    url: `/admin/classroom/${p.slug}`,
    icon: p.icon || (p.type === 'table' ? 'i-lucide-table' : p.type === 'scheme' ? 'i-lucide-shapes' : 'i-lucide-list'),
    type: p.type,
    slug: p.slug,
    isDynamic: true
  }))
  return [...baseSections, ...dynamic]
})

function openSection(section: ClassroomSection) {
  navigateTo(section.url)
}

const addMenu = [[
  {
    label: 'Список',
    icon: 'i-lucide-list',
    class: 'cursor-pointer',
    onSelect: () => openCreate('list')
  },
  {
    label: 'Таблица',
    icon: 'i-lucide-table',
    class: 'cursor-pointer',
    onSelect: () => openCreate('table')
  },
  {
    label: 'Схема',
    icon: 'i-lucide-shapes',
    class: 'cursor-pointer',
    onSelect: () => openCreate('scheme')
  }
]]

type PageType = 'list' | 'table' | 'scheme'
const createOpen = ref(false)
const creating = ref(false)
const createForm = reactive<{ type: PageType; title: string; slug: string; description: string; icon: string }>({ type: 'list', title: '', slug: '', description: '', icon: '' })

function openCreate(type: PageType) {
  createForm.type = type
  createForm.title = ''
  createForm.slug = ''
  createForm.description = ''
  createOpen.value = true
}

async function onCreateSubmit() {
  if (creating.value) return
  creating.value = true
  try {
    const payload = { title: createForm.title, slug: createForm.slug, description: createForm.description, icon: createForm.icon }
    if (createForm.type === 'table') {
      const res: any = await $fetch('/api/cpr', { method: 'POST', body: { title: payload.title, slug: payload.slug, icon: payload.icon } })
      const slug = payload.slug || res?.item?.slug || ''
      pagesVersion.value++
      await refresh()
      await navigateTo(`/admin/classroom/${slug}`)
    } else if (createForm.type === 'list') {
      const res: any = await $fetch('/api/classroom/list', { method: 'POST', body: payload })
      const slug = payload.slug || res?.item?.slug || ''
      pagesVersion.value++
      await refresh()
      await navigateTo(`/admin/classroom/${slug}`)
    } else {
      const res: any = await $fetch('/api/classroom/airway', { method: 'POST', body: payload })
      const slug = payload.slug || res?.item?.slug || ''
      pagesVersion.value++
      await refresh()
      await navigateTo(`/admin/classroom/${slug}`)
    }
    createOpen.value = false
  } finally {
    creating.value = false
  }
}

// Edit slideover
const editOpen = ref(false)
const editing = ref(false)
const editForm = reactive<{ slug: string; type: PageType | null; title: string; description: string; icon: string }>({ slug: '', type: null, title: '', description: '', icon: '' })

function getItemMenu(section: ClassroomSection) {
  return [[
    { label: 'Открыть', icon: 'i-lucide-external-link', onSelect: () => openSection(section) },
    { label: 'Редактировать', icon: 'i-lucide-pencil', onSelect: () => openEdit(section) },
    { label: 'Удалить', icon: 'i-lucide-trash', color: 'error', onSelect: () => removeItem(section) }
  ]]
}

async function openEdit(section: ClassroomSection) {
  if (!section.slug || !section.type) return
  editForm.slug = section.slug
  editForm.type = section.type
  editForm.title = section.title
  editForm.description = section.description || ''
  editForm.icon = section.icon || ''
  try {
    if (section.type === 'list') {
      const res: any = await $fetch(`/api/classroom/list/${section.slug}`)
      editForm.title = res?.item?.title || editForm.title
      editForm.description = res?.item?.description || editForm.description
      editForm.icon = res?.item?.icon || editForm.icon
    } else if (section.type === 'table') {
      const res: any = await $fetch(`/api/cpr/${section.slug}`)
      editForm.title = res?.item?.title || editForm.title
      editForm.icon = res?.item?.icon || editForm.icon
    } else if (section.type === 'scheme') {
      const res: any = await $fetch(`/api/classroom/airway/${section.slug}`)
      editForm.title = res?.item?.title || editForm.title
      editForm.description = res?.item?.description || editForm.description
      editForm.icon = res?.item?.icon || editForm.icon
    }
  } catch {}
  editOpen.value = true
}

async function saveEdit() {
  if (editing.value || !editForm.type) return
  editing.value = true
  try {
    if (editForm.type === 'list') {
      await $fetch(`/api/classroom/list/${editForm.slug}`, { method: 'PATCH', body: { title: editForm.title, description: editForm.description, icon: editForm.icon } })
    } else if (editForm.type === 'table') {
      await $fetch(`/api/cpr/${editForm.slug}`, { method: 'PATCH', body: { title: editForm.title, icon: editForm.icon } })
    } else if (editForm.type === 'scheme') {
      await $fetch(`/api/classroom/airway/${editForm.slug}`, { method: 'PATCH', body: { title: editForm.title, description: editForm.description, icon: editForm.icon } })
    }
    pagesVersion.value++
    await refresh()
    editOpen.value = false
  } finally {
    editing.value = false
  }
}

async function removeItem(section: ClassroomSection) {
  if (!section.slug || !section.type) return
  if (!confirm('Удалить страницу?')) return
  try {
    if (section.type === 'list') await $fetch(`/api/classroom/list/${section.slug}`, { method: 'DELETE' })
    else if (section.type === 'table') await $fetch(`/api/cpr/${section.slug}`, { method: 'DELETE' })
    else if (section.type === 'scheme') await $fetch(`/api/classroom/airway/${section.slug}`, { method: 'DELETE' })
    pagesVersion.value++
    await refresh()
  } catch {}
}
</script>
