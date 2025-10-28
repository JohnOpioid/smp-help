import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const query = getQuery(event)
  const page = Math.max(1, Number(query.page || 1))
  const limit = Math.max(1, Math.min(100, Number(query.limit || 15)))
  const skip = (page - 1) * limit

  const [total, items] = await Promise.all([
    User.countDocuments({}),
    User.find({}, { password: 0 }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean()
  ])

  return { success: true, items, page, limit, total }
})
