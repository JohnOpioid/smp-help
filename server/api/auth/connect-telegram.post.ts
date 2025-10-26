import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { createError, getMethod, readBody } from 'h3'

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
    const { userId, telegramId, username, firstName, lastName, photo_url } = body

    // Проверка данных
    if (!userId || !telegramId) {
      throw createError({
        statusCode: 400,
        message: 'Недостаточно данных для подключения'
      })
    }

    // Находим пользователя по ID
    const user = await User.findById(userId)
    
    if (!user) {
      throw createError({
        statusCode: 404,
        message: 'Пользователь не найден'
      })
    }

    // Проверяем, не подключен ли уже этот Telegram к другому аккаунту
    const existingUser = await User.findOne({ 'telegram.id': String(telegramId) })
    
    // Если Telegram привязан к другому аккаунту, отключаем его
    if (existingUser && existingUser._id.toString() !== userId) {
      console.log(`🔗 Telegram ${telegramId} уже привязан к другому аккаунту, отключаем...`)
      existingUser.telegram = undefined
      await existingUser.save()
    }

    // Если текущий пользователь уже имеет привязанный Telegram, отключаем старый
    if (user.telegram?.id && user.telegram.id !== String(telegramId)) {
      console.log(`🔄 Пользователь имеет другой Telegram, отключаем старый...`)
    }

    // Подключаем Telegram
    user.telegram = {
      id: String(telegramId),
      username: username || '',
      photo_url: photo_url || '',
      auth_date: Date.now()
    }
    
    await user.save()
    
    console.log(`✅ Telegram ${telegramId} подключен к пользователю ${userId}`)

    return {
      success: true,
      message: 'Telegram успешно подключен',
      user: {
        _id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        telegram: user.telegram
      }
    }

  } catch (error: any) {
    console.error('Connect Telegram error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при подключении Telegram'
    })
  }
})

