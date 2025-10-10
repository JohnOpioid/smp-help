import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import { createNormalizedSearchConditions } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const query = getQuery(event)
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 15
  const search = query.search as string || ''
  
  const skip = (page - 1) * limit
  
  // Создаем условия поиска с учетом нормализации кириллицы/латиницы
  const searchConditions = createNormalizedSearchConditions(search, [
    'stationCode',
    'mkbCode', 
    'name',
    'note'
  ])
  
  const [items, total] = await Promise.all([
    MKB.find(searchConditions).populate('category', 'name url').skip(skip).limit(limit).lean(),
    MKB.countDocuments(searchConditions)
  ])
  
  return { 
    success: true, 
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    search
  }
})