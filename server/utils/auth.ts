import jwt from 'jsonwebtoken'
import { H3Event, createError, getCookie } from 'h3'
import User from '~/server/models/User'
import connectDB from '~/server/utils/mongodb'

export async function requireUser(event: H3Event) {
  await connectDB()
  const config = useRuntimeConfig()

  const token = getCookie(event, 'token') || (event.node.req.headers['authorization']?.toString().replace('Bearer ', '') || '')
  if (!token) {
    throw createError({ statusCode: 401, message: 'Нет токена авторизации' })
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; email: string }
    const user = await User.findById(decoded.userId).lean()
    if (!user) {
      throw createError({ statusCode: 401, message: 'Пользователь не найден' })
    }
    return user
  } catch (e) {
    throw createError({ statusCode: 401, message: 'Неверный токен' })
  }
}

export async function requireAdmin(event: H3Event) {
  const user: any = await requireUser(event)
  if (user.role !== 'admin') {
    throw createError({ statusCode: 403, message: 'Доступ только для администраторов' })
  }
  return user
}


