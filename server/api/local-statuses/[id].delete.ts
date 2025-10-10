import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import LocalStatusCategory from '~/server/models/LocalStatusCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  await LocalStatusCategory.findByIdAndDelete(id)
  return { success: true }
})


