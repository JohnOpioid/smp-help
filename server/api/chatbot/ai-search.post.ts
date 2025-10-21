import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import { ollamaAI } from '~/server/utils/ai/ollama-medical-ai'
import MKB from '~/server/models/MKB'
import LocalStatus from '~/server/models/LocalStatus'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'
import Substation from '~/server/models/Substation'
import Fuse from 'fuse.js'

function sortResults(a: any, b: any) {
  const typeWeight: Record<string, number> = { mkb: 1, ls: 2, algorithm: 3, drug: 4, substation: 5 }
  const wa = typeWeight[a.type] || 99
  const wb = typeWeight[b.type] || 99
  if (wa !== wb) return wa - wb
  return a.distance - b.distance
}

// Функция для поиска похожих диагнозов с расширенной логикой (без лимитов поиска)
async function findSimilarDiagnoses(diagnosisTitle: string, mkbCode: string) {
  try {
    console.log('🔍 Поиск похожих диагнозов для:', diagnosisTitle)
    
    let similarDiagnoses: any[] = []
    
    // 1. Извлекаем ключевые слова из диагноза
    const excludeWords = ['болезнь', 'синдром', 'состояние', 'нарушение', 'патология', 'заболевание']
    const keywords = diagnosisTitle.toLowerCase()
      .replace(/[\[\]()]/g, '')
      .split(/[\s,]+/)
      .filter((word: string) => word.length > 3 && !excludeWords.includes(word))
      .slice(0, 4) // Увеличиваем до 4 ключевых слов
    
    console.log('🔑 Ключевые слова:', keywords)
    
    // 2. Ищем по ключевым словам с более гибкими критериями
    if (keywords.length > 0) {
      const allDiagnoses = await MKB.find({
        mkbCode: { $ne: mkbCode } // Исключаем текущий диагноз по МКБ коду
      })
      .populate('category', 'name url')
      .lean()
      
      // Фильтруем по точности совпадения (снижаем до 50% для большего охвата)
      similarDiagnoses = allDiagnoses.filter((diagnosis: any) => {
        const diagnosisText = `${diagnosis.name} ${diagnosis.note || ''}`.toLowerCase()
        const matchedKeywords = keywords.filter(keyword => 
          diagnosisText.includes(keyword)
        )
        
        // Считаем процент совпадения
        const matchPercentage = (matchedKeywords.length / keywords.length) * 100
        
        return matchPercentage >= 50 // Снижаем до 50% для большего охвата
      })
      .sort((a: any, b: any) => {
        // Сортируем по количеству совпавших ключевых слов
        const aMatches = keywords.filter(k => `${a.name} ${a.note || ''}`.toLowerCase().includes(k)).length
        const bMatches = keywords.filter(k => `${b.name} ${b.note || ''}`.toLowerCase().includes(k)).length
        return bMatches - aMatches
      })
      // Убираем лимит для максимального охвата
    }
    
    // 3. Если найдено мало результатов, ищем по более широким критериям
    if (similarDiagnoses.length < 3) {
      console.log('🔍 Расширяем поиск по более широким критериям')
      
      // Ищем по частичным совпадениям ключевых слов
      const broaderKeywords = keywords.slice(0, 2) // Берем только 2 самых важных слова
      
      if (broaderKeywords.length > 0) {
        const broaderResults = await MKB.find({
          mkbCode: { $ne: mkbCode },
          $or: broaderKeywords.map(keyword => ({
            $or: [
              { name: { $regex: keyword, $options: 'i' } },
              { note: { $regex: keyword, $options: 'i' } }
            ]
          }))
        })
        .populate('category', 'name url')
        .lean()
        
        // Добавляем результаты, которых еще нет
        const existingIds = similarDiagnoses.map((d: any) => d._id.toString())
        const newResults = broaderResults.filter((d: any) => !existingIds.includes(d._id.toString()))
        
        similarDiagnoses = [...similarDiagnoses, ...newResults]
      }
    }
    
    // 4. Если все еще мало результатов, ищем по категории
    if (similarDiagnoses.length < 3) {
      console.log('🔍 Ищем по категории')
      
      // Находим категорию текущего диагноза
      const currentDiagnosis = await MKB.findOne({ mkbCode }).populate('category', 'name url').lean()
      if (currentDiagnosis?.category) {
        const categoryResults = await MKB.find({
          mkbCode: { $ne: mkbCode },
          category: currentDiagnosis.category._id
        })
        .populate('category', 'name url')
        // Убираем лимит для максимального охвата
        .lean()
        
        // Добавляем результаты, которых еще нет
        const existingIds = similarDiagnoses.map((d: any) => d._id.toString())
        const newResults = categoryResults.filter((d: any) => !existingIds.includes(d._id.toString()))
        
        similarDiagnoses = [...similarDiagnoses, ...newResults]
      }
    }
    
    // 5. Всегда ищем по МКБ кодам из алгоритмов для максимального охвата
    console.log('🔍 Ищем по МКБ кодам из алгоритмов')
      
      // Ищем алгоритмы, которые содержат текущий МКБ код
      const algorithms = await Algorithm.find({
        $or: [
          { content: { $regex: mkbCode, $options: 'i' } },
          { description: { $regex: mkbCode, $options: 'i' } }
        ]
      }).lean()
      
      if (algorithms.length > 0) {
        // Извлекаем все МКБ коды из найденных алгоритмов
        const mkbCodesFromAlgorithms = new Set<string>()
        
        algorithms.forEach(algo => {
          const content = `${algo.content || ''} ${algo.description || ''}`
          const mkbMatches = content.match(/[A-Z]\d{2}(?:\.\d+)?/g)
          if (mkbMatches) {
            mkbMatches.forEach(code => mkbCodesFromAlgorithms.add(code))
          }
        })
        
        // Ищем диагнозы по найденным МКБ кодам
        if (mkbCodesFromAlgorithms.size > 0) {
          const mkbCodesArray = Array.from(mkbCodesFromAlgorithms).filter(code => code !== mkbCode)
          
          if (mkbCodesArray.length > 0) {
            const algorithmResults = await MKB.find({
              mkbCode: { $in: mkbCodesArray }
            })
            .populate('category', 'name url')
            // Убираем лимит для максимального охвата
            .lean()
            
            // Добавляем результаты, которых еще нет
            const existingIds = similarDiagnoses.map((d: any) => d._id.toString())
            const newResults = algorithmResults.filter((d: any) => !existingIds.includes(d._id.toString()))
            
            similarDiagnoses = [...similarDiagnoses, ...newResults]
            
            console.log('🔍 Найдено МКБ кодов в алгоритмах:', mkbCodesFromAlgorithms.size)
          }
        }
      }
    
    console.log('📊 Найдено похожих диагнозов (≥50%):', similarDiagnoses.length)
    
    return similarDiagnoses
  } catch (error) {
    console.error('Ошибка поиска похожих диагнозов:', error)
    return []
  }
}

