import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const slug = getRouterParam(event, 'slug') || ''
    if (!slug) return { success: false, message: 'slug is required' }
    const body = await readBody(event)
    const doc = await ClassroomCpr.findOne({ slug })
    if (!doc) return { success: false, message: 'not found' }
    if (body?.title != null) doc.title = body.title
    if (body?.icon != null) doc.icon = body.icon
    if (body?.grid !== undefined) {
      // Сохраняем grid даже если он пустой массив
      if (Array.isArray(body.grid)) {
        (doc as any).grid = body.grid
      } else if (body.grid === null) {
        (doc as any).grid = []
      }
    }
    if (Array.isArray(body?.merges)) (doc as any).merges = body.merges
    if (typeof body?.columns === 'number') (doc as any).columns = body.columns
    if (Array.isArray(body?.rows)) doc.rows = body.rows // совместимость
    if (Array.isArray(body?.notes)) doc.notes = body.notes
    if (body?.rowStyles !== undefined) {
      // Сохраняем rowStyles даже если это пустой массив
      if (Array.isArray(body.rowStyles)) {
        (doc as any).rowStyles = body.rowStyles
      } else if (body.rowStyles === null) {
        (doc as any).rowStyles = []
      }
    }
    if (body?.columnStyles !== undefined) {
      // Сохраняем columnStyles даже если это пустой массив
      if (Array.isArray(body.columnStyles)) {
        (doc as any).columnStyles = body.columnStyles
      } else if (body.columnStyles === null) {
        (doc as any).columnStyles = []
      }
    }
    if (body?.order != null) doc.order = body.order
    await doc.save()
    const item = await ClassroomCpr.findOne({ slug }).lean()
    return { success: true, item }
  } catch (error: any) {
    console.error('Error updating classroom cpr:', error)
    return { success: false, message: error?.message || 'Internal server error' }
  }
})


