import { defineEventHandler, getCookie, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import jwt from 'jsonwebtoken'
import ShiftAlternation from '~/server/models/ShiftAlternation'

export default defineEventHandler(async (event) => {
  await connectDB()
  const token = getCookie(event, 'token')
  if (!token) return { success: false, message: 'Токен не найден' }
  
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не найден' }
  
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    const body = await readBody(event)
    const { title, days } = body || {}
    
    const doc = await ShiftAlternation.findOneAndUpdate(
      { _id: id, userId: decoded.userId },
      { title, days },
      { new: true }
    )
    
    if (!doc) {
      return { success: false, message: 'Чередование не найдено' }
    }
    
    console.log(`[PATCH /api/shifts/alternations/${id}] Updated alternation for user ${decoded.userId}`)
    return { success: true, item: doc }
  } catch (e) {
    console.error('Error updating alternation:', e)
    return { success: false, message: 'Ошибка обновления чередования' }
  }
})

