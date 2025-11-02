import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoProgress from '~/server/models/PromoProgress'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  await connectDB()
  const q = getQuery(event)
  const eventId = String(q.eventId || '')
  if (!eventId) return { success: false, message: 'eventId обязателен' }
  const row = await PromoProgress.findOne({ userId: user._id, eventId }).lean()
  return { success: true, progress: row || { count: 0 } }
})


