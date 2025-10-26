<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Сброс пароля
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Введите новый пароль
        </p>
      </div>
      
      <div class="mt-8 bg-white dark:bg-slate-800 py-4 px-4 shadow rounded-lg transition-colors duration-300">
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Новый пароль
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                minlength="6"
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Введите новый пароль (минимум 6 символов)"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Подтвердите пароль
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                minlength="6"
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Подтвердите новый пароль"
                :disabled="loading"
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
              :disabled="!isFormValid || loading"
              :class="[
                'group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors duration-200',
                isFormValid && !loading 
                  ? 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer' 
                  : 'bg-indigo-400 cursor-not-allowed'
              ]"
            >
              <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ loading ? 'Сброс пароля...' : 'Сбросить пароль' }}
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

const route = useRoute()

const form = reactive({
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

// Проверяем наличие токена в URL
const token = computed(() => route.query.token as string)

const isFormValid = computed(() => {
  return form.password.trim().length >= 6 && 
         form.confirmPassword.trim().length >= 6 &&
         form.password === form.confirmPassword &&
         !!token.value
})

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  // Валидация
  if (form.password.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов'
    loading.value = false
    return
  }

  if (form.password !== form.confirmPassword) {
    error.value = 'Пароли не совпадают'
    loading.value = false
    return
  }

  if (!token.value) {
    error.value = 'Токен для сброса пароля отсутствует'
    loading.value = false
    return
  }

  try {
    const result: any = await $fetch('/api/auth/reset-password', {
      method: 'POST',
      body: {
        token: token.value,
        password: form.password
      }
    })
    
    if (result.success) {
      success.value = result.message
      
      // Редирект на страницу логина через 2 секунды
      setTimeout(() => {
        navigateTo('/auth/login')
      }, 2000)
    } else {
      error.value = result.message
    }
  } catch (err: any) {
    error.value = err.data?.message || 'Произошла ошибка при сбросе пароля'
  } finally {
    loading.value = false
  }
}
</script>
