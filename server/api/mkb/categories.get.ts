import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import MKBCategory from '~/server/models/MKBCategory'
import MKB from '~/server/models/MKB'

export default defineEventHandler(async () => {
  await connectDB()

  const categories = await MKBCategory.find({}).lean()

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category: any) => {
      const mkbCount = await MKB.countDocuments({ category: category._id })
      return {
        ...category,
        name: String(category.name || '').replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim(),
        mkbCount
      }
    })
  )

  return { success: true, items: categoriesWithCounts }
})


