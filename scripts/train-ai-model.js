const mongoose = require('mongoose')
const connectDB = require('../server/utils/mongodb')
const Feedback = require('../server/models/Feedback')
const MKB = require('../server/models/MKB')
const LocalStatus = require('../server/models/LocalStatus')
const Algorithm = require('../server/models/Algorithm')
const Drug = require('../server/models/Drug')

// Система обучения нейросети на основе пользовательских данных
class AITrainer {
  constructor() {
    this.trainingData = []
    this.intentPatterns = new Map()
    this.sectionWeights = new Map()
    this.queryExpansions = new Map()
  }

  // Сбор данных для обучения из обратной связи
  async collectTrainingData() {
    console.log('📊 Собираем данные для обучения...')
    
    // Получаем все записи обратной связи
    const feedbacks = await Feedback.find({})
      .sort({ createdAt: -1 })
      .limit(1000)
      .lean()

    console.log(`Найдено ${feedbacks.length} записей обратной связи`)

    for (const feedback of feedbacks) {
      if (feedback.rating === 'positive' && feedback.searchResults?.length > 0) {
        // Положительная обратная связь - учимся на успешных запросах
        this.trainingData.push({
          query: feedback.question,
          results: feedback.searchResults,
          intent: this.extractIntent(feedback.question),
          success: true,
          timestamp: feedback.createdAt
        })
      } else if (feedback.rating === 'negative') {
        // Отрицательная обратная связь - учимся на ошибках
        this.trainingData.push({
          query: feedback.question,
          results: feedback.searchResults || [],
          intent: this.extractIntent(feedback.question),
          success: false,
          timestamp: feedback.createdAt
        })
      }
    }

    console.log(`Собрано ${this.trainingData.length} примеров для обучения`)
  }

  // Извлечение намерения из запроса
  extractIntent(query) {
    const q = query.toLowerCase()
    
    // Медицинские термины и их намерения
    const intentPatterns = {
      'ls': ['локальный статус', 'статус локалис', 'описание', 'локализация', 'ожог', 'рана', 'повреждение'],
      'algo': ['алгоритм', 'протокол', 'тактика', 'порядок действий', 'что делать', 'лечение'],
      'mkb': ['мкб', 'код', 'диагноз', 'кодификатор'],
      'drug': ['препарат', 'лекарство', 'дозировка', 'мг/кг', 'мг', 'мл']
    }

    for (const [intent, patterns] of Object.entries(intentPatterns)) {
      if (patterns.some(pattern => q.includes(pattern))) {
        return intent
      }
    }

    // Определение по числовым кодам
    if (/^\d{4}$/.test(query.trim())) return 'mkb' // Код станции
    if (/^[A-Z]\d{2}(\.\d+)?$/i.test(query.trim())) return 'mkb' // МКБ код

    return 'general'
  }

  // Обучение на паттернах запросов
  async trainIntentPatterns() {
    console.log('🧠 Обучаем паттерны намерений...')
    
    const intentStats = new Map()
    
    for (const data of this.trainingData) {
      const intent = data.intent
      if (!intentStats.has(intent)) {
        intentStats.set(intent, { count: 0, successRate: 0, queries: [] })
      }
      
      const stats = intentStats.get(intent)
      stats.count++
      stats.queries.push(data.query)
      
      if (data.success) {
        stats.successRate++
      }
    }

    // Сохраняем статистику намерений
    for (const [intent, stats] of intentStats) {
      stats.successRate = stats.successRate / stats.count
      this.intentPatterns.set(intent, stats)
      
      console.log(`Намерение "${intent}": ${stats.count} запросов, успешность ${(stats.successRate * 100).toFixed(1)}%`)
    }
  }

  // Обучение весов разделов
  async trainSectionWeights() {
    console.log('⚖️ Обучаем веса разделов...')
    
    const sectionStats = new Map()
    
    for (const data of this.trainingData) {
      if (!data.success) continue
      
      for (const result of data.results) {
        const section = result.type
        if (!sectionStats.has(section)) {
          sectionStats.set(section, { count: 0, queries: [] })
        }
        
        const stats = sectionStats.get(section)
        stats.count++
        stats.queries.push(data.query)
      }
    }

    // Вычисляем веса на основе частоты использования
    const totalResults = Array.from(sectionStats.values()).reduce((sum, stats) => sum + stats.count, 0)
    
    for (const [section, stats] of sectionStats) {
      const weight = stats.count / totalResults
      this.sectionWeights.set(section, weight)
      
      console.log(`Раздел "${section}": вес ${weight.toFixed(3)}, ${stats.count} использований`)
    }
  }

