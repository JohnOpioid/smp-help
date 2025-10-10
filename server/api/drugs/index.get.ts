import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'
import DrugCategory from '~/server/models/DrugCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const q = getQuery(event)
  const category = q.category as string | undefined
  const filter: any = {}
  if (category) {
    const cat = await DrugCategory.findOne({ url: category }).lean()
    if (cat) filter.categories = cat._id
  }
  const limit = Math.min(parseInt(String(q.limit || '20')) || 20, 100)
  const skip = Math.max(parseInt(String(q.skip || '0')) || 0, 0)

  const [items, total] = await Promise.all([
    Drug.find(filter)
      .populate('categories', 'name url')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Drug.countDocuments(filter)
  ])
  return { success: true, items, total }
})


