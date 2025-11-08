<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Авторизация через Telegram
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Введите код, отправленный в Telegram
        </p>
      </div>
      
      <div class="mt-8 bg-white dark:bg-slate-800 py-4 px-4 shadow rounded-lg transition-colors duration-300">
        <form @submit.prevent="onSubmit" class="space-y-6">
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

          <div v-if="success" class="rounded-md bg-green-50 dark:bg-green-900 p-4">
            <div class="text-sm text-green-700 dark:text-green-300">
              {{ success }}
            </div>
          </div>

          <div>
            <button
              type="submit"
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
              {{ loading ? 'Проверка...' : 'Войти' }}
            </button>
          </div>
        </form>

        <div class="mt-6 text-center">
          <NuxtLink 
            to="/auth/login" 
            class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            Вернуться к входу
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: 'guest'
})

const telegramId = ref('')
const code = ref<string[]>([])
const loading = ref(false)
const error = ref('')
const success = ref('')

const route = useRoute()
onMounted(async () => {
  // Получаем telegramId из query
  const telegramIdParam = route.query.telegramId
  if (typeof telegramIdParam === 'string') {
    telegramId.value = telegramIdParam
  } else if (telegramIdParam) {
    telegramId.value = String(telegramIdParam)
  }
  
  // Получаем код из query (если есть)
  const codeParam = route.query.code
  if (typeof codeParam === 'string' && codeParam.length === 6) {
    // Заполняем код автоматически, если он передан в URL
    // UPinInput ожидает массив строк
    code.value = codeParam.split('') as string[]
  }
  
  // Помечаем код как использованный в pending кодах после успешной навигации
  if (telegramId.value && codeParam) {
    try {
      await $fetch('/api/auth/mark-telegram-code-used', {
        method: 'POST',
        body: {
          telegramId: telegramId.value,
          code: codeParam
        }
      })
    } catch (e) {
      // Игнорируем ошибки - это не критично
      console.warn('Не удалось пометить код как использованный:', e)
    }
  }
})

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const codeString = code.value.join('')
    
    if (codeString.length !== 6) {
      error.value = 'Введите полный код (6 цифр)'
      loading.value = false
      return
    }
    
    // Теперь код работает и без telegramId - проверяем только по коду
    const result: any = await $fetch('/api/auth/telegram-verify-code', {
      method: 'POST',
      body: {
        ...(telegramId.value ? { telegramId: telegramId.value } : {}),
        code: codeString
      }
    })
    
    if (result.success) {
      success.value = 'Авторизация успешна!'
      await new Promise(resolve => setTimeout(resolve, 1000))
      await navigateTo('/')
    } else {
      error.value = result.message
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Неверный код'
  } finally {
    loading.value = false
  }
}
</script>
