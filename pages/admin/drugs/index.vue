<template>
  <div>
    <main class="flex-1">
  <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
    <AdminSubnav title="Лекарства" />

        <div class="mb-6 flex items-center justify-between">
          <div class="text-sm text-slate-600 dark:text-slate-300">Управление препаратами</div>
          <UButton color="primary" @click="openForm" class="cursor-pointer">Добавить</UButton>
        </div>

        <div class="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-600 md:rounded-lg overflow-hidden">
          <UTable :data="rows" :columns="columns" :loading="pending" class="w-full" />
        </div>

        <USlideover v-model:open="formOpen" :title="isEdit ? 'Редактировать препарат' : 'Новый препарат'" side="right" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="form" @submit.prevent="onSubmit">
              <div class="space-y-3 w-full">
                <UFormField label="Название" required>
                  <UInput v-model="form.name" placeholder="Название препарата" class="w-full" />
                </UFormField>
                <UFormField label="Латинское название">
                  <UInput v-model="form.latinName" placeholder="Например: Epinephrine" class="w-full" />
                </UFormField>
                <UFormField label="Категории (можно несколько)">
                  <USelect
                    v-model="form.categories"
                    :items="categoryOptions"
                    multiple
                    placeholder="Выберите категории"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Синонимы (через запятую)">
                  <UInput v-model="synonymsInput" placeholder="Например: адреналин, эпинефрин" class="w-full" />
                </UFormField>
                <UFormField label="Показания (по одному на строку)">
                  <UTextarea v-model="indicationsInput" :rows="3" class="w-full" />
                </UFormField>
                <UFormField label="Противопоказания (по одному на строку)">
                  <UTextarea v-model="contraindicationsInput" :rows="3" class="w-full" />
                </UFormField>
                <UFormField label="Побочные эффекты (по одному на строку)">
                  <UTextarea v-model="adverseInput" :rows="3" class="w-full" />
                </UFormField>
                <UFormField label="Взаимодействия (по одному на строку)">
                  <UTextarea v-model="interactionsInput" :rows="3" class="w-full" />
                </UFormField>
                <UFormField label="Антидоты (по одному на строку)">
                  <UTextarea v-model="antidotesInput" :rows="2" class="w-full" />
                </UFormField>
                <UFormField label="Форма выпуска">
                  <div class="grid grid-cols-3 gap-2">
                    <UInput v-model.number="form.forms.doseValue" type="number" placeholder="Дозировка" class="w-full" />
                    <USelect 
                      v-model="form.forms.doseUnit" 
                      :items="['мг', 'мл', 'мкг', 'г', 'л', 'мг/мл', 'мкг/мл', 'МЕ/мл', 'ME/мл', '%']" 
                      placeholder="Ед." 
                      class="w-full" 
                    />
                    <UInput v-model.number="form.forms.volumeMl" type="number" placeholder="Объем (мл)" class="w-full" />
                  </div>
                </UFormField>
                <UFormField label="Дозировки в педиатрии">
                  <div class="space-y-2">
                    <div v-for="(d, i) in form.pediatricDose" :key="i" class="flex items-center gap-2">
                      <UInput v-model="form.pediatricDose[i]" placeholder="Например: 20-30 мг/кг или 5 мг/кг" class="w-full" />
                      <UButton color="neutral" variant="ghost" size="xs" class="cursor-pointer" @click="removePediatric(i)">Удалить</UButton>
                    </div>
                    <UButton color="neutral" variant="outline" size="xs" class="cursor-pointer" @click="addPediatric">Добавить</UButton>
                  </div>
                </UFormField>
                <UFormField v-if="hasPediatricDose" label="Единица измерения педиатрической дозировки">
                  <USelect 
                    v-model="form.pediatricDoseUnit" 
                    :items="['мг/кг', 'мкг/кг', 'г/кг', 'ЕД/кг', 'МЕ/кг', 'мг', 'мл', 'мл/кг', 'мкг/кг/мин', 'мл/год', 'мг/год']" 
                    placeholder="Выберите единицу" 
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Возрастные ограничения">
                  <div class="space-y-2">
                    <UInput v-model="form.ageRestrictions" placeholder="Например: с 12 лет, до 18 лет" class="w-full" />
                    <div class="flex items-center gap-2">
                      <UCheckbox v-model="noAgeRestrictions" />
                      <label class="text-sm text-slate-700 dark:text-slate-300">Без ограничений</label>
                    </div>
                  </div>
                </UFormField>
                <UFormField label="Дозы (структурировано)">
                  <div class="space-y-2">
                    <div v-for="(d, i) in form.doses" :key="i" class="grid grid-cols-1 sm:grid-cols-6 gap-2 items-end">
                      <UInput v-model="form.doses[i].context" placeholder="Контекст (Взрослые/Дети/IV/IM)" class="sm:col-span-2" />
                      <UInput v-model="form.doses[i].formula" placeholder="Формула (например, 0.1–0.3 мг/кг)" class="sm:col-span-2" />
                      <UInput v-model.number="form.doses[i].mgPerKg" type="number" placeholder="мг/кг" />
                      <UInput v-model.number="form.doses[i].maxMg" type="number" placeholder="max мг" />
                      <UInput v-model.number="form.doses[i].concentrationMgPerMl" type="number" placeholder="мг/мл" />
                      <UInput v-model="form.doses[i].notes" placeholder="Примечание" class="sm:col-span-5" />
                      <UButton size="xs" color="neutral" variant="ghost" class="cursor-pointer" @click="removeDose(i)">Удалить</UButton>
                    </div>
                    <UButton size="xs" variant="outline" color="neutral" class="cursor-pointer" @click="addDose">Добавить дозу</UButton>
                  </div>
                </UFormField>
                <UFormField label="Описание (Markdown)">
                  <UTextarea v-model="form.description" :rows="6" placeholder="Краткое описание, показания, побочки и т.д." class="w-full" />
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="formOpen = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="submitting" @click="onSubmit" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { h, resolveComponent } from 'vue'

