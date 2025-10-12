<template>
  <div>
    <main class="flex-1">
      <div class="max-w-5xl mx-auto px-0 md:px-4 py-8">
        <AdminSubnav title="Подстанции" />

        <!-- Секция регионов -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Регионы ({{ regions.length }})</h3>
            <UButton color="primary" @click="onAddRegion" class="cursor-pointer">Добавить регион</UButton>
          </div>

          <!-- Поиск по регионам -->
          <div class="mb-4">
            <UInput 
              v-model="regionsSearch" 
              placeholder="Поиск по названию региона..." 
              size="xl"
              class="w-full"
              :input-class="'px-4 py-3'"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>
          
          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg overflow-hidden">
            <UTable :data="filteredRegions" :columns="regionColumns" :loading="pendingRegions" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">Регионы не добавлены. Добавьте первый регион.</div>
              </template>
            </UTable>
          </div>
        </div>

        <!-- Секция подстанций -->
        <div class="mb-8">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Подстанции ({{ total }})</h3>
            <UButton color="primary" @click="onAdd" class="cursor-pointer">Добавить подстанцию</UButton>
          </div>

          <!-- Поиск -->
          <div class="mb-4">
            <UInput 
              v-model="searchQuery" 
              placeholder="Поиск по названию, адресу или телефону..." 
              size="xl"
              class="w-full"
              :input-class="'px-4 py-3'"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="bg-white dark:bg-slate-800 border-y border-slate-100 dark:border-slate-600 md:border md:rounded-lg overflow-hidden">
            <UTable :data="paginatedItems" :columns="columns" :loading="pendingList" sticky="header" class="w-full">
              <template #empty>
                <div class="p-6 text-sm text-slate-600 dark:text-slate-300">Нет данных. Добавьте подстанцию.</div>
              </template>
            </UTable>
            
            <!-- Пагинация -->
            <div v-if="totalPages > 1" class="px-4 py-3 border-t border-slate-100 dark:border-slate-600">
              <div class="flex items-center justify-between">
                <div class="text-sm text-slate-600 dark:text-slate-400">
                  Страница {{ page }} из {{ totalPages }} ({{ total }} записей)
                </div>
                <div class="flex items-center gap-2">
                  <UButton 
                    :disabled="page <= 1" 
                    @click="page = 1" 
                    size="sm" 
                    variant="ghost"
                  >
                    Первая
                  </UButton>
                  <UButton 
                    :disabled="page <= 1" 
                    @click="page = page - 1" 
                    size="sm" 
                    variant="ghost"
                  >
                    Предыдущая
                  </UButton>
                  <div class="flex items-center gap-1">
                    <template v-for="pageNum in visiblePages" :key="pageNum">
                      <UButton 
                        v-if="pageNum !== '...'" 
                        :variant="pageNum === page ? 'solid' : 'ghost'" 
                        :color="pageNum === page ? 'primary' : 'neutral'" 
                        @click="page = pageNum as number" 
                        size="sm"
                      >
                        {{ pageNum }}
                      </UButton>
                      <span v-else class="px-2 text-slate-400">...</span>
                    </template>
                  </div>
                  <UButton 
                    :disabled="page >= totalPages" 
                    @click="page = page + 1" 
                    size="sm" 
                    variant="ghost"
                  >
                    Следующая
                  </UButton>
                  <UButton 
                    :disabled="page >= totalPages" 
                    @click="page = totalPages" 
                    size="sm" 
                    variant="ghost"
                  >
                    Последняя
                  </UButton>
                </div>
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
                                class="px-3 py-2 text-sm cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700"
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
import { ref, reactive, computed, watch, h, resolveComponent, nextTick } from 'vue'
definePageMeta({ middleware: 'admin' })

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

// Пагинация
const page = ref(1)
const perPage = 15
const total = ref(0)

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

const paginatedItems = computed(() => {
  const start = (page.value - 1) * perPage
  const end = start + perPage
  const result = filteredItems.value.slice(start, end)
  console.log('Пагинация:', { 
    page: page.value, 
    perPage, 
    start, 
    end, 
    totalItems: filteredItems.value.length,
    resultLength: result.length 
  })
  return result
})
const totalPages = computed(() => {
  const pages = Math.ceil(filteredItems.value.length / perPage)
  console.log('Общее количество страниц:', pages)
  return pages
})

const visiblePages = computed(() => {
  const current = page.value
  const total = totalPages.value
  const delta = 2
  
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1)
  }
  
  const pages: any[] = [1]
  if (current > delta + 3) pages.push('...')
  
  for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
    pages.push(i)
  }
  
  if (current < total - delta - 2) pages.push('...')
  if (total > 1) pages.push(total)
  
  return pages
})

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
  loadRegions()
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

const regionColumns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'manager', header: 'Руководитель' },
  { accessorKey: 'district', header: 'Округ' },
  { 
    accessorKey: 'phones', 
    header: 'Телефоны', 
    cell: ({ row }: { row: any }) => {
      const phones = row.original.phones || []
      if (phones.length === 0) return 'Не указаны'
      return phones.map((p: any) => `${p.name}: ${p.number}`).join(', ')
    }
  },
  {
    id: 'actions', header: 'Действия',
    cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center gap-2' }, [
      h(resolveComponent('UButton'), { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEditRegion(row.original) }, () => 'Редактировать'),
      h(resolveComponent('UButton'), { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDeleteRegion(row.original) }, () => 'Удалить')
    ])
  }
]

const columns = [
  { accessorKey: 'name', header: 'Название' },
  { accessorKey: 'address', header: 'Адрес' },
  { accessorKey: 'region', header: 'Регион', cell: ({ row }: { row: any }) => row.original.region?.name || '-' },
  { 
    accessorKey: 'phones', 
    header: 'Телефоны', 
    cell: ({ row }: { row: any }) => {
      const phones = row.original.phones || []
      if (phones.length === 0) return ''
      if (phones.length === 1) return phones[0]
      return `${phones[0]} +${phones.length - 1}`
    }
  },
  {
    id: 'actions', header: 'Действия',
    cell: ({ row }: { row: any }) => h('div', { class: 'flex items-center gap-2' }, [
      h(resolveComponent('UButton'), { size: 'xs', color: 'neutral', variant: 'soft', onClick: () => onEdit(row.original) }, () => 'Редактировать'),
      h(resolveComponent('UButton'), { size: 'xs', color: 'error', variant: 'soft', onClick: () => onDelete(row.original) }, () => 'Удалить')
    ])
  }
]

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


