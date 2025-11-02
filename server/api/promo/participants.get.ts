import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoParticipant from '~/server/models/PromoParticipant'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const query = getQuery(event) || {}
  const eventId = query.eventId as string | undefined
  
  if (!eventId) return { success: false, message: 'eventId обязателен' }
  
  const participants = await PromoParticipant.find({ eventId })
    .populate('userId', 'firstName lastName email avatarUrl')
    .sort({ participatedAt: -1 })
    .lean()
  
  return { success: true, participants }
})

