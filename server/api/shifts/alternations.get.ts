import { defineEventHandler, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import jwt from 'jsonwebtoken'
import ShiftAlternation from '~/server/models/ShiftAlternation'

export default defineEventHandler(async (event) => {
  await connectDB()
  const token = getCookie(event, 'token')
  if (!token) return { success: false, message: 'Токен не найден' }
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    const items = await ShiftAlternation.find({ userId: decoded.userId }).sort({ createdAt: -1 }).lean()
    return { success: true, items }
  } catch {
    return { success: false, message: 'Ошибка получения списка чередований' }
  }
})


