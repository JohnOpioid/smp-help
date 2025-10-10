import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import Drug from '~/server/models/Drug'
import Instruction from '~/server/models/Instruction'
import LocalStatus from '~/server/models/LocalStatus'
import Category from '~/server/models/Category'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import Substation from '~/server/models/Substation'
import Feedback from '~/server/models/Feedback'
import { mockHubAI } from '~/server/utils/mockAI'

// Функция для генерации контекстных предложений
function generateContextualSuggestions(searchTerm: string, results: any[]): string[] {
  const suggestions: string[] = []
  
  // Анализируем контекст поиска
  const isTraumaContext = /травм|перелом|ушиб|рана|повреждени|ожог|порез|ссадин|гематом|вывих|растяжени/i.test(searchTerm)
  const isDiagnosisContext = results.some(r => r.type === 'mkb' || r.type === 'codifier')
  const isDrugContext = results.some(r => r.type === 'drug')
  const isEmergencyContext = /неотложн|экстренн|срочн|критическ|реанимаци|шок|остановк|приступ/i.test(searchTerm)
  const isSubstationContext = results.some(r => r.type === 'substation') || /подстанци|станци|адрес|телефон|номер.*\d+/i.test(searchTerm)
  
  // Базовые предложения
  if (isDiagnosisContext) {
    suggestions.push('Тактика лечения')
  }
  
  // Контекстные предложения для травм
  if (isTraumaContext) {
    suggestions.push('Локальный статус')
  }
  
  // Предложения для неотложных состояний
  if (isEmergencyContext) {
    suggestions.push('Возможные результаты вызова')
  } else if (!isSubstationContext) {
    // Не добавляем "Возможные результаты вызова" для запросов о подстанциях
    suggestions.push('Возможные результаты вызова')
  }
  
  // Дополнительные предложения в зависимости от контекста
  if (isDrugContext) {
    suggestions.push('Побочные эффекты')
  } else if (isDiagnosisContext) {
    suggestions.push('Дифференциальная диагностика')
  } else if (isSubstationContext) {
    suggestions.push('Ближайшие подстанции')
  }
  
  // Если предложений мало, добавляем общие (но не для подстанций)
  if (suggestions.length < 3 && !isSubstationContext) {
    const generalSuggestions = [
      'Клинические рекомендации',
      'Алгоритм действий',
      'Показания к госпитализации'
    ]
    
    for (const suggestion of generalSuggestions) {
      if (!suggestions.includes(suggestion) && suggestions.length < 4) {
        suggestions.push(suggestion)
      }
    }
  }
  
  return suggestions.slice(0, 4) // Максимум 4 предложения
}

