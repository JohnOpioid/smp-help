import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomAirway from '~/server/models/ClassroomAirway'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const item = await ClassroomAirway.findOne({ slug }).lean()
  if (!item) return { success: false, message: 'not found' }
  return { success: true, item }
})


