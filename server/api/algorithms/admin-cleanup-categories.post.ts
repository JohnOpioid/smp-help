import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async () => {
  await connectDB()
  const pattern = /^\d+\./
  const badCategories = await AlgorithmCategory.find({ url: { $regex: pattern } }, { _id: 1, url: 1 }).lean()
  const ids = badCategories.map((c: any) => c._id)
  if (ids.length > 0) {
    await AlgorithmCategory.deleteMany({ _id: { $in: ids } })
  }
  return { success: true, removed: badCategories.map((c:any) => c.url) }
})


