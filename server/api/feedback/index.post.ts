import connectDB from '~/server/utils/mongodb'
import Feedback from '~/server/models/Feedback'

export default defineEventHandler(async (event) => {
  const { question, answer, rating, userComment, searchResults } = await readBody(event)

  if (!question || !answer || !rating) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Отсутствуют обязательные поля: question, answer, rating'
    })
  }

  if (!['positive', 'negative'].includes(rating)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'rating должен быть positive или negative'
    })
  }

  await connectDB()

  try {
    const feedback = new Feedback({
      question: question.trim(),
      answer: answer.trim(),
      rating,
      userComment: userComment || '',
      searchResults: searchResults || [],
      userIdentifier: getClientIP(event) || 'anonymous'
    })

    await feedback.save()

    return {
      success: true,
      message: 'Обратная связь сохранена',
      id: feedback._id
    }
  } catch (error) {
    console.error('Ошибка сохранения обратной связи:', error)
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сохранения обратной связи'
    })
  }
})

// Функция для получения IP адреса клиента
function getClientIP(event: any): string {
  const forwarded = getHeader(event, 'x-forwarded-for')
  const realIP = getHeader(event, 'x-real-ip')
  const remoteAddress = event.node.req.socket?.remoteAddress
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || remoteAddress || 'unknown'
}
