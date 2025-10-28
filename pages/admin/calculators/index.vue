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

      <!-- Список калькуляторов -->
      <div v-if="loading" class="text-center py-12">
        <p class="text-slate-600 dark:text-slate-300">Загрузка...</p>
      </div>

      <div v-else-if="calculators.length === 0" class="text-center py-12">
        <p class="text-slate-600 dark:text-slate-300">Калькуляторы не найдены</p>
      </div>

      <div v-else class="space-y-4">
        <div
          v-for="calc in calculators"
          :key="calc.fileName"
          class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <h3 class="font-semibold text-slate-900 dark:text-white">{{ calc.fileName }}</h3>
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
              </div>
              <div class="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                <div class="font-mono">URL: {{ calc.url }}</div>
                <div v-if="calc.dbData">
                  <div>Название: {{ calc.dbData.name }}</div>
                  <div>Категория: {{ calc.dbData.category }}</div>
                </div>
              </div>
            </div>
            <UButton
              v-if="!calc.inDatabase"
              @click="addCalculator(calc.fileName)"
              :loading="adding[calc.fileName]"
              color="primary"
              size="sm"
            >
              Добавить
            </UButton>
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
