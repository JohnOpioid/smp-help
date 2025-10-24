import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    const searchTerms = [
      'Острый панкреатит алкогольной этиологии',
      'Острый панкреатит',
      'Хронический панкреатит алкогольной этиологии',
      'Другие хронические панкреатиты'
    ]
    
    console.log(`🔍 Ищем конкретные записи панкреатита в МКБ`)
    
    const results = []
    
    for (const term of searchTerms) {
      // Ищем точное совпадение в заголовке
      const exactMatch = await MKB.findOne({ title: term }).lean()
      
      // Ищем частичное совпадение
      const partialMatches = await MKB.find({
        $or: [
          { title: { $regex: term, $options: 'i' } },
          { description: { $regex: term, $options: 'i' } },
          { note: { $regex: term, $options: 'i' } },
          { mkbCode: { $regex: term, $options: 'i' } }
        ]
      }).lean()
      
      results.push({
        searchTerm: term,
        exactMatch,
        partialMatches: partialMatches.slice(0, 5), // Ограничиваем для читаемости
        totalPartialMatches: partialMatches.length
      })
    }
    
    // Также поищем все записи, содержащие слово "панкреатит"
    const allPancreatitis = await MKB.find({
      $or: [
        { title: { $regex: 'панкреатит', $options: 'i' } },
        { description: { $regex: 'панкреатит', $options: 'i' } },
        { note: { $regex: 'панкреатит', $options: 'i' } },
        { mkbCode: { $regex: 'панкреатит', $options: 'i' } }
      ]
    }).lean()
    
    console.log(`🔍 Найдено записей с "панкреатит": ${allPancreatitis.length}`)
    
    return {
      success: true,
      specificSearches: results,
      allPancreatitisRecords: allPancreatitis.map(record => ({
        id: record._id,
        title: record.title,
        mkbCode: record.mkbCode,
        description: record.description,
        note: record.note
      }))
    }
    
  } catch (error) {
    console.error('❌ Ошибка при поиске панкреатита:', error)
    return {
      success: false,
      error: error.message
    }
  }
})
