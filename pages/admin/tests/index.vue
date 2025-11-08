<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Категории тестов</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте категории тестов</p>
          </div>
          <UButton color="primary" size="sm" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onNew" title="Новая категория" />
        </div>

        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div class="text-sm text-slate-600 dark:text-slate-300">Раздел «Тесты» доступен на сайте</div>
          <USwitch v-model="testsEnabled" color="primary" @update:model-value="updateTestsEnabled" />
        </div>

        <div class="relative overflow-auto">
          <table class="w-full overflow-clip">
            <thead>
              <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                <th class="text-left p-3 font-medium w-full">Название</th>
                <th class="text-center p-3 font-medium whitespace-nowrap">Доступен</th>
                <th class="text-center p-3 font-medium whitespace-nowrap">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in items" :key="cat._id" class="border-t border-slate-100 dark:border-slate-700/60">
                <td class="p-3">
                  <div class="flex items-center gap-2">
                    <NuxtLink :to="`/admin/tests/${cat._id}`" class="text-slate-900 dark:text-white hover:underline">{{ cat.name }}</NuxtLink>
                    <UIcon v-if="cat.courseLink" name="i-heroicons-academic-cap" class="w-4 h-4 text-slate-500 dark:text-slate-400" title="Есть ссылка на курс" />
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">/{{ cat.url }}</div>
                </td>
                <td class="p-3 text-center whitespace-nowrap">
                  <UBadge :color="cat.isPublic ? 'primary' : 'neutral'" variant="soft" size="sm" class="cursor-default">{{ cat.isPublic ? 'Да' : 'Нет' }}</UBadge>
                </td>
                <td class="p-3 text-center whitespace-nowrap">
                  <UPopover v-model:open="popoverOpenMap[cat._id]" :content="{ side: 'bottom', align: 'end', sideOffset: 8 }">
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
                            @click="popoverOpenMap[cat._id] = false; onEdit(cat)"
                          >
                            <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                            <span>Редактировать</span>
                          </button>
                          <button
                            type="button"
                            class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                            @click="popoverOpenMap[cat._id] = false; onDelete(cat)"
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
          <div v-if="!pending && items.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">Пока нет категорий</div>
          <div v-if="pending" class="p-6"><USkeleton class="h-6 w-full" /></div>
        </div>
      </div>
    </div>

    <USlideover v-if="slideoverOpen" v-model:open="slideoverOpen" :title="isEdit ? 'Редактировать категорию' : 'Новая категория'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
      <template #body>
        <UForm :state="form" @submit.prevent="onSubmit">
          <div class="space-y-3 w-full">
            <UFormField label="Название" required class="w-full">
              <UInput v-model="form.name" placeholder="Например: Общая подготовка" class="w-full" size="xl" />
            </UFormField>
            <UFormField label="Описание" class="w-full">
              <UTextarea v-model="form.description" placeholder="Краткое описание категории (необязательно)" class="w-full" />
            </UFormField>
            <UFormField label="Ссылка на курс" class="w-full">
              <UInput v-model="form.courseLink" placeholder="https://..." class="w-full" size="xl" />
            </UFormField>
            <UFormField label="Доступен на сайте" class="w-full">
              <USwitch v-model="form.isPublic" color="primary" />
            </UFormField>
          </div>
        </UForm>
      </template>
      <template #footer>
        <div class="flex items-center justify-end gap-2 w-full">
          <UButton color="neutral" variant="ghost" type="button" @click="slideoverOpen = false" class="cursor-pointer">Отмена</UButton>
          <UButton color="primary" :loading="pendingSubmit" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
        </div>
      </template>
    </USlideover>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Тесты' })

const pending = ref(false)
const items = ref<any[]>([])
const testsEnabled = ref<boolean>(false)

async function fetchItems() {
  pending.value = true
  try {
    const res: any = await $fetch('/api/tests/categories')
    items.value = Array.isArray(res?.items) ? res.items : []
  } finally {
    pending.value = false
  }
}

onMounted(fetchItems)
onMounted(async () => {
  try {
    const res: any = await $fetch('/api/settings/tests-enabled')
    testsEnabled.value = Boolean(res?.enabled)
  } catch {}
})

async function updateTestsEnabled() {
  try {
    await $fetch('/api/settings/tests-enabled', { method: 'PATCH', body: { enabled: testsEnabled.value } })
  } catch (e) {
    testsEnabled.value = !testsEnabled.value
  }
}

const slideoverOpen = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)
const pendingSubmit = ref(false)
const popoverOpenMap = reactive<Record<string, boolean>>({})
const form = reactive<{ name: string; description?: string; courseLink?: string; isPublic: boolean }>({ name: '', description: '', courseLink: '', isPublic: false })

function onNew() {
  isEdit.value = false
  currentId.value = null
  form.name = ''
  form.description = ''
  form.courseLink = ''
  form.isPublic = false
  slideoverOpen.value = true
}

function onEdit(cat: any) {
  isEdit.value = true
  currentId.value = String(cat._id)
  form.name = cat.name || ''
  form.description = cat.description || ''
  form.courseLink = cat.courseLink || ''
  form.isPublic = Boolean(cat.isPublic)
  slideoverOpen.value = true
}

async function onDelete(cat: any) {
  const ok = window.confirm(`Удалить категорию «${cat.name}»?`)
  if (!ok) return
  await $fetch(`/api/tests/categories/${cat._id}`, { method: 'DELETE' })
  items.value = items.value.filter((i: any) => i._id !== cat._id)
}

async function onSubmit() {
  pendingSubmit.value = true
  try {
    if (isEdit.value && currentId.value) {
      const res: any = await $fetch(`/api/tests/categories/${currentId.value}`, { method: 'PATCH', body: { name: form.name, description: form.description, courseLink: form.courseLink, isPublic: form.isPublic } })
      if (res?.success && res.item) {
        const idx = items.value.findIndex((i: any) => i._id === currentId.value)
        if (idx !== -1) items.value[idx] = res.item
      }
    } else {
      const res: any = await $fetch('/api/tests/categories', { method: 'POST', body: { name: form.name, description: form.description, courseLink: form.courseLink, isPublic: form.isPublic } })
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


