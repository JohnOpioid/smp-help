import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  console.log('🔍 API: Начинаем загрузку данных для поиска')
  
  try {
    await connectDB()
    console.log('🔍 API: Подключение к БД установлено')
    
    // Проверяем модели
    console.log('🔍 API: Проверяем модели:', {
      LocalStatus: !!LocalStatus,
      MKB: !!MKB,
      Algorithm: !!Algorithm,
      Drug: !!Drug,
      Substation: !!Substation
    })
    
    // Получаем все данные из всех коллекций параллельно
    console.log('🔍 API: Начинаем загрузку данных из коллекций...')
    const [localStatuses, mkbCodes, algorithms, drugs, substations] = await Promise.all([
      LocalStatus.find({}).populate('category', 'name url').lean().catch(err => {
        console.error('❌ API: Ошибка загрузки LocalStatus:', err)
        return []
      }),
      MKB.find({}).populate('category', 'name url').lean().catch(err => {
        console.error('❌ API: Ошибка загрузки MKB:', err)
        return []
      }),
      Algorithm.find({}).populate('category', 'name url').populate('section', 'name url').lean().catch(err => {
        console.error('❌ API: Ошибка загрузки Algorithm:', err)
        return []
      }),
      Drug.find({}).populate('categories', 'name url').lean().catch(err => {
        console.error('❌ API: Ошибка загрузки Drug:', err)
        return []
      }),
      Substation.find({}).populate('region', 'name').lean().catch(err => {
        console.error('❌ API: Ошибка загрузки Substation:', err)
        return []
      })
    ])
    
    console.log('📊 API: Загружено данных:', {
      localStatuses: localStatuses.length,
      mkbCodes: mkbCodes.length,
      algorithms: algorithms.length,
      drugs: drugs.length,
      substations: substations.length
    })
    
    // Проверяем, что хотя бы одна коллекция не пустая
    const totalItems = localStatuses.length + mkbCodes.length + algorithms.length + drugs.length + substations.length
    if (totalItems === 0) {
      console.warn('⚠️ API: Все коллекции пусты!')
      return {
        success: false,
        message: 'Все коллекции данных пусты',
        data: {
          localStatuses: { items: [], total: 0 },
          mkbCodes: { items: [], total: 0 },
          algorithms: { items: [], total: 0 },
          drugs: { items: [], total: 0 },
          substations: { items: [], total: 0 }
        },
        totalItems: 0
      }
    }
    
    return {
      success: true,
      data: {
        localStatuses: {
          items: localStatuses,
          total: localStatuses.length
        },
        mkbCodes: {
          items: mkbCodes,
          total: mkbCodes.length
        },
        algorithms: {
          items: algorithms,
          total: algorithms.length
        },
        drugs: {
          items: drugs,
          total: drugs.length
        },
        substations: {
          items: substations,
          total: substations.length
        }
      },
      totalItems: localStatuses.length + mkbCodes.length + algorithms.length + drugs.length + substations.length
    }
  } catch (error) {
    console.error('❌ API: Ошибка при получении данных для поиска:', error)
    return { 
      success: false, 
      message: 'Ошибка при получении данных для поиска',
      data: {
        localStatuses: { items: [], total: 0 },
        mkbCodes: { items: [], total: 0 },
        algorithms: { items: [], total: 0 },
        drugs: { items: [], total: 0 },
        substations: { items: [], total: 0 }
      },
      totalItems: 0
    }
  }
})
