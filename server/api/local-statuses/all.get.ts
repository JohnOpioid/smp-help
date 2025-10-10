import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'
import { createNormalizedSearchConditions } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = new URL(event.node.req.url || '', 'http://localhost')
  const page = parseInt(url.searchParams.get('page') || '1') || 1
  const limit = parseInt(url.searchParams.get('limit') || '15') || 15
  const search = url.searchParams.get('search') || ''

  const skip = (page - 1) * limit

  const searchConditions = createNormalizedSearchConditions(search, [
    'stationCode',
    'code',
    'name',
    'note'
  ])

  const [items, total] = await Promise.all([
    LocalStatus.find(searchConditions).populate('category', 'name url').skip(skip).limit(limit).lean(),
    LocalStatus.countDocuments(searchConditions)
  ])

  return {
    success: true,
    items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    search
  }
})


