import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'Invalid id' }

  await User.findByIdAndDelete(id)
  return { success: true }
})
