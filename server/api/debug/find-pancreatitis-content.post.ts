import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    console.log(`🔍 Ищем все записи с "панкреатит" в содержимом алгоритмов`)
    
    // Ищем в содержимом алгоритмов
    const algorithmsWithPancreatitis = await Algorithm.find({
      content: { $regex: 'панкреатит', $options: 'i' }
    }).lean()
    
    console.log(`🔍 Найдено алгоритмов с "панкреатит" в содержимом: ${algorithmsWithPancreatitis.length}`)
    
    return {
      success: true,
      count: algorithmsWithPancreatitis.length,
      algorithms: algorithmsWithPancreatitis.map(alg => ({
        id: alg._id,
        title: alg.title,
        hasPancreatitisInContent: alg.content.toLowerCase().includes('панкреатит'),
        contentPreview: alg.content.substring(0, 200) + '...'
      }))
    }
    
  } catch (error) {
    console.error('❌ Ошибка при поиске панкреатита в алгоритмах:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
