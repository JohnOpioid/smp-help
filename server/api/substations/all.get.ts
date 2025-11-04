import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'
// Импортируем модель Region ДО использования, чтобы она была зарегистрирована в Mongoose
// Это необходимо для работы populate('region', 'name')
import Region from '~/server/models/Region'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    // Убеждаемся, что модель Region зарегистрирована, выполнив простой запрос
    // Это гарантирует, что модель будет доступна для populate
    try {
      await Region.findOne({}).limit(1).lean()
    } catch (e) {
      // Игнорируем ошибки, если коллекция пуста или модель не зарегистрирована
      console.warn('⚠️ API: Предупреждение при проверке модели Region:', e)
    }
    
    console.log('🔍 API: Загружаем все подстанции...')
    const substations = await Substation.find({})
      .populate('region', 'name')
      .lean()
      .catch(err => {
        console.error('❌ API: Ошибка загрузки Substation:', err)
        return []
      })
    
    console.log(`📊 API: Загружено подстанций: ${substations.length}`)
    
    return {
      success: true,
      items: substations,
      total: substations.length
    }
  } catch (error) {
    console.error('❌ API: Ошибка при получении всех подстанций:', error)
    return {
      success: false,
      message: 'Ошибка при получении всех подстанций',
      items: [],
      total: 0
    }
  }
})
