import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = getRouterParam(event, 'url')
  if (!url) return { success: false, message: 'URL не указан' }
  
  const category = await AlgorithmCategory.findOne({ url })
    .populate('sections', 'name url')
    .lean()
  if (!category) return { success: false, message: 'Категория не найдена' }
  
  return { success: true, item: category }
})
