export default defineNuxtRouteMiddleware(async () => {
  // Проверяем, находимся ли мы в офлайн режиме
  if (process.client) {
    // Простая проверка через navigator.onLine
    if (!navigator.onLine) {
      // В офлайн режиме проверяем localStorage для токена
      const offlineToken = localStorage.getItem('offline-auth-token')
      if (offlineToken) {
        // Если есть офлайн токен, разрешаем доступ
        return
      }
      // Если нет офлайн токена, перенаправляем на страницу офлайн
      return navigateTo('/offline')
    }
  }

  try {
    const opts: any = { credentials: 'include' }
    if (process.server) {
      const headers = useRequestHeaders(['cookie'])
      opts.headers = { cookie: headers.cookie as string }
    }
    const res: any = await $fetch('/api/auth/me', opts)
    if (!res?.user) {
      return navigateTo('/auth/login')
    }
  } catch (error) {
    // Если ошибка сети, проверяем офлайн токен
    if (process.client) {
      // Простая проверка через navigator.onLine
      if (!navigator.onLine) {
        const offlineToken = localStorage.getItem('offline-auth-token')
        if (offlineToken) {
          return
        }
        return navigateTo('/offline')
      }
    }
    return navigateTo('/auth/login')
  }
})
