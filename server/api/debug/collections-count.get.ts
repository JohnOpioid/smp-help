import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    // Получаем количество записей в каждой коллекции
    const [localStatusesCount, mkbCount, algorithmsCount, drugsCount, substationsCount] = await Promise.all([
      LocalStatus.countDocuments({}).catch((err: any) => {
        console.error('❌ Ошибка подсчета LocalStatus:', err)
        return 0
      }),
      MKB.countDocuments({}).catch((err: any) => {
        console.error('❌ Ошибка подсчета MKB:', err)
        return 0
      }),
      Algorithm.countDocuments({}).catch((err: any) => {
        console.error('❌ Ошибка подсчета Algorithm:', err)
        return 0
      }),
      Drug.countDocuments({}).catch((err: any) => {
        console.error('❌ Ошибка подсчета Drug:', err)
        return 0
      }),
      Substation.countDocuments({}).catch((err: any) => {
        console.error('❌ Ошибка подсчета Substation:', err)
        return 0
      })
    ])
    
    return {
      success: true,
      collections: {
        localStatuses: localStatusesCount,
        mkb: mkbCount,
        algorithms: algorithmsCount,
        drugs: drugsCount,
        substations: substationsCount
      },
      total: localStatusesCount + mkbCount + algorithmsCount + drugsCount + substationsCount
    }
  } catch (error) {
    console.error('❌ Ошибка при проверке коллекций:', error)
    return { 
      success: false, 
      message: 'Ошибка при проверке коллекций',
      error: error.message
    }
  }
})
