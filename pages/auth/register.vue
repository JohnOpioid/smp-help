<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Регистрация
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Создайте аккаунт в справочнике СМП
        </p>
      </div>
      
      <div class="mt-8 bg-white dark:bg-slate-800 py-8 px-4 shadow sm:rounded-lg sm:px-10 transition-colors duration-300">
        <form @submit.prevent="onSubmit" class="space-y-6">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label for="firstName" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Имя
              </label>
              <div class="mt-1">
                <input
                  id="firstName"
                  v-model="form.firstName"
                  name="firstName"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  placeholder="Введите имя"
                  :disabled="loading"
                />
              </div>
            </div>

            <div>
              <label for="lastName" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Фамилия
              </label>
              <div class="mt-1">
                <input
                  id="lastName"
                  v-model="form.lastName"
                  name="lastName"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                  placeholder="Введите фамилию"
                  :disabled="loading"
                />
              </div>
            </div>
          </div>

          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div class="mt-1">
              <input
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Введите ваш email"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Пароль
            </label>
            <div class="mt-1">
              <input
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="new-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Минимум 6 символов"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <label for="confirmPassword" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Подтверждение пароля
            </label>
            <div class="mt-1">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                name="confirmPassword"
                type="password"
                autocomplete="new-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Повторите пароль"
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
              class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <span v-if="loading" class="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
              {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
            </button>
          </div>
        </form>

        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-slate-300 dark:border-slate-600" />
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400">Или</span>
            </div>
          </div>

          <div class="mt-6">
            <NuxtLink 
              to="/auth/login" 
              class="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-50 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
            >
              Уже есть аккаунт? Войти
            </NuxtLink>
          </div>
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

const { register } = useAuth()

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  confirmPassword: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const isFormValid = computed(() => {
  return form.firstName && 
         form.lastName && 
         form.email && 
         form.password && 
         form.confirmPassword &&
         form.password === form.confirmPassword &&
         form.password.length >= 6
})

const onSubmit = async () => {
  if (form.password !== form.confirmPassword) {
    error.value = 'Пароли не совпадают'
    return
  }

  if (form.password.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов'
    return
  }

  loading.value = true
  error.value = ''
  success.value = ''

  try {
    const result = await register({
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email,
      password: form.password
    })
    
    if (result.success) {
      success.value = result.message
      setTimeout(() => {
        navigateTo('/')
      }, 1500)
    } else {
      error.value = result.message
    }
  } catch (err) {
    error.value = 'Произошла ошибка при регистрации'
  } finally {
    loading.value = false
  }
}
</script>