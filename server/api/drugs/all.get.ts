import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    console.log('🔍 API: Загружаем все препараты...')
    const drugs = await Drug.find({})
      .populate('categories', 'name url')
      .lean()
      .catch(err => {
        console.error('❌ API: Ошибка загрузки Drug:', err)
        return []
      })
    
    console.log(`📊 API: Загружено препаратов: ${drugs.length}`)
    
    return {
      success: true,
      items: drugs,
      total: drugs.length
    }
  } catch (error) {
    console.error('❌ API: Ошибка при получении всех препаратов:', error)
    return {
      success: false,
      message: 'Ошибка при получении всех препаратов',
      items: [],
      total: 0
    }
  }
})
