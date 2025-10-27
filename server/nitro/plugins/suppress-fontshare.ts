// Плагин для подавления запросов к Fontshare
export default defineNitroPlugin(async (nitroApp) => {
  console.log('✅ Fontshare suppression plugin loaded')
  
  // Переопределяем fetch чтобы блокировать запросы к fontshare
  const originalFetch = globalThis.fetch
  globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url
    
    if (url.includes('fontshare.com')) {
      console.log('🚫 Blocking Fontshare request:', url)
      // Возвращаем пустой ответ вместо реального запроса
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return originalFetch(input, init)
  }
})

