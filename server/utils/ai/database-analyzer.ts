import connectDB from '~/server/utils/mongodb'
import MKB from '~/server/models/MKB'
import LocalStatus from '~/server/models/LocalStatus'
import Algorithm from '~/server/models/Algorithm'
import Drug from '~/server/models/Drug'

export interface ComprehensiveAnalysis {
  diagnosis: {
    mkb: any[]
    summary: string
  }
  treatment: {
    algorithms: any[]
    drugs: any[]
    localStatuses: any[]
    summary: string
  }
  recommendations: string[]
  humanResponse: string
}

export class DatabaseAnalyzer {
  
  async analyzeQuery(query: string): Promise<ComprehensiveAnalysis> {
    console.log('🧠 Начинаем комплексный анализ запроса:', query)
    
    try {
      await connectDB()
      
      // 1. Определяем тип запроса и извлекаем ключевые термины
      const queryAnalysis = this.analyzeQueryIntent(query)
      console.log('📊 Анализ запроса:', queryAnalysis)
      
      // 2. Ищем диагнозы МКБ
      const mkbResults = await this.findMKBDiagnoses(query, queryAnalysis)
      
      // 3. Ищем алгоритмы лечения
      const algorithmResults = await this.findTreatmentAlgorithms(query, queryAnalysis, mkbResults)
      
      // 4. Ищем препараты
      const drugResults = await this.findDrugs(query, queryAnalysis, algorithmResults)
      
      // 5. Ищем локальные статусы
      const localStatusResults = await this.findLocalStatuses(query, queryAnalysis)
      
      // 6. Генерируем комплексный ответ
      const analysis = this.generateComprehensiveAnalysis({
        query,
        mkbResults,
        algorithmResults,
        drugResults,
        localStatusResults,
        queryAnalysis
      })
      
      console.log('✅ Комплексный анализ завершен')
      return analysis
      
    } catch (error) {
      console.error('❌ Ошибка комплексного анализа:', error)
      return this.getErrorAnalysis(query)
    }
  }
  
  private analyzeQueryIntent(query: string) {
    const qLower = query.toLowerCase()
    
    return {
      // Тип запроса
      isCode: /^\d{4}$/.test(query.trim()) || /^[A-Z]\d{2}(\.\d+)?$/i.test(query.trim()),
      isDrugQuery: /препарат|лекарство|дозировк|дозу/i.test(qLower),
      isAlgorithmQuery: /алгоритм|лечение|терапия|протокол/i.test(qLower),
      isDiagnosisQuery: /диагноз|мкб|код/i.test(qLower),
      
      // Ключевые термины
      medicalTerms: this.extractMedicalTerms(query),
      
      // Контекст
      isEmergency: /криз|острый|неотложн|экстренн/i.test(qLower),
      isPediatric: /дет|ребен|педиатр|младен/i.test(qLower),
      isAdult: /взросл|взрослый/i.test(qLower)
    }
  }
  
  private extractMedicalTerms(query: string): string[] {
    const terms = query
      .toLowerCase()
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter(term => term.length >= 3)
      .filter(term => !['при', 'для', 'лечения', 'терапии', 'симптомов'].includes(term))
    
    return [...new Set(terms)]
  }
  
  private async findMKBDiagnoses(query: string, analysis: any) {
    console.log('🔍 Ищем диагнозы МКБ...')
    
    const results: any[] = []
    
    // Точный поиск по коду
    if (analysis.isCode) {
      const stationCode = /^\d{4}$/.test(query.trim()) ? query.trim() : null
      const mkbCode = /^[A-Z]\d{2}(\.\d+)?$/i.test(query.trim()) ? query.trim() : null
      
      if (stationCode) {
        const exact = await MKB.find({ stationCode })
          .populate('category', 'name url')
          .lean()
        results.push(...exact)
      }
      
      if (mkbCode) {
        const exact = await MKB.find({ mkbCode })
          .populate('category', 'name url')
          .lean()
        results.push(...exact)
      }
    }
    
    // Семантический поиск по названию
    if (results.length === 0 && analysis.medicalTerms.length > 0) {
      const searchTerms = analysis.medicalTerms.join('|')
      const semantic = await MKB.find({
        $or: [
          { name: { $regex: searchTerms, $options: 'i' } },
          { note: { $regex: searchTerms, $options: 'i' } }
        ]
      })
        .populate('category', 'name url')
        .limit(5)
        .lean()
      
      results.push(...semantic)
    }
    
    console.log(`📋 Найдено диагнозов МКБ: ${results.length}`)
    return results
  }
  
