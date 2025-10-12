import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import { setCookie, createError, getMethod, readBody } from 'h3'

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
    const { email, password, firstName, lastName } = body

    // Валидация
    if (!email || !password || !firstName || !lastName) {
      throw createError({
        statusCode: 400,
        message: 'Все поля обязательны для заполнения'
      })
    }

    if (password.length < 6) {
      throw createError({
        statusCode: 400,
        message: 'Пароль должен содержать минимум 6 символов'
      })
    }

    // Проверка существования пользователя
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      throw createError({
        statusCode: 400,
        message: 'Пользователь с таким email уже существует'
      })
    }

    // Создание нового пользователя
    const user = new User({
      email,
      password,
      firstName,
      lastName
    })

    await user.save()

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
      message: 'Пользователь успешно зарегистрирован',
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
      message: 'Ошибка сервера при регистрации'
    })
  }
})
