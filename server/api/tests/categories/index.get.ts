import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import TestCategory from '~/server/models/TestCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const items = await TestCategory.find({}).sort({ createdAt: -1 }).lean()
  return { success: true, items }
})



