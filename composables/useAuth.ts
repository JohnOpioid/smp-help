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
        console.log('Local network detected, using local API')
        return `http://${hostname}:3000`
      } else {
        console.log('Production detected, using helpsmp.ru')
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
        console.log('User already loaded, skipping init')
        return
      }
      
      // Проверяем cookie token
      const existingToken = tokenCookie.value
      console.log('Checking token cookie:', { 
        hasToken: !!existingToken, 
        tokenLength: existingToken?.length || 0,
        cookieValue: existingToken ? 'exists' : 'null'
      })
      
      if (!existingToken) {
        console.log('No token cookie found')
        return
      }
      
      console.log('Initializing auth with existing token')
      const apiUrl = getApiUrl()
      console.log('Using API URL:', apiUrl)
      
      const res: any = await $fetch(`${apiUrl}/api/auth/me`, { 
        credentials: 'include',
        retry: 1,
        timeout: 5000
      })
      
      if (res?.user) {
        user.value = res.user
        console.log('Auth initialized successfully:', res.user.email)
      } else {
        // Если пользователь не найден, очищаем токен
        console.log('User not found, clearing auth')
        clearAuth()
      }
    } catch (error: any) {
      console.error('Init auth error:', error)
      // Если ошибка авторизации, очищаем токен
      if (error.statusCode === 401 || error.status === 401) {
        console.log('401 error, clearing auth')
        clearAuth()
      }
    }
  }

  // Сохранение без localStorage (временное отключение кэша)
  const saveAuth = (authToken: string, userData: any) => {
    console.log('Saving auth:', { hasToken: !!authToken, hasUser: !!userData })
    
    if (authToken) {
      const strToken = String(authToken)
      token.value = strToken
      tokenCookie.value = strToken
      
      // Проверяем, что cookie действительно сохранился
      if (process.client) {
        console.log('Token saved to cookie:', !!tokenCookie.value)
        console.log('Cookie value:', tokenCookie.value ? 'exists' : 'null')
      }
    } else {
      token.value = null
      tokenCookie.value = null
    }
    user.value = userData
    
    console.log('Auth saved successfully:', { 
      hasUser: !!user.value, 
      hasToken: !!token.value, 
      hasCookie: !!tokenCookie.value 
    })
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

              console.log('=== DEBUG LOGIN START ===')
              console.log('Attempting login with:', { email: cleanCredentials.email, passwordLength: cleanCredentials.password.length })
              
              const apiUrl = getApiUrl()
              console.log('Using API URL:', apiUrl)
              console.log('Current location:', window.location.href)
              console.log('Hostname:', window.location.hostname)
              console.log('Protocol:', window.location.protocol)
              console.log('User Agent:', navigator.userAgent)
              console.log('Is Web Browser:', window.location.protocol === 'http:' || window.location.protocol === 'https:')
              console.log('Full location object:', {
                href: window.location.href,
                protocol: window.location.protocol,
                hostname: window.location.hostname,
                port: window.location.port,
                pathname: window.location.pathname,
                search: window.location.search,
                hash: window.location.hash
              })
              console.log('=== DEBUG LOGIN END ===')
              
              const data = await $fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        body: cleanCredentials
      })

      console.log('Login response:', data)

      if (data.success) {
        saveAuth(data.token, data.user)
        return { success: true, message: data.message }
      }
    } catch (error: any) {
      console.error('Login error:', error)
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
      console.error('Logout error:', error)
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
