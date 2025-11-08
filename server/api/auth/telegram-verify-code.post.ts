import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { setCookie, createError, getMethod, readBody } from 'h3'
import { getAuthCode, removeAuthCode, getAuthCodeByCode, removeAuthCodeByCode, getAuthCodeWithChat } from '~/server/utils/telegram-auth-codes'
import { bot } from '~/server/telegram/bot'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    await connectDB()
    
    const body = await readBody(event)
    const { telegramId, code } = body

    if (!code) {
      throw createError({
        statusCode: 400,
        message: 'Код обязателен'
      })
    }

    // Пробуем найти по коду (если telegramId не указан)
    let storedAuth
    if (telegramId) {
      // Старый способ - по telegramId
      storedAuth = getAuthCode(telegramId)
      
      if (!storedAuth || storedAuth.code !== code) {
        return {
          success: false,
          message: 'Неверный код'
        }
      }
    } else {
      // Новый способ - только по коду
      const codeData = getAuthCodeByCode(code)
      
      if (!codeData) {
        return {
          success: false,
          message: 'Код не найден или истек. Запросите новый.'
        }
      }
      
      storedAuth = getAuthCode(codeData.telegramId)
      
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
    }

    // Получаем пользователя
    const user = await User.findById(storedAuth.userId)
    
    if (!user) {
      return {
        success: false,
        message: 'Пользователь не найден'
      }
    }
    
    // Сохраняем временную метку авторизации через Telegram и последнее посещение
    const now = new Date()
    user.lastTelegramAuth = now
    user.lastVisit = now
    await user.save()
    console.log('✅ Временная метка авторизации через Telegram сохранена для пользователя:', user._id)

    // Получаем информацию о коде перед удалением для обновления сообщения в боте
    let codeInfo = null
    if (telegramId) {
      codeInfo = getAuthCodeWithChat(telegramId)
    }
    
    // Удаляем использованный код
    if (telegramId) {
      removeAuthCode(telegramId)
    } else {
      removeAuthCodeByCode(code)
    }

    // Создаем JWT токен
    const { jwtSecret } = useRuntimeConfig()
    
    if (!jwtSecret) {
      throw createError({
        statusCode: 500,
        message: 'Ошибка конфигурации сервера'
      })
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Устанавливаем cookie с токеном
    setCookie(event, 'token', token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 дней
      path: '/'
    })

    // Обновляем сообщение в боте о successful авторизации
    if (bot && codeInfo?.chatId && codeInfo?.messageId) {
      try {
        console.log('📝 Обновляем сообщение в боте:', { chatId: codeInfo.chatId, messageId: codeInfo.messageId })
        
        await bot.telegram.editMessageText(
          codeInfo.chatId,
          codeInfo.messageId,
          undefined,
          `👋 Добро пожаловать в справочник СМП!\n\n✅ Вы уже авторизованы в системе.\n\nДоступные команды:\n/favorites - Показать избранное\n/help - Справка\n\nИли выберите действие:`,
          {
            reply_markup: {
              inline_keyboard: [
                [{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],
                [{ text: '📚 Помощь', callback_data: 'help' }]
              ]
            }
          } as any
        )
        
        console.log('✅ Сообщение в боте успешно обновлено')
      } catch (error) {
        console.error('❌ Ошибка обновления сообщения в боте:', error)
      }
    } else {
      // Если нет chatId/messageId, пробуем найти через telegramId
      const telegramIdToUse = telegramId || getAuthCodeByCode(code)?.telegramId
      if (bot && telegramIdToUse) {
        const fallbackInfo = getAuthCodeWithChat(telegramIdToUse)
        if (fallbackInfo?.chatId && fallbackInfo?.messageId) {
          try {
            await bot.telegram.editMessageText(
              fallbackInfo.chatId,
              fallbackInfo.messageId,
              undefined,
              `👋 Добро пожаловать в справочник СМП!\n\n✅ Вы уже авторизованы в системе.\n\nДоступные команды:\n/favorites - Показать избранное\n/help - Справка\n\nИли выберите действие:`,
              {
                reply_markup: {
                  inline_keyboard: [
                    [{ text: '⭐ Избранное', callback_data: 'favorites_category_all' }],
                    [{ text: '📚 Помощь', callback_data: 'help' }]
                  ]
                }
              } as any
            )
            console.log('✅ Сообщение в боте успешно обновлено (fallback)')
          } catch (error) {
            console.error('❌ Ошибка обновления сообщения в боте (fallback):', error)
          }
        }
      }
      if (!codeInfo?.chatId || !codeInfo?.messageId) {
        console.error('❌ Не удалось обновить сообщение - недостаточно данных:', { hasBot: !!bot, hasChatId: !!codeInfo?.chatId, hasMessageId: !!codeInfo?.messageId, telegramId: telegramIdToUse })
      }
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
})

