<template>
  <div class="flex-1">
    <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
      <div class="bg-white dark:bg-slate-800 rounded-lg">
        <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
          <div>
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Категории тестов</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте категории тестов</p>
          </div>
          <UButton color="primary" size="sm" class="cursor-pointer" @click="onNew">Новая категория</UButton>
        </div>

        <div class="relative overflow-auto">
          <table class="min-w-full overflow-clip">
            <thead>
              <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/30">
                <th class="text-left p-3 font-medium">Название</th>
                <th class="text-left p-3 font-medium">URL</th>
                <th class="text-right p-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="cat in items" :key="cat._id" class="border-t border-slate-100 dark:border-slate-700/60">
                <td class="p-3">
                  <NuxtLink :to="`/tests/${cat._id}`" class="text-slate-900 dark:text-white hover:underline">{{ cat.name }}</NuxtLink>
                </td>
                <td class="p-3 text-slate-600 dark:text-slate-300">/{{ cat.url }}</td>
                <td class="p-3 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <UButton size="xs" variant="soft" color="neutral" class="cursor-pointer" @click="onEdit(cat)">Редактировать</UButton>
                    <UButton size="xs" variant="soft" color="red" class="cursor-pointer" @click="onDelete(cat)">Удалить</UButton>
                  </div>
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

const slideoverOpen = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)
const pendingSubmit = ref(false)
const form = reactive<{ name: string; description?: string }>({ name: '', description: '' })

function onNew() {
  isEdit.value = false
  currentId.value = null
  form.name = ''
  form.description = ''
  slideoverOpen.value = true
}

function onEdit(cat: any) {
  isEdit.value = true
  currentId.value = String(cat._id)
  form.name = cat.name || ''
  form.description = cat.description || ''
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
      const res: any = await $fetch(`/api/tests/categories/${currentId.value}`, { method: 'PATCH', body: { name: form.name, description: form.description } })
      if (res?.success && res.item) {
        const idx = items.value.findIndex((i: any) => i._id === currentId.value)
        if (idx !== -1) items.value[idx] = res.item
      }
    } else {
      const res: any = await $fetch('/api/tests/categories', { method: 'POST', body: { name: form.name, description: form.description } })
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


