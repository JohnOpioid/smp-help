import { defineEventHandler, getCookie, readBody } from 'h3'
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
    const body = await readBody(event)
    const { date, title, startTime, endTime, color } = body || {}
    if (!date || !title) return { success: false, message: 'Неверные данные' }
    const doc = await Shift.create({ userId: decoded.userId, date: new Date(date), title, startTime, endTime, color })
    return { success: true, item: doc }
  } catch (e) {
    return { success: false, message: 'Ошибка создания смены' }
  }
})


