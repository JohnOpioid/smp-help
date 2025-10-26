import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { createError, getCookie, getMethod, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    await connectDB()
    
    // Получаем ID пользователя из токена
    const tokenCookie = getCookie(event, 'token')
    
    if (!tokenCookie) {
      throw createError({
        statusCode: 401,
        message: 'Не авторизован'
      })
    }

    // Декодируем токен
    let userId
    try {
      const { jwtSecret } = useRuntimeConfig()
      const decoded = jwt.verify(tokenCookie, jwtSecret) as any
      userId = decoded.userId
    } catch (err) {
      throw createError({
        statusCode: 401,
        message: 'Неверный токен'
      })
    }

    // Находим пользователя и отключаем Telegram
    const user = await User.findById(userId)
    
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      })
    }

    // Удаляем данные Telegram
    user.telegram = undefined
    await user.save()

    return {
      success: true,
      message: 'Telegram успешно отключен'
    }

  } catch (error: any) {
    console.error('Disconnect Telegram error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при отключении Telegram'
    })
  }
})

