import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'
import AlgorithmSection from '~/server/models/AlgorithmSection'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async () => {
  await connectDB()
  
  // Регистрируем модель AlgorithmSection для populate
  AlgorithmSection
  
  // Старые сначала: по возрастанию createdAt
  const items = await AlgorithmCategory.find({})
    .populate('sections', 'name url')
    .sort({ createdAt: 1 })
    .lean()
  
  // Добавляем количество алгоритмов для каждой категории
  const itemsWithCounts = await Promise.all(
    items.map(async (category) => {
      const algorithmCount = await Algorithm.countDocuments({ 
        category: category._id 
      })
      return {
        ...category,
        algorithmCount
      }
    })
  )
  
  return { success: true, items: itemsWithCounts }
})


