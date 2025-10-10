import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatus from '~/server/models/LocalStatus'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const update: any = {}
  for (const key of ['category', 'stationCode', 'code', 'name', 'note', 'description', 'complaints', 'anamnesis', 'localis']) {
    if (body && key in body) update[key] = body[key]
  }
  const item = await LocalStatus.findByIdAndUpdate(id, update, { new: true })
  return { success: true, item }
})


