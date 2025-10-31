import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import News from '~/server/models/News'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const items = await News.find({}).sort({ date: -1, createdAt: -1 }).lean()
  return { success: true, items }
})


