import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  await Drug.findByIdAndDelete(id)
  return { success: true }
})


