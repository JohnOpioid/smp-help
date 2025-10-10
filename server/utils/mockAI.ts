// Mock AI для разработки без NuxtHub
// Функция для генерации контекстных предложений (дублируем из API)
function generateContextualSuggestions(searchTerm: string, results: any[] = []): string[] {
  const suggestions: string[] = []
  
  // Анализируем контекст поиска
  const isTraumaContext = /травм|перелом|ушиб|рана|повреждени|ожог|порез|ссадин|гематом|вывих|растяжени/i.test(searchTerm)
  const isDiagnosisContext = results.some(r => r.type === 'mkb' || r.type === 'codifier') || /диагноз|болезн|синдром|состояни/i.test(searchTerm)
  const isDrugContext = results.some(r => r.type === 'drug') || /препарат|лекарств|медикамент|дозировк/i.test(searchTerm)
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

export function createMockAI() {
  return {
    run: async (model: string, options: { prompt: string; max_tokens?: number; realData?: any }) => {
      const { prompt, realData } = options
      
      console.log('🤖 Mock AI: Обрабатываю медицинский запрос...')
      
      // Анализируем промпт и генерируем умный ответ
      const searchTerm = extractSearchTerm(prompt)
      console.log('🔍 Mock AI: Извлечен поисковый термин:', searchTerm)
      
      const response = generateMedicalResponse(searchTerm, prompt, realData)
      const suggestions = generateContextualSuggestions(searchTerm, realData?.allResults || [])
      
      console.log('✅ Mock AI: Сгенерирован ответ с', suggestions.length, 'предложениями')
      
      return {
        response,
        suggestions,
        success: true
      }
    }
  }
}

function extractSearchTerm(prompt: string): string {
  const match = prompt.match(/Пользователь задал вопрос: "([^"]+)"/i)
  return match ? match[1] : ''
}

function extractDatabaseFromPrompt(prompt: string): any {
  try {
    // Более надежное извлечение JSON данных из промпта
    const drugsMatch = prompt.match(/Препараты: (\[[\s\S]*?\])\s*(?:Инструкции:|Локальные статусы:|Подстанции:|$)/i)
    const mkbMatch = prompt.match(/МКБ коды: (\[[\s\S]*?\])\s*(?:Препараты:|Инструкции:|Локальные статусы:|Подстанции:|$)/i)
    const instructionsMatch = prompt.match(/Инструкции: (\[[\s\S]*?\])\s*(?:МКБ коды:|Препараты:|Локальные статусы:|Подстанции:|$)/i)
    const localStatusesMatch = prompt.match(/Локальные статусы: (\[[\s\S]*?\])\s*(?:МКБ коды:|Препараты:|Инструкции:|Подстанции:|$)/i)
    const substationsMatch = prompt.match(/Подстанции: (\[[\s\S]*?\])\s*(?:МКБ коды:|Препараты:|Инструкции:|Локальные статусы:|$)/i)
    
    const result = {
      drugs: [],
      mkb: [],
      instructions: [],
      localStatuses: [],
      substations: []
    }
    
    if (drugsMatch) {
      try {
        result.drugs = JSON.parse(drugsMatch[1])
      } catch (e) {
        console.log('Ошибка парсинга препаратов, используем пустой массив')
      }
    }
    
    if (mkbMatch) {
      try {
        result.mkb = JSON.parse(mkbMatch[1])
      } catch (e) {
        console.log('Ошибка парсинга МКБ, используем пустой массив')
      }
    }
    
    // Аналогично для остальных
    return result
  } catch (error: any) {
    console.error('Ошибка парсинга данных из промпта:', error)
    return { drugs: [], mkb: [], instructions: [], localStatuses: [], substations: [] }
  }
}

