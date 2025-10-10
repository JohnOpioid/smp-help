import { defineEventHandler, getRouterParam, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  await connectDB()
  
  const token = getCookie(event, 'token')
  if (!token) {
    return { success: false, message: 'Токен не найден' }
  }

  const bookmarkId = getRouterParam(event, 'id')
  if (!bookmarkId) {
    return { success: false, message: 'ID закладки не указан' }
  }

  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string }
    const user = await User.findById(decoded.userId)
    
    if (!user) {
      return { success: false, message: 'Пользователь не найден' }
    }

    // Удаляем из массива bookmarks
    // @ts-ignore
    user.bookmarks = (user.bookmarks || []).filter((b: any) => String(b._id) !== String(bookmarkId))
    await user.save()

    return { success: true, message: 'Закладка удалена' }
  } catch (error) {
    return { success: false, message: 'Ошибка удаления закладки' }
  }
})
