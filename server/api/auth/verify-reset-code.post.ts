import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  await connectDB()

  try {
    const body = await readBody(event)
    const { email, code } = body || {}
    
    if (!email || !code) {
      return { success: false, message: 'Email и код обязательны' }
    }

    // Находим пользователя
    const user = await User.findOne({
      email: email.trim().toLowerCase(),
      resetPasswordToken: code,
      resetPasswordExpires: { $gt: new Date() }
    })

    if (!user) {
      return { success: false, message: 'Неверный код или код истек' }
    }

    // Генерируем JWT токен для сброса пароля
    const config = useRuntimeConfig()
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email,
        type: 'password-reset'
      },
      config.jwtSecret,
      { expiresIn: '1h' }
    )

    // Сохраняем JWT токен в пользователе
    user.resetPasswordToken = token
    user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 час
    await user.save()

    return { 
      success: true,
      token: token
    }
  } catch (error) {
    console.error('❌ Error in verify-reset-code:', error)
    return { 
      success: false, 
      message: 'Произошла ошибка при проверке кода' 
    }
  }
})