  private async findTreatmentAlgorithms(query: string, analysis: any, mkbResults: any[]) {
    console.log('🔍 Ищем алгоритмы лечения...')
    
    const results: any[] = []
    
    // Поиск по диагнозам МКБ
    if (mkbResults.length > 0) {
      const diagnosisTerms = mkbResults
        .map(mkb => mkb.name)
        .join(' ')
        .toLowerCase()
        .replace(/[^\p{L}\s]/gu, ' ')
        .split(/\s+/)
        .filter(term => term.length >= 4)
        .slice(0, 3)
      
      if (diagnosisTerms.length > 0) {
        const searchTerms = diagnosisTerms.join('|')
        const algorithms = await Algorithm.find({
          $or: [
            { title: { $regex: searchTerms, $options: 'i' } },
            { description: { $regex: searchTerms, $options: 'i' } },
            { content: { $regex: searchTerms, $options: 'i' } }
          ]
        })
          .populate('category', 'name url')
          .populate('section', 'name url')
          .limit(5)
          .lean()
        
        results.push(...algorithms)
      }
    }
    
    // Поиск по ключевым терминам запроса
    if (results.length === 0 && analysis.medicalTerms.length > 0) {
      const searchTerms = analysis.medicalTerms.join('|')
      const algorithms = await Algorithm.find({
        $or: [
          { title: { $regex: searchTerms, $options: 'i' } },
          { description: { $regex: searchTerms, $options: 'i' } },
          { content: { $regex: searchTerms, $options: 'i' } }
        ]
      })
        .populate('category', 'name url')
        .populate('section', 'name url')
        .limit(5)
        .lean()
      
      results.push(...algorithms)
    }
    
    console.log(`🔬 Найдено алгоритмов: ${results.length}`)
    return results
  }
  
  private async findDrugs(query: string, analysis: any, algorithmResults: any[]) {
    console.log('🔍 Ищем препараты...')
    
    const results: any[] = []
    
    // Извлекаем препараты из алгоритмов
    if (algorithmResults.length > 0) {
      const extractedDrugs = await this.extractDrugsFromAlgorithms(algorithmResults)
      
      if (extractedDrugs.length > 0) {
        // Ищем найденные препараты в БД
        const drugNames = extractedDrugs.map(d => d.name)
        const searchConditions = drugNames.flatMap(name => [
          { name: { $regex: name, $options: 'i' } },
          { latinName: { $regex: name, $options: 'i' } },
          { synonyms: { $elemMatch: { $regex: name, $options: 'i' } } }
        ])
        
        const foundDrugs = await Drug.find({
          $or: searchConditions
        }).limit(10).lean()
        
        // Объединяем данные из алгоритмов с данными из БД
        results.push(...foundDrugs.map(drug => {
          const extractedDrug = extractedDrugs.find(ed => 
            ed.name.toLowerCase() === drug.name.toLowerCase()
          )
          
          return {
            ...drug,
            extractedDosage: extractedDrug?.dosage || '',
            extractedContext: extractedDrug?.context || ''
          }
        }))
      }
    }
    
    // Прямой поиск препаратов по запросу
    if (analysis.isDrugQuery && analysis.medicalTerms.length > 0) {
      const searchTerms = analysis.medicalTerms.join('|')
      const directDrugs = await Drug.find({
        $or: [
          { name: { $regex: searchTerms, $options: 'i' } },
          { latinName: { $regex: searchTerms, $options: 'i' } },
          { synonyms: { $elemMatch: { $regex: searchTerms, $options: 'i' } } }
        ]
      }).limit(5).lean()
      
      results.push(...directDrugs)
    }
    
    console.log(`💊 Найдено препаратов: ${results.length}`)
    return results
  }
  
