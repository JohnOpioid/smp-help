import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import { defineEventHandler, createError } from 'h3'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  const users = await User.find({}).select('_id avatarUrl telegram firstName lastName').lean()
  let updated = 0
  for (const u of users) {
    const hasCustom = typeof u.avatarUrl === 'string' && u.avatarUrl.trim().length > 0
    const tgPhoto = (u as any)?.telegram?.photo_url
    if (!hasCustom && tgPhoto) {
      await User.findByIdAndUpdate(u._id, { $set: { avatarUrl: tgPhoto } })
      updated++
    }
  }

  return { success: true, updated }
})


