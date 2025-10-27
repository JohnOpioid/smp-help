import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmSection from '~/server/models/AlgorithmSection'

export default defineEventHandler(async (event) => {
  await connectDB()
  const { section } = getQuery(event)
  
  const q: any = {}
  
  // Если указана секция, фильтруем по ней
  if (section) {
    // Определяем slug на основе section
    let sectionName = 'Взрослые'
    if (section === 'adults') sectionName = 'Взрослые'
    else if (section === 'pediatrics') sectionName = 'Детские'
    else if (section === 'onmp') sectionName = 'ОНМП'
    else if (section === 'onmp-children') sectionName = 'ОНМП Дети'
    
    const sectionDoc = await AlgorithmSection.findOne({ name: sectionName }).lean()
    if (sectionDoc) {
      q.section = sectionDoc._id
    }
  }
  
  // Получаем все алгоритмы с категориями
  const algorithms = await Algorithm.find(q)
    .select('category')
    .populate('category', '_id')
    .lean()
  
  // Подсчитываем количество алгоритмов для каждой категории
  const counts: Record<string, number> = {}
  algorithms.forEach(algo => {
    const catId = algo.category
    
    if (catId) {
      const catIdStr = typeof catId === 'object' && catId?._id 
        ? String(catId._id) 
        : String(catId)
      
      counts[catIdStr] = (counts[catIdStr] || 0) + 1
    }
  })
  
  return { success: true, counts }
})

