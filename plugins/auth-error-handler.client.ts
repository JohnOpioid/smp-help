export default defineNuxtPlugin(() => {
  // Глобальный обработчик ошибок авторизации
  if (process.client) {
    // Обрабатываем ошибки 401 в ответах API
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args)
        
        // Если получили 401, проверяем авторизацию
        if (response.status === 401) {
          // Проверяем, что это не запрос к странице авторизации
          const url = args[0]?.toString() || ''
          if (!url.includes('/auth/')) {
            const { clearAuth } = useAuth()
            clearAuth()
            
            // Перенаправляем на страницу входа только если мы не на ней уже
            if (!window.location.pathname.includes('/auth/')) {
              await navigateTo('/auth/login')
            }
          }
        }
        
        return response
      } catch (error) {
        throw error
      }
    }
    
    // Обрабатываем ошибки в $fetch
    const original$fetch = globalThis.$fetch
    if (original$fetch) {
      globalThis.$fetch = async (...args) => {
        try {
          return await original$fetch(...args)
        } catch (error: any) {
          // Если ошибка авторизации, очищаем данные и перенаправляем
          if (error.statusCode === 401 || error.status === 401) {
            // Проверяем, что это не запрос к странице авторизации
            const url = args[0]?.toString() || ''
            if (!url.includes('/auth/')) {
              const { clearAuth } = useAuth()
              clearAuth()
              
              // Перенаправляем на страницу входа только если мы не на ней уже
              if (!window.location.pathname.includes('/auth/')) {
                await navigateTo('/auth/login')
              }
            }
          }
          throw error
        }
      }
    }
  }
})
