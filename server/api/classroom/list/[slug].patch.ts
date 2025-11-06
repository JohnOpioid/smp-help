import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomList from '~/server/models/ClassroomList'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const body = await readBody(event)
  const doc = await ClassroomList.findOne({ slug })
  if (!doc) return { success: false, message: 'not found' }
  if (body?.title != null) doc.title = body.title
  if (body?.description != null) doc.description = body.description
  if (Array.isArray(body?.items)) doc.items = body.items
  if (body?.order != null) doc.order = body.order
  await doc.save()
  const item = await ClassroomList.findOne({ slug }).lean()
  return { success: true, item }
})


