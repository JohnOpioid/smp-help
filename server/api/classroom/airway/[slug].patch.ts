import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomAirway from '~/server/models/ClassroomAirway'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const body = await readBody(event)
  const doc = await ClassroomAirway.findOne({ slug })
  if (!doc) return { success: false, message: 'not found' }
  if (body?.title != null) doc.title = body.title
  if (body?.description != null) doc.description = body.description
  if (body?.data != null) {
    doc.data = JSON.parse(JSON.stringify(body.data))
    doc.markModified('data')
    if (body.data.children) doc.markModified('data.children')
    if (body.data.adults) doc.markModified('data.adults')
  }
  if (body?.order != null) doc.order = body.order
  await doc.save()
  const item = await ClassroomAirway.findOne({ slug }).lean()
  return { success: true, item }
})


