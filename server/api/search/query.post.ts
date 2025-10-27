import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import MKB from '~/server/models/MKB'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'
import AlgorithmSection from '~/server/models/AlgorithmSection'
import Drug from '~/server/models/Drug'
import DrugCategory from '~/server/models/DrugCategory'
import Substation from '~/server/models/Substation'
import Calculator from '~/server/models/Calculator'

export default defineEventHandler(async (event) => {
  let query = '' // Объявляем переменную в начале функции
  
  try {
    const { query: requestQuery, limit = 50 } = await readBody(event)
    query = requestQuery // Присваиваем значение
    
    // Логирование отключено для производительности
    
    if (!query || typeof query !== 'string' || query.trim().length < 3) {
      return {
        success: true,
        results: [],
        groupedResults: {
          mkb: [],
          ls: [],
          algorithm: [],
          drug: [],
          substation: [],
          calculator: []
        },
        totalResults: 0,
        query: query || ''
      }
    }

    await connectDB()
    
    const searchQuery = query.trim()
    
    // Создаем различные варианты поискового запроса для более гибкого поиска
    const createSearchPatterns = (query: string) => {
      const patterns = []
      
      // Оригинальный запрос
      patterns.push(query)
      
      // Убираем лишние пробелы
      patterns.push(query.replace(/\s+/g, ' ').trim())
      
      // Логирование отключено для производительности
      
      // Для подстанций: "32 подстанция" -> "подстанция № 32", "подстанция 32"
      if (/^\d+\s+подстанция/i.test(query)) {
        const match = query.match(/^(\d+)\s+подстанция/i)
        if (match) {
          const number = match[1]
          patterns.push(`подстанция № ${number}`)
          patterns.push(`подстанция ${number}`)
          patterns.push(`подстанция${number}`)
          patterns.push(`${number} подстанция`)
          patterns.push(`${number} подстанции`)
          // Добавляем только номер для поиска в кодах станций
          patterns.push(number)
        }
      }
      
      // Обратный поиск: "подстанция № 32" -> "32 подстанция"
      if (/подстанция\s*№?\s*\d+/i.test(query)) {
        const match = query.match(/подстанция\s*№?\s*(\d+)/i)
        if (match) {
          const number = match[1]
          patterns.push(`${number} подстанция`)
          patterns.push(`${number} подстанции`)
          patterns.push(number)
        }
      }
      
      // Для МКБ: "I10 гипертония" -> "гипертония I10"
      if (/^[A-Z]\d+\s+\w+/i.test(query)) {
        const match = query.match(/^([A-Z]\d+)\s+(.+)/i)
        if (match) {
          patterns.push(`${match[2]} ${match[1]}`)
        }
      }
      
      // Разбиваем на слова и создаем комбинации
      const words = query.split(/\s+/).filter(word => word.length > 0)
      if (words.length > 1) {
        // Все слова в обратном порядке
        patterns.push(words.reverse().join(' '))
        // Комбинации без некоторых слов
        for (let i = 0; i < words.length; i++) {
          const withoutWord = words.filter((_, index) => index !== i).join(' ')
          if (withoutWord.trim()) {
            patterns.push(withoutWord)
          }
        }
      }
      
      return [...new Set(patterns)] // Убираем дубликаты
    }
    
    const searchPatterns = createSearchPatterns(searchQuery)
    
    // Логирование отключено для производительности
    
    // Создаем регулярные выражения для каждого паттерна
    const searchRegexes = searchPatterns.map(pattern => 
      new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    )
    
    
    // Создаем основной поисковый запрос для точного поиска
    const mainSearchRegex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
    
    // Функция для определения приоритета результата
    const getResultPriority = (item: any, query: string, patterns: string[]) => {
      let priority = 0
      const searchFields = ['title', 'name', 'description', 'note', 'content', 'mkbCode', 'stationCode', 'localis', 'latinName', 'synonyms', 'analogs', 'address', 'phones', 'category', 'keywords']
      const queryLower = query.toLowerCase()
      
      // Специальная обработка для калькуляторов с keywords
      if (item.type === 'calculator' && item.keywords && Array.isArray(item.keywords)) {
        const keywords = item.keywords.join(' ').toLowerCase()
        if (keywords.includes(queryLower)) {
          priority += 5000 // Очень высокий приоритет для совпадения в keywords
        }
        // Также проверяем каждое ключевое слово отдельно
        item.keywords.forEach((keyword: string) => {
          if (keyword.toLowerCase() === queryLower.trim()) {
            priority += 8000 // Максимальный приоритет для точного совпадения ключевого слова
          } else if (keyword.toLowerCase().includes(queryLower.trim())) {
            priority += 3000 // Высокий приоритет для частичного совпадения
          }
        })
      }
      
      // Специальная обработка для подстанций с номерами
      if (item.type === 'substation' && /^\d+\s+подстанция/i.test(query)) {
        const match = query.match(/^(\d+)\s+подстанция/i)
        if (match) {
          const number = match[1]
          const name = String(item.name || item.title || '').toLowerCase()
          
          // Максимальный приоритет для точного совпадения номера подстанции
          if (name.includes(`подстанция № ${number}`) || 
              name.includes(`подстанция ${number}`) ||
              name.includes(`подстанция${number}`) ||
              name.includes(`${number} подстанция`)) {
            priority += 50000 // Максимальный приоритет для точного совпадения
          }
          
          // Высокий приоритет для частичного совпадения номера
          else if (name.includes(number)) {
            priority += 10000
          }
        }
      }
      
      for (const field of searchFields) {
        if (item[field]) {
          const fieldValue = String(item[field]).toLowerCase()
          
          // Точное совпадение в заголовке/названии
          if ((field === 'title' || field === 'name') && fieldValue.includes(queryLower)) {
            priority += 1000
          }
          
          // Начинается с запроса (еще выше приоритет)
          if ((field === 'title' || field === 'name') && fieldValue.startsWith(queryLower)) {
            priority += 2000
          }
          
          // Точное совпадение в других полях
          if (fieldValue.includes(queryLower)) {
            priority += 100
          }
          
          // Совпадение с паттернами
          for (const pattern of patterns) {
            if (fieldValue.includes(pattern.toLowerCase())) {
              priority += 50
            }
          }
        }
      }
      
      return priority
    }
    
    // Параллельно выполняем поиск по всем коллекциям
    // Логирование MongoDB запроса для МКБ
    const mkbQuery = {
      $or: [
        // Приоритет 1: Точный поиск в названиях
        { name: mainSearchRegex },
        // Приоритет 2: Расширенный поиск в названиях
        { name: { $in: searchRegexes } },
        // Приоритет 3: Точный поиск в остальных полях
        { description: mainSearchRegex },
        { note: mainSearchRegex },
        { mkbCode: mainSearchRegex },
        { stationCode: mainSearchRegex },
        { synonyms: mainSearchRegex },
        // Приоритет 4: Расширенный поиск в остальных полях
        { description: { $in: searchRegexes } },
        { note: { $in: searchRegexes } },
        { mkbCode: { $in: searchRegexes } },
        { stationCode: { $in: searchRegexes } },
        { synonyms: { $in: searchRegexes } }
      ]
    }
    
    const [mkbResults, lsResults, algorithmResults, drugResults, substationResults, calculatorResults] = await Promise.all([
      // Поиск по МКБ - сначала точный поиск в заголовках, потом в остальных полях
      MKB.find(mkbQuery)
      .populate('category', 'name url')
      .lean(),
      
      // Поиск по локальным статусам
      LocalStatus.find({
        $or: [
          // Приоритет 1: Точный поиск в названиях
          { name: mainSearchRegex },
          // Приоритет 2: Расширенный поиск в названиях
          { name: { $in: searchRegexes } },
          // Приоритет 3: Точный поиск в остальных полях
          { description: mainSearchRegex },
          { note: mainSearchRegex },
          { localis: mainSearchRegex },
          { code: mainSearchRegex },
          { stationCode: mainSearchRegex },
          { complaints: mainSearchRegex },
          { anamnesis: mainSearchRegex },
          // Приоритет 4: Расширенный поиск в остальных полях
          { description: { $in: searchRegexes } },
          { note: { $in: searchRegexes } },
          { localis: { $in: searchRegexes } },
          { code: { $in: searchRegexes } },
          { stationCode: { $in: searchRegexes } },
          { complaints: { $in: searchRegexes } },
          { anamnesis: { $in: searchRegexes } }
        ]
      })
      .populate('category', 'name url')
      .lean(),
      
      // Поиск по алгоритмам
      Algorithm.find({
        $or: [
          // Приоритет 1: Точный поиск в заголовках
          { title: mainSearchRegex },
          // Приоритет 2: Расширенный поиск в заголовках
          { title: { $in: searchRegexes } },
          // Приоритет 3: Точный поиск в остальных полях
          { description: mainSearchRegex },
          { note: mainSearchRegex },
          { content: mainSearchRegex },
          { mkbCodes: mainSearchRegex },
          { mkbExclusions: mainSearchRegex },
          // Приоритет 4: Расширенный поиск в остальных полях
          { description: { $in: searchRegexes } },
          { note: { $in: searchRegexes } },
          { content: { $in: searchRegexes } },
          { mkbCodes: { $in: searchRegexes } },
          { mkbExclusions: { $in: searchRegexes } }
        ]
      })
      .lean(),
      
      // Поиск по препаратам
      Drug.find({
        $or: [
          // Приоритет 1: Точный поиск в названиях
          { name: mainSearchRegex },
          { title: mainSearchRegex },
          // Приоритет 2: Расширенный поиск в названиях
          { name: { $in: searchRegexes } },
          { title: { $in: searchRegexes } },
          // Приоритет 3: Точный поиск в остальных полях
          { description: mainSearchRegex },
          { note: mainSearchRegex },
          { latinName: mainSearchRegex },
          { synonyms: mainSearchRegex },
          { analogs: mainSearchRegex },
          { groups: mainSearchRegex },
          { mechanism: mainSearchRegex },
          { indications: mainSearchRegex },
          { contraindications: mainSearchRegex },
          { adverse: mainSearchRegex },
          { interactions: mainSearchRegex },
          { antidotes: mainSearchRegex },
          // Приоритет 4: Расширенный поиск в остальных полях
          { description: { $in: searchRegexes } },
          { note: { $in: searchRegexes } },
          { latinName: { $in: searchRegexes } },
          { synonyms: { $in: searchRegexes } },
          { analogs: { $in: searchRegexes } },
          { groups: { $in: searchRegexes } },
          { mechanism: { $in: searchRegexes } },
          { indications: { $in: searchRegexes } },
          { contraindications: { $in: searchRegexes } },
          { adverse: { $in: searchRegexes } },
          { interactions: { $in: searchRegexes } },
          { antidotes: { $in: searchRegexes } }
        ]
      })
      // Временно убираем populate для избежания ошибки DrugCategory
      // .populate('categories', 'name url')
      // Лимит убран для получения всех результатов
      .lean(),
      
      // Поиск по подстанциям - особый случай для точного поиска номеров
      Substation.find({
        $or: [
          // Приоритет 1: Точный поиск в названиях подстанций
          { name: mainSearchRegex },
          { title: mainSearchRegex },
          // Приоритет 2: Расширенный поиск в названиях подстанций
          { name: { $in: searchRegexes } },
          { title: { $in: searchRegexes } },
          // Приоритет 3: Поиск по коду станции (если есть поле stationCode)
          { stationCode: mainSearchRegex },
          { stationCode: { $in: searchRegexes } },
          // Приоритет 4: Точный поиск в остальных полях
          { description: mainSearchRegex },
          { address: mainSearchRegex },
          { phones: mainSearchRegex },
          // Приоритет 5: Расширенный поиск в остальных полях
          { description: { $in: searchRegexes } },
          { address: { $in: searchRegexes } },
          { phones: { $in: searchRegexes } }
        ]
      })
      // Временно убираем populate для избежания ошибки LocalStatusCategory
      // .populate('region', 'name')
      // Лимит убран для получения всех результатов
      .lean(),

      // Поиск по калькуляторам
      Calculator.find({
        $or: [
          // Приоритет 1: Точный поиск в названиях
          { name: mainSearchRegex },
          // Приоритет 2: Расширенный поиск в названиях
          { name: { $in: searchRegexes } },
          // Приоритет 3: Поиск по отдельным словам в названии
          { name: { $regex: new RegExp(searchQuery.split(/\s+/).join('|'), 'i') } },
          // Приоритет 4: Точный поиск в остальных полях
          { description: mainSearchRegex },
          { category: mainSearchRegex },
          // Приоритет 5: Поиск по keywords как массиву строк (ВАЖНО!)
          { keywords: { $elemMatch: { $regex: mainSearchRegex } } },
          // Приоритет 6: Расширенный поиск в остальных полях
          { description: { $in: searchRegexes } },
          { category: { $in: searchRegexes } }
        ]
      })
      .lean()
    ])
    

    // Добавляем тип и приоритет к каждому результату
    const mkbWithType = mkbResults.map((item: any) => ({ 
      ...item, 
      type: 'mkb',
      priority: getResultPriority(item, searchQuery, searchPatterns)
    }))
    const lsWithType = lsResults.map((item: any) => ({ 
      ...item, 
      type: 'ls',
      priority: getResultPriority(item, searchQuery, searchPatterns)
    }))
    // Получаем названия и URL для алгоритмов
    const algorithmWithType = await Promise.all(algorithmResults.map(async (item: any) => {
      // Загружаем данные категории и секции
      const [category, section] = await Promise.all([
        AlgorithmCategory.findById(item.category).lean().catch(() => null),
        AlgorithmSection.findById(item.section).lean().catch(() => null)
      ])
      
      return {
        ...item,
        type: 'algorithm',
        priority: getResultPriority(item, searchQuery, searchPatterns),
        // Добавляем названия для хлебных крошек
        categoryName: (category as any)?.name || '',
        categoryUrl: (category as any)?.url || '',
        sectionName: (section as any)?.name || '',
        sectionUrl: (section as any)?.url || ''
      }
    }))
    const drugWithType = drugResults.map((item: any) => ({ 
      ...item, 
      type: 'drug',
      priority: getResultPriority(item, searchQuery, searchPatterns)
    }))
    const substationWithType = substationResults.map((item: any) => ({ 
      ...item, 
      type: 'substation',
      priority: getResultPriority(item, searchQuery, searchPatterns)
    }))
    const calculatorWithType = calculatorResults.map((item: any) => ({ 
      ...item, 
      type: 'calculator',
      priority: getResultPriority(item, searchQuery, searchPatterns)
    }))
    
    
    
    // Сортируем результаты по приоритету (по убыванию)
    const sortedResults = [
      ...mkbWithType,
      ...lsWithType,
      ...algorithmWithType,
      ...drugWithType,
      ...substationWithType,
      ...calculatorWithType
    ].sort((a, b) => b.priority - a.priority)
    
    // Объединяем все результаты
    const allResults = sortedResults
    

    // Группируем отсортированные результаты
    const groupedResults = {
      mkb: sortedResults.filter(item => item.type === 'mkb'),
      ls: sortedResults.filter(item => item.type === 'ls'),
      algorithm: sortedResults.filter(item => item.type === 'algorithm'),
      drug: sortedResults.filter(item => item.type === 'drug'),
      substation: sortedResults.filter(item => item.type === 'substation'),
      calculator: sortedResults.filter(item => item.type === 'calculator')
    }
    
    
    // Дополнительная сортировка внутри группы подстанций для точных совпадений
    if (/^\d+\s+подстанция/i.test(searchQuery)) {
      const match = searchQuery.match(/^(\d+)\s+подстанция/i)
      if (match) {
        const targetNumber = match[1]
        groupedResults.substation.sort((a, b) => {
          const aName = String(a.name || a.title || '').toLowerCase()
          const bName = String(b.name || b.title || '').toLowerCase()
          
          const aExactMatch = aName.includes(`подстанция № ${targetNumber}`) || 
                              aName.includes(`подстанция ${targetNumber}`) ||
                              aName.includes(`подстанция${targetNumber}`) ||
                              aName.includes(`${targetNumber} подстанция`)
          
          const bExactMatch = bName.includes(`подстанция № ${targetNumber}`) || 
                              bName.includes(`подстанция ${targetNumber}`) ||
                              bName.includes(`подстанция${targetNumber}`) ||
                              bName.includes(`${targetNumber} подстанция`)
          
          // Точные совпадения идут первыми
          if (aExactMatch && !bExactMatch) return -1
          if (!aExactMatch && bExactMatch) return 1
          
          // Если оба точные или оба неточные, сортируем по приоритету
          return b.priority - a.priority
        })
      }
    }
    
    
    // Сортируем разделы с учетом приоритета и количества результатов
    const sortedGroupedResults = Object.entries(groupedResults)
      .filter(([_, results]) => results.length > 0) // Только разделы с результатами
      .sort(([keyA, a], [keyB, b]) => {
        // Специальная логика для подстанций с номерами
        if (/^\d+\s+подстанция/i.test(searchQuery)) {
          if (keyA === 'substation' && keyB !== 'substation') return -1
          if (keyB === 'substation' && keyA !== 'substation') return 1
        }
        
        // Сортируем по среднему приоритету результатов в разделе
        const avgPriorityA = a.reduce((sum, item) => sum + (item.priority || 0), 0) / a.length
        const avgPriorityB = b.reduce((sum, item) => sum + (item.priority || 0), 0) / b.length
        
        if (avgPriorityA !== avgPriorityB) {
          return avgPriorityB - avgPriorityA // По убыванию приоритета
        }
        
        // Если приоритеты равны, сортируем по количеству результатов
        return b.length - a.length
      })
      .reduce((acc, [key, results]) => {
        acc[key] = results
        return acc
      }, {} as Record<string, any[]>)

    // Создаем массив разделов в правильном порядке для клиента
    const orderedSections = Object.keys(sortedGroupedResults)

    return {
      success: true,
      results: allResults,
      groupedResults: sortedGroupedResults,
      orderedSections: orderedSections, // Добавляем порядок разделов
      totalResults: allResults.length,
      query: searchQuery,
      timestamp: Date.now()
    }

  } catch (error: any) {
    console.error('❌ Ошибка серверного поиска:', error)
    console.error('❌ Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    })
    
    // Возвращаем пустые результаты вместо ошибки, чтобы поиск не падал
    return {
      success: true, // Изменяем на true, чтобы клиент не считал это ошибкой
      results: [],
      groupedResults: {
        mkb: [],
        ls: [],
        algorithm: [],
        drug: [],
        substation: [],
        calculator: []
      },
      totalResults: 0,
      query: query || '',
      error: error?.message, // Добавляем информацию об ошибке для отладки
      timestamp: Date.now()
    }
  }
})