export default defineEventHandler(async (event) => {
  const { query: searchTerm } = await readBody(event)

  if (!searchTerm || searchTerm.length < 2) {
    return {
      success: false,
      results: [],
      message: 'Введите минимум 2 символа для поиска'
    }
  }

  await connectDB()

  try {
    // Специальная обработка для 4-значных запросов (коды станций)
    const fourDigitCodeMatch = searchTerm.match(/^(\d{4})$/)
    if (fourDigitCodeMatch) {
      const stationCode = fourDigitCodeMatch[1]
      console.log(`API: обрабатываю запрос по коду станции: ${stationCode}`)
      
      const relevantCodes = await MKB.find({
        $or: [
          { stationCode: stationCode },
          { stationCode: `${stationCode}*` },
          { stationCode: new RegExp(`^${stationCode}`, 'i') }
        ]
      }).populate('category').lean()
      
      if (relevantCodes.length > 0) {
        const introMessages = [
          'Вот что удалось найти в базе данных:',
          'Нашёл точные записи из БД:',
          'Данные из БД по вашему запросу:',
          'Подборка записей из базы данных:'
        ];
        const randomIntro = introMessages[Math.floor(Math.random() * introMessages.length)];
        
        let response = `${randomIntro}\n\n`
        response += `<mkb-cards>\n`
        relevantCodes.forEach((code: any) => {
          const mkbCode = (code.mkbCode || 'Код не указан').toString().trim()
          const codeName = (code.name || 'Название не указано').toString().trim()
          const categoryName = (code.category?.name || 'Без категории').toString().trim()
          const codeNote = (code.note || '').toString().trim()
          const stationCode = (code.stationCode || '').toString().trim()
          
          if (mkbCode.length > 0 && mkbCode !== 'undefined' && 
              codeName.length > 0 && codeName !== 'undefined' && codeName !== ',' &&
              !mkbCode.includes('|') && !codeName.includes('|')) {
            response += `${mkbCode}|${codeName}|${categoryName}|${codeNote}|${stationCode}\n`
          }
        })
        response += `</mkb-cards>\n\n`
        
        return {
          success: true,
          results: [], // No regular results for this specific query
          message: response,
          suggestions: [], // No quick replies for this specific query
          query: searchTerm,
          aiAnalysis: true
        }
      } else {
        const introMessages = [
          'Вот что удалось найти в базе данных:',
          'Нашёл точные записи из БД:',
          'Данные из БД по вашему запросу:',
          'Подборка записей из базы данных:'
        ];
        const randomIntro = introMessages[Math.floor(Math.random() * introMessages.length)];
        
        return {
          success: true,
          results: [],
          message: `${randomIntro}\n\nПо запросу "${searchTerm}" не найдено МКБ кодов для станции ${stationCode}.`,
          suggestions: [],
          query: searchTerm,
          aiAnalysis: true
        }
      }
    }

    // Получаем обратную связь для обучения AI
    const learningData = await Feedback.find({
      $or: [
        { question: { $regex: searchTerm, $options: 'i' } },
        { answer: { $regex: searchTerm, $options: 'i' } }
      ]
    })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('question answer rating userComment')

    // Получаем полную информацию из всех коллекций БД
    const [mkbData, drugData, instructionData, localStatusData, categoryData, localStatusCategoryData, substationData] = await Promise.all([
      MKB.find({}).populate('category').lean(),
      Drug.find({}).lean(),
      Instruction.find({}).lean(),
      LocalStatus.find({}).populate('category').lean(),
      Category.find({}).lean(),
      LocalStatusCategory.find({}).lean(),
      Substation.find({}).lean()
    ])

    // Создаем контекст для AI с полной информацией из БД
    // Передаем ВСЕ записи для анализа
    console.log('📊 Статистика данных для ИИ:', {
      mkb: mkbData.length,
      drugs: drugData.length,
      instructions: instructionData.length,
      localStatuses: localStatusData.length,
      substations: substationData.length
    })
    
    const databaseContext = {
      mkb: mkbData.map(item => ({
        id: item._id.toString(),
        name: item.name,
        mkbCode: item.mkbCode,
        stationCode: item.stationCode,
        note: item.note,
        category: item.category?.name
      })),
      drugs: drugData.map(item => ({
        id: item._id.toString(),
        name: item.name,
        latinName: item.latinName,
        description: item.description?.substring(0, 200),
        synonyms: item.synonyms,
        forms: item.forms,
        pediatricDose: item.pediatricDose,
        ageRestrictions: item.ageRestrictions,
        pediatricDoseUnit: item.pediatricDoseUnit
      })),
      instructions: instructionData.map(item => ({
        id: item._id.toString(),
        title: item.title,
        content: item.content?.substring(0, 300)
      })),
      localStatuses: localStatusData.map(item => ({
        id: item._id.toString(),
        name: item.name,
        encoding: item.encoding,
        description: item.description,
        note: item.note,
        category: item.category?.name
      })),
      substations: substationData.map(item => ({
        id: item._id.toString(),
        name: item.name,
        address: item.address,
        phone: item.phone
      }))
    }

    // Пытаемся использовать AI для анализа запроса
    let aiResponse = null
    let aiAnalysisAvailable = false
    
    // Формируем контекст обучения
    const learningContext = learningData.length > 0 ? `
ДАННЫЕ ОБУЧЕНИЯ (предыдущие оценки пользователей):
${learningData.map(feedback => `
Вопрос: ${feedback.question}
Ответ: ${feedback.answer}
Оценка: ${feedback.rating === 'positive' ? '👍 Положительная' : '👎 Отрицательная'}
${feedback.userComment ? `Комментарий: ${feedback.userComment}` : ''}
`).join('\n')}

ВАЖНО: Учти эти данные при формировании ответа. Если есть положительные примеры - используй их стиль. Если есть отрицательные - избегай указанных проблем.

` : ''

    // Пробуем использовать AI в порядке приоритета: GigaChat -> hubAI -> Mock AI
    let aiProvider = 'mock'
    
    try {
      // Сначала пробуем GigaChat
      const { gigaChatAI } = await import('~/server/utils/gigachatAI')
      const gigaChat = gigaChatAI()
      
      // Умная фильтрация данных по релевантности для GigaChat
      const searchLower = searchTerm.toLowerCase()
      
      // Расширенная фильтрация МКБ кодов с медицинскими синонимами
      let relevantMkb = []
      
      // Специальные правила для медицинских терминов и подстанций
      const medicalExpansions = {
        'панкреатит': ['панкреат', 'поджелудочн', 'K85', 'K86'],
        'гипертони': ['гипертенз', 'давлени', 'I10', 'I11', 'I15'],
        'диабет': ['сахарн', 'E10', 'E11', 'E14'],
        'инфаркт': ['миокард', 'I21', 'I22', 'I25'],
        'язва': ['язвенн', 'пептическ', 'K25', 'K26', 'K27', 'K28'],
        'аппендицит': ['аппендикс', 'червеобразн', 'K35', 'K36', 'K37']
      }
      
      // Специальная обработка запросов о подстанциях
      const substationMatch = searchLower.match(/подстанция.*?(\d+)|(\d+).*?подстанция/i)
      const nearbyMatch = /ближайш|близк|рядом|около|возле/i.test(searchLower) && /подстанц/i.test(searchLower)
      let relevantSubstations = []
      
      if (substationMatch) {
        const stationNumber = substationMatch[1] || substationMatch[2]
        console.log('🏥 Поиск подстанции номер:', stationNumber)
        
        // Точный поиск подстанции по номеру
        relevantSubstations = databaseContext.substations.filter(station => 
          station.name?.includes(`№ ${stationNumber}`) || 
          station.name?.includes(`№${stationNumber}`) ||
          station.name?.includes(`Подстанция ${stationNumber}`) ||
          station.name?.endsWith(` ${stationNumber}`)
        )
        
        console.log('🔍 Найдено подстанций:', relevantSubstations.length)
      } else if (nearbyMatch) {
        console.log('📍 Запрос на поиск ближайших подстанций')
        // Для запросов о ближайших подстанциях - берем все, сортировка будет по геолокации
        relevantSubstations = databaseContext.substations.slice(0, 20)
      }
      
      // Находим подходящие термины для расширения
      let searchTerms = [searchLower]
      for (const [term, expansions] of Object.entries(medicalExpansions)) {
        if (searchLower.includes(term)) {
          searchTerms.push(...expansions)
          break
        }
      }
      
      // Фильтруем по всем найденным терминам
      relevantMkb = databaseContext.mkb.filter(item => {
        return searchTerms.some(term => 
          item.name?.toLowerCase().includes(term) ||
          item.mkbCode?.toLowerCase().includes(term) ||
          item.note?.toLowerCase().includes(term) ||
          item.category?.name?.toLowerCase().includes(term)
        )
      }).slice(0, 100)  // Увеличиваем лимит для медицинских терминов
      
      // Если релевантных мало, добавляем случайные
      const finalMkb = relevantMkb.length > 5 ? relevantMkb : 
        [...relevantMkb, ...databaseContext.mkb.slice(0, 50 - relevantMkb.length)]
      
      // Аналогично для препаратов
      const relevantDrugs = databaseContext.drugs.filter(item =>
        item.name?.toLowerCase().includes(searchLower) ||
        item.latinName?.toLowerCase().includes(searchLower) ||
        item.description?.toLowerCase().includes(searchLower)
      ).slice(0, 15)
      
      const finalDrugs = relevantDrugs.length > 5 ? relevantDrugs :
        [...relevantDrugs, ...databaseContext.drugs.slice(0, 15 - relevantDrugs.length)]

      // Приоритизируем найденные подстанции или берем случайные
      const finalSubstations = relevantSubstations.length > 0 ? 
        [...relevantSubstations, ...databaseContext.substations.slice(0, 10 - relevantSubstations.length)] :
        databaseContext.substations.slice(0, 15)

      const limitedContext = {
        mkb: finalMkb,
        drugs: finalDrugs,
        instructions: databaseContext.instructions.slice(0, 10),
        localStatuses: databaseContext.localStatuses.slice(0, 10),
        substations: finalSubstations
      }

      const aiPrompt = `
Ты - помощник СМП. Отвечай живо и дружелюбно, но СТРОГО по данным БД.

ЗАПРОС: "${searchTerm}"

${learningContext}

БД:
МКБ (${limitedContext.mkb.length}): ${JSON.stringify(limitedContext.mkb, null, 1)}
ПРЕПАРАТЫ (${limitedContext.drugs.length}): ${JSON.stringify(limitedContext.drugs, null, 1)}
ИНСТРУКЦИИ (${limitedContext.instructions.length}): ${JSON.stringify(limitedContext.instructions, null, 1)}
СТАТУСЫ (${limitedContext.localStatuses.length}): ${JSON.stringify(limitedContext.localStatuses, null, 1)}
ПОДСТАНЦИИ (${limitedContext.substations.length}): ${JSON.stringify(limitedContext.substations, null, 1)}

СТИЛЬ ОТВЕТА:
- Будь дружелюбным и разговорным
- Используй ТОЛЬКО факты из БД
- Добавляй короткие пояснения для контекста
- Поддерживай беседу естественно
- Для подстанций: точно по номеру, не путай цифры!
- Для запросов "ближайшие подстанции": используй <geolocation-request>Для поиска ближайших подстанций нужна ваша геолокация</geolocation-request>
- Форматы: <mkb-cards>код|название|категория|примечание|станция</mkb-cards> или <substation-cards>название|адрес|телефоны|координаты</substation-cards>
`

      console.log('📏 GigaChat: Размер промпта:', aiPrompt.length, 'символов')
      console.log('🔍 GigaChat: Найдено релевантных МКБ кодов:', relevantMkb.length)
      console.log('📋 GigaChat: Поисковые термины:', searchTerms)
      
      aiResponse = await gigaChat.run('GigaChat', {
        prompt: aiPrompt,
        max_tokens: 800  // Уменьшаем лимит для экономии токенов
      })
      aiAnalysisAvailable = true
      aiProvider = 'gigachat'
      console.log('✅ Используется GigaChat AI')
      
    } catch (gigaChatError) {
      console.log('⚠️ GigaChat недоступен:', gigaChatError.message)
      
      try {
        // Пробуем использовать hubAI
        const ai = hubAI()
        const aiPrompt = `
Ты - медицинский помощник для системы скорой медицинской помощи (СМП). 
Пользователь задал вопрос: "${searchTerm}"

${learningContext}

Проанализируй следующую базу данных и найди наиболее релевантную информацию:

БАЗА ДАННЫХ:
МКБ коды: ${JSON.stringify(databaseContext.mkb)}
Препараты: ${JSON.stringify(databaseContext.drugs)}
Инструкции: ${JSON.stringify(databaseContext.instructions)}
Локальные статусы: ${JSON.stringify(databaseContext.localStatuses)}
Подстанции: ${JSON.stringify(databaseContext.substations)}

Задача:
1. Проанализируй запрос пользователя
2. Найди наиболее релевантные записи из базы данных
3. Предоставь полезный ответ с конкретными данными и рекомендациями
4. Предложи дополнительные вопросы или уточнения

Отвечай на русском языке, будь конкретным и полезным. Используй медицинскую терминологию корректно.
Если находишь релевантные данные, обязательно укажи их ID для дальнейшего использования.
`

        aiResponse = await ai.run('@cf/meta/llama-3.1-8b-instruct', {
          prompt: aiPrompt,
          max_tokens: 1000
        })
        aiAnalysisAvailable = true
        aiProvider = 'hubai'
        console.log('✅ Используется hubAI')
        
      } catch (hubAiError) {
        console.log('⚠️ hubAI недоступен:', hubAiError.message)
        console.log('💡 Используем Mock AI')
        
        // Fallback на mock AI
        try {
          const mockAI = mockHubAI()
          const aiPrompt = `
Ты - медицинский помощник для системы скорой медицинской помощи (СМП). 
Пользователь задал вопрос: "${searchTerm}"

${learningContext}

Проанализируй следующую базу данных и найди наиболее релевантную информацию:

БАЗА ДАННЫХ:
МКБ коды: ${JSON.stringify(databaseContext.mkb)}
Препараты: ${JSON.stringify(databaseContext.drugs)}
Инструкции: ${JSON.stringify(databaseContext.instructions)}
Локальные статусы: ${JSON.stringify(databaseContext.localStatuses)}
Подстанции: ${JSON.stringify(databaseContext.substations)}

Задача:
1. Проанализируй запрос пользователя
2. Найди наиболее релевантные записи из базы данных
3. Предоставь полезный ответ с конкретными данными и рекомендациями
4. Предложи дополнительные вопросы или уточнения

Отвечай на русском языке, будь конкретным и полезным. Используй медицинскую терминологию корректно.
Если находишь релевантные данные, обязательно укажи их ID для дальнейшего использования.
`
          
          // Передаем реальные данные в mock AI
          aiResponse = await mockAI.run('@cf/meta/llama-3.1-8b-instruct', {
            prompt: aiPrompt,
            max_tokens: 1000,
            // Передаем реальные данные напрямую
            realData: {
              drugs: drugData,
              mkb: mkbData,
              instructions: instructionData,
              localStatuses: localStatusData,
              substations: substationData,
              learningData: learningData // Передаем данные обучения
            }
          })
          aiAnalysisAvailable = true
          aiProvider = 'mock'
          console.log('✅ Используется Mock AI с реальными данными БД')
        } catch (mockError) {
          console.log('❌ Mock AI также недоступен:', mockError.message)
          aiAnalysisAvailable = false
        }
      }
    }

    // Также выполняем обычный поиск для получения конкретных результатов
    const results: any[] = []
    const searchRegex = new RegExp(searchTerm, 'i')

    // Улучшенный поиск в МКБ с дополнительными условиями
    const mkbSearchConditions = [
      { name: searchRegex },
      { mkbCode: searchRegex },
      { stationCode: searchRegex },
      { note: searchRegex }
    ]
    
    // Специальная логика для поиска по коду станции
    const stationCodeMatch = searchTerm.match(/(\d{4})/i)
    if (stationCodeMatch && /\d{4}.*код|\d{4}.*диагноз|станция.*\d{4}|код.*станци/i.test(searchTerm)) {
      const stationCode = stationCodeMatch[1]
      mkbSearchConditions.push(
        { stationCode: new RegExp(`^${stationCode}`, 'i') },
        { stationCode: new RegExp(stationCode, 'i') }
      )
    }
    
    // Импортируем комплексные медицинские синонимы
    const { comprehensiveMedicalSynonyms } = await import('~/server/utils/comprehensiveMedicalSynonyms')
    
    // Создаем расширенный список медицинских терминов
    const medicalTerms: { [key: string]: string[] } = {}
    
    // Добавляем термины из комплексной системы
    Object.entries(comprehensiveMedicalSynonyms).forEach(([area, data]: [string, any]) => {
      const { primary, secondary, conditions } = data
      
      // Добавляем основные термины области
      primary.forEach((term: string) => {
        if (!medicalTerms[term]) medicalTerms[term] = []
        medicalTerms[term].push(...primary, ...secondary.slice(0, 3), ...conditions.slice(0, 5))
      })
      
      // Добавляем условия/заболевания
      conditions.forEach((condition: string) => {
        if (!medicalTerms[condition]) medicalTerms[condition] = []
        medicalTerms[condition].push(...conditions.slice(0, 3), ...primary.slice(0, 2))
      })
    })
    
    // Добавляем базовые синонимы для обратной совместимости
    const basicTerms = {
      'аппендицит': ['аппендицит', 'аппендикс', 'червеобразн'],
      'инсульт': ['инсульт', 'кровоизлияние', 'инфаркт мозга', 'цереброваскулярн', 'ОНМК', 'острое нарушение мозгового кровообращения'],
      'ОНМК': ['ОНМК', 'онмк', 'острое нарушение мозгового кровообращения', 'инсульт', 'кровоизлияние', 'церебральн', 'мозг'],
      'инфаркт': ['инфаркт', 'миокард', 'коронарн', 'сердечн', 'ОКС', 'острый коронарный синдром'],
      'ОКС': ['ОКС', 'окс', 'острый коронарный синдром', 'инфаркт', 'миокард', 'коронарн', 'ишемическ', 'стенокарди'],
      'гипертония': ['гипертенз', 'гипертони', 'давлени', 'артериальн'],
      'диабет': ['диабет', 'сахарн', 'глюкоз'],
      'пневмония': ['пневмони', 'воспаление легких', 'легочн'],
      'гастрит': ['гастрит', 'желудок', 'гастро'],
      'бронхит': ['бронхит', 'бронх', 'дыхательн'],
      'язва': ['язва', 'язвенн', 'пептическ', 'эрозивн', 'дуоденальн'],
      'панкреатит': ['панкреатит', 'поджелудочн', 'панкреас'],
      'холецистит': ['холецистит', 'желчн', 'холедох']
    }
    
    // Объединяем с базовыми терминами
    Object.entries(basicTerms).forEach(([key, synonyms]) => {
      if (!medicalTerms[key]) medicalTerms[key] = []
      medicalTerms[key].push(...synonyms)
      medicalTerms[key] = [...new Set(medicalTerms[key])] // Убираем дубликаты
    })
    
    // Ищем совпадения с медицинскими терминами
    for (const [term, synonyms] of Object.entries(medicalTerms)) {
      if (new RegExp(term, 'i').test(searchTerm)) {
        synonyms.forEach(synonym => {
          mkbSearchConditions.push(
            { name: new RegExp(synonym, 'i') },
            { note: new RegExp(synonym, 'i') }
          )
        })
      }
    }
    
    const mkbResults = await MKB.find({
      $or: mkbSearchConditions
    }).populate('category').limit(10) // Увеличиваем лимит для лучшего покрытия

    mkbResults.forEach(item => {
      results.push({
        id: item._id.toString(),
        title: item.name,
        description: `МКБ: ${item.mkbCode} | Станция: ${item.stationCode}`,
        type: 'mkb',
        url: `/codifier/${item.category?.url}?open=${item._id}`,
        codes: {
          mkbCode: item.mkbCode,
          stationCode: item.stationCode
        },
        data: item
      })
    })

    // Улучшенный поиск в Drugs с частичными совпадениями и специальными препаратами
    const drugSearchTerms = searchTerm.toLowerCase().split(/\s+/)
    
    // Специальные паттерны для известных препаратов
    const specialDrugPatterns = [
      { pattern: /(эуфиллин|eufillin)/i, terms: ['эуфиллин', 'аминофиллин', 'aminophylline', 'теофиллин'] },
      { pattern: /(аминофиллин|aminophylline)/i, terms: ['аминофиллин', 'эуфиллин', 'aminophylline', 'теофиллин'] },
      { pattern: /(теофиллин|theophylline)/i, terms: ['теофиллин', 'эуфиллин', 'аминофиллин', 'theophylline'] }
    ]
    
    let searchQueries = [
      { name: searchRegex },
      { latinName: searchRegex },
      { synonyms: searchRegex },
      { description: searchRegex },
      // Поиск по частичным совпадениям в названии
      ...drugSearchTerms.map(term => ({ name: new RegExp(term, 'i') })),
      // Поиск по латинскому названию
      ...drugSearchTerms.map(term => ({ latinName: new RegExp(term, 'i') })),
      // Поиск по синонимам
      ...drugSearchTerms.map(term => ({ synonyms: new RegExp(term, 'i') }))
    ]
    
    // Добавляем специальные паттерны поиска
    for (const special of specialDrugPatterns) {
      if (special.pattern.test(searchTerm)) {
        for (const term of special.terms) {
          searchQueries.push(
            { name: new RegExp(term, 'i') },
            { latinName: new RegExp(term, 'i') },
            { synonyms: new RegExp(term, 'i') }
          )
        }
        break
      }
    }
    
    const drugResults = await Drug.find({
      $and: [
        { $or: searchQueries },
        // Исключаем вспомогательные вещества
        {
          name: { 
            $not: /^(вода для инъекций|натрия хлорид|глюкоза|физиологический раствор)$/i 
          }
        }
      ]
    }).limit(10)

    drugResults.forEach(item => {
      results.push({
        id: item._id.toString(),
        title: item.name,
        description: item.latinName ? `Лат.: ${item.latinName}` : item.description?.substring(0, 100) + '...',
        type: 'drug',
        url: `/drugs?open=${item._id}`,
        drugData: {
          forms: item.forms,
          pediatricDose: item.pediatricDose,
          ageRestrictions: item.ageRestrictions,
          pediatricDoseUnit: item.pediatricDoseUnit
        },
        data: item
      })
    })

    // Поиск в Instructions
    const instructionResults = await Instruction.find({
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    }).limit(5)

    instructionResults.forEach(item => {
      results.push({
        id: item._id.toString(),
        title: item.title,
        description: item.content?.substring(0, 100) + '...',
        type: 'instruction',
        url: `/instructions/${item.url}`,
        data: item
      })
    })

    // Поиск в LocalStatus
    const localStatusResults = await LocalStatus.find({
      $or: [
        { name: searchRegex },
        { encoding: searchRegex },
        { description: searchRegex },
        { note: searchRegex }
      ]
    }).populate('category').limit(5)

    localStatusResults.forEach(item => {
      results.push({
        id: item._id.toString(),
        title: item.name,
        description: `Кодировка: ${item.encoding}`,
        type: 'local-status',
        url: `/local-statuses/${item.category?.url}?open=${item._id}`,
        data: item
      })
    })

    // Поиск в Substations
    const substationResults = await Substation.find({
      $or: [
        { name: searchRegex },
        { address: searchRegex },
        { phone: searchRegex }
      ]
    }).limit(3)

    substationResults.forEach(item => {
      results.push({
        id: item._id.toString(),
        title: item.name,
        description: `Адрес: ${item.address}${item.phone ? ` | Тел: ${item.phone}` : ''}`,
        type: 'substation',
        url: `/substations`,
        data: item
      })
    })

    // Интеллектуальный анализ запроса без AI
    let intelligentMessage = ''
    let suggestions = []
    
    if (aiAnalysisAvailable && aiResponse?.response) {
      // Короткое интро перед сообщением ИИ
      const introVariants = [
        'Вот что удалось найти в базе данных:',
        'Нашёл точные записи из БД:',
        'Данные из БД по вашему запросу:',
        'Подборка записей из базы данных:'
      ]
      const intro = introVariants[Math.floor(Math.random() * introVariants.length)]
      intelligentMessage = `${intro}\n\n${aiResponse.response}`
      suggestions = aiResponse.suggestions || generateContextualSuggestions(searchTerm, results)
    } else {
      // Анализируем запрос на предмет расчета дозировки
      const isDosageQuery = /дозировк|дозу|рассчита|расчет|ребенок|кг|мг|мл/i.test(searchTerm)
      const weightMatch = searchTerm.match(/(\d+)\s*кг/i)
      const drugNameMatch = searchTerm.match(/(эуфиллин|аминофиллин|aminophylline|eufillin|теофиллин|theophylline|адреналин|adrenaline|epinephrine|атропин|atropine|морфин|morphine|дексаметазон|dexamethasone)/i)
      
      console.log('Анализ запроса:', {
        searchTerm,
        isDosageQuery,
        weightMatch: weightMatch?.[1],
        drugNameMatch: drugNameMatch?.[1],
        drugResultsCount: drugResults.length
      })
      
      if (isDosageQuery && weightMatch && drugNameMatch) {
        const weight = parseInt(weightMatch[1])
        const drugName = drugNameMatch[1]
        
        // Ищем препарат в результатах
        console.log('Обычный поиск: найдено препаратов:', drugResults.length)
        drugResults.forEach(drug => {
          console.log('Обычный поиск: препарат в результатах:', drug.name, drug.latinName, drug.synonyms)
        })
        
        const foundDrug = drugResults.find(drug => 
          drug.name.toLowerCase().includes(drugName.toLowerCase()) ||
          drug.latinName?.toLowerCase().includes(drugName.toLowerCase()) ||
          drug.synonyms?.some(syn => syn.toLowerCase().includes(drugName.toLowerCase()))
        )
        
        console.log('Обычный поиск: найден препарат для расчета:', foundDrug?.name || 'не найден')
        
        if (foundDrug && foundDrug.pediatricDose && foundDrug.pediatricDose.length > 0) {
          const introVariants = [
            'Вот что удалось найти в базе данных:',
            'Нашёл точные записи из БД:',
            'Данные из БД по вашему запросу:'
          ]
          const intro = introVariants[Math.floor(Math.random() * introVariants.length)]
          intelligentMessage = `${intro}\n\nДля расчета дозировки ${foundDrug.name} для ребенка весом ${weight} кг:\n\n`
          
          // Парсим педиатрическую дозировку
          foundDrug.pediatricDose.forEach((dose, index) => {
            const doseMatch = dose.match(/(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?/);
            if (doseMatch) {
              const minDose = parseFloat(doseMatch[1].replace(',', '.'))
              const maxDose = doseMatch[2] ? parseFloat(doseMatch[2].replace(',', '.')) : minDose
              
              const minResult = (minDose * weight).toFixed(1)
              const maxResult = (maxDose * weight).toFixed(1)
              
              intelligentMessage += `• Дозировка ${dose} ${foundDrug.pediatricDoseUnit || 'мг/кг'}: ${minResult}${maxDose !== minDose ? ` - ${maxResult}` : ''} мг\n`
            }
          })
          
          // Добавляем информацию о форме выпуска для расчета объема
          if (foundDrug.forms && foundDrug.forms.doseValue && foundDrug.forms.volumeMl) {
            const concentration = foundDrug.forms.doseValue / foundDrug.forms.volumeMl
            intelligentMessage += `\nФорма выпуска: ${foundDrug.forms.doseValue}${foundDrug.forms.doseUnit || 'мг'} в ${foundDrug.forms.volumeMl}мл\n`
            intelligentMessage += `Концентрация: ${concentration.toFixed(1)} мг/мл\n`
            
            // Рассчитываем объем для каждой дозировки
            foundDrug.pediatricDose.forEach((dose) => {
              const doseMatch = dose.match(/(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?/);
              if (doseMatch) {
                const minDose = parseFloat(doseMatch[1].replace(',', '.'))
                const maxDose = doseMatch[2] ? parseFloat(doseMatch[2].replace(',', '.')) : minDose
                
                const minMg = minDose * weight
                const maxMg = maxDose * weight
                const minMl = (minMg / concentration).toFixed(2)
                const maxMl = (maxMg / concentration).toFixed(2)
                
                intelligentMessage += `Объем для дозы ${dose}: ${minMl}${maxDose !== minDose ? ` - ${maxMl}` : ''} мл\n`
              }
            })
          }
          
          suggestions = generateContextualSuggestions(searchTerm, results)
        } else {
          intelligentMessage = `Для расчета дозировки ${drugName} для ребенка весом ${weight} кг нужны данные о педиатрической дозировке. Проверьте наличие препарата в базе данных.`
          suggestions = generateContextualSuggestions(searchTerm, results)
        }
      } else if (results.length > 0) {
        intelligentMessage = `Найдено ${results.length} результатов по запросу "${searchTerm}"`
        suggestions = generateContextualSuggestions(searchTerm, results)
      } else {
        intelligentMessage = `По запросу "${searchTerm}" ничего не найдено. Попробуйте изменить запрос или проверить правильность написания.`
        suggestions = generateContextualSuggestions(searchTerm, results)
      }
    }

    // Проверяем, является ли это дозировочным запросом
    const isDosageQuery = /дозировк|дозу|рассчита|расчет.*кг|мг.*кг|мл.*кг/i.test(searchTerm)
    const hasWeightAndDrug = /(\d+)\s*кг/i.test(searchTerm) && /(эуфиллин|аминофиллин|aminophylline|eufillin|теофиллин|theophylline|адреналин|adrenaline|epinephrine|атропин|atropine|морфин|morphine|дексаметазон|dexamethasone)/i.test(searchTerm)
    
    // Если ИИ ответ содержит МКБ карточки, исключаем МКБ результаты из обычного списка
    let filteredResults = results
    if (aiAnalysisAvailable && intelligentMessage.includes('<mkb-cards>')) {
      console.log('🎯 ИИ ответ содержит МКБ карточки, исключаем дублирующие МКБ результаты')
      filteredResults = results.filter(result => result.type !== 'mkb')
      console.log(`📊 Результаты после фильтрации МКБ: ${filteredResults.length} (было ${results.length})`)
    }
    
    // Для дозировочных запросов исключаем МКБ результаты полностью
    if (isDosageQuery && hasWeightAndDrug) {
      console.log('🎯 Дозировочный запрос, исключаем все МКБ результаты')
      filteredResults = filteredResults.filter(result => result.type !== 'mkb')
      console.log(`📊 Результаты после фильтрации МКБ для дозировочного запроса: ${filteredResults.length}`)
    }
    
    // Если ИИ ответ содержит карточки подстанций, исключаем подстанции из обычного списка
    if (aiAnalysisAvailable && intelligentMessage.includes('<substation-cards>')) {
      console.log('🎯 ИИ ответ содержит карточки подстанций, исключаем дублирующие результаты подстанций')
      filteredResults = filteredResults.filter(result => result.type !== 'substation')
      console.log(`📊 Результаты после фильтрации подстанций: ${filteredResults.length}`)
    }
    
    // Если ИИ ответ содержит карточки препаратов, исключаем препараты из обычного списка
    if (aiAnalysisAvailable && intelligentMessage.includes('<drug-cards>')) {
      console.log('🎯 ИИ ответ содержит карточки препаратов, исключаем дублирующие результаты препаратов')
      filteredResults = filteredResults.filter(result => result.type !== 'drug')
      console.log(`📊 Результаты после фильтрации препаратов: ${filteredResults.length}`)
    }

    return {
      success: true,
      results: filteredResults,
      message: intelligentMessage,
      suggestions,
      query: searchTerm,
      aiAnalysis: aiAnalysisAvailable
    }

  } catch (error) {
    console.error('Ошибка AI поиска:', error)
    
    // Fallback к обычному поиску при ошибке AI
    const results: any[] = []
    const searchRegex = new RegExp(searchTerm, 'i')

    const mkbResults = await MKB.find({
      $or: [
        { name: searchRegex },
        { mkbCode: searchRegex },
        { stationCode: searchRegex },
        { note: searchRegex }
      ]
    }).populate('category').limit(5)

    mkbResults.forEach(item => {
      results.push({
        id: item._id.toString(),
        title: item.name,
        description: `МКБ: ${item.mkbCode} | Станция: ${item.stationCode}`,
        type: 'mkb',
        url: `/codifier/${item.category?.url}?open=${item._id}`,
        codes: {
          mkbCode: item.mkbCode,
          stationCode: item.stationCode
        },
        data: item
      })
    })

    return {
      success: true,
      results,
      message: `Найдено ${results.length} результатов по запросу "${searchTerm}" (обычный поиск)`,
      suggestions: ['Попробовать еще раз', 'Уточнить запрос'],
      query: searchTerm,
      aiAnalysis: false
    }
  }
})
