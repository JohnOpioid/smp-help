import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const { sections, name, url } = body || {}
  
  // Если указан URL, проверяем его уникальность (исключая текущую категорию)
  if (url) {
    const existingCategory = await AlgorithmCategory.findOne({ url, _id: { $ne: id } })
    if (existingCategory) return { success: false, message: 'Категория с таким URL уже существует' }
  }
  
  const updated = await AlgorithmCategory.findByIdAndUpdate(id, { sections, name, url }, { new: true })
  if (!updated) return { success: false, message: 'Категория не найдена' }
  return { success: true, item: updated }
})


