import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = new URL(event.node.req.url || '', 'http://localhost')
  const category = url.searchParams.get('category')
  const includeAll = url.searchParams.get('includeAll') === '1'

  const query: any = {}
  if (category) query.category = category
  if (!includeAll) query.$or = [{ approved: true }, { approved: { $exists: false } }]

  const items = await Test.find(query)
    .sort({ order: 1, createdAt: -1 })
    .populate('createdBy', 'firstName lastName email avatarUrl telegram')
    .populate('correctedBy', 'firstName lastName email avatarUrl telegram')
    .populate('suggestion.createdBy', 'firstName lastName email avatarUrl telegram')
    .lean()
  return { success: true, items }
})