definePageMeta({ middleware: 'admin', headerTitle: 'Лекарства' })

const { data, refresh, pending } = await useFetch('/api/drugs')
const rows = computed(() => data.value?.items || [])

const columns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'latinName', header: 'Латинское название' },
  {
    id: 'actions',
    header: 'Действия',
    cell: ({ row }: any) => h(
      'div',
      { class: 'flex items-center gap-2' },
      [
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEditDrug(row.original) },
          { default: () => 'Редактировать' }
        ),
        h(
          resolveComponent('UButton') as any,
          { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDeleteDrug(row.original) },
          { default: () => 'Удалить' }
        )
      ]
    )
  }
]

const formOpen = ref(false)
const submitting = ref(false)
const isEdit = ref(false)
const editingId = ref<string | null>(null)
const form = reactive({ 
  name: '', 
  latinName: '', 
  synonyms: [] as string[], 
  categories: [] as string[],
  indications: [] as string[],
  contraindications: [] as string[],
  adverse: [] as string[],
  interactions: [] as string[],
  antidotes: [] as string[],
  forms: { doseValue: undefined as number | undefined, doseUnit: '', volumeMl: undefined as number | undefined }, 
  pediatricDose: [] as string[],
  pediatricDoseUnit: '',
  ageRestrictions: '',
  doses: [] as Array<{ context?: string; formula?: string; mgPerKg?: number; maxMg?: number; concentrationMgPerMl?: number; notes?: string }>,
  description: '',
})
const synonymsInput = ref('')
const indicationsInput = ref('')
const contraindicationsInput = ref('')
const adverseInput = ref('')
const interactionsInput = ref('')
const antidotesInput = ref('')
const noAgeRestrictions = ref(false)

// Computed для проверки наличия педиатрических дозировок
const hasPediatricDose = computed(() => {
  return form.pediatricDose.some(dose => dose && dose.trim() !== '')
})

const openForm = () => {
  isEdit.value = false
  editingId.value = null
  form.name = ''
  form.latinName = ''
  form.description = ''
  form.pediatricDose = []
  form.pediatricDoseUnit = ''
  form.ageRestrictions = ''
  form.forms = { doseValue: undefined, doseUnit: '', volumeMl: undefined }
  synonymsInput.value = ''
  indicationsInput.value = ''
  contraindicationsInput.value = ''
  adverseInput.value = ''
  interactionsInput.value = ''
  antidotesInput.value = ''
  form.indications = []
  form.contraindications = []
  form.adverse = []
  form.interactions = []
  form.antidotes = []
  form.doses = []
  noAgeRestrictions.value = false
  form.categories = []
  formOpen.value = true
}

const addPediatric = () => { form.pediatricDose.push('') }
const removePediatric = (idx: number) => { form.pediatricDose.splice(idx, 1) }

const addDose = () => { form.doses.push({ context: '', formula: '', mgPerKg: undefined, maxMg: undefined, concentrationMgPerMl: undefined, notes: '' }) }
const removeDose = (idx: number) => { form.doses.splice(idx, 1) }

