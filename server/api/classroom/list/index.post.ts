import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomList from '~/server/models/ClassroomList'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { title, slug, description, items, order, icon } = body || {}
  if (!title) return { success: false, message: 'title is required' }
  const s = slug || slugifyForUrl(title)
  const defaultIcon = icon || 'i-lucide-list'
  const doc = await ClassroomList.create({ title, slug: s, description: description || '', icon: defaultIcon, items: items || [], order: order || 0 })
  return { success: true, item: { _id: doc._id, slug: doc.slug } }
})


