import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const res = await Algorithm.deleteOne({ _id: id })
  if (res.deletedCount === 0) return { success: false, message: 'Алгоритм не найден' }
  return { success: true }
})


