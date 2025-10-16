import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema({
  // Основная информация о запросе
  originalQuery: {
    type: String,
    required: true,
    index: true
  },
  
  // Ответ ИИ, который получил дизлайк
  aiResponse: {
    type: String,
    required: true
  },
  
  // Результаты поиска, которые показал ИИ
  searchResults: [{
    type: mongoose.Schema.Types.Mixed
  }],
  
  // Информация о пользователе
  userIdentifier: {
    type: String,
    default: 'anonymous'
  },
  
  // Обратная связь от пользователя
  userFeedback: {
    type: String,
    required: true
  },
  
  // Анализ обратной связи ИИ
  aiAnalysis: {
    issues: [String], // Проблемы, которые выявил ИИ
    improvements: [String], // Предложения по улучшению
    intent: String, // Правильное намерение пользователя
    confidence: Number, // Уверенность в анализе
    textAnalysis: String, // Текстовый анализ для обучения ИИ
    medicalTerms: [String], // Медицинские термины
    keywords: [String], // Ключевые слова
    context: String // Медицинский контекст
  },
  
  // Статус обработки
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'learned'],
    default: 'pending'
  },
  
  // Метаданные
  timestamp: {
    type: Date,
    default: Date.now
  },
  
  // Для обучения модели
  learningData: {
    correctIntent: String,
    correctResults: [mongoose.Schema.Types.Mixed],
    keywords: [String],
    context: String
  }
}, {
  timestamps: true,
  collection: 'feedbacks' // Явно указываем имя коллекции
})

// Индексы для быстрого поиска
feedbackSchema.index({ originalQuery: 1, timestamp: -1 })
feedbackSchema.index({ status: 1 })
feedbackSchema.index({ 'aiAnalysis.intent': 1 })

export default mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema)