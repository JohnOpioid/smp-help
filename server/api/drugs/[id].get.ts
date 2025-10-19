import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  
  if (!id) {
    return { success: false, message: 'ID препарата не указан' }
  }

  try {
    const drug = await Drug.findById(id)
      .populate('categories', 'name url')
      .lean()

    if (!drug) {
      return { success: false, message: 'Препарат не найден' }
    }

    return { success: true, item: drug }
  } catch (error) {
    console.error('Ошибка при получении препарата по ID:', error)
    return { success: false, message: 'Ошибка при получении препарата' }
  }
})