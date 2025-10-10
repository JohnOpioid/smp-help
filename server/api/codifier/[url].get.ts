import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import MKBCategory from '~/server/models/MKBCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = getRouterParam(event, 'url')
  
  if (!url) {
    return { success: false, message: 'URL категории не указан' }
  }

  // Найти категорию по URL в новой коллекции mkbscategories
  const category = await MKBCategory.findOne({ url }).lean()
  if (!category) {
    return { success: false, message: 'Категория не найдена' }
  }

  // Получить МКБ коды для этой категории (сортировка по коду МКБ по возрастанию)
  const items = await MKB.find({ category: category._id })
    .sort({ mkbCode: 1 })
    .populate('category', 'name url')
    .lean()
  
  return { success: true, category, items }
})
