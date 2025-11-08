import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomList from '~/server/models/ClassroomList'

export default defineEventHandler(async (event) => {
  try {
    await connectDB()
    const slug = getRouterParam(event, 'slug') || ''
    if (!slug) return { success: false, message: 'slug is required' }
    const body = await readBody(event)
    const doc = await ClassroomList.findOne({ slug })
    if (!doc) return { success: false, message: 'not found' }
    
    if (body?.title != null) doc.title = body.title
    if (body?.description != null) doc.description = body.description
    if (body?.icon != null) doc.icon = body.icon
    
    // Обработка items: очищаем от лишних полей и сохраняем только нужные
    if (Array.isArray(body?.items)) {
      doc.items = body.items.map((item: any) => {
        const cleanItem: any = {
          title: item.title || ''
        }
        // Очищаем поля от лишних свойств (_id и т.д.)
        if (Array.isArray(item.fields)) {
          cleanItem.fields = item.fields.map((field: any) => ({
            type: field.type || 'input',
            label: field.label || '',
            value: field.value || ''
          }))
        } else {
          cleanItem.fields = []
        }
        return cleanItem
      })
    }
    
    if (body?.order != null) doc.order = body.order
    await doc.save()
    const item = await ClassroomList.findOne({ slug }).lean()
    return { success: true, item }
  } catch (error: any) {
    console.error('Error updating classroom list:', error)
    return { success: false, message: error?.message || 'Internal server error' }
  }
})


