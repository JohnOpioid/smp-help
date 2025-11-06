<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-lg font-semibold text-slate-900 dark:text-white">{{ form.title }}</h3>
          <div class="flex items-center gap-2">
            <UButton color="error" variant="soft" @click="onDelete" class="cursor-pointer">Удалить</UButton>
            <UButton color="primary" :loading="pending" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
          </div>
        </div>

        <UForm :state="form" class="mb-4">
          <div class="grid grid-cols-1 gap-3">
            <UFormField label="Заголовок" required>
              <UInput v-model="form.title" size="lg" class="w-full" />
            </UFormField>
            <UFormField label="Описание">
              <UTextarea v-model="form.description" :rows="3" size="lg" class="w-full" />
            </UFormField>
          </div>
        </UForm>

        <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
          <div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700">
            <div class="text-sm font-medium text-slate-700 dark:text-slate-200">Пункты ({{ form.items.length }})</div>
            <UButton size="xs" variant="soft" @click="addItem" class="cursor-pointer">Добавить пункт</UButton>
          </div>
          <div class="divide-y divide-slate-100 dark:divide-slate-700">
            <div v-for="(it, i) in form.items" :key="it._id || i" class="p-3 space-y-3">
              <div class="grid grid-cols-1 gap-2">
                <UInput v-model="form.items[i].title" placeholder="Заголовок" size="lg" class="w-full" />
                <div class="flex items-center gap-2 justify-end">
                  <UButton size="xs" variant="soft" @click="addField(i, 'input')" class="cursor-pointer">Добавить поле</UButton>
                  <UButton size="xs" variant="soft" @click="addField(i, 'textarea')" class="cursor-pointer">Добавить текст</UButton>
                  <UButton size="xs" color="error" variant="soft" @click="removeItem(i)" class="cursor-pointer">Удалить пункт</UButton>
                </div>
                <div class="space-y-3">
                  <div v-for="(f, fi) in (form.items[i].fields || [])" :key="f._id || fi" class="space-y-2">
                    <div class="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 items-start">
                      <div class="space-y-2">
                        <UInput v-model="form.items[i].fields[fi].label" placeholder="Подпись" size="lg" class="w-full" />
                        <UInput v-if="f.type === 'input'" v-model="form.items[i].fields[fi].value" placeholder="Значение" size="lg" class="w-full" />
                        <UTextarea v-else v-model="form.items[i].fields[fi].value" :rows="4" placeholder="Текст" size="lg" class="w-full" />
                      </div>
                      <div class="flex items-center gap-2 justify-end md:self-center">
                        <UButton size="xs" variant="soft" @click="toggleType(i, fi)" class="cursor-pointer">{{ f.type === 'input' ? 'На текст' : 'На поле' }}</UButton>
                        <UButton size="xs" color="error" variant="soft" @click="removeField(i, fi)" class="cursor-pointer">Удалить</UButton>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin' })
const route = useRoute()
const slug = computed(() => String(route.params.slug || ''))

const pending = ref(false)
const { data, refresh } = await useFetch<any>(() => slug.value ? `/api/classroom/list/${slug.value}` : null, { server: false })
const doc = computed<any>(() => (data as any)?.value?.item || null)

const form = reactive<{ title: string; description: string; items: any[] }>({ title: '', description: '', items: [] })

watch(doc, () => {
  Object.assign(form, {
    title: doc.value?.title || '',
    description: doc.value?.description || '',
    items: (doc.value?.items || []).map((it: any) => ({
      _id: it._id,
      title: it.title || '',
      fields: Array.isArray(it.fields) && it.fields.length
        ? JSON.parse(JSON.stringify(it.fields))
        : (it.description ? [{ type: 'textarea', label: 'Описание', value: it.description }] : [])
    }))
  })
}, { immediate: true })

const addItem = () => form.items.push({ title: '', fields: [] })
const removeItem = (i: number) => form.items.splice(i, 1)
const addField = (itemIndex: number, type: 'input' | 'textarea') => {
  const arr = form.items[itemIndex].fields || (form.items[itemIndex].fields = [])
  arr.push({ type, label: '', value: '' })
}
const removeField = (itemIndex: number, fieldIndex: number) => {
  const arr = form.items[itemIndex].fields || []
  arr.splice(fieldIndex, 1)
}
const toggleType = (itemIndex: number, fieldIndex: number) => {
  const f = form.items[itemIndex].fields?.[fieldIndex]
  if (!f) return
  f.type = f.type === 'input' ? 'textarea' : 'input'
}

const onSubmit = async () => {
  pending.value = true
  try {
    const items = form.items.map((it) => ({ title: it.title, fields: it.fields || [] }))
    await $fetch(`/api/classroom/list/${slug.value}`, { method: 'PATCH', body: { title: form.title, description: form.description, items } })
    await refresh()
  } finally {
    pending.value = false
  }
}

const onDelete = async () => {
  if (!confirm('Удалить эту страницу?')) return
  pending.value = true
  try {
    await $fetch(`/api/classroom/list/${slug.value}`, { method: 'DELETE' })
    const pagesVersion = useState<number>('classroomPagesVersion')
    if (pagesVersion) pagesVersion.value = (pagesVersion.value || 0) + 1
    await navigateTo('/admin/classroom')
  } finally {
    pending.value = false
  }
}
</script>


