<template>
  <div class="space-y-3">
    <UForm :state="state">
      <UFormField label="Заголовок" required class="w-full">
        <UInput v-model="state.title" size="lg" class="w-full" />
      </UFormField>
      <UFormField label="Описание" class="w-full">
        <UTextarea v-model="state.description" :rows="3" size="lg" class="w-full" />
      </UFormField>
    </UForm>

    <div class="bg-white dark:bg-slate-800 rounded-lg overflow-hidden">
      <div class="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700">
        <div class="text-sm font-medium text-slate-700 dark:text-slate-200">Пункты ({{ items.length }})</div>
        <UButton size="xs" variant="soft" @click="addItem" class="cursor-pointer">Добавить</UButton>
      </div>
      <div class="divide-y divide-slate-100 dark:divide-slate-700">
        <div v-for="(it, i) in items" :key="i" class="p-3 space-y-2">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
            <UInput v-model="items[i].title" placeholder="Заголовок" size="lg" class="w-full" />
            <div class="md:col-span-2 flex items-center justify-end">
              <UButton size="xs" color="error" variant="soft" @click="removeItem(i)" class="cursor-pointer">Удалить</UButton>
            </div>
          </div>
          <div class="space-y-2">
            <div v-for="(f, fi) in (items[i].fields || [])" :key="fi" class="space-y-2">
              <UInput v-model="items[i].fields[fi].label" placeholder="Подпись" size="lg" class="w-full" />
              <UInput v-if="f.type === 'input'" v-model="items[i].fields[fi].value" placeholder="Значение" size="lg" class="w-full" />
              <UTextarea v-else v-model="items[i].fields[fi].value" :rows="4" placeholder="Текст" size="lg" class="w-full" />
              <div class="flex items-center gap-2 justify-end">
                <UButton size="xs" variant="soft" @click="toggleType(i, fi)" class="cursor-pointer">{{ f.type === 'input' ? 'На текст' : 'На поле' }}</UButton>
                <UButton size="xs" color="error" variant="soft" @click="removeField(i, fi)" class="cursor-pointer">Удалить</UButton>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UButton size="xs" variant="soft" @click="addField(i, 'input')" class="cursor-pointer">Добавить поле</UButton>
              <UButton size="xs" variant="soft" @click="addField(i, 'textarea')" class="cursor-pointer">Добавить текст</UButton>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex items-center justify-end gap-2">
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
// Универсальный редактор списка
// v-model:title, v-model:description, v-model:items
const props = defineProps<{
  title: string
  description: string
  items: any[]
}>()
const emit = defineEmits<{
  'update:title': [string]
  'update:description': [string]
  'update:items': [any[]]
}>()

const state = reactive({
  get title() { return props.title },
  set title(v: string) { emit('update:title', v) },
  get description() { return props.description },
  set description(v: string) { emit('update:description', v) }
}) as any

const items = computed({
  get: () => props.items,
  set: (v) => emit('update:items', v)
})

function addItem() { items.value = [...items.value, { title: '', fields: [] }] }
function removeItem(i: number) { items.value = items.value.filter((_, idx) => idx !== i) }
function addField(i: number, type: 'input' | 'textarea') {
  const arr = items.value[i].fields || (items.value[i].fields = [])
  arr.push({ type, label: '', value: '' })
  emit('update:items', items.value)
}
function removeField(i: number, fi: number) {
  const arr = items.value[i].fields || []
  arr.splice(fi, 1)
  emit('update:items', items.value)
}
function toggleType(i: number, fi: number) {
  const f = items.value[i].fields?.[fi]
  if (!f) return
  f.type = f.type === 'input' ? 'textarea' : 'input'
  emit('update:items', items.value)
}
</script>


