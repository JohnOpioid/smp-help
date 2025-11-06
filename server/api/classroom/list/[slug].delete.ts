import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomList from '~/server/models/ClassroomList'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const res = await ClassroomList.deleteOne({ slug })
  return { success: res.acknowledged, deletedCount: res.deletedCount || 0 }
})


