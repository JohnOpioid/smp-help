import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  // Поддержка HEAD-запросов: отдаем корректные заголовки без тела,
  // чтобы проверки типа curl -I и боты соцсетей получали 200 OK
  const id = getRouterParam(event, 'id')
  if (!id) {
    return new Response(null, { status: 400 })
  }

  // Ставим базовые заголовки PNG и кеша
  event.node.res.setHeader('Access-Control-Allow-Origin', '*')
  event.node.res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS')
  event.node.res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  return new Response(null, {
    status: 200,
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=3600'
    }
  })
})


