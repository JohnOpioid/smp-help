export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('request', async (event) => {
    const origin = event.node.req.headers.origin
    
    // Список разрешенных origins
    const allowedOrigins = [
      'http://localhost:3000',
      'http://192.168.1.40:3000',
      'http://192.168.1.40:3001',
      'http://localhost:3001',
      'http://localhost',
      'capacitor://localhost',
      'ionic://localhost',
      'http://localhost:8080',
      'http://localhost:8100'
    ]
    
    // Проверяем, является ли origin разрешенным
    const isAllowedOrigin = origin && allowedOrigins.includes(origin)
    
    // Обрабатываем preflight запросы
    if (getMethod(event) === 'OPTIONS') {
      if (isAllowedOrigin) {
        setHeader(event, 'Access-Control-Allow-Origin', origin)
        setHeader(event, 'Access-Control-Allow-Credentials', 'true')
      } else {
        setHeader(event, 'Access-Control-Allow-Origin', '*')
      }
      setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
      setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
      return new Response(null, { status: 200 })
    }

    // Добавляем CORS заголовки для всех запросов
    if (isAllowedOrigin) {
      setHeader(event, 'Access-Control-Allow-Origin', origin)
      setHeader(event, 'Access-Control-Allow-Credentials', 'true')
    } else {
      setHeader(event, 'Access-Control-Allow-Origin', '*')
    }
    setHeader(event, 'Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH')
    setHeader(event, 'Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin')
  })
})
