import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import { sendResetPasswordEmail } from '~/server/utils/email'

export default defineEventHandler(async (event) => {
  await connectDB()

  try {
    const body = await readBody(event)
    const { email } = body || {}
    
    if (!email || !email.trim()) {
      return { success: false, message: 'Email обязателен' }
    }

    // Проверяем email на корректность
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return { success: false, message: 'Неверный формат email' }
    }

    // Находим пользователя
    const user = await User.findOne({ email: email.trim().toLowerCase() })
    
    if (!user) {
      // Все равно возвращаем успех для безопасности
      return { 
        success: true, 
        message: 'Если указанный email существует в системе, на него была отправлена ссылка для восстановления пароля' 
      }
    }

    // Генерируем простой код из 6 цифр
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString()
    
    // Сохраняем код в пользователе
    user.resetPasswordToken = resetCode
    user.resetPasswordExpires = new Date(Date.now() + 3600000) // 1 час
    await user.save()

    // Отправляем email
    const emailSent = await sendResetPasswordEmail(user.email, resetCode)
    
    if (!emailSent) {
      console.error('❌ Не удалось отправить email, код в консоли:', resetCode)
    }

    return { 
      success: true,
      message: emailSent 
        ? 'Если указанный email существует в системе, на него была отправлена ссылка для восстановления пароля'
        : 'Код отправлен (для dev-сервера проверьте консоль сервера)'
    }
  } catch (error) {
    console.error('❌ Error in forgot-password:', error)
    return { 
      success: false, 
      message: 'Произошла ошибка при обработке запроса' 
    }
  }
})
