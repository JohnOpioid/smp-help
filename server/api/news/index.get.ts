import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import News from '~/server/models/News'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await connectDB()
  // Проверяем, является ли пользователь админом
  const isAdmin = await requireAdmin(event).then(() => true).catch(() => false)
  
  // Если админ - показываем все новости, иначе только опубликованные
  const filter: any = isAdmin ? {} : { published: true }
  const items = await News.find(filter).sort({ date: -1, createdAt: -1 }).lean()
  return { success: true, items }
})


