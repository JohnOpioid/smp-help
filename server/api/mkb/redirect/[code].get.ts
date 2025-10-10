import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'

export default defineEventHandler(async (event) => {
  await connectDB()
  const code = getRouterParam(event, 'code')
  
  if (!code) {
    return { success: false, message: 'Код МКБ не указан' }
  }

  // Найти диагноз по коду МКБ
  const diagnosis = await MKB.findOne({ mkbCode: code })
    .populate('category', 'name url')
    .lean()
  
  if (!diagnosis) {
    return { success: false, message: 'Диагноз не найден' }
  }

  return { 
    success: true, 
    diagnosis,
    redirectUrl: `/codifier/${diagnosis.category.url}`
  }
})
