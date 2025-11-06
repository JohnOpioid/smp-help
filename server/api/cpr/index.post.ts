import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { title, slug, rows, notes, order, icon } = body || {}
  if (!title) {
    return { success: false, message: 'title is required' }
  }
  const s = slug || slugifyForUrl(title)
  const defaultIcon = icon || 'i-lucide-table'
  // Создаем пустую таблицу без шапки
  const doc = await ClassroomCpr.create({ title, slug: s, icon: defaultIcon, grid: [], merges: [], columns: 0, rows: [], notes: [], order: order || 0 })
  return { success: true, item: { _id: doc._id } }
})


