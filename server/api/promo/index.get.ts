import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import PromoEvent from '~/server/models/PromoEvent'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const admin = await requireAdmin(event).then(() => true).catch(() => false)
  await connectDB()
  const filter: any = {}
  if (!admin) filter.published = true
  const items = await PromoEvent.find(filter).sort({ startAt: -1, createdAt: -1 }).lean()
  return { success: true, items }
})


