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
    
    // Получаем по одному образцу из каждой коллекции
    const [localStatusSample, mkbSample, algorithmSample, drugSample, substationSample] = await Promise.all([
      LocalStatus.findOne({}).populate('category', 'name url').lean().catch((err: any) => {
        console.error('❌ Ошибка получения образца LocalStatus:', err)
        return null
      }),
      MKB.findOne({}).populate('category', 'name url').lean().catch((err: any) => {
        console.error('❌ Ошибка получения образца MKB:', err)
        return null
      }),
      Algorithm.findOne({}).populate('category', 'name url').populate('section', 'name url').lean().catch(err => {
        console.error('❌ Ошибка получения образца Algorithm:', err)
        return null
      }),
      Drug.findOne({}).populate('categories', 'name url').lean().catch((err: any) => {
        console.error('❌ Ошибка получения образца Drug:', err)
        return null
      }),
      Substation.findOne({}).populate('region', 'name').lean().catch((err: any) => {
        console.error('❌ Ошибка получения образца Substation:', err)
        return null
      })
    ])
    
    return {
      success: true,
      samples: {
        localStatus: localStatusSample,
        mkb: mkbSample,
        algorithm: algorithmSample,
        drug: drugSample,
        substation: substationSample
      }
    }
  } catch (error) {
    console.error('❌ Ошибка при получении образцов:', error)
    return { 
      success: false, 
      message: 'Ошибка при получении образцов',
      error: error.message
    }
  }
})
