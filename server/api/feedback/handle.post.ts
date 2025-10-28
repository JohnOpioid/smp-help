import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Feedback from '~/server/models/Feedback'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  
  const { 
    action, 
    messageId, 
    originalQuery, 
    aiResponse, 
    searchResults, 
    userFeedback,
    chatHistory,
    userIdentifier = 'anonymous'
  } = body

  console.log('🔄 Обработка обратной связи:', action, messageId)
  console.log('📋 Данные:', { originalQuery, aiResponse, userFeedback, userIdentifier, chatHistoryLength: chatHistory?.length })

  try {
    if (action === 'like') {
      // При лайке анализируем чат и сохраняем для обучения
      if (!chatHistory || chatHistory.length === 0) {
        return {
          success: false,
          message: 'Отсутствует история чата для анализа'
        }
      }

      // Извлекаем информацию из чата
      console.log('🔍 Анализируем историю чата:', chatHistory.length, 'сообщений')
      
      const lastUserMessage = chatHistory.filter((msg: any) => msg.isUser).pop()
      const lastAiMessage = chatHistory.filter((msg: any) => !msg.isUser).pop()
      
      console.log('👤 Последнее сообщение пользователя:', lastUserMessage?.text?.substring(0, 100))
      console.log('🤖 Последнее сообщение ИИ:', lastAiMessage?.text?.substring(0, 100))
      
      if (!lastUserMessage || !lastAiMessage) {
        console.error('❌ Не найдены сообщения пользователя или ИИ')
        return {
          success: false,
          message: 'Не найдены сообщения пользователя и ИИ в истории чата'
        }
      }

      // Анализируем чат с помощью ИИ (с таймаутом)
      let analysis
      try {
        analysis = await Promise.race([
          analyzeChatForLearning(chatHistory),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout')), 15000)
          )
        ])
      } catch (error) {
        console.error('❌ Ошибка анализа чата:', error)
        // Fallback анализ без ИИ
        analysis = {
          intent: 'general',
          confidence: 0.7,
          issues: [],
          improvements: [],
          textAnalysis: `Успешный диалог: пользователь "${lastUserMessage.text}" получил ответ "${lastAiMessage.text?.substring(0, 100)}..."`,
          medicalTerms: extractMedicalTerms(lastUserMessage.text || ''),
          keywords: extractKeywords(lastUserMessage.text || ''),
          context: 'Медицинская консультация'
        }
      }
      
      // Создаем запись для обучения с текстовым анализом
      const feedback = new Feedback({
        originalQuery: lastUserMessage.text || 'Неизвестный запрос',
        aiResponse: lastAiMessage.text || 'Пустой ответ ИИ',
        searchResults: lastAiMessage.results || [],
        userIdentifier,
        userFeedback: 'Положительная оценка - успешный диалог',
        aiAnalysis: {
          intent: analysis.intent,
          confidence: analysis.confidence,
          issues: analysis.issues,
          improvements: analysis.improvements,
          textAnalysis: analysis.textAnalysis, // Текстовый анализ для обучения
          medicalTerms: analysis.medicalTerms,
          keywords: analysis.keywords,
          context: analysis.context
        },
        status: 'learned',
        learningData: {
          correctIntent: analysis.intent,
          correctResults: lastAiMessage.results || [],
          keywords: analysis.keywords || extractKeywords(lastUserMessage.text || ''),
          context: analysis.textAnalysis // Используем текстовый анализ как контекст
        }
      })
      
      await feedback.save()
      
      console.log('✅ Положительная обратная связь сохранена в коллекцию "feedbacks":', feedback._id)
      console.log('📊 Данные сохранены:', {
        originalQuery: feedback.originalQuery?.substring(0, 50),
        textAnalysis: feedback.aiAnalysis?.textAnalysis?.substring(0, 100),
        status: feedback.status
      })
      
      return {
        success: true,
        message: 'Спасибо за положительную оценку! Это поможет улучшить ответы.',
        feedbackId: feedback._id
      }
    }

    if (action === 'dislike') {
      // Проверяем обязательные поля
      if (!originalQuery || !aiResponse) {
        console.error('❌ Отсутствуют обязательные поля:', { originalQuery: !!originalQuery, aiResponse: !!aiResponse })
        return {
          success: false,
          message: 'Отсутствуют обязательные данные для создания обратной связи'
        }
      }

      // При дизлайке создаем запись обратной связи
      const feedback = new Feedback({
        originalQuery: originalQuery.trim(),
        aiResponse: aiResponse.trim(),
        searchResults,
        userIdentifier,
        userFeedback: 'Отрицательная оценка - ожидается детальная обратная связь', // Временное значение
        status: 'pending'
      })
      
      await feedback.save()
      
      console.log('📝 Создана запись обратной связи в коллекцию "feedbacks":', feedback._id)
      
      return {
        success: true,
        feedbackId: feedback._id,
        message: 'Спасибо за обратную связь! Расскажите, что именно не понравилось в ответе?',
        askFeedback: true
      }
    }
    
    if (action === 'submit_feedback') {
      // Пользователь отправил обратную связь
      // messageId - это timestamp, нужно найти запись по другому полю
      const feedback = await Feedback.findOne({ 
        $or: [
          { _id: messageId },
          { createdAt: { $gte: new Date(parseInt(messageId)) } }
        ]
      }).sort({ createdAt: -1 })
      
      if (!feedback) {
        return {
          success: false,
          message: 'Запись обратной связи не найдена'
        }
      }
      
      // Обновляем обратную связь
      feedback.userFeedback = userFeedback
      feedback.status = 'analyzed'
      
      // Используем ИИ для анализа обратной связи
      const analysis = await analyzeFeedbackWithAI(originalQuery, aiResponse, userFeedback)
      
      feedback.aiAnalysis = analysis
      await feedback.save()
      
      console.log('🧠 ИИ проанализировал обратную связь:', analysis)
      
      // Генерируем ответ ИИ на основе анализа
      const aiReply = await generateFeedbackResponse(analysis, originalQuery)
      
      return {
        success: true,
        message: aiReply,
        analysis: analysis,
        askFeedback: false
      }
    }
    
    if (action === 'learn') {
      // Сохраняем обучение в БД для будущего использования
      const feedback = await Feedback.findById(messageId)
      
      if (!feedback) {
        return {
          success: false,
          message: 'Запись обратной связи не найдена'
        }
      }
      
      // Обновляем статус на "изучено"
      feedback.status = 'learned'
      feedback.learningData = {
        correctIntent: feedback.aiAnalysis.intent,
        correctResults: feedback.searchResults,
        keywords: extractKeywords(feedback.originalQuery),
        context: feedback.userFeedback
      }
      
      await feedback.save()
      
      console.log('🎓 Обратная связь сохранена для обучения:', feedback._id)
      
      return {
        success: true,
        message: 'Спасибо! Ваша обратная связь поможет улучшить ответы в будущем.'
      }
    }
    
    return {
      success: false,
      message: 'Неизвестное действие'
    }
    
  } catch (error) {
    console.error('❌ Ошибка обработки обратной связи:', error)
    return {
      success: false,
      message: 'Произошла ошибка при обработке обратной связи'
    }
  }
})

