export const useAuth = () => {
  const user = useState<any | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const isLoggedIn = computed(() => !!user.value)
  const tokenCookie = useCookie<string | null>('token', { path: '/', sameSite: 'lax' })
  const runtimeConfig = useRuntimeConfig()
  
  // Определяем базовый URL для API
  const getApiUrl = () => {
    if (process.client) {
      // Проверяем через Capacitor API
      try {
        // @ts-ignore
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          console.log('Capacitor detected via API')
          // В Android приложении всегда используем HTTPS API
          return 'https://helpsmp.ru'
        }
      } catch (e) {
        console.log('Capacitor API not available:', e)
      }
      
      // Fallback: проверяем hostname для определения среды
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
      if (user.value) return
      // Если нет cookie token, не запрашиваем /me
      const existingToken = useCookie<string | null>('token').value
      if (!existingToken) return
      const apiUrl = getApiUrl()
      const res: any = await $fetch(`${apiUrl}/api/auth/me`, { credentials: 'include' })
      if (res?.user) {
        user.value = res.user
      }
    } catch {
      // игнорируем: нет токена/не авторизован
    }
  }

  // Сохранение без localStorage (временное отключение кэша)
  const saveAuth = (authToken: string, userData: any) => {
    if (authToken) {
      const strToken = String(authToken)
      token.value = strToken
      tokenCookie.value = strToken
    } else {
      token.value = null
      tokenCookie.value = null
    }
    user.value = userData
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
      await $fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {}
    clearAuth()
    navigateTo('/auth/login')
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
    clearAuth
  }
}
