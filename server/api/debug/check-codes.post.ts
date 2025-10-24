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
    
    const { codes } = await readBody(event)
    
    if (!codes || !Array.isArray(codes)) {
      return {
        success: false,
        error: 'Необходимо передать массив кодов/номеров'
      }
    }
    
    console.log(`🔍 Проверяем записи с кодами: ${codes.join(', ')}`)
    
    const results = []
    
    for (const code of codes) {
      // Ищем в каждой коллекции по различным полям
      const [mkbRecords, lsRecords, algorithmRecords, drugRecords, substationRecords] = await Promise.all([
        MKB.find({
          $or: [
            { mkbCode: code },
            { stationCode: code }
          ]
        }).lean(),
        
        LocalStatus.find({
          $or: [
            { localis: code }
          ]
        }).lean(),
        
        Algorithm.find({}).lean(),
        
        Drug.find({}).lean(),
        
        Substation.find({
          $or: [
            { stationCode: code }
          ]
        }).lean()
      ])
      
      const allRecords = [...mkbRecords, ...lsRecords, ...algorithmRecords, ...drugRecords, ...substationRecords]
      
      if (allRecords.length > 0) {
        for (const record of allRecords) {
          let type = 'unknown'
          if (mkbRecords.includes(record)) type = 'mkb'
          else if (lsRecords.includes(record)) type = 'ls'
          else if (algorithmRecords.includes(record)) type = 'algorithm'
          else if (drugRecords.includes(record)) type = 'drug'
          else if (substationRecords.includes(record)) type = 'substation'
          
          results.push({
            code,
            type,
            id: record._id,
            title: record.title || record.name || 'Без названия',
            description: record.description || '',
            note: record.note || '',
            mkbCode: record.mkbCode || '',
            stationCode: record.stationCode || '',
            localis: record.localis || '',
            // Проверяем, содержит ли запись слово "панкреатит"
            containsPancreatitis: JSON.stringify(record).toLowerCase().includes('панкреатит')
          })
        }
      } else {
        results.push({
          code,
          type: 'not_found',
          id: null,
          title: 'Запись не найдена',
          description: '',
          note: '',
          mkbCode: '',
          stationCode: '',
          localis: '',
          containsPancreatitis: false
        })
      }
    }
    
    console.log(`🔍 Результаты проверки кодов ${codes.join(', ')}:`, results.length, 'записей найдено')
    
    return {
      success: true,
      results
    }
    
  } catch (error) {
    console.error('❌ Ошибка при проверке записей:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
