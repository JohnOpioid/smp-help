import { defineEventHandler, getRouterParam } from 'h3'
import mongoose from 'mongoose'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { success: false, message: 'Некорректный ID' }
  }
  const item = await Algorithm.findById(id).populate('category', 'name section').lean()
  if (!item) return { success: false, message: 'Алгоритм не найден' }
  return { success: true, item }
})


