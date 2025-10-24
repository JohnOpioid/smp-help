export default defineNuxtRouteMiddleware(async (to) => {
  // Пропускаем проверку для страниц авторизации
  if (to.path.startsWith('/auth/')) {
    return
  }
  
  const { user, isLoggedIn } = useAuth()
  
  // Если пользователь не авторизован на клиенте, перенаправляем на страницу входа
  if (process.client && !isLoggedIn.value) {
    return navigateTo('/auth/login')
  }
  
  // Проверяем токен на сервере
  if (process.server) {
    try {
      const headers = useRequestHeaders(['cookie'])
      const cookie = (headers.cookie || '') as string
      
      if (!cookie.includes('token=')) {
        return navigateTo('/auth/login')
      }
      
      const res: any = await $fetch('/api/auth/me', { 
        credentials: 'include', 
        headers: { cookie } 
      })
      
      if (!res?.user) {
        return navigateTo('/auth/login')
      }
    } catch (error) {
      console.error('Auth middleware error:', error)
      return navigateTo('/auth/login')
    }
  }
})
