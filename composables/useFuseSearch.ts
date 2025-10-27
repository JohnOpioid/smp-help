import Fuse from 'fuse.js'

export interface SearchItem {
  _id: string
  title?: string
  name?: string
  description?: string
  note?: string
  content?: string
  mkbCode?: string
  stationCode?: string
  code?: string
  category?: {
    name?: string
    url?: string
  }
  section?: string
  latinName?: string
  synonyms?: string[]
  forms?: any
  address?: string
  phones?: string[]
  phone?: string
  region?: {
    name?: string
  }
  regionName?: string
  type: 'mkb' | 'ls' | 'algorithm' | 'drug' | 'substation' | 'calculator'
  url?: string
  category?: string
}

export const useFuseSearch = () => {
  const createFuseInstance = (items: SearchItem[]) => {
    const options = {
      keys: [
        {
          name: 'title',
          weight: 0.3
        },
        {
          name: 'name', 
          weight: 0.4
        },
        {
          name: 'description',
          weight: 0.2
        },
        {
          name: 'content',
          weight: 0.1
        },
        {
          name: 'note',
          weight: 0.1
        },
        {
          name: 'mkbCode',
          weight: 0.2
        },
        {
          name: 'code',
          weight: 0.2
        },
        {
          name: 'stationCode',
          weight: 0.05
        },
        {
          name: 'latinName',
          weight: 0.2
        },
        {
          name: 'synonyms',
          weight: 0.25
        },
        {
          name: 'category.name',
          weight: 0.05
        },
        {
          name: 'section',
          weight: 0.05
        },
        {
          name: 'address',
          weight: 0.05
        },
        {
          name: 'region.name',
          weight: 0.05
        }
      ],
      threshold: 0.6, // Более мягкий порог для гибкого поиска по словам
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2, // Минимальная длина совпадения - меньше для коротких слов
      shouldSort: true,
      findAllMatches: true,
      ignoreLocation: true, // Игнорировать позицию в тексте
      useExtendedSearch: true, // Поддержка расширенного поиска
      distance: 100, // Максимальное расстояние между совпадениями
      location: 0, // Начальная позиция поиска
      getFn: (obj: any, path: string | string[]) => {
        // Кастомная функция для получения значений из вложенных объектов
        if (typeof path === 'string') {
          return path.split('.').reduce((o, i) => o?.[i], obj) || ''
        } else if (Array.isArray(path)) {
          return path.reduce((o, i) => o?.[i], obj) || ''
        }
        return ''
      }
    }

    return new Fuse(items, options)
  }

  const search = (items: SearchItem[], query: string) => {
    if (!query || query.length < 2) return []
    
    // Нормализуем запрос для более гибкого поиска
    const normalizedQuery = query.toLowerCase().trim()
    const queryWords = normalizedQuery.split(/\s+/).filter(word => word.length >= 2)
    
    const fuse = createFuseInstance(items)
    
    // Генерируем варианты запроса с учётом частых опечаток (рус. суффикс -ческ-)
    const generateQueryVariants = (q: string): string[] => {
      const variants = new Set<string>()
      const base = q.trim()
      variants.add(base)
      const rules: Array<[RegExp, string]> = [
        [/чск/gi, 'ческ'],
        [/ничск/gi, 'ническ'],
        [/гипертонич(?!е)/gi, 'гипертоничес'],
      ]
      let produced = new Set<string>()
      rules.forEach(([re, rep]) => {
        if (re.test(base)) {
          const v = base.replace(re, rep)
          if (v !== base) { variants.add(v); produced.add(v) }
        }
      })
      // Комбинированные замены на случай нескольких опечаток
      let combo = base
      rules.forEach(([re, rep]) => { combo = combo.replace(re, rep) })
      if (combo !== base) variants.add(combo)
      return Array.from(variants)
    }

    // Выполняем поиск с разными стратегиями для максимальной гибкости
    let allResults: any[] = []
    const queryVariants = generateQueryVariants(query)
    
    // 1. Поиск по полному запросу (включая варианты)
    queryVariants.forEach(qv => {
      const fullQueryResults = fuse.search(qv)
      allResults.push(...fullQueryResults.map(r => ({ ...r, searchType: 'full', queryVariant: qv })))
    })
    
    // 2. Поиск по каждому слову отдельно (для гибкости к порядку)
    if (queryWords.length > 1) {
      queryWords.forEach(word => {
        const wordVariants = generateQueryVariants(word)
        wordVariants.forEach(wv => {
          const wordResults = fuse.search(wv)
          allResults.push(...wordResults.map(r => ({ ...r, searchType: 'word', searchWord: wv })))
        })
      })
    }
    
    // 3. Поиск по переставленным словам (если запрос из 2 слов)
    if (queryWords.length === 2) {
      const reversedQuery = `${queryWords[1]} ${queryWords[0]}`
      generateQueryVariants(reversedQuery).forEach(rq => {
        const reversedResults = fuse.search(rq)
        allResults.push(...reversedResults.map(r => ({ ...r, searchType: 'reversed', queryVariant: rq })))
      })
    }
    
    // 4. Специальный поиск для МКБ кодов (если запрос похож на код)
    const mkbCodePattern = /^[A-Z]\d{2}\.?\d*$/i
    if (mkbCodePattern.test(query.trim())) {
      const mkbCodeResults = fuse.search(query.trim())
      allResults.push(...mkbCodeResults.map(r => ({ ...r, searchType: 'mkbCode' })))
    }
    
    // 5. Специальный поиск для подстанций с номерами
    const substationNumberMatch = query.match(/(\d+)/)
    if (substationNumberMatch) {
      const substationNumber = substationNumberMatch[1]
      const substationItems = items.filter(item => item.type === 'substation')
      
      if (substationItems.length > 0) {
        // Ищем подстанции, содержащие этот номер
        const matchingSubstations = substationItems.filter(item => {
          const searchText = `${item.title} ${item.description} ${item.address}`.toLowerCase()
          return searchText.includes(substationNumber)
        })
        
        // Добавляем найденные подстанции с высоким приоритетом
        matchingSubstations.forEach(item => {
          allResults.push({
            item,
            score: 0.1, // Очень высокий приоритет для точного совпадения номера
            searchType: 'substationNumber',
            matches: [{ indices: [[0, substationNumber.length - 1]], value: substationNumber }]
          })
        })
      }
    }
    
    // 6. Специальный поиск для подстанций по адресным словам
    const queryLower = query.toLowerCase()
    const addressKeywords = ['улица', 'ул', 'проспект', 'пр', 'переулок', 'пер', 'площадь', 'пл', 'бульвар', 'б-р', 'шоссе', 'ш', 'набережная', 'наб', 'дом', 'д', 'корпус', 'к', 'строение', 'стр', 'квартал', 'кв', 'микрорайон', 'мкр', 'район', 'р-н', 'область', 'обл', 'город', 'г', 'поселок', 'пос', 'село', 'с', 'деревня', 'дер']
    const hasAddressKeywords = addressKeywords.some(keyword => queryLower.includes(keyword))
    
    if (hasAddressKeywords) {
      const substationItems = items.filter(item => item.type === 'substation')
      
      if (substationItems.length > 0) {
        // Ищем подстанции, содержащие адресные слова
        const matchingSubstations = substationItems.filter(item => {
          const searchText = `${item.title} ${item.description} ${item.address}`.toLowerCase()
          
          // Проверяем наличие адресных слов в тексте
          return addressKeywords.some(keyword => searchText.includes(keyword)) ||
                 searchText.includes(queryLower)
        })
        
        // Добавляем найденные подстанции с высоким приоритетом
        matchingSubstations.forEach(item => {
          allResults.push({
            item,
            score: 0.2, // Высокий приоритет для адресных совпадений
            searchType: 'substationAddress',
            matches: [{ indices: [[0, queryLower.length - 1]], value: queryLower }]
          })
        })
      }
    }
    
    // Удаляем дубликаты и объединяем результаты
    const uniqueResults = new Map()
    allResults.forEach(result => {
      const key = result.item._id
      if (!uniqueResults.has(key) || result.score < uniqueResults.get(key).score) {
        uniqueResults.set(key, result)
      }
    })
    
    const results = Array.from(uniqueResults.values())
    
    // Дополнительная фильтрация для медицинских терминов
    const filteredResults = results.filter(result => {
      const score = result.score || 1
      const item = result.item
      
      // Если score слишком плохой, исключаем
      if (score > 0.8) {
        return false
      }
      
      // Для медицинских терминов проверяем наличие ключевых слов
      const title = (item.title || item.name || '').toLowerCase()
      const description = (item.description || item.note || '').toLowerCase()
      const content = (item.content || '').toLowerCase()
      
      // Проверяем совпадения в названии, описании или контенте
      const hasTitleMatch = queryWords.some(word => title.includes(word))
      const hasDescriptionMatch = queryWords.some(word => description.includes(word))
      const hasContentMatch = queryWords.some(word => content.includes(word))
      
      // Более гибкая проверка: считаем сколько слов из запроса найдено
      const foundWords = queryWords.filter(word => 
        title.includes(word) || description.includes(word) || content.includes(word)
      )
      const wordMatchRatio = foundWords.length / queryWords.length
      
      // Дополнительная проверка для релевантных слов (исключаем стоп-слова)
      const stopWords = ['и', 'в', 'во', 'на', 'но', 'по', 'с', 'со', 'к', 'у', 'о', 'об', 'для', 'из', 'от', 'до', 'за', 'над', 'под', 'при']
      const relevantWords = queryWords.filter(word => word.length >= 3 && !stopWords.includes(word))
      const foundRelevantWords = relevantWords.filter(word => 
        title.includes(word) || description.includes(word) || content.includes(word)
      )
      const relevantWordMatchRatio = relevantWords.length > 0 ? foundRelevantWords.length / relevantWords.length : 0
      
      
      // Специальная логика для МКБ кодов - более строгая фильтрация
      if (item.type === 'mkb') {
        // Для МКБ кодов принимаем если:
        // 1. Есть совпадение в названии/описании И найдено достаточно релевантных слов ИЛИ
        // 2. Очень хороший score (точное совпадение)
        const mkbAccepted = ((hasTitleMatch || hasDescriptionMatch) && relevantWordMatchRatio >= 0.5) || 
                           score < 0.3
        
        return mkbAccepted
      }
      
      // Специальная логика для препаратов - более строгая фильтрация
      if (item.type === 'drug') {
        // Для препаратов принимаем если:
        // 1. Есть совпадение в названии/латинском названии/синонимах И найдено достаточно релевантных слов ИЛИ
        // 2. Очень хороший score (точное совпадение)
        const drugAccepted = ((hasTitleMatch || hasDescriptionMatch) && relevantWordMatchRatio >= 0.5) || 
                           score < 0.3
        
        return drugAccepted
      }
      
      // Более строгая фильтрация для остальных типов - исключаем нерелевантные результаты
      if (score > 0.6) {
        return false
      }
      
      // Для остальных типов данных - более строгие критерии
      const accepted = (hasTitleMatch || hasDescriptionMatch || hasContentMatch) && 
                      wordMatchRatio >= 0.5
      
      return accepted
    })
    
    return filteredResults.map(result => ({
      ...result.item,
      score: result.score,
      matches: result.matches
    }))
  }

  const searchByType = (items: SearchItem[], query: string, type: SearchItem['type']) => {
    const filteredItems = items.filter(item => item.type === type)
    return search(filteredItems, query)
  }

  return {
    search,
    searchByType,
    createFuseInstance
  }
}
