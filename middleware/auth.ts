export default defineNuxtRouteMiddleware(async (to) => {
  // Пропускаем проверку для страниц авторизации
  if (to.path.startsWith('/auth/')) {
    return
  }
  
  // Пропускаем авторизацию для ботов социальных сетей, чтобы они могли читать мета-теги
  if (process.server) {
    const headers = useRequestHeaders()
    const userAgent = (headers['user-agent'] || '').toLowerCase()
    const isBot = userAgent.includes('facebookexternalhit') || 
                 userAgent.includes('whatsapp') || 
                 userAgent.includes('telegrambot') || 
                 userAgent.includes('twitterbot') ||
                 userAgent.includes('linkedinbot') ||
                 userAgent.includes('slackbot') ||
                 userAgent.includes('bingbot') ||
                 userAgent.includes('googlebot') ||
                 userAgent.includes('crawler') ||
                 userAgent.includes('spider')
    
    if (isBot) {
      return // Пропускаем ботов без авторизации
    }
  }

  // Публичный доступ для предпросмотра шеринга кодификатора по ссылке с id
  // Нужен, чтобы соцсети и неавторизованные пользователи могли получить OG-мета и og:image
  if (to.path.startsWith('/codifier') && typeof to.query.id === 'string' && to.query.id.length > 0) {
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
