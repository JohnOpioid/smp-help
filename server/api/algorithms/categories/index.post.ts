import { defineEventHandler, readBody } from 'h3'
import connectDB from '~/server/utils/mongodb'
import AlgorithmCategory from '~/server/models/AlgorithmCategory'

export default defineEventHandler(async (event) => {
  await connectDB()
  const body = await readBody(event)
  const { sections, name, url } = body || {}
  if (!sections || !Array.isArray(sections) || sections.length === 0 || !name) {
    return { success: false, message: 'Разделы и название обязательны' }
  }
  
  // Генерируем URL из названия, если не указан
  let finalUrl = url
  if (!finalUrl) {
    finalUrl = name
      .toLowerCase()
      .replace(/[^a-zа-я0-9\s]/g, '') // Убираем все кроме букв, цифр и пробелов
      .replace(/\s+/g, '-') // Заменяем пробелы на дефисы
      .replace(/--+/g, '-') // Убираем множественные дефисы
      .trim()
  }
  
  // Проверяем уникальность URL (теперь можно иметь одинаковые URL)
  let counter = 1
  let uniqueUrl = finalUrl
  while (await AlgorithmCategory.findOne({ url: uniqueUrl })) {
    uniqueUrl = `${finalUrl}-${counter}`
    counter++
  }
  
  const doc = await AlgorithmCategory.create({ sections, name, url: uniqueUrl })
  return { success: true, item: doc }
})


