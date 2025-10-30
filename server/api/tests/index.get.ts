import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Test from '~/server/models/Test'

export default defineEventHandler(async (event) => {
  await connectDB()
  const url = new URL(event.node.req.url || '', 'http://localhost')
  const category = url.searchParams.get('category')

  const query: any = {}
  if (category) query.category = category

  const items = await Test.find(query).sort({ order: 1, createdAt: -1 }).lean()
  return { success: true, items }
})



