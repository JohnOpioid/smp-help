import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { createError, getMethod, readBody } from 'h3'
import { storeAuthCode } from '~/server/utils/telegram-auth-codes'

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
    const { id, first_name, username } = body

    if (!id || !first_name) {
      throw createError({
        statusCode: 400,
        message: 'Недостаточно данных'
      })
    }

    const telegramId = String(id)
    const firstName = first_name
    const usernameValue = username || ''
    
    // Генерируем уникальный email из Telegram данных
    const telegramEmail = usernameValue 
      ? `telegram_${usernameValue}@smp.local` 
      : `telegram_${id}@smp.local`

    // Ищем пользователя
    let user = await User.findOne({ 
      $or: [
        { email: telegramEmail },
        { 'telegram.id': telegramId }
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
          id: telegramId,
          username: usernameValue,
          photo_url: ''
        }
      })
    }

    // Генерируем 6-значный код
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Сохраняем код с таймаутом 10 минут
    storeAuthCode(telegramId, user._id.toString(), code, 600)

    console.log(`🔐 Код авторизации для пользователя ${telegramId}: ${code}`)

    return {
      success: true,
      code,
      message: 'Код отправлен в Telegram'
    }

  } catch (error: any) {
    console.error('Telegram request code error:', error)
    return {
      success: false,
      message: error.message || 'Ошибка запроса кода'
    }
  }
})

