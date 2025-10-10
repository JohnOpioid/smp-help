import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const update: any = {}
  if (body?.name) {
    update.name = body.name
    update.url = String(body.name).trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '')
  }
  const item = await LocalStatusCategory.findByIdAndUpdate(id, update, { new: true })
  return { success: true, item }
})


