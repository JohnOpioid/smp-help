const fs = require('fs')
const path = require('path')

// Система загрузки и использования обученной модели
class AIModel {
  constructor() {
    this.intentPatterns = new Map()
    this.sectionWeights = new Map()
    this.queryExpansions = new Map()
    this.trainingData = []
    this.loaded = false
  }

  // Загрузка модели
  load() {
    try {
      const modelPath = path.join(__dirname, '../data/ai-model.json')
      
      if (!fs.existsSync(modelPath)) {
        console.log('Модель не найдена, используем базовые настройки')
        return false
      }

      const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'))
      
      this.intentPatterns = new Map(Object.entries(model.intentPatterns || {}))
      this.sectionWeights = new Map(Object.entries(model.sectionWeights || {}))
      this.queryExpansions = new Map(Object.entries(model.queryExpansions || {}))
      this.trainingData = model.trainingData || []
      this.loaded = true

      console.log(`AI модель загружена: версия ${model.version}, обучена ${model.trainedAt}`)
      return true
    } catch (error) {
      console.error('Ошибка загрузки модели:', error)
      return false
    }
  }

  // Предсказание намерения с использованием обученной модели
  predictIntent(query) {
    const q = query.toLowerCase()
    
    // Используем обученные паттерны
    for (const [intent, stats] of this.intentPatterns) {
      if (stats.queries) {
        for (const pattern of stats.queries) {
          if (q.includes(pattern.toLowerCase()) || pattern.toLowerCase().includes(q)) {
            return { intent, confidence: stats.successRate }
          }
        }
      }
    }

    // Fallback к базовым правилам
    return this.fallbackIntentDetection(query)
  }

  // Базовое определение намерения
  fallbackIntentDetection(query) {
    const q = query.toLowerCase()
    
    const patterns = {
      'ls': ['локальный статус', 'статус локалис', 'описание', 'локализация', 'ожог', 'рана'],
      'algo': ['алгоритм', 'протокол', 'тактика', 'порядок действий', 'что делать'],
      'mkb': ['мкб', 'код', 'диагноз', 'кодификатор'],
      'drug': ['препарат', 'лекарство', 'дозировка', 'мг/кг', 'мг', 'мл']
    }

    for (const [intent, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => q.includes(keyword))) {
        return { intent, confidence: 0.7 }
      }
    }

    // Определение по числовым кодам
    if (/^\d{4}$/.test(query.trim())) return { intent: 'mkb', confidence: 0.9 }
    if (/^[A-Z]\d{2}(\.\d+)?$/i.test(query.trim())) return { intent: 'mkb', confidence: 0.9 }

    return { intent: 'general', confidence: 0.3 }
  }

  // Расширение запроса на основе обученных данных
  expandQuery(query) {
    const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2)
    const expandedTerms = new Set(words)

    for (const word of words) {
      if (this.queryExpansions.has(word)) {
        const expansions = this.queryExpansions.get(word)
        expansions.forEach(term => expandedTerms.add(term))
      }
    }

    return Array.from(expandedTerms)
  }

  // Получение весов разделов
  getSectionWeights() {
    if (!this.loaded) {
      // Базовые веса
      return new Map([
        ['mkb', 0.3],
        ['ls', 0.25],
        ['algorithm', 0.25],
        ['drug', 0.15],
        ['substation', 0.05]
      ])
    }

    return this.sectionWeights
  }

  // Ранжирование результатов на основе обученной модели
  rankResults(results, query, predictedIntent) {
    const weights = this.getSectionWeights()
    const intentWeight = predictedIntent.confidence

    return results.map(result => {
      let score = result.score || 0.5
      
      // Бонус за соответствие намерению
      if (result.type === predictedIntent.intent) {
        score += intentWeight * 0.3
      }
      
      // Бонус за вес раздела
      const sectionWeight = weights.get(result.type) || 0.1
      score += sectionWeight * 0.2
      
      // Бонус за точное совпадение в названии
      if (result.title && result.title.toLowerCase().includes(query.toLowerCase())) {
        score += 0.2
      }

      return { ...result, aiScore: score }
    }).sort((a, b) => b.aiScore - a.aiScore)
  }

  // Получение рекомендаций на основе обученной модели
  getRecommendations(query, results) {
    const recommendations = []
    const predictedIntent = this.predictIntent(query)

    // Рекомендации на основе намерения
    if (predictedIntent.intent === 'mkb' && results.length > 0) {
      recommendations.push('Показать связанные алгоритмы')
      recommendations.push('Показать локальные статусы')
      recommendations.push('Показать препараты')
    }

    if (predictedIntent.intent === 'drug' && results.length > 0) {
      recommendations.push('Показать дозировки')
      recommendations.push('Показать противопоказания')
      recommendations.push('Показать показания')
    }

    return recommendations
  }
}

module.exports = AIModel
