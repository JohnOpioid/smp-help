import { defineEventHandler, getQuery } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Drug from '~/server/models/Drug'

export default defineEventHandler(async (event) => {
  await connectDB()
  const q = getQuery(event)
  const name = String(q.name || '').trim()
  const limit = Math.min(parseInt(String(q.limit || '10')) || 10, 50)

  if (!name) {
    return { success: true, items: [] }
  }

  // Ищем по точному совпадению имени или по синонимам; если не найдено — по регекспу
  const exact = await Drug.find({
    $or: [
      { name: name },
      { latinName: name },
      { synonyms: { $in: [name] } }
    ]
  })
    .populate('categories', 'name url')
    .limit(limit)
    .lean()

  if (exact && exact.length) {
    return { success: true, items: exact }
  }

  const re = new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
  const fuzzy = await Drug.find({
    $or: [
      { name: re },
      { latinName: re },
      { synonyms: re }
    ]
  })
    .populate('categories', 'name url')
    .limit(limit)
    .lean()

  return { success: true, items: fuzzy }
})


