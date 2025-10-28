import { defineEventHandler } from 'h3'
import connectDB from '~/server/utils/mongodb'
import User from '~/server/models/User'
import Substation from '~/server/models/Substation'
import { Types } from 'mongoose'
import { requireAdmin } from '~/server/utils/auth'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  await connectDB()

  // 1) Агрегируем пользователей по полю substation (строка)
  const userGroups = await User.aggregate([
    {
      $match: { substation: { $exists: true, $ne: '' } }
    },
    {
      $group: { _id: '$substation', count: { $sum: 1 } }
    }
  ])

  // 2) Разделяем на варианты с ObjectId и строковые/числовые
  const byId = new Map<string, number>()
  const byText: Array<{ key: string; count: number }> = []

  for (const g of userGroups) {
    const key = String(g._id)
    const count = g.count as number
    if (Types.ObjectId.isValid(key)) {
      byId.set(key, count)
    } else {
      byText.push({ key, count })
    }
  }

  // 3) Загружаем подстанции по _id для точных совпадений
  const idList = Array.from(byId.keys()).map(id => new Types.ObjectId(id))
  const substationsById = idList.length
    ? await Substation.find({ _id: { $in: idList } }).lean()
    : []

  const items: Array<{ id: string; name: string; coords: [number, number]; count: number; avatars?: Array<{ initials: string; avatar?: string }> }> = []

  for (const s of substationsById) {
    const id = String(s._id)
    const count = byId.get(id) || 0
    const coords: [number, number] = Array.isArray((s as any).location?.coordinates)
      ? [(s as any).location.coordinates[1], (s as any).location.coordinates[0]]
      : [0, 0]
    items.push({ id, name: (s as any).name, coords, count })
  }

  // 4) Пытаемся сопоставить строковые значения (например, "32" или "Подстанция 32") по номеру в названии
  if (byText.length) {
    const allSubs = await Substation.find({}).lean()
    for (const g of byText) {
      const key = g.key.trim()
      const numMatch = key.match(/\d+/)
      let matched: any | null = null
      if (numMatch) {
        const num = numMatch[0]
        matched = allSubs.find((s: any) => typeof s.name === 'string' && s.name.match(new RegExp(`(^|\\D)${num}(\\D|$)`)))
      }
      if (!matched) {
        matched = allSubs.find((s: any) => String(s.name).toLowerCase() === key.toLowerCase())
      }
      if (matched) {
        const coords: [number, number] = Array.isArray((matched as any).location?.coordinates)
          ? [(matched as any).location.coordinates[1], (matched as any).location.coordinates[0]]
          : [0, 0]
        items.push({ id: String(matched._id), name: (matched as any).name, coords, count: g.count })
      }
    }
  }

  // 5) Объединяем дубли по id (если были и id, и текст попали в одну подстанцию)
  const merged = new Map<string, { id: string; name: string; coords: [number, number]; count: number }>()
  for (const it of items) {
    const prev = merged.get(it.id)
    if (prev) {
      prev.count += it.count
    } else {
      merged.set(it.id, { ...it })
    }
  }

  // 6) Добавляем до 5 аватаров пользователей для каждой подстанции
  const result = Array.from(merged.values())
  for (const it of result) {
    const sub = await Substation.findById(it.id).lean()
    const name = (sub as any)?.name as string | undefined
    const numMatch = name ? name.match(/\d+/) : null
    const num = numMatch ? numMatch[0] : undefined

    // Подбираем пользователей по нескольким эвристикам
    const candidates: any[] = await User.aggregate([
      {
        $match: {
          $or: [
            { substation: String(it.id) },
            ...(name ? [{ substation: name }] : []),
            ...(num ? [{ substation: { $regex: new RegExp(`(^|\\D)${num}(\\D|$)`, 'i') } }] : [])
          ]
        }
      },
      { $sample: { size: 5 } },
      { $project: { firstName: 1, lastName: 1, telegram: 1, avatarUrl: 1 } }
    ])

    const avatars = candidates.map(u => {
      const f = (u.firstName || '').trim()[0] || ''
      const l = (u.lastName || '').trim()[0] || ''
      return {
        initials: (f + l).toUpperCase() || 'U',
        avatar: u.avatarUrl || u.telegram?.photo_url,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        username: u.telegram?.username || ''
      }
    })
    it.avatars = avatars
  }

  return { success: true, items: result }
})


