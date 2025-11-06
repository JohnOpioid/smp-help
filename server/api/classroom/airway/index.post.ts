import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomAirway from '~/server/models/ClassroomAirway'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { title, slug, description, order, icon } = body || {}
  if (!title) return { success: false, message: 'title is required' }
  const s = slug || slugifyForUrl(title)
  const empty = { nodes: [], edges: [], viewport: { x: 0, y: 0, zoom: 1 } }
  const defaultIcon = icon || 'i-lucide-shapes'
  const doc = await ClassroomAirway.create({ title, slug: s, description: description || '', icon: defaultIcon, data: { children: empty, adults: empty }, order: order || 0 })
  return { success: true, item: { _id: doc._id, slug: doc.slug } }
})


