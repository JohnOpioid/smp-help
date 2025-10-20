import { defineEventHandler, setHeader } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  // Отключаем кэширование для этого endpoint
  setHeader(event, 'Cache-Control', 'no-cache, no-store, must-revalidate')
  setHeader(event, 'Pragma', 'no-cache')
  setHeader(event, 'Expires', '0')
  
  try {
    console.log('🧪 TEST API: Начинаем тест загрузки данных...')
    await connectDB()
    console.log('✅ TEST API: Подключение к БД успешно')
    
    // Тестируем каждую модель отдельно
    const results: any = {}
    
    try {
      console.log('🧪 Тестируем LocalStatus...')
      const localStatusCount = await LocalStatus.countDocuments()
      results.localStatuses = { count: localStatusCount, success: true }
      console.log(`✅ LocalStatus: ${localStatusCount} документов`)
    } catch (err) {
      console.error('❌ LocalStatus error:', err)
      results.localStatuses = { count: 0, success: false, error: err.message }
    }
    
    try {
      console.log('🧪 Тестируем MKB...')
      const mkbCount = await MKB.countDocuments()
      results.mkb = { count: mkbCount, success: true }
      console.log(`✅ MKB: ${mkbCount} документов`)
    } catch (err) {
      console.error('❌ MKB error:', err)
      results.mkb = { count: 0, success: false, error: err.message }
    }
    
    try {
      console.log('🧪 Тестируем Algorithm...')
      const algorithmCount = await Algorithm.countDocuments()
      results.algorithms = { count: algorithmCount, success: true }
      console.log(`✅ Algorithm: ${algorithmCount} документов`)
    } catch (err) {
      console.error('❌ Algorithm error:', err)
      results.algorithms = { count: 0, success: false, error: err.message }
    }
    
    try {
      console.log('🧪 Тестируем Drug...')
      const drugCount = await Drug.countDocuments()
      results.drugs = { count: drugCount, success: true }
      console.log(`✅ Drug: ${drugCount} документов`)
    } catch (err) {
      console.error('❌ Drug error:', err)
      results.drugs = { count: 0, success: false, error: err.message }
    }
    
    try {
      console.log('🧪 Тестируем Substation...')
      const substationCount = await Substation.countDocuments()
      results.substations = { count: substationCount, success: true }
      console.log(`✅ Substation: ${substationCount} документов`)
    } catch (err) {
      console.error('❌ Substation error:', err)
      results.substations = { count: 0, success: false, error: err.message }
    }
    
    return {
      success: true,
      timestamp: new Date().toISOString(),
      results
    }
  } catch (error) {
    console.error('❌ TEST API: Общая ошибка:', error)
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }
  }
})
