import { defineEventHandler, setCookie, readBody, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    
    // Получаем токен из cookie
    const token = getCookie(event, 'token')
    
    if (token) {
      // Декодируем токен чтобы получить userId
      const { jwtSecret } = useRuntimeConfig()
      try {
        const decoded = jwt.verify(token, jwtSecret) as any
        
        // Очищаем lastTelegramAuth для пользователя
        if (decoded.userId) {
          await User.findByIdAndUpdate(decoded.userId, {
            $unset: { lastTelegramAuth: 1 }
          })
          console.log('✅ lastTelegramAuth очищено для пользователя:', decoded.userId)
        }
      } catch (error) {
        console.error('❌ Ошибка декодирования токена при logout:', error)
      }
    }
    
    // Стереть JWT cookie
    setCookie(event, 'token', '', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    })
    
    return { success: true }
  } catch (error: any) {
    console.error('❌ Ошибка при logout:', error)
    return { success: false }
  }
})


