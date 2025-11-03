import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import News from '~/server/models/News'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = event.context.params?.id
  const body = await readBody(event)
  if (!id) return { success: false, message: 'id обязателен' }
  const { title, description, date, icon, version, published } = body || {}
  const update: any = {}
  if (title !== undefined) update.title = title
  if (description !== undefined) update.description = description
  if (date !== undefined) update.date = date ? new Date(date) : null
  if (icon !== undefined) update.icon = String(icon).trim() === '' ? 'i-lucide-newspaper' : icon
  if (version !== undefined) update.version = String(version).trim() === '' ? null : String(version).trim()
  if (published !== undefined) update.published = !!published
  const item = await News.findByIdAndUpdate(id, update, { new: true })
  return { success: true, item }
})


