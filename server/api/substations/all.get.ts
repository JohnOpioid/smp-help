import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
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
