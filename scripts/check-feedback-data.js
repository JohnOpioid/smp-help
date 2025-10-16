const mongoose = require('mongoose')

// Подключение к MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smp-help')
    console.log('✅ Подключено к MongoDB')
  } catch (error) {
    console.error('❌ Ошибка подключения к MongoDB:', error)
    process.exit(1)
  }
}

// Схема Feedback
const feedbackSchema = new mongoose.Schema({
  originalQuery: String,
  aiResponse: String,
  searchResults: [mongoose.Schema.Types.Mixed],
  userIdentifier: String,
  userFeedback: String,
  aiAnalysis: {
    issues: [String],
    improvements: [String],
    intent: String,
    confidence: Number
  },
  status: {
    type: String,
    enum: ['pending', 'analyzed', 'learned'],
    default: 'pending'
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  learningData: {
    correctIntent: String,
    correctResults: [mongoose.Schema.Types.Mixed],
    keywords: [String],
    context: String
  }
}, {
  timestamps: true
})

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema)

async function checkFeedbackData() {
  await connectDB()
  
  try {
    // Получаем все записи обратной связи
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 }).limit(10)
    
    console.log(`\n📊 Найдено записей обратной связи: ${feedbacks.length}`)
    console.log('=' * 80)
    
    feedbacks.forEach((feedback, index) => {
      console.log(`\n${index + 1}. ID: ${feedback._id}`)
      console.log(`   Статус: ${feedback.status}`)
      console.log(`   Создано: ${feedback.createdAt}`)
      console.log(`   Пользователь: ${feedback.userIdentifier}`)
      console.log(`   Запрос: ${feedback.originalQuery?.substring(0, 100)}...`)
      console.log(`   Ответ ИИ: ${feedback.aiResponse?.substring(0, 100)}...`)
      console.log(`   Обратная связь: ${feedback.userFeedback}`)
      
      if (feedback.aiAnalysis) {
        console.log(`   Анализ ИИ:`)
        console.log(`     - Намерение: ${feedback.aiAnalysis.intent}`)
        console.log(`     - Уверенность: ${feedback.aiAnalysis.confidence}`)
        console.log(`     - Проблемы: ${feedback.aiAnalysis.issues?.join(', ') || 'нет'}`)
        console.log(`     - Улучшения: ${feedback.aiAnalysis.improvements?.join(', ') || 'нет'}`)
      }
      
      if (feedback.learningData) {
        console.log(`   Данные для обучения:`)
        console.log(`     - Правильное намерение: ${feedback.learningData.correctIntent}`)
        console.log(`     - Ключевые слова: ${feedback.learningData.keywords?.join(', ') || 'нет'}`)
        console.log(`     - Контекст: ${feedback.learningData.context?.substring(0, 100)}...`)
      }
      
      console.log(`   Результаты поиска: ${feedback.searchResults?.length || 0} элементов`)
    })
    
    // Статистика по статусам
    const stats = await Feedback.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])
    
    console.log('\n📈 Статистика по статусам:')
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count} записей`)
    })
    
  } catch (error) {
    console.error('❌ Ошибка при получении данных:', error)
  } finally {
    await mongoose.disconnect()
    console.log('\n✅ Отключено от MongoDB')
  }
}

checkFeedbackData()
