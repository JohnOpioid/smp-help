import { defineEventHandler, getCookie, readBody } from 'h3'
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
    const body = await readBody(event)
    const { title, days } = body || {}
    if (!Array.isArray(days) || days.length !== 14) return { success: false, message: 'Неверные данные' }
    const doc = await ShiftAlternation.create({ userId: decoded.userId, title, days })
    return { success: true, item: doc }
  } catch {
    return { success: false, message: 'Ошибка создания чередования' }
  }
})


