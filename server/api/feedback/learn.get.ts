import connectDB from '~/server/utils/mongodb'
import Feedback from '~/server/models/Feedback'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const searchQuery = query.q as string || ''

  await connectDB()

  try {
    // Ищем релевантную обратную связь для обучения
    let feedbackQuery: any = {}
    
    if (searchQuery) {
      // Поиск по тексту для нахождения похожих вопросов
      feedbackQuery = {
        $or: [
          { question: { $regex: searchQuery, $options: 'i' } },
          { answer: { $regex: searchQuery, $options: 'i' } },
          { userComment: { $regex: searchQuery, $options: 'i' } }
        ]
      }
    }

    // Получаем последние записи обратной связи
    const feedback = await Feedback.find(feedbackQuery)
      .sort({ createdAt: -1 })
      .limit(50)
      .select('question answer rating userComment searchResults createdAt')

    // Группируем по типу оценки
    const positiveFeedback = feedback.filter(f => f.rating === 'positive')
    const negativeFeedback = feedback.filter(f => f.rating === 'negative')

    return {
      success: true,
      data: {
        total: feedback.length,
        positive: positiveFeedback.length,
        negative: negativeFeedback.length,
        positiveFeedback: positiveFeedback.slice(0, 10), // Последние 10 положительных
        negativeFeedback: negativeFeedback.slice(0, 10), // Последние 10 отрицательных
        learningInsights: generateLearningInsights(positiveFeedback, negativeFeedback)
      }
    }
  } catch (error) {
    console.error('Ошибка получения обратной связи:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка получения данных обучения'
    })
  }
})

function generateLearningInsights(positive: any[], negative: any[]) {
  const insights = []

  // Анализ положительных ответов
  if (positive.length > 0) {
    const commonPositivePatterns = extractCommonPatterns(positive.map(f => f.question))
    insights.push({
      type: 'positive_patterns',
      message: 'Пользователи положительно оценивают ответы на вопросы о: ' + commonPositivePatterns.join(', '),
      count: positive.length
    })
  }

  // Анализ отрицательных ответов
  if (negative.length > 0) {
    const commonNegativeIssues = extractCommonPatterns(negative.map(f => f.userComment).filter(Boolean))
    insights.push({
      type: 'negative_patterns',
      message: 'Основные проблемы в ответах: ' + commonNegativeIssues.join(', '),
      count: negative.length
    })
  }

  return insights
}

function extractCommonPatterns(texts: string[]): string[] {
  const words = texts.join(' ').toLowerCase()
    .split(/\s+/)
    .filter(word => word.length > 3)
    .filter(word => !['который', 'которая', 'которое', 'этого', 'этой', 'этому'].includes(word))

  const wordCount: { [key: string]: number } = {}
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1
  })

  return Object.entries(wordCount)
    .filter(([_, count]) => count > 1)
    .sort(([_, a], [__, b]) => b - a)
    .slice(0, 5)
    .map(([word]) => word)
}
