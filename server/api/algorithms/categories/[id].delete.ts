import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const res = await AlgorithmCategory.deleteOne({ _id: id })
  if (res.deletedCount === 0) return { success: false, message: 'Категория не найдена' }
  return { success: true }
})


