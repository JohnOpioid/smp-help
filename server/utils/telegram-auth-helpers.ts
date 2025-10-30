import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { storeAuthCode, getAuthCode, removeAuthCode, getAuthCodeWithChat } from './telegram-auth-codes'
import jwt from 'jsonwebtoken'
import { bot } from '~/server/telegram/bot'

/**
 * Генерирует код авторизации для пользователя Telegram
 * Используется напрямую из bot.ts без HTTP запросов
 */
export async function generateTelegramAuthCode(telegramId: string, firstName: string, username?: string) {
  try {
    await connectDB()
    
    const telegramIdStr = String(telegramId)
    const usernameValue = username || ''
    
    // Генерируем уникальный email из Telegram данных
    const telegramEmail = usernameValue 
      ? `telegram_${usernameValue}@smp.local` 
      : `telegram_${telegramId}@smp.local`

    // Ищем пользователя
    let user = await User.findOne({ 
      $or: [
        { email: telegramEmail },
        { 'telegram.id': telegramIdStr }
      ]
    })

    if (!user) {
      // Создаем нового пользователя
      const crypto = await import('crypto')
      user = await User.create({
        email: telegramEmail,
        password: crypto.randomBytes(32).toString('hex'),
        firstName: firstName,
        lastName: firstName,
        role: 'user',
        telegram: {
          id: telegramIdStr,
          username: usernameValue,
          photo_url: ''
        }
      })
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Сохраняем код с таймаутом 10 минут (без chatId/messageId - они будут добавлены ботом)
    storeAuthCode(telegramIdStr, user._id.toString(), code, 600)

    console.log(`🔐 Код авторизации для пользователя ${telegramIdStr}: ${code}`)

    return {
      success: true,
      code,
      message: 'Код отправлен в Telegram',
      userId: user._id.toString()
    }

  } catch (error: any) {
    console.error('Telegram request code error:', error)
    return {
      success: false,
      message: error.message || 'Ошибка запроса кода'
    }
  }
}

/**
 * Проверяет код авторизации и возвращает JWT токен
 */
export async function verifyTelegramAuthCode(telegramId: string, code: string) {
  try {
    await connectDB()
    
    if (!telegramId || !code) {
      return {
        success: false,
        message: 'Недостаточно данных'
      }
    }

    // Проверяем код
    const storedAuth = getAuthCode(telegramId)
    
    if (!storedAuth) {
      return {
        success: false,
        message: 'Код не найден или истек. Запросите новый.'
      }
    }

    if (storedAuth.code !== code) {
      return {
        success: false,
        message: 'Неверный код'
      }
    }

    // Получаем пользователя
    const user = await User.findById(storedAuth.userId)
    
    if (!user) {
      return {
        success: false,
        message: 'Пользователь не найден'
      }
    }

    // Получаем информацию о коде перед удалением
    const codeInfo = getAuthCodeWithChat(telegramId)
    console.log('📝 Получена информация о коде для обновления сообщения:', codeInfo)
    
    // Удаляем использованный код
    removeAuthCode(telegramId)

    // Создаем JWT токен
    const config = useRuntimeConfig()
    const jwtSecret = config.jwtSecret
    
    if (!jwtSecret) {
      return {
        success: false,
        message: 'Ошибка конфигурации сервера'
      }
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Обновляем сообщение в боте о successful авторизации
    if (bot && codeInfo?.chatId && codeInfo?.messageId) {
      try {
        console.log('📝 Обновляем сообщение в боте:', { chatId: codeInfo.chatId, messageId: codeInfo.messageId })
        
        await bot.editMessageText(
          `✅ <b>Авторизация успешна!</b>\n\n👤 Вы успешно вошли в систему.\n\nТеперь вы можете:\n✅ Просматривать избранное\n✅ Использовать все функции сайта\n\nВернитесь на сайт для продолжения работы.`,
          {
            chat_id: codeInfo.chatId,
            message_id: codeInfo.messageId,
            parse_mode: 'HTML',
            reply_markup: {
              inline_keyboard: [
                [{ text: '📚 Помощь', callback_data: 'help' }],
                [{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }]
              ]
            }
          }
        )
        
        console.log('✅ Сообщение в боте успешно обновлено')
      } catch (error) {
        console.error('❌ Ошибка обновления сообщения в боте:', error)
      }
    } else {
      console.error('❌ Не удалось обновить сообщение - недостаточно данных:', { hasBot: !!bot, hasChatId: !!codeInfo?.chatId, hasMessageId: !!codeInfo?.messageId })
    }

    return {
      success: true,
      message: 'Успешная авторизация',
      token,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        telegram: user.telegram
      }
    }

  } catch (error: any) {
    console.error('Telegram verify code error:', error)
    return {
      success: false,
      message: error.message || 'Ошибка проверки кода'
    }
  }
}

/**
 * Проверяет авторизован ли пользователь по Telegram ID
 * ВАЖНО: Проверяет только наличие пользователя в БД, не активную сессию
 * Для реальной проверки авторизации нужен JWT токен, который бот не имеет доступа
 */
export async function checkTelegramAuth(telegramId: string) {
  try {
    await connectDB()
    
    if (!telegramId) {
      return {
        authenticated: false,
        message: 'Telegram ID не указан'
      }
    }

    // Находим пользователя по Telegram ID
    const user = await User.findOne({ 'telegram.id': telegramId })

    if (!user) {
      return {
        authenticated: false,
        message: 'Пользователь не найден'
      }
    }

    // ПРИМЕЧАНИЕ: Бот не может проверить активную сессию пользователя на сайте
    // Показываем что пользователь "авторизован" если он есть в БД
    // Реальная проверка сессии требует JWT токен, который бот не имеет
    return {
      authenticated: true,
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        telegram: user.telegram
      }
    }

  } catch (error: any) {
    console.error('Check telegram auth error:', error)
    return {
      authenticated: false,
      message: error.message || 'Ошибка проверки авторизации'
    }
  }
}

export async function checkActiveSessionByTelegramId(telegramId: string): Promise<boolean> {
  try {
    await connectDB()
    const user = await User.findOne({ 'telegram.id': telegramId })
    
    if (!user) {
      return false
    }
    
    // Проверяем последнюю авторизацию через Telegram (за последний час)
    if (!user.lastTelegramAuth) {
      return false
    }
    
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    const isActive = user.lastTelegramAuth > oneHourAgo
    console.log('🔍 Проверка авторизации через Telegram для пользователя:', { telegramId, lastTelegramAuth: user.lastTelegramAuth, now, isActive })
    
    return isActive
  } catch (error) {
    console.error('❌ Ошибка проверки авторизации через Telegram:', error)
    return false
  }
}
