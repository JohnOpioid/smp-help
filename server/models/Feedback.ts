import mongoose from 'mongoose'

const feedbackSchema = new mongoose.Schema({
  // Исходный вопрос пользователя
  question: {
    type: String,
    required: true,
    trim: true
  },
  
  // Ответ бота
  answer: {
    type: String,
    required: true
  },
  
  // Тип оценки: positive (палец вверх) или negative (палец вниз)
  rating: {
    type: String,
    enum: ['positive', 'negative'],
    required: true
  },
  
  // Комментарий пользователя (для негативных оценок)
  userComment: {
    type: String,
    default: ''
  },
  
  // Результаты поиска, которые были в ответе
  searchResults: [{
    id: String,
    title: String,
    type: String,
    description: String
  }],
  
  // Метаданные
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // IP или идентификатор пользователя (для аналитики)
  userIdentifier: {
    type: String,
    default: ''
  }
})

// Индексы для быстрого поиска
feedbackSchema.index({ question: 'text', answer: 'text', userComment: 'text' })
feedbackSchema.index({ rating: 1 })
feedbackSchema.index({ createdAt: -1 })

export default mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema)
