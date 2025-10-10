import { defineEventHandler, getCookie } from 'h3'
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
    const params = event.context.params as { id?: string }
    const id = params?.id
    if (!id) return { success: false, message: 'Не указан идентификатор' }
    const res = await ShiftTemplate.deleteOne({ _id: id, userId: decoded.userId })
    if (res.deletedCount === 0) return { success: false, message: 'Шаблон не найден' }
    return { success: true }
  } catch {
    return { success: false, message: 'Ошибка удаления шаблона' }
  }
})