async function analyzeFeedbackWithAI(originalQuery: string, aiResponse: string, userFeedback: string) {
  const prompt = `
Ты медицинский ассистент. Проанализируй обратную связь пользователя и определи проблемы в ответе.

ОРИГИНАЛЬНЫЙ ЗАПРОС: "${originalQuery}"
ОТВЕТ ИИ: "${aiResponse}"
ОБРАТНАЯ СВЯЗЬ ПОЛЬЗОВАТЕЛЯ: "${userFeedback}"

ЗАДАЧИ:
1. Определи основные проблемы в ответе ИИ
2. Предложи улучшения
3. Определи правильное намерение пользователя
4. Оцени уверенность в анализе

ФОРМАТ ОТВЕТА (JSON):
{
  "issues": ["проблема1", "проблема2"],
  "improvements": ["улучшение1", "улучшение2"],
  "intent": "правильное_намерение",
  "confidence": 0.0-1.0
}
`

  // AI анализ отключен
  return {
    issues: ['AI анализ отключен'],
    improvements: ['Улучшить анализ запроса'],
    intent: 'general',
    confidence: 0.1
  }
}

async function generateFeedbackResponse(analysis: any, originalQuery: string) {
  const prompt = `
Ты дружелюбный медицинский ассистент. Ответь пользователю на его обратную связь.

АНАЛИЗ ПРОБЛЕМ:
${JSON.stringify(analysis, null, 2)}

ОРИГИНАЛЬНЫЙ ЗАПРОС: "${originalQuery}"

ЗАДАЧИ:
1. Поблагодари за обратную связь
2. Признай проблемы в ответе
3. Объясни, что было не так
4. Предложи улучшения
5. Скажи, что учтешь это в будущем

СТИЛЬ:
- Дружелюбный и понимающий
- Короткие предложения
- Эмодзи для дружелюбности
- Конструктивный подход
`

  // AI генерация отключена
  return 'Спасибо за обратную связь! Я учту ваши замечания для улучшения ответов в будущем. 😊'
}

async function analyzeChatForLearning(chatHistory: any[]) {
  const prompt = `Проанализируй диалог и определи намерение. Ответь только JSON:
{
  "intent": "mkb|algo|drug|ls|substation|general",
  "confidence": 0.8,
  "textAnalysis": "Краткий анализ диалога"
}

Диалог: ${chatHistory.map(msg => `${msg.isUser ? 'Пользователь' : 'ИИ'}: ${msg.text}`).join(' | ')}`

  // AI анализ отключен
  return {
    intent: 'general',
    confidence: 0.5,
    issues: [],
    improvements: [],
    textAnalysis: 'Успешный диалог с медицинским контентом',
    medicalTerms: [],
    keywords: [],
    context: 'Медицинская консультация'
  }
}

function extractKeywords(query: string): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, ' ')
    .split(/\s+/)
    .filter(word => word.length >= 3)
    .slice(0, 5)
}

function extractMedicalTerms(query: string): string[] {
  // Простое извлечение медицинских терминов
  const medicalWords = [
    'гипертензивная', 'гипертоническая', 'болезнь', 'сердца', 'диабет', 'инсулин',
    'алгоритм', 'препарат', 'лечение', 'диагноз', 'симптом', 'терапия',
    'кардиология', 'неврология', 'педиатрия', 'хирургия', 'онкология'
  ]
  
  const words = query.toLowerCase().split(/\s+/)
  return words.filter(word => 
    medicalWords.some(medical => medical.includes(word) || word.includes(medical))
  ).slice(0, 5)
}
