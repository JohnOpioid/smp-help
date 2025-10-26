<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Восстановление пароля
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Введите email для получения ссылки на восстановление
        </p>
      </div>
      
      <div class="mt-8 bg-white dark:bg-slate-800 py-4 px-4 shadow rounded-lg transition-colors duration-300">
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div class="mt-1 relative">
              <input
                id="email"
                v-model="email"
                name="email"
                type="email"
                autocomplete="email"
                required
                :class="[
                  'appearance-none block w-full px-3 py-2 border rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200',
                  emailExists === true ? 'border-green-500 focus:ring-green-500 focus:border-green-500' : 
                  emailExists === false ? 'border-red-500 focus:ring-red-500 focus:border-red-500' :
                  'border-slate-300 dark:border-slate-600 focus:ring-indigo-500 focus:border-indigo-500'
                ]"
                placeholder="Введите ваш email"
                :disabled="loading"
              />
              <div v-if="checking" class="absolute right-3 top-2.5">
                <svg class="animate-spin h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
              <div v-else-if="emailExists === true" class="absolute right-3 top-2.5">
                <svg class="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <div v-else-if="emailExists === false" class="absolute right-3 top-2.5">
                <svg class="h-5 w-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            </div>
            <p v-if="emailExists === false" class="mt-1 text-sm text-red-600 dark:text-red-400">
              Email не найден в системе
            </p>
          </div>

          <div v-if="error" class="rounded-md bg-red-50 dark:bg-red-900 p-4">
            <div class="text-sm text-red-700 dark:text-red-300">
              {{ error }}
            </div>
          </div>

          <div v-if="success" class="rounded-md bg-green-50 dark:bg-green-900 p-4">
            <div class="text-sm text-green-700 dark:text-green-300 mb-3">
              {{ success }}
            </div>
            <div class="text-xs text-green-600 dark:text-green-400">
              💡 Для dev-сервера: код виден в консоли сервера
            </div>
          </div>

          <div>
            <button
              type="submit"
              :disabled="!email.trim() || loading || checking || emailExists === false"
              :class="[
                'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200',
                email.trim() && !loading && !checking && emailExists !== false 
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer' 
                  : 'bg-indigo-400 cursor-not-allowed'
              ]"
            >
              <span v-if="loading || checking" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ loading ? 'Отправка...' : checking ? 'Проверка...' : 'Отправить' }}
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

const email = ref('')
const loading = ref(false)
const error = ref('')
const success = ref('')
const checking = ref(false)
const emailExists = ref<boolean | null>(null)
let checkTimeout: NodeJS.Timeout | null = null

const checkEmail = async () => {
  if (!email.value.trim()) {
    emailExists.value = null
    return
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value.trim())) {
    emailExists.value = null
    return
  }

  checking.value = true
  try {
    const result: any = await $fetch('/api/auth/check-email', {
      method: 'POST',
      body: {
        email: email.value.trim()
      }
    })
    emailExists.value = result.exists
  } catch (err) {
    emailExists.value = null
  } finally {
    checking.value = false
  }
}

watch(email, () => {
  if (checkTimeout) {
    clearTimeout(checkTimeout)
  }
  checkTimeout = setTimeout(() => {
    checkEmail()
  }, 500)
})

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result: any = await $fetch('/api/auth/forgot-password', {
      method: 'POST',
      body: {
        email: email.value.trim()
      }
    })
    
    if (result.success) {
      success.value = result.message
      
      // Автоматический переход на страницу ввода кода через 2 секунды
      setTimeout(async () => {
        await navigateTo(`/auth/verify-code?email=${encodeURIComponent(email.value.trim())}`)
      }, 2000)
    } else {
      error.value = result.message
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Произошла ошибка при отправке запроса'
  } finally {
    loading.value = false
  }
}
</script>