  // Обучение расширений запросов
  async trainQueryExpansions() {
    console.log('🔍 Обучаем расширения запросов...')
    
    const expansionStats = new Map()
    
    for (const data of this.trainingData) {
      if (!data.success) continue
      
      const query = data.query.toLowerCase()
      const words = query.split(/\s+/).filter(w => w.length > 2)
      
      for (const word of words) {
        if (!expansionStats.has(word)) {
          expansionStats.set(word, new Set())
        }
        
        // Добавляем связанные слова из успешных результатов
        for (const result of data.results) {
          const resultText = (result.title + ' ' + (result.description || '')).toLowerCase()
          const resultWords = resultText.split(/\s+/).filter(w => w.length > 2)
          
          for (const resultWord of resultWords) {
            if (resultWord !== word) {
              expansionStats.get(word).add(resultWord)
            }
          }
        }
      }
    }

    // Сохраняем расширения
    for (const [word, expansions] of expansionStats) {
      if (expansions.size > 0) {
        this.queryExpansions.set(word, Array.from(expansions).slice(0, 5)) // Топ-5 связанных слов
      }
    }

    console.log(`Создано ${this.queryExpansions.size} расширений запросов`)
  }

  // Генерация обучающих данных
  async generateTrainingData() {
    console.log('📝 Генерируем обучающие данные...')
    
    const trainingExamples = []
    
    // Примеры из МКБ
    const mkbSamples = await MKB.find({}).limit(100).lean()
    for (const mkb of mkbSamples) {
      trainingExamples.push({
        query: mkb.stationCode || mkb.mkbCode || mkb.name,
        expectedIntent: 'mkb',
        expectedResults: [mkb],
        type: 'mkb'
      })
    }

    // Примеры из алгоритмов
    const algoSamples = await Algorithm.find({}).limit(100).lean()
    for (const algo of algoSamples) {
      const keywords = this.extractKeywords(algo.title + ' ' + (algo.description || ''))
      trainingExamples.push({
        query: keywords[0] || algo.title,
        expectedIntent: 'algo',
        expectedResults: [algo],
        type: 'algorithm'
      })
    }

    // Примеры из препаратов
    const drugSamples = await Drug.find({}).limit(100).lean()
    for (const drug of drugSamples) {
      trainingExamples.push({
        query: drug.name,
        expectedIntent: 'drug',
        expectedResults: [drug],
        type: 'drug'
      })
    }

    console.log(`Сгенерировано ${trainingExamples.length} обучающих примеров`)
    return trainingExamples
  }

  // Извлечение ключевых слов
  extractKeywords(text) {
    return text.toLowerCase()
      .replace(/[^\p{L}\s]/gu, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3)
      .filter(word => !['болезнь', 'заболевание', 'синдром', 'состояние'].includes(word))
      .slice(0, 3)
  }

  // Сохранение обученной модели
  async saveModel() {
    console.log('💾 Сохраняем обученную модель...')
    
    const model = {
      intentPatterns: Object.fromEntries(this.intentPatterns),
      sectionWeights: Object.fromEntries(this.sectionWeights),
      queryExpansions: Object.fromEntries(this.queryExpansions),
      trainingData: this.trainingData.slice(0, 100), // Сохраняем последние 100 примеров
      trainedAt: new Date(),
      version: '1.0'
    }

    // Сохраняем в файл
    const fs = require('fs')
    const path = require('path')
    const modelPath = path.join(__dirname, '../data/ai-model.json')
    
    // Создаем директорию если не существует
    const dir = path.dirname(modelPath)
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }
    
    fs.writeFileSync(modelPath, JSON.stringify(model, null, 2))
    console.log(`Модель сохранена в ${modelPath}`)
  }

  // Загрузка обученной модели
  async loadModel() {
    const fs = require('fs')
    const path = require('path')
    const modelPath = path.join(__dirname, '../data/ai-model.json')
    
    if (fs.existsSync(modelPath)) {
      const model = JSON.parse(fs.readFileSync(modelPath, 'utf8'))
      
      this.intentPatterns = new Map(Object.entries(model.intentPatterns))
      this.sectionWeights = new Map(Object.entries(model.sectionWeights))
      this.queryExpansions = new Map(Object.entries(model.queryExpansions))
      
      console.log(`Модель загружена из ${modelPath}`)
      console.log(`Версия: ${model.version}, обучена: ${model.trainedAt}`)
      return true
    }
    
    return false
  }

  // Основной процесс обучения
  async train() {
    console.log('🚀 Начинаем обучение нейросети...')
    
    try {
      await connectDB()
      
      // Загружаем существующую модель
      const modelLoaded = await this.loadModel()
      
      // Собираем данные для обучения
      await this.collectTrainingData()
      
      // Обучаем компоненты
      await this.trainIntentPatterns()
      await this.trainSectionWeights()
      await this.trainQueryExpansions()
      
      // Сохраняем модель
      await this.saveModel()
      
      console.log('✅ Обучение завершено успешно!')
      
      // Выводим статистику
      console.log('\n📊 Статистика обученной модели:')
      console.log(`- Паттерны намерений: ${this.intentPatterns.size}`)
      console.log(`- Веса разделов: ${this.sectionWeights.size}`)
      console.log(`- Расширения запросов: ${this.queryExpansions.size}`)
      console.log(`- Обучающих примеров: ${this.trainingData.length}`)
      
    } catch (error) {
      console.error('❌ Ошибка при обучении:', error)
    } finally {
      await mongoose.disconnect()
    }
  }
}

// Запуск обучения
if (require.main === module) {
  const trainer = new AITrainer()
  trainer.train()
}

module.exports = AITrainer
