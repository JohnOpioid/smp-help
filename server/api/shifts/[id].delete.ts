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
    const params = event.context.params as { id?: string }
    const id = params?.id
    if (!id) return { success: false, message: 'Не указан идентификатор' }
    const res = await Shift.deleteOne({ _id: id, userId: decoded.userId })
    if (res.deletedCount === 0) return { success: false, message: 'Смена не найдена' }
    return { success: true }
  } catch (e) {
    return { success: false, message: 'Ошибка удаления смены' }
  }
})


