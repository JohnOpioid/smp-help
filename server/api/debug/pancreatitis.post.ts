import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    const searchTerm = 'панкреатит'
    const regex = new RegExp(searchTerm, 'i')
    
    console.log(`🔍 Проверяем количество записей с "${searchTerm}" в каждой коллекции`)
    
    // Простой поиск по всем полям для каждой коллекции
    const [mkbCount, lsCount, algorithmCount, drugCount, substationCount] = await Promise.all([
      // МКБ - поиск по всем текстовым полям
      MKB.countDocuments({
        $or: [
          { title: regex },
          { description: regex },
          { note: regex },
          { mkbCode: regex },
          { stationCode: regex },
          { synonyms: regex }
        ]
      }),
      
      // Локальные статусы
      LocalStatus.countDocuments({
        $or: [
          { title: regex },
          { description: regex },
          { note: regex },
          { localis: regex },
          { synonyms: regex }
        ]
      }),
      
      // Алгоритмы
      Algorithm.countDocuments({
        $or: [
          { title: regex },
          { description: regex },
          { note: regex },
          { content: regex }
        ]
      }),
      
      // Препараты
      Drug.countDocuments({
        $or: [
          { name: regex },
          { title: regex },
          { description: regex },
          { note: regex },
          { latinName: regex },
          { synonyms: regex },
          { analogs: regex }
        ]
      }),
      
      // Подстанции
      Substation.countDocuments({
        $or: [
          { name: regex },
          { title: regex },
          { description: regex },
          { address: regex },
          { phones: regex }
        ]
      })
    ])
    
    // Получаем примеры записей для каждой коллекции
    const [mkbExamples, lsExamples, algorithmExamples, drugExamples, substationExamples] = await Promise.all([
      MKB.find({
        $or: [
          { title: regex },
          { description: regex },
          { note: regex },
          { mkbCode: regex },
          { stationCode: regex },
          { synonyms: regex }
        ]
      }).limit(5).select('title description note mkbCode').lean(),
      
      LocalStatus.find({
        $or: [
          { title: regex },
          { description: regex },
          { note: regex },
          { localis: regex },
          { synonyms: regex }
        ]
      }).limit(5).select('title description note localis').lean(),
      
      Algorithm.find({
        $or: [
          { title: regex },
          { description: regex },
          { note: regex },
          { content: regex }
        ]
      }).limit(5).select('title description note').lean(),
      
      Drug.find({
        $or: [
          { name: regex },
          { title: regex },
          { description: regex },
          { note: regex },
          { latinName: regex },
          { synonyms: regex },
          { analogs: regex }
        ]
      }).limit(5).select('name title description note latinName').lean(),
      
      Substation.find({
        $or: [
          { name: regex },
          { title: regex },
          { description: regex },
          { address: regex },
          { phones: regex }
        ]
      }).limit(5).select('name title description address').lean()
    ])
    
    const result = {
      searchTerm,
      counts: {
        mkb: mkbCount,
        ls: lsCount,
        algorithm: algorithmCount,
        drug: drugCount,
        substation: substationCount,
        total: mkbCount + lsCount + algorithmCount + drugCount + substationCount
      },
      examples: {
        mkb: mkbExamples,
        ls: lsExamples,
        algorithm: algorithmExamples,
        drug: drugExamples,
        substation: substationExamples
      }
    }
    
    console.log(`🔍 Результаты проверки "${searchTerm}":`, result.counts)
    
    return {
      success: true,
      ...result
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке записей:', error)
    return {
      success: false,
      error: error.message,
      counts: {
        mkb: 0,
        ls: 0,
        algorithm: 0,
        drug: 0,
        substation: 0,
        total: 0
      }
    }
  }
})
