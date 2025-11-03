import { defineNitroPlugin } from 'nitropack'

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:html', (html, { event }) => {
    try {
      const url = event.node.req.url || ''
      if (!url.startsWith('/codifier')) return

      const parsed = new URL(event.node.req.protocol ? `${event.node.req.protocol}://${event.node.req.headers.host}${url}` : `http://${event.node.req.headers.host}${url}`)
      const id = parsed.searchParams.get('id')
      if (!id) return

      const host = event.node.req.headers.host || 'localhost:3000'
      const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http'
      const baseUrl = `${protocol}://${host}`
      const ogImageUrl = `${baseUrl}/api/codifier/og-image/${id}?v=${id}`

      // Базовый набор OG-тегов, чтобы боты всегда видели изображение
      html.head.push(
        `<meta property="og:type" content="website">`,
        `<meta property="og:url" content="${baseUrl}${parsed.pathname}${parsed.search}">`,
        `<meta property="og:image" content="${ogImageUrl}">`,
        `<meta property="og:image:secure_url" content="${ogImageUrl}">`,
        `<meta property="og:image:type" content="image/png">`,
        `<meta property="og:image:width" content="1200">`,
        `<meta property="og:image:height" content="630">`,
        `<meta property="og:site_name" content="Справочник СМП">`,
        `<meta property="og:locale" content="ru_RU">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:image" content="${ogImageUrl}">`,
        `<link rel="image_src" href="${ogImageUrl}">`
      )
    } catch {}
  })
})


