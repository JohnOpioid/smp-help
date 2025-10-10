export const useAuth = () => {
  const user = useState<any | null>('auth-user', () => null)
  const token = useState<string | null>('auth-token', () => null)
  const isLoggedIn = computed(() => !!user.value)
  const tokenCookie = useCookie<string | null>('token', { path: '/', sameSite: 'lax' })

  // Инициализация из cookie через сервер
  const initAuth = async () => {
    try {
      if (user.value) return
      // Если нет cookie token, не запрашиваем /me
      const existingToken = useCookie<string | null>('token').value
      if (!existingToken) return
      const res: any = await $fetch('/api/auth/me', { credentials: 'include' })
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
      const data = await $fetch('/api/auth/register', {
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
        message: error.data?.statusMessage || 'Ошибка при регистрации' 
      }
    }
  }

  // Авторизация
  const login = async (credentials: { email: string; password: string }) => {
    try {
      const data = await $fetch('/api/auth/login', {
        method: 'POST',
        body: credentials
      })

      if (data.success) {
        saveAuth(data.token, data.user)
        return { success: true, message: data.message }
      }
    } catch (error: any) {
      return { 
        success: false, 
        message: error.data?.statusMessage || 'Ошибка при авторизации' 
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
