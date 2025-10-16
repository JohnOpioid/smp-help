// Простой AI-анализатор для извлечения препаратов из алгоритмов
// Использует встроенные возможности Node.js для анализа текста

export interface DrugInfo {
  name: string
  dosage: string
  context: string
  indication: string
}

export interface AnalysisResult {
  drugs: DrugInfo[]
  summary: string
}

export class SimpleDrugExtractor {
  
  async extractDrugsFromAlgorithm(algorithmContent: string, diagnosis: string): Promise<AnalysisResult> {
    console.log('🔍 Анализируем алгоритм с помощью простого AI-анализатора')
    
    try {
      // Улучшенные паттерны для поиска препаратов
      const drugPatterns = [
        // Таблицы с препаратами (формат: | Препарат | Доза |)
        /\|\s*([А-ЯЁ][а-яё\s]+)\s*\|\s*([^|]+)/g,
        
        // Препараты с дозировками в списках
        /(?:^|\n)\s*[-•*]\s*([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/gi,
        
        // Препараты в скобках с дозировками
        /\(([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)\)/gi,
        
        // Препараты после двоеточия
        /:\s*([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/gi,
        
        // Препараты с диапазоном дозировок
        /([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*-\s*\d+[.,]?\d*\s*мг)/gi,
        
        // Простые паттерны
        /- ([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/g,
        /([А-ЯЁ][а-яё\s]+)\s+(\d+[.,]?\d*\s*мг)/g
      ]
      
      const foundDrugs = new Map<string, DrugInfo>()
      
      // Ищем препараты по всем паттернам
      for (const pattern of drugPatterns) {
        let match
        while ((match = pattern.exec(algorithmContent)) !== null) {
          const drugName = match[1] ? match[1].trim() : match[0].trim()
          const dosage = match[2] ? match[2].trim() : ''
          
          // Фильтруем результаты
          if (this.isValidDrugName(drugName)) {
            // Извлекаем контекст применения
            const context = this.extractContext(algorithmContent, match.index, match[0].length)
            
            foundDrugs.set(drugName, {
              name: drugName,
              dosage: dosage,
              context: context,
              indication: this.inferIndication(drugName, diagnosis)
            })
          }
        }
      }
      
      const drugs = Array.from(foundDrugs.values())
      const summary = this.generateSummary(diagnosis, drugs)
      
      console.log(`✅ Найдено препаратов: ${drugs.length}`)
      console.log(`📋 Препараты: ${drugs.map(d => d.name).join(', ')}`)
      
      return {
        drugs,
        summary
      }
      
    } catch (error) {
      console.error('❌ Ошибка анализа алгоритма:', error)
      return {
        drugs: [],
        summary: 'Ошибка анализа алгоритма'
      }
    }
  }
  
  private isValidDrugName(name: string): boolean {
    const lowerName = name.toLowerCase()
    
    // Исключаем слишком короткие и длинные названия
    if (name.length < 3 || name.length > 50) return false
    
    // Исключаем общие медицинские термины
    const excludeTerms = [
      'препарат', 'лекарство', 'средство', 'таблетка', 'капсула', 'раствор',
      'инъекция', 'укол', 'капельница', 'дозировка', 'доза', 'мг', 'мл',
      'внутрь', 'внутривенно', 'подкожно', 'внутримышечно', 'перорально',
      'при', 'для', 'лечения', 'терапии', 'симптомов', 'заболевания',
      'болезни', 'патологии', 'состояния', 'синдрома', 'симптома',
      'пациент', 'больной', 'человек', 'взрослый', 'ребенок'
    ]
    
    if (excludeTerms.some(term => lowerName.includes(term))) return false
    
    // Должно содержать русские буквы
    if (!/[а-яё]/i.test(name)) return false
    
    return true
  }
  
  private extractContext(content: string, matchIndex: number, matchLength: number): string {
    // Извлекаем контекст вокруг найденного препарата
    const contextStart = Math.max(0, matchIndex - 150)
    const contextEnd = Math.min(content.length, matchIndex + matchLength + 150)
    const context = content.substring(contextStart, contextEnd)
    
    // Ищем указания на применение
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
  
  private inferIndication(drugName: string, diagnosis: string): string {
    const lowerDrug = drugName.toLowerCase()
    const lowerDiagnosis = diagnosis.toLowerCase()
    
    // Простая логика определения показаний
    if (lowerDiagnosis.includes('гипертензивная') || lowerDiagnosis.includes('гипертоническая')) {
      if (lowerDrug.includes('моксонидин') || lowerDrug.includes('клонидин')) {
        return 'При гипертоническом кризе'
      }
      if (lowerDrug.includes('каптоприл') || lowerDrug.includes('эналаприл')) {
        return 'При артериальной гипертензии'
      }
      if (lowerDrug.includes('метопролол') || lowerDrug.includes('пропранолол')) {
        return 'При тахикардии'
      }
    }
    
    return 'По показаниям'
  }
  
  private generateSummary(diagnosis: string, drugs: DrugInfo[]): string {
    if (drugs.length === 0) {
      return `Для диагноза "${diagnosis}" препараты не найдены в алгоритмах.`
    }
    
    const drugNames = drugs.map(d => d.name).join(', ')
    return `Для диагноза "${diagnosis}" рекомендованы препараты: ${drugNames}.`
  }
  
  async generateHumanResponse(query: string, results: any[]): Promise<string> {
    // Генерируем дружелюбный ответ
    const hasResults = results && results.length > 0
    
    if (!hasResults) {
      return `К сожалению, по вашему запросу "${query}" ничего не найдено. 😔\n\nПопробуйте уточнить поиск или задать вопрос по-другому.`
    }
    
    const resultTypes = [...new Set(results.map(r => r.type))]
    let response = `Отлично! Я нашла информацию по вашему запросу "${query}". 🎉\n\n`
    
    if (resultTypes.includes('mkb')) {
      const mkbResults = results.filter(r => r.type === 'mkb')
      response += `📋 **Диагнозы МКБ (${mkbResults.length}):**\n`
      mkbResults.forEach(r => {
        response += `• ${r.title} — МКБ: ${r.data?.mkbCode || 'N/A'}\n`
      })
      response += '\n'
    }
    
    if (resultTypes.includes('algorithm')) {
      const algoResults = results.filter(r => r.type === 'algorithm')
      response += `🔬 **Алгоритмы лечения (${algoResults.length}):**\n`
      algoResults.forEach(r => {
        response += `• ${r.title}\n`
      })
      response += '\n'
    }
    
    if (resultTypes.includes('drug')) {
      const drugResults = results.filter(r => r.type === 'drug')
      response += `💊 **Препараты (${drugResults.length}):**\n`
      drugResults.forEach(r => {
        response += `• ${r.title}${r.dosage ? ` — ${r.dosage}` : ''}\n`
      })
      response += '\n'
    }
    
    response += `Есть вопросы по найденной информации? Задавайте! 😊`
    
    return response
  }
}

export const simpleExtractor = new SimpleDrugExtractor()
