import { defineEventHandler, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const token = getCookie(event, 'token')
  if (!token) {
    return { success: false, message: 'Токен не найден' }
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string }
    const user = await User.findById(decoded.userId).lean()
    
    if (!user) {
      return { success: false, message: 'Пользователь не найден' }
    }

    return { success: true, items: user.bookmarks || [] }
  } catch (error) {
    return { success: false, message: 'Ошибка авторизации' }
  }
})