function generateMedicalResponse(searchTerm: string, fullPrompt: string, realData?: any): string {
  const introVariants = [
    'Вот что удалось найти в базе данных:',
    'Нашёл в базе данных следующие записи:',
    'Подборка точных записей из БД:',
    'Данные из БД по вашему запросу:',
    'Актуальные записи из базы данных:'
  ]
  const intro = () => introVariants[Math.floor(Math.random() * introVariants.length)]
  // Используем реальные данные если переданы, иначе извлекаем из промпта
  const dbData = realData || extractDatabaseFromPrompt(fullPrompt)
  
  // Специальная обработка для 4-значных запросов (коды станций)
  const fourDigitCodeMatch = searchTerm.match(/^(\d{4})$/)
  if (fourDigitCodeMatch) {
    const stationCode = fourDigitCodeMatch[1]
    console.log(`Mock AI: обрабатываю запрос по коду станции: ${stationCode}`)
    const relevantCodes = dbData.mkb.filter((code: any) => 
      code.stationCode === stationCode || 
      code.stationCode === `${stationCode}*` ||
      (code.stationCode && code.stationCode.startsWith(stationCode))
    )
    
    if (relevantCodes.length > 0) {
      let response: string = `${intro()}\n\n`
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
      return response
    } else {
      return `${intro()}\n\nПо запросу "${searchTerm}" не найдено МКБ кодов для станции ${stationCode}.`
    }
  }
  
  console.log('Mock AI: анализирую запрос:', searchTerm)
  console.log('Mock AI: доступно препаратов:', dbData.drugs?.length || 0)
  
  // Анализируем данные обучения
  let learningInsights = ''
  if (dbData.learningData && dbData.learningData.length > 0) {
    console.log('Mock AI: Найдены данные обучения:', dbData.learningData.length, 'записей')
    
    const positiveFeedback = dbData.learningData.filter((f: any) => f.rating === 'positive')
    const negativeFeedback = dbData.learningData.filter((f: any) => f.rating === 'negative')
    
    if (positiveFeedback.length > 0) {
      learningInsights += `\n\n🎯 **Улучшенный ответ на основе положительных оценок пользователей**\n`
    }
    
    if (negativeFeedback.length > 0) {
      learningInsights += `\n<learning-note>Учитывая предыдущие замечания пользователей, предоставляю более точную и полную информацию</learning-note>\n`
    }
  }
  
  // Анализируем запрос на медицинскую тематику
  const isDosageQuery = /дозировк|дозу|рассчита|расчет.*кг|мг.*кг|мл.*кг/i.test(searchTerm)
  const weightMatch = searchTerm.match(/(\d+)\s*кг/i)
  const drugMatch = searchTerm.match(/(эуфиллин|аминофиллин|aminophylline|eufillin|теофиллин|theophylline|адреналин|adrenaline|epinephrine|атропин|atropine|морфин|morphine|дексаметазон|dexamethasone)/i)
  
  // Если это дозировочный запрос с весом и препаратом, обрабатываем только его
  if (isDosageQuery && weightMatch && drugMatch) {
    console.log('Mock AI: обрабатываю дозировочный запрос, пропускаю МКБ анализ')
    return handleDosageQuery(searchTerm, weightMatch, drugMatch, dbData, learningInsights)
  }
  
  // Определяем тип запроса более точно
  const isMKBQuery = /диагноз|мкб|код|болезнь|закодировать|кодировать|гипертони|давлени|инфаркт|стенокарди|диабет|пневмони|беременн|язва|язвенн|панкреатит|холецистит|гастрит|аппендицит|ОКС|окс|острый коронарный синдром|ОНМК|онмк|инсульт|\d{4}.*код|\d{4}.*диагноз|станция.*\d{4}|код.*станци/i.test(searchTerm)
  const isDrugQuery = /препарат|лекарство|медикамент|дозировк/i.test(searchTerm) || drugMatch
  const isSubstationQuery = /подстанци|станци|номер.*\d+|станция.*\d+/i.test(searchTerm)
  const isNearbyQuery = /ближайш|близк|рядом|около|возле/i.test(searchTerm) && /подстанц/i.test(searchTerm)
  
// Функция для обработки дозировочных запросов
function handleDosageQuery(searchTerm: string, weightMatch: RegExpMatchArray, drugMatch: RegExpMatchArray, dbData: any, learningInsights: string): string {
  const weight = parseInt(weightMatch[1])
  const drugName = drugMatch[1]
    
    console.log('Mock AI: ищу препарат:', drugName, 'для веса:', weight, 'кг')
    
    // Ищем препарат в данных БД с приоритетом точного совпадения
    let foundDrug = null
    
    // Сначала ищем точное совпадение по названию
    foundDrug = dbData.drugs?.find((drug: any) => 
      drug.name?.toLowerCase() === drugName.toLowerCase()
    )
    
    // Если не найден, ищем по частичному совпадению в названии
    if (!foundDrug) {
      foundDrug = dbData.drugs?.find((drug: any) => 
        drug.name?.toLowerCase().includes(drugName.toLowerCase())
      )
    }
    
    // Если не найден, ищем по латинскому названию
    if (!foundDrug) {
      foundDrug = dbData.drugs?.find((drug: any) => 
        drug.latinName?.toLowerCase().includes(drugName.toLowerCase())
      )
    }
    
    // Если не найден, ищем по аналогам
    if (!foundDrug) {
      foundDrug = dbData.drugs?.find((drug: any) => 
        drug.analogs?.toLowerCase().includes(drugName.toLowerCase())
      )
    }
    
    console.log('Mock AI: найден препарат:', foundDrug?.name || 'не найден')
    
    if (foundDrug) {
      // Создаем карточку препарата для дозировочного запроса
      let response: string = `${intro()}\n\n`
      
      // Добавляем карточку препарата
      response += `<drug-cards>\n`
      const drugName = foundDrug.name || 'Название не указано'
      const latinName = foundDrug.latinName || ''
      const forms = foundDrug.forms ? `${foundDrug.forms.doseValue || ''}${foundDrug.forms.doseUnit || 'мг'}/${foundDrug.forms.volumeMl || ''}мл` : ''
      const analogs = foundDrug.analogs || ''
      response += `${drugName}|${latinName}|${forms}|${analogs}|${foundDrug._id || ''}\n`
      response += `</drug-cards>\n\n`
      
      response += `**Вес ребенка:** ${weight} кг\n\n`
      
      if (foundDrug.pediatricDose && foundDrug.pediatricDose.length > 0) {
        response += `💊 **Педиатрические дозировки:**\n`
        
        foundDrug.pediatricDose.forEach((dose: string) => {
          const doseMatch = dose.match(/(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?/)
          if (doseMatch) {
            const minDose = parseFloat(doseMatch[1].replace(',', '.'))
            const maxDose = doseMatch[2] ? parseFloat(doseMatch[2].replace(',', '.')) : minDose
            
            const minResult = (minDose * weight).toFixed(1)
            const maxResult = (maxDose * weight).toFixed(1)
            
            response += `- ${dose} ${foundDrug.pediatricDoseUnit || 'мг/кг'}: **${minResult}${maxDose !== minDose ? ` - ${maxResult}` : ''} мг**\n`
          }
        })
        
        // Расчет объема если есть форма выпуска
        if (foundDrug.forms && foundDrug.forms.doseValue && foundDrug.forms.volumeMl) {
          const concentration = foundDrug.forms.doseValue / foundDrug.forms.volumeMl
          response += `\n📋 **Форма выпуска:** ${foundDrug.forms.doseValue}${foundDrug.forms.doseUnit || 'мг'} в ${foundDrug.forms.volumeMl}мл\n`
          response += `**Концентрация:** ${concentration.toFixed(1)} мг/мл\n\n`
          response += `💉 **Объем для введения:**\n`
          
          foundDrug.pediatricDose.forEach((dose: string) => {
            const doseMatch = dose.match(/(\d+(?:[.,]\d+)?)\s*-?\s*(\d+(?:[.,]\d+)?)?/)
            if (doseMatch) {
              const minDose = parseFloat(doseMatch[1].replace(',', '.'))
              const maxDose = doseMatch[2] ? parseFloat(doseMatch[2].replace(',', '.')) : minDose
              
              const minMg = minDose * weight
              const maxMg = maxDose * weight
              const minMl = (minMg / concentration).toFixed(2)
              const maxMl = (maxMg / concentration).toFixed(2)
              
              response += `- Для дозы ${dose}: **${minMl}${maxDose !== minDose ? ` - ${maxMl}` : ''} мл**\n`
            }
          })
        }
        
        if (foundDrug.ageRestrictions) {
          response += `\n⚠️ **Возрастные ограничения:** ${foundDrug.ageRestrictions}\n`
        }
        
        response += `\n🏥 **Важно:** Дозировка должна быть подтверждена врачом с учетом клинической ситуации и состояния пациента.`
        
        // Добавляем инсайты обучения
        response += learningInsights
        
        return response
      }
    }
    
    // Fallback если препарат не найден в БД
    return `Для расчета дозировки ${drugName} для ребенка весом ${weight} кг необходимы данные о педиатрической дозировке. Препарат не найден в текущей базе данных или отсутствуют данные о дозировке.`
}
  
  // Обычный медицинский запрос
  if (/препарат|лекарство|медикамент/i.test(searchTerm)) {
    return `По вашему запросу "${searchTerm}" найдена медицинская информация. Рекомендую ознакомиться с найденными препаратами и их характеристиками. При необходимости расчета дозировки укажите вес пациента.`
  }
  
  // Анализ МКБ кодов и диагнозов (исключаем если это явно запрос о препаратах)
  if (isMKBQuery && !isDrugQuery) {
    return analyzeMKBQuery(searchTerm, dbData, learningInsights)
  }
  
  if (/инструкция|процедура|алгоритм/i.test(searchTerm)) {
    return `По запросу "${searchTerm}" найдены медицинские инструкции и процедуры. Ознакомьтесь с пошаговыми алгоритмами действий.`
  }
  
  if (isSubstationQuery) {
    // Если запрос о ближайших подстанциях - запрашиваем геолокацию
    if (isNearbyQuery) {
      console.log('Mock AI: запрос о ближайших подстанциях - нужна геолокация')
      return `Для поиска ближайших подстанций мне нужна ваша геолокация.

<geolocation-request>
Разрешите доступ к местоположению, чтобы я мог найти ближайшие подстанции СМП в вашем районе.
</geolocation-request>

После получения координат покажу подстанции с расстоянием и временем в пути.${learningInsights}`
    }
    
    return analyzeSubstationQuery(searchTerm, dbData, learningInsights)
  }
  
  // Общий ответ
  return `По вашему запросу "${searchTerm}" найдена релевантная медицинская информация в базе данных СМП. Изучите найденные результаты для получения подробной информации.`
}

function analyzeMKBQuery(searchTerm: string, dbData: any, learningInsights: string): string {
  console.log('Mock AI: анализирую МКБ запрос:', searchTerm)
  console.log('Mock AI: доступно МКБ кодов:', dbData.mkb?.length || 0)
  
  if (!dbData.mkb || dbData.mkb.length === 0) {
    return `По запросу "${searchTerm}" не найдено МКБ кодов в базе данных. Обратитесь к медицинскому справочнику.`
  }
  
  // Ищем релевантные МКБ коды
  const relevantCodes = findRelevantMKBCodes(searchTerm, dbData.mkb)
  
  if (relevantCodes.length === 0) {
    return `По запросу "${searchTerm}" не найдено подходящих МКБ кодов. Попробуйте уточнить диагноз или использовать другие термины.${learningInsights}`
  }
  
  // Анализируем контекст запроса для более точного ответа
  const isPregnancyContext = /беременн|роды|послеродов|гестац/i.test(searchTerm)
  const isDiabetesContext = /диабет|сахарн/i.test(searchTerm)
  const isHeartContext = /инфаркт|миокард|сердц/i.test(searchTerm)
  
  // Формируем ответ с карточками МКБ кодов
  let response = `Вот что нашел в базе данных:\n\n`
  
  // Убираем контекстные сообщения для экономии
  
  // Берем топ результаты для карточек
  const topResults = relevantCodes.slice(0, 5)
  
  // Добавляем специальный маркер для карточек МКБ
  response += `<mkb-cards>\n`
  topResults.forEach((code: any) => {
    // Валидация данных
    const mkbCode = (code.mkbCode || code.code || 'Код не указан').toString().trim()
    const codeName = (code.name || 'Название не указано').toString().trim()
    const categoryName = (code.category?.name || 'Без категории').toString().trim()
    const codeNote = (code.note || '').toString().trim()
    const stationCode = (code.stationCode || '').toString().trim()
    
    // Проверяем, что данные корректные
    if (mkbCode.length > 0 && mkbCode !== 'undefined' && 
        codeName.length > 0 && codeName !== 'undefined' && codeName !== ',' &&
        !mkbCode.includes('|') && !codeName.includes('|')) {
      response += `${mkbCode}|${codeName}|${categoryName}|${codeNote}|${stationCode}\n`
    }
  })
  response += `</mkb-cards>\n\n`
  
  // Добавляем контекстные рекомендации по кодированию
  response += `💡 **Рекомендации по кодированию:**\n`
  
  if (isPregnancyContext) {
    response += `- Используйте коды категории O (беременность, роды, послеродовой период)\n`
    response += `- Указывайте срок беременности при необходимости\n`
    response += `- Учитывайте влияние на плод\n`
  } else if (isDiabetesContext) {
    response += `- Различайте инсулинзависимый (E10) и инсулиннезависимый (E11) диабет\n`
    response += `- Указывайте наличие осложнений\n`
    response += `- Учитывайте тип диабета\n`
  } else {
    response += `- Выберите наиболее специфичный код\n`
    response += `- Учитывайте сопутствующие заболевания\n`
  }
  
  response += `- При неуверенности консультируйтесь с врачом\n`
  
  response += learningInsights
  
  return response
}

function analyzeSubstationQuery(searchTerm: string, dbData: any, learningInsights: string): string {
  console.log('Mock AI: анализирую запрос о подстанции:', searchTerm)
  console.log('Mock AI: доступно подстанций:', dbData.substations?.length || 0)
  
  if (!dbData.substations || dbData.substations.length === 0) {
    return `По запросу "${searchTerm}" не найдено подстанций в базе данных. Обратитесь к диспетчерской службе.`
  }
  
  // Проверяем, запрашивает ли пользователь ближайшую подстанцию
  const isNearestQuery = /ближайш|близк|рядом|около|недалеко/i.test(searchTerm)
  
  let relevantSubstations
  let response: string
  
  if (isNearestQuery) {
    // Для запросов о ближайших подстанциях предлагаем использовать геолокацию
    response = `**Для поиска ближайшей подстанции требуется ваше местоположение:**\n\n`
    response += `<geolocation-request>\n`
    response += `Разрешите доступ к геолокации для определения ближайших подстанций и времени доезда.\n`
    response += `</geolocation-request>\n\n`
    
    // Показываем несколько подстанций как пример
    relevantSubstations = dbData.substations.slice(0, 3)
    response += `**Примеры подстанций СМП:**\n\n`
  } else {
    // Обычный поиск по названию/номеру
    relevantSubstations = findRelevantSubstations(searchTerm, dbData.substations)
    
    if (relevantSubstations.length === 0) {
      return `По запросу "${searchTerm}" не найдено подходящих подстанций. Попробуйте уточнить номер или название.${learningInsights}`
    }
    
    response = `Нашел информацию о подстанции:\n\n`
  }
  
  // Генерируем карточки подстанций
  response += '<substation-cards>\n'
  relevantSubstations.forEach((substation: any) => {
    // Улучшенная обработка телефонов
    let phones = 'Не указан'
    if (Array.isArray(substation.phones) && substation.phones.length > 0) {
      phones = substation.phones.join(', ')
    } else if (substation.phone && substation.phone.trim()) {
      phones = substation.phone
    }
    
    const coords = substation.location?.coordinates ? `${substation.location.coordinates[1]},${substation.location.coordinates[0]}` : ''
    
    console.log(`📞 Подстанция ${substation.name}: телефоны = ${phones}`)
    
    response += `${substation.name}|${substation.address || 'Адрес не указан'}|${phones}|${coords}\n`
  })
  response += '</substation-cards>\n\n'
  
  // Добавляем рекомендации
  response += `💡 **Рекомендации:**\n`
  response += `- Проверьте актуальность контактных данных\n`
  
  response += learningInsights
  
  return response
}

function findRelevantSubstations(searchTerm: string, substations: any[]): any[] {
  const searchWords = searchTerm.toLowerCase()
    .replace(/[^\wа-яё\s]/gi, ' ')
    .split(/\s+/)
    .filter(word => word.length > 1)
  
  console.log('Mock AI: ищу подстанции по словам:', searchWords)
  
  const scored = substations.map((substation: any) => {
    let score = 0
    const substationText = `${substation.name} ${substation.address || ''} ${substation.phone || ''} ${Array.isArray(substation.phones) ? substation.phones.join(' ') : ''}`.toLowerCase()
    
    // Точный поиск по номеру подстанции (критически важно!)
    const numberMatch = searchTerm.match(/подстанция.*?(\d+)|(\d+).*?подстанция/i)
    if (numberMatch) {
      const searchNumber = numberMatch[1] || numberMatch[2]
      
      // Точное совпадение номера - максимальный приоритет
      if (substation.name?.includes(`№ ${searchNumber}`) || 
          substation.name?.includes(`№${searchNumber}`) ||
          substation.name?.includes(`Подстанция ${searchNumber}`) ||
          substation.name?.endsWith(` ${searchNumber}`)) {
        score += 1000  // Максимальный приоритет для точного совпадения
        console.log(`🎯 Точное совпадение подстанции ${searchNumber}:`, substation.name)
      }
      // Частичное совпадение - низкий приоритет
      else if (substation.name?.includes(searchNumber)) {
        score += 50
        console.log(`📍 Частичное совпадение подстанции ${searchNumber}:`, substation.name)
      }
    }
    
    // Поиск по словам
    searchWords.forEach(word => {
      if (substationText.includes(word)) {
        score += 10
      }
      // Дополнительные очки за точные совпадения в названии
      if (substation.name && substation.name.toLowerCase().includes(word)) {
        score += 20
      }
      // Поиск в адресе
      if (substation.address && substation.address.toLowerCase().includes(word)) {
        score += 15
      }
    })
    
    return { ...substation, score }
  })
  
  const minScore = 10
  let filtered = scored
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
  
  // Если есть точное совпадение по номеру (score >= 100), показываем только его
  const exactMatch = filtered.find(item => item.score >= 100)
  if (exactMatch) {
    console.log('Mock AI: найдено точное совпадение по номеру:', exactMatch.name)
    filtered = [exactMatch]
  } else {
    // Иначе показываем максимум 5 подстанций
    filtered = filtered.slice(0, 5)
  }
  
  console.log('Mock AI: найдено подстанций:', filtered.length)
  if (filtered.length > 0) {
    console.log('Mock AI: топ результат:', filtered[0].name, 'score:', filtered[0].score)
  }
  
  return filtered
}

// Функция для расширения поисковых терминов синонимами
function expandSearchTerms(searchTerm: string): string[] {
  // Используем базовые синонимы (комплексные синонимы будут добавлены позже)
  let comprehensiveMedicalSynonyms: any = {}
  let morphologicalVariants: any = {}
  
  try {
    // Попытка импорта для Node.js окружения
    if (typeof require !== 'undefined') {
      const synonyms = require('./comprehensiveMedicalSynonyms')
      comprehensiveMedicalSynonyms = synonyms.comprehensiveMedicalSynonyms || {}
      morphologicalVariants = synonyms.morphologicalVariants || {}
    }
  } catch (error: any) {
    console.log('Используем базовые синонимы:', error.message)
  }
  
  const terms = [searchTerm.toLowerCase()]
  const searchLower = searchTerm.toLowerCase()
  
  // Добавляем синонимы из комплексной системы
  Object.entries(comprehensiveMedicalSynonyms).forEach(([area, data]: [string, any]) => {
    const { primary, secondary, conditions, abbreviations, morphological } = data
    
    // Проверяем основные термины
    if (primary.some((term: string) => searchLower.includes(term))) {
      terms.push(...primary, ...secondary, ...conditions.slice(0, 5))
      if (abbreviations) terms.push(...abbreviations)
    }
    
    // Проверяем условия/заболевания
    if (conditions.some((condition: string) => searchLower.includes(condition))) {
      terms.push(...conditions, ...primary.slice(0, 3))
      if (abbreviations) terms.push(...abbreviations)
    }
    
    // Добавляем морфологические варианты
    if (morphological) {
      Object.entries(morphological).forEach(([base, variants]: [string, any]) => {
        if (searchLower.includes(base)) {
          terms.push(...variants)
        }
      })
    }
  })
  
  // Добавляем общие морфологические варианты
  Object.entries(morphologicalVariants).forEach(([base, variants]: [string, any]) => {
    if (searchLower.includes(base)) {
      terms.push(...variants)
    }
  })
  
  // Добавляем базовые медицинские синонимы для обратной совместимости
  const basicSynonyms: { [key: string]: string[] } = {
    'аппендицит': ['аппендицит', 'аппендикс', 'червеобразный отросток'],
    'инсульт': ['инсульт', 'кровоизлияние', 'инфаркт мозга', 'ОНМК', 'острое нарушение мозгового кровообращения'],
    'ОНМК': ['ОНМК', 'онмк', 'острое нарушение мозгового кровообращения', 'инсульт', 'кровоизлияние', 'церебральн', 'мозг'],
    'инфаркт': ['инфаркт', 'миокард', 'коронарн', 'ОКС', 'острый коронарный синдром'],
    'ОКС': ['ОКС', 'окс', 'острый коронарный синдром', 'инфаркт', 'миокард', 'коронарн', 'ишемическ', 'стенокарди'],
    'гипертония': ['гипертенз', 'гипертони', 'давлени', 'АГ'],
    'диабет': ['диабет', 'сахарн', 'глюкоз', 'СД'],
    'пневмония': ['пневмони', 'воспаление легких', 'легочн'],
    'язва': ['язва', 'язвенн', 'пептическ', 'эрозивн'],
    'панкреатит': ['панкреатит', 'поджелудочн', 'панкреас'],
    'холецистит': ['холецистит', 'желчн', 'холедох']
  }
  
  for (const [key, synonyms] of Object.entries(basicSynonyms)) {
    if (new RegExp(key, 'i').test(searchTerm)) {
      terms.push(...synonyms)
    }
  }
  
  return [...new Set(terms)] // Убираем дубликаты
}

function findRelevantMKBCodes(searchTerm: string, mkbCodes: any[]): any[] {
  // Импортируем комплексные правила
  let specialSearchRules: any = {}
  let exclusionRules: any = { общие: [] }
  let contextModifiers: any = {}
  
  try {
    if (typeof require !== 'undefined') {
      const rules = require('./comprehensiveMedicalSynonyms')
      specialSearchRules = rules.specialSearchRules || {}
      exclusionRules = rules.exclusionRules || { общие: [] }
      contextModifiers = rules.contextModifiers || {}
    }
  } catch (error: any) {
    console.log('Используем базовые правила поиска:', error.message)
  }
  
  // Расширяем поисковые термины синонимами
  const expandedTerms = expandSearchTerms(searchTerm)
  console.log('Mock AI: расширенные термины поиска:', expandedTerms.slice(0, 10), '...')
  
  const searchWords = expandedTerms.flatMap(term => 
    term.toLowerCase()
      .replace(/[^\wа-яё\s]/gi, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2)
  )
  
  console.log('Mock AI: ищу по словам:', [...new Set(searchWords)].slice(0, 10), '...')
  
  // Определяем специальные правила для запроса
  let activeRule: any = null
  
  // Добавляем базовые правила если комплексные недоступны
  if (Object.keys(specialSearchRules).length === 0) {
    specialSearchRules = {
      'язвенные_заболевания': {
        triggers: ['язва', 'язвенн', 'пептическ', 'эрозивн'],
        target_codes: ['K25', 'K26', 'K27', 'K28'],
        boost_terms: ['желудк', 'двенадцатиперстн', 'дуоденальн', 'пептическ'],
        exclude_terms: ['варикозн', 'трофическ', 'кожн', 'венозн']
      },
      'панкреатит': {
        triggers: ['панкреатит', 'поджелудочн', 'панкреат'],
        target_codes: ['K85', 'K86', 'K87'],
        boost_terms: ['острый', 'хронический', 'воспалени', 'поджелудочн', 'панкреат', 'некротизирующий', 'геморрагический'],
        exclude_terms: ['диабет', 'инсулин', 'эндокрин', 'рак', 'опухол']
      },
      'аппендицит': {
        triggers: ['аппендицит', 'аппендикс', 'червеобразн'],
        target_codes: ['K35', 'K36', 'K37'],
        boost_terms: ['острый', 'перфоративн', 'гангренозн', 'червеобразн'],
        exclude_terms: ['хронический', 'другие', 'неуточненн']
      },
      'холецистит': {
        triggers: ['холецистит', 'желчн'],
        target_codes: ['K80', 'K81', 'K82', 'K83'],
        boost_terms: ['острый', 'хронический', 'желчн', 'холедох'],
        exclude_terms: ['панкреат', 'печен', 'гепатит']
      },
      'инфаркт': {
        triggers: ['инфаркт', 'миокард', 'ОКС', 'окс', 'острый коронарный синдром'],
        target_codes: ['I20', 'I21', 'I22', 'I24', 'I25'],
        boost_terms: ['острый', 'миокард', 'коронарн', 'сердечн', 'ишемическ', 'стенокарди'],
        exclude_terms: ['мозг', 'церебральн', 'инсульт', 'легк', 'токсическ', 'инфекционн']
      },
      'инсульт': {
        triggers: ['инсульт', 'ОНМК', 'онмк', 'острое нарушение мозгового кровообращения', 'кровоизлияние', 'церебральн'],
        target_codes: ['I60', 'I61', 'I62', 'I63', 'I64'],
        boost_terms: ['острый', 'мозг', 'церебральн', 'геморрагическ', 'ишемическ', 'тромботическ', 'кровоизлияни'],
        exclude_terms: ['сердц', 'миокард', 'коронарн', 'легк', 'токсическ', 'инфекционн']
      },
      'поиск_по_станции': {
        triggers: [/\d{4}.*код/, /\d{4}.*диагноз/, /станция.*\d{4}/, /код.*станци/],
        target_codes: [], // Будет определяться динамически
        boost_terms: [],
        exclude_terms: []
      }
    }
  }
  
  Object.entries(specialSearchRules).forEach(([ruleName, rule]: [string, any]) => {
    if (rule.triggers && rule.triggers.some((trigger: string | RegExp) => {
      if (trigger instanceof RegExp) {
        return trigger.test(searchTerm)
      } else {
        return new RegExp(trigger, 'i').test(searchTerm)
      }
    })) {
      activeRule = rule
      console.log('Mock AI: активировано специальное правило:', ruleName)
    }
  })
  
  const scored = mkbCodes.map(code => {
    let score = 0
    const mkbCode = code.mkbCode || code.code || ''
    const codeText = `${code.name} ${code.note || code.description || ''} ${mkbCode}`.toLowerCase()
    
    // Точное совпадение кода
    if (mkbCode && searchTerm.toUpperCase().includes(mkbCode.toUpperCase())) {
      score += 100
    }
    
    // Применяем специальные правила
    if (activeRule) {
      // Специальная логика для поиска по коду станции
      if (activeRule === specialSearchRules['поиск_по_станции']) {
        const stationCodeMatch = searchTerm.match(/(\d{4})/i)
        if (stationCodeMatch) {
          const stationCode = stationCodeMatch[1]
          const codeStationCode = code.stationCode || ''
          
          // Точное совпадение кода станции
          if (codeStationCode.includes(stationCode)) {
            score += 300 // Максимальный приоритет для точного совпадения кода станции
          }
          
          // Частичное совпадение кода станции
          if (codeStationCode.startsWith(stationCode)) {
            score += 250
          }
        }
      } else {
        // Обычные правила для других заболеваний
        // Проверяем целевые коды
        if (activeRule.target_codes && activeRule.target_codes.some((targetCode: string) => mkbCode.startsWith(targetCode))) {
          score += 200 // Максимальный приоритет для целевых кодов
        }
        
        // Бустим релевантные термины
        if (activeRule.boost_terms) {
          activeRule.boost_terms.forEach((boostTerm: string) => {
            if (new RegExp(boostTerm, 'i').test(codeText)) {
              score += 50
            }
          })
        }
        
        // Исключаем нерелевантные термины
        if (activeRule.exclude_terms) {
          activeRule.exclude_terms.forEach((excludeTerm: string) => {
            if (new RegExp(excludeTerm, 'i').test(codeText)) {
              score = 0
            }
          })
        }
      }
    }
    
    // Применяем контекстные модификаторы
    Object.entries(contextModifiers).forEach(([modifier, config]: [string, any]) => {
      if (new RegExp(modifier, 'i').test(searchTerm)) {
        config.applies_to.forEach((applicableTerm: string) => {
          if (new RegExp(applicableTerm, 'i').test(codeText)) {
            score += config.boost
          }
        })
      }
    })
    
    // Применяем правила исключения
    let shouldExclude = false
    Object.entries(exclusionRules).forEach(([area, rules]: [string, any]) => {
      if (area !== 'общие') {
        // Проверяем, относится ли запрос к этой области
        const areaKeywords = {
          'сердечно-сосудистые': ['сердц', 'кардио', 'артери', 'гипертенз', 'инфаркт'],
          'дыхательные': ['легк', 'бронх', 'пневмони', 'астм', 'дыхательн'],
          'пищеварительные': ['желудк', 'кишечн', 'печен', 'гастрит', 'язва', 'панкреатит']
        }
        
        const isAreaQuery = areaKeywords[area as keyof typeof areaKeywords]?.some(keyword => 
          new RegExp(keyword, 'i').test(searchTerm)
        )
        
        if (isAreaQuery) {
          rules.forEach((rule: RegExp) => {
            if (rule.test(codeText)) {
              shouldExclude = true
            }
          })
        }
      }
    })
    
    // Применяем общие правила исключения
    exclusionRules.общие.forEach((rule: RegExp) => {
      if (rule.test(codeText)) {
        score = Math.max(0, score - 30) // Снижаем приоритет, но не исключаем полностью
      }
    })
    
    if (shouldExclude) {
      score = 0
    }
    
    // Общий поиск по словам (если нет активного специального правила)
    if (!activeRule) {
      // Используем уникальные слова для избежания дублирования очков
      const uniqueWords = [...new Set(searchWords)]
      uniqueWords.forEach(word => {
        if (codeText.includes(word)) {
          score += 10
        }
        // Дополнительные очки за точные совпадения в названии
        if (code.name.toLowerCase().includes(word)) {
          score += 15
        }
      })
    }
    
    return { ...code, score }
  })
  
  // Повышаем минимальный порог для фильтрации
  const minScore = activeRule ? 150 : /гипертони|давлени|диабет|инфаркт|беременн|новообразовани|опухол/i.test(searchTerm) ? 40 : 10
  
  const filtered = scored
    .filter(item => item.score >= minScore)
    .sort((a, b) => b.score - a.score)
  
  console.log('Mock AI: найдено релевантных кодов:', filtered.length)
  console.log('Mock AI: минимальный порог:', minScore)
  if (filtered.length > 0) {
    console.log('Mock AI: топ результат:', filtered[0].mkbCode || filtered[0].code, filtered[0].name, 'score:', filtered[0].score)
  }
  
  return filtered
}

export function mockHubAI() {
  return createMockAI()
}
