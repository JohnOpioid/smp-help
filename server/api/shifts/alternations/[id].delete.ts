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
    jwt.verify(token, config.jwtSecret)
    const id = event.context.params?.id
    if (!id) return { success: false, message: 'Некорректный id' }
    await ShiftAlternation.deleteOne({ _id: id })
    return { success: true }
  } catch {
    return { success: false, message: 'Ошибка удаления' }
  }
})


