import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import DrugCategory from '~/server/models/DrugCategory'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async () => {
  await connectDB()
  const categories = await DrugCategory.find({}).lean()
  const withCounts = await Promise.all(categories.map(async (c: any) => ({
    ...c,
    drugCount: await Drug.countDocuments({ category: c._id })
  })))
  return { success: true, items: withCounts }
})


