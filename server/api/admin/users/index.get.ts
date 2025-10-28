import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const items = await User.find({}, { password: 0 }).sort({ createdAt: -1 }).lean()
  return { success: true, items }
})
