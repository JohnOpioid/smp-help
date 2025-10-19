import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import Substation from '~/server/models/Substation'
import Region from '~/server/models/Region'

export default defineEventHandler(async () => {
  await connectDB()
  
  // Сначала получаем подстанции
  const substations = await Substation.find({})
    .sort({ createdAt: 1 })
    .lean()
  
  // Получаем уникальные ID регионов
  const regionIds = [...new Set(substations.map((s: any) => s.region).filter(Boolean))]
  
  // Получаем регионы
  const regions = await Region.find({ _id: { $in: regionIds } })
    .select('name phones manager district')
    .lean()
  
  // Создаём Map для быстрого поиска
  const regionsMap = new Map(regions.map((r: any) => [String(r._id), r]))
  
  // Собираем данные
  const items = substations.map((substation: any) => ({
    ...substation,
    region: substation.region ? regionsMap.get(String(substation.region)) || null : null
  }))
  
  return { success: true, items }
})



