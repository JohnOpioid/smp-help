import { defineEventHandler, getCookie, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  console.log('🔍 GET /api/bookmarks called')
  await connectDB()
  
  // Проверяем query параметр userId (для бота)
  const query = getQuery(event)
  const userIdFromQuery = query.userId as string
  
  if (userIdFromQuery) {
    console.log('🔍 Using userId from query:', userIdFromQuery)
    try {
      const user = await User.findById(userIdFromQuery).lean()
      
      if (!user) {
        return { success: false, message: 'Пользователь не найден', items: [] }
      }

      console.log('🔍 User found, bookmarks count:', user.bookmarks?.length || 0)
      return { success: true, items: user.bookmarks || [] }
    } catch (error) {
      console.error('🔍 Error:', error)
      return { success: false, message: 'Ошибка получения закладок', items: [] }
    }
  }
  
  // Иначе используем токен из cookie
  const token = getCookie(event, 'token')
  console.log('🔍 Token found:', !!token)
  if (!token) {
    return { success: false, message: 'Токен не найден', items: [] }
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string }
    console.log('🔍 Decoded token:', { userId: decoded.userId, email: decoded.email })
    const user = await User.findById(decoded.userId).lean()
    
    if (!user) {
      console.log('🔍 User not found')
      return { success: false, message: 'Пользователь не найден', items: [] }
    }

    console.log('🔍 User found, bookmarks count:', user.bookmarks?.length || 0)
    return { success: true, items: user.bookmarks || [] }
  } catch (error) {
    console.error('🔍 Error in GET /api/bookmarks:', error)
    return { success: false, message: 'Ошибка авторизации', items: [] }
  }
})
