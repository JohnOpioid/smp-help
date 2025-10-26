import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

export default defineEventHandler(async (event) => {
  await connectDB()

  try {
    const body = await readBody(event)
    const { token, password } = body || {}
    
    if (!token) {
      return { success: false, message: 'Токен отсутствует' }
    }

    if (!password || password.length < 6) {
      return { success: false, message: 'Пароль должен содержать минимум 6 символов' }
    }

    // Проверяем и декодируем токен
    const config = useRuntimeConfig()
    let decoded: any
    
    try {
      decoded = jwt.verify(token, config.jwtSecret)
    } catch (err) {
      return { success: false, message: 'Неверный или истекший токен' }
    }

    if (decoded.type !== 'password-reset') {
      return { success: false, message: 'Неверный тип токена' }
    }

    // Находим пользователя
    const user = await User.findOne({
      _id: decoded.userId
    })

    if (!user) {
      return { success: false, message: 'Пользователь не найден' }
    }

    // Проверяем, что токен совпадает с сохраненным
    if (user.resetPasswordToken !== token) {
      return { success: false, message: 'Токен недействителен' }
    }

    // Проверяем срок действия
    if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
      return { success: false, message: 'Токен истек' }
    }

    // Хешируем новый пароль
    const salt = await bcrypt.genSalt(10)
    const hashedPassword = await bcrypt.hash(password, salt)

    // Обновляем напрямую в БД, минуя pre-save hook
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetPasswordToken: undefined,
      resetPasswordExpires: undefined
    })

    return { 
      success: true, 
      message: 'Пароль успешно изменен. Перенаправление на страницу входа...' 
    }
  } catch (error) {
    console.error('❌ Error in reset-password:', error)
    return { 
      success: false, 
      message: 'Произошла ошибка при сбросе пароля' 
    }
  }
})
