import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'

export default defineEventHandler(async () => {
  await connectDB()
  const items = await ClassroomCpr.find({}).sort({ order: 1, createdAt: 1 }).lean()
  return { success: true, items }
})


