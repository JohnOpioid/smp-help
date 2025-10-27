<template>
  <div class="flex-1">
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="text-2xl font-bold mb-6">Загрузка калькуляторов</h1>
      
      <div v-if="loading" class="text-center py-8">
        <p class="text-slate-600 dark:text-slate-300">Загрузка...</p>
      </div>
      
      <div v-else-if="result" :class="[
        'p-6 rounded-lg mb-6',
        result.success ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
      ]">
        <h2 :class="[
          'text-xl font-semibold mb-2',
          result.success ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
        ]">
          {{ result.success ? '✅ Успешно' : '❌ Ошибка' }}
        </h2>
        <p class="text-slate-700 dark:text-slate-300">
          {{ result.message || result.error }}
        </p>
        <p v-if="result.count" class="text-sm text-slate-600 dark:text-slate-400 mt-2">
          Загружено калькуляторов: {{ result.count }}
        </p>
      </div>
      
      <UButton 
        @click="loadCalculators" 
        :loading="loading"
        color="primary"
        size="lg"
        block
      >
        Загрузить калькуляторы в базу данных
      </UButton>
      
      <div class="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <h3 class="font-semibold mb-2">Что будет загружено:</h3>
        <ul class="space-y-1 text-sm text-slate-700 dark:text-slate-300">
          <li>• Шкала комы Глазго (GCS)</li>
          <li>• Шкала FOUR</li>
          <li>• Шкала RASS</li>
          <li>• Шкала ШОКС</li>
          <li>• Шкала NEWS</li>
          <li>• Интенсивность боли (ВАШ)</li>
          <li>• Шкала LAMS</li>
          <li>• Шкала оценки вероятности ТЭЛА</li>
          <li>• Калькулятор срока беременности</li>
          <li>• Физиологические возрастные нормы</li>
          <li>• Детская шкала Глазго</li>
          <li>• Шкала Апгар</li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ middleware: 'admin', headerTitle: 'Загрузка калькуляторов' })

const loading = ref(false)
const result = ref<any>(null)

async function loadCalculators() {
  loading.value = true
  result.value = null
  
  try {
    const response = await $fetch('/api/calculators/seed', {
      method: 'POST'
    })
    
    result.value = response
    
    if (response.success) {
      const toast = useToast?.()
      toast?.add?.({
        title: 'Калькуляторы успешно загружены',
        color: 'green',
        timeout: 3000
      })
    }
  } catch (error: any) {
    result.value = {
      success: false,
      error: error.message || 'Произошла ошибка'
    }
    
    const toast = useToast?.()
    toast?.add?.({
      title: 'Ошибка загрузки',
      description: error.message,
      color: 'red',
      timeout: 5000
    })
  } finally {
    loading.value = false
  }
}
</script>

