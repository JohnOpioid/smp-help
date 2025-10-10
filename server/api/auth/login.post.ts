import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { setCookie, createError, getMethod, readBody } from 'h3'

export default defineEventHandler(async (event) => {
  if (getMethod(event) !== 'POST') {
    throw createError({
      statusCode: 405,
      statusMessage: 'Method Not Allowed'
    })
  }

  try {
    await connectDB()
    
    const body = await readBody(event)
    const { email, password } = body

    // Валидация
    if (!email || !password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email и пароль обязательны'
      })
    }

    // Поиск пользователя
    const user = await User.findOne({ email })
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный email или пароль'
      })
    }

    // Проверка пароля
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Неверный email или пароль'
      })
    }

    // Создание JWT токена
    const { jwtSecret } = useRuntimeConfig()
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '7d' }
    )

    // Установим cookie с токеном для SSR и middleware
    setCookie(event, 'token', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
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
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Ошибка сервера при авторизации'
    })
  }
})
