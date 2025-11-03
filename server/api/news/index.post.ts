import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import News from '~/server/models/News'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const { title, description, date, icon, version, published } = body || {}
  if (!title) {
    return { success: false, message: 'Укажите заголовок' }
  }
  const item = await News.create({
    title,
    description,
    date: date ? new Date(date) : undefined,
    icon: icon && String(icon).trim() !== '' ? icon : undefined,
    version: version && String(version).trim() !== '' ? String(version).trim() : undefined,
    published: typeof published === 'boolean' ? published : true
  })
  return { success: true, item }
})


