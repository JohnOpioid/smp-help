import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { setCookie, createError, getMethod, readBody, setHeader } from 'h3'
import crypto from 'crypto'

export default defineEventHandler(async (event) => {
  // Обрабатываем preflight запросы
  if (getMethod(event) === 'OPTIONS') {
    return new Response(null, { status: 200 })
  }

  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      message: 'Method Not Allowed'
    })
  }

  try {
    await connectDB()
    
    const body = await readBody(event)
    const { id, first_name, last_name, username, photo_url } = body

    // Проверка данных
    if (!id || !first_name) {
      throw createError({
        statusCode: 400,
        message: 'Недостаточно данных для авторизации'
      })
    }

    // Генерируем уникальный email из Telegram данных
    const telegramEmail = username 
      ? `telegram_${username}@smp.local` 
      : `telegram_${id}@smp.local`

    const telegramId = String(id)
    const firstName = first_name
    const lastName = last_name || ''
    const fullName = `${firstName} ${lastName}`.trim()

    // Ищем пользователя по Telegram ID или создаем нового
    let user = await User.findOne({ 
      $or: [
        { email: telegramEmail },
        { 'telegram.id': telegramId }
      ]
    })

    if (!user) {
      // Создаем нового пользователя
      user = await User.create({
        email: telegramEmail,
        password: crypto.randomBytes(32).toString('hex'), // Генерируем случайный пароль
        firstName: firstName,
        lastName: lastName || '',
        role: 'user',
        telegram: {
          id: telegramId,
          username: username || '',
          photo_url: photo_url || ''
        }
      })
    } else {
      // Обновляем данные пользователя
      user.firstName = firstName
      user.lastName = lastName || ''
      user.telegram = {
        id: telegramId,
        username: username || '',
        photo_url: photo_url || ''
      }
      await user.save()
    }

    // Создание JWT токена
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

    // Возвращаем ответ
    return {
      success: true,
      message: 'Успешная авторизация через Telegram',
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
    console.error('Telegram login error:', error)
    return {
      success: false,
      message: error.message || 'Ошибка авторизации через Telegram'
    }
  }
})

