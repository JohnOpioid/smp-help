import { defineEventHandler, readBody, getRouterParam } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Category from '~/server/models/Category'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()
  const id = getRouterParam(event, 'id')
  const body = await readBody(event)
  const { name } = body

  if (!id) {
    return { success: false, message: 'ID категории не указан' }
  }
  if (!name) {
    return { success: false, message: 'Укажите name' }
  }

  // Генерируем URL из названия на латинице
  const url = name
    .toLowerCase()
    .replace(/[а-яё]/g, (match: string) => {
      const map: Record<string, string> = {
        'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo',
        'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
        'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
        'ф': 'f', 'х': 'h', 'ц': 'ts', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch',
        'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya'
      }
      return map[match] || match
    })
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  const updated = await Category.findByIdAndUpdate(
    id,
    { name, url },
    { new: true }
  ).lean()

  if (!updated) {
    return { success: false, message: 'Категория не найдена' }
  }

  return { success: true, item: updated }
})
