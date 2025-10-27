<template>
  <BottomSheet 
    :model-value="modelValue" 
    @update:model-value="updateModelValue"
    @close="close"
    title="Подключение Telegram"
    subtitle="Введите код, отправленный в Telegram"
  >
    <div class="p-4 pb-6 space-y-6">
      <div>
        <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
          Код авторизации (6 цифр)
        </label>
        <div class="flex justify-center">
          <UPinInput
            v-model="code"
            :length="6"
            type="number"
            size="xl"
            placeholder=""
            :disabled="loading"
            autofocus
            class="[&_input]:text-center [&_input]:text-2xl [&_input]:font-semibold [&_input]:tracking-widest"
            @complete="onSubmit"
          />
        </div>
      </div>

      <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900 p-4">
        <div class="text-sm text-red-700 dark:text-red-300">
          {{ error }}
        </div>
      </div>

      <div>
        <button
          @click="onSubmit"
          :disabled="code.length !== 6 || loading"
          :class="[
            'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200',
            code.length === 6 && !loading 
              ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500' 
              : 'bg-indigo-400 cursor-not-allowed'
          ]"
        >
          <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
            <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </span>
          {{ loading ? 'Проверка...' : 'Подключить' }}
        </button>
      </div>
    </div>
  </BottomSheet>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  telegramId: string
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const code = ref<string[]>([])
const loading = ref(false)
const error = ref('')

const updateModelValue = (value: boolean) => {
  emit('update:modelValue', value)
}

const close = () => {
  code.value = []
  error.value = ''
  loading.value = false
  emit('update:modelValue', false)
}

const onSubmit = async () => {
  loading.value = true
  error.value = ''

  try {
    const codeString = code.value.join('')
    
    if (codeString.length !== 6) {
      error.value = 'Введите полный код (6 цифр)'
      loading.value = false
      return
    }
    
    // Проверяем код через специальный эндпоинт для подключения
    const result: any = await $fetch('/api/auth/verify-telegram-connect-code', {
      method: 'POST',
      body: {
        code: codeString
      }
    })
    
    if (result.success) {
      emit('success')
      close()
    } else {
      error.value = result.message || 'Неверный код'
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Ошибка при подключении'
  } finally {
    loading.value = false
  }
}

// Сброс формы при открытии
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    code.value = []
    error.value = ''
    loading.value = false
  }
})
</script>

