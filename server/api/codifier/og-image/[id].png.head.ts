import { defineEventHandler, getRouterParam } from 'h3'

export default defineEventHandler(async (event) => {
  const idWithExt = getRouterParam(event, 'id') || ''
  const id = idWithExt.replace(/\.png$/i, '')
  if (!id) {
    return new Response(null, { status: 400 })
  }

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


