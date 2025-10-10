import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Category from '~/server/models/Category'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')

  if (!id) {
    return { success: false, message: 'ID категории не указан' }
  }

  const deleted = await Category.findByIdAndDelete(id).lean()

  if (!deleted) {
    return { success: false, message: 'Категория не найдена' }
  }

  return { success: true, message: 'Категория успешно удалена' }
})
