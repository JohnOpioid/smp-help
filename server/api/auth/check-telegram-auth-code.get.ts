import { defineEventHandler } from 'h3'

// Простой эндпоинт для проверки - возвращает последний код для любого пользователя
export default defineEventHandler(async (event) => {
  try {
    console.log('🔍 API: Проверяем pending коды...')
    
    // Импортируем все сохраненные коды
    const { getAllPendingCodes } = await import('~/server/utils/telegram-auth-codes')
    
    // Получаем последний сохраненный код
    const pendingCodes = getAllPendingCodes()
    
    console.log('📋 Найдено pending кодов:', pendingCodes.length, pendingCodes)
    
    if (pendingCodes.length === 0) {
      console.log('❌ Нет pending кодов')
      return {
        success: false
      }
    }
    
    // Возвращаем последний код (самый свежий)
    const lastCode = pendingCodes[pendingCodes.length - 1]
    
    console.log('✅ Возвращаем код:', { telegramId: lastCode.telegramId, code: lastCode.code })
    
    // НЕ помечаем код как использованный сразу - даем время на навигацию
    // Код будет помечен как использованный только после успешной навигации
    // Это позволяет повторно запросить код, если редирект не сработал
    
    return {
      success: true,
      telegramId: lastCode.telegramId,
      code: lastCode.code
    }

  } catch (error: any) {
    console.error('❌ Check telegram auth code error:', error)
    return {
      success: false
    }
  }
})

