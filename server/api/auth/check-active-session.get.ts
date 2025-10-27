import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { getQuery, getCookie } from 'h3'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    const query = getQuery(event)
    const telegramId = query.telegramId as string

    if (!telegramId) {
      return {
        hasActiveSession: false,
        message: 'Telegram ID не указан'
      }
    }

    // Проверяем наличие пользователя в БД
    const user = await User.findOne({ 'telegram.id': telegramId })

    if (!user) {
      return {
        hasActiveSession: false,
        message: 'Пользователь не найден'
      }
    }

    // Проверяем наличие авторизации через Telegram по временной метке
    // Если последняя авторизация через Telegram была менее 1 часа назад, считаем что сессия активна
    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    
    if (user.lastTelegramAuth && user.lastTelegramAuth > oneHourAgo) {
      console.log('✅ Авторизация через Telegram найдена, последняя авторизация:', user.lastTelegramAuth)
      return {
        hasActiveSession: true,
        user: {
          _id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          telegram: user.telegram
        }
      }
    }
    
    console.log('❌ Нет авторизации через Telegram, последняя авторизация:', user.lastTelegramAuth)
    
    return {
      hasActiveSession: false,
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
    console.error('Check active session error:', error)
    return {
      hasActiveSession: false,
      message: error.message || 'Ошибка проверки сессии'
    }
  }
})

