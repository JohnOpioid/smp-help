<template>
  <div class="flex-1">
  <div class="max-w-5xl mx-auto px-2 md:px-4 py-8">
          
      
      <!-- Статистика -->
      <div v-if="stats" class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">Всего файлов</div>
          <div class="text-2xl font-bold text-slate-900 dark:text-white">{{ stats.totalFiles }}</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">В базе данных</div>
          <div class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ stats.inDatabase }}</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">Не в базе</div>
          <div class="text-2xl font-bold text-amber-600 dark:text-amber-400">{{ stats.notInDatabase }}</div>
        </div>
        <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <div class="text-sm text-slate-600 dark:text-slate-400 mb-1">Всего в БД</div>
          <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats.totalInDB }}</div>
        </div>
      </div>

      <!-- Таблица калькуляторов -->
      <div class="mb-8">
        <div class="bg-white dark:bg-slate-800 rounded-lg">
          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <h3 class="text-lg font-semibold text-slate-900 dark:text-white">Калькуляторы</h3>
            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Управление калькуляторами</p>
          </div>

          <div class="px-4 py-3 border-b border-slate-100 dark:border-slate-700">
            <UInput 
              v-model="searchQuery" 
              placeholder="Поиск по названию файла, URL или категории..." 
              size="lg"
              class="w-full"
            >
              <template #leading>
                <UIcon name="i-heroicons-magnifying-glass" />
              </template>
            </UInput>
          </div>

          <div class="relative">
            <div v-if="loading" class="p-6"><USkeleton class="h-6 w-full" /></div>
            <div v-else-if="calcTableData.length === 0" class="p-6 text-sm text-slate-500 dark:text-slate-400">
              <div>
                Калькуляторы не найдены
              </div>
            </div>
            <div v-else class="overflow-x-auto">
              <table class="w-full table-fixed min-w-[800px]">
                <colgroup>
                  <col style="width: auto;">
                  <col style="width: 200px;">
                  <col style="width: 150px;">
                  <col style="width: 120px;">
                  <col style="width: 100px;">
                  <col style="width: 80px;">
                </colgroup>
                <thead>
                  <tr class="text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-900/30">
                    <th class="text-left p-3 font-medium">Название</th>
                    <th class="text-left p-3 font-medium">URL</th>
                    <th class="text-left p-3 font-medium">Категория</th>
                    <th class="text-left p-3 font-medium">Статус</th>
                    <th class="text-left p-3 font-medium"></th>
                    <th class="text-center p-3 font-medium">Действия</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="calc in calcTableData" :key="calc.fileName" class="border-t border-slate-100 dark:border-slate-700/60">
                    <td class="p-3">
                      <div class="text-sm text-muted truncate" :title="calc.fileName">{{ calc.fileName }}</div>
                      <div v-if="calc.dbData?.name" class="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate" :title="calc.dbData.name">{{ calc.dbData.name }}</div>
                    </td>
                    <td class="p-3">
                      <div class="text-sm text-muted whitespace-nowrap truncate font-mono" :title="calc.url">{{ calc.url }}</div>
                    </td>
                    <td class="p-3">
                      <div class="text-sm text-muted whitespace-nowrap truncate" :title="calc.dbData?.category || '—'">{{ calc.dbData?.category || '—' }}</div>
                    </td>
                    <td class="p-3">
                      <span
                        :class="[
                          'px-2 py-0.5 text-xs font-medium rounded',
                          calc.inDatabase 
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        ]"
                      >
                        {{ calc.inDatabase ? 'В базе' : 'Не в базе' }}
                      </span>
                    </td>
                    <td class="p-3">
                      <UButton
                        v-if="!calc.inDatabase"
                        @click="addCalculator(calc.fileName)"
                        :loading="adding[calc.fileName]"
                        color="primary"
                        size="sm"
                        class="cursor-pointer"
                      >
                        Добавить
                      </UButton>
                    </td>
                    <td class="p-3 text-center whitespace-nowrap">
                      <span class="text-sm text-muted">—</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-if="!loading && hasMoreCalc" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <UButton 
                variant="soft" 
                color="neutral" 
                @click="calcShown += 10"
                class="cursor-pointer"
              >
                <UIcon name="i-heroicons-chevron-down" class="me-1" />
                Показать еще ({{ filteredCalculators.length - calcShown }})
              </UButton>
            </div>
            <div v-if="!loading && !hasMoreCalc && calcShown > 10" class="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center">
              <UButton 
                variant="soft" 
                color="neutral" 
                @click="calcShown = 10"
                class="cursor-pointer"
              >
                <UIcon name="i-heroicons-chevron-up" class="me-1" />
                Свернуть все
              </UButton>
            </div>
          </div>
        </div>
      </div>

      <!-- Результат операции -->
      <div
        v-if="operationResult"
        :class="[
          'p-4 rounded-lg mt-6',
          operationResult.success
            ? 'bg-emerald-50 dark:bg-emerald-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        ]"
      >
        <h3
          :class="[
            'font-semibold mb-2',
            operationResult.success
              ? 'text-emerald-700 dark:text-emerald-300'
              : 'text-red-700 dark:text-red-300'
          ]"
        >
          {{ operationResult.success ? '✅ Успешно' : '❌ Ошибка' }}
        </h3>
        <p class="text-slate-700 dark:text-slate-300">{{ operationResult.message }}</p>
        <div v-if="operationResult.stats" class="mt-2 text-sm text-slate-600 dark:text-slate-400">
          <div>Добавлено: {{ operationResult.stats.success }}</div>
          <div>Ошибок: {{ operationResult.stats.failed }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', layout: 'admin', headerTitle: 'Управление калькуляторами' })

const loading = ref(false)
const calculators = ref<any[]>([])
const stats = ref<any>(null)
const adding = ref<Record<string, boolean>>({})
const operationResult = ref<any>(null)
const searchQuery = ref('')
const calcShown = ref(10)

const filteredCalculators = computed(() => {
  if (!searchQuery.value.trim()) {
    return calculators.value
  }
  const query = searchQuery.value.toLowerCase().trim()
  return calculators.value.filter((calc: any) => {
    const searchableText = [
      calc.fileName,
      calc.url,
      calc.dbData?.name,
      calc.dbData?.category
    ].filter(Boolean).join(' ').toLowerCase()
    
    return searchableText.includes(query)
  })
})

const calcTableData = computed(() => {
  return filteredCalculators.value.slice(0, calcShown.value)
})

const hasMoreCalc = computed(() => {
  return filteredCalculators.value.length > calcShown.value
})

watch([filteredCalculators, searchQuery], () => {
  calcShown.value = 10
})

async function loadCalculators() {
  loading.value = true
  try {
    const response = await $fetch('/api/calculators/list')
    if (response.success) {
      calculators.value = response.calculators
      stats.value = response.stats
    }
  } catch (error: any) {
    console.error('Error loading calculators:', error)
    const toast = useToast?.()
    toast?.add?.({
      title: 'Ошибка загрузки',
      description: error.message,
      color: 'error'
    })
  } finally {
    loading.value = false
  }
}

async function addCalculator(calcId: string) {
  adding.value[calcId] = true
  operationResult.value = null

  try {
    const response = await $fetch('/api/calculators/add', {
      method: 'POST',
      body: {
        calculators: [calcId]
      }
    })

    operationResult.value = response

    if (response.success) {
      const toast = useToast?.()
      toast?.add?.({
        title: 'Калькулятор добавлен',
        color: 'success'
      })

      // Обновляем список
      await loadCalculators()
    }
  } catch (error: any) {
    console.error('Error adding calculator:', error)
    operationResult.value = {
      success: false,
      message: error.message
    }
    
    const toast = useToast?.()
    toast?.add?.({
      title: 'Ошибка добавления',
      description: error.message,
      color: 'error'
    })
  } finally {
    adding.value[calcId] = false
  }
}

onMounted(() => {
  loadCalculators()
})
</script>