// Функция для поиска связанного контента
async function findRelatedContent(diagnosisTitle: string, mkbCode: string) {
  try {
    // Извлекаем ключевые слова из диагноза, исключая общие слова
    const excludeWords = ['болезнь', 'синдром', 'состояние', 'нарушение', 'патология', 'заболевание']
    const keywords = diagnosisTitle.toLowerCase()
      .replace(/[\[\]()]/g, '')
      .split(/[\s,]+/)
      .filter((word: string) => word.length > 3 && !excludeWords.includes(word))
      .slice(0, 3) // Берем только первые 3 ключевых слова для более точного поиска
    
    console.log('🔍 Поиск связанного контента для:', diagnosisTitle)
    console.log('🔑 Ключевые слова:', keywords)
    
    // Ищем алгоритмы по более точным ключевым словам
    let algorithms: any[] = []
    if (keywords.length > 0) {
      algorithms = await Algorithm.find({
        $or: [
          { title: { $regex: keywords.join('|'), $options: 'i' } },
          { description: { $regex: keywords.join('|'), $options: 'i' } },
          { content: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      })
      .populate('section', 'name url')
      .populate('category', 'name url')
      // Убираем лимит для максимального охвата
      .lean()
    }
    
    // Если алгоритмы не найдены по ключевым словам, ищем по МКБ коду
    if (algorithms.length === 0 && mkbCode) {
      console.log('🔍 Ищем алгоритмы по МКБ коду:', mkbCode)
      algorithms = await Algorithm.find({
        $or: [
          { content: { $regex: mkbCode, $options: 'i' } },
          { description: { $regex: mkbCode, $options: 'i' } }
        ]
      })
      .populate('section', 'name url')
      .populate('category', 'name url')
      // Убираем лимит для максимального охвата
      .lean()
    }
    
    // Ищем препараты по ключевым словам
    let drugs: any[] = []
    if (keywords.length > 0) {
      drugs = await Drug.find({
        $or: [
          { name: { $regex: keywords.join('|'), $options: 'i' } },
          { description: { $regex: keywords.join('|'), $options: 'i' } }
        ]
      })
      // Убираем лимит для максимального охвата
      .lean()
    }
    
    console.log('📊 Найдено алгоритмов:', algorithms.length)
    console.log('💊 Найдено препаратов:', drugs.length)
    
    return {
      algorithms,
      drugs
    }
  } catch (error) {
    console.error('Ошибка поиска связанного контента:', error)
    return {
      algorithms: [],
      drugs: []
    }
  }
}

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody<{ query: string, history?: Array<{ role: 'user'|'assistant', text: string, intent?: string }> }>(event)
  const query = (body?.query || '').trim()
  const history = Array.isArray(body?.history) ? body!.history!.slice(-5) : []
  if (!query) return { message: 'Пустой запрос', results: [] }

  console.log('🤖 Ollama AI: Обрабатываем запрос:', query)

  // Детекция запросов на показ конкретного раздела (из быстрых кнопок)
  const queryLower = query.toLowerCase()
  const askAlgo = /показ(ать|и).*алгоритм/i.test(queryLower)
  const askLs = /показ(ать|и).*локальн.*статус/i.test(queryLower)
  const askMkb = /показ(ать|и).*кодификатор|\bмкб\b/i.test(queryLower)
  const askDrug = /показ(ать|и).*препарат/i.test(queryLower)

  // Детекция МКБ кодов и кодов станций
  const mkbCodePattern = /^[A-Z]\d{2}(\.\d+)?$/i
  const isMkbCode = mkbCodePattern.test(query.trim())
  const stationCodePattern = /^\d{4}$/
  const isStationCode = stationCodePattern.test(query.trim())

  // Выделим исходный запрос пользователя из текста после двоеточия
  let effectiveQuery = query
  let originalQuery = query
  if (askAlgo || askLs || askMkb || askDrug) {
    const m = query.match(/:(.+)$/)
    if (m && m[1]) {
      effectiveQuery = m[1].trim()
      originalQuery = m[1].trim()
    } else {
      effectiveQuery = query.replace(/показ(ать|и)[^:]*:?/i, '').trim()
      originalQuery = effectiveQuery
    }
  }

  // ФАЗА 1 — точный поиск Fuse.js по всем типам (как обычный поиск)
  const [mkbFuse, lsFuse, algoFuse, drugFuse, substationFuse] = await Promise.all([
    MKB.find({}, { name: 1, mkbCode: 1, stationCode: 1, note: 1, category: 1 }).populate('category', 'name url').lean(),
    LocalStatus.find({}, { name: 1, description: 1, note: 1, localis: 1, category: 1 }).populate('category', 'name url').lean(),
    Algorithm.find({}, { title: 1, description: 1, content: 1, category: 1, section: 1 }).populate('category', 'name url').populate('section', 'name url').lean(),
    Drug.find({}, { name: 1, latinName: 1, synonyms: 1, description: 1, forms: 1, pediatricDose: 1, pediatricDoseUnit: 1, ageRestrictions: 1 }).lean(),
    Substation.find({}, { name: 1, address: 1, phone: 1, region: 1 }).populate('region', 'name').lean()
  ])

  const fuseItems: any[] = [
    ...mkbFuse.map((i: any) => ({ _id: i._id, type: 'mkb', title: i.name, name: i.name, mkbCode: i.mkbCode, stationCode: i.stationCode, note: i.note, category: i.category })),
    ...lsFuse.map((i: any) => ({ _id: i._id, type: 'ls', title: i.name, name: i.name, description: i.description, note: i.note, localis: i.localis, category: i.category })),
    ...algoFuse.map((i: any) => ({ _id: i._id, type: 'algorithm', title: i.title, description: i.description, content: i.content, category: i.category, section: i.section })),
    ...drugFuse.map((i: any) => ({ 
      _id: i._id, 
      type: 'drug', 
      title: i.name, 
      name: i.name, 
      latinName: i.latinName, 
      synonyms: i.synonyms, 
      synonymsText: Array.isArray(i.synonyms) ? i.synonyms.join(' ') : (i.synonyms || ''), // Добавляем текстовое представление синонимов
      description: i.description, 
      forms: i.forms, 
      pediatricDose: i.pediatricDose, 
      pediatricDoseUnit: i.pediatricDoseUnit, 
      ageRestrictions: i.ageRestrictions 
    })),
    ...substationFuse.map((i: any) => ({ _id: i._id, type: 'substation', title: i.name, name: i.name, address: i.address, phone: i.phone, region: i.region }))
  ]

  const fuse = new Fuse(fuseItems, {
    includeScore: true,
    threshold: 0.35,
    keys: [
      { name: 'title', weight: 0.6 },
      { name: 'name', weight: 0.6 },
      { name: 'latinName', weight: 0.5 },
      { name: 'synonyms', weight: 0.4 },
      { name: 'synonymsText', weight: 0.4 }, // Добавляем текстовое поле синонимов
      { name: 'description', weight: 0.3 },
      { name: 'content', weight: 0.2 },
      { name: 'note', weight: 0.2 },
      { name: 'mkbCode', weight: 0.5 },
      { name: 'address', weight: 0.2 }
    ]
  })
  const fuseResults = fuse.search(effectiveQuery).map(r => ({ ...r.item, score: r.score }))

  console.log('🔍 Fuse результаты:', fuseResults.length)

  // Простое определение намерения без ИИ для ускорения
  let simpleIntent = 'general'
  if (queryLower.includes('мкб') || queryLower.includes('код') || queryLower.includes('диагноз') || isStationCode || isMkbCode) {
    simpleIntent = 'mkb'
  } else if (queryLower.includes('препарат') || queryLower.includes('лекарство') || queryLower.includes('дозировк')) {
    simpleIntent = 'drug'
  } else if (queryLower.includes('алгоритм') || queryLower.includes('лечение') || queryLower.includes('протокол')) {
    simpleIntent = 'algo'
  } else if (queryLower.includes('статус') || queryLower.includes('локалис') || queryLower.includes('описание')) {
    simpleIntent = 'ls'
  } else if (queryLower.includes('подстанц') || queryLower.includes('станция')) {
    simpleIntent = 'substation'
  }

  // Обрабатываем follow-up запросы ПЕРЕД точным поиском (без ИИ для скорости)
  if (askAlgo || askLs || askMkb || askDrug) {
    const selectedSection = askAlgo ? 'algo' : (askLs ? 'ls' : (askMkb ? 'mkb' : 'drug'))
    
    console.log('⚡ Быстрый follow-up поиск для раздела:', selectedSection)
    
    // Извлекаем название диагноза из истории или из предыдущего результата
    let diagnosisName = ''
    if (history && history.length > 0) {
      // Ищем последний AI ответ с диагнозом
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i]
        if (msg.role === 'assistant' && msg.text) {
          // Ищем паттерн диагноза в тексте ответа (разные варианты)
          let diagnosisMatch = null
          
          // 1. Ищем основной диагноз в формате "**диагноз**" (первое вхождение)
          diagnosisMatch = msg.text.match(/\*\*([^*]+?)\*\*/)
          
          // 2. Если не нашли, ищем в формате "По коду станции найден диагноз: **диагноз**"
          if (!diagnosisMatch) {
            diagnosisMatch = msg.text.match(/найден диагноз:\s*\n\*\*([^*]+?)\*\*/)
          }
          
          // 2.1. Если не нашли, ищем в формате "По коду станции найден диагноз: **диагноз**" (без переноса строки)
          if (!diagnosisMatch) {
            diagnosisMatch = msg.text.match(/найден диагноз:\s*\*\*([^*]+?)\*\*/)
          }
          
          // 3. Если не нашли, ищем в формате "— МКБ:"
          if (!diagnosisMatch) {
            diagnosisMatch = msg.text.match(/([^—\n]+?)\s*—\s*МКБ:/)
          }
          
          // 4. Если не нашли, ищем в формате "• диагноз —"
          if (!diagnosisMatch) {
            diagnosisMatch = msg.text.match(/•\s*([^—\n]+?)\s*—/)
          }
          
          // 5. Если не нашли, ищем в формате "1. диагноз —"
          if (!diagnosisMatch) {
            diagnosisMatch = msg.text.match(/\d+\.\s*\*\*([^*]+?)\*\*/)
          }
          
          if (diagnosisMatch) {
            diagnosisName = diagnosisMatch[1].trim()
            // Очищаем от лишних символов и проверяем что это не заголовок
            diagnosisName = diagnosisName.replace(/^🏥\s*/, '').replace(/\(.+?\)$/, '').trim()
            
            // Проверяем что это не заголовок типа "Диагнозы МКБ по запросу"
            if (!diagnosisName.includes('Диагнозы МКБ по запросу') && 
                !diagnosisName.includes('Алгоритмы лечения по запросу') &&
                !diagnosisName.includes('Препараты по запросу') &&
                !diagnosisName.includes('По коду станции') &&
                !diagnosisName.includes('найден диагноз') &&
                diagnosisName.length > 10) {
              console.log('🎯 Извлечен диагноз из истории:', diagnosisName)
              break
            } else {
              diagnosisName = '' // Сбрасываем если это заголовок
            }
          }
        }
      }
    }
    
    // Если не нашли в истории, используем effectiveQuery как fallback
    if (!diagnosisName) {
      // Для follow-up запросов извлекаем исходный запрос пользователя
      if (effectiveQuery && !effectiveQuery.includes('Показать')) {
        diagnosisName = effectiveQuery
      } else {
        // Если effectiveQuery содержит "Показать", ищем в истории пользователя
        for (let i = history.length - 1; i >= 0; i--) {
          const msg = history[i]
          if (msg.role === 'user' && msg.text && !msg.text.includes('Показать')) {
            diagnosisName = msg.text.trim()
            break
          }
        }
      }
      
      // Если все еще не нашли, используем код из запроса
      if (!diagnosisName && effectiveQuery) {
        const codeMatch = effectiveQuery.match(/\d{4}|[A-Z]\d{2}(\.\d+)?/i)
        if (codeMatch) {
          diagnosisName = codeMatch[0]
          console.log('🔢 Используем код из запроса как диагноз:', diagnosisName)
        }
      }
      
      console.log('🔄 Используем fallback диагноз:', diagnosisName)
    }
    
    console.log('📋 Название диагноза для поиска:', diagnosisName)
    
    // Ищем связанный контент по названию диагноза
    // Сначала извлекаем МКБ код из исходного диагноза для более точного поиска
    let mkbCodeForSearch = ''
    if (history && history.length > 0) {
      // Ищем МКБ код в последнем AI ответе
      for (let i = history.length - 1; i >= 0; i--) {
        const msg = history[i]
        if (msg.role === 'assistant' && msg.text) {
          const mkbMatch = msg.text.match(/МКБ код:\s*([A-Z]\d{2}(?:\.\d+)?)/i)
          if (mkbMatch) {
            mkbCodeForSearch = mkbMatch[1]
            console.log('🔍 Найден МКБ код для поиска:', mkbCodeForSearch)
            break
          }
        }
      }
    }
    
    const relatedContent = await findRelatedContent(diagnosisName, mkbCodeForSearch)
    
    // Формируем результаты в зависимости от запрошенного раздела
    let results: any[] = []
    let availableSections: string[] = []
    let similarDiagnoses: any[] = []
    
    if (selectedSection === 'mkb') {
      // Для МКБ ищем по названию диагноза
      let mkbResults = await MKB.find({
        name: { $regex: diagnosisName.replace(/[\[\]()]/g, ''), $options: 'i' }
      })
      .populate('category', 'name url')
      // Убираем лимит для максимального охвата
      .lean()
      
      // Если ничего не найдено, ищем по кодам МКБ/станции из исходного запроса
      if (mkbResults.length === 0 && effectiveQuery) {
        console.log('🔍 Ищем по кодам из исходного запроса:', effectiveQuery)
        
        // Ищем по коду станции
        const stationCodeMatch = effectiveQuery.match(/\d{4}/)
        if (stationCodeMatch) {
          mkbResults = await MKB.find({ stationCode: stationCodeMatch[0] })
          .populate('category', 'name url')
          .limit(5)
          .lean()
        }
        
        // Ищем по МКБ коду
        if (mkbResults.length === 0) {
          const mkbCodeMatch = effectiveQuery.match(/[A-Z]\d{2}(\.\d+)?/i)
          if (mkbCodeMatch) {
            mkbResults = await MKB.find({ mkbCode: mkbCodeMatch[0] })
            .populate('category', 'name url')
            .limit(5)
            .lean()
          }
        }
      }
      
      // Если все еще ничего не найдено, ищем по более точным ключевым словам
      if (mkbResults.length === 0) {
        console.log('🔍 Ищем по более точным ключевым словам')
        
        // Извлекаем более специфичные ключевые слова
        const specificKeywords = diagnosisName.toLowerCase()
          .replace(/[\[\]()]/g, '')
          .split(/[\s,]+/)
          .filter((word: string) => word.length > 4 && 
            !['болезнь', 'синдром', 'состояние', 'нарушение', 'патология', 'заболевание'].includes(word))
          .slice(0, 2) // Берем только 2 самых специфичных слова
        
        if (specificKeywords.length > 0) {
          // Ищем диагнозы, которые содержат ВСЕ ключевые слова
          mkbResults = await MKB.find({
            $and: specificKeywords.map(keyword => ({
              $or: [
                { name: { $regex: keyword, $options: 'i' } },
                { note: { $regex: keyword, $options: 'i' } }
              ]
            }))
          })
          .populate('category', 'name url')
          .limit(5)
          .lean()
        }
      }
      
      // Ищем похожие диагнозы
      if (mkbResults.length > 0) {
        const firstResult = mkbResults[0]
        similarDiagnoses = await findSimilarDiagnoses(firstResult.name, firstResult.mkbCode || '')
      }
      
      results = mkbResults.map((item: any) => ({
        id: String(item._id),
        title: item.name,
        description: item.note || '',
        type: 'mkb',
        url: `/codifier/${item.category?.url}?id=${item._id}`,
        codes: { mkbCode: item.mkbCode, stationCode: item.stationCode },
        category: item.category?.name,
        data: item
      }))
      
      // Добавляем похожие диагнозы к результатам
      if (similarDiagnoses.length > 0) {
        const similarResults = similarDiagnoses.map((item: any) => ({
          id: String(item._id),
          title: item.name,
          description: item.note || '',
          type: 'mkb',
          url: `/codifier/${item.category?.url}?id=${item._id}`,
          codes: { mkbCode: item.mkbCode, stationCode: item.stationCode },
          category: item.category?.name,
          data: item,
          isSimilar: true // Помечаем как похожий диагноз
        }))
        
        // Объединяем основные и похожие результаты
        results = [...results, ...similarResults]
      }
      
      availableSections = ['mkb']
    } else if (selectedSection === 'algo') {
      // Для алгоритмов используем найденные алгоритмы
      let algoResults = relatedContent.algorithms
      
      console.log('🔍 Начальное количество алгоритмов:', algoResults.length)
      
      // Если ничего не найдено, ищем по частичным совпадениям
      if (algoResults.length === 0) {
        console.log('🔍 Алгоритмы не найдены, ищем по частичным совпадениям')
        
        // Сначала ищем по МКБ кодам из исходного запроса и истории
        const mkbCodesToSearch = []
        
        // Извлекаем МКБ код из исходного запроса
        if (effectiveQuery) {
          const mkbCodeMatch = effectiveQuery.match(/[A-Z]\d{2}(\.\d+)?/i)
          if (mkbCodeMatch) {
            mkbCodesToSearch.push(mkbCodeMatch[0])
          }
        }
        
        // Извлекаем МКБ код из истории
        if (history && history.length > 0) {
          for (let i = history.length - 1; i >= 0; i--) {
            const msg = history[i]
            if (msg.role === 'assistant' && msg.text) {
              const mkbMatch = msg.text.match(/МКБ код:\s*([A-Z]\d{2}(?:\.\d+)?)/i)
              if (mkbMatch && !mkbCodesToSearch.includes(mkbMatch[1])) {
                mkbCodesToSearch.push(mkbMatch[1])
              }
            }
          }
        }
        
        // Ищем алгоритмы по всем найденным МКБ кодам
        if (mkbCodesToSearch.length > 0) {
          console.log('🔍 Ищем алгоритмы по МКБ кодам:', mkbCodesToSearch)
          const mkbAlgoResults = await Algorithm.find({
            $or: mkbCodesToSearch.map(code => ({
              $or: [
                { content: { $regex: code, $options: 'i' } },
                { description: { $regex: code, $options: 'i' } }
              ]
            }))
          })
          .populate('section', 'name url')
          .populate('category', 'name url')
          .limit(10) // Увеличиваем лимит для большего охвата
          .lean()
          
          if (mkbAlgoResults.length > 0) {
            algoResults = mkbAlgoResults
            console.log('✅ Найдено алгоритмов по МКБ кодам:', mkbAlgoResults.length)
          }
        }
        
        // Если все еще ничего не найдено, ищем по ключевым словам
        if (algoResults.length === 0) {
          // Извлекаем более специфичные ключевые слова из диагноза
          const specificKeywords = diagnosisName.toLowerCase()
            .replace(/[\[\]()]/g, '')
            .split(/[\s,]+/)
            .filter((word: string) => word.length > 4 && 
              !['болезнь', 'синдром', 'состояние', 'нарушение', 'патология', 'заболевание'].includes(word))
            .slice(0, 2) // Берем только 2 самых специфичных слова
          
          if (specificKeywords.length > 0) {
            // Ищем алгоритмы, которые содержат ВСЕ ключевые слова
            const directAlgoResults = await Algorithm.find({
              $and: specificKeywords.map(keyword => ({
                $or: [
                  { title: { $regex: keyword, $options: 'i' } },
                  { description: { $regex: keyword, $options: 'i' } },
                  { content: { $regex: keyword, $options: 'i' } }
                ]
              }))
            })
            .populate('section', 'name url')
            .populate('category', 'name url')
            .limit(5)
            .lean()
            
            algoResults = directAlgoResults
          }
        }
      }
      
      results = algoResults.map((algo: any) => ({
        id: String(algo._id),
        title: algo.title,
        description: algo.description || algo.content?.substring(0, 200) || '',
        type: 'algorithm',
        url: `/algorithms/${algo.section?.url}/${algo.category?.url}/${algo._id}`,
        category: algo.category?.name,
        section: algo.section?.name,
        data: algo
      }))
      availableSections = ['algo']
    } else if (selectedSection === 'drug') {
      // Для препаратов используем найденные препараты
      results = relatedContent.drugs.map((drug: any) => ({
        id: String(drug._id),
        title: drug.name,
        description: drug.description || '',
        type: 'drug',
        url: `/drugs/${drug._id}`,
        latinName: drug.latinName,
        forms: drug.forms,
        data: drug
      }))
      availableSections = ['drug']
    }
        
        // Формируем информативное сообщение
    let followUpMessage = ''
    
    if (selectedSection === 'mkb') {
      const totalDiagnoses = results.length
      followUpMessage = `**Диагнозы МКБ по запросу "${diagnosisName}":**\n\nНайдено ${totalDiagnoses} диагнозов:`
    } else if (selectedSection === 'algo') {
      followUpMessage = `**Алгоритмы лечения по запросу "${diagnosisName}":**\n\nНайдено ${results.length} алгоритмов:`
    } else if (selectedSection === 'drug') {
      followUpMessage = `**Препараты по запросу "${diagnosisName}":**\n\nНайдено ${results.length} препаратов:`
    }
        
        // Не добавляем детальную информацию о похожих диагнозах в текст,
        // так как они уже отображаются в блоках результатов
        
        return {
      message: followUpMessage,
      results,
      fullResults: {
        mkb: selectedSection === 'mkb' ? results : [],
        ls: [],
        algo: selectedSection === 'algo' ? results : [],
        drug: selectedSection === 'drug' ? results : [],
        substation: []
      },
      forceExpand: selectedSection,
      intent: selectedSection,
      availableSections,
      clarifyingQuestions: [],
      aiIntent: selectedSection,
      aiConfidence: 1.0
    }
  }

  // Точный поиск по кодам станций и МКБ (приоритет над AI анализом)
  if (isStationCode || isMkbCode) {
    console.log('🎯 Точный поиск по коду:', effectiveQuery)
    
    let exactResults: any[] = []
    
    if (isStationCode) {
      // Точный поиск по коду станции
      const stationCode = effectiveQuery.trim()
      const exactMkb = await MKB.find({ stationCode }).populate('category', 'name url').lean()
      exactResults = exactMkb.map((i: any) => ({ 
        _id: i._id, 
        type: 'mkb', 
        title: i.name, 
        name: i.name, 
        mkbCode: i.mkbCode, 
        stationCode: i.stationCode, 
        note: i.note, 
        category: i.category 
      }))
    } else if (isMkbCode) {
      // Точный поиск по МКБ коду
      const mkbCode = effectiveQuery.trim()
      const exactMkb = await MKB.find({ mkbCode }).populate('category', 'name url').lean()
      exactResults = exactMkb.map((i: any) => ({ 
        _id: i._id, 
        type: 'mkb', 
        title: i.name, 
        name: i.name, 
        mkbCode: i.mkbCode, 
        stationCode: i.stationCode, 
        note: i.note, 
        category: i.category 
      }))
    }
    
    if (exactResults.length > 0) {
      console.log('✅ Найдено точных совпадений:', exactResults.length)
      
      let results = exactResults.map((item: any) => ({
        id: String(item._id),
        title: item.title,
        description: item.note || '',
        type: 'mkb',
        url: `/codifier/${item.category?.url}?id=${item._id}`,
        codes: { mkbCode: item.mkbCode, stationCode: item.stationCode },
        category: item.category?.name,
        data: item
      }))
      
      // Ищем похожие диагнозы
      const firstResult = exactResults[0]
      const similarDiagnoses = await findSimilarDiagnoses(firstResult.title, firstResult.mkbCode)
      
      // Добавляем похожие диагнозы к результатам
      if (similarDiagnoses.length > 0) {
        const similarResults = similarDiagnoses.map((item: any) => ({
          id: String(item._id),
          title: item.name,
          description: item.note || '',
          type: 'mkb',
          url: `/codifier/${item.category?.url}?id=${item._id}`,
          codes: { mkbCode: item.mkbCode, stationCode: item.stationCode },
          category: item.category?.name,
          data: item,
          isSimilar: true // Помечаем как похожий диагноз
        }))
        
        // Объединяем основные и похожие результаты
        results = [...results, ...similarResults]
      }
      
      // Создаем краткое информативное сообщение
      const totalDiagnoses = results.length
      let message = `По коду станции "${effectiveQuery}" найден диагноз:\n\n`
      message += `**${firstResult.title}**\n`
      message += `• МКБ код: ${firstResult.mkbCode}\n`
      message += `• Код станции: ${firstResult.stationCode}\n`
      if (firstResult.note) {
        message += `• Описание: ${firstResult.note}\n`
      }
      
      if (similarDiagnoses.length > 0) {
        message += `\n\nНайдено ${totalDiagnoses} диагнозов (включая похожие):`
      }
      
      // Ищем связанный контент по всему диагнозу
      const relatedContent = await findRelatedContent(firstResult.title, firstResult.mkbCode)
      if (relatedContent.algorithms.length > 0 || relatedContent.drugs.length > 0) {
        message += `\n📋 **Связанный контент:**\n`
        if (relatedContent.algorithms.length > 0) {
          message += `• Найдено алгоритмов: ${relatedContent.algorithms.length}\n`
        }
        if (relatedContent.drugs.length > 0) {
          message += `• Найдено препаратов: ${relatedContent.drugs.length}\n`
        }
      }
      
      // Подготавливаем связанный контент
      const availableSections = ['mkb']
      
      if (relatedContent.algorithms.length > 0) {
        availableSections.push('algo')
      }
      
      if (relatedContent.drugs.length > 0) {
        availableSections.push('drug')
      }
      
      return {
        message,
        results,
        fullResults: {
          mkb: results,
          ls: [],
          algo: relatedContent.algorithms.map((algo: any) => ({
            id: String(algo._id),
            title: algo.title,
            description: algo.description || algo.content?.substring(0, 200) || '',
            type: 'algorithm',
            url: `/algorithms/${algo.section?.url}/${algo.category?.url}/${algo._id}`,
            category: algo.category?.name,
            section: algo.section?.name,
            data: algo
          })),
          drug: relatedContent.drugs.map((drug: any) => ({
            id: String(drug._id),
            title: drug.name,
            description: drug.description || '',
            type: 'drug',
            url: `/drugs/${drug._id}`,
            latinName: drug.latinName,
            forms: drug.forms,
            data: drug
          })),
          substation: []
        },
        forceExpand: null,
        intent: 'mkb',
        availableSections,
        clarifyingQuestions: [],
        aiIntent: 'mkb',
        aiConfidence: 1.0
      }
    }
  }

  // Используем ИИ только для сложных запросов или когда есть хорошие результаты Fuse
  const shouldUseAI = fuseResults.length > 0 && fuseResults.some(r => r.score < 0.4) && !isStationCode && !isMkbCode
  
  if (shouldUseAI) {
    console.log('🤖 Используем ИИ для анализа результатов')
    const aiResponse = await ollamaAI.analyzeQuery(query, fuseResults, history)
    console.log('🤖 Ollama AI ответ получен:', aiResponse.message)
    return aiResponse
  } else {
    console.log('⚡ Используем быстрый режим без ИИ')
    // Простой ответ на основе результатов Fuse
    const results = fuseResults.map(item => ({
      id: String(item._id),
      title: item.title || item.name,
      description: item.description || item.note || '',
      type: item.type,
      url: item.type === 'mkb' ? `/codifier/${item.category?.url}?id=${item._id}` : 
           item.type === 'algorithm' ? `/algorithms/${item.section?.url}/${item.category?.url}/${item._id}` :
           item.type === 'drug' ? `/drugs/${item._id}` : '',
      codes: item.mkbCode ? { mkbCode: item.mkbCode, stationCode: item.stationCode } : undefined,
      category: item.category?.name,
      data: item
    }))

    let message = `По запросу "${query}" найдено ${results.length} результатов:`
    if (results.length > 0) {
      message += `\n\n**${results[0].title}**`
      if (results[0].codes?.mkbCode) message += ` — МКБ: ${results[0].codes.mkbCode}`
      if (results[0].codes?.stationCode) message += `; Станция: ${results[0].codes.stationCode}`
    }

    return {
    message,
      results: results.slice(0, 5),
      fullResults: {
        mkb: results.filter(r => r.type === 'mkb'),
        ls: results.filter(r => r.type === 'ls'),
        algo: results.filter(r => r.type === 'algorithm'),
        drug: results.filter(r => r.type === 'drug'),
        substation: results.filter(r => r.type === 'substation')
      },
      forceExpand: null,
      intent: simpleIntent,
      availableSections: [...new Set(results.map(r => r.type === 'algorithm' ? 'algo' : r.type))],
      clarifyingQuestions: [],
      aiIntent: simpleIntent,
      aiConfidence: 0.8
    }
  }
})