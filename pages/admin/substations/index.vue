<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">

        <!-- Секция регионов -->
        <div class="mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Регионы</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте регионы</p>
              </div>
              <UButton color="primary" size="sm" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onAddRegion" title="Новый регион" />
            </div>

            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <UInput 
                v-model="regionsSearch" 
                placeholder="Поиск по названию региона, руководителю, округу или телефону..." 
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
                <table class="w-full table-fixed min-w-[800px]">
                  <colgroup>
                    <col style="width: 200px;">
                    <col style="width: 200px;">
                    <col style="width: 150px;">
                    <col style="width: auto;">
                    <col style="width: 80px;">
                  </colgroup>
                  <thead>
                    <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                      <th class="text-left p-3 font-medium">Название</th>
                      <th class="text-left p-3 font-medium">Руководитель</th>
                      <th class="text-left p-3 font-medium">Округ</th>
                      <th class="text-left p-3 font-medium">Телефоны</th>
                      <th class="text-center p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="region in regionsTableData" :key="region._id" class="border-t border-slate-100 dark:border-slate-700/60">
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="region.name">{{ region.name }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="region.manager || '—'">{{ region.manager || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="region.district || '—'">{{ region.district || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted">
                          <template v-if="region.phones && region.phones.length > 0">
                            <div v-for="(phone, idx) in region.phones" :key="idx" class="whitespace-nowrap truncate" :title="`${phone.name}: ${phone.number}`">
                              {{ phone.name }}: {{ phone.number }}
                            </div>
                          </template>
                          <span v-else>Не указаны</span>
                        </div>
                      </td>
                      <td class="p-3 text-center whitespace-nowrap">
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
                                  @click="onEditRegion(region)"
                                >
                                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                                  <span>Редактировать</span>
                                </button>
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                                  @click="onDeleteRegion(region)"
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
              <div v-if="!pendingRegions && regionsTableData.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
                <div>
                  Пока нет регионов
                </div>
              </div>
              <div v-if="pendingRegions" class="p-6"><USkeleton class="h-6 w-full" /></div>
              <div v-if="!pendingRegions && hasMoreRegions" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="regionsShown += 10"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-down" class="me-1" />
                  Показать еще ({{ filteredRegions.length - regionsShown }})
                </UButton>
              </div>
              <div v-if="!pendingRegions && !hasMoreRegions && regionsShown > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="regionsShown = 10"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-up" class="me-1" />
                  Свернуть все
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <!-- Секция подстанций -->
        <div class="mb-8">
          <div class="bg-white dark:bg-slate-800 rounded-lg">
            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
              <div>
                <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Подстанции</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Создавайте и редактируйте подстанции</p>
              </div>
              <UButton color="primary" size="sm" icon="i-heroicons-plus" class="cursor-pointer aspect-square p-2" @click="onAdd" title="Новая подстанция" />
            </div>

            <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
              <UInput 
                v-model="searchQuery" 
                placeholder="Поиск по названию, адресу или телефону..." 
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
                <table class="w-full table-fixed min-w-[800px]">
                  <colgroup>
                    <col style="width: 200px;">
                    <col style="width: auto;">
                    <col style="width: 150px;">
                    <col style="width: 150px;">
                    <col style="width: 80px;">
                  </colgroup>
                  <thead>
                    <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                      <th class="text-left p-3 font-medium">Название</th>
                      <th class="text-left p-3 font-medium">Адрес</th>
                      <th class="text-left p-3 font-medium">Регион</th>
                      <th class="text-left p-3 font-medium">Телефоны</th>
                      <th class="text-center p-3 font-medium">Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="item in substationsTableData" :key="item._id" class="border-t border-slate-100 dark:border-slate-700/60">
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="item.name">{{ item.name }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted truncate" :title="item.address">{{ item.address }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="item.region?.name || '—'">{{ item.region?.name || '—' }}</div>
                      </td>
                      <td class="p-3">
                        <div class="text-sm text-muted whitespace-nowrap truncate" :title="(item.phones || []).join(', ') || '—'">
                          <template v-if="item.phones && item.phones.length > 0">
                            {{ item.phones.length === 1 ? item.phones[0] : `${item.phones[0]} +${item.phones.length - 1}` }}
                          </template>
                          <span v-else>—</span>
                        </div>
                      </td>
                      <td class="p-3 text-center whitespace-nowrap">
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
                                  @click="onEdit(item)"
                                >
                                  <UIcon name="i-heroicons-pencil-square" class="w-4 h-4 text-slate-500" />
                                  <span>Редактировать</span>
                                </button>
                                <button
                                  type="button"
                                  class="w-full text-left flex items-center gap-2 px-3 py-3 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/40 cursor-pointer"
                                  @click="onDelete(item)"
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
              <div v-if="!pendingList && substationsTableData.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
                <div>
                  Пока нет подстанций
                </div>
              </div>
              <div v-if="pendingList" class="p-6"><USkeleton class="h-6 w-full" /></div>
              <div v-if="!pendingList && hasMoreSubstations" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="substationsShown += 10"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-down" class="me-1" />
                  Показать еще ({{ filteredItems.length - substationsShown }})
                </UButton>
              </div>
              <div v-if="!pendingList && !hasMoreSubstations && substationsShown > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
                <UButton 
                  variant="soft" 
                  color="neutral" 
                  @click="substationsShown = 10"
                  class="cursor-pointer"
                >
                  <UIcon name="i-heroicons-chevron-up" class="me-1" />
                  Свернуть все
                </UButton>
              </div>
            </div>
          </div>
        </div>

        <USlideover v-model:open="open" :title="isEdit ? 'Редактировать подстанцию' : 'Новая подстанция'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="form" @submit.prevent="onSubmit">
              <div class="space-y-3 w-full">
                <UFormField label="Название" required class="w-full">
                  <UInput v-model="form.name" placeholder="Например: Подстанция №1" class="w-full" size="xl" />
                </UFormField>
                <UFormField label="Адрес" required class="w-full">
                  <UInput v-model="form.address" placeholder="Город, улица, дом" class="w-full" size="xl" />
                </UFormField>
                <UFormField label="Регион" class="w-full">
                  <UInputMenu 
                    v-model="form.region" 
                    :items="regionOptions"
                    placeholder="Выберите регион (необязательно)"
                    size="xl"
                    value-key="value"
                    class="w-full"
                  />
                </UFormField>
                <UFormField label="Телефоны (через запятую)" class="w-full">
                  <UInput 
                    v-model="phonesInput" 
                    placeholder="+7 (495) 000-00-00, +7 (495) 111-11-11" 
                    class="w-full"
                    @input="formatPhonesInput"
                    size="xl"
                  />
                </UFormField>
                <p class="text-xs text-slate-500 dark:text-slate-400">Координаты определятся автоматически по адресу (Яндекс Геокодер).</p>
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

        <!-- Слайдер для добавления/редактирования региона -->
        <USlideover v-model:open="showRegionForm" :title="isEditRegion ? 'Редактировать регион' : 'Новый регион'" side="right" description="Заполните поля и сохраните" :ui="{ overlay: 'bg-slate-700/50' }">
          <template #body>
            <UForm :state="regionForm" @submit.prevent="onSubmitRegion">
              <div class="space-y-3 w-full">
                <UFormField label="Название региона" required class="w-full">
                  <UInput v-model="regionForm.name" placeholder="Например: Москва" class="w-full" size="xl" />
                </UFormField>

                <UFormField label="Руководитель" class="w-full">
                  <UInput v-model="regionForm.manager" placeholder="ФИО руководителя" class="w-full" size="xl" />
                </UFormField>

                <UFormField label="Округ" class="w-full">
                  <UInput v-model="regionForm.district" placeholder="Название округа" class="w-full" size="xl" />
                </UFormField>

                <UFormField label="Телефоны" class="w-full">
                  <div class="space-y-3">
                    <div v-for="(phone, index) in regionForm.phones" :key="index" class="flex gap-2">
                      <div class="flex-1">
                        <div class="relative" :ref="'phoneNameDropdownRef' + index">
                          <UInput
                            v-model="phone.name"
                            placeholder="Наименование телефона"
                            size="xl"
                            @input="onPhoneNameSearch(index)"
                            @focus="onPhoneNameFocus(index)"
                            @blur="onPhoneNameBlur(index)"
                          />
                          <div v-if="phoneNameDropdownOpen[index]" class="absolute z-50 mt-1 w-full rounded-md border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 shadow-xl max-h-48 overflow-auto">
                            <ul>
                              <li 
                                v-for="name in filteredPhoneNames[index]" 
                                :key="name" 
                                class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700"
                                @click="selectPhoneName(index, name)"
                              >
                                {{ name }}
                              </li>
                              <li v-if="filteredPhoneNames[index].length === 0" class="px-3 py-2 text-sm text-slate-500">
                                Ничего не найдено
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <div class="flex-1">
                        <UInput 
                          v-model="phone.number" 
                          placeholder="+7 (___) ___-__-__" 
                          type="tel"
                          size="xl"
                          @input="formatPhoneInput(index)"
                          @keydown="handlePhoneKeydown"
                        />
                      </div>
                      <UButton 
                        size="sm" 
                        color="error" 
                        variant="soft" 
                        @click="removePhone(index)"
                        :disabled="regionForm.phones.length <= 1"
                      >
                        <UIcon name="i-heroicons-trash" />
                      </UButton>
                    </div>
                    <UButton color="secondary" variant="soft" @click="addPhone" size="xl">
                      <UIcon name="i-heroicons-plus" class="mr-1" />
                      Добавить телефон
                    </UButton>
                  </div>
                </UFormField>
              </div>
            </UForm>
          </template>
          <template #footer>
            <div class="flex items-center justify-end gap-2 w-full">
              <UButton color="neutral" variant="ghost" type="button" @click="showRegionForm = false" class="cursor-pointer">Отмена</UButton>
              <UButton color="primary" :loading="pendingRegion" @click="onSubmitRegion" class="cursor-pointer">Сохранить</UButton>
            </div>
          </template>
        </USlideover>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
definePageMeta({ middleware: 'admin', layout: 'admin' })

const open = ref(false)
const isEdit = ref(false)
const currentId = ref<string | null>(null)
const form = reactive({ name: '', address: '', phones: [] as string[], region: null as string | null })
const phonesInput = ref('')
const pending = ref(false)
const pendingList = ref(false)

// Регионы
const showRegionForm = ref(false)
const isEditRegion = ref(false)
const currentRegionId = ref<string | null>(null)
const regions = ref<any[]>([])
const availablePhoneNames = ref<string[]>([])
const pendingRegion = ref(false)
const pendingRegions = ref(false)
const regionsSearch = ref('')
const phoneNameDropdownOpen = ref<Record<number, boolean>>({})
const filteredPhoneNames = ref<Record<number, string[]>>({})
const regionForm = reactive({
  name: '',
  manager: '',
  district: '',
  phones: [{ name: '', number: '' }]
})

// Поиск
const searchQuery = ref('')
const regionsShown = ref(10)
const substationsShown = ref(10)

const fetchOptions: any = { method: 'GET', credentials: 'include' }
if (process.server) {
  const headers = useRequestHeaders(['cookie'])
  fetchOptions.headers = { cookie: headers.cookie as string }
}
const { data, refresh, pending: fetching, error } = await useFetch<{ success: boolean; items: any[] }>('/api/substations', { ...fetchOptions, server: false })
const items = computed(() => data.value?.items || [])

// Фильтрация по поиску
const { matchesNormalized } = useTextNormalization()
const filteredItems = computed(() => {
  const allItems = items.value
  if (!searchQuery.value.trim()) return allItems
  
  const query = searchQuery.value.trim()
  return allItems.filter((item: any) => {
    const searchableText = [
      item.name,
      item.address,
      ...(item.phones || [])
    ].filter(Boolean).join(' ')
    
    return matchesNormalized(query, searchableText)
  })
})

const regionOptions = computed(() => {
  return regions.value.map(region => ({
    label: region.name,
    value: region._id
  }))
})

const filteredRegions = computed(() => {
  const allRegions = regions.value
  console.log('filteredRegions computed:', allRegions)
  if (!regionsSearch.value.trim()) return allRegions
  
  const query = regionsSearch.value.trim()
  return allRegions.filter((region: any) => {
    const searchableText = [
      region.name,
      region.manager,
      region.district,
      ...(region.phones || []).map((p: any) => `${p.name} ${p.number}`)
    ].filter(Boolean).join(' ')
    
    return matchesNormalized(query, searchableText)
  })
})

const regionsTableData = computed(() => {
  return filteredRegions.value.slice(0, regionsShown.value)
})

const hasMoreRegions = computed(() => {
  return filteredRegions.value.length > regionsShown.value
})

const substationsTableData = computed(() => {
  return filteredItems.value.slice(0, substationsShown.value)
})

const hasMoreSubstations = computed(() => {
  return filteredItems.value.length > substationsShown.value
})

watch([filteredRegions, regionsSearch], () => {
  regionsShown.value = 10
})

watch([filteredItems, searchQuery], () => {
  substationsShown.value = 10
})

watch(fetching, v => { pendingList.value = !!v })
onMounted(() => { 
  refresh()
  loadRegions()
})


const onAdd = () => {
  isEdit.value = false
  currentId.value = null
  form.name = ''
  form.address = ''
  form.phones = []
  form.region = null
  phonesInput.value = ''
  open.value = true
  // Загружаем регионы при открытии формы
  if (regions.value.length === 0) {
    loadRegions()
  }
}

const onEdit = (item: any) => {
  isEdit.value = true
  currentId.value = item._id
  form.name = item.name
  form.address = item.address
  form.phones = item.phones || []
  form.region = item.region?._id || null
  phonesInput.value = form.phones.join(', ')
  open.value = true
  // Загружаем регионы при открытии формы
  if (regions.value.length === 0) {
    loadRegions()
  }
}

const onSubmit = async () => {
  pending.value = true
  try {
    form.phones = phonesInput.value.split(',').map(s => s.trim()).filter(Boolean)
    let res: any
    if (isEdit.value && currentId.value) {
      res = await $fetch(`/api/substations/${currentId.value}`, { method: 'PATCH', body: form })
    } else {
      res = await $fetch('/api/substations', { method: 'POST', body: form })
    }
    if (res?.success) {
      await refresh()
      open.value = false
    }
  } finally {
    pending.value = false
  }
}

const onDelete = async (item: any) => {
  if (!confirm('Удалить подстанцию?')) return
  pendingList.value = true
  try {
    const res: any = await $fetch(`/api/substations/${item._id}`, { method: 'DELETE' })
    if (res?.success) await refresh()
  } finally {
    pendingList.value = false
  }
}

// Функции для работы с регионами
const loadRegions = async () => {
  pendingRegions.value = true
  try {
    console.log('Загружаем регионы...')
    const res: any = await $fetch('/api/admin/regions', {
      credentials: 'include'
    })
    console.log('Ответ API регионов:', res)
    if (res?.success) {
      regions.value = res.regions || []
      availablePhoneNames.value = res.phoneNames || []
      console.log('Регионы загружены:', regions.value.length)
      console.log('Доступные названия телефонов:', availablePhoneNames.value)
    }
  } catch (error) {
    console.error('Ошибка загрузки регионов:', error)
  } finally {
    pendingRegions.value = false
  }
}

const onAddRegion = () => {
  isEditRegion.value = false
  currentRegionId.value = null
  regionForm.name = ''
  regionForm.manager = ''
  regionForm.district = ''
  regionForm.phones = [{ name: '', number: '' }]
  showRegionForm.value = true
  // Всегда загружаем данные при открытии формы
  loadRegions()
}

const onEditRegion = (region: any) => {
  isEditRegion.value = true
  currentRegionId.value = region._id
  regionForm.name = region.name
  regionForm.manager = region.manager || ''
  regionForm.district = region.district || ''
  regionForm.phones = region.phones && region.phones.length > 0 
    ? region.phones.map((p: any) => ({ name: p.name, number: p.number }))
    : [{ name: '', number: '' }]
  showRegionForm.value = true
}

const onDeleteRegion = async (region: any) => {
  if (!confirm(`Удалить регион "${region.name}"?`)) return
  pendingRegions.value = true
  try {
    const res: any = await $fetch(`/api/admin/regions/${region._id}`, { 
      method: 'DELETE',
      credentials: 'include'
    })
    if (res?.success) {
      await loadRegions()
    }
  } catch (error) {
    console.error('Ошибка удаления региона:', error)
  } finally {
    pendingRegions.value = false
  }
}

const addPhone = () => {
  regionForm.phones.push({ name: '', number: '' })
}

const removePhone = (index: number) => {
  if (regionForm.phones.length > 1) {
    regionForm.phones.splice(index, 1)
  }
}

const onCreatePhoneName = (name: string) => {
  if (name && !availablePhoneNames.value.includes(name)) {
    availablePhoneNames.value.push(name)
  }
}

// Функции для работы с выпадающим списком названий телефонов
const onPhoneNameSearch = (index: number) => {
  const query = regionForm.phones[index].name.toLowerCase()
  filteredPhoneNames.value[index] = availablePhoneNames.value.filter(name => 
    name.toLowerCase().includes(query)
  )
  phoneNameDropdownOpen.value[index] = true
}

const onPhoneNameFocus = (index: number) => {
  filteredPhoneNames.value[index] = availablePhoneNames.value
  phoneNameDropdownOpen.value[index] = true
}

const onPhoneNameBlur = (index: number) => {
  // Задержка для возможности клика по элементу списка
  setTimeout(() => {
    phoneNameDropdownOpen.value[index] = false
  }, 200)
}

const selectPhoneName = (index: number, name: string) => {
  regionForm.phones[index].name = name
  phoneNameDropdownOpen.value[index] = false
}


// Функция для форматирования телефона в регионах
const formatPhoneInput = (index: number) => {
  let value = regionForm.phones[index].number.replace(/\D/g, '') // Убираем все нецифровые символы
  
  // Если номер начинается с 8, заменяем на 7
  if (value.startsWith('8')) {
    value = '7' + value.slice(1)
  }
  
  // Если номер не начинается с 7, добавляем 7
  if (value && !value.startsWith('7')) {
    value = '7' + value
  }
  
  // Ограничиваем длину до 11 цифр
  if (value.length > 11) {
    value = value.slice(0, 11)
  }
  
  // Форматируем в маску +7 (***) ***-**-**
  let formatted = ''
  if (value.length > 0) {
    formatted = '+7 '
    if (value.length > 1) {
      formatted += '(' + value.slice(1, 4)
      if (value.length > 4) {
        formatted += ') ' + value.slice(4, 7)
        if (value.length > 7) {
          formatted += '-' + value.slice(7, 9)
          if (value.length > 9) {
            formatted += '-' + value.slice(9, 11)
          }
        }
      } else {
        formatted += ')'
      }
    }
  }
  
  regionForm.phones[index].number = formatted
}

const handlePhoneKeydown = (event: KeyboardEvent) => {
  // Разрешаем: Backspace, Delete, Tab, Escape, Enter, стрелки
  if ([8, 9, 27, 13, 46, 37, 38, 39, 40].indexOf(event.keyCode) !== -1 ||
      // Разрешаем Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
      (event.keyCode === 65 && event.ctrlKey === true) ||
      (event.keyCode === 67 && event.ctrlKey === true) ||
      (event.keyCode === 86 && event.ctrlKey === true) ||
      (event.keyCode === 88 && event.ctrlKey === true)) {
    return
  }
  
  // Разрешаем только цифры
  if ((event.shiftKey || (event.keyCode < 48 || event.keyCode > 57)) && (event.keyCode < 96 || event.keyCode > 105)) {
    event.preventDefault()
  }
}

// Функция для форматирования телефонов в форме подстанций
const formatPhonesInput = () => {
  // Разбиваем на отдельные номера по запятым
  const phones = phonesInput.value.split(',').map(phone => phone.trim())
  
  const formattedPhones = phones.map(phone => {
    if (!phone) return phone
    
    // Убираем все нецифровые символы кроме запятых
    let digits = phone.replace(/\D/g, '')
    
    // Если номер начинается с 8, заменяем на 7
    if (digits.startsWith('8')) {
      digits = '7' + digits.slice(1)
    }
    
    // Если номер не начинается с 7, добавляем 7
    if (digits && !digits.startsWith('7')) {
      digits = '7' + digits
    }
    
    // Ограничиваем длину до 11 цифр
    if (digits.length > 11) {
      digits = digits.slice(0, 11)
    }
    
    // Форматируем в маску +7 (***) ***-**-**
    let formatted = ''
    if (digits.length > 0) {
      formatted = '+7 '
      if (digits.length > 1) {
        formatted += '(' + digits.slice(1, 4)
        if (digits.length > 4) {
          formatted += ') ' + digits.slice(4, 7)
          if (digits.length > 7) {
            formatted += '-' + digits.slice(7, 9)
            if (digits.length > 9) {
              formatted += '-' + digits.slice(9, 11)
            }
          }
        } else {
          formatted += ')'
        }
      }
    }
    
    return formatted
  })
  
  phonesInput.value = formattedPhones.join(', ')
}


const onSubmitRegion = async () => {
  pendingRegion.value = true
  try {
    const phones = regionForm.phones.filter(p => p.name && p.number)
    const data = {
      name: regionForm.name,
      manager: regionForm.manager,
      district: regionForm.district,
      phones
    }
    
    let res: any
    if (isEditRegion.value && currentRegionId.value) {
      res = await $fetch(`/api/admin/regions/${currentRegionId.value}`, { 
        method: 'PATCH', 
        body: data,
        credentials: 'include'
      })
    } else {
      res = await $fetch('/api/admin/regions', { 
        method: 'POST', 
        body: data,
        credentials: 'include'
      })
    }
    
    if (res?.success) {
      await loadRegions()
      showRegionForm.value = false
    }
  } catch (error) {
    console.error('Ошибка сохранения региона:', error)
  } finally {
    pendingRegion.value = false
  }
}

</script>


