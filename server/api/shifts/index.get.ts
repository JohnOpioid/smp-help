import { defineEventHandler, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Shift from '~/server/models/Shift'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  await connectDB()
  const token = getCookie(event, 'token')
  if (!token) return { success: false, message: 'Токен не найден' }
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    const { start, end } = getQuery(event) as { start?: string; end?: string }
    const query: any = { userId: decoded.userId }
    if (start || end) query.date = {}
    if (start) query.date.$gte = new Date(start)
    if (end) query.date.$lte = new Date(end)
    const items = await Shift.find(query).sort({ date: 1 }).lean()
    return { success: true, items }
  } catch (e) {
    return { success: false, message: 'Ошибка загрузки смен' }
  }
})


