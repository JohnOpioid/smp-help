import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Feedback from '~/server/models/Feedback'

// API для сбора обратной связи от пользователей
export default defineEventHandler(async (event) => {
  await connectDB()
  
  try {
    const body = await readBody(event)
    const { 
      question, 
      answer, 
      rating, 
      userComment, 
      searchResults, 
      userIdentifier,
      sessionId 
    } = body

    // Валидация данных
    if (!question || !rating) {
      return { 
        success: false, 
        error: 'Необходимы поля question и rating' 
      }
    }

    // Создаем запись обратной связи с правильными полями
    const feedback = new Feedback({
      originalQuery: question.trim(),
      aiResponse: answer?.trim() || '',
      userFeedback: userComment?.trim() || (rating === 'positive' ? 'Положительная оценка' : 'Отрицательная оценка'),
      searchResults: searchResults || [],
      userIdentifier: userIdentifier || 'anonymous',
      status: 'pending',
      timestamp: new Date()
    })

    await feedback.save()

    return { 
      success: true, 
      message: 'Обратная связь сохранена',
      feedbackId: feedback._id
    }

  } catch (error) {
    console.error('Ошибка сохранения обратной связи:', error)
    return { 
      success: false, 
      error: 'Ошибка сохранения обратной связи' 
    }
  }
})
