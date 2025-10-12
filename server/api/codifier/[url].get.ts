import { defineEventHandler, getRouterParam, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import MKBCategory from '~/server/models/MKBCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = getRouterParam(event, 'url')
  const query = getQuery(event)
  
  if (!url) {
    return { success: false, message: 'URL категории не указан' }
  }

  // Найти категорию по URL в новой коллекции mkbscategories
  const category = await MKBCategory.findOne({ url }).lean()
  if (!category) {
    return { success: false, message: 'Категория не найдена' }
  }

  // Параметры пагинации
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const skip = (page - 1) * limit

  // Получить общее количество элементов
  const totalItems = await MKB.countDocuments({ category: category._id })

  // Получить МКБ коды для этой категории с пагинацией
  const items = await MKB.find({ category: category._id })
    .sort({ mkbCode: 1 })
    .skip(skip)
    .limit(limit)
    .populate('category', 'name url')
    .lean()
  
  const totalPages = Math.ceil(totalItems / limit)
  const hasNextPage = page < totalPages
  
  console.log(`🔍 API: Запрос страницы ${page}, limit: ${limit}, skip: ${skip}`)
  console.log(`📊 API: Найдено ${items.length} элементов из ${totalItems} (страница ${page}/${totalPages}), hasNextPage: ${hasNextPage}`)
  
  return { 
    success: true, 
    category, 
    items,
    pagination: {
      page,
      limit,
      totalItems,
      totalPages,
      hasNextPage,
      hasPrevPage: page > 1
    }
  }
})
