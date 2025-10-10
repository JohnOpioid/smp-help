import { defineEventHandler, getRouterParam, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import DrugCategory from '~/server/models/DrugCategory'
import { slugifyForUrl } from '~/server/utils/textNormalization'

export default defineEventHandler(async (event) => {
  await connectDB()
  const id = getRouterParam(event, 'id')
  if (!id) return { success: false, message: 'ID не указан' }
  const body = await readBody(event)
  const name = String(body?.name || '').trim()
  if (!name) return { success: false, message: 'Название обязательно' }
  const url = slugifyForUrl(name)
  const updated = await DrugCategory.findByIdAndUpdate(id, { name, url }, { new: true, runValidators: true })
  if (!updated) return { success: false, message: 'Категория не найдена' }
  return { success: true, item: updated }
})