  private async findLocalStatuses(query: string, analysis: any) {
    console.log('🔍 Ищем локальные статусы...')
    
    const results: any[] = []
    
    if (analysis.medicalTerms.length > 0) {
      const searchTerms = analysis.medicalTerms.join('|')
      const localStatuses = await LocalStatus.find({
        $or: [
          { name: { $regex: searchTerms, $options: 'i' } },
          { description: { $regex: searchTerms, $options: 'i' } },
          { localis: { $regex: searchTerms, $options: 'i' } },
          { note: { $regex: searchTerms, $options: 'i' } }
        ]
      })
        .populate('category', 'name url')
        .limit(3)
        .lean()
      
      results.push(...localStatuses)
    }
    
    console.log(`📝 Найдено локальных статусов: ${results.length}`)
    return results
  }
  
  private async extractDrugsFromAlgorithms(algorithms: any[]) {
    const drugPatterns = [
      /\|\s*([А-ЯЁ][а-яё\s]+)\s*\|\s*([^|]+)/g,
      /(?:^|\n)\s*[-•*]\s*([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/gi,
      /\(([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)\)/gi,
      /:\s*([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/gi,
      /([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*-\s*\d+[.,]?\d*\s*мг)/gi,
      /- ([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/g,
      /([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/g
    ]
    
    const foundDrugs = new Map<string, {dosage: string, context: string}>()
    
    for (const algo of algorithms) {
      const content = algo.content || algo.description || ''
      
      for (const pattern of drugPatterns) {
        let match
        while ((match = pattern.exec(content)) !== null) {
          const drugName = match[1] ? match[1].trim() : match[0].trim()
          const dosage = match[2] ? match[2].trim() : ''
          
          if (this.isValidDrugName(drugName)) {
            const context = this.extractContext(content, match.index, match[0].length)
            foundDrugs.set(drugName, { dosage, context })
          }
        }
      }
    }
    
    return Array.from(foundDrugs.entries()).map(([name, info]) => ({
      name,
      dosage: info.dosage,
      context: info.context
    }))
  }
  
  private isValidDrugName(name: string): boolean {
    const lowerName = name.toLowerCase()
    
    if (name.length < 3 || name.length > 50) return false
    
    const excludeTerms = [
      'препарат', 'лекарство', 'средство', 'таблетка', 'капсула', 'раствор',
      'инъекция', 'укол', 'капельница', 'дозировка', 'доза', 'мг', 'мл',
      'внутрь', 'внутривенно', 'подкожно', 'внутримышечно', 'перорально',
      'при', 'для', 'лечения', 'терапии', 'симптомов', 'заболевания',
      'болезни', 'патологии', 'состояния', 'синдрома', 'симптома',
      'пациент', 'больной', 'человек', 'взрослый', 'ребенок'
    ]
    
    if (excludeTerms.some(term => lowerName.includes(term))) return false
    if (!/[а-яё]/i.test(name)) return false
    
    return true
  }
  
  private extractContext(content: string, matchIndex: number, matchLength: number): string {
    const contextStart = Math.max(0, matchIndex - 150)
    const contextEnd = Math.min(content.length, matchIndex + matchLength + 150)
    const context = content.substring(contextStart, contextEnd)
    
    const contextPatterns = [
      /при\s+([^-\n]+?)(?=\s*-\s*[А-ЯЁ]|$)/gi,
      /для\s+([^-\n]+?)(?=\s*-\s*[А-ЯЁ]|$)/gi,
      /в\s+случае\s+([^-\n]+?)(?=\s*-\s*[А-ЯЁ]|$)/gi
    ]
    
    for (const pattern of contextPatterns) {
      const match = pattern.exec(context)
      if (match) {
        return match[1].trim()
      }
    }
    
    return ''
  }
  
  private generateComprehensiveAnalysis(data: any): ComprehensiveAnalysis {
    const { query, mkbResults, algorithmResults, drugResults, localStatusResults, queryAnalysis } = data
    
    // Генерируем диагноз
    const diagnosis = {
      mkb: mkbResults,
      summary: this.generateDiagnosisSummary(mkbResults, query)
    }
    
    // Генерируем лечение
    const treatment = {
      algorithms: algorithmResults,
      drugs: drugResults,
      localStatuses: localStatusResults,
      summary: this.generateTreatmentSummary(algorithmResults, drugResults, queryAnalysis)
    }
    
    // Генерируем рекомендации
    const recommendations = this.generateRecommendations(queryAnalysis, mkbResults, drugResults)
    
    // Генерируем человеческий ответ
    const humanResponse = this.generateHumanResponse(query, {
      diagnosis,
      treatment,
      recommendations
    })
    
    return {
      diagnosis,
      treatment,
      recommendations,
      humanResponse
    }
  }
  
  private generateDiagnosisSummary(mkbResults: any[], query: string): string {
    if (mkbResults.length === 0) {
      return `По запросу "${query}" диагнозы не найдены.`
    }
    
    const primaryDiagnosis = mkbResults[0]
    return `Основной диагноз: ${primaryDiagnosis.name} (МКБ: ${primaryDiagnosis.mkbCode || 'N/A'})`
  }
  
  private generateTreatmentSummary(algorithms: any[], drugs: any[], analysis: any): string {
    const parts = []
    
    if (algorithms.length > 0) {
      parts.push(`Найдено ${algorithms.length} алгоритм(ов) лечения`)
    }
    
    if (drugs.length > 0) {
      parts.push(`${drugs.length} препарат(ов) для терапии`)
    }
    
    if (analysis.isEmergency) {
      parts.push('⚠️ Требуется неотложная помощь')
    }
    
    return parts.length > 0 ? parts.join(', ') : 'Лечение не найдено'
  }
  
  private generateRecommendations(analysis: any, mkbResults: any[], drugResults: any[]): string[] {
    const recommendations = []
    
    if (analysis.isEmergency) {
      recommendations.push('🚨 Немедленно обратитесь за неотложной медицинской помощью')
    }
    
    if (analysis.isPediatric) {
      recommendations.push('👶 Учитывайте возрастные особенности при назначении препаратов')
    }
    
    if (drugResults.length > 0) {
      recommendations.push('💊 Обратите внимание на дозировки и противопоказания препаратов')
    }
    
    if (mkbResults.length > 0) {
      recommendations.push('📋 Уточните диагноз с помощью дополнительных исследований')
    }
    
    return recommendations
  }
  
  private generateHumanResponse(query: string, data: any): string {
    const { diagnosis, treatment, recommendations } = data
    
    let response = `Привет! 👋 Я проанализировала ваш запрос "${query}" и вот что нашла:\n\n`
    
    // Диагноз
    if (diagnosis.mkb.length > 0) {
      response += `📋 **Диагноз:**\n${diagnosis.summary}\n\n`
    }
    
    // Лечение
    if (treatment.algorithms.length > 0 || treatment.drugs.length > 0) {
      response += `🔬 **Лечение:**\n${treatment.summary}\n\n`
      
      if (treatment.drugs.length > 0) {
        response += `💊 **Препараты:**\n`
        treatment.drugs.slice(0, 5).forEach((drug: any) => {
          response += `• ${drug.name}${drug.extractedDosage ? ` — ${drug.extractedDosage}` : ''}\n`
        })
        response += '\n'
      }
    }
    
    // Рекомендации
    if (recommendations.length > 0) {
      response += `💡 **Рекомендации:**\n`
      recommendations.forEach(rec => {
        response += `${rec}\n`
      })
      response += '\n'
    }
    
    response += `Есть вопросы? Задавайте! 😊`
    
    return response
  }
  
  private getErrorAnalysis(query: string): ComprehensiveAnalysis {
    return {
      diagnosis: {
        mkb: [],
        summary: 'Ошибка анализа запроса'
      },
      treatment: {
        algorithms: [],
        drugs: [],
        localStatuses: [],
        summary: 'Данные недоступны'
      },
      recommendations: ['Попробуйте переформулировать запрос'],
      humanResponse: `Извините, произошла ошибка при анализе запроса "${query}". Попробуйте еще раз. 😔`
    }
  }
}

export const dbAnalyzer = new DatabaseAnalyzer()
