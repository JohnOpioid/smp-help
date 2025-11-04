import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }

  const test = await Test.findByIdAndUpdate(id, { $unset: { suggestion: '' } }, { new: true })
    .populate('createdBy', 'firstName lastName email avatarUrl telegram')
    .populate('suggestion.createdBy', 'firstName lastName email avatarUrl telegram')
    .lean()
  return { success: true, item: test }
})


