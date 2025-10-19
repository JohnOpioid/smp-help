export const useOfflineAuth = () => {
  const { $fetch } = useNuxtApp()
  
  // Сохранение токена в localStorage для офлайн режима
  const saveAuthToken = (token: string) => {
    localStorage.setItem('auth-token', token)
    localStorage.setItem('auth-timestamp', Date.now().toString())
  }
  
  // Получение токена из localStorage
  const getAuthToken = (): string | null => {
    const token = localStorage.getItem('auth-token')
    const timestamp = localStorage.getItem('auth-timestamp')
    
    if (!token || !timestamp) return null
    
    // Проверяем, не истек ли токен (24 часа)
    const tokenAge = Date.now() - parseInt(timestamp)
    const maxAge = 24 * 60 * 60 * 1000 // 24 часа
    
    if (tokenAge > maxAge) {
      localStorage.removeItem('auth-token')
      localStorage.removeItem('auth-timestamp')
      return null
    }
    
    return token
  }
  
  // Проверка аутентификации в офлайн режиме
  const checkOfflineAuth = (): boolean => {
    const token = getAuthToken()
    return token !== null
  }
  
  // Сохранение пользовательских данных для офлайн режима
  const saveUserData = (userData: any) => {
    localStorage.setItem('user-data', JSON.stringify(userData))
  }
  
  // Получение пользовательских данных
  const getUserData = (): any | null => {
    const userData = localStorage.getItem('user-data')
    return userData ? JSON.parse(userData) : null
  }
  
  // Очистка данных аутентификации
  const clearAuthData = () => {
    localStorage.removeItem('auth-token')
    localStorage.removeItem('auth-timestamp')
    localStorage.removeItem('user-data')
  }
  
  // Проверка подключения к интернету
  const isOnline = ref(navigator.onLine)
  
  // Слушаем изменения статуса подключения
  if (process.client) {
    window.addEventListener('online', () => {
      isOnline.value = true
    })
    
    window.addEventListener('offline', () => {
      isOnline.value = false
    })
  }
  
  // Функция для синхронизации данных при восстановлении подключения
  const syncAuthData = async () => {
    if (!isOnline.value) return
    
    const token = getAuthToken()
    if (!token) return
    
    try {
      // Проверяем токен на сервере
      const response = await ($fetch as any)('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      if (response.success) {
        // Токен валиден, сохраняем данные пользователя
        saveUserData(response.user)
        return true
      } else {
        // Токен невалиден, очищаем данные
        clearAuthData()
        return false
      }
    } catch (error) {
      console.warn('Ошибка синхронизации аутентификации:', error)
      return false
    }
  }
  
  return {
    saveAuthToken,
    getAuthToken,
    checkOfflineAuth,
    saveUserData,
    getUserData,
    clearAuthData,
    syncAuthData,
    isOnline: readonly(isOnline)
  }
}
