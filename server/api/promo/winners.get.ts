import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoWinner from '~/server/models/PromoWinner'

export default defineEventHandler(async (event) => {
  await connectDB()
  const query = getQuery(event) || {}
  const eventId = query.eventId as string | undefined
  
  if (!eventId) return { success: false, message: 'eventId обязателен', winners: [] }
  
  const winners = await PromoWinner.find({ eventId })
    .populate('userId', 'firstName lastName email avatarUrl')
    .populate('prizeId', 'title description imageUrl')
    .sort({ drawnAt: 1 })
    .lean()
  
  return { success: true, winners }
})


