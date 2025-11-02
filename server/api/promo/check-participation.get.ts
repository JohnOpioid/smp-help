import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoParticipant from '~/server/models/PromoParticipant'
import { requireUser } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const user: any = await requireUser(event)
  await connectDB()
  const query = getQuery(event) || {}
  const eventId = query.eventId as string | undefined
  
  if (!eventId) return { success: false, message: 'eventId обязателен', isParticipating: false }
  
  const participant = await PromoParticipant.findOne({ userId: user._id, eventId }).lean()
  
  return { 
    success: true, 
    isParticipating: !!participant,
    participant: participant || null
  }
})

