<template>
  <div class="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
    <div class="max-w-md w-full space-y-8">
      <div>
        <h2 class="mt-6 text-center text-3xl font-extrabold text-slate-900 dark:text-white">
          Вход в систему
        </h2>
        <p class="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
          Справочник СМП
        </p>
      </div>
      
      <div class="mt-8 bg-white dark:bg-slate-800 py-4 px-4 shadow rounded-lg transition-colors duration-300">
        <div v-if="isWaitingForCode" class="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
          <div class="flex items-center gap-3">
            <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 dark:border-blue-400"></div>
            <p class="text-sm text-blue-700 dark:text-blue-300">
              Откройте Telegram и получите код авторизации
            </p>
          </div>
        </div>

        <form @submit.prevent="onSubmit" class="space-y-6">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Email
            </label>
            <div class="mt-1">
              <input
                ref="emailField"
                id="email"
                v-model="form.email"
                name="email"
                type="email"
                autocomplete="email"
                required
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Введите ваш email"
                :disabled="loading"
                @focus="clearFieldIfAutofilled('email')"
                @input="checkAutofill"
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700 dark:text-slate-300">
              Пароль
            </label>
            <div class="mt-1">
              <input
                ref="passwordField"
                id="password"
                v-model="form.password"
                name="password"
                type="password"
                autocomplete="current-password"
                required
                class="appearance-none block w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors duration-200"
                placeholder="Введите пароль"
                :disabled="loading"
                @focus="clearFieldIfAutofilled('password')"
                @input="checkAutofill"
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

          <div class="flex items-center justify-between">
            <div></div>
            <div class="text-sm">
              <NuxtLink
                to="/auth/forgot-password"
                class="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Забыли пароль?
              </NuxtLink>
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
              {{ loading ? 'Вход...' : 'Войти' }}
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

            <div class="mt-6 space-y-3">
              <button
                @click="handleTelegramLogin"
                type="button"
                class="w-full flex justify-center items-center gap-2 py-2 px-4 border-2 border-blue-500 dark:border-blue-400 rounded-md shadow-sm text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 cursor-pointer"
              >
                <UIcon name="i-logos-telegram" class="w-5 h-5" />
                Войти через Telegram
              </button>

              <NuxtLink 
                to="/auth/register" 
                class="w-full flex justify-center py-2 px-4 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                Создать новый аккаунт
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

const { login } = useAuth()

const config = useRuntimeConfig()
const telegramBotUrl = computed(() => {
  const botUsername = config.public.telegramBotUsername || 'helpssmp_bot'
  return `https://t.me/${botUsername}?start=login`
})

// Для dev используем IP адрес
const devUrl = 'https://192.168.1.40:3000'

const form = reactive({
  email: '',
  password: ''
})

const loading = ref(false)
const error = ref('')
const success = ref('')

const route = useRoute()

onMounted(async () => {
})

// Отслеживаем изменения полей для корректной работы с автозаполнением
const emailField = ref<HTMLInputElement | null>(null)
const passwordField = ref<HTMLInputElement | null>(null)

// Вычисляемое свойство для проверки валидности формы
const isFormValid = computed(() => {
  return form.email.trim() && form.password.trim()
})

// Функция для очистки поля при фокусе (если оно автозаполнено)
const clearFieldIfAutofilled = (field: 'email' | 'password') => {
  // Небольшая задержка, чтобы дать браузеру время на автозаполнение
  setTimeout(() => {
    if (field === 'email') {
      // Очищаем только если поле содержит невидимые символы или лишние пробелы
      if (form.email && (form.email.includes('\u200B') || form.email.includes('\u200C') || form.email.includes('\u200D') || form.email.includes('\uFEFF'))) {
        form.email = ''
      }
    } else if (field === 'password') {
      // Очищаем только если поле содержит невидимые символы
      if (form.password && (form.password.includes('\u200B') || form.password.includes('\u200C') || form.password.includes('\u200D') || form.password.includes('\uFEFF'))) {
        form.password = ''
      }
    }
  }, 100)
}

// Функция для проверки автозаполнения
const checkAutofill = () => {
  if (emailField.value && passwordField.value) {
    // Проверяем, заполнены ли поля браузером
    if (emailField.value.value && passwordField.value.value) {
      form.email = emailField.value.value
      form.password = passwordField.value.value
    }
  }
}

