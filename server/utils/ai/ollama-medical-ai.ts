import { Ollama } from 'ollama'

export interface OllamaAnalysisResult {
  message: string
  results: any[]
  fullResults: {
    mkb: any[]
    ls: any[]
    algo: any[]
    drug: any[]
    substation: any[]
  }
  forceExpand: string | null
  intent: string
  availableSections: string[]
  clarifyingQuestions: string[]
  aiIntent: string
  aiConfidence: number
}

export class OllamaMedicalAI {
  private ollama: Ollama
  private model: string = 'llama3.1:8b'
  private fallbackMode: boolean = false
  private cache: Map<string, any> = new Map() // Кэш для ответов

  constructor() {
    this.ollama = new Ollama({
      host: process.env.OLLAMA_HOST || 'http://localhost:11434'
    })
    
    // Проверяем доступность Ollama при инициализации
    this.checkOllamaAvailability()
  }

  private async checkOllamaAvailability() {
    try {
      const response = await fetch('http://localhost:11434/api/tags', {
        signal: AbortSignal.timeout(3000)
      })
      if (!response.ok) {
        throw new Error('Ollama not available')
      }
      console.log('✅ Ollama доступен')
    } catch (error) {
      console.warn('⚠️ Ollama недоступен, переключаемся в fallback режим')
      this.fallbackMode = true
    }
  }

  async analyzeQuery(
    query: string, 
    fuseResults: any[], 
    history: any[] = []
  ): Promise<OllamaAnalysisResult> {
    console.log('🤖 Ollama AI: Анализируем запрос:', query)

    // Если Ollama недоступен, используем fallback
    if (this.fallbackMode) {
      console.log('🔄 Используем fallback режим')
      return this.getFallbackResponse(query, fuseResults)
    }

    try {
      // Быстрый fallback для простых запросов
      if (fuseResults.length === 0) {
        console.log('🔄 Нет результатов Fuse, используем fallback')
        return this.getFallbackResponse(query, fuseResults)
      }

      // Если есть хорошие результаты Fuse, используем их напрямую
      if (fuseResults.length > 0 && fuseResults.some(r => r.score < 0.3)) {
        console.log('✅ Найдены качественные результаты Fuse, используем их напрямую')
        return this.processFuseResultsDirectly(query, fuseResults)
      }

            // 1. Определяем намерение с помощью Ollama (с увеличенным таймаутом)
            const intent = await Promise.race([
              this.predictIntent(query, history),
              new Promise((resolve) => 
                setTimeout(() => resolve({
                  intent: 'general',
                  confidence: 0.3,
                  reasoning: 'Timeout fallback'
                }), 15000) // Увеличили до 15 секунд
              )
            ]) as any

      console.log('🎯 Предсказанное намерение:', intent)

      // Если намерение определено с низкой уверенностью, используем fallback
      if (intent.confidence < 0.4) {
        console.log('🔄 Низкая уверенность, используем fallback')
        return this.getFallbackResponse(query, fuseResults)
      }

      // 2. Загружаем обратную связь для улучшения анализа
      const feedbackContext = await this.loadFeedbackContext(query, intent.intent)
      
      // 3. Анализируем результаты Fuse с помощью AI
      let analysis
      try {
        analysis = await this.analyzeFuseResults(query, fuseResults, intent, feedbackContext)
        console.log('📊 Анализ результатов Fuse завершен')
      } catch (error) {
        console.error('❌ Ошибка анализа результатов:', error)
        console.log('🔄 Используем прямую обработку результатов Fuse')
        return this.processFuseResultsDirectly(query, fuseResults)
      }

      // 4. Генерируем интеллектуальный ответ
      let response
      try {
        response = await this.generateIntelligentResponse(query, analysis, intent)
        console.log('💬 Интеллектуальный ответ сгенерирован')
      } catch (error) {
        console.error('❌ Ошибка генерации ответа:', error)
        console.log('🔄 Используем прямую обработку результатов Fuse')
        return this.processFuseResultsDirectly(query, fuseResults)
      }

      return response

    } catch (error) {
      console.error('❌ Ошибка Ollama AI:', error)
      console.log('🔄 Переключаемся на прямую обработку результатов Fuse')
      this.fallbackMode = true
      
      // Если есть результаты Fuse, используем их напрямую
      if (fuseResults.length > 0) {
        return this.processFuseResultsDirectly(query, fuseResults)
      }
      
      return this.getFallbackResponse(query, fuseResults)
    }
  }