const onEditDrug = (drug: any) => {
  isEdit.value = true
  editingId.value = drug._id
  form.name = drug.name || ''
  form.latinName = drug.latinName || ''
  form.description = drug.description || ''
  form.categories = (drug.categories || []).map((c: any) => c?._id || c).filter(Boolean)
  form.pediatricDose = Array.isArray(drug.pediatricDose)
    ? (drug.pediatricDose as string[]).map(s => (s ?? '').toString())
    : ((drug.pediatricDose ?? '').toString() ? [(drug.pediatricDose as any).toString()] : [])
  form.pediatricDoseUnit = drug.pediatricDoseUnit || ''
  form.ageRestrictions = drug.ageRestrictions || ''
  noAgeRestrictions.value = drug.ageRestrictions === 'без ограничений'
  form.forms = {
    doseValue: drug.forms?.doseValue || undefined,
    doseUnit: drug.forms?.doseUnit || '',
    volumeMl: drug.forms?.volumeMl || undefined
  }
  synonymsInput.value = (drug.synonyms || []).join(', ')
  // Arrays as textareas
  form.indications = Array.isArray(drug.indications) ? drug.indications : []
  indicationsInput.value = form.indications.join('\n')
  form.contraindications = Array.isArray(drug.contraindications) ? drug.contraindications : []
  contraindicationsInput.value = form.contraindications.join('\n')
  form.adverse = Array.isArray(drug.adverse) ? drug.adverse : []
  adverseInput.value = form.adverse.join('\n')
  form.interactions = Array.isArray(drug.interactions) ? drug.interactions : []
  interactionsInput.value = form.interactions.join('\n')
  form.antidotes = Array.isArray(drug.antidotes) ? drug.antidotes : []
  antidotesInput.value = form.antidotes.join('\n')
  // doses
  form.doses = Array.isArray(drug.doses) ? drug.doses.map((d: any) => ({
    context: d?.context || '',
    formula: d?.formula || '',
    mgPerKg: isNaN(Number(d?.mgPerKg)) ? undefined : Number(d?.mgPerKg),
    maxMg: isNaN(Number(d?.maxMg)) ? undefined : Number(d?.maxMg),
    concentrationMgPerMl: isNaN(Number(d?.concentrationMgPerMl)) ? undefined : Number(d?.concentrationMgPerMl),
    notes: d?.notes || ''
  })) : []
  formOpen.value = true
}

const onDeleteDrug = async (drug: any) => {
  if (confirm(`Удалить препарат "${drug.name}"?`)) {
    try {
      const res: any = await $fetch(`/api/drugs/${drug._id}`, { method: 'DELETE' })
      if (res?.success) {
        await refresh()
      } else {
        alert(res?.message || 'Ошибка удаления')
      }
    } catch (error) {
      alert('Ошибка удаления')
    }
  }
}

const onSubmit = async () => {
  submitting.value = true
  try {
    form.synonyms = synonymsInput.value.split(',').map(s => s.trim()).filter(Boolean)
    // Очистка пустых дозировок перед отправкой
    form.pediatricDose = (form.pediatricDose || [])
      .map(s => (s ?? '').toString().trim())
      .filter(Boolean)
    // Текстовые области -> массивы
    form.indications = indicationsInput.value.split('\n').map(s => s.trim()).filter(Boolean)
    form.contraindications = contraindicationsInput.value.split('\n').map(s => s.trim()).filter(Boolean)
    form.adverse = adverseInput.value.split('\n').map(s => s.trim()).filter(Boolean)
    form.interactions = interactionsInput.value.split('\n').map(s => s.trim()).filter(Boolean)
    form.antidotes = antidotesInput.value.split('\n').map(s => s.trim()).filter(Boolean)
    // Обработка возрастных ограничений
    if (noAgeRestrictions.value) {
      form.ageRestrictions = 'без ограничений'
    } else if (!hasPediatricDose.value && !form.ageRestrictions.trim()) {
      // Если нет педиатрических дозировок и не указаны возрастные ограничения, добавляем автоматически
      form.ageRestrictions = 'старше 18 лет'
    }
    
    if (isEdit.value && editingId.value) {
      // Редактирование
      const res: any = await $fetch(`/api/drugs/${editingId.value}`, { 
        method: 'PATCH', 
        body: form 
      })
      if (res?.success) {
        await refresh()
        formOpen.value = false
      } else {
        alert(res?.message || 'Ошибка сохранения')
      }
    } else {
      // Создание
      const res: any = await $fetch('/api/drugs', { method: 'POST', body: form })
      if (res?.success) {
        await refresh()
        formOpen.value = false
      } else {
        alert(res?.message || 'Ошибка создания')
      }
    }
  } finally {
    submitting.value = false
  }
}
</script>


