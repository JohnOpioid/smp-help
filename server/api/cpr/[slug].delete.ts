import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'
import mongoose from 'mongoose'

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const orConds: any[] = [{ slug }]
  if (mongoose.Types.ObjectId.isValid(slug)) orConds.push({ _id: slug })
  orConds.push({ slug: { $regex: `^${escapeRegExp(slug)}$`, $options: 'i' } })
  const res = await ClassroomCpr.deleteOne({ $or: orConds })
  return { success: !!res?.acknowledged, deletedCount: res?.deletedCount || 0 }
})


