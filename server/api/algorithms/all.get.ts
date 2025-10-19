import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    console.log('🔍 API: Загружаем все алгоритмы...')
    const algorithms = await Algorithm.find({})
      .populate('category', 'name url')
      .populate('section', 'name url')
      .lean()
      .catch(err => {
        console.error('❌ API: Ошибка загрузки Algorithm:', err)
        return []
      })
    
    console.log(`📊 API: Загружено алгоритмов: ${algorithms.length}`)
    
    return {
      success: true,
      items: algorithms,
      total: algorithms.length
    }
  } catch (error) {
    console.error('❌ API: Ошибка при получении всех алгоритмов:', error)
    return {
      success: false,
      message: 'Ошибка при получении всех алгоритмов',
      items: [],
      total: 0
    }
  }
})
