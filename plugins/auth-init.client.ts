export default defineNuxtPlugin(async () => {
  const { user, initAuth } = useAuth()
  
  // Инициализируем авторизацию только на клиенте
  if (process.client) {
    try {
      await initAuth()
    } catch (error) {
      console.error('Auth initialization error:', error)
    }
  }
})
