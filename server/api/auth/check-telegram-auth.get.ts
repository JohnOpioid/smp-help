import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { createError, getQuery } from 'h3'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    const query = getQuery(event)
    const telegramId = query.telegramId as string

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
})

