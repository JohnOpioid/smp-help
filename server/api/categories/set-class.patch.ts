import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Category from '~/server/models/Category'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const body = await readBody(event)
  const id = String(body?.id || '')
  const classCode = String(body?.class || '').trim()

  if (!id || !classCode) {
    return { success: false, message: 'id и class обязательны' }
  }

  // Убедимся, что уникальность соблюдается: если класс уже стоит у другой категории — снимем ошибку
  const exists = await Category.findOne({ class: classCode, _id: { $ne: id } }).lean()
  if (exists) {
    return { success: false, message: `Класс ${classCode} уже назначен категории ${exists._id}` }
  }

  const updated = await Category.findByIdAndUpdate(id, { class: classCode }, { new: true })
  if (!updated) return { success: false, message: 'Категория не найдена' }
  return { success: true, item: updated }
})


