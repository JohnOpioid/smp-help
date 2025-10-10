import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'
import LocalStatus from '~/server/models/LocalStatus'

export default defineEventHandler(async () => {
  await connectDB()

  const categories = await LocalStatusCategory.find({}).lean()

  const categoriesWithCounts = await Promise.all(
    categories.map(async (category) => {
      const count = await LocalStatus.countDocuments({ category: category._id })
      return {
        ...category,
        name: category.name.replace(/\r\n/g, ' ').replace(/\n/g, ' ').trim(),
        count
      }
    })
  )

  return { success: true, items: categoriesWithCounts }
})



