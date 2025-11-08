import { defineEventHandler, readBody } from 'h3'

// Эндпоинт для пометки кода как использованного после успешной навигации
export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { telegramId, code } = body
    
    if (!telegramId || !code) {
      return {
        success: false,
        message: 'Недостаточно данных'
      }
    }
    
    const { removePendingCode } = await import('~/server/utils/telegram-auth-codes')
    removePendingCode(telegramId, code)
    
    console.log('✅ Код помечен как использованный:', { telegramId, code })
    
    return {
      success: true
    }
  } catch (error: any) {
    console.error('❌ Mark telegram code used error:', error)
    return {
      success: false,
      message: error.message || 'Ошибка пометки кода'
    }
  }
})
