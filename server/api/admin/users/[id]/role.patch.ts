import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const id = getRouterParam(event, 'id')
  const body = await readBody<{ role: string }>(event)
  if (!id || !body?.role) return { success: false, message: 'Invalid params' }

  await User.findByIdAndUpdate(id, { role: body.role })
  return { success: true }
})
