<template>
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">

    <div class="bg-white dark:bg-slate-800 rounded-lg">
      <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
        <div>
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Разделы</h3>
          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление разделами учебной комнаты</p>
        </div>
        <UDropdownMenu :items="addMenu" :ui="{ content: 'w-56', item: 'cursor-pointer' }">
          <UButton color="primary" icon="i-lucide-plus" trailing-icon="i-lucide-chevron-down" size="sm" class="cursor-pointer">Добавить</UButton>
        </UDropdownMenu>
      </div>

      <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
        <UInput 
          v-model="searchQuery" 
          placeholder="Поиск по названию или описанию..." 
          size="lg"
          class="w-full"
        >
          <template #leading>
            <UIcon name="i-heroicons-magnifying-glass" />
          </template>
        </UInput>
      </div>

      <div class="relative">
        <div class="overflow-x-auto">
          <table class="w-full table-fixed min-w-[600px]">
            <colgroup>
              <col style="width: 40px;">
              <col style="width: auto;">
              <col style="width: 150px;">
              <col style="width: 80px;">
            </colgroup>
            <thead>
              <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                <th class="text-left p-3 font-medium"></th>
                <th class="text-left p-3 font-medium">Название</th>
                <th class="text-left p-3 font-medium">Тип</th>
                <th class="text-center p-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="section in classroomTableData" 
                :key="section.url"
                class="border-t border-slate-100 dark:border-slate-700/60 hover:bg-slate-50 dark:hover:bg-slate-700/30 cursor-pointer"
                @click="openSection(section)"
              >
                <td class="p-3">
                  <div class="flex items-center justify-center">
                    <UIcon :name="section.icon" class="w-5 h-5 text-slate-500 dark:text-slate-400" />
                  </div>
                </td>
                <td class="p-3">
                  <div class="text-sm text-muted truncate" :title="section.title">{{ section.title }}</div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" :title="section.description">{{ section.description }}</div>
                </td>
                <td class="p-3">
                  <div class="text-sm text-muted whitespace-nowrap">
                    <span v-if="section.type === 'list'" class="px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Список</span>
                    <span v-else-if="section.type === 'table'" class="px-2 py-0.5 text-xs font-medium rounded bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">Таблица</span>
                    <span v-else-if="section.type === 'scheme'" class="px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">Схема</span>
                    <span v-else class="text-slate-400">—</span>
                  </div>
                </td>
                <td class="p-3 text-center whitespace-nowrap" @click.stop>
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
                            type="button"
                            class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            @click="openSection(section)"
                          >
                            <UIcon name="i-heroicons-arrow-top-right-on-square" class="w-4 h-4 text-slate-500" />
                            <span>Открыть</span>
                          </button>
                          <button
                            v-if="section.slug && section.type"
                            type="button"
                            class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                            @click="openEdit(section)"
                          >
                            <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                            <span>Редактировать</span>
                          </button>
                          <button
                            v-if="section.slug && section.type"
                            type="button"
                            class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                            @click="removeItem(section)"
                          >
                            <UIcon name="i-heroicons-trash" class="w-4 h-4" />
                            <span>Удалить</span>
                          </button>
                        </nav>
                      </div>
                    </template>
                  </UPopover>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-if="classroomTableData.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
          <div>
            Пока нет разделов
          </div>
        </div>
        <div v-if="hasMoreClassroom" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
          <UButton 
            variant="soft" 
            color="neutral" 
            @click="classroomShown += 10"
            class="cursor-pointer"
          >
            <UIcon name="i-heroicons-chevron-down" class="me-1" />
            Показать еще ({{ filteredSections.length - classroomShown }})
          </UButton>
        </div>
        <div v-if="!hasMoreClassroom && classroomShown > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
          <UButton 
            variant="soft" 
            color="neutral" 
            @click="classroomShown = 10"
            class="cursor-pointer"
          >
            <UIcon name="i-heroicons-chevron-up" class="me-1" />
            Свернуть все
          </UButton>
        </div>
      </div>
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

// Реактивное обновление при изменении версии
watch(pagesVersion, async () => {
  await nextTick()
  await refresh()
  await nextTick()
}, { immediate: false })

// Также слушаем изменения через событие (для обновления из других компонентов)
if (process.client) {
  onMounted(() => {
    const handlePagesUpdate = async () => {
      await nextTick()
      await refresh()
      await nextTick()
    }
    window.addEventListener('classroom-pages-updated', handlePagesUpdate)
    onBeforeUnmount(() => {
      window.removeEventListener('classroom-pages-updated', handlePagesUpdate)
    })
  })
}

