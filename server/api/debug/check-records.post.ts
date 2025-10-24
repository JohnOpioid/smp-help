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
    
    const { ids } = await readBody(event)
    
    if (!ids || !Array.isArray(ids)) {
      return {
        success: false,
        error: 'Необходимо передать массив ID'
      }
    }
    
    console.log(`🔍 Проверяем записи с ID: ${ids.join(', ')}`)
    
    const results = []
    
    for (const id of ids) {
      // Ищем в каждой коллекции
      const [mkbRecord, lsRecord, algorithmRecord, drugRecord, substationRecord] = await Promise.all([
        MKB.findById(id).lean(),
        LocalStatus.findById(id).lean(),
        Algorithm.findById(id).lean(),
        Drug.findById(id).lean(),
        Substation.findById(id).lean()
      ])
      
      const foundRecord = mkbRecord || lsRecord || algorithmRecord || drugRecord || substationRecord
      
      if (foundRecord) {
        let type = 'unknown'
        if (mkbRecord) type = 'mkb'
        else if (lsRecord) type = 'ls'
        else if (algorithmRecord) type = 'algorithm'
        else if (drugRecord) type = 'drug'
        else if (substationRecord) type = 'substation'
        
        results.push({
          id,
          type,
          title: foundRecord.title || foundRecord.name || 'Без названия',
          description: foundRecord.description || '',
          note: foundRecord.note || '',
          mkbCode: foundRecord.mkbCode || '',
          // Проверяем, содержит ли запись слово "панкреатит"
          containsPancreatitis: JSON.stringify(foundRecord).toLowerCase().includes('панкреатит')
        })
      } else {
        results.push({
          id,
          type: 'not_found',
          title: 'Запись не найдена',
          description: '',
          note: '',
          mkbCode: '',
          containsPancreatitis: false
        })
      }
    }
    
    console.log(`🔍 Результаты проверки ID ${ids.join(', ')}:`, results)
    
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
