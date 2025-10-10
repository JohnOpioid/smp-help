import { defineEventHandler, getCookie, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import jwt from 'jsonwebtoken'
import ShiftTemplate from '~/server/models/ShiftTemplate'

export default defineEventHandler(async (event) => {
  await connectDB()
  const token = getCookie(event, 'token')
  if (!token) return { success: false, message: 'Токен не найден' }
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    const body = await readBody(event)
    const { title, startTime, endTime, color } = body || {}
    if (!startTime) return { success: false, message: 'Неверные данные' }
    const doc = await ShiftTemplate.create({ userId: decoded.userId, title, startTime, endTime, color })
    return { success: true, item: doc }
  } catch {
    return { success: false, message: 'Ошибка создания шаблона' }
  }
})


