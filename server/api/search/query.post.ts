import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'

export default defineEventHandler(async (event) => {
  try {
    const { query, limit = 50 } = await readBody(event)
    
    if (!query || query.trim().length < 3) {
      return {
        success: true,
        results: [],
        groupedResults: {
          mkb: [],
          ls: [],
          algorithm: [],
          drug: [],
          substation: []
        },
        totalResults: 0,
        query: query || ''
      }
    }

    await connectDB()
    
    const searchQuery = query.trim()
    const searchRegex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    
    // Параллельно выполняем поиск по всем коллекциям
    const [mkbResults, lsResults, algorithmResults, drugResults, substationResults] = await Promise.all([
      // Поиск по МКБ
      MKB.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { note: searchRegex },
          { mkbCode: searchRegex },
          { stationCode: searchRegex },
          { synonyms: { $in: [searchRegex] } }
        ]
      })
      .populate('category', 'name url')
      .limit(limit)
      .lean(),
      
      // Поиск по локальным статусам
      LocalStatus.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { note: searchRegex },
          { localis: searchRegex },
          { synonyms: { $in: [searchRegex] } }
        ]
      })
      .populate('category', 'name url')
      .limit(limit)
      .lean(),
      
      // Поиск по алгоритмам
      Algorithm.find({
        $or: [
          { title: searchRegex },
          { description: searchRegex },
          { note: searchRegex },
          { content: searchRegex }
        ]
      })
      .populate('category', 'name url')
      .populate('section', 'name url')
      .limit(limit)
      .lean(),
      
      // Поиск по препаратам
      Drug.find({
        $or: [
          { name: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
          { note: searchRegex },
          { latinName: searchRegex },
          { synonyms: { $in: [searchRegex] } },
          { analogs: { $in: [searchRegex] } }
        ]
      })
      .populate('categories', 'name url')
      .limit(limit)
      .lean(),
      
      // Поиск по подстанциям
      Substation.find({
        $or: [
          { name: searchRegex },
          { title: searchRegex },
          { description: searchRegex },
          { address: searchRegex },
          { phones: { $in: [searchRegex] } }
        ]
      })
      .populate('region', 'name')
      .limit(limit)
      .lean()
    ])

    // Добавляем тип к каждому результату
    const mkbWithType = mkbResults.map(item => ({ ...item, type: 'mkb' }))
    const lsWithType = lsResults.map(item => ({ ...item, type: 'ls' }))
    const algorithmWithType = algorithmResults.map(item => ({ ...item, type: 'algorithm' }))
    const drugWithType = drugResults.map(item => ({ ...item, type: 'drug' }))
    const substationWithType = substationResults.map(item => ({ ...item, type: 'substation' }))

    // Объединяем все результаты
    const allResults = [
      ...mkbWithType,
      ...lsWithType,
      ...algorithmWithType,
      ...drugWithType,
      ...substationWithType
    ]

    // Группируем результаты
    const groupedResults = {
      mkb: mkbWithType,
      ls: lsWithType,
      algorithm: algorithmWithType,
      drug: drugWithType,
      substation: substationWithType
    }

    return {
      success: true,
      results: allResults,
      groupedResults,
      totalResults: allResults.length,
      query: searchQuery,
      timestamp: Date.now()
    }

  } catch (error) {
    console.error('❌ Ошибка серверного поиска:', error)
    return {
      success: false,
      results: [],
      groupedResults: {
        mkb: [],
        ls: [],
        algorithm: [],
        drug: [],
        substation: []
      },
      totalResults: 0,
      query: '',
      error: 'Ошибка при выполнении поиска'
    }
  }
})