// Функция для проверки и очистки полей перед отправкой
const validateAndCleanFields = () => {
  // Очищаем поля от невидимых символов и лишних пробелов
  const cleanForm = {
    email: form.email.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase(),
    password: form.password.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
  }

  // Валидация
  if (!cleanForm.email || !cleanForm.password) {
    error.value = 'Пожалуйста, заполните все поля'
    return null
  }

  // Проверяем email на корректность
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(cleanForm.email)) {
    error.value = 'Пожалуйста, введите корректный email'
    return null
  }

  return cleanForm
}

const onSubmit = async () => {
  loading.value = true
  error.value = ''
  success.value = ''

  try {
    // Валидация и очистка полей
    const cleanForm = validateAndCleanFields()
    if (!cleanForm) {
      return
    }

    const result: any = await login(cleanForm)
    
    if (result.success) {
      success.value = result.message
      
      // Упрощенная логика перенаправления
      await navigateTo('/')
    } else {
      error.value = result.message
    }
  } catch (err) {
    error.value = 'Произошла ошибка при авторизации'
  } finally {
    loading.value = false
  }
}

const isWaitingForCode = ref(false)
const pollTimer = ref<NodeJS.Timeout | null>(null)

const handleTelegramLogin = () => {
  // Открываем только бота - перенаправление произойдет после генерации кода
  const botUrl = `https://t.me/${config.public.telegramBotUsername || 'helpssmp_bot'}?start=login`
  
  // Начинаем ожидание кода
  isWaitingForCode.value = true
  
  // Открываем бота
  window.open(botUrl, '_blank')
  
  // Начинаем проверку localStorage для обновления страницы при генерации кода
  checkForGeneratedCode()
}

const checkForGeneratedCode = () => {
  console.log('🔍 Начинаем проверку кода...')
  
  let hasNavigated = false // Флаг, что навигация уже произошла
  let lastCheckedCode: string | null = null // Последний проверенный код, чтобы не редиректить дважды
  
  // Ждем 0.5 секунды перед началом проверки, чтобы дать боту время сгенерировать код
  setTimeout(() => {
    console.log('🔍 Начинаем проверять API...')
    
    // Проверяем API каждые 300ms для более быстрой реакции
    pollTimer.value = setInterval(async () => {
      // Проверяем, что мы еще на странице логина и навигация еще не произошла
      if (hasNavigated || route.path !== '/auth/login') {
        if (pollTimer.value) {
          clearInterval(pollTimer.value)
          pollTimer.value = null
        }
        return
      }
      
      try {
        const check = await $fetch('/api/auth/check-telegram-auth-code')
        console.log('📋 Ответ от API:', check)
        
        if (check?.success && check?.code && check?.telegramId) {
          // Проверяем, что это новый код (не тот же самый)
          if (lastCheckedCode === check.code) {
            return // Пропускаем, если это тот же код
          }
          
          console.log('✅ Найден код через API:', check)
          lastCheckedCode = check.code
          
          // Останавливаем проверку
          if (pollTimer.value) {
            clearInterval(pollTimer.value)
            pollTimer.value = null
          }
          
          // Устанавливаем флаг навигации
          hasNavigated = true
          isWaitingForCode.value = false
          
          // Используем window.location.replace для надежного редиректа
          // replace вместо href, чтобы не добавлять запись в историю
          const redirectUrl = `/auth/telegram-code?telegramId=${check.telegramId}&code=${check.code}`
          console.log('🔄 Выполняем редирект на:', redirectUrl)
          
          // Используем replace для более надежного редиректа
          window.location.replace(redirectUrl)
        }
      } catch (e) {
        console.error('❌ Ошибка при проверке API:', e)
      }
    }, 300) // Проверяем каждые 300ms для более быстрой реакции
  }, 500) // Уменьшили задержку до 0.5 секунды
  
  // Останавливаем проверку через 5 минут
  setTimeout(() => {
    console.log('⏱️ Превышено время ожидания кода')
    if (pollTimer.value) {
      clearInterval(pollTimer.value)
      pollTimer.value = null
      isWaitingForCode.value = false
    }
  }, 302000)
}

onBeforeUnmount(() => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value)
  }
})
</script>