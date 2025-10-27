import { defineEventHandler, getCookie } from 'h3'
import connectDB from '~/server/utils/mongodb'
import jwt from 'jsonwebtoken'
import ShiftTemplate from '~/server/models/ShiftTemplate'

export default defineEventHandler(async (event) => {
  await connectDB()
  const token = getCookie(event, 'token')
  if (!token) return { success: false, items: [] }
  try {
    const config = useRuntimeConfig()
    const decoded = jwt.verify(token, config.jwtSecret) as { userId: string }
    const items = await ShiftTemplate.find({ userId: decoded.userId }).sort({ createdAt: -1 }).lean()
    console.log(`[GET /api/shifts/templates] User: ${decoded.userId}, Found: ${items.length} items`)
    return { success: true, items }
  } catch (e) {
    console.error('Error fetching templates:', e)
    return { success: false, items: [] }
  }
})


