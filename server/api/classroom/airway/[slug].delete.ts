import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomAirway from '~/server/models/ClassroomAirway'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const res = await ClassroomAirway.deleteOne({ slug })
  return { success: res.acknowledged, deletedCount: res.deletedCount || 0 }
})


