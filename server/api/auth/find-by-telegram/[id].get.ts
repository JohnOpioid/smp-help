import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    const telegramId = getRouterParam(event, 'id')
    
    if (!telegramId) {
      throw createError({
        statusCode: 400,
        message: 'Telegram ID не указан'
      })
    }

    // Находим пользователя по Telegram ID
    const user = await User.findOne({ 'telegram.id': telegramId })
    
    if (!user) {
      return {
        success: false,
        user: null,
        message: 'Пользователь не найден'
      }
    }

    return {
      success: true,
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
    console.error('Find by Telegram ID error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при поиске пользователя'
    })
  }
})

