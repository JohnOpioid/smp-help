import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'
import Region from '~/server/models/Region'

export default defineEventHandler(async () => {
  await connectDB()
  
  // Явно используем Region чтобы Nuxt bundler включил его
  const _ensureRegionModel = Region
  
  const items = await Substation.find({})
    .populate('region', 'name phones manager district')
    .sort({ createdAt: 1 })
    .lean()
  return { success: true, items }
})