// Обновление при возврате на страницу
if (process.client) {
  onMounted(() => {
    // Обновление при фокусе окна
    window.addEventListener('focus', async () => {
      await refresh()
    })
    
    // Обновление при навигации обратно на страницу
    const router = useRouter()
    const stopWatcher = watch(() => router.currentRoute.value.path, async (newPath) => {
      if (newPath === '/admin/classroom') {
        await refresh()
      }
    })
    
    onBeforeUnmount(() => {
      stopWatcher()
    })
    
    // Watch for dropdown menu state changes and prevent/restore scroll
    const observer = new MutationObserver(() => {
      const dropdowns = document.querySelectorAll('[data-state="open"]')
      if (dropdowns.length > 0) {
        // Dropdown is open - ensure scroll is not blocked
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.top = ''
          document.body.style.left = ''
          document.body.style.right = ''
          document.body.style.width = ''
        }
      } else {
        // No dropdowns open, ensure scroll is enabled
        if (document.body.style.overflow === 'hidden') {
          document.body.style.overflow = ''
          document.body.style.position = ''
          document.body.style.top = ''
          document.body.style.left = ''
          document.body.style.right = ''
          document.body.style.width = ''
        }
      }
    })
    
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-state', 'style']
    })
    
    // Also check periodically to prevent scroll lock
    const interval = setInterval(() => {
      const dropdowns = document.querySelectorAll('[data-state="open"]')
      if (dropdowns.length > 0 && document.body.style.overflow === 'hidden') {
        // Dropdown is open but scroll is blocked - restore it
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
      } else if (dropdowns.length === 0 && document.body.style.overflow === 'hidden') {
        // No dropdowns but scroll is still blocked - restore it
        document.body.style.overflow = ''
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.left = ''
        document.body.style.right = ''
        document.body.style.width = ''
      }
    }, 50)
    
    onBeforeUnmount(() => {
      observer.disconnect()
      clearInterval(interval)
      document.body.style.overflow = ''
      document.body.style.position = ''
      document.body.style.top = ''
      document.body.style.left = ''
      document.body.style.right = ''
      document.body.style.width = ''
    })
  })
}

const searchQuery = ref('')
const classroomShown = ref(10)

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

const filteredSections = computed(() => {
  if (!searchQuery.value.trim()) {
    return sections.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return sections.value.filter((section: ClassroomSection) => {
    const searchableText = [
      section.title,
      section.description
    ].filter(Boolean).join(' ').toLowerCase()
    
    return searchableText.includes(query)
  })
})

const classroomTableData = computed(() => {
  return filteredSections.value.slice(0, classroomShown.value)
})

const hasMoreClassroom = computed(() => {
  return filteredSections.value.length > classroomShown.value
})

watch([filteredSections, searchQuery], () => {
  classroomShown.value = 10
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
    // Обновляем версию и данные немедленно
    pagesVersion.value++
    await nextTick()
    await refresh()
    await nextTick()
    // Отправляем событие для обновления других компонентов
    if (process.client) {
      window.dispatchEvent(new CustomEvent('classroom-pages-updated'))
    }
    await navigateTo(`/admin/classroom/${slug}`)
    } else if (createForm.type === 'list') {
      const res: any = await $fetch('/api/classroom/list', { method: 'POST', body: payload })
      const slug = payload.slug || res?.item?.slug || ''
    // Обновляем версию и данные немедленно
    pagesVersion.value++
    await nextTick()
    await refresh()
    await nextTick()
    // Отправляем событие для обновления других компонентов
    if (process.client) {
      window.dispatchEvent(new CustomEvent('classroom-pages-updated'))
    }
    await navigateTo(`/admin/classroom/${slug}`)
    } else {
      const res: any = await $fetch('/api/classroom/airway', { method: 'POST', body: payload })
      const slug = payload.slug || res?.item?.slug || ''
    // Обновляем версию и данные немедленно
    pagesVersion.value++
    await nextTick()
    await refresh()
    await nextTick()
    // Отправляем событие для обновления других компонентов
    if (process.client) {
      window.dispatchEvent(new CustomEvent('classroom-pages-updated'))
    }
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
    // Обновляем версию и данные немедленно
    pagesVersion.value++
    await nextTick()
    await refresh()
    await nextTick()
    // Отправляем событие для обновления других компонентов
    if (process.client) {
      window.dispatchEvent(new CustomEvent('classroom-pages-updated'))
    }
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
    // Обновляем версию и данные немедленно
    pagesVersion.value++
    await nextTick()
    await refresh()
    await nextTick()
    // Отправляем событие для обновления других компонентов
    if (process.client) {
      window.dispatchEvent(new CustomEvent('classroom-pages-updated'))
    }
  } catch {}
}
</script>

