import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import TestCategory from '~/server/models/TestCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = new URL(event.node.req.url || '', 'http://localhost')
  const publicOnly = url.searchParams.get('publicOnly')
  const query: any = {}
  if (publicOnly === '1') query.isPublic = true
  const items = await TestCategory.find(query).sort({ createdAt: -1 }).lean()
  return { success: true, items }
})



