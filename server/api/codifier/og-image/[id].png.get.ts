import { defineEventHandler, getRouterParam, getQuery, sendProxy } from 'h3'

// Прокси-обертка, чтобы иметь человекочитаемый URL с расширением .png
export default defineEventHandler(async (event) => {
  const idWithExt = getRouterParam(event, 'id') || ''
  // На файловом роутинге [id].png.get.ts уже мапит "/:id.png", но на всякий случай очищаем суффикс
  const id = idWithExt.replace(/\.png$/i, '')
  if (!id) {
    return new Response('ID не указан', { status: 400 })
  }

  const query = getQuery(event)
  const search = new URLSearchParams()
  for (const [k, v] of Object.entries(query)) {
    if (v == null) continue
    search.append(k, String(v))
  }

  const host = event.node.req.headers.host
  const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
  const target = `${protocol}://${host}/api/codifier/og-image/${id}${search.toString() ? `?${search.toString()}` : ''}`

  return await sendProxy(event, target)
})


