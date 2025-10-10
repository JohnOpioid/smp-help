import { defineEventHandler, getCookie, readBody } from 'h3'
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
    const user = await User.findById(decoded.userId)

    if (!user) {
      return { success: false, message: 'Пользователь не найден' }
    }

    const body = await readBody(event)
    const { type, title, description, category, url } = body || {}
    if (!type || !title) {
      return { success: false, message: 'Неверные данные' }
    }

    const bookmark = {
      type,
      title,
      description: description || '',
      category: category || '',
      url: url || '',
      createdAt: new Date()
    }

    // @ts-ignore
    user.bookmarks = user.bookmarks || []
    // @ts-ignore
    user.bookmarks.push(bookmark)
    await user.save()

    return { success: true, item: user.bookmarks[user.bookmarks.length - 1] }
  } catch (error) {
    return { success: false, message: 'Ошибка добавления закладки' }
  }
})