  private async loadFeedbackContext(query: string, intent: string) {
    try {
      // Импортируем модель Feedback динамически
      const { default: Feedback } = await import('~/server/models/Feedback')
      
      // Ищем похожие запросы с обратной связью
      const similarFeedback = await Feedback.find({
        status: 'learned',
        $or: [
          { 'learningData.keywords': { $in: query.toLowerCase().split(' ') } },
          { 'aiAnalysis.intent': intent }
        ]
      })
      .sort({ timestamp: -1 })
      .limit(3)
      .lean()

      if (similarFeedback.length > 0) {
        console.log('📚 Найдена обратная связь для улучшения:', similarFeedback.length)
        return similarFeedback.map(fb => ({
          originalQuery: fb.originalQuery,
          userFeedback: fb.userFeedback,
          correctIntent: fb.learningData?.correctIntent,
          correctResults: fb.learningData?.correctResults
        }))
      }

      return []
    } catch (error) {
      console.error('Ошибка загрузки обратной связи:', error)
      return []
    }
  }

  private async predictIntent(query: string, history: any[]): Promise<{
    intent: string
    confidence: number
    reasoning: string
  }> {
    // Проверяем кэш
    const cacheKey = `intent:${query.toLowerCase().trim()}`
    if (this.cache.has(cacheKey)) {
      console.log('🎯 Используем кэшированное намерение')
      return this.cache.get(cacheKey)
    }

    const prompt = `Определи намерение: "${query}"

Варианты: mkb, ls, algo, drug, substation, general

JSON: {"intent": "mkb", "confidence": 0.8, "reasoning": "кратко"}`

    try {
            const response = await Promise.race([
              this.ollama.chat({
                model: this.model,
                messages: [{ role: 'user', content: prompt }],
                options: { temperature: 0.1 }
              }),
              new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Timeout')), 8000) // Уменьшили до 8 секунд
              )
            ])

      const content = (response as any).message.content
      const parsed = JSON.parse(content)
      
      const result = {
        intent: parsed.intent || 'general',
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || ''
      }
      // Сохраняем результат в кэш
      this.cache.set(cacheKey, result)
      return result

    } catch (error) {
      console.error('Ошибка определения намерения:', error)
      const fallback = {
        intent: 'general',
        confidence: 0.3,
        reasoning: 'Ошибка анализа'
      }
      // Сохраняем fallback в кэш
      this.cache.set(cacheKey, fallback)
      return fallback
    }
  }

  private async analyzeFuseResults(
    query: string, 
    fuseResults: any[], 
    intent: any,
    feedbackContext: any[] = []
  ): Promise<{
    mkb: any[]
    ls: any[]
    algo: any[]
    drug: any[]
    substation: any[]
    extractedDrugs: any[]
    summary: string
  }> {
    const prompt = `
Ты медицинский ассистент. Проанализируй результаты поиска и извлеки препараты из алгоритмов.

ЗАПРОС: "${query}"
НАМЕРЕНИЕ: ${intent.intent} (уверенность: ${intent.confidence})

РЕЗУЛЬТАТЫ ПОИСКА:
${JSON.stringify(fuseResults, null, 2)}

ОБРАТНАЯ СВЯЗЬ ДЛЯ УЛУЧШЕНИЯ:
${feedbackContext.length > 0 ? JSON.stringify(feedbackContext, null, 2) : 'Нет обратной связи'}

ЗАДАЧИ:
1. Проанализируй алгоритмы и извлеки ВСЕ препараты с дозировками
2. Определи контекст применения каждого препарата
3. Сгруппируй результаты по типам
4. Создай краткое резюме
5. Учти обратную связь для улучшения анализа

ФОРМАТ ОТВЕТА (JSON):
{
  "mkb": [результаты МКБ],
  "ls": [локальные статусы],
  "algo": [алгоритмы],
  "drug": [препараты],
  "substation": [подстанции],
  "extractedDrugs": [
    {
      "name": "название препарата",
      "dosage": "дозировка",
      "context": "контекст применения",
      "indication": "показание"
    }
  ],
  "summary": "краткое резюме найденного"
}

ВАЖНО:
- Ищи препараты во ВСЕХ алгоритмах
- Извлекай точные дозировки
- Указывай контекст применения
- Учти обратную связь для более точного анализа
- Отвечай только в формате JSON
`

    try {
      const response = await Promise.race([
        this.ollama.chat({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          options: { temperature: 0.1 }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 15000)
        )
      ])

      const content = (response as any).message.content
      const parsed = JSON.parse(content)
      
      return {
        mkb: parsed.mkb || [],
        ls: parsed.ls || [],
        algo: parsed.algo || [],
        drug: parsed.drug || [],
        substation: parsed.substation || [],
        extractedDrugs: parsed.extractedDrugs || [],
        summary: parsed.summary || ''
      }

    } catch (error) {
      console.error('Ошибка анализа результатов:', error)
      return this.fallbackAnalysis(fuseResults)
    }
  }

  private async generateIntelligentResponse(
    query: string,
    analysis: any,
    intent: any
  ): Promise<OllamaAnalysisResult> {
    const prompt = `
Ты дружелюбный медицинский ассистент. Создай ответ пользователю в стиле беседы.

ЗАПРОС ПОЛЬЗОВАТЕЛЯ: "${query}"
НАМЕРЕНИЕ: ${intent.intent}

АНАЛИЗ:
${JSON.stringify(analysis, null, 2)}

ЗАДАЧИ:
1. Создай дружелюбный ответ в стиле беседы
2. Объясни, что найдено
3. Предложи дополнительные вопросы
4. Используй эмодзи для дружелюбности
5. Сохрани структуру ответа как в оригинале

СТИЛЬ ОТВЕТА:
- Как в беседе с коллегой
- Короткие предложения
- Эмодзи для дружелюбности
- Предложения по дальнейшим действиям
- Используй markdown форматирование

ФОРМАТ ОТВЕТА (JSON):
{
  "message": "основное сообщение в markdown",
  "availableSections": ["algo", "drug", "mkb", "ls"],
  "clarifyingQuestions": ["вопрос1", "вопрос2"],
  "humanResponse": "дружелюбный ответ для пользователя"
}
`

    try {
      const response = await Promise.race([
        this.ollama.chat({
          model: this.model,
          messages: [{ role: 'user', content: prompt }],
          options: { temperature: 0.7 }
        }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 20000)
        )
      ])

      const content = (response as any).message.content
      const parsed = JSON.parse(content)

      // Формируем результаты в нужном формате
      const results = [
        ...analysis.mkb.map((item: any) => this.mapToResult(item, 'mkb')),
        ...analysis.ls.map((item: any) => this.mapToResult(item, 'ls')),
        ...analysis.algo.map((item: any) => this.mapToResult(item, 'algorithm')),
        ...analysis.drug.map((item: any) => this.mapToResult(item, 'drug')),
        ...analysis.substation.map((item: any) => this.mapToResult(item, 'substation'))
      ]

      return {
        message: parsed.message || analysis.summary,
        results,
        fullResults: {
          mkb: analysis.mkb.map((item: any) => this.mapToResult(item, 'mkb')),
          ls: analysis.ls.map((item: any) => this.mapToResult(item, 'ls')),
          algo: analysis.algo.map((item: any) => this.mapToResult(item, 'algorithm')),
          drug: analysis.drug.map((item: any) => this.mapToResult(item, 'drug')),
          substation: analysis.substation.map((item: any) => this.mapToResult(item, 'substation'))
        },
        forceExpand: null,
        intent: intent.intent,
        availableSections: parsed.availableSections || [],
        clarifyingQuestions: parsed.clarifyingQuestions || [],
        aiIntent: intent.intent,
        aiConfidence: intent.confidence
      }

    } catch (error) {
      console.error('Ошибка генерации ответа:', error)
      return this.getFallbackResponse(query, [])
    }
  }

  private mapToResult(item: any, type: string): any {
    const base = {
      id: String(item._id || item.id || Math.random()),
      title: item.title || item.name || '',
      description: item.description || item.note || '',
      type,
      url: this.buildUrl(item, type),
      data: item
    }

    if (type === 'mkb') {
      base.codes = { mkbCode: item.mkbCode, stationCode: item.stationCode }
      base.category = item.category?.name
    }

    if (type === 'ls') {
      base.localis = item.localis || item.description || item.note || ''
    }

    if (type === 'drug' && item.extractedDosage) {
      base.dosage = item.extractedDosage
      base.context = item.extractedContext
    }

    return base
  }

  private buildUrl(item: any, type: string): string {
    switch (type) {
      case 'mkb': return `/codifier/${item.category?.url}?id=${item._id}`
      case 'ls': return `/local-statuses/${item.category?.url}?id=${item._id}`
      case 'algorithm': return `/algorithms/${item.section?.url}/${item.category?.url}/${item._id}`
      case 'drug': return `/drugs?id=${item._id}`
      case 'substation': return `/substations?select=${encodeURIComponent(item.title || item.name || '')}`
      default: return ''
    }
  }

  private async findSimilarDiagnoses(diagnosisTitle: string, mkbCode: string, limit: number = 3) {
    try {
      const { default: MKB } = await import('~/server/models/MKB')
      
      // Извлекаем ключевые слова из диагноза
      const excludeWords = ['болезнь', 'синдром', 'состояние', 'нарушение', 'патология', 'заболевание']
      const keywords = diagnosisTitle.toLowerCase()
        .replace(/[\[\]()]/g, '')
        .split(/[\s,]+/)
        .filter((word: string) => word.length > 3 && !excludeWords.includes(word))
        .slice(0, 3)
      
      let similarDiagnoses: any[] = []
      
      if (keywords.length > 0) {
        // Ищем похожие диагнозы по ключевым словам
        similarDiagnoses = await MKB.find({
          $and: [
            { mkbCode: { $ne: mkbCode } }, // Исключаем текущий диагноз по МКБ коду
            {
              $or: [
                { name: { $regex: keywords.join('|'), $options: 'i' } },
                { note: { $regex: keywords.join('|'), $options: 'i' } }
              ]
            }
          ]
        })
        .populate('category', 'name url')
        .limit(limit)
        .lean()
      }
      
      return similarDiagnoses
    } catch (error) {
      console.error('Ошибка поиска похожих диагнозов:', error)
      return []
    }
  }

  private fallbackAnalysis(fuseResults: any[]): any {
    const grouped = {
      mkb: fuseResults.filter(r => r.type === 'mkb'),
      ls: fuseResults.filter(r => r.type === 'ls'),
      algo: fuseResults.filter(r => r.type === 'algorithm'),
      drug: fuseResults.filter(r => r.type === 'drug'),
      substation: fuseResults.filter(r => r.type === 'substation'),
      extractedDrugs: [],
      summary: `Найдено ${fuseResults.length} результатов`
    }

    return grouped
  }

  private async processFuseResultsDirectly(query: string, fuseResults: any[]): Promise<OllamaAnalysisResult> {
    console.log('📊 Обрабатываем результаты Fuse напрямую')
    
    const results = fuseResults.map(item => this.mapToResult(item, item.type))
    
    // Простое определение намерения на основе ключевых слов
    const qLower = query.toLowerCase()
    let intent = 'general'
    let confidence = 0.7 // Высокая уверенность для прямых результатов Fuse
    
    if (qLower.includes('мкб') || qLower.includes('код') || qLower.includes('диагноз')) {
      intent = 'mkb'
    } else if (qLower.includes('препарат') || qLower.includes('лекарство') || qLower.includes('дозировк')) {
      intent = 'drug'
    } else if (qLower.includes('алгоритм') || qLower.includes('лечение') || qLower.includes('протокол')) {
      intent = 'algo'
    } else if (qLower.includes('статус') || qLower.includes('локалис') || qLower.includes('описание')) {
      intent = 'ls'
    } else if (qLower.includes('подстанц') || qLower.includes('станция')) {
      intent = 'substation'
    }
    
    // Определяем доступные разделы на основе результатов
    const availableSections = []
    if (results.some(r => r.type === 'mkb')) availableSections.push('mkb')
    if (results.some(r => r.type === 'ls')) availableSections.push('ls')
    if (results.some(r => r.type === 'algorithm')) availableSections.push('algo')
    if (results.some(r => r.type === 'drug')) availableSections.push('drug')
    if (results.some(r => r.type === 'substation')) availableSections.push('substation')
    
    // Информативное сообщение с конкретными результатами
    let message = `По запросу "${query}" найдено ${results.length} результатов:\n\n`
    
    // Группируем результаты по типам
    const mkbResults = results.filter(r => r.type === 'mkb')
    const lsResults = results.filter(r => r.type === 'ls')
    const algoResults = results.filter(r => r.type === 'algorithm')
    const drugResults = results.filter(r => r.type === 'drug')
    const substationResults = results.filter(r => r.type === 'substation')
    
    if (mkbResults.length > 0) {
      message += `**🏥 МКБ коды и диагнозы (${mkbResults.length}):**\n`
      mkbResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.codes?.mkbCode) message += ` — МКБ: ${result.codes.mkbCode}`
        if (result.codes?.stationCode) message += `; Станция: ${result.codes.stationCode}`
        message += `\n`
      })
      if (mkbResults.length > 3) message += `• ... и еще ${mkbResults.length - 3} диагнозов\n`
      message += `\n`
    }
    
    if (algoResults.length > 0) {
      message += `**📋 Алгоритмы лечения (${algoResults.length}):**\n`
      algoResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.category) message += ` — ${result.category}`
        message += `\n`
      })
      if (algoResults.length > 3) message += `• ... и еще ${algoResults.length - 3} алгоритмов\n`
      message += `\n`
    }
    
    if (drugResults.length > 0) {
      message += `**💊 Препараты (${drugResults.length}):**\n`
      drugResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.latinName) message += ` (${result.latinName})`
        message += `\n`
      })
      if (drugResults.length > 3) message += `• ... и еще ${drugResults.length - 3} препаратов\n`
      message += `\n`
    }
    
    if (lsResults.length > 0) {
      message += `**📍 Локальные статусы (${lsResults.length}):**\n`
      lsResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.localis) message += ` — ${result.localis}`
        message += `\n`
      })
      if (lsResults.length > 3) message += `• ... и еще ${lsResults.length - 3} статусов\n`
      message += `\n`
    }
    
    if (substationResults.length > 0) {
      message += `**🚑 Подстанции скорой помощи (${substationResults.length}):**\n`
      substationResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.address) message += ` — ${result.address}`
        message += `\n`
      })
      if (substationResults.length > 3) message += `• ... и еще ${substationResults.length - 3} подстанций\n`
      message += `\n`
    }
    
    return {
      message,
      results,
      fullResults: {
        mkb: results.filter(r => r.type === 'mkb'),
        ls: results.filter(r => r.type === 'ls'),
        algo: results.filter(r => r.type === 'algorithm'),
        drug: results.filter(r => r.type === 'drug'),
        substation: results.filter(r => r.type === 'substation')
      },
      forceExpand: null,
      intent,
      availableSections,
      clarifyingQuestions: ['Попробуйте уточнить запрос', 'Покажите только МКБ', 'Покажите только препараты'],
      aiIntent: intent,
      aiConfidence: confidence
    }
  }

  private getFallbackResponse(query: string, fuseResults: any[]): OllamaAnalysisResult {
    const results = fuseResults.map(item => this.mapToResult(item, item.type))
    
    // Простое определение намерения на основе ключевых слов
    const qLower = query.toLowerCase()
    let intent = 'general'
    let confidence = 0.5
    
    if (qLower.includes('мкб') || qLower.includes('код') || qLower.includes('диагноз')) {
      intent = 'mkb'
      confidence = 0.7
    } else if (qLower.includes('препарат') || qLower.includes('лекарство') || qLower.includes('дозировк')) {
      intent = 'drug'
      confidence = 0.7
    } else if (qLower.includes('алгоритм') || qLower.includes('лечение') || qLower.includes('протокол')) {
      intent = 'algo'
      confidence = 0.7
    } else if (qLower.includes('статус') || qLower.includes('локалис') || qLower.includes('описание')) {
      intent = 'ls'
      confidence = 0.7
    } else if (qLower.includes('подстанц') || qLower.includes('станция')) {
      intent = 'substation'
      confidence = 0.7
    }
    
    // Определяем доступные разделы на основе результатов
    const availableSections = []
    if (results.some(r => r.type === 'mkb')) availableSections.push('mkb')
    if (results.some(r => r.type === 'ls')) availableSections.push('ls')
    if (results.some(r => r.type === 'algorithm')) availableSections.push('algo')
    if (results.some(r => r.type === 'drug')) availableSections.push('drug')
    if (results.some(r => r.type === 'substation')) availableSections.push('substation')
    
    // Информативное сообщение с конкретными результатами
    let message = `По запросу "${query}" найдено ${results.length} результатов:\n\n`
    
    // Группируем результаты по типам
    const mkbResults = results.filter(r => r.type === 'mkb')
    const lsResults = results.filter(r => r.type === 'ls')
    const algoResults = results.filter(r => r.type === 'algorithm')
    const drugResults = results.filter(r => r.type === 'drug')
    const substationResults = results.filter(r => r.type === 'substation')
    
    if (mkbResults.length > 0) {
      message += `**🏥 МКБ коды и диагнозы (${mkbResults.length}):**\n`
      mkbResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.codes?.mkbCode) message += ` — МКБ: ${result.codes.mkbCode}`
        if (result.codes?.stationCode) message += `; Станция: ${result.codes.stationCode}`
        message += `\n`
      })
      if (mkbResults.length > 3) message += `• ... и еще ${mkbResults.length - 3} диагнозов\n`
      message += `\n`
    }
    
    if (algoResults.length > 0) {
      message += `**📋 Алгоритмы лечения (${algoResults.length}):**\n`
      algoResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.category) message += ` — ${result.category}`
        message += `\n`
      })
      if (algoResults.length > 3) message += `• ... и еще ${algoResults.length - 3} алгоритмов\n`
      message += `\n`
    }
    
    if (drugResults.length > 0) {
      message += `**💊 Препараты (${drugResults.length}):**\n`
      drugResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.latinName) message += ` (${result.latinName})`
        message += `\n`
      })
      if (drugResults.length > 3) message += `• ... и еще ${drugResults.length - 3} препаратов\n`
      message += `\n`
    }
    
    if (lsResults.length > 0) {
      message += `**📍 Локальные статусы (${lsResults.length}):**\n`
      lsResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.localis) message += ` — ${result.localis}`
        message += `\n`
      })
      if (lsResults.length > 3) message += `• ... и еще ${lsResults.length - 3} статусов\n`
      message += `\n`
    }
    
    if (substationResults.length > 0) {
      message += `**🚑 Подстанции скорой помощи (${substationResults.length}):**\n`
      substationResults.slice(0, 3).forEach(result => {
        message += `• ${result.title}`
        if (result.address) message += ` — ${result.address}`
        message += `\n`
      })
      if (substationResults.length > 3) message += `• ... и еще ${substationResults.length - 3} подстанций\n`
      message += `\n`
    }
    
    message += `💡 Используется упрощенный режим анализа.`
    
    return {
      message,
      results,
      fullResults: {
        mkb: results.filter(r => r.type === 'mkb'),
        ls: results.filter(r => r.type === 'ls'),
        algo: results.filter(r => r.type === 'algorithm'),
        drug: results.filter(r => r.type === 'drug'),
        substation: results.filter(r => r.type === 'substation')
      },
      forceExpand: null,
      intent,
      availableSections,
      clarifyingQuestions: ['Попробуйте уточнить запрос', 'Покажите только МКБ', 'Покажите только препараты'],
      aiIntent: intent,
      aiConfidence: confidence
    }
  }
}

export const ollamaAI = new OllamaMedicalAI()
