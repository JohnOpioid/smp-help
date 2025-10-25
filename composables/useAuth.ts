export const useAuth = () => {
  const user = useState<any | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const isLoggedIn = computed(() => !!user.value)
  
  // Улучшенные настройки cookie для локальной разработки
  const tokenCookie = useCookie<string | null>('token', { 
    path: '/', 
    sameSite: 'lax',
    secure: false, // Для локальной разработки
    httpOnly: false, // Позволяем читать cookie на клиенте
    maxAge: 60 * 60 * 24 * 7 // 7 дней
  })
  
  const runtimeConfig = useRuntimeConfig()
  
  // Упрощенное определение базового URL для API (без проверки Capacitor)
  const getApiUrl = () => {
    if (process.client) {
      // Простая проверка hostname без Capacitor
      const hostname = window.location.hostname
      const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1'
      const isLocalNetwork = hostname.startsWith('192.168.') || hostname.startsWith('10.0.') || hostname.startsWith('172.')
      
      if (isLocalhost || isLocalNetwork) {
        // Local network detected, using local API
        return `http://${hostname}:3000`
      } else {
        // Production detected, using helpsmp.ru
        return 'https://helpsmp.ru'
      }
    }
    return runtimeConfig.public.apiUrl || '/api'
  }

  // Инициализация из cookie через сервер
  const initAuth = async () => {
    try {
      // Если пользователь уже загружен, не делаем повторный запрос
      if (user.value) {
        // User already loaded, skipping init
        return
      }
      
      // Проверяем cookie token
      const existingToken = tokenCookie.value
      // Checking token cookie
      
      if (!existingToken) {
        // No token cookie found
        return
      }
      
      // Initializing auth with existing token
      const apiUrl = getApiUrl()
      // Using API URL
      
      const res: any = await $fetch(`${apiUrl}/api/auth/me`, { 
        credentials: 'include',
        retry: 1,
        timeout: 5000
      })
      
      if (res?.user) {
        user.value = res.user
        // Auth initialized successfully
      } else {
        // Если пользователь не найден, очищаем токен
        // User not found, clearing auth
        clearAuth()
      }
    } catch (error: any) {
      // Init auth error
      // Если ошибка авторизации, очищаем токен
      if (error.statusCode === 401 || error.status === 401) {
        // 401 error, clearing auth
        clearAuth()
      }
    }
  }

  // Сохранение без localStorage (временное отключение кэша)
  const saveAuth = (authToken: string, userData: any) => {
    // Saving auth
    
    if (authToken) {
      const strToken = String(authToken)
      token.value = strToken
      tokenCookie.value = strToken
      
      // Проверяем, что cookie действительно сохранился
      if (process.client) {
        // Token saved to cookie
      }
    } else {
      token.value = null
      tokenCookie.value = null
    }
    user.value = userData
    
    // Auth saved successfully
  }

  // Очистка аутентификации
  const clearAuth = () => {
    token.value = null
    tokenCookie.value = null
    user.value = null
  }

  // Регистрация
  const register = async (userData: {
    email: string
    password: string
    firstName: string
    lastName: string
  }) => {
    try {
      const apiUrl = getApiUrl()
      const data = await $fetch(`${apiUrl}/api/auth/register`, {
        method: 'POST',
        body: userData
      })

      if (data.success) {
        saveAuth(data.token, data.user)
        return { success: true, message: data.message }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.data?.message || error.data?.statusMessage || 'Ошибка при регистрации' 
      }
    }
  }

  // Авторизация
  const login = async (credentials: { email: string; password: string }) => {
    try {
      // Дополнительная очистка данных от невидимых символов
      const cleanCredentials = {
        email: credentials.email.replace(/[\u200B-\u200D\uFEFF]/g, '').trim().toLowerCase(),
        password: credentials.password.replace(/[\u200B-\u200D\uFEFF]/g, '').trim()
      }

              // DEBUG LOGIN START
              // Attempting login
              
              const apiUrl = getApiUrl()
              // Using API URL
              // Current location
              // Hostname
              // Protocol
              // User Agent
              // Is Web Browser
              // Full location object
              // DEBUG LOGIN END
              
              const data = await $fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        body: cleanCredentials
      })

      // Login response

      if (data.success) {
        saveAuth(data.token, data.user)
        return { success: true, message: data.message }
      }
    } catch (error: any) {
      // Login error
      return { 
        success: false, 
        message: error.data?.message || error.data?.statusMessage || 'Ошибка при авторизации' 
      }
    }
  }

  // Выход
  const logout = async () => {
    try {
      const apiUrl = getApiUrl()
      await $fetch(`${apiUrl}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } catch (error) {
      // Logout error
      // Продолжаем выполнение даже при ошибке сервера
    }
    
    // Очищаем локальные данные
    clearAuth()
    
    // Перенаправляем на страницу входа
    if (process.client) {
      // Определяем, находимся ли мы в Capacitor (мобильное приложение)
      const isCapacitor = process.client && (
        window.Capacitor?.isNativePlatform?.() || 
        window.location.protocol === 'capacitor:' ||
        window.location.protocol === 'ionic:' ||
        navigator.userAgent.includes('Capacitor')
      )
      
      if (isCapacitor) {
        // В Capacitor используем window.location для перенаправления
        window.location.href = '/auth/login'
      } else {
        // В веб-версии используем navigateTo для сохранения реактивности
        await navigateTo('/auth/login')
      }
    }
  }

  // Инициализация при создании composable
  if (process.client) {
    initAuth()
  }

  return {
    user,
    token,
    isLoggedIn,
    register,
    login,
    logout,
    clearAuth,
    initAuth
  }
}
