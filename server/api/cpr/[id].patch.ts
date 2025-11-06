import { defineEventHandler, readBody, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import ClassroomCpr from '~/server/models/ClassroomCpr'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'id is required' }
  const body = await readBody(event)
  await ClassroomCpr.findByIdAndUpdate(id, body, { new: true })
  return { success: true }
})


