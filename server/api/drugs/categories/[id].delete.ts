import { defineEventHandler, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import DrugCategory from '~/server/models/DrugCategory'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const used = await Drug.countDocuments({ category: id })
  if (used > 0) return { success: false, message: 'Нельзя удалить: есть препараты в категории' }
  await DrugCategory.findByIdAndDelete(id)
  return { success: true }
})


