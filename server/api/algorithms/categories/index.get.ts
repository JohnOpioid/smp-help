import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'
import AlgorithmSection from '~/server/models/AlgorithmSection'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async () => {
  await connectDB()
  
  // Получаем категории
  const categories = await AlgorithmCategory.find({})
    .sort({ createdAt: 1 })
    .lean()
  
  // Получаем уникальные ID секций
  const sectionIdsArrays = categories.map(c => c.sections || []).filter(arr => arr.length > 0)
  const allSectionIds = sectionIdsArrays.flat()
  const uniqueSectionIds = [...new Set(allSectionIds.map(id => String(id)))]
  
  // Получаем секции
  const sections = await AlgorithmSection.find({ _id: { $in: uniqueSectionIds } })
    .select('name url')
    .lean()
  
  // Создаём Map для быстрого поиска
  const sectionsMap = new Map(sections.map(s => [String(s._id), s]))
  
  // Собираем данные с подсчётом алгоритмов
  const itemsWithCounts = await Promise.all(
    categories.map(async (category) => {
      const algorithmCount = await Algorithm.countDocuments({ 
        category: category._id 
      })
      
      // Заполняем секции вручную
      const populatedSections = (category.sections || [])
        .map(sectionId => sectionsMap.get(String(sectionId)))
        .filter(Boolean)
      
      return {
        ...category,
        sections: populatedSections,
        algorithmCount
      }
    })
  )
  
  return { success: true, items: itemsWithCounts }
})



