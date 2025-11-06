import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'

export default defineEventHandler(async (event) => {
  await connectDB()
  const slug = getRouterParam(event, 'slug') || ''
  if (!slug) return { success: false, message: 'slug is required' }
  const body = await readBody(event)
  const doc = await ClassroomCpr.findOne({ slug })
  if (!doc) return { success: false, message: 'not found' }
  if (body?.title != null) doc.title = body.title
  if (Array.isArray(body?.grid)) (doc as any).grid = body.grid
  if (Array.isArray(body?.merges)) (doc as any).merges = body.merges
  if (typeof body?.columns === 'number') (doc as any).columns = body.columns
  if (Array.isArray(body?.rows)) doc.rows = body.rows // совместимость
  if (Array.isArray(body?.notes)) doc.notes = body.notes
  if (body?.order != null) doc.order = body.order
  await doc.save()
  const item = await ClassroomCpr.findOne({ slug }).lean()
  return { success: true, item }
})


