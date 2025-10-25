import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { setCookie, createError, getMethod, readBody, setHeader } from 'h3'

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
    console.log('🔍 Login API called')
    
    const body = await readBody(event)
    const { email, password } = body
    console.log('🔍 Login attempt for email:', email)

    // Валидация
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        message: 'Email и пароль обязательны'
      })
    }

    // Дополнительная очистка email
    const cleanEmail = email.trim().toLowerCase()

    // Поиск пользователя
    const user = await User.findOne({ email: cleanEmail })
    if (!user) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        message: 'Неверный email или пароль'
      })
    }

    // Создание JWT токена
    const { jwtSecret } = useRuntimeConfig()
    
    // Проверяем наличие JWT_SECRET
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

    // Установим cookie с токеном для SSR и middleware
    setCookie(event, 'token', token, {
      httpOnly: false, // Позволяем читать cookie на клиенте
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7 // 7 дней
    })

    return {
      success: true,
      message: 'Успешная авторизация',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    }
  } catch (error: any) {
    // Логируем ошибку для отладки
    console.error('Login error:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      message: 'Ошибка сервера при авторизации'
    })
  }
})
