import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoPrize from '~/server/models/PromoPrize'

export default defineEventHandler(async (event) => {
  await connectDB()
  const query = getQuery(event) || {}
  const eventId = query.eventId as string | undefined
  if (!eventId) return { success: false, message: 'eventId обязателен', prizes: [] }
  const prizes = await PromoPrize.find({ eventId }).sort({ order: 1 }).lean()
  return { success: true, prizes }
})

