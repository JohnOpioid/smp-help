import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'

export default defineEventHandler(async () => {
  await connectDB()
  
  // Получаем все МКБ коды с информацией о категориях
  const items = await MKB.find({})
    .populate('category', 'name url')
    .select('mkbCode stationCode name note category')
    .lean()
  
  return { success: true, items }
})
