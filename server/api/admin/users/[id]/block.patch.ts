import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const id = getRouterParam(event, 'id')
  const body = await readBody<{ blocked: boolean }>(event)
  if (!id || typeof body?.blocked !== 'boolean') return { success: false, message: 'Invalid params' }

  await User.findByIdAndUpdate(id, { blocked: body.blocked })
  return { success: true }
})
