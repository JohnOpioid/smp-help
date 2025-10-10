import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Algorithm from '~/server/models/Algorithm'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'
import AlgorithmSection from '~/server/models/AlgorithmSection'

export default defineEventHandler(async (event) => {
  await connectDB()
  const { page = 1, limit = 15, search = '', category, section, sortBy = 'createdAt', sortOrder = 'asc' } = getQuery(event)
  const p = Math.max(1, Number(page))
  const l = Math.max(1, Math.min(100, Number(limit)))
  const q: any = {}
  
  if (category) {
    // Если category - это URL (строка), ищем категорию по URL
    if (typeof category === 'string' && !category.match(/^[0-9a-fA-F]{24}$/)) {
      const categoryDoc = await AlgorithmCategory.findOne({ url: category }).lean()
      if (categoryDoc) {
        q.category = categoryDoc._id
      } else {
        // Если категория не найдена, возвращаем пустой результат
        return { success: true, items: [], total: 0, totalPages: 0 }
      }
    } else {
      // Если category - это ObjectId
      q.category = category
    }
  }
  
  if (section) {
    // Если section - это URL (строка), ищем раздел по URL
    if (typeof section === 'string' && !section.match(/^[0-9a-fA-F]{24}$/)) {
      // Сначала пробуем найти по URL
      let sectionDoc = await AlgorithmSection.findOne({ url: section }).lean()
      // Если не найден по URL, пробуем найти по названию
      if (!sectionDoc) {
        sectionDoc = await AlgorithmSection.findOne({ name: section }).lean()
      }
      if (sectionDoc) {
        q.section = sectionDoc._id
      } else {
        // Если раздел не найден, возвращаем пустой результат
        return { success: true, items: [], total: 0, totalPages: 0 }
      }
    } else {
      // Если section - это ObjectId
      q.section = section
    }
  }
  
  if (search) {
    const s = (search as string).trim()
    q.$or = [
      { title: { $regex: s, $options: 'i' } },
      { mkbCodes: { $elemMatch: { $regex: s, $options: 'i' } } }
    ]
  }
  
  // Определяем направление сортировки
  const sortDirection = sortOrder === 'desc' ? -1 : 1
  const sortObj: any = {}
  // Если запрошена сортировка по order — сначала order, затем createdAt как запасной ключ
  if ((sortBy as string) === 'order') {
    sortObj['order'] = sortDirection
    // Вторичный ключ для стабильности
    sortObj['createdAt'] = 1
  } else {
    sortObj[sortBy as string] = sortDirection
  }
  
  const total = await Algorithm.countDocuments(q)
  const items = await Algorithm.find(q)
    .sort(sortObj)
    .skip((p - 1) * l)
    .limit(l)
    .populate('category', 'name')
    .populate('section', 'name url')
    .lean()
  const totalPages = Math.ceil(total / l)
  return { success: true, items, total, totalPages }
})


